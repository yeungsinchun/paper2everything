// Guards the DSE availability record: which published questions are real, and
// which sections say in writing that they have none.
// A section that shows a long question the papers do not contain must fail here,
// not in a later run that reads "2012/24" and believes it is a long question.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { checkPage, checkSnapshot, loadAvailability, loadSource } from "./dse-availability.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAPER2NOTES = resolve(HERE, "..");

/* A throwaway checkout: one paper2db beside one paper2notes. */
function fakeRepo({ manifest, sections = [], lq = {}, mc = {}, starts = {} }) {
  const root = mkdtempSync(join(tmpdir(), "p2e-dse-"));
  const notes = join(root, "p2n");
  const db = join(root, "paper2db");
  mkdirSync(join(db, "metadata", "lq"), { recursive: true });
  mkdirSync(join(db, "metadata", "mc"), { recursive: true });
  writeFileSync(join(db, "metadata", "lq", "llm_classifications.json"), JSON.stringify(lq));
  writeFileSync(join(db, "metadata", "mc", "llm_classifications.json"), JSON.stringify(mc));
  for (const [year, questions] of Object.entries(starts)) {
    mkdirSync(join(db, "tests", "reconstructed", "lq", year), { recursive: true });
    writeFileSync(join(db, "tests", "reconstructed", "lq", year, "starts.json"), JSON.stringify({ questions: questions.map((q) => ({ q })) }));
  }
  if (manifest) {
    mkdirSync(join(notes, "notes", "dse"), { recursive: true });
    writeFileSync(join(notes, "notes", "dse", "availability.json"), JSON.stringify(manifest));
  }
  for (const [kind, section, files] of sections) {
    mkdirSync(join(notes, "notes", "dse", kind, section), { recursive: true });
    for (const name of files) writeFileSync(join(notes, "notes", "dse", kind, section, name), "png");
  }
  return notes;
}

const realRepo = { repoRoot: PAPER2NOTES };

const pageCheck = (html, repo = realRepo) => {
  const availability = { ...loadAvailability(repo.repoRoot), repoRoot: repo.repoRoot };
  return checkPage(html, { page: "fixture.html", availability, source: loadSource(repo.repoRoot) });
};
const kinds = (r) => r.problems.map((p) => p.kind);

const lqPanel = (slide, section) => `<section class="section-dse lo-quiz" id="lq-quiz" data-quiz="lq">
  <div class="quiz-slides"><article class="quiz-slide is-current" id="${slide}">
    <figure class="dse-paper"><img src="../_local/dse/lq/${section}/${slide.slice("dse-lq-".length).replace(/^\d+-/, "")}.png" alt=""></figure>
  </article></div>
</section>`;

test("the shipped snapshot and pages match the availability record", () => {
  const { problems } = checkSnapshot(realRepo);
  assert.deepEqual(problems, [], `published DSE sections that drift from notes/dse/availability.json:\n${problems.map((p) => `- ${p.kind}: ${p.detail}`).join("\n")}`);
});

test("a slide claiming a long question the paper does not hold fails", () => {
  const r = pageCheck(lqPanel("dse-lq-2012-24", 20));
  assert.ok(kinds(r).includes("dse-lq-not-in-source"), `expected dse-lq-not-in-source, got ${JSON.stringify(r)}`);
  assert.match(r.problems.find((p) => p.kind === "dse-lq-not-in-source").detail, /1 to 11/);
});

test("a slide naming a real long question of another section fails", () => {
  /* 2012/11 is a real long question, but the source files it under sections 25, 26 and 27. */
  const r = pageCheck(lqPanel("dse-lq-2012-11", 20));
  assert.ok(kinds(r).includes("dse-lq-wrong-section"), `expected dse-lq-wrong-section, got ${JSON.stringify(r)}`);
});

test("a placeholder slide passes only where the record says placeholder", () => {
  assert.deepEqual(kinds(pageCheck(lqPanel("dse-lq-20-sample", 20))), []);

  const real = fakeRepo({
    manifest: { placeholderFiles: ["sample.png"], sections: { 30: { lq: { state: "real-crop", reason: "a crop" } } } },
    sections: [["lq", "30", ["sample.png"]]],
    lq: { "2012-q1": { sections: [30] } },
    mc: [],
    starts: { 2012: [1] },
  });
  const bad = pageCheck(lqPanel("dse-lq-30-sample", 30), { repoRoot: real });
  assert.ok(kinds(bad).includes("dse-lq-placeholder-undeclared"), `expected dse-lq-placeholder-undeclared, got ${JSON.stringify(bad)}`);
});

