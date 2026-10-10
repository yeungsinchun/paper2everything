#!/usr/bin/env node
/**
 * brief.mjs — one actionable concept brief per notes page.
 *
 * The audit already reports missing_concepts per item and a must-fix list per
 * bank and per section (report.mjs `completenessFor`). This entry point turns
 * one page's gaps into a ranked brief:
 *
 *   1. cluster the page's missing concepts (one model call per page)
 *   2. name the learning-objective ids the page itself declares for each concept
 *   3. rank by the audit's must-fix rule (imported from report.mjs, unchanged)
 *   4. write briefs/<page>.json and briefs/<page>.md from one computation
 *   5. leak-check both files with scripts/leak-check.mjs before writing them
 *
 * Usage:
 *   node paper2notes/scripts/brief.mjs --page book2/ch03-forces-and-newton-i/index.html
 *   node paper2notes/scripts/brief.mjs --page 25.1 --no-model --dry-run
 *
 * Options:
 *   --page <path>   page path relative to paper2notes/notes (a section id such as
 *                   25.1, 25-1 or book2/ch03 is accepted too)
 *   --results <dir> audit results dir (default <audit root>/results)
 *   --out <dir>     briefs output dir (default paper2notes/briefs)
 *   --no-model      skip the clustering call (one cluster per concept)
 *   --dry-run       render and leak-check the brief, write nothing
 *   --timeout <ms>  clustering call timeout (default 120000)
 *
 * Every item reference in a brief is `BANK#<inventory index>`. Bank item ids
 * and deck slide ids are protected ids for leak-check rule L4, so no brief
 * prints either; the results under `.audit/` keep the real ids.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { repoRoot, auditDirs, inventoryCandidates } from "./audit/paths.mjs";
import { allBanks, pagesForBank, sectionIdForPage, pageMatches } from "./audit/bank-pages.mjs";
import { loadBankItems, mustFixItems, mustFixReasons, conceptCitationCounts } from "./audit/report.mjs";
import { runPi } from "./audit/map.mjs";
import { checkBlocks, loadFingerprints, DEFAULT_FINGERPRINTS } from "./leak-check.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notesDir = path.join(repoRoot, "notes");
const MODEL = "meta/muse-spark-1.2-contributor";
const BRIEF_SCHEMA = "paper2everything.concept-brief.v1";
/** Fraction of a concept's content words that must appear in an LO for a text match. */
const LO_MATCH_MIN_COVERAGE = 1 / 3;
const ANCHOR_LIMIT = 3;
const LEAK_LEVELS = "L1 verbatim stem, L2.1 and L2.2 numeric overlap, L3 worked solution, L4 protected item id";

