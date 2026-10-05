#!/usr/bin/env node
/* Static quiz audit for every shipped notes page.

   Checks the five contracts the runtime in js/checks.js grades against:
     1. MC   .check[data-check="mc"][data-answer] > button[data-choice]  -> key must match an option
     2. TF   .tf-item[data-answer="true|false"]            > button[data-tf] -> key must be true|false
     3. DSE  .quiz-slide[id^="dse-mc-"]                    -> id must exist in that page's QUIZ_KEYS
     4. wiring: the page must load a js/checks.js that resolves on disk
     5. DSE availability: every DSE crop a page shows must be a question the
        papers really hold, and every section must be recorded in
        notes/dse/availability.json; a page that states in words that a section
        has no long question must match that record
        (see scripts/dse-availability.mjs)

   Run: node paper2notes/scripts/quiz-audit.mjs [--json]
   Exit code 1 when any page has a broken contract. */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkPage, checkSnapshot, loadAvailability, loadSource } from "./dse-availability.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NOTES = join(ROOT, "notes");
const SKIP = new Set(["_local", "vendor", "lib", "crops", "css", "data", "js"]);

/* Papers the answer store has no answer for. Their slides are reported as
   informational, not as a defect: checks.js tells the student the key is
   unavailable instead of leaving a dead tile. */
const UNAVAILABLE = new Set(
  Object.keys(
    JSON.parse(readFileSync(join(ROOT, "scripts", "quiz-keys-unavailable.json"), "utf8")).papers || {},
  ),
);

/* What each DSE section really has: notes/dse/availability.json plus the
   tracked paper2db inputs that say which questions the papers hold. Read once
   for the whole run. */
const AVAILABILITY = { ...loadAvailability(ROOT), repoRoot: ROOT };
const DSE_SOURCE = loadSource(ROOT);

