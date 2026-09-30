// Acceptance tests for leak-check.mjs: node --test paper2notes/scripts/leak-check.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFingerprints, numset, runLeakCheck, tokens } from "./leak-check.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const bank = JSON.parse(readFileSync(resolve(here, "../notes/qb/data/qb_book5.json"), "utf8")).items;
const fp = loadFingerprints();

function page(body, head = "") {
  const dir = mkdtempSync(join(tmpdir(), "leak-"));
  const file = join(dir, "page.html");
  writeFileSync(file, `<!doctype html><html><head><title>t</title>${head}</head><body>${body}</body></html>`);
  return file;
}
const levels = (file) => runLeakCheck({ files: [file] }).errors.map((e) => e.split(" ")[0]);

test("baseline: current notes pass", () => {
  assert.deepEqual(runLeakCheck().errors, []);
});

test("stem paste fails L1", () => {
  const item = bank.find((x) => x.id === "PHY15011101");
  assert.ok(levels(page(`<p>${item.stem.text.replace(/\n/g, "<br>")}</p>`)).includes("L1"));
});

test("numeric reword fails L2.2 and not L1", () => {
  const item = bank.find((x) => {
    const nums = numset(tokens(x.stem.text + "\n" + x.subparts.map((s) => s.text).join("\n")));
    return nums.size >= 4 && nums.size <= 8 && fp.items.find((i) => i.id === x.id)?.nums.length;
  });
  const nums = [...numset(tokens(item.stem.text + "\n" + item.subparts.map((s) => s.text).join("\n")))];
  const found = levels(page(`<p>A different setter writes: using ${nums.join(", then ")} as the given data, find the answer.</p>`));
  assert.ok(found.includes("L2.2"), found.join());
  assert.ok(!found.includes("L1"));
});

test("item id cited fails L4; deck meta exempts", () => {
  assert.ok(levels(page("<p>See PHY15011101 for practice.</p>")).includes("L4"));
  const item = bank.find((x) => x.id === "PHY15011101");
  const deck = page(`<p>${item.stem.text}</p><p>PHY15011101</p>`, '<meta name="leak-check" content="deck">');
  assert.deepEqual(levels(deck), []);
});