const STOP = new Set("the a an of and or to in is are for on with by as at from that this it be can how what which when why use using its their there also any all not no than then when".split(" "));
const contentTokens = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(t => t.length > 2 && !STOP.has(t));
const plain = (s) => String(s).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const titleOf = (html) => plain(((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ""));

// ---- page and learning objectives -------------------------------------------

/** Resolve a --page argument to the notes page and the audited bank that owns it. */
export function resolvePage(pageArg) {
  const arg = String(pageArg).replace(/^\.\//, "");
  const abs = path.resolve(notesDir, arg);
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
    for (const bank of allBanks()) {
      let pages;
      try { pages = pagesForBank(repoRoot, bank); } catch { continue; }
      const hit = pages.find(p => p === abs) || pages.find(p => pageMatches(repoRoot, bank, p, arg));
      if (hit) return { bank, page: hit, section: sectionIdForPage(bank, hit), arg };
    }
    throw new Error(`No audited bank owns ${arg}. Add its chapter to scripts/audit/books.json or pass a section id such as 25.1`);
  }
  for (const bank of allBanks()) {
    let pages;
    try { pages = pagesForBank(repoRoot, bank); } catch { continue; }
    const hit = pages.find(p => pageMatches(repoRoot, bank, p, arg));
    if (hit) return { bank, page: hit, section: sectionIdForPage(bank, hit), arg };
  }
  throw new Error(`No notes page for ${arg} (the page path is relative to paper2notes/notes/)`);
}

/**
 * Learning objectives of a page, read from the page itself: the `lo-block`
 * section id when it has one, otherwise the id named by aria-labelledby (the
 * same anchor bundle.mjs emits as `§<page>.lo #<id>`). Bullets keep their 1-based
 * position in the list. A page with no lo-block declares no learning-objective id
 * and says so instead of inventing one.
 */
export function pageLos(html) {
  const block = (String(html).match(/<section\s+class="lo-block"[\s\S]*?<\/section>/i) || [])[0] || null;
  if (!block) return { present: false, block_ids: [], anchor: null, los: [], note: "this page declares no learning-objective block, so it names no learning-objective id" };
  const own = (block.match(/<section\b[^>]*\bid="([^"]+)"/i) || [])[1] || null;
  const labelledBy = (block.match(/aria-labelledby="([^"]+)"/i) || [])[1] || null;
  const anchor = labelledBy && block.includes(`id="${labelledBy}"`) ? labelledBy : null;
  const id = own || anchor;
  const list = (block.match(/<ul[^>]*class="[^"]*\blo-list\b[^"]*"[^>]*>([\s\S]*?)<\/ul>/i) || [])[1] || block;
  const los = [];
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = liRe.exec(list)) !== null) {
    const text = plain(m[1]);
    if (text) los.push({ id, index: los.length + 1, text });
  }
  return { present: true, block_ids: id ? [id] : [], anchor, los, note: id ? null : "this lo-block names no id (no id attribute, no aria-labelledby target)" };
}

/** Learning objectives whose text covers a concept; `match: "model"` when the model chose them. */
export function matchLos(concept, lo, source = "text") {
  if (!lo.present || !lo.los.length) return { match: lo.present ? "unmatched" : "page-has-no-lo-block", los: [] };
  const tokens = contentTokens(concept);
  if (!tokens.length) return { match: "unmatched", los: [] };
  const scored = lo.los.map(candidate => ({
    candidate,
    score: tokens.filter(t => contentTokens(candidate.text).includes(t)).length / tokens.length,
  })).filter(s => s.score >= LO_MATCH_MIN_COVERAGE)
    .sort((a, b) => b.score - a.score || a.candidate.index - b.candidate.index);
  if (!scored.length) return { match: "unmatched", los: [] };
  return { match: source, los: scored.map(s => ({ ...s.candidate, coverage: Number(s.score.toFixed(2)) })) };
}

// ---- items on a page --------------------------------------------------------

/**
 * Leak-safe handle for one audit item: `BANK#<inventory index>`, the item's
 * position in its inventory file. A deck slide id or a bank item id is a
 * protected id for leak-check rule L4 (a deck slide id such as `dse-mc-2022-31`
 * is one too), so no brief prints either; `.audit/results/<bank>/<id>.json` and
 * `.audit/inventory/<bank>.json` keep the real ids.
 */
export function itemRef(item) {
  if (Number.isInteger(item.inventory_index)) return `${item.bank}#${item.inventory_index}`;
  return `${item.bank}#unmatched`;
}

/**
 * Inventory rows of one bank: the inventory beside the given results dir
 * (`<audit root>/inventory`, the same sibling layout auditDirs uses), then the
 * files report.mjs would use.
 */
function inventoryFor(bank, resultsDir) {
  const beside = path.join(path.dirname(resultsDir), "inventory", `${bank}.json`);
  return fs.existsSync(beside) ? beside : inventoryCandidates(bank).find(p => fs.existsSync(p)) || null;
}

/** Every audit item mapped to one section id (the page's section), across all banks. */
export function pageItems(resultsDir, section) {
  const rows = [];
  if (!fs.existsSync(resultsDir)) return rows;
  for (const bank of fs.readdirSync(resultsDir).filter(f => fs.statSync(path.join(resultsDir, f)).isDirectory()).sort()) {
    for (const item of loadBankItems(bank, resultsDir, inventoryFor(bank, resultsDir)).items) {
      if ((item.section || "unknown") === section) rows.push(item);
    }
  }
  return rows;
}

