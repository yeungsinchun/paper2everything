// Guards the two defects that grade a student against something that is not
// on screen: a slide whose crop is not published, and a key that
// paper2db's answer store does not back. Each test builds its own temp tree.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { auditAgainstStore, trackedCrop, loadStore } from "../scripts/quiz-store-audit.mjs";

const slide = (id, src) =>
  `<article class="quiz-slide" id="${id}"><figure class="dse-paper"><img src="${src}" alt="q"></figure></article>`;
const keysScript = (table) =>
  `<!doctype html><script>\n  var QUIZ_KEYS = ${JSON.stringify(table)};\n\n  function noop() {}\n  noop();\n</script>`;
const mcRecord = (id, option, percentage) => ({
  id,
  answer: option ? { option, percentage, missing: false } : { option: null, percentage: null, missing: true },
  warnings: option ? [] : ["missing_answer", "missing_percentage"],
});

/* Builds <tmp>/paper2notes/notes/** and <tmp>/paper2db/qb-web-ui-staging/dse-mc/index.json.
   A value of true writes an empty file, so a published crop exists on disk. */
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "quiz-store-audit-"));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content === true ? "" : typeof content === "string" ? content : JSON.stringify(content));
  }
  return { root, notes: join(root, "paper2notes", "notes"), store: join(root, "paper2db", "qb-web-ui-staging", "dse-mc", "index.json"), cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

function run(files) {
  const f = fixture(files);
  try {
    return auditAgainstStore({ notesDir: f.notes, storePath: f.store, root: f.root });
  } finally {
    f.cleanup();
  }
}
const kinds = (r) => r.problems.map((p) => p.kind).sort();

test("a slide whose crop is not published fails", () => {
  const r = run({
    "paper2notes/notes/book5/ch01/25-1.html": `<!doctype html>${slide("dse-lq-2017-10", "../_local/dse/lq/25/2017-q10.png")}`,
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [],
  });
  assert.deepEqual(kinds(r), ["dse-slide-image-missing"]);
  assert.match(r.problems[0].detail, /2017-q10\.png is not published/);
  assert.equal(r.slides, 1);
});

test("a slide whose crop is published passes, through the _local/dse remap", () => {
  const r = run({
    "paper2notes/notes/book5/ch01/25-1.html": `<!doctype html>${slide("dse-lq-2017-10", "../_local/dse/lq/25/2017-q10.png")}`,
    "paper2notes/notes/dse/lq/25/2017-q10.png": true,
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [],
  });
  assert.deepEqual(r.problems, []);
});

test("trackedCrop maps both deploy-time _local/dse shapes onto notes/dse", () => {
  const notes = "/repo/paper2notes/notes";
  assert.equal(
    trackedCrop(`${notes}/book5/ch01/25-1.html`, "../_local/dse/lq/25/2017-q10.png", notes),
    `${notes}/dse/lq/25/2017-q10.png`,
  );
  assert.equal(trackedCrop(`${notes}/index.html`, "_local/dse/mc/20/2012_q24.png", notes), `${notes}/dse/mc/20/2012_q24.png`);
  /* a src outside _local/dse is checked where it points */
  assert.equal(trackedCrop(`${notes}/25-1.html`, "crops/own.png", notes), `${notes}/crops/own.png`);
});

test("a key the store marks missing fails", () => {
  const r = run({
    "paper2notes/notes/book5/ch01/25-3.html": `<!doctype html>${slide("dse-mc-pp-34", "../_local/dse/mc/25/pp_q34.png")}<script src="../js/checks.js"></script>`,
    "paper2notes/notes/book5/_local/dse/mc/25/pp_q34.png": true,
    "paper2notes/notes/book5/js/checks.js": keysScript({ "dse-mc-pp-34": { option: "C" } }),
    "paper2notes/notes/dse/mc/25/pp_q34.png": true,
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [mcRecord("dse-mc-pp-34", null, null)],
  });
  assert.deepEqual(kinds(r), ["dse-mc-key-unsupported"]);
  assert.match(r.problems[0].detail, /missing_answer/);
  assert.equal(r.keys, 1);
});

test("a key the store has no record for fails", () => {
  const r = run({
    "paper2notes/notes/book5/ch01/25-3.html": `<!doctype html><script src="../js/checks.js"></script>`,
    "paper2notes/notes/book5/js/checks.js": keysScript({ "dse-mc-sap-35": { option: "D" } }),
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [],
  });
  assert.deepEqual(kinds(r), ["dse-mc-key-not-in-store"]);
});

test("a key that disagrees with the store on option or percentage fails", () => {
  const r = run({
    "paper2notes/notes/book5/ch01/25-3.html": `<!doctype html><script src="../js/checks.js"></script>`,
    "paper2notes/notes/book5/js/checks.js": keysScript({ "dse-mc-2024-32": { option: "D", pct: 10 } }),
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [mcRecord("dse-mc-2024-32", "A", 68)],
  });
  assert.deepEqual(kinds(r), ["dse-mc-key-disagrees-with-store", "dse-mc-pct-disagrees-with-store"]);
});

test("a key the store agrees with passes", () => {
  const r = run({
    "paper2notes/notes/book5/ch01/25-3.html": `<!doctype html>${slide("dse-mc-2024-32", "../_local/dse/mc/25/2024_q32.png")}<script src="../js/checks.js"></script>`,
    "paper2notes/notes/book5/js/checks.js": keysScript({ "dse-mc-2024-32": { option: "D", pct: 68 } }),
    "paper2notes/notes/dse/mc/25/2024_q32.png": true,
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [mcRecord("dse-mc-2024-32", "D", 68)],
  });
  assert.deepEqual(r.problems, []);
});

test("a checks.js no page loads is not checked", () => {
  const r = run({
    "paper2notes/notes/index.html": "<!doctype html><p>landing</p>",
    "paper2notes/notes/book5/js/checks.js": keysScript({ "dse-mc-sap-35": { option: "D" } }),
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [],
  });
  assert.deepEqual(r.problems, []);
  assert.equal(r.keyStores, 0);
});

/* The shared-asset refactor moved each book's key table out of js/checks.js
   into its own js/quiz-data.js. The store cross-check must read both shapes,
   or the refactor would silently stop auditing every key. */
const dataScript = (table) =>
  `/* Book 5 DSE data. */\nwindow.P2N_QUIZ = {\n  paperLos: {},\n  quizKeys: ${JSON.stringify(table)}\n};\n`;

test("a quiz-data.js key the store marks missing fails", () => {
  const r = run({
    "paper2notes/notes/book5/ch01/25-3.html": `<!doctype html>${slide("dse-mc-pp-34", "../_local/dse/mc/25/pp_q34.png")}<script src="../../js/checks.js"></script><script src="../js/quiz-data.js"></script>`,
    "paper2notes/notes/book5/_local/dse/mc/25/pp_q34.png": true,
    "paper2notes/notes/book5/js/quiz-data.js": dataScript({ "dse-mc-pp-34": { option: "C" } }),
    "paper2notes/notes/dse/mc/25/pp_q34.png": true,
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [mcRecord("dse-mc-pp-34", null, null)],
  });
  assert.deepEqual(kinds(r), ["dse-mc-key-unsupported"]);
  assert.match(r.problems[0].detail, /quizKeys grades dse-mc-pp-34/);
  assert.equal(r.keys, 1);
});

test("a quiz-data.js key the store agrees with passes", () => {
  const r = run({
    "paper2notes/notes/book5/ch01/25-3.html": `<!doctype html>${slide("dse-mc-2024-32", "../_local/dse/mc/25/2024_q32.png")}<script src="../../js/checks.js"></script><script src="../js/quiz-data.js"></script>`,
    "paper2notes/notes/book5/js/quiz-data.js": dataScript({ "dse-mc-2024-32": { option: "D", pct: 68 } }),
    "paper2notes/notes/dse/mc/25/2024_q32.png": true,
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [mcRecord("dse-mc-2024-32", "D", 68)],
  });
  assert.deepEqual(r.problems, []);
  assert.equal(r.keys, 1);
});

test("a quiz-data.js no page loads is not checked", () => {
  const r = run({
    "paper2notes/notes/index.html": "<!doctype html><p>landing</p>",
    "paper2notes/notes/book5/js/quiz-data.js": dataScript({ "dse-mc-sap-35": { option: "D" } }),
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [],
  });
  assert.deepEqual(r.problems, []);
  assert.equal(r.keyStores, 0);
});

test("a slide with no image at all fails, so no page can claim a question it does not show", () => {
  const r = run({
    "paper2notes/notes/book5/ch01/25-1.html": `<!doctype html><article class="quiz-slide" id="dse-lq-2024-13"><h3>Radon</h3></article>`,
    "paper2db/qb-web-ui-staging/dse-mc/index.json": [],
  });
  assert.deepEqual(kinds(r), ["dse-slide-no-image"]);
});

test("a missing store fails loudly rather than passing vacuously", () => {
  const r = run({ "paper2notes/notes/index.html": "<!doctype html><p>landing</p>" });
  assert.deepEqual(kinds(r), ["store-missing"]);
});

test("loadStore reads a bare array and an {items:[...]} store", () => {
  const a = fixture({ "s.json": [mcRecord("x", "A", 50)] });
  const b = fixture({ "s.json": { items: [mcRecord("y", "B", 10)] } });
  try {
    assert.deepEqual([...loadStore(a.root + "/s.json").keys()], ["x"]);
    assert.deepEqual([...loadStore(b.root + "/s.json").keys()], ["y"]);
  } finally {
    a.cleanup();
    b.cleanup();
  }
});

test("the shipped tree passes the store cross-check", () => {
  const r = auditAgainstStore();
  assert.deepEqual(r.problems, [], r.problems.map((p) => `${p.kind} ${p.where}: ${p.detail}`).join("\n"));
  assert.ok(r.slides >= 130, `expected the full DSE deck set, saw ${r.slides} slides`);
  assert.ok(r.keys >= 100, `expected the published key set, saw ${r.keys} keys`);
});
