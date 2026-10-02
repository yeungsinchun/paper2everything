#!/usr/bin/env node
/**
 * map.mjs — Item → section mapping (plan §4.4)
 *
 * One Muse call per item, --no-tools, thinking high.
 * Inputs: item crop + text, section titles + LO bullets, idea headings.
 * Returns {section, confidence, secondary[]}
 *
 * Each item is mapped by pi to a section page in its bank's chapter.
 * Items with confidence < 0.6 get tier S = all sections of the chapter.
 *
 * Items are mapped in parallel (--concurrency, default 4). DSE deck items
 * (--dse-section) need no model call: the deck page is the section.
 * --items <id,id> and --page <page> restrict which items are (re)mapped;
 * previously mapped items with a matching inputs_sha are kept in the file.
 *
 * Output: <P2E_AUDIT_ROOT or .audit>/mapping/<bank>.json
 *
 * Uses PI_BIN env for pi binary (fake pi in tests).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sectionPagesForBank, sectionIdForPage, pageMatches, allBanks } from "./bank-pages.mjs";
import { repoRoot, auditDirs, resolveImagePath, qbItemsCandidates, parseList } from "./paths.mjs";
import { loadDseSection, isDseBank } from "./dse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function pLimit(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (!queue.length || active >= concurrency) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(fn).then(v => { active--; resolve(v); next(); }, e => { active--; reject(e); next(); });
  };
  return fn => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
}

function readPrompt(p) {
  return fs.readFileSync(path.join(__dirname, "prompts", p), "utf8");
}
function parseArgs(argv) {
  const out = { itemIds: null, page: null, bank: null, all: false, dseSection: null, outDir: auditDirs().mapping, bundleDir: null, fixture: null, force: false, concurrency: 4 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--items" && argv[i + 1]) out.itemIds = parseList(argv[++i]);
    else if (a === "--page" && argv[i + 1]) out.page = argv[++i];
    else if (a === "--bank" && argv[i + 1]) out.bank = argv[++i];
    else if (a === "--all") out.all = true;
    else if (a === "--dse-section" && argv[i + 1]) out.dseSection = argv[++i];
    else if (a === "--out" && argv[i + 1]) out.outDir = path.resolve(argv[++i]);
    else if (a === "--bundle" && argv[i + 1]) out.bundleDir = path.resolve(argv[++i]);
    else if (a === "--fixture" && argv[i + 1]) out.fixture = path.resolve(argv[++i]);
    else if (a === "--concurrency" && argv[i + 1]) out.concurrency = Math.max(1, parseInt(argv[++i], 10) || 1);
    else if (a === "--force") out.force = true;
  }
  return out;
}

function extractJsonBlock(text) {
  const fence = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fence) {
    try { return JSON.parse(fence[1]); } catch {}
  }
  // try whole text
  try { return JSON.parse(text); } catch {}
  return null;
}

function collectSectionInfo(bank, pages) {
  // pages: list of html paths for a chapter
  const infos = [];
  for (const p of pages) {
    const html = fs.readFileSync(p, "utf8");
    const titleM = html.match(/<title>([^<]+)<\/title>/i);
    const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const loM = html.match(/<section\s+class="lo-block"[\s\S]*?<ul class="lo-list">([\s\S]*?)<\/ul>/i);
    let los = [];
    if (loM) {
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let m;
      while ((m = liRe.exec(loM[1])) !== null) los.push(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    }
    const ideaHeads = [];
    const ideaRe = /<section\s+class="idea"[^>]*>[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/gi;
    let im;
    while ((im = ideaRe.exec(html)) !== null) ideaHeads.push(im[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    const base = sectionIdForPage(bank, p);
    infos.push({ section: base, title: titleM ? titleM[1].trim() : base, h1: h1M ? h1M[1].replace(/<[^>]+>/g, " ").trim() : "", los, ideas: ideaHeads, path: p });
  }
  return infos;
}

async function callPi(item, sectionInfos, bundleNotes) {
  const piBin = process.env.PI_BIN || "pi";
  const model = "meta/muse-spark-1.2-contributor";
  const systemPrompt = readPrompt("map.system.md");

  const userContent = `Item ${item.id} (${item.bank} ${item.type} ${item.marks} marks):
Text: ${item.stem ? item.stem.text.slice(0, 3000) : JSON.stringify(item).slice(0, 3000)}

Section candidates for this chapter:
${sectionInfos.map((s) => `- ${s.section}: ${s.title} | LOs: ${s.los.join(" | ").slice(0, 800)} | Ideas: ${s.ideas.join(" | ").slice(0, 800)}`).join("\n")}

Bundle excerpt (first 8000 chars):
${bundleNotes ? bundleNotes.slice(0, 8000) : "(no bundle)"}
`;

  // Build temp prompt file to avoid shell quoting issues
  const tmpDir = fs.mkdtempSync(path.join("/tmp", "map-pi-"));
  const promptFile = path.join(tmpDir, "prompt.txt");
  fs.writeFileSync(promptFile, userContent, "utf8");
  const systemFile = path.join(tmpDir, "system.txt");
  fs.writeFileSync(systemFile, systemPrompt, "utf8");

  // Prepare attachments: item crop if exists
  const args = [
    "-p",
    "--model", model,
    "--thinking", "high",
    "--no-tools", "--no-extensions", "--no-skills",
    "--no-context-files", "--no-prompt-templates", "--no-themes", "--no-session",
    "--mode", "text",
    "--system-prompt", systemFile,
  ];
  // Attach bundle notes if exists
  // We pass the user prompt as positional arg with @file handling not needed; just inline
  // Use PI_BIN with prompt file content
  const itemImage = item.images && item.images.stem && item.images.stem[0] ? resolveImagePath(item.images.stem[0]) : null;
  if (itemImage && fs.existsSync(itemImage)) {
    args.push("@" + itemImage);
  }
  // We add prompt as last arg
  // To support both file and string, we pass the prompt content directly
  args.push(fs.readFileSync(promptFile, "utf8"));

  // Execute pi with stdin disconnected: pi blocks forever when its stdin is a
  // pipe (execFile deadlocks on the real binary and on any stdin-reading
  // shim), so spawn with stdin ignored and collect the output streams.
  let result;
  try { result = await runPi(piBin, args); }
  catch (error) { result = { stdout: "", stderr: String((error && error.message) || error) }; }
  fs.rmSync(tmpDir, { recursive: true, force: true });
  const out = (result.stdout || "") + (result.stderr || "");
  const parsed = extractJsonBlock(out);
  if (parsed && parsed.section) return parsed;

  return { section: null, confidence: 0, secondary: [], _raw: out.slice(0, 500) };
}

/**
 * Run pi and collect stdout/stderr. stdin is ignored: pi never exits when its
 * stdin is a pipe, so execFile (which hands the child a pipe stdin and waits
 * for it to close) hung on the real binary; spawn resolves on process close.
 * Kills the child after 120s like the previous sync invocation did.
 */
