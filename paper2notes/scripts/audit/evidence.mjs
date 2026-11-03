/** Provenance for existing audit results. This module never invokes a model. */
import fs from "node:fs";
import path from "node:path";
import { jsonSha, sha256, inside } from "./corpus.mjs";
import { deterministicQuoteCheck } from "./judge.mjs";
import { pagesForBank } from "./bank-pages.mjs";

export function captureEvidence(item, { root, resolveImage }) {
  const images = [...(item.images?.stem || []), ...(item.images?.answer || [])].map(input => {
    const file = resolveImage(input);
    const rel = file ? path.relative(root, file) : null;
    if (!rel || !inside(root, rel) || !fs.existsSync(file)) return { input, state: "missing-source" };
    return { input, path: rel, sha256: sha256(fs.readFileSync(file)), state: "available" };
  });
  return { schema: "paper2notes.audit-evidence.v1", item_sha256: jsonSha(item), images };
}
const string = v => typeof v === "string" && v.trim().length > 0;
const digest = v => /^[a-f0-9]{64}$/.test(v || "");
export function chapterSha(notesRoot, bank) {
  const pages = pagesForBank(notesRoot, bank);
  return sha256(pages.map(p => [path.relative(notesRoot, p), sha256(fs.readFileSync(p))].join(":")).join("|"));
}

