import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { lintAnchors, lintPage, isPositionalId, parseElements } from "./anchor-lint.mjs";

const page = (body) => `<!doctype html><body>${body}</body>`;

// Builds <tmp>/paper2notes/{notes,anchors} plus <tmp>/paper2db/metadata/pointers.
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "anchor-lint-"));
  const repoRoot = join(root, "paper2notes");
  mkdirSync(join(repoRoot, "notes"), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content));
  }
  return { repoRoot, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

function run(files) {
  const f = fixture(files);
  try {
    return lintAnchors({ repoRoot: f.repoRoot }).errors;
  } finally {
    f.cleanup();
  }
}

test("isPositionalId flags kind+counter and bare numbers, not semantic ids", () => {
  for (const id of ["eq-3", "block7", "42", "section_2", "tf-item-1", ":r1:", "def-1-2"]) {
    assert.equal(isPositionalId(id), true, id);
  }
  for (const id of ["missing-mass-eq-1", "quiz", "mc-quiz", "formula-sheet", "half-life-def-1", "eq-decay"]) {
    assert.equal(isPositionalId(id), false, id);
  }
});

test("parseElements ignores comments, scripts and '>' inside attribute values", () => {
  const els = parseElements(`<!-- <div id="c"> --><script>var s = '<div id="s">';</script><div data-x="a>b" id="real">`);
  assert.deepEqual(els.map((e) => e.attrs.get("id")), ["real"]);
});

test("duplicate ids on one page are reported with both lines", () => {
  const { errors } = lintPage(page(`<div id="a-one"></div>\n<div id='a-one'></div>`), { label: "p", enforceRequired: false });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /duplicate id "a-one".*first at line 1/);
});

test("same id on different pages is allowed", () => {
  const errors = run({
    "paper2notes/notes/a.html": page(`<div id="shared-thing"></div>`),
    "paper2notes/notes/b.html": page(`<div id="shared-thing"></div>`),
  });
  assert.deepEqual(errors, []);
});

test("positional ids fail everywhere", () => {
  const errors = run({ "paper2notes/notes/a.html": page(`<div class="eq" id="eq-3"></div>`) });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /positional id "eq-3"/);
});

test("required ids are enforced only on pages listed in config.enforce", () => {
  const html = page(`<div class="check" data-answer="B"></div><figure class="fig"></figure><table class="notes"></table>`);
  assert.deepEqual(run({ "paper2notes/notes/book/a.html": html }), []);
  const errors = run({
    "paper2notes/notes/book/a.html": html,
    "paper2notes/notes/other/b.html": html,
    "paper2notes/anchors/config.json": { enforce: ["book"] },
  });
  assert.equal(errors.length, 3);
  assert.ok(errors.every((e) => e.startsWith("notes/book/a.html:") && / has no id$/.test(e)));
});

test("enforce entry that matches no page is an error", () => {
  const errors = run({
    "paper2notes/notes/a.html": page(""),
    "paper2notes/anchors/config.json": { enforce: ["book9"] },
  });
  assert.match(errors.join("\n"), /enforce entry "book9" matches no HTML page/);
});

test("locked id that disappears needs a move; a recorded move passes", () => {
  const base = {
    "paper2notes/notes/a.html": page(`<div id="new-name"></div>`),
    "paper2notes/anchors/ids.lock.json": { pages: { "a.html": ["old-name"] } },
  };
  assert.match(run(base).join("\n"), /locked id "old-name" is gone/);
  assert.deepEqual(run({ ...base, "paper2notes/anchors/moves.json": { moves: [{ page: "a.html", from: "old-name", to: "new-name" }] } }), []);
});

test("moves chain through intermediate ids, but dead ends, cycles and stale entries fail", () => {
  const notes = { "paper2notes/notes/a.html": page(`<div id="c-final"></div>`) };
  const lock = { "paper2notes/anchors/ids.lock.json": { pages: { "a.html": ["a-first"] } } };
  const chain = [{ page: "a.html", from: "a-first", to: "b-mid" }, { page: "a.html", from: "b-mid", to: "c-final" }];
  assert.deepEqual(run({ ...notes, ...lock, "paper2notes/anchors/moves.json": { moves: chain } }), []);

  const dead = run({ ...notes, "paper2notes/anchors/moves.json": { moves: [{ page: "a.html", from: "a-first", to: "gone" }] } });
  assert.match(dead.join("\n"), /does not lead to an id that exists/);

  const cycle = run({ ...notes, "paper2notes/anchors/moves.json": { moves: [{ page: "a.html", from: "x-one", to: "y-two" }, { page: "a.html", from: "y-two", to: "x-one" }] } });
  assert.match(cycle.join("\n"), /does not lead to an id that exists/);

  const stale = run({ ...notes, "paper2notes/anchors/moves.json": { moves: [{ page: "a.html", from: "c-final", to: "other" }] } });
  assert.match(stale.join("\n"), /recorded as moved but still exists/);

  const missingPage = run({ ...notes, "paper2notes/anchors/moves.json": { moves: [{ page: "nope.html", from: "x-one", to: "y-two" }] } });
  assert.match(missingPage.join("\n"), /page "nope.html" does not exist/);
});