export function runPi(piBin, args, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const child = spawn(piBin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", d => { stdout += d; });
    child.stderr.on("data", d => { stderr += d; });
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("error", e => { clearTimeout(timer); reject(e); });
    child.on("close", () => { clearTimeout(timer); resolve({ stdout, stderr }); });
  });
}

function piVersionOf() {
  try { return spawnSync(process.env.PI_BIN || "pi", ["--version"], { encoding: "utf8" }).stdout.trim(); } catch { return "unknown"; }
}

/** One shared inventory hash so run.mjs and standalone map persist the same inputs_sha. */
export function inventorySha(items) {
  return crypto.createHash("sha256").update(JSON.stringify(items)).digest("hex");
}

/**
 * Map the items of one bank. `itemsList` is the full inventory and the file
 * always keeps one entry per item; `select` ({ ids, page }) only controls
 * which existing mappings are re-made this call (items without a stored
 * mapping are still mapped). QB banks use pi; DSE deck banks map to their own
 * section page. `limit` is the p-limit shared by all banks of this entry point.
 */
export async function mapBank({ bank, parentBank = bank, itemsList, inventorySha, select = {}, outDir, bundleDir, force = false, limit }) {
  fs.mkdirSync(outDir, { recursive: true });
  const sectionPages = sectionPagesForBank(repoRoot, parentBank);
  const sectionInfos = collectSectionInfo(parentBank, sectionPages);
  const dse = isDseBank(bank);

  let bundleNotes = "";
  const possibleBundle = bundleDir ? path.join(bundleDir, "notes.md") : path.join(auditDirs().bundles, bank, "notes.md");
  if (!dse && fs.existsSync(possibleBundle)) bundleNotes = fs.readFileSync(possibleBundle, "utf8");

  const outFile = path.join(outDir, `${bank}.json`);
  const piVersion = dse ? "n/a" : piVersionOf();
  const hash = crypto.createHash("sha256");
  for (const part of [inventorySha, readPrompt("map.system.md"), fs.readFileSync(fileURLToPath(import.meta.url)), piVersion, bundleNotes.replace(/^(Generated|Notes ref): .*$/gm, ""), ...sectionPages.flatMap(p => [path.relative(repoRoot, p), fs.readFileSync(p)])]) hash.update(part).update("\0");
  const inputsSha = hash.digest("hex");

  const previous = new Map();
  if (fs.existsSync(outFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outFile, "utf8"));
      if (existing.inputs_sha === inputsSha) for (const m of existing.mappings || []) if (m.method === "pi" || m.method === "deck") previous.set(m.id, m);
    } catch {}
  }

  const selected = item => {
    if (select.ids && !select.ids.includes(item.id)) return false;
    if (!select.page) return true;
    if (dse) {
      const deckPage = item.dse?.page ? path.resolve(repoRoot, item.dse.page) : null;
      return !!deckPage && pageMatches(repoRoot, parentBank, deckPage, select.page);
    }
    // QB items: derive the page from the stored mapping; unmapped items are selectable
    if (!previous.has(item.id)) return true;
    const prevSec = previous.get(item.id)?.section;
    if (!prevSec) return true;
    const pg = sectionPages.find(p => sectionIdForPage(parentBank, p) === prevSec);
    return !!pg && pageMatches(repoRoot, parentBank, pg, select.page);
  };
  const pool = limit || pLimit(8);
  let reused = 0;
  const mappings = (await Promise.all(itemsList.map(item => pool(async () => {
    const prev = previous.get(item.id);
    if (prev && (!force || !selected(item))) { reused++; return prev; }
    if (dse) return { id: item.id, section: item.dse.section, confidence: 1, secondary: [], method: "deck" };
    const res = await callPi(item, sectionInfos, bundleNotes);
    const valid = sectionInfos.some(info => info.section === res.section);
    return { id: item.id, section: valid ? res.section : null, confidence: valid ? (res.confidence ?? 0) : 0, secondary: res.secondary || [], raw: res._raw ? res._raw.slice(0, 200) : undefined, method: valid ? "pi" : "unmapped" };
  }))));

  const payload = {
    bank,
    generated_at: new Date().toISOString(),
    inputs_sha: inputsSha,
    tool_versions: { pi: piVersion },
    section_pages: sectionPages.map(p => path.relative(repoRoot, p)),
    mappings,
  };
  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");
  console.log(`Mapping written ${outFile} (${mappings.length} items, ${reused} reused)`);
  return payload;
}