/** Checked means reproducible recorded model evidence, not independent proof of teaching quality. */
export function checkAuditResult(result, { question, context, root, auditRoot }) {
  const notesRoot = path.join(root, "paper2notes");
  const outcome = (state, reason, extra = {}) => ({ state, reason, ...extra });
  if (!result || typeof result !== "object" || result.id !== context.id || result.bank !== context.bank) return outcome("malformed", "identity-mismatch");
  if (result.verdict === "error") return outcome("missing-model-evidence", "execution-error");
  if (!["pass", "pass-leaked", "cross-ref", "gap", "reasoning", "defect"].includes(result.verdict)) return outcome("malformed", "unknown-verdict");
  if (!result.evidence) return outcome("unverified", "legacy-result-without-source-provenance");
  if (result.evidence.schema !== "paper2notes.audit-evidence.v1" || !digest(result.evidence.item_sha256) || !Array.isArray(result.evidence.images)) return outcome("malformed", "invalid-source-provenance");
  const auditedItem = question.audit_inputs.find(item => jsonSha(item) === result.evidence.item_sha256);
  if (!auditedItem) return outcome("stale", "question-source-changed");
  const expectedImages = [...(auditedItem.images?.stem || []), ...(auditedItem.images?.answer || [])];
  if (result.evidence.images.length !== expectedImages.length || result.evidence.images.some((image, i) => image.input !== expectedImages[i])) return outcome("malformed", "incomplete-image-provenance");
  let mapping;
  try { mapping = JSON.parse(fs.readFileSync(path.join(auditRoot, "mapping", `${context.bank}.json`))).mappings.find(m => m.id === context.id); }
  catch { return outcome("missing-source", "audit-mapping-unavailable"); }
  if (!mapping || jsonSha(mapping) !== result.evidence.mapping_sha256) return outcome("stale", "audit-mapping-changed");
  for (const image of result.evidence.images) {
    const file = inside(root, image.path);
    if (image.state !== "available" || !file || !fs.existsSync(file)) return outcome("missing-source", "audit-image-unavailable");
    if (sha256(fs.readFileSync(file)) !== image.sha256) return outcome("stale", "audit-image-changed");
  }
  if (!string(result.run?.model) || !string(result.run?.pi) || !digest(result.run?.prompt_sha) || !string(result.run?.at)) return outcome("missing-model-evidence", "missing-run-provenance");
  try {
    if (chapterSha(notesRoot, result.parent_bank || context.bank) !== result.chapter_pages_sha) return outcome("stale", "notes-source-changed");
  } catch { return outcome("missing-source", "notes-chapter-unavailable"); }
  const missing = [], citations = [];
  for (const tier of ["S", "B"]) {
    const samples = result.tiers?.[tier]?.samples;
    if (!Array.isArray(samples) || samples.length === 0) return outcome("missing-model-evidence", "missing-tier-samples");
    const bundleDir = tier === "B" ? path.join(auditRoot, "bundles", result.parent_bank || context.bank) :
      path.join(auditRoot, "bundles", result.parent_bank || context.bank, "S", result.mapping_conf >= 0.6 && result.section !== "unknown" ? result.section.replace(/\//g, "_") : "all");
    let manifest, notes;
    try { manifest = JSON.parse(fs.readFileSync(path.join(bundleDir, "manifest.json"))); notes = fs.readFileSync(path.join(bundleDir, "notes.md"), "utf8"); }
    catch { return outcome("missing-source", "audit-bundle-unavailable"); }
    if (manifest.includes_dse !== false || sha256(notes) !== manifest.notes_md?.sha256 || manifest.bundle_sha !== result.tier_bundle_sha?.[tier]) return outcome("stale", "audit-bundle-changed");
    if (!Array.isArray(manifest.pages) || !manifest.pages.length || !Array.isArray(manifest.figures)) return outcome("malformed", "bundle-inputs-missing");
    const figures = [];
    for (const figure of manifest.figures) {
      const abs = inside(bundleDir, figure.file);
      if (!abs || !fs.existsSync(abs)) return outcome("missing-source", "bundle-figure-unavailable");
      figures.push([figure.file, sha256(fs.readFileSync(abs))]);
    }
    if (sha256(manifest.notes_md.sha256 + JSON.stringify(figures)) !== manifest.bundle_sha) return outcome("stale", "bundle-content-changed");
    for (const page of manifest.pages) {
      const abs = inside(notesRoot, page.input);
      if (!abs || !fs.existsSync(abs)) return outcome("missing-source", "bundle-page-unavailable");
      if (sha256(fs.readFileSync(abs)) !== page.sha256) return outcome("stale", "bundle-page-changed");
    }
    for (let index = 0; index < samples.length; index++) {
      const sample = samples[index];
      if (sample.error || ["execution-error", "unjudged"].includes(sample.judge?.cause)) return outcome("missing-model-evidence", "failed-model-sample");
      const solver = sample.provenance?.solver, judge = sample.provenance?.judge;
      if (!string(solver?.model) || !string(judge?.model) || !string(solver?.pi) || !string(judge?.pi) ||
          !string(solver?.at) || !string(judge?.at) || !digest(solver.prompt_sha) || !digest(judge.prompt_sha) ||
          solver.item_sha !== result.evidence.item_sha256 || judge.item_sha !== result.evidence.item_sha256 ||
          solver.bundle_sha !== manifest.bundle_sha || judge.bundle_sha !== manifest.bundle_sha) return outcome("missing-model-evidence", "sample-provenance-missing");
      if (!sample.answer || !Array.isArray(sample.answer.steps) || !sample.judge || !["ok", "knowledge-gap", "reasoning-error", "item-defect", "key-defect"].includes(sample.judge.cause)) return outcome("malformed", "invalid-sample");
      // Recompute citation validity. A stored quote_check.passed alone is not evidence.
      if (deterministicQuoteCheck(sample.answer, notes).length) return outcome("unverified", "unsupported-citation");
      for (let step = 0; step < sample.answer.steps.length; step++) {
        const citation = sample.answer.steps[step];
        if (citation.source?.startsWith("notes:")) citations.push({ tier, sample: index, step, source: citation.source, quote: citation.quote });
      }
      for (let point = 0; point < (sample.judge.marking || []).length; point++) {
        const m = sample.judge.marking[point];
        if (m.verdict === "lost-knowledge" && string(m.concept)) missing.push({ tier, sample: index, point, concept_sha256: sha256(m.concept) });
      }
      for (const [point, m] of (sample.answer.missing || []).entries()) if (string(m.concept)) missing.push({ tier, sample: index, point, concept_sha256: sha256(m.concept), origin: "solver" });
    }
  }
  if (["pass", "cross-ref"].includes(result.verdict)) {
    const tier = result.verdict === "pass" ? "S" : "B";
    const samples = result.tiers[tier].samples;
    const passing = samples.filter(s => s.judge.cause === "ok" && s.quote_check?.passed === true &&
      !s.judge.step_judgements?.some(step => step.verdict !== "supported") &&
      (question.type === "mc" ? s.judge.mc_correct === true : Array.isArray(s.judge.marking) && s.judge.marking.length > 0 && s.judge.marking.every(m => m.verdict === "earned")));
    if (passing.length < Math.ceil(samples.length * 2 / 3) || !citations.some(c => c.tier === tier)) return outcome("unverified", "pass-without-supported-teaching-evidence");
  }
  if (result.verdict === "gap" && (!missing.length || !Object.values(result.tiers).some(t => t.samples.some(s => s.judge.cause === "knowledge-gap")))) return outcome("unverified", "gap-without-recorded-concept");
  return outcome("checked", "recorded-model-evidence", { assessment: result.verdict === "gap" ? "insufficient" : result.verdict === "pass" ? "covered" : result.verdict, missing_concepts: missing, citations });
}