/* ---------- page discovery ---------- */
function pages(dir, out = []) {
  for (const name of readdirSync(dir).sort()) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) pages(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

/* ---------- tiny tag helpers ---------- */
function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)(?:="([^"]*)")?/g)) {
    if (m[1]) out[m[1]] = m[2] === undefined ? "" : m[2];
  }
  return out;
}
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map((m) => attrs(m[0]));
}
function sliceBlock(html, from, tagName) {
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

/* Every element that opens a .check block, with its full inner markup. */
function checkBlocks(html) {
  const out = [];
  for (const m of html.matchAll(/<div\b[^>]*class="[^"]*\bcheck\b[^"]*"[^>]*>/g)) {
    out.push({ tag: attrs(m[0]), html: sliceBlock(html, m.index, "div") });
  }
  return out;
}
function tfItems(html) {
  const out = [];
  for (const m of html.matchAll(/<div\b[^>]*class="[^"]*\btf-item\b[^"]*"[^>]*>/g)) {
    out.push({ tag: attrs(m[0]), html: sliceBlock(html, m.index, "div") });
  }
  return out;
}

function quizKeys(scriptHtml) {
  const m = scriptHtml.match(/var\s+QUIZ_KEYS\s*=\s*(\{[\s\S]*?\});\s*\n/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    /* Keys are plain double-quoted JSON, so a parse failure is itself a defect. */
    return { __parseError: m[1].slice(0, 80) };
  }
}

/* ---------- per-page audit ---------- */
function audit(file) {
  const html = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);
  const problems = [];
  const informational = [];
  let mc = 0;
  let tf = 0;
  let sa = 0;
  let dseMc = 0;
  let dseLq = 0;
  let keyed = 0;

  /* 4. wiring */
  const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)].map((m) => m[1]);
  const checkRefs = scripts.filter((s) => /(^|\/)checks\.js(\?|$)/.test(s));
  const resolved = checkRefs.filter((s) => existsSync(resolve(dirname(file), s)));
  const hasQuizMarkup =
    /class="[^"]*\bcheck\b/.test(html) ||
    /class="[^"]*\btf-item\b/.test(html) ||
    /class="[^"]*quiz-slide/.test(html) ||
    /data-quiz=/.test(html);
  let keys = null;
  if (!checkRefs.length) {
    /* A landing page with no quiz markup needs no grading script. */
    if (hasQuizMarkup) problems.push({ kind: "no-checks-script", detail: "page has quiz markup but loads no js/checks.js" });
  } else if (!resolved.length) {
    problems.push({
      kind: "checks-script-404",
      detail: `checks.js refs do not resolve: ${checkRefs.join(", ")}`,
    });
  } else {
    keys = quizKeys(readFileSync(resolve(dirname(file), resolved[0]), "utf8"));
    if (keys === null) {
      problems.push({ kind: "no-quiz-keys", detail: "checks.js has no QUIZ_KEYS store" });
      keys = {};
    } else if (keys.__parseError) {
      problems.push({ kind: "quiz-keys-unparsable", detail: keys.__parseError });
      keys = {};
    }
  }
  if (keys === null) keys = {};

  /* local refs that 404 (images, pdfs, css, scripts) */
  for (const s of scripts) {
    if (/^(https?:)?\/\//.test(s) || s.startsWith("data:")) continue;
    if (!existsSync(resolve(dirname(file), s))) {
      problems.push({ kind: "asset-404", detail: `<script src="${s}"> does not resolve` });
    }
  }

  /* 1. MC */
  for (const box of checkBlocks(html)) {
    const kind = box.tag["data-check"];
    if (kind === "mc") {
      mc += 1;
      const key = box.tag["data-answer"];
      const opts = [...box.html.matchAll(/<button\b[^>]*data-choice="([^"]*)"[^>]*>/g)].map((m) => m[1]);
      if (key === undefined) problems.push({ kind: "mc-no-key", detail: `${box.tag.id || "(no id)"} has data-check=mc without data-answer` });
      else if (!opts.length) problems.push({ kind: "mc-no-options", detail: `${box.tag.id} has key ${key} but no button[data-choice]` });
      else if (!opts.includes(key)) problems.push({ kind: "mc-key-unmatched", detail: `${box.tag.id} key ${key} not among options ${opts.join(",")}` });
      if (!/\bclass="[^"]*\bfeedback\b/.test(box.html)) problems.push({ kind: "mc-no-feedback", detail: `${box.tag.id} has no .feedback target` });
    } else if (kind === "tf") {
      /* tf boxes delegate to their .tf-item children, counted below */
      if (!tfItems(box.html).length) problems.push({ kind: "tf-box-empty", detail: `${box.tag.id} has data-check=tf but no .tf-item` });
    } else if (kind === "sa") {
      sa += 1;
      if (!/<button\b[^>]*data-reveal/.test(box.html)) problems.push({ kind: "sa-no-reveal", detail: `${box.tag.id} has no button[data-reveal]` });
      if (!/class="[^"]*\bmodel\b/.test(box.html)) problems.push({ kind: "sa-no-model", detail: `${box.tag.id} has no .model to reveal` });
    }
  }

  /* 2. TF, including tf-items that sit outside a data-check=tf wrapper */
  const wrapped = checkBlocks(html)
    .filter((b) => b.tag["data-check"] === "tf")
    .map((b) => tfItems(b.html).map((i) => i.tag.id));
  const wrappedIds = new Set(wrapped.flat());
  for (const item of tfItems(html)) {
    const key = item.tag["data-answer"];
    const vals = [...item.html.matchAll(/<button\b[^>]*data-tf="([^"]*)"[^>]*>/g)].map((m) => m[1]);
    tf += 1;
    /* initTf only walks .tf-item inside a [data-check='tf'] box, so a loose
       tf-item renders True/False buttons that nothing listens to. */
    if (!wrappedIds.has(item.tag.id)) {
      problems.push({ kind: "tf-item-unwired", detail: `${item.tag.id} is not inside a .check[data-check="tf"], so its True/False buttons get no handler` });
    }
    if (key !== "true" && key !== "false") {
      problems.push({ kind: "tf-key-invalid", detail: `${item.tag.id} data-answer=${JSON.stringify(key)} is not true|false` });
    }
    if (!vals.includes("true") || !vals.includes("false")) {
      problems.push({ kind: "tf-missing-button", detail: `${item.tag.id} offers ${vals.join(",") || "none"} but needs true and false` });
    }
    if (!/\bclass="[^"]*\bfeedback\b/.test(item.html)) {
      problems.push({ kind: "tf-no-feedback", detail: `${item.tag.id} has no .feedback target` });
    }
  }

  /* 3. DSE deck slides */
  for (const m of html.matchAll(/<article\b[^>]*class="[^"]*quiz-slide[^"]*"[^>]*>/g)) {
    const a = attrs(m[0]);
    const id = a.id || "";
    if (id.startsWith("dse-lq-")) {
      dseLq += 1;
      continue;
    }
    if (!id.startsWith("dse-mc-")) continue;
    dseMc += 1;
    const key = keys[id];
    if (!key) {
      /* No key: either the answer store has no answer for this paper (known
         gap, listed in scripts/quiz-keys-unavailable.json) or a key is
         missing and the slide is dead weight on a live page. */
      if (UNAVAILABLE.has(id)) {
        informational.push({ kind: "dse-mc-key-unavailable", detail: `slide ${id} has no answer in the store; the page says so on pick` });
      } else {
        problems.push({ kind: "dse-mc-no-key", detail: `slide ${id} has no entry in QUIZ_KEYS, so no verdict` });
      }
    } else if (!key.option) {
      problems.push({ kind: "dse-mc-key-no-option", detail: `slide ${id} key has no option` });
    } else if (!/^[A-D]$/.test(key.option)) {
      problems.push({ kind: "dse-mc-key-bad-option", detail: `slide ${id} key option ${JSON.stringify(key.option)} is not A-D` });
    } else {
      keyed += 1;
    }
  }

  /* 5. DSE availability: a slide may only show a question the papers hold, and
     a section with no published long question must say so on the page. */
  const availability = checkPage(html, { page: rel, availability: AVAILABILITY, source: DSE_SOURCE });
  problems.push(...availability.problems);
  informational.push(...availability.informational);

  /* duplicate ids */
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) problems.push({ kind: "duplicate-id", detail: `id="${id}" appears ${ids.filter((x) => x === id).length} times` });
    seen.add(id);
  }

  return {
    page: rel,
    mc,
    tf,
    sa,
    dseMc,
    dseLq,
    keyed,
    quizKinds: mc + tf + dseMc,
    problems,
    informational,
  };
}

