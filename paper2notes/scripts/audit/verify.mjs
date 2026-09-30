/**
 * verify.mjs — `audit verify`: consistency check of local audit artefacts.
 *
 * Errors (exit 1):
 *  - result JSON unreadable, id/filename mismatch, unknown bank, unknown section
 *  - pointer_candidates whose page or anchor is not a real DOM id
 *  - a bundle that still contains a DSE deck, or cites an anchor that is not a DOM id
 *  - a mapping whose sections are not pages of its bank
 * Warnings (errors with --strict): results whose chapter pages changed since the run (stale).
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { repoRoot, auditDirs, parseList } from "./paths.mjs";
import { allBanks, pagesForBank, sectionPagesForBank, sectionIdForPage } from "./bank-pages.mjs";
import { domIds } from "./pointers.mjs";

const VERDICTS = new Set(["pass", "pass-leaked", "cross-ref", "gap", "reasoning", "defect", "error"]);
const sha = s => crypto.createHash("sha256").update(s).digest("hex");

function parseArgs(argv) {
  const dirs = auditDirs();
  const out = { results: dirs.results, bundles: dirs.bundles, mapping: dirs.mapping, strict: false, json: false, bank: null, itemIds: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--results" && argv[i + 1]) out.results = path.resolve(argv[++i]);
    else if (a === "--bundles" && argv[i + 1]) out.bundles = path.resolve(argv[++i]);
    else if (a === "--mapping" && argv[i + 1]) out.mapping = path.resolve(argv[++i]);
    else if (a === "--bank" && argv[i + 1]) out.bank = argv[++i];
    else if (a === "--items" && argv[i + 1]) out.itemIds = parseList(argv[++i]);
    else if (a === "--strict") out.strict = true;
    else if (a === "--json") out.json = true;
    else throw new Error(`Unknown option ${a}`);
  }
  return out;
}

function parentOf(bank) {
  if (allBanks().includes(bank)) return bank;
  // DSE_<section>: the bank whose chapter holds that page
  const section = bank.replace(/^DSE_/, "");
  if (bank === section) return null;
  return allBanks().find(b => { try { return sectionPagesForBank(repoRoot, b).some(p => sectionIdForPage(b, p) === section); } catch { return false; } }) || null;
}

const listJson = dir => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".json")) : []);
const subdirs = dir => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory()) : []);

export function verify(opts) {
  const errors = [];
  const warnings = [];
  const err = (where, msg) => errors.push({ where, msg });
  const warn = (where, msg) => warnings.push({ where, msg });
  const counts = { results: 0, mappings: 0, bundles: 0, pointers: 0 };
  const pageCache = new Map();
  const page = rel => {
    const abs = path.resolve(repoRoot, rel);
    if (!pageCache.has(abs)) pageCache.set(abs, fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null);
    return pageCache.get(abs);
  };

  for (const bank of subdirs(opts.results)) {
    if (opts.bank && opts.bank !== bank) continue;
    const parent = parentOf(bank);
    if (!parent) { err(bank, "unknown bank"); continue; }
    let sections, chapterSha;
    try {
      const pages = pagesForBank(repoRoot, parent);
      sections = new Set(sectionPagesForBank(repoRoot, parent).map(p => sectionIdForPage(parent, p)));
      chapterSha = sha(pages.map(p => [path.relative(repoRoot, p), sha(fs.readFileSync(p))].join(":")).join("|"));
    } catch (e) { err(bank, `notes pages unavailable: ${e.message}`); continue; }
    for (const f of listJson(path.join(opts.results, bank))) {
      const where = `${bank}/${f}`;
      let r;
      try { r = JSON.parse(fs.readFileSync(path.join(opts.results, bank, f), "utf8")); } catch { err(where, "unreadable JSON"); continue; }
      if (opts.itemIds && !opts.itemIds.includes(r.id)) continue;
      counts.results++;
      if (r.id !== path.basename(f, ".json")) err(where, `id ${r.id} does not match filename`);
      if (!VERDICTS.has(r.verdict)) err(where, `unknown verdict ${r.verdict}`);
      if (r.verdict === "error") continue;
      if (r.bank !== bank) err(where, `bank field ${r.bank} != directory`);
      if (r.section !== "unknown" && !sections.has(r.section)) err(where, `section ${r.section} is not a page of ${parent}`);
      if (!Array.isArray(r.pointer_candidates)) err(where, "missing pointer_candidates");
      else {
        if (r.verdict === "pass" && r.pointer_candidates.length) err(where, "passing result has pointer_candidates");
        for (const c of r.pointer_candidates) {
          counts.pointers++;
          const html = page(c.page || "");
          if (html === null) err(where, `pointer page missing: ${c.page}`);
          else if (!domIds(html).has(c.anchor)) err(where, `pointer anchor #${c.anchor} is not a DOM id in ${c.page}`);
        }
      }
      if (r.chapter_pages_sha && r.chapter_pages_sha !== chapterSha) warn(where, "stale: chapter pages changed since this result");
      else if (!r.chapter_pages_sha) warn(where, "no chapter_pages_sha (result predates verify)");
    }
  }

  for (const f of listJson(opts.mapping)) {
    const bank = path.basename(f, ".json");
    if (opts.bank && opts.bank !== bank) continue;
    counts.mappings++;
    const parent = parentOf(bank);
    if (!parent) { err(`mapping/${f}`, "unknown bank"); continue; }
    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(opts.mapping, f), "utf8")); } catch { err(`mapping/${f}`, "unreadable JSON"); continue; }
    const sections = new Set(sectionPagesForBank(repoRoot, parent).map(p => sectionIdForPage(parent, p)));
    for (const m of data.mappings || []) {
      if (opts.itemIds && !opts.itemIds.includes(m.id)) continue;
      if (m.section && !sections.has(m.section)) err(`mapping/${f}`, `${m.id}: section ${m.section} is not a page of ${parent}`);
      for (const sec of m.secondary || []) if (!sections.has(sec)) warn(`mapping/${f}`, `${m.id}: secondary ${sec} is not a page of ${parent}`);
    }
  }

  const bundleDirs = [];
  const walk = dir => {
    if (fs.existsSync(path.join(dir, "manifest.json"))) bundleDirs.push(dir);
    for (const d of subdirs(dir)) walk(path.join(dir, d));
  };
  if (fs.existsSync(opts.bundles)) walk(opts.bundles);
  for (const dir of bundleDirs) {
    const where = `bundle/${path.relative(opts.bundles, dir)}`;
    counts.bundles++;
    let manifest, notes;
    try { manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json"), "utf8")); notes = fs.readFileSync(path.join(dir, "notes.md"), "utf8"); } catch { err(where, "manifest.json/notes.md unreadable"); continue; }
    if (manifest.includes_dse !== false) err(where, "bundle predates DSE-deck stripping (includes_dse is not false)");
    if (/DSE past-paper decks|_DSE deck:/.test(notes)) err(where, "notes.md still contains a DSE deck");
    const ids = new Set();
    for (const p of manifest.pages || []) { const html = page(p.input); if (html) for (const id of domIds(html)) ids.add(id); else err(where, `page missing: ${p.input}`); }
    for (const line of notes.split("\n")) {
      const h = line.match(/^#{2,4}\s+\[[^\]]*#([^\]\s]+)\]/);
      if (h && h[1] !== "lo" && h[1] !== "dse" && !ids.has(h[1])) err(where, `anchor #${h[1]} is not a DOM id of the bundled pages`);
    }
  }
  return { errors, warnings, counts };
}

export function main(argv) {
  const opts = parseArgs(argv);
  const res = verify(opts);
  if (opts.json) console.log(JSON.stringify(res, null, 2));
  else {
    for (const e of res.errors) console.error(`ERROR ${e.where}: ${e.msg}`);
    for (const w of res.warnings) console.warn(`warn  ${w.where}: ${w.msg}`);
    console.log(`verify: ${res.counts.results} results, ${res.counts.mappings} mappings, ${res.counts.bundles} bundles, ${res.counts.pointers} pointers — ${res.errors.length} error(s), ${res.warnings.length} warning(s)`);
  }
  return res.errors.length || (opts.strict && res.warnings.length) ? 1 : 0;
}
