// Guards the quiz answer contract that js/checks.js grades against.
// A broken key or an unkeyed DSE slide fails here instead of in a student's browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const AUDIT = join(ROOT, "paper2notes", "scripts", "quiz-audit.mjs");

function audit() {
  const out = execFileSync(process.execPath, [AUDIT, "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out);
}

const report = audit();
const pages = report.pages;

test("every shipped notes page is covered by the audit", () => {
  assert.ok(pages.length >= 60, `expected at least 60 pages, got ${pages.length}`);
});

test("no multiple-choice check has a key with no matching option", () => {
  const bad = pages.flatMap((p) => p.problems.filter((x) => x.kind === "mc-key-unmatched").map((x) => `${p.page}: ${x.detail}`));
  assert.deepEqual(bad, [], `data-answer points at a missing option:\n${bad.join("\n")}`);
});

test("no true/false item has a key outside true|false", () => {
  const bad = pages.flatMap((p) => p.problems.filter((x) => x.kind === "tf-key-invalid").map((x) => `${p.page}: ${x.detail}`));
  assert.deepEqual(bad, [], `data-answer is not a true/false value:\n${bad.join("\n")}`);
});

test("every true/false item sits inside a box the runtime binds handlers on", () => {
  const bad = pages.flatMap((p) => p.problems.filter((x) => x.kind === "tf-item-unwired").map((x) => `${p.page}: ${x.detail}`));
  assert.deepEqual(bad, [], `True/False buttons with no handler:\n${bad.join("\n")}`);
});

test("every DSE MC slide the pages show has an answer key", () => {
  const bad = pages.flatMap((p) => p.problems.filter((x) => x.kind === "dse-mc-no-key" || x.kind === "dse-mc-key-no-option" || x.kind === "dse-mc-key-bad-option").map((x) => `${p.page}: ${x.detail}`));
  assert.deepEqual(bad, [], `DSE MC slides that cannot be graded:\n${bad.join("\n")}`);
});

test("every graded quiz sits on a page that loads its checks script", () => {
  const bad = pages
    .filter((p) => (p.mc + p.tf + p.sa + p.dseMc > 0))
    .flatMap((p) => p.problems.filter((x) => x.kind === "no-checks-script" || x.kind === "checks-script-404").map((x) => `${p.page}: ${x.detail}`));
  assert.deepEqual(bad, [], `quiz markup with no grading script:\n${bad.join("\n")}`);
});

test("no page repeats an element id", () => {
  const bad = pages.flatMap((p) => p.problems.filter((x) => x.kind === "duplicate-id").map((x) => `${p.page}: ${x.detail}`));
  assert.deepEqual(bad, [], `duplicate ids:\n${bad.join("\n")}`);
});

test("the audit still finds the quizzes it is meant to guard", () => {
  const total = pages.reduce((a, p) => a + p.mc + p.tf + p.sa + p.dseMc, 0);
  assert.ok(total > 200, `expected the audit to see the full quiz set, saw ${total}`);
});

test("every DSE question a page shows is one the papers hold", () => {
  const kinds = ["dse-lq-not-in-source", "dse-lq-wrong-section", "dse-lq-outside-paper-range", "dse-question-not-in-source", "dse-availability-undeclared", "dse-lq-placeholder-undeclared", "dse-lq-none-undeclared", "dse-lq-none-contradicts-record", "dse-lq-none-no-evidence"];
  const bad = [
    ...report.snapshot.problems.filter((x) => kinds.includes(x.kind)),
    ...pages.flatMap((p) => p.problems.filter((x) => kinds.includes(x.kind)).map((x) => `${p.page}: ${x.detail}`)),
  ];
  assert.deepEqual(bad, [], `DSE slides or notes that drift from notes/dse/availability.json:\n${bad.join("\n")}`);
});

test("every section that publishes only placeholders says so on a page", () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "paper2notes", "notes", "dse", "availability.json"), "utf8"));
  const placeholderSections = Object.entries(manifest.sections)
    .filter(([, kinds]) => kinds.lq?.state === "placeholder")
    .map(([section]) => section)
    .sort();
  assert.ok(placeholderSections.length >= 5, `expected the placeholder sections to be recorded, saw ${placeholderSections.join(", ")}`);

  const stated = new Set();
  for (const page of pages) {
    for (const note of page.informational.filter((x) => x.kind === "dse-lq-none-stated")) {
      stated.add(note.detail.match(/^lq\/(\d+)/)?.[1]);
      assert.match(note.detail, /records it as placeholder/, `${page.page}: ${note.detail}`);
    }
  }
  assert.deepEqual([...stated].sort(), placeholderSections, "every section that publishes only placeholders must state it on a page, with the reason from notes/dse/availability.json");
});