/** Distinct judge causes of a result, for the evidence column. */
function causes(item) {
  const out = new Set();
  for (const tier of Object.values(item.tiers || {})) {
    for (const sample of tier.samples || []) if (sample.judge && sample.judge.cause) out.add(sample.judge.cause);
  }
  return [...out].sort();
}

/** Evidence row for one item: handle plus the audit metadata a writer needs. */
function evidenceFor(item, reasons) {
  return {
    ref: itemRef(item),
    bank: item.bank,
    type: item.type || null,
    marks: item.marks ?? null,
    part: item.part || null,
    verdict: item.verdict || "unknown",
    tier_s: item.tiers?.S?.verdict || null,
    causes: causes(item),
    must_fix: reasons.length > 0,
    must_fix_reasons: reasons,
  };
}

/**
 * Group the page's missing concepts by concept string: how many items miss each
 * one and which of those items the audit's must-fix rule covers.
 */
export function collectConcepts(items) {
  const counts = conceptCitationCounts(items);
  const concepts = new Map();
  for (const item of items) {
    const reasons = mustFixReasons(item, counts);
    for (const text of new Set(item.missing_concepts || [])) {
      const entry = concepts.get(text) || { text, items: [], must_fix_items: [], must_fix_reasons: new Set() };
      entry.items.push(item);
      if (reasons.length) {
        entry.must_fix_items.push(item);
        for (const reason of reasons) entry.must_fix_reasons.add(reason);
      }
      concepts.set(text, entry);
    }
  }
  return [...concepts.values()]
    .map(c => ({
      text: c.text,
      item_count: c.items.length,
      items: c.items,
      must_fix: c.must_fix_items.length > 0,
      must_fix_reasons: [...c.must_fix_reasons].sort(),
    }))
    .sort((a, b) => b.item_count - a.item_count || a.text.localeCompare(b.text));
}

// ---- clustering -------------------------------------------------------------

function extractJsonBlock(text) {
  const fence = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch { /* try the whole text next */ } }
  try { return JSON.parse(text); } catch { return null; }
}

function piVersion() {
  try { return spawnSync(process.env.PI_BIN || "pi", ["--version"], { encoding: "utf8" }).stdout.trim() || "unknown"; } catch { return "unknown"; }
}

function readPrompt() {
  return fs.readFileSync(path.join(__dirname, "audit", "prompts", "brief.system.md"), "utf8");
}

/** The user half of the clustering call: the page, its LOs, its anchors, the concepts. */
export function clusteringPrompt({ page, section, bank, title, lo, anchors, concepts }) {
  const loLines = lo.present && lo.los.length
    ? lo.los.map(l => `${l.index}. ${l.text}`).join("\n")
    : "(this page declares no learning objectives)";
  const anchorLines = anchors.length ? anchors.map(a => `- #${a.anchor} ${a.heading}`).join("\n") : "(none)";
  return `Page: ${page} (section ${section}, parent bank ${bank}, ${title})

Learning objectives on the page (1-based, page order):
${loLines}

Idea anchors on the page:
${anchorLines}

Missing concepts reported by the audit for this page:
${concepts.map(c => `- "${c.text}" — ${c.item_count} item(s) on this page${c.must_fix ? ", must-fix" : ""}`).join("\n")}

Cluster them.`;
}

/** One cluster per concept, used by --no-model and whenever the call fails. */
export function fallbackClusters(concepts) {
  return concepts.map(c => ({ label: c.text, concepts: [c.text], lo_indices: [], note: "", source: "fallback" }));
}

/**
 * Keep only what the page supports: a cluster may name input concepts and
 * learning-objective indices, nothing else. Concepts the call left out keep
 * their own cluster so the brief never drops a gap.
 */
