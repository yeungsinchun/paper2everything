#!/usr/bin/env node
/**
 * run.mjs — Global concurrency pool, resume, cache (plan §§4.3-4.7, 5 P2 detail)
 *
 * Features per plan:
 * - Global concurrency pool with configurable size and failure back-off
 * - Resume: reuse results only when the current input cache key matches
 * - Cache keyed by item, image, bundle, mapping, prompt, code, model, pi version, and sample count
 * - Prompts are versioned via sha256
 * - Supports --bank, --all, --dse-section <25.1|all>, --items <id,id>, --page <page>,
 *   --regress, --fixture, --concurrency
 * - Output root is .audit/ or P2E_AUDIT_ROOT; banks map in parallel
 * - Non-passing results carry pointer_candidates (DOM-id anchors in the notes)
 *
 * Never pastes QB stems into notes/ or PR (plan D3).
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { pagesForBank, cumulativePagesForBank, sectionPagesForBank, sectionIdForPage, pageMatches, allBanks } from "./bank-pages.mjs";
import { repoRoot, auditDirs, resolveImagePath, qbItemsCandidates, parseList } from "./paths.mjs";
import { loadDseSection } from "./dse.mjs";
import { mapBank, inventorySha } from "./map.mjs";
import { pointerCandidates } from "./pointers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);

function sha256Hex(s) { return crypto.createHash("sha256").update(s).digest("hex"); }
function readPromptSha(name) {
  try { return sha256Hex(fs.readFileSync(path.join(__dirname, "prompts", name), "utf8")); } catch { return "no-prompt"; }
}
function getPiVersion() {
  try { return spawnSync(process.env.PI_BIN || "pi", ["--version"], { encoding: "utf8" }).stdout.trim() || "unknown"; } catch { return "unknown"; }
}
function cacheKey(itemSha, bundleSha, promptSha, model, piVersion) {
  return sha256Hex([itemSha, bundleSha, promptSha, model, piVersion].join("|"));
}
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function parseArgs(argv) {
  const dirs = auditDirs();
  const out = {
    all: false, bank: null, fixture: null, concurrency: 8, regress: false, outDir: dirs.results,
    bundleOut: dirs.bundles,
    cacheDir: dirs.cache,
    mappingDir: dirs.mapping,
    inventoryDir: dirs.inventory,
    itemIds: null, page: null, dseSection: null,
    k: 3,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") out.all = true;
    else if (a === "--bank" && argv[i+1]) out.bank = argv[++i];
    else if (a === "--fixture" && argv[i+1]) out.fixture = path.resolve(argv[++i]);
    else if (a === "--concurrency" && argv[i+1]) out.concurrency = parseInt(argv[++i], 10);
    else if (a === "--items" && argv[i+1]) out.itemIds = parseList(argv[++i]);
    else if (a === "--page" && argv[i+1]) out.page = argv[++i];
    else if (a === "--dse-section" && argv[i+1]) out.dseSection = argv[++i];
    else if (a === "--regress") out.regress = true;
    else if (a === "--k" && argv[i+1]) out.k = parseInt(argv[++i], 10);
    else if (a === "--out" && argv[i+1]) out.outDir = path.resolve(argv[++i]);
    else if (a === "--cache-dir" && argv[i+1]) out.cacheDir = path.resolve(argv[++i]);
    else if (a === "--bundle-out" && argv[i+1]) out.bundleOut = path.resolve(argv[++i]);
  }
  return out;
}

// Simple p-limit
function pLimit(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (queue.length === 0 || active >= concurrency) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(fn).then(
      (v) => { active--; resolve(v); next(); },
      (e) => { active--; reject(e); next(); }
    );
  };
  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}

async function buildBundle(pages, outDir) {
  ensureDir(outDir);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await execFileAsync(process.execPath, [path.join(__dirname, "bundle.mjs"), ...pages, "--out", outDir], { encoding: "utf8", timeout: 390000 });
      return JSON.parse(fs.readFileSync(path.join(outDir, "manifest.json"), "utf8"));
    } catch (error) {
      if (attempt === 1) throw new Error(`Bundle failed: ${error.stderr || error.stdout || error}`);
    }
  }
}

async function buildBundleForBank(bank, bundleOut) {
  return buildBundle(cumulativePagesForBank(repoRoot, bank), path.join(bundleOut, bank));
}

function chapterPagesSha(pages) {
  return sha256Hex(pages.map(p => [path.relative(repoRoot, p), sha256Hex(fs.readFileSync(p))].join(":")).join("|"));
}

function missingConcepts(tiers) {
  return [...new Set(Object.values(tiers).flatMap(t => (t.samples || []).flatMap(sample => [
    ...(sample.answer?.missing || []).map(m => m.concept),
    ...(sample.judge?.marking || []).filter(m => m.verdict === "lost-knowledge").map(m => m.concept),
  ]).filter(Boolean)))];
}

function loadItemsForBank(bank, fixture) {
  const candidates = [];
  if (fixture) candidates.push(fixture);
  candidates.push(...qbItemsCandidates(bank));
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, "utf8"));
      return { data, file: p };
    }
  }
  throw new Error(`No item file for ${bank}`);
}

function loadBundleSha(bundleDir) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(bundleDir, "manifest.json"), "utf8"));
    return m.bundle_sha || m.notes_md?.sha256 || sha256Hex(fs.readFileSync(path.join(bundleDir, "notes.md"), "utf8"));
  } catch {
    return "no-bundle";
  }
}

async function processItem(item, bank, opts) {
  const { outDir, bundleDir, cacheDir, k, regress } = opts;
  const parentBank = item.parent_bank || bank;
  const mappingFile = path.join(opts.mappingDir, `${bank}.json`);
  const mapping = JSON.parse(fs.readFileSync(mappingFile, "utf8"));
  const mapped = mapping.mappings?.find(x => x.id === item.id);
  const pages = pagesForBank(repoRoot, parentBank);
  const sectionPages = pages.filter(p => path.basename(p) !== "summary.html");
  const chapterSha = chapterPagesSha(pages);
  const sectionForTier = mapped?.section || "unknown";
  const chosen = sectionPages.find(p => sectionIdForPage(parentBank, p) === sectionForTier);
  const sPages = mapped?.confidence >= 0.6 && chosen ? [chosen] : sectionPages;
  const summary = pages.filter(p => path.basename(p) === "summary.html");
  const sBundle = path.join(opts.bundleOut, parentBank, "S", mapped?.confidence >= 0.6 && chosen ? sectionForTier.replace(/\//g, "_") : "all");
  const sectionKey = JSON.stringify([sBundle, ...sPages, ...summary]);
  if (!opts.builtSections.has(sectionKey)) opts.builtSections.set(sectionKey, buildBundle([...sPages, ...summary], sBundle));
  await opts.builtSections.get(sectionKey);
  const bundleSha = [loadBundleSha(sBundle), loadBundleSha(bundleDir)].join(":");
  const itemSha = sha256Hex(JSON.stringify(item));
  const promptSha = sha256Hex(["solver.system.md", "solver.user.md", "judge.system.md", "prior.md", "map.system.md"].map(readPromptSha).join("|"));
  const piVersion = getPiVersion();
  const model = "meta/muse-spark-1.2-contributor";
  const imagePaths = [...(item.images?.stem || []), ...(item.images?.answer || [])].map(resolveImagePath).filter(Boolean);
  const imageSha = sha256Hex(imagePaths.map(p => { try { return sha256Hex(fs.readFileSync(p)); } catch { return "missing"; } }).join("|"));
  const mappingSha = sha256Hex(JSON.stringify(mapped || null));
  const codeSha = sha256Hex(["run.mjs", "bundle.mjs", "map.mjs", "solve.mjs", "judge.mjs", "bank-pages.mjs", "paths.mjs", "dse.mjs", "pointers.mjs", "books.json"].map(name => sha256Hex(fs.readFileSync(path.join(__dirname, name)))).join("|"));
  const key = cacheKey(itemSha, bundleSha, promptSha, model, [piVersion, mappingSha, imageSha, codeSha, chapterSha, k].join("|"));
  const cachePath = path.join(cacheDir, `${key}.json`);
  const resultPath = path.join(outDir, bank, `${item.id}.json`);
  if (!regress && fs.existsSync(resultPath)) {
    const existing = JSON.parse(fs.readFileSync(resultPath, "utf8"));
    if (existing.verdict !== "error" && existing.cache_key === key) return { id: item.id, cached: "result", result: existing };
  }
  if (!regress && fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    if (cached.verdict !== "error" && cached.cache_key === key) {
      ensureDir(path.dirname(resultPath));
      fs.writeFileSync(resultPath, JSON.stringify(cached, null, 2));
      return { id: item.id, cached: "cache", result: cached };
    }
  }

  // Call solve K times + judge each
  const solveScript = path.join(__dirname, "solve.mjs");
  const judgeScript = path.join(__dirname, "judge.mjs");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-item-"));
  const tiers = { S: { samples: [] }, B: { samples: [] } };
  try {
    const tmpItem = path.join(tmpDir, "item.json");
    fs.writeFileSync(tmpItem, JSON.stringify(item), "utf8");

    for (const tier of ["S", "B"]) {
      const tierBundle = tier === "S" ? sBundle : bundleDir;
      for (let sample = 0; sample < k; sample++) {
        // Solve
        const solveOut = path.join(tmpDir, `solve-${tier}-${sample}.json`);
        const solveArgs = ["node", solveScript, "--item", tmpItem, "--bundle", tierBundle, "--out", solveOut, "--sample", String(sample)];
        let sRes;
        try { await execFileAsync(process.execPath, solveArgs.slice(1), { cwd: repoRoot, encoding: "utf8", timeout: 180000, maxBuffer: 20 * 1024 * 1024, env: process.env }); sRes = { status: 0 }; }
        catch (error) { sRes = { status: error.code || 1, error, stderr: error.stderr }; }
        let solveData;
        try { solveData = JSON.parse(fs.readFileSync(solveOut, "utf8")); } catch {}
        if (sRes.status !== 0 || solveData?.error || solveData?.solver?._fallback || !solveData) {
          const error = [sRes.error && String(sRes.error), sRes.status !== 0 && `solve exited ${sRes.status}`, solveData?.error, solveData?.raw, sRes.stderr].filter(Boolean).join("; ").slice(0, 4000);
          tiers[tier].samples.push({ error: error || "solve produced no result", judge: { cause: "execution-error" } });
          try { fs.unlinkSync(solveOut); } catch {}
          continue;
        }
        // Judge
        const judgeOut = path.join(tmpDir, `judge-${tier}-${sample}.json`);
        const judgeArgs = ["node", judgeScript, "--solve", solveOut, "--item", tmpItem, "--bundle", tierBundle, "--out", judgeOut];
        let judgeError;
        try { await execFileAsync(process.execPath, judgeArgs.slice(1), { cwd: repoRoot, encoding: "utf8", timeout: 180000, maxBuffer: 20 * 1024 * 1024, env: process.env }); }
        catch (error) { judgeError = error; }
        try {
          const judgeData = JSON.parse(fs.readFileSync(judgeOut, "utf8"));
          if (judgeError || judgeData.error || judgeData.judge?.cause === "unjudged") throw new Error(String(judgeError?.stderr || judgeError || judgeData.error || "judge returned unjudged"));
          tiers[tier].samples.push({ answer: solveData.solver || solveData, judge: judgeData.judge || judgeData, quote_check: judgeData.quote_check, leakage: judgeData.leakage });
          // cleanup tmp solve/judge
          try { fs.unlinkSync(solveOut); } catch {}
          try { fs.unlinkSync(judgeOut); } catch {}
        } catch (e) {
          tiers[tier].samples.push({ error: String(e), judge: { cause: "execution-error" } });
        }
      }
      // Verdict per tier: need ≥2 of 3 samples satisfying condition (plan §4.7)
      // For K=3 need 2, for K=1 need 1, general ceil(K*2/3).
      const need = Math.max(1, Math.ceil(tiers[tier].samples.length * 2 / 3));
      const passCount = tiers[tier].samples.filter(s => {
        const j = s.judge || {};
        return j.cause === "ok" && s.quote_check?.passed === true && !j.step_judgements?.some(step => step.verdict !== "supported") && (item.type === "mc" ? j.mc_correct === true : Array.isArray(j.marking) && j.marking.length > 0 && j.marking.every(point => point.verdict === "earned"));
      }).length;
      tiers[tier].verdict = passCount >= need ? "pass" : (tiers[tier].samples.some(s => s.judge.cause === "execution-error") ? "error" : tiers[tier].samples.some(s => s.judge.cause === "knowledge-gap") ? "gap" : "fail");
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // Determine overall verdict per plan §4.7
  // pass / pass-leaked / cross-ref / gap / reasoning / defect
  let verdict = "gap";
  const leaked = tiers.S.samples.some(s => s.leakage?.leaked) || tiers.B.samples.some(s => s.leakage?.leaked);
  const isDefect = tiers.S.samples.some(s => s.judge.cause === "item-defect" || s.judge.cause === "key-defect");
  if (tiers.S.verdict === "error" || tiers.B.verdict === "error") verdict = "error";
  else if (isDefect) verdict = "defect";
  else if (tiers.S.verdict === "pass") verdict = leaked ? "pass-leaked" : "pass";
  else if (tiers.B.verdict === "pass" && tiers.S.verdict !== "pass") verdict = "cross-ref";
  else if (tiers.S.samples.some(s => s.judge.cause === "knowledge-gap") || tiers.B.samples.some(s => s.judge.cause === "knowledge-gap")) verdict = "gap";
  else verdict = "reasoning";

  const pointer_candidates = verdict === "pass" ? [] : pointerCandidates({ repoRoot, bank: parentBank, sectionPages, mapped, concepts: missingConcepts(tiers) });
  const result = {
    id: item.id,
    bank,
    ...(parentBank !== bank ? { parent_bank: parentBank } : {}),
    section: sectionForTier || "unknown",
    mapping_conf: mapped?.confidence ?? 0,
    notes_ref: { repo: "paper2notes", sha: (() => { try { return spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim(); } catch { return "unknown"; } })() },
    tier_bundle_sha: { S: loadBundleSha(sBundle), B: loadBundleSha(bundleDir) },
    run: { pi: piVersion, model, solver_thinking: "high", judge_thinking: "max", prompt_sha: promptSha, at: new Date().toISOString() },
    tiers,
    verdict,
    leaked,
    pointer_candidates,
    chapter_pages_sha: chapterSha,
    bundle_sha: bundleSha,
    prompt_sha: promptSha,
    pi_version: piVersion,
    cache_key: key,
  };
  // Write cache and result
  ensureDir(path.dirname(resultPath));
  ensureDir(cacheDir);
  if (verdict !== "error") fs.writeFileSync(cachePath, JSON.stringify(result, null, 2), "utf8");
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf8");
  return { id: item.id, cached: false, result };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.fixture && (opts.all || opts.dseSection)) throw new Error("--fixture requires one --bank");
  for (const d of [opts.outDir, opts.cacheDir, opts.bundleOut, opts.mappingDir]) ensureDir(d);

  // Targets: { bank, parentBank, items }
  const targets = [];
  if (opts.dseSection) {
    ensureDir(opts.inventoryDir);
    for (const d of loadDseSection(repoRoot, opts.dseSection)) {
      if (d.missing.length) console.warn(`DSE ${d.bank}: ${d.missing.length} deck slide image(s) missing — items marked missing_evidence and counted by coverage`);
      fs.writeFileSync(path.join(opts.inventoryDir, `${d.bank}.json`), JSON.stringify({ bank: d.bank, items: d.items }, null, 2), "utf8");
      targets.push({ bank: d.bank, parentBank: d.parent_bank, items: d.items });
    }
    if (!targets.length) throw new Error(`No DSE deck items for section ${opts.dseSection}`);
  }
  if (opts.all || opts.bank || !opts.dseSection) {
    const qbBanks = opts.all ? allBanks() : [opts.bank || "QB_501"];
    for (const bank of qbBanks) {
      const { data } = loadItemsForBank(bank, opts.fixture);
      targets.push({ bank, parentBank: bank, items: data.items || [] });
    }
  }

  // Validate --items against the full inventory; narrowing to the selected ids
  // happens after mapping so the mapping file keeps every item of the bank.
  if (opts.itemIds) {
    const known = new Set(targets.flatMap(t => t.items.map(i => i.id)));
    const unknown = opts.itemIds.filter(id => !known.has(id));
    if (unknown.length) throw new Error(`Unknown item id(s): ${unknown.join(", ")}`);
  }
  const banks = targets.map(t => t.bank);
  console.log(`Run harness: banks=${banks.join(",")} concurrency=${opts.concurrency} k=${opts.k} regress=${opts.regress}`);
  console.log(`PI_BIN=${process.env.PI_BIN || "pi"} pi=${getPiVersion()} model=meta/muse-spark-1.2-contributor`);

  // Build bundles once per parent bank
  for (const parent of new Set(targets.map(t => t.parentBank))) await buildBundleForBank(parent, opts.bundleOut);

  // Build mappings: one pool bounds the pi calls of every bank and every bank
  // keeps its full inventory in the file; select only controls which mappings
  // are re-made. Bank coroutines do no pi calls themselves, so they run
  // directly instead of consuming pool slots.
  const mapLimit = pLimit(Math.max(1, opts.concurrency));
  await Promise.all(targets.map(async t => {
    console.log(`Mapping ${t.bank}...`);
    try {
      await mapBank({
        bank: t.bank, parentBank: t.parentBank, itemsList: t.items,
        inventorySha: inventorySha(t.items),
        select: { ids: opts.itemIds, page: opts.page },
        outDir: opts.mappingDir, bundleDir: path.join(opts.bundleOut, t.parentBank),
        force: opts.regress, limit: mapLimit,
      });
    } catch (e) { throw new Error(`map ${t.bank} failed: ${String(e.message || e).slice(0, 500)}`); }
  }));

  // --items / --page narrow what is solved, after mapping.
  if (opts.itemIds || opts.page) {
    for (const t of targets) {
      if (opts.itemIds) t.items = t.items.filter(i => opts.itemIds.includes(i.id));
      if (opts.page) {
        const mapping = JSON.parse(fs.readFileSync(path.join(opts.mappingDir, `${t.bank}.json`), "utf8"));
        const sectionPages = sectionPagesForBank(repoRoot, t.parentBank);
        const pagesById = new Map(sectionPages.map(pg => [sectionIdForPage(t.parentBank, pg), pg]));
        t.items = t.items.filter(item => {
          const m = mapping.mappings.find(x => x.id === item.id);
          const pg = m?.section && pagesById.get(m.section);
          return pg && pageMatches(repoRoot, t.parentBank, pg, opts.page);
        });
      }
    }
  }

  // Process items with global concurrency pool
  const limit = pLimit(opts.concurrency);
  let total = 0;
  let completed = 0;
  let failed = 0;
  opts.builtSections = new Map();
  const start = Date.now();
  const backoff = { failures: 0 };

  const pending = [];
  for (const { bank, parentBank, items } of targets) {
    total += items.length;
    const bundleDir = path.join(opts.bundleOut, parentBank);
    const promises = items.map(item => limit(async () => {
      if (backoff.failures > 5) {
        console.log("Backing off due to failures...");
        await new Promise(r => setTimeout(r, 5000));
        backoff.failures = 0;
      }
      try {
        if (item.missing_evidence) {
          console.warn(`Skipping ${item.id}: DSE deck evidence missing (stem image not found); coverage reports it as must-fix`);
          completed++;
          return null;
        }
        const res = await processItem(item, bank, { ...opts, bundleDir });
        completed++;
        if (res.result.verdict === "error") failed++;
        if (completed % 10 === 0 || completed === total) {
          const elapsed = ((Date.now() - start) / 1000).toFixed(1);
          console.log(`Progress ${completed}/${total} (${((completed/total)*100).toFixed(1)}%) elapsed ${elapsed}s`);
        }
        return res;
      } catch (e) {
        failed++;
        backoff.failures++;
        console.error(`Item ${item.id} failed: ${e.message}`);
        const defectPath = path.join(opts.outDir, bank, `${item.id}.json`);
        ensureDir(path.dirname(defectPath));
        fs.writeFileSync(defectPath, JSON.stringify({ id: item.id, bank, verdict: "error", error: String(e) }, null, 2), "utf8");
        return null;
      }
    }));
    pending.push(...promises);
  }
  await Promise.all(pending);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Done: ${completed}/${total} in ${elapsed}s, concurrency ${opts.concurrency}`);
  console.log(`Results: ${opts.outDir}`);
  console.log(`Cache: ${opts.cacheDir} (keyed by item sha + bundle sha + prompt sha + model + pi version)`);
  if (failed || completed !== total) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1); });
}