test("an undeclared section fails", () => {
  const noManifest = fakeRepo({ sections: [["lq", "30", ["sample.png"]]], lq: {}, mc: [], starts: {} });
  const snapshot = checkSnapshot({ repoRoot: noManifest });
  assert.ok(snapshot.problems.some((p) => p.kind === "dse-manifest-missing"), JSON.stringify(snapshot.problems));

  const undeclared = fakeRepo({
    manifest: { placeholderFiles: ["sample.png"], sections: {} },
    sections: [["lq", "30", ["sample.png"]]],
    lq: {},
    mc: [],
    starts: {},
  });
  const rows = checkSnapshot({ repoRoot: undeclared });
  assert.ok(rows.problems.some((p) => p.kind === "dse-availability-undeclared"), JSON.stringify(rows.problems));
});

test("a published directory must match the state it declares", () => {
  const cases = [
    ["real-crop", ["sample.png"], "dse-availability-placeholder-declared-real"],
    ["placeholder", ["2013-q1.png"], "dse-availability-real-declared-placeholder"],
    ["none-in-source", ["sample.png"], "dse-availability-none-in-source-with-files"],
  ];
  for (const [state, files, expected] of cases) {
    const repo = fakeRepo({
      manifest: { placeholderFiles: ["sample.png"], sections: { 30: { lq: { state, reason: "a reason" } } } },
      sections: [["lq", "30", files]],
      lq: {},
      mc: [],
      starts: {},
    });
    const { problems } = checkSnapshot({ repoRoot: repo });
    assert.ok(problems.some((p) => p.kind === expected), `${state} + ${files}: expected ${expected}, got ${JSON.stringify(problems)}`);
  }
});

test("none-in-source is refused when the source papers do hold such a question", () => {
  const repo = fakeRepo({
    manifest: { placeholderFiles: ["sample.png"], sections: { 20: { lq: { state: "none-in-source", reason: "the paper has none" } } } },
    sections: [],
    lq: { "2013-q11": { sections: [20] } },
    mc: [],
    starts: { 2013: [11] },
  });
  const { problems } = checkSnapshot({ repoRoot: repo });
  assert.ok(problems.some((p) => p.kind === "dse-availability-contradicts-source"), JSON.stringify(problems));
});

test("a crop file that names a question the source has not got fails", () => {
  const repo = fakeRepo({
    manifest: { placeholderFiles: ["sample.png"], sections: { 20: { lq: { state: "real-crop", reason: "a reason" } } } },
    sections: [["lq", "20", ["2012-q24.png"]]],
    lq: { "2012-q11": { sections: [20] } },
    mc: [],
    starts: { 2012: [11] },
  });
  const { problems } = checkSnapshot({ repoRoot: repo });
  assert.ok(problems.some((p) => p.kind === "dse-question-not-in-source"), JSON.stringify(problems));
});

test("a written absence must name the paper and its question range", () => {
  const note = (body) => `<p class="dse-lq-none" data-lq-none="20">${body}</p>`;
  assert.deepEqual(kinds(pageCheck(note("No long question is published for this section."))), ["dse-lq-none-no-evidence"]);
  assert.deepEqual(kinds(pageCheck(note("The 2012 long-question paper has questions 1 to 11."))), []);

  const real = fakeRepo({
    manifest: { placeholderFiles: ["sample.png"], sections: { 20: { lq: { state: "real-crop", reason: "a crop" } } } },
    sections: [["lq", "20", ["2013-q11.png"]]],
    lq: { "2013-q11": { sections: [20] } },
    mc: [],
    starts: { 2013: [11] },
  });
  const contradicts = pageCheck(note("The 2012 long-question paper has questions 1 to 11."), { repoRoot: real });
  assert.ok(kinds(contradicts).includes("dse-lq-none-contradicts-record"), JSON.stringify(contradicts));
});