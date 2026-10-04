// Anchor lint for paper2notes: stable, semantic ids on answer-bearing blocks.
//
// Rules (run from ci-check.mjs; also runnable standalone):
//   1. required ids   - answer-bearing blocks (REQUIRED_SELECTORS) on every
//                       page must carry an id.
//   2. unique ids     - no id may repeat within one HTML page (all pages).
//   3. no positional  - ids must not be a generic kind plus counter ("eq-3",
//                       "block7") or bare digits ("42"); a semantic token such
//                       as in `missing-mass-eq-1` is required. All pages.
//   4. moves.json     - anchors/ids.lock.json records the ids each page has
//                       published; an id that disappears must be recorded in
//                       anchors/moves.json ({page, from, to}) with `to` still
//                       present on the page (chains are followed).
//   5. pointers       - paper2db/metadata/pointers/*.json (when present) must
//                       match the paper2db.answer-pointer.v1 shape.
//
// `node scripts/anchor-lint.mjs --write-lock` adds every current id to the
// lock (it never drops ids; removals must go through moves.json).

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = resolve(__dirname, "..");

// An element needs an id when any selector matches. `classes` are all-of.
export const REQUIRED_SELECTORS = [
  { name: "check", classes: ["check"] },
  { name: "def", classes: ["def"] },
  { name: "eq", classes: ["eq"] },
  { name: "worked", classes: ["worked"] },
  { name: "fig", tag: "figure", classes: ["fig"] },
  { name: "notes table", tag: "table", classes: ["notes"] },
  { name: "idea", tag: "section", classes: ["idea"] },
  { name: "quiz", tag: "section", classes: ["lo-quiz"] },
  { name: "tf-item", classes: ["tf-item"] },
  { name: "answer", attr: "data-answer" },
];

// Words that only describe kind or position; an id made solely of these plus
// at least one counter is positional and breaks as soon as a block is inserted.
const GENERIC_TOKENS = new Set([
  "id", "el", "elem", "element", "node", "item", "block", "box", "div", "span",
  "section", "sec", "idea", "def", "eq", "equation", "check", "worked", "fig",
  "figure", "table", "notes", "tf", "tf-item", "answer", "ans", "q",
  "question", "part", "step", "row", "col", "card", "content", "anchor", "a",
  "auto", "gen", "generated", "tmp", "temp", "new", "untitled", "x",
]);

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>=`]+))?)*)\s*\/?>/g;
const ATTR_RE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>=`]+)))?/g;

export function parseElements(html) {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, (m) => m.replace(/[^\n]/g, " "));
  const elements = [];
  let match;
  TAG_RE.lastIndex = 0;
  while ((match = TAG_RE.exec(text)) !== null) {
    const attrs = new Map();
    let a;
    ATTR_RE.lastIndex = 0;
    while ((a = ATTR_RE.exec(match[2])) !== null) {
      const name = a[1].toLowerCase();
      if (!attrs.has(name)) attrs.set(name, a[2] ?? a[3] ?? a[4] ?? "");
    }
    const line = text.slice(0, match.index).split("\n").length;
    elements.push({ tag: match[1].toLowerCase(), attrs, line });
  }
  return elements;
}

export function isPositionalId(id) {
  if (/^:[\w:-]*:$/.test(id)) return true; // framework-generated (:r1:)
  const tokens = id.toLowerCase().split(/[-_.:]+/).flatMap((t) => {
    // "eq3" -> "eq", "3"
    const m = t.match(/^([a-z]+)(\d+)$/);
    return m ? [m[1], m[2]] : [t];
  }).filter(Boolean);
  if (tokens.length === 0) return true;
  // Kind-only ids with no counter ("quiz") name a unique structural block.
  if (!tokens.some((t) => /^\d+$/.test(t))) return false;
  return tokens.every((t) => /^\d+$/.test(t) || GENERIC_TOKENS.has(t));
}

function matchesSelector(el, sel) {
  if (sel.tag && el.tag !== sel.tag) return false;
  if (sel.attr && !el.attrs.has(sel.attr)) return false;
  if (sel.classes) {
    const have = (el.attrs.get("class") || "").split(/\s+/);
    if (!sel.classes.every((c) => have.includes(c))) return false;
  }
  return true;
}

export function requiredKind(el) {
  const sel = REQUIRED_SELECTORS.find((s) => matchesSelector(el, s));
  return sel ? sel.name : null;
}

