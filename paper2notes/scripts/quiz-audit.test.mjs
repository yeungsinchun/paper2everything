// Guards the quiz answer contract that js/checks.js grades against.
// A broken key or an unkeyed DSE slide fails here instead of in a student's browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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

test("every DSE slide points at a crop that is actually published", () => {
  const bad = (report.store?.problems || [])
    .filter((x) => x.kind === "dse-slide-image-missing" || x.kind === "dse-slide-no-image")
    .map((x) => `${x.where}: ${x.detail}`);
  assert.deepEqual(bad, [], `slides that show no question:\n${bad.join("\n")}`);
});

test("every graded DSE MC key is one paper2db's answer store backs", () => {
  const bad = (report.store?.problems || []).map((x) => `${x.where}: ${x.detail}`);
  assert.deepEqual(bad, [], `keys no marking scheme supports:\n${bad.join("\n")}`);
  assert.ok(report.store.keys > 100, `expected the store cross-check to see the published keys, saw ${report.store.keys}`);
});

test("the audit still finds the quizzes it is meant to guard", () => {
  const total = pages.reduce((a, p) => a + p.mc + p.tf + p.sa + p.dseMc, 0);
  assert.ok(total > 200, `expected the audit to see the full quiz set, saw ${total}`);
});