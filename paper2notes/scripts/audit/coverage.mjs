#!/usr/bin/env node
/** Corpus-wide coverage. No model calls, publication, mapping writes, or fixture fallback. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enumerateCorpus, sha256, inside, jsonSha } from "./corpus.mjs";
import { checkAuditResult } from "./evidence.mjs";
import { monoRepoRoot, auditRoot as defaultAuditRoot } from "./paths.mjs";
import { sectionIdForPath } from "./bank-pages.mjs";

const digest = s => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);
const nonempty = s => typeof s === "string" && s.trim().length > 0;
const countBy = (rows, key) => Object.fromEntries([...new Set(rows.map(key))].sort().map(k => [k, rows.filter(r => key(r) === k).length]));
export const pointerIdentity = q => q.corpus === "qb" ? q.id : `dse-${q.id.replace(":", "-")}`;

/** A deliberately strict fallback. Production uses the shared notes-text extractor when available. */
export function anchoredText(html, anchor) {
  const tags = [...html.matchAll(/<\/?([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)];
  const hits = tags.filter(t => !t[0].startsWith("</") && (t[0].match(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)')/i) || []).slice(1).includes(anchor));
  if (hits.length !== 1) throw new Error(hits.length ? "duplicate-anchor" : "missing-anchor");
  const start = hits[0];
  let depth = 0, end = null;
  for (const tag of tags.filter(t => t.index >= start.index)) {
    if (tag[1].toLowerCase() !== start[1].toLowerCase()) continue;
    depth += tag[0].startsWith("</") ? -1 : 1;
    if (depth === 0) { end = tag.index + tag[0].length; break; }
  }
  if (end === null) throw new Error("unclosed-anchor");
  const block = html.slice(start.index, end);
  if (/\b(?:section-dse|quiz-slide)\b/.test(start[0])) throw new Error("question-deck-anchor");
  // Do not guess text when entities or UI controls need a browser-equivalent parser.
  if (/&(?:#\d+|#x[\da-f]+|[a-z]+);|<(?:button|script|style|input|select|textarea)\b|class=["'][^"']*(?:section-dse|quiz-slide)/i.test(block)) throw new Error("shared-extractor-required");
  return block.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function validatePassage(p, { root, extractText = anchoredText }) {
  const out = (state, reason) => ({ state, reason, page: p?.page ?? null, anchor: p?.anchor ?? null });
  if (!p || typeof p !== "object" || !nonempty(p.anchor) || !digest(p.text_sha256) || !nonempty(p.source) || !["verified", "derived", "inferred"].includes(p.tier) || !Array.isArray(p.highlights) || !p.highlights.length) return out("malformed", "invalid-passage");
  if (typeof p.page !== "string" || !/^book\d+\/.+\.html$/.test(p.page) || p.page.split("/").some(s => ["..", ".", "_local", "_source"].includes(s))) return out("malformed", "unsafe-page");
  const file = inside(path.join(root, "paper2notes/notes"), p.page);
  if (!file) return out("malformed", "unsafe-page");
  if (!fs.existsSync(file)) return out("missing-source", "page-unavailable");
  let text;
  try { text = extractText(fs.readFileSync(file, "utf8"), p.anchor); }
  catch (e) { return out(e.message === "shared-extractor-required" ? "unverified" : "malformed", e.message); }
  if (sha256(text) !== p.text_sha256) return out("stale", "passage-text-changed");
  for (const h of p.highlights) {
    if (!h || !Number.isInteger(h.start) || !Number.isInteger(h.end) || h.start < 0 || h.end <= h.start || h.end > text.length || !nonempty(h.quote)) return out("malformed", "invalid-highlight-range");
    if (text.slice(h.start, h.end) !== h.quote) return out("stale", "highlight-quote-changed");
  }
  return { ...out("checked", "text-and-ranges-match"), tier: p.tier, text_sha256: p.text_sha256,
    highlights: p.highlights.map(h => ({ start: h.start, end: h.end, quote_sha256: sha256(h.quote) })), source: p.source };
}

export function buildCoverage({ root = monoRepoRoot, auditRoot = defaultAuditRoot(), extractText = anchoredText } = {}) {
  const corpus = enumerateCorpus({ root });
  const issues = [...corpus.issues], inputs = [...corpus.inputs];
  const read = (file, required = false) => {
    const rel = path.relative(root, file);
    if (!fs.existsSync(file)) {
      if (required) issues.push({ state: "missing-source", file: rel, code: "missing-input" });
      return null;
    }
    try {
      const bytes = fs.readFileSync(file);
      inputs.push({ path: rel, state: "available", sha256: sha256(bytes) });
      return JSON.parse(bytes);
    } catch { issues.push({ state: "malformed", file: rel, code: "invalid-json" }); return { _malformed: true }; }
  };
  const pointerFile = path.join(root, "paper2db/metadata/pointers/notes.json");
  const pointers = read(pointerFile, true);
  const byId = new Map();
  if (pointers && (pointers.schema !== "paper2db.notes-pointer.v1" || !Array.isArray(pointers.items))) issues.push({ state: "malformed", file: path.relative(root, pointerFile), code: "invalid-notes-store" });
  for (const item of Array.isArray(pointers?.items) ? pointers.items : []) {
    const key = `${item.corpus}:${item.item_id}`;
    if (!["qb", "dse"].includes(item.corpus) || !nonempty(item.item_id) || !Array.isArray(item.passages) || !item.passages.length) issues.push({ state: "malformed", file: path.relative(root, pointerFile), code: `invalid-pointer-record:${key}` });
    if (byId.has(key)) byId.set(key, { _malformed: true });
    else byId.set(key, item);
  }
  const known = new Set(corpus.questions.map(q => `${q.corpus}:${pointerIdentity(q)}`));
  for (const key of byId.keys()) if (!known.has(key)) issues.push({ state: "malformed", file: path.relative(root, pointerFile), code: `unknown-pointer-id:${key}` });
  const mappingCache = new Map();
  const pageBySection = new Map(corpus.pages.map(p => [sectionIdForPath(p), p]));
  const items = corpus.questions.map(q => {
    const record = byId.get(`${q.corpus}:${pointerIdentity(q)}`);
    const passages = record?._malformed ? [{ state: "malformed", reason: "duplicate-pointer-identity" }] :
      (record?.passages || []).map(p => validatePassage(p, { root, extractText }));
    const mappingState = record?._malformed || (record && (!Array.isArray(record.passages) || !record.passages.length)) ? "malformed" :
      passages.some(p => p.state !== "checked") ? passages.find(p => p.state !== "checked").state : passages.length ? "mapped" : "unmapped";
    const contexts = [], associations = [];
    for (const ctx of q.contexts) {
      if (ctx.page) associations.push({ kind: "deck", section: ctx.section, page: ctx.page, state: "associated-not-verified" });
      if (!nonempty(ctx.bank) || !nonempty(ctx.id) || /[\\/]/.test(ctx.bank) || /[\\/]/.test(ctx.id)) continue;
      if (!mappingCache.has(ctx.bank)) mappingCache.set(ctx.bank, read(path.join(auditRoot, "mapping", `${ctx.bank}.json`)));
      const mapping = mappingCache.get(ctx.bank);
      if (mapping && (!Array.isArray(mapping.mappings) || mapping.bank !== ctx.bank)) associations.push({ kind: "audit-map", state: "malformed" });
      const mapped = mapping?.mappings?.find(m => m.id === ctx.id);
      for (const section of mapped ? [mapped.section, ...(mapped.secondary || [])].filter(Boolean) : []) associations.push({ kind: "audit-map", section,
        state: pageBySection.has(section) ? "associated-not-verified" : "malformed", ...(pageBySection.has(section) ? { page: path.relative(path.join(root, "paper2notes"), pageBySection.get(section)) } : {}) });
      const file = path.join(auditRoot, "results", ctx.bank, `${ctx.id}.json`);
      const result = read(file);
      if (result) {
        let checked;
        try { checked = checkAuditResult(result, { question: q, context: ctx, root, auditRoot }); }
        catch { checked = { state: "malformed", reason: "invalid-audit-evidence" }; }
        contexts.push({ bank: ctx.bank, id: ctx.id, file: path.relative(root, file), ...checked });
      }
    }
    const checked = contexts.filter(c => c.state === "checked");
    // Conflicting recorded verdicts cannot become a single confident assessment.
    const assessment = [...new Set(checked.map(c => c.assessment))];
    const conceptual = !contexts.length ? { state: "missing-model-evidence", reason: "no-audit-result" } :
      assessment.length > 1 ? { state: "unverified", reason: "conflicting-context-assessments" } :
      contexts.some(c => c.state !== "checked") ? { state: contexts.find(c => c.state !== "checked").state, reason: "incomplete-context-evidence" } :
      { state: "checked", assessment: assessment[0] };
    // A verified tier is an assertion. Only an exact, traceable citation supports correspondence.
    const correspondence = passages.length && passages.every(p => p.state === "checked" && p.tier === "verified" && checked.some(c =>
      (p.source === c.file || p.source === `audit:${c.bank}/${c.id}`) && c.citations?.some(cite => {
        const [prefix, anchor] = cite.source.slice(6).split("#");
        const section = sectionIdForPath(`notes/${p.page}`);
        return anchor === p.anchor && (prefix === section || prefix.startsWith(section + ".")) &&
          p.highlights.some(h => h.quote_sha256 === sha256(cite.quote || ""));
      }))) ? "checked" : "unverified";
    const evidence = q.evidence.map(e => ({ ...e, state: inside(root, e.path) && fs.existsSync(path.join(root, e.path)) ? "available" : "missing-source" }));
    return { corpus: q.corpus, id: q.id, pointer_id: pointerIdentity(q), bank: q.bank, type: q.type,
      aliases: q.aliases, occurrences: q.occurrences, question_evidence: { state: evidence.some(e => e.state === "available") ? "available" : "missing-source", files: evidence },
      mapping: { state: mappingState, correspondence, passages }, section_associations: associations,
      conceptual, audits: contexts.map(({ citations, ...c }) => c) };
  });
  const summary = rows => ({ total: rows.length, mapping: countBy(rows, r => r.mapping.state), correspondence: countBy(rows, r => r.mapping.correspondence),
    conceptual: countBy(rows, r => r.conceptual.state), assessments: countBy(rows.filter(r => r.conceptual.state === "checked"), r => r.conceptual.assessment),
    question_evidence: countBy(rows, r => r.question_evidence.state) });
  const uniqueInputs = [...new Map(inputs.map(i => [i.path, i])).values()].sort((a, b) => a.path.localeCompare(b.path));
  return { schema: "paper2notes.corpus-coverage.v1", inputs: uniqueInputs, inputs_sha256: jsonSha(uniqueInputs), origins: corpus.origins,
    issues, enumeration_complete: !issues.some(i => ["missing-source", "malformed", "unverified"].includes(i.state) && i.file !== "paper2db/metadata/pointers/notes.json"),
    complete: items.length > 0 && issues.length === 0 && items.every(i => i.mapping.correspondence === "checked" && i.conceptual.state === "checked"),
    summary: { overall: summary(items), qb: summary(items.filter(i => i.corpus === "qb")), dse: summary(items.filter(i => i.corpus === "dse")) }, items };
}

export function main(argv) {
  let root = monoRepoRoot, auditRoot = defaultAuditRoot(), output = null, strict = false;
  for (let i = 0; i < argv.length; i++) {
    if (["--root", "--audit-root", "--out"].includes(argv[i]) && argv[i + 1]) {
      const flag = argv[i++], value = path.resolve(argv[i]);
      if (flag === "--root") root = value;
      if (flag === "--audit-root") auditRoot = value;
      if (flag === "--out") output = value;
    } else if (argv[i] === "--strict") strict = true;
    else throw new Error(`Unknown or incomplete option ${argv[i]}`);
  }
  const report = buildCoverage({ root, auditRoot });
  output ||= path.join(auditRoot, "corpus-coverage.json");
  if (output.startsWith(path.join(root, "paper2notes/notes") + path.sep)) throw new Error("Coverage evidence must not be written into published notes");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ output: path.relative(root, output), enumeration_complete: report.enumeration_complete, complete: report.complete, summary: report.summary, issues: report.issues.length }, null, 2));
  return strict && !report.complete ? 1 : report.issues.some(i => i.state === "malformed") ? 2 : 0;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try { process.exitCode = main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exitCode = 2; }
}
