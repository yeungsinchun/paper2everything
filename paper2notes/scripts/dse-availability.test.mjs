// Guards the DSE availability record: which published questions are real, and
// which sections say in writing that they have none.
// A section that shows a long question the papers do not contain must fail here,
// not in a later run that reads "2012/24" and believes it is a long question.
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { checkAbsencePanels, checkPage, checkSnapshot, checkDocumentedReferenceCounts, cropRefs, loadAvailability, loadSource, referenceCounts, slideBlocks } from "./dse-availability.mjs";

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
const absenceCheck = (html, repo = realRepo) => {
  const availability = { ...loadAvailability(repo.repoRoot), repoRoot: repo.repoRoot };
  return checkAbsencePanels(html, { page: "fixture.html", availability });
};
const kinds = (r) => r.problems.map((p) => p.kind);

/* Crop files the long-question slides on a page show, kept only where the
   snapshot does not publish them, so a deleted crop fails a test instead of
   serving a broken image. */
function unpublishedSlideCrops(html, repoRoot) {
  return slideBlocks(html)
    .filter((slide) => slide.id.startsWith("dse-lq-"))
    .flatMap((slide) => cropRefs(slide.html).map((ref) => ({ slide: slide.id, ...ref })))
    .filter((ref) => !existsSync(join(repoRoot, "notes", "dse", ref.kind, ref.section, ref.file)));
}

const lqPanel = (slide, section) => `<section class="section-dse lo-quiz" id="lq-quiz" data-quiz="lq">
  <div class="quiz-slides"><article class="quiz-slide is-current" id="${slide}">
    <figure class="dse-paper"><img src="../_local/dse/lq/${section}/${slide.slice("dse-lq-".length).replace(/^\d+-/, "")}.png" alt=""></figure>
  </article></div>
</section>`;

test("the shipped snapshot and pages match the availability record", () => {
  const { problems } = checkSnapshot(realRepo);
  assert.deepEqual(problems, [], `published DSE sections that drift from notes/dse/availability.json:\n${problems.map((p) => `- ${p.kind}: ${p.detail}`).join("\n")}`);
});

/* The reader-facing contract for section 20: both section-20 pages show every
   long question the source papers hold for the section, each as a slide that
   points at a crop the snapshot really publishes. */
test("the reference counts docs/ARCHITECTURE.md quotes are counted from the pages", () => {
  /* The doc quotes these numbers, so they must be derived, never hand-copied. */
  const counts = referenceCounts(PAPER2NOTES);
  assert.equal(
    counts.books.book2.total,
    counts.books.book2.png + counts.books.book2.pdf,
    "book2 PNG + PDF counts must add up",
  );
  const sum = Object.values(counts.books).reduce((n, c) => n + c.total, 0);
  assert.ok(sum >= counts.total.total, "per-book totals cannot exceed the distinct total");

  const doc = readFileSync(resolve(PAPER2NOTES, "..", "docs", "ARCHITECTURE.md"), "utf8");
  const problems = checkDocumentedReferenceCounts(doc, counts);
  assert.deepEqual(problems, [], `docs/ARCHITECTURE.md quotes stale DSE reference counts:\n${problems.map((p) => `- ${p.detail}`).join("\n")}`);
});

test("a stale count in the doc is caught", () => {
  const counts = { total: { total: 10, png: 6, pdf: 4 }, books: { book2: { total: 8, png: 0, pdf: 8 } } };
  const doc = "10 distinct `_local/dse` references are used (Book 2: 8 = 0 PNG + 8 PDFs).";
  assert.deepEqual(checkDocumentedReferenceCounts(doc, counts), []);

  const staleTotal = checkDocumentedReferenceCounts(doc.replace("10 distinct", "11 distinct"), counts);
  assert.ok(staleTotal.some((p) => p.kind === "dse-doc-reference-total-stale"), JSON.stringify(staleTotal));

  const staleBook = checkDocumentedReferenceCounts(doc.replace("8 = 0 PNG + 8 PDFs", "9 = 1 PNG + 8 PDFs"), counts);
  assert.ok(staleBook.some((p) => p.kind === "dse-doc-reference-count-stale"), JSON.stringify(staleBook));
});