// Lint one page. Returns { errors, ids } where ids is the set of ids present.
export function lintPage(html, { label }) {
  const errors = [];
  const ids = new Set();
  const seenAt = new Map();
  for (const el of parseElements(html)) {
    const id = el.attrs.get("id");
    if (id !== undefined && id !== "") {
      ids.add(id);
      if (seenAt.has(id)) {
        errors.push(`${label}:${el.line}: duplicate id "${id}" (first at line ${seenAt.get(id)})`);
      } else {
        seenAt.set(id, el.line);
      }
      if (/\s/.test(id)) {
        errors.push(`${label}:${el.line}: id "${id}" contains whitespace`);
      } else if (isPositionalId(id)) {
        errors.push(`${label}:${el.line}: positional id "${id}" — name the block by what it teaches (e.g. "missing-mass-eq-1")`);
      }
    } else {
      const kind = requiredKind(el);
      if (kind) errors.push(`${label}:${el.line}: <${el.tag}> ${kind} block has no id`);
    }
  }
  return { errors, ids };
}

function walkHtml(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["_source", "_local", "vendor", "node_modules", ".lavish"].includes(entry.name)) continue;
      walkHtml(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function readJson(path, errors, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    errors.push(`${label}: invalid JSON (${e.message})`);
    return null;
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function loadMoves(anchorsDir, errors) {
  const path = join(anchorsDir, "moves.json");
  const byPage = new Map();
  if (!existsSync(path)) return byPage;
  const doc = readJson(path, errors, "anchors/moves.json");
  if (!doc) return byPage;
  if (!isPlainObject(doc) || !Array.isArray(doc.moves)) {
    errors.push(`anchors/moves.json: expected {"moves": [{"page", "from", "to"}]}`);
    return byPage;
  }
  doc.moves.forEach((m, i) => {
    const where = `anchors/moves.json moves[${i}]`;
    if (!isPlainObject(m) || [m.page, m.from, m.to].some((v) => typeof v !== "string" || !v)) {
      errors.push(`${where}: needs non-empty string "page", "from" and "to"`);
      return;
    }
    if (m.from === m.to) {
      errors.push(`${where}: "from" and "to" are identical ("${m.from}")`);
      return;
    }
    const pageMoves = byPage.get(m.page) ?? new Map();
    if (pageMoves.has(m.from)) {
      errors.push(`${where}: "${m.from}" on ${m.page} is moved twice`);
      return;
    }
    pageMoves.set(m.from, m.to);
    byPage.set(m.page, pageMoves);
  });
  return byPage;
}

// Follow from -> to until an id that is present; null on cycle / dead end.
function resolveMove(start, pageMoves, present) {
  const seen = new Set([start]);
  let cur = pageMoves.get(start);
  while (cur !== undefined) {
    if (present.has(cur)) return cur;
    if (seen.has(cur)) return null;
    seen.add(cur);
    cur = pageMoves.get(cur);
  }
  return null;
}

export function loadLock(anchorsDir, errors) {
  const path = join(anchorsDir, "ids.lock.json");
  if (!existsSync(path)) return {};
  const doc = readJson(path, errors, "anchors/ids.lock.json");
  if (!doc) return {};
  if (!isPlainObject(doc) || !isPlainObject(doc.pages) || !Object.values(doc.pages).every((v) => Array.isArray(v) && v.every((s) => typeof s === "string"))) {
    errors.push(`anchors/ids.lock.json: expected {"pages": {"<page>": ["id", ...]}}`);
    return {};
  }
  return doc.pages;
}

const POINTER_TIERS = ["verified", "derived", "inferred"];
const POINTER_KINDS = ["crop", "page", "pdf"];

function lintPointerFile(doc, label) {
  const errors = [];
  const bad = (msg) => errors.push(`${label}: ${msg}`);
  if (!isPlainObject(doc)) return [`${label}: expected a JSON object`];
  for (const key of Object.keys(doc)) {
    if (!["schema", "corpus", "pointers"].includes(key)) bad(`unknown key "${key}"`);
  }
  if (doc.schema !== "paper2db.answer-pointer.v1") bad(`"schema" must be "paper2db.answer-pointer.v1"`);
  if (!["qb", "dse"].includes(doc.corpus)) bad(`"corpus" must be "qb" or "dse"`);
  if (!Array.isArray(doc.pointers)) {
    bad(`"pointers" must be an array`);
    return errors;
  }
  doc.pointers.forEach((p, i) => {
    const at = `pointers[${i}]`;
    if (!isPlainObject(p)) return bad(`${at} must be an object`);
    for (const key of Object.keys(p)) {
      if (!["item_id", "tier", "kind", "target", "source", "note"].includes(key)) bad(`${at}: unknown key "${key}"`);
    }
    if (typeof p.item_id !== "string" || !p.item_id) bad(`${at}.item_id must be a non-empty string`);
    if (!POINTER_TIERS.includes(p.tier)) bad(`${at}.tier must be one of ${POINTER_TIERS.join("|")}`);
    if (!POINTER_KINDS.includes(p.kind)) bad(`${at}.kind must be one of ${POINTER_KINDS.join("|")}`);
    if (typeof p.source !== "string" || !p.source) bad(`${at}.source must be a non-empty string`);
    if ("note" in p && typeof p.note !== "string") bad(`${at}.note must be a string`);
    const t = p.target;
    if (!isPlainObject(t)) return bad(`${at}.target must be an object`);
    for (const key of Object.keys(t)) {
      if (!["path", "page", "bbox"].includes(key)) bad(`${at}.target: unknown key "${key}"`);
    }
    if (typeof t.path !== "string" || !t.path) {
      bad(`${at}.target.path must be a non-empty string`);
    } else if (t.path.includes("\\") || t.path.startsWith("/") || t.path.split("/").includes("..")) {
      bad(`${at}.target.path "${t.path}" must be relative to paper2db/ with forward slashes and no ".." segments`);
    }
    if ("page" in t && !(Number.isInteger(t.page) && t.page >= 1)) {
      bad(`${at}.target.page must be an integer >= 1`);
    }
    if ("bbox" in t) {
      const b = t.bbox;
      const ok = Array.isArray(b) && b.length === 4 && b.every((n) => typeof n === "number" && n >= 0 && n <= 1) && b[0] < b[2] && b[1] < b[3];
      if (!ok) bad(`${at}.target.bbox must be [x0,y0,x1,y1] within 0..1 with x0<x1 and y0<y1`);
    }
    // Staged crops are gitignored, so target existence is not checked here.
  });
  return errors;
}

function lintPointers(pointersDir, repoRootRel, errors) {
  if (!existsSync(pointersDir)) return;
  const names = readdirSync(pointersDir).filter((n) => n.endsWith(".json")).sort();
  for (const name of names) {
    const label = join(repoRootRel, name).split(sep).join("/");
    const doc = readJson(join(pointersDir, name), errors, label);
    if (!doc) continue;
    errors.push(...lintPointerFile(doc, label));
  }
}

export function lintAnchors({ repoRoot = defaultRepoRoot, writeLock = false } = {}) {
  const errors = [];
  const notesDir = join(repoRoot, "notes");
  if (!existsSync(notesDir)) return { errors, lock: null };
  const anchorsDir = join(repoRoot, "anchors");
  const moves = loadMoves(anchorsDir, errors);
  const lock = loadLock(anchorsDir, errors);

  const pages = new Map();
  for (const file of walkHtml(notesDir).sort()) {
    const page = relative(notesDir, file).split(sep).join("/");
    const { errors: pageErrors, ids } = lintPage(readFileSync(file, "utf8"), {
      label: `notes/${page}`,
    });
    errors.push(...pageErrors);
    pages.set(page, ids);
  }

  for (const [page, pageMoves] of moves) {
    const present = pages.get(page);
    if (!present) {
      errors.push(`anchors/moves.json: page "${page}" does not exist under notes/`);
      continue;
    }
    for (const from of pageMoves.keys()) {
      if (present.has(from)) errors.push(`anchors/moves.json: "${from}" on ${page} is recorded as moved but still exists`);
      else if (resolveMove(from, pageMoves, present) === null) {
        errors.push(`anchors/moves.json: "${from}" on ${page} does not lead to an id that exists on the page`);
      }
    }
  }

  for (const [page, locked] of Object.entries(lock)) {
    const present = pages.get(page);
    if (!present) {
      const moved = [...moves.keys()].includes(page);
      errors.push(`anchors/ids.lock.json: page "${page}" no longer exists${moved ? "" : " (deleted or renamed pages are not covered by moves.json; remove the lock entry deliberately)"}`);
      continue;
    }
    const pageMoves = moves.get(page) ?? new Map();
    for (const id of locked) {
      if (present.has(id)) continue;
      if (!pageMoves.has(id)) {
        errors.push(`notes/${page}: locked id "${id}" is gone — keep it or record the rename in anchors/moves.json as {"page":"${page}","from":"${id}","to":"<new-id>"}`);
      }
    }
  }

  let nextLock = null;
  if (writeLock) {
    nextLock = {};
    for (const [page, ids] of [...pages].sort(([a], [b]) => (a < b ? -1 : 1))) {
      const merged = new Set([...(lock[page] ?? []).filter((id) => ids.has(id) || moves.get(page)?.has(id)), ...ids]);
      if (merged.size) nextLock[page] = [...merged].sort();
    }
  }

  lintPointers(join(repoRoot, "..", "paper2db", "metadata", "pointers"), "paper2db/metadata/pointers", errors);
  return { errors, lock: nextLock };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const writeLock = process.argv.includes("--write-lock");
  const { errors, lock } = lintAnchors({ writeLock });
  if (writeLock && lock) {
    mkdirSync(join(defaultRepoRoot, "anchors"), { recursive: true });
    writeFileSync(join(defaultRepoRoot, "anchors", "ids.lock.json"), `${JSON.stringify({ pages: lock }, null, 2)}\n`);
    console.log(`anchor-lint: wrote anchors/ids.lock.json (${Object.keys(lock).length} page(s))`);
  }
  if (errors.length) {
    console.error(`anchor-lint: ${errors.length} problem(s):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("anchor-lint: OK");
}
