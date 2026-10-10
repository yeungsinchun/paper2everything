#!/usr/bin/env node
/* Cross-check the shipped DSE decks against paper2db's answer store.
 *
   Two classes of defect reach a student as a silent wrong answer, and neither
   is visible to quiz-audit.mjs, which only asks "does this slide have a key?":
 *
     1. dse-slide-image-missing
        A .quiz-slide[id^="dse-"] whose <img src> points at a file that is not
        in the published tree. The browser reports img.complete with
        naturalWidth 0, so the student sees a broken image where the question
        should be.
        Chapter pages reference crops as ../_local/dse/<kind>/<section>/<file>.
        notes/_local/ is gitignored and the Cloud Run image fills it at build
        time (deploy/cloudrun/Dockerfile copies notes/dse/* into _local/dse),
        so the tracked file that must exist is the notes/dse/ one. This check
        resolves the src through that same mapping.

     2. dse-mc-key-not-in-store / dse-mc-key-unsupported /
        dse-mc-key-disagrees-with-store
        A QUIZ_KEYS entry that paper2db/qb-web-ui-staging/dse-mc/index.json
        does not back: no record, answer.missing = true, answer.option null, or
        an option/percentage that differs from the store. The store is derived
        from paper2db/paper/ans/<year>ans.pdf, so the page must follow it and
        never the other way round. A slide with no key says "Answer key not
        available for this paper.", which is the honest state.

   Wired into quiz-audit.mjs, so one command covers all of it:
     node paper2notes/scripts/quiz-audit.mjs
   Runnable on its own for just these two rules:
     node paper2notes/scripts/quiz-store-audit.mjs [--json]
   Exit code 1 when any page breaks either rule. */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, "..", "..");
export const NOTES_DIR = join(REPO_ROOT, "paper2notes", "notes");
export const DSE_DIR = join(NOTES_DIR, "dse");
export const MC_STORE = join(REPO_ROOT, "paper2db", "qb-web-ui-staging", "dse-mc", "index.json");
const SKIP = new Set(["_local", "vendor", "lib", "crops", "css", "data", "js", "_source"]);

/* ---------- tiny HTML helpers (shared with quiz-audit.mjs) ---------- */
export function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)(?:="([^"]*)")?/g)) {
    if (m[1]) out[m[1]] = m[2] === undefined ? "" : m[2];
  }
  return out;
}
export function sliceBlock(html, from, tagName) {
  /* Walk from an opening tag to its matching close, tracking nesting of the same tag. */
  const open = new RegExp(`<${tagName}\\b`, "g");
  const close = new RegExp(`</${tagName}>`, "g");
  let depth = 0;
  let i = from;
  while (i < html.length) {
    open.lastIndex = i;
    close.lastIndex = i;
    const o = open.exec(html);
    const c = close.exec(html);
    if (!c) return html.slice(from);
    if (o && o.index < c.index) {
      depth += 1;
      i = o.index + 1;
    } else {
      depth -= 1;
      i = c.index + 1;
      if (depth === 0) return html.slice(from, c.index + c[0].length);
    }
  }
  return html.slice(from);
}
export function pages(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) pages(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}
export function quizKeys(scriptHtml) {
  const m = scriptHtml.match(/var\s+QUIZ_KEYS\s*=\s*(\{[\s\S]*?\});\s*\n/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return { __parseError: m[1].slice(0, 80) };
  }
}

/* ---------- rule 1: the crop a slide points at must be published ---------- */

/* notes/book5/_local/dse/mc/25/pp_q35.png -> notes/dse/mc/25/pp_q35.png.
   That is the file the Docker image copies into place, so it is the one that
   has to be committed. A src outside any _local/dse/ path is checked as-is. */