function loadItemFile(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return { data, list: data.items || (Array.isArray(data) ? data : []) };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const select = { ids: opts.itemIds, page: opts.page };
  const jobs = [];
  if (opts.dseSection) {
    for (const d of loadDseSection(repoRoot, opts.dseSection)) jobs.push({ bank: d.bank, parentBank: d.parent_bank, itemsList: d.items, inventorySha: inventorySha(d.items) });
  } else {
    let files = [];
    if (opts.all || opts.bank) {
      for (const bank of opts.all ? allBanks() : [opts.bank]) {
        const candidates = qbItemsCandidates(bank);
        if (opts.fixture) candidates.unshift(opts.fixture);
        const found = candidates.find(p => fs.existsSync(p));
        if (!found) { console.error(`No item file for bank ${bank}. Tried: ${candidates.join(", ")}`); continue; }
        files.push({ bank, file: found });
      }
    } else if (opts.fixture) files = [{ bank: null, file: opts.fixture }];
    else {
      const dir = path.join(__dirname, "fixtures");
      files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).map(f => ({ bank: null, file: path.join(dir, f) }));
    }
    for (const { bank, file } of files) {
      const { data, list } = loadItemFile(file);
      const bankName = bank || data.bank || path.basename(file, ".json");
      if (data.bank && data.bank !== bankName) throw new Error(`Item bank ${data.bank} does not match ${bankName}`);
      jobs.push({ bank: bankName, itemsList: list, inventorySha: inventorySha(list) });
    }
  }
  if (!jobs.length) throw new Error("No item files found");
  // One pool bounds all banks together; each bank reuses it.
  const limit = pLimit(opts.concurrency);
  await Promise.all(jobs.map(job => mapBank({ ...job, select, outDir: opts.outDir, bundleDir: opts.bundleDir, force: opts.force, limit })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1); });
}