export function applyClusters({ concepts, lo, clusters, source = "model" }) {
  const byText = new Map(concepts.map(c => [c.text, c]));
  const seen = new Set();
  const out = [];
  const push = (raw, fallbackSource) => {
    const names = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.concepts) ? raw.concepts : []);
    const members = [];
    for (const text of names) {
      const hit = byText.get(String(text).trim());
      if (!hit || seen.has(hit.text)) continue;
      seen.add(hit.text);
      members.push(hit);
    }
    if (!members.length) return;
    const label = plain(raw && raw.label) || members[0].text;
    const indices = (Array.isArray(raw && raw.lo_indices) ? raw.lo_indices : [])
      .map(i => parseInt(i, 10))
      .filter(i => Number.isInteger(i) && lo.present && i >= 1 && i <= lo.los.length);
    out.push({ label, members, lo_indices: [...new Set(indices)], note: plain(raw && raw.note), source: (raw && raw.source) || fallbackSource });
  };
  for (const cluster of Array.isArray(clusters) ? clusters : []) push(cluster, source);
  for (const concept of concepts) if (!seen.has(concept.text)) push({ label: concept.text, concepts: [concept.text], lo_indices: [], note: "", source: "leftover" }, source);
  return out;
}

/** One model call per page: cluster labels and the LO indices each cluster blocks. */
export async function clusterWithModel({ prompt, timeoutMs }) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "brief-pi-"));
  const systemFile = path.join(tmpDir, "system.md");
  fs.writeFileSync(systemFile, readPrompt(), "utf8");
  const args = [
    "-p",
    "--model", MODEL,
    "--thinking", "high",
    "--no-tools", "--no-extensions", "--no-skills",
    "--no-context-files", "--no-prompt-templates", "--no-themes", "--no-session",
    "--mode", "text",
    "--system-prompt", systemFile,
    prompt,
  ];
  let out = "";
  try {
    const result = await runPi(process.env.PI_BIN || "pi", args, timeoutMs);
    out = `${result.stdout || ""}${result.stderr || ""}`;
  } catch (error) {
    return { ok: false, error: `pi call failed: ${String((error && error.message) || error).slice(0, 300)}`, clusters: null };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  const parsed = extractJsonBlock(out);
  if (!parsed || !Array.isArray(parsed.clusters)) return { ok: false, error: "the model returned no JSON cluster block", clusters: null };
  return { ok: true, error: null, clusters: parsed.clusters };
}

// ---- the brief --------------------------------------------------------------

/**
 * One computation, two renderings. Returns the brief object and the markdown
 * built from it, so briefs/<page>.json and briefs/<page>.md can never disagree.
 */