export function trackedCrop(pageFile, src, notesDir = NOTES_DIR) {
  const abs = resolve(dirname(pageFile), src.split(/[?#]/)[0]);
  const parts = relative(notesDir, abs).split(sep).filter(Boolean);
  const at = parts.indexOf("_local");
  if (at >= 0 && parts[at + 1] === "dse") return join(notesDir, "dse", ...parts.slice(at + 2));
  return abs;
}

function dseSlides(html) {
  const out = [];
  for (const m of html.matchAll(/<article\b[^>]*class="[^"]*quiz-slide[^"]*"[^>]*>/g)) {
    const a = attrs(m[0]);
    const id = a.id || "";
    if (!id.startsWith("dse-")) continue;
    const inner = sliceBlock(html, m.index, "article");
    const img = inner.match(/<img\b[^>]*>/);
    out.push({ id, src: img ? (attrs(img[0]).src || "") : null });
  }
  return out;
}

/* ---------- rule 2: every published key must be one the store backs ---------- */
export function loadStore(path = MC_STORE) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const byId = new Map();
  for (const record of Array.isArray(raw) ? raw : raw.items || []) {
    if (record && record.id) byId.set(record.id, record);
  }
  return byId;
}

/* Every js/checks.js that a shipped page actually loads, with its QUIZ_KEYS. */
export function loadedKeyStores(notesDir = NOTES_DIR) {
  const out = new Map();
  for (const file of pages(notesDir)) {
    const html = readFileSync(file, "utf8");
    for (const m of html.matchAll(/<script\b[^>]*src="([^"]*checks\.js[^"]*)"[^>]*>/g)) {
      const full = resolve(dirname(file), m[1]);
      if (!existsSync(full)) continue;
      const keys = quizKeys(readFileSync(full, "utf8"));
      if (!keys || keys.__parseError) continue;
      out.set(full, keys);
    }
  }
  return out;
}

/* ---------- the audit ---------- */
export function auditAgainstStore({ notesDir = NOTES_DIR, storePath = MC_STORE, root = REPO_ROOT } = {}) {
  const problems = [];
  if (!existsSync(storePath)) {
    return {
      problems: [{ kind: "store-missing", where: relative(root, storePath), detail: "store does not exist, so no key can be checked against it" }],
      slides: 0,
      keys: 0,
      keyStores: 0,
    };
  }
  const store = loadStore(storePath);
  const storePath_ = relative(root, storePath);

  /* rule 1 */
  let slides = 0;
  for (const file of pages(notesDir)) {
    const rel = relative(root, file);
    for (const slide of dseSlides(readFileSync(file, "utf8"))) {
      slides += 1;
      if (!slide.src) {
        problems.push({ kind: "dse-slide-no-image", where: rel, detail: `slide ${slide.id} has no <img>, so it shows no question` });
        continue;
      }
      if (/^(https?:)?\/\//.test(slide.src) || slide.src.startsWith("data:")) continue;
      const tracked = trackedCrop(file, slide.src, notesDir);
      if (!existsSync(tracked)) {
        problems.push({
          kind: "dse-slide-image-missing",
          where: rel,
          detail: `slide ${slide.id} points at ${slide.src}, but ${relative(root, tracked)} is not published`,
        });
      }
    }
  }

  /* rule 2 */
  const keyStores = loadedKeyStores(notesDir);
  let keys = 0;
  for (const [file, table] of keyStores) {
    const where = relative(root, file);
    for (const [id, key] of Object.entries(table)) {
      keys += 1;
      const record = store.get(id);
      if (!record) {
        problems.push({ kind: "dse-mc-key-not-in-store", where, detail: `QUIZ_KEYS has ${id}, but ${storePath_} has no record for it, so no marking scheme backs the key` });
        continue;
      }
      const answer = record.answer || {};
      if (answer.missing || !answer.option) {
        const why = (record.warnings || []).length ? ` (store warnings: ${record.warnings.join(", ")})` : "";
        problems.push({ kind: "dse-mc-key-unsupported", where, detail: `QUIZ_KEYS grades ${id} but the store marks its answer missing${why}. Withhold the key instead of asserting one.` });
        continue;
      }
      if (key.option && key.option !== answer.option) {
        problems.push({ kind: "dse-mc-key-disagrees-with-store", where, detail: `QUIZ_KEYS grades ${id} as ${key.option}, the store says ${answer.option}` });
      }
      if (key.pct != null && answer.percentage != null && key.pct !== answer.percentage) {
        problems.push({ kind: "dse-mc-pct-disagrees-with-store", where, detail: `QUIZ_KEYS reports ${key.pct}% for ${id}, the store says ${answer.percentage}%` });
      }
    }
  }

  return { problems, slides, keys, keyStores: keyStores.size };
}

/* ---------- run ---------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = auditAgainstStore();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const w = (s, n) => String(s).padEnd(n);
    console.log(`DSE slides ${report.slides} | graded keys ${report.keys} in ${report.keyStores} checks.js | problems ${report.problems.length}`);
    for (const p of report.problems) console.log(`  - [${p.kind}] ${p.where}: ${p.detail}`);
  }
  process.exit(report.problems.length ? 1 : 0);
}