/* ---------- run ---------- */
const snapshot = checkSnapshot({ repoRoot: ROOT, availability: AVAILABILITY });
const files = pages(NOTES);
const rows = files.map(audit);
const json = process.argv.includes("--json");
const anyProblem = snapshot.problems.length > 0 || rows.some((r) => r.problems.length);

if (json) {
  console.log(JSON.stringify({ snapshot, pages: rows }, null, 2));
} else {
  const w = (s, n) => String(s).padEnd(n);
  console.log(`DSE availability (notes/dse/availability.json against notes/dse/ and paper2db)`);
  for (const p of snapshot.problems) console.log(`  - [${p.kind}] ${p.detail}`);
  for (const i of snapshot.informational) console.log(`  ~ [${i.kind}] ${i.detail}`);
  console.log(`\n${w("page", 62)}${w("mc", 4)}${w("tf", 4)}${w("sa", 4)}${w("dseMC", 7)}${w("keyed", 7)}problems`);
  for (const r of rows) {
    console.log(
      `${w(r.page, 62)}${w(r.mc, 4)}${w(r.tf, 4)}${w(r.sa, 4)}${w(r.dseMc, 7)}${w(r.keyed, 7)}${r.problems.length}`,
    );
    for (const p of r.problems) console.log(`    - [${p.kind}] ${p.detail}`);
    for (const p of r.informational) console.log(`    ~ [${p.kind}] ${p.detail}`);
  }
  const tot = rows.reduce(
    (a, r) => ({
      mc: a.mc + r.mc,
      tf: a.tf + r.tf,
      sa: a.sa + r.sa,
      dseMc: a.dseMc + r.dseMc,
      dseLq: a.dseLq + r.dseLq,
      probs: a.probs + r.problems.length,
      badPages: a.badPages + (r.problems.length ? 1 : 0),
    }),
    { mc: 0, tf: 0, sa: 0, dseMc: 0, dseLq: 0, probs: 0, badPages: 0 },
  );
  console.log(
    `\npages ${rows.length} | graded MC ${tot.mc} | TF ${tot.tf} | short answer ${tot.sa} | DSE MC slides ${tot.dseMc} | DSE LQ slides ${tot.dseLq}\nproblems ${tot.probs} on ${tot.badPages} pages`,
  );
}
process.exit(anyProblem ? 1 : 0);