export function buildBrief({ page, section, bank, title, html, items, clusters, model }) {
  const lo = pageLos(html);
  const concepts = collectConcepts(items);
  const counts = conceptCitationCounts(items);
  const reasonsFor = item => mustFixReasons(item, counts);
  const mustFix = mustFixItems(items);
  const mustFixIds = new Set(mustFix.map(i => i.id));
  const anchorsFor = (memberItems) => {
    const seen = new Set();
    const cands = [];
    for (const item of memberItems) {
      for (const cand of item.pointer_candidates || []) {
        const key = `${cand.page}#${cand.anchor}`;
        if (!cand.anchor || seen.has(key)) continue;
        seen.add(key);
        cands.push({ page: cand.page, anchor: cand.anchor, heading: cand.heading, rank: cand.rank, score: cand.score });
      }
    }
    return cands.sort((a, b) => (b.score || 0) - (a.score || 0) || String(a.rank).localeCompare(String(b.rank))).slice(0, ANCHOR_LIMIT);
  };

  const grouped = clusters.map(cluster => {
    const members = cluster.members.map(concept => {
      const evidence = concept.items.map(item => evidenceFor(item, reasonsFor(item)));
      const modelLos = cluster.lo_indices
        .map(index => lo.los.find(l => l.index === index))
        .filter(Boolean);
      const loMatch = modelLos.length ? { match: "model", los: modelLos } : matchLos(concept.text, lo);
      return {
        text: concept.text,
        item_count: concept.item_count,
        must_fix: concept.must_fix,
        must_fix_reasons: concept.must_fix_reasons,
        items: evidence,
        lo_ids: loMatch.los.map(l => l.id).filter(Boolean),
        los: loMatch.los.map(({ id, index, text, coverage }) => ({ id, index, text, coverage: coverage ?? null })),
        lo_match: loMatch.match,
        lo_note: loMatch.los.length ? null
          : loMatch.match === "page-has-no-lo-block" ? lo.note
          : "no learning objective on this page matches this concept",
      };
    });
    const memberItems = [...new Set(cluster.members.flatMap(c => c.items))];
    const clusterMustFix = memberItems.filter(i => mustFixIds.has(i.id));
    const reasons = [...new Set(clusterMustFix.flatMap(reasonsFor))].sort();
    const los = [];
    for (const member of members) for (const l of member.los) if (!los.some(x => x.id === l.id && x.index === l.index)) los.push(l);
    return {
      label: cluster.label,
      source: cluster.source,
      note: cluster.note || null,
      must_fix: clusterMustFix.length > 0,
      must_fix_items: clusterMustFix.map(itemRef),
      must_fix_reasons: reasons,
      item_count: memberItems.length,
      concept_count: members.length,
      concepts: members,
      lo_ids: [...new Set(los.map(l => l.id).filter(Boolean))],
      los,
      anchors: anchorsFor(memberItems),
    };
  });

  grouped.sort((a, b) =>
    Number(b.must_fix) - Number(a.must_fix) ||
    b.item_count - a.item_count ||
    b.concept_count - a.concept_count ||
    a.label.localeCompare(b.label));
  grouped.forEach((cluster, index) => { cluster.rank = index + 1; });

  const brief = {
    schema: BRIEF_SCHEMA,
    generated_at: new Date().toISOString(),
    page,
    section,
    bank,
    item_banks: [...new Set(items.map(i => i.bank))].sort(),
    title,
    results_dir: null,
    learning_objectives: { block_ids: lo.block_ids, anchor: lo.anchor, present: lo.present, count: lo.los.length, los: lo.los, note: lo.note },
    counts: {
      items: items.length,
      must_fix_items: mustFix.length,
      concepts: concepts.length,
      clusters: grouped.length,
      must_fix_clusters: grouped.filter(c => c.must_fix).length,
    },
    model: { id: MODEL, pi: model.pi, called: model.called, cluster_source: model.cluster_source, error: model.error },
    must_fix_rule: "scripts/audit/report.mjs mustFixItems (unchanged): missing evidence, or a failing core item that is a failed DSE long question, worth 4+ marks with a known section, or misses a concept 2+ failing core items miss",
    evidence_note: "every ref is BANK#<inventory index>, the item's position in .audit/inventory/<bank>.json; bank item ids and deck slide ids are protected ids for leak-check rule L4, so no brief prints them, and .audit/results/<bank>/<id>.json keeps them",
    leak_check: { checked_by: "paper2notes/scripts/leak-check.mjs", levels: LEAK_LEVELS, result: "not-checked", findings: "pending", scope: "this JSON and the matching markdown, block by block" },
    brief: grouped,
  };
  return { brief, markdown: renderMarkdown(brief) };
}

function renderMarkdown(brief) {
  const lo = brief.learning_objectives;
  const loLine = lo.present && lo.count
    ? `${lo.block_ids.map(id => `\`${id}\``).join(", ") || "(no id)"} — ${lo.count} listed`
    : (lo.note || "none listed");
  const model = brief.model;
  const modelLine = model.called
    ? `model \`${model.id}\` (${model.cluster_source})` + (model.error ? ` — ${model.error}` : "")
    : `no call (\`--no-model\`, ${model.cluster_source})`;
  const out = [];
  out.push(`# Concept brief — ${brief.title}`);
  out.push("");
  out.push(`- Page: \`${brief.page}\` (section \`${brief.section}\`, bank \`${brief.bank}\`, items from ${brief.item_banks.map(b => `\`${b}\``).join(", ") || "no bank"})`);
  out.push(`- Items on this page: ${brief.counts.items} — must-fix ${brief.counts.must_fix_items}`);
  out.push(`- Missing concepts: ${brief.counts.concepts} in ${brief.counts.clusters} cluster(s) — must-fix clusters ${brief.counts.must_fix_clusters}`);
  out.push(`- Learning objectives on this page: ${loLine}`);
  out.push(`- Clustering: ${modelLine}`);
  out.push(`- Must-fix rule: ${brief.must_fix_rule}`);
  out.push(`- Leak check: \`scripts/leak-check.mjs\` over both files — ${brief.leak_check.result}${brief.leak_check.findings === "none" ? "" : ` (${brief.leak_check.findings})`}; scope: ${brief.leak_check.scope}`);
  out.push(`- Item refs: ${brief.evidence_note}`);
  out.push("");
  if (!brief.brief.length) {
    out.push("## No gaps");
    out.push("");
    out.push("The audit reports no missing concept on this page. Nothing to fix here.");
    out.push("");
    return out.join("\n");
  }
  for (const cluster of brief.brief) {
    const flag = cluster.must_fix ? "MUST FIX" : "should fix";
    out.push(`## ${cluster.rank}. ${flag} · ${cluster.label}`);
    out.push("");
    out.push(`- ${cluster.item_count} item(s) on this page, ${cluster.concept_count} concept(s)`);
    if (cluster.must_fix) out.push(`- Must-fix because of: ${cluster.must_fix_items.join(", ")} — ${cluster.must_fix_reasons.join("; ")}`);
    if (cluster.los.length) {
      out.push(`- Learning objectives blocked: ${cluster.los.map(l => `\`${l.id}\` LO ${l.index} "${l.text}"`).join("; ")}`);
    } else {
      const notes = [...new Set(cluster.concepts.map(c => c.lo_note).filter(Boolean))];
      out.push(`- Learning objectives blocked: none named — ${notes.join("; ") || "this page declares no learning-objective id"}`);
    }
    if (cluster.anchors.length) out.push(`- Where the page could teach it: ${cluster.anchors.map(a => `\`${a.page}#${a.anchor}\` (${a.heading}, ${a.rank})`).join("; ")}`);
    if (cluster.note) out.push(`- Note: ${cluster.note}`);
    out.push("- Missing concepts:");
    for (const concept of cluster.concepts) {
      const lines = [`  - "${concept.text}" — ${concept.item_count} item(s): ${concept.items.map(i => `${i.ref} (${i.verdict}${i.type ? `, ${i.type}` : ""}${i.marks != null ? `, ${i.marks} marks` : ""})`).join(", ")}`];
      if (concept.must_fix) lines.push(`    - must-fix: ${concept.must_fix_reasons.join("; ")}`);
      if (concept.los.length) lines.push(`    - learning objectives: ${concept.los.map(l => `\`${l.id}\` LO ${l.index} "${l.text}"`).join("; ")} (match: ${concept.lo_match})`);
      else lines.push(`    - learning objectives: ${concept.lo_note} (match: ${concept.lo_match})`);
      out.push(...lines);
    }
    out.push("");
  }
  return out.join("\n");
}

// ---- leak check -------------------------------------------------------------

/**
 * Blocks of a rendered brief, split the way leak-check reads a page: on blank
 * lines, and for JSON on every top-level key, so one key's numbers never sit in
 * the same block as another's.
 */
export function briefBlocks(text) {
  const out = [];
  for (const block of String(text).split(/\n{2,}/)) {
    for (const part of block.split(/\n(?= {2}")/)) {
      const trimmed = part.trim();
      if (trimmed) out.push(trimmed);
    }
  }
  return out;
}

/** Attach the leak verdict and render both files. */
function renderWithLeak(brief, summary) {
  const merged = { ...brief, leak_check: summary };
  return { brief: merged, json: `${JSON.stringify(merged, null, 2)}\n`, markdown: renderMarkdown(merged) };
}

/**
 * Run the existing leak rules (scripts/leak-check.mjs: same fingerprints,
 * normalisation, 8-gram, numeric-set and item-id levels) over brief text.
 * Returns findings split into errors and L2.1 warnings.
 */
export function leakCheckBrief(fp, texts) {
  const findings = [];
  let blocks = 0;
  for (const [file, text] of Object.entries(texts)) {
    const bs = briefBlocks(text);
    blocks += bs.length;
    for (const finding of checkBlocks(bs, fp)) {
      findings.push({ file, level: finding.level, item: finding.item, detail: finding.detail, severity: finding.severity });
    }
  }
  return {
    blocks,
    findings,
    errors: findings.filter(f => f.severity !== "warn"),
    warnings: findings.filter(f => f.severity === "warn"),
  };
}

function loadFingerprintsOrFail() {
  if (!fs.existsSync(DEFAULT_FINGERPRINTS)) throw new Error(`${DEFAULT_FINGERPRINTS}: leak fingerprints missing (run paper2db/scripts/leak_fingerprints.py); the brief is never written unchecked`);
  return loadFingerprints();
}

/**
 * The verdict both files carry. It holds no item id and no number on purpose: a
 * summary that printed the offending ids or its own counts would make the next
 * check flag the summary itself. Real counts go to the CLI output instead.
 */
function leakSummary(check) {
  const findings = check.errors.length || check.warnings.length;
  return {
    checked_by: "paper2notes/scripts/leak-check.mjs",
    levels: LEAK_LEVELS,
    result: check.errors.length ? "leaked" : check.warnings.length ? "clean-with-warnings" : "clean",
    findings: findings ? "see the CLI output; a leaked brief is never written" : "none",
    scope: "this JSON and the matching markdown, block by block",
  };
}

// ---- CLI --------------------------------------------------------------------

function parseArgs(argv) {
  const out = { page: null, resultsDir: null, outDir: path.join(repoRoot, "briefs"), model: true, dryRun: false, timeoutMs: 120000 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--page" && argv[i + 1]) out.page = argv[++i];
    else if (arg === "--results" && argv[i + 1]) out.resultsDir = path.resolve(argv[++i]);
    else if (arg === "--out" && argv[i + 1]) out.outDir = path.resolve(argv[++i]);
    else if (arg === "--timeout" && argv[i + 1]) out.timeoutMs = Math.max(1, parseInt(argv[++i], 10) || 1);
    else if (arg === "--no-model") out.model = false;
    else if (arg === "--dry-run") out.dryRun = true;
    else throw new Error(`brief.mjs: unknown option ${arg}`);
  }
  if (!out.page) throw new Error("brief.mjs: --page <path relative to notes/> is required, e.g. --page book2/ch03-forces-and-newton-i/index.html");
  return out;
}

/** Brief file paths for a page: briefs/<page>.json and briefs/<page>.md. */
export function briefPaths(outDir, pageArg) {
  const stem = path.join(outDir, pageArg.replace(/\.html?$/i, ""));
  return { json: `${stem}.json`, markdown: `${stem}.md` };
}

const USAGE = `Usage: node paper2notes/scripts/brief.mjs --page <page relative to notes/> [options]

  --page <path>   page path relative to paper2notes/notes, e.g.
                  book2/ch03-forces-and-newton-i/index.html (a section id such
                  as 25.1, 25-1 or book2/ch02 is accepted too)
  --results <dir> audit results dir (default <audit root>/results)
  --out <dir>     briefs output dir (default paper2notes/briefs)
  --no-model      skip the clustering call (one cluster per concept)
  --dry-run       render and leak-check the brief, write nothing
  --timeout <ms>  clustering call timeout (default 120000)
  --help          this message

Writes briefs/<page>.json and briefs/<page>.md from one computation, both
leak-checked with scripts/leak-check.mjs; a leak blocks the write.`;

export async function run(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return 0;
  }
  const opts = parseArgs(argv);
  const target = resolvePage(opts.page);
  const resultsDir = opts.resultsDir || auditDirs().results;
  const html = fs.readFileSync(target.page, "utf8");
  const items = pageItems(resultsDir, target.section);
  const pageRel = path.relative(repoRoot, target.page).split(path.sep).join("/");
  const title = titleOf(html);

  let clusters;
  let model = { pi: piVersion(), called: false, cluster_source: "fallback", error: null };
  const lo = pageLos(html);
  const concepts = collectConcepts(items);
  if (!concepts.length) {
    clusters = [];
    model.cluster_source = "no-concepts";
  } else {
    let raw = fallbackClusters(concepts);
    let clusterSource = "fallback";
    if (opts.model) {
      const anchors = [...new Map(items.flatMap(i => i.pointer_candidates || []).map(c => [`${c.page}#${c.anchor}`, c])).values()]
        .map(c => ({ anchor: c.anchor, heading: c.heading }));
      const call = await clusterWithModel({
        prompt: clusteringPrompt({ page: pageRel, section: target.section, bank: target.bank, title, lo, anchors, concepts }),
        timeoutMs: opts.timeoutMs,
      });
      model.called = true;
      model.error = call.error;
      if (call.ok) { raw = call.clusters; clusterSource = "model"; }
    }
    clusters = applyClusters({ concepts, lo, clusters: raw, source: clusterSource });
    const leftovers = clusters.filter(c => c.source === "leftover").length;
    model.cluster_source = clusters.some(c => c.source === "model") ? (leftovers ? "model-partial" : "model")
      : clusterSource === "model" ? "fallback" : clusterSource;
    if (model.cluster_source === "model-partial") model.error = `${leftovers} concept(s) the call did not name keep their own cluster`;
  }

  const built = buildBrief({ page: pageRel, section: target.section, bank: target.bank, title, html, items, clusters, model });
  built.brief.results_dir = path.relative(repoRoot, resultsDir).split(path.sep).join("/") || resultsDir;

  const fp = loadFingerprintsOrFail();
  const paths = briefPaths(opts.outDir, target.page.replace(`${notesDir}${path.sep}`, ""));
  const texts = rendered => ({ [path.basename(paths.json)]: rendered.json, [path.basename(paths.markdown)]: rendered.markdown });
  // Check the content, render the verdict into both files, then check the exact
  // bytes once more: what is written is what the last check saw.
  const content = leakCheckBrief(fp, texts(renderWithLeak(built.brief, leakSummary(leakCheckBrief(fp, {})))));
  const rendered = renderWithLeak(built.brief, leakSummary(content));
  const check = leakCheckBrief(fp, texts(rendered));
  if (check.errors.length) {
    console.error(`brief: leak-check found ${check.errors.length} protected reference(s) in the brief for ${pageRel}; nothing written.\n`);
    for (const f of check.errors) console.error(`  - ${f.file}: ${f.level} item ${f.item}: ${f.detail}`);
    console.error(`(${check.warnings.length} L2.1 numeric-overlap warning(s) also seen.)`);
    console.error("See paper2notes/scripts/leak-check.mjs for the levels. The brief is not written until it is clean.");
    return 1;
  }
  if (opts.dryRun) {
    console.log(`brief: ${pageRel} — ${built.brief.counts.clusters} cluster(s), ${built.brief.counts.must_fix_clusters} must-fix; leak-check OK (${check.blocks} blocks, ${check.warnings.length} warning(s)); dry run, nothing written`);
    process.stdout.write(rendered.markdown);
    return 0;
  }
  fs.mkdirSync(path.dirname(paths.json), { recursive: true });
  fs.writeFileSync(paths.json, rendered.json, "utf8");
  fs.writeFileSync(paths.markdown, rendered.markdown, "utf8");
  console.log(`brief written ${path.relative(repoRoot, paths.json)} and ${path.relative(repoRoot, paths.markdown)}: ${built.brief.counts.clusters} cluster(s) (${built.brief.counts.must_fix_clusters} must-fix), ${built.brief.counts.concepts} concept(s), ${built.brief.counts.items} item(s); leak-check OK (${check.blocks} blocks, ${check.warnings.length} warning(s))`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run(process.argv.slice(2)).then(code => { process.exitCode = code; })
    .catch(error => { console.error(error.message); process.exitCode = 2; });
}