test("section 20 shows every electrostatics long question the source holds", () => {
  const source = loadSource(PAPER2NOTES);
  assert.ok(source.ok, `paper2db tracked inputs not found beside paper2notes: ${source.note}`);
  const expected = source.lqBySection.get(20) || [];
  assert.deepEqual([...expected].sort(), ["2013-q11", "2020-q9", "2024-q9", "2026-q7"]);

  for (const page of ["20-1.html", "20-2.html"]) {
    const rel = join("notes", "book4", "ch01-electrostatics", page);
    const html = readFileSync(join(PAPER2NOTES, rel), "utf8");
    const problems = checkPage(html, { page: rel, availability: { ...loadAvailability(PAPER2NOTES), repoRoot: PAPER2NOTES }, source }).problems;
    assert.deepEqual(problems, [], `${page}: ${problems.map((p) => `- ${p.kind}: ${p.detail}`).join("\n")}`);

    const slides = slideBlocks(html).filter((slide) => slide.id.startsWith("dse-lq-"));
    for (const key of expected) {
      const [year, n] = key.match(/^(\d+)-q(\d+)$/).slice(1);
      const slide = slides.find((s) => s.id === `dse-lq-${year}-${n}`);
      assert.ok(slide, `${page} has no slide ${key}`);
      const crop = cropRefs(slide.html).find((ref) => ref.kind === "lq" && ref.section === "20");
      assert.ok(crop, `${page} slide ${key} shows no published crop`);
      assert.equal(crop.file, `${year}-q${n}.png`, `${page} slide ${key} shows ${crop.file}`);
      assert.ok(
        existsSync(join(PAPER2NOTES, "notes", "dse", "lq", "20", crop.file)),
        `${page} slide ${key} points at notes/dse/lq/20/${crop.file}, which the snapshot does not publish`,
      );
    }
    assert.deepEqual(unpublishedSlideCrops(html, PAPER2NOTES), [], `${page} shows a crop the snapshot does not publish`);
  }
});

test("the section-20 crop check fails when a published crop is removed", () => {
  const root = mkdtempSync(join(tmpdir(), "p2e-dse-crop-"));
  const dir = join(root, "notes", "dse", "lq", "20");
  mkdirSync(dir, { recursive: true });
  const keys = ["2013-11", "2020-9", "2024-9", "2026-7"];
  const html = keys
    .map((key) => {
      const [year, n] = key.split("-");
      return `<article class="quiz-slide" id="dse-lq-${year}-${n}"><img src="../_local/dse/lq/20/${year}-q${n}.png" alt=""></article>`;
    })
    .join("\n");
  for (const key of keys) {
    const [year, n] = key.split("-");
    writeFileSync(join(dir, `${year}-q${n}.png`), "png");
  }
  assert.deepEqual(unpublishedSlideCrops(html, root), []);

  rmSync(join(dir, "2024-q9.png"));
  assert.deepEqual(unpublishedSlideCrops(html, root), [{ slide: "dse-lq-2024-9", kind: "lq", section: "20", file: "2024-q9.png" }]);
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

test("a slide that names one question and shows another fails", () => {
  const slide = (id, crop) => `<section class="section-dse lo-quiz" id="lq-quiz" data-quiz="lq">
  <div class="quiz-slides"><article class="quiz-slide is-current" id="${id}">
    <figure class="dse-paper"><img src="../_local/dse/lq/20/${crop}.png" alt=""></figure>
  </article></div>
</section>`;
  const bad = pageCheck(slide("dse-lq-2013-11", "2020-q9"));
  assert.ok(kinds(bad).includes("dse-lq-slide-crop-mismatch"), `expected dse-lq-slide-crop-mismatch, got ${JSON.stringify(bad)}`);
  assert.deepEqual(kinds(pageCheck(slide("dse-lq-2013-11", "2013-q11"))), []);
});

test("a placeholder slide passes only where the record says placeholder", () => {
  /* Section 21 still publishes only its placeholder; section 20 publishes real crops. */
  assert.deepEqual(kinds(pageCheck(lqPanel("dse-lq-21-sample", 21))), []);

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
    ["real-crop", ["sample.png", "2013-q1.png"], "dse-availability-real-with-placeholder"],
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

test("a written absence must match the record and name the paper and its question range", () => {
  const note = (section, body) => `<p class="dse-lq-none" data-lq-none="${section}">${body}</p>`;
  const evidence = "The 2012 long-question paper has questions 1 to 11.";

  /* No record for the stated section: the statement must fail. */
  assert.deepEqual(kinds(absenceCheck(note("99", evidence))), ["dse-lq-none-undeclared"]);
  /* The record says real-crop: the statement contradicts it. */
  assert.deepEqual(kinds(absenceCheck(note("20", evidence))), ["dse-lq-none-contradicts-record"]);
  /* The words name no paper and no range: the statement must fail. */
  assert.deepEqual(kinds(absenceCheck(note("21", "No long question is published for this section."))), ["dse-lq-none-no-evidence"]);
  /* A placeholder section with checkable words passes. */
  assert.deepEqual(kinds(absenceCheck(note("21", evidence))), []);
});