test("malformed moves/lock/config report instead of throwing", () => {
  const errors = run({
    "paper2notes/notes/a.html": page(""),
    "paper2notes/anchors/moves.json": { moves: [{ page: "a.html", from: "same-id", to: "same-id" }, { page: "a.html" }] },
    "paper2notes/anchors/ids.lock.json": "{not json",
    "paper2notes/anchors/config.json": { enforce: ["../x"] },
  });
  const text = errors.join("\n");
  assert.match(text, /identical/);
  assert.match(text, /needs non-empty string/);
  assert.match(text, /ids\.lock\.json: invalid JSON/);
  assert.match(text, /"enforce" must be an array/);
});

test("pointer stores are validated per file against answer-pointer v1", () => {
  const good = {
    schema: "paper2db.answer-pointer.v1",
    corpus: "dse",
    pointers: [{ item_id: "dse-mc-2020-1", tier: "verified", kind: "page", target: { path: "tests/x.pdf", page: 2, bbox: [0, 0, 1, 0.5] }, source: "human" }],
  };
  const notes = { "paper2notes/notes/a.html": page("") };
  assert.deepEqual(run({ ...notes, "paper2db/metadata/pointers/dse.json": good }), []);

  // Filenames and corpora are not part of the per-file shape contract.
  const other = structuredClone(good);
  other.pointers[0].item_id = "dse-mc-2021-1";
  assert.deepEqual(run({
    ...notes,
    "paper2db/metadata/pointers/dse-2020.json": good,
    "paper2db/metadata/pointers/dse-2021.json": other,
  }), []);

  const bad = structuredClone(good);
  bad.pointers.push({ item_id: "dse-mc-2020-1", tier: "verified", kind: "page", target: { path: "../etc/x", page: 0, bbox: [0.6, 0, 0.5, 1] }, source: "" });
  const text = run({ ...notes, "paper2db/metadata/pointers/dse-2020.json": bad, "paper2db/metadata/pointers/dse-2021.json": { schema: "nope", corpus: "dse", pointers: {} } }).join("\n");
  assert.match(text, /no "\.\." segments|no "\.\."/);
  assert.match(text, /target\.page must be an integer/);
  assert.match(text, /bbox must be/);
  assert.match(text, /source must be a non-empty string/);
  assert.match(text, /"schema" must be/);
  assert.match(text, /"pointers" must be an array/);
  assert.doesNotMatch(text, /duplicate verified pointer/);
  assert.doesNotMatch(text, /file name must be/);
  assert.doesNotMatch(text, /also declared by another pointers file/);
});

test("pointer shape validation matches answer-pointer v1: optional page, unknown keys, string note, duplicates", () => {
  const notes = { "paper2notes/notes/a.html": page("") };
  const minimal = {
    schema: "paper2db.answer-pointer.v1",
    corpus: "qb",
    pointers: [
      { item_id: "x", tier: "verified", kind: "pdf", target: { path: "paper/ans/x.pdf" }, source: "s" },
      { item_id: "x", tier: "verified", kind: "pdf", target: { path: "paper/ans/x.pdf" }, source: "s" },
      { item_id: "y", tier: "inferred", kind: "crop", target: { path: "a.png" }, source: "s", note: "why" },
    ],
  };
  assert.deepEqual(run({ ...notes, "paper2db/metadata/pointers/anything.json": minimal }), []);

  const invalid = {
    schema: "paper2db.answer-pointer.v1",
    corpus: "qb",
    storeExtra: true,
    pointers: [{ item_id: "x", tier: "verified", kind: "pdf", target: { path: "p.pdf", targetExtra: 1 }, source: "s", note: 5 }],
  };
  const text = run({ ...notes, "paper2db/metadata/pointers/qb.json": invalid }).join("\n");
  assert.match(text, /unknown key "storeExtra"/);
  assert.match(text, /\.note must be a string/);
  assert.match(text, /\.target: unknown key "targetExtra"/);
});

test("missing pointers dir and _local/_source/vendor pages are skipped", () => {
  const errors = run({
    "paper2notes/notes/a.html": page(""),
    "paper2notes/notes/_local/x.html": page(`<div id="eq-1"></div>`),
    "paper2notes/notes/_source/x.html": page(`<div id="eq-1"></div>`),
    "paper2notes/notes/book/vendor/katex/x.html": page(`<div id="eq-1"></div>`),
  });
  assert.deepEqual(errors, []);
});
