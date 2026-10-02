// Acceptance tests for leak-check.mjs: node --test paper2notes/scripts/leak-check.test.mjs
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkBlocks, DEFAULT_BASELINE, loadFingerprints, numset, runLeakCheck, tokens } from "./leak-check.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const bank = JSON.parse(readFileSync(resolve(here, "../notes/qb/data/qb_book5.json"), "utf8")).items;
const fp = loadFingerprints();
const fixtureRoot = mkdtempSync(join(here, ".leak-test-"));
after(() => rmSync(fixtureRoot, { recursive: true, force: true }));
const staging = resolve(here, "../../paper2db/qb-web-ui-staging");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

function page(body, head = "") {
  const dir = mkdtempSync(join(fixtureRoot, "page-"));
  const file = join(dir, "page.html");
  writeFileSync(file, `<!doctype html><html><head><title>t</title>${head}</head><body>${body}</body></html>`);
  return file;
}
const levels = (file) => runLeakCheck({ files: [file] }).errors.map((e) => e.split(" ")[0]);

test("baseline: current notes pass with no stale content allowances", () => {
  const result = runLeakCheck();
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.stale, []);
  assert.equal(result.baselined, readJson(DEFAULT_BASELINE).allowed.length);
});

test("baselined pages reject an appended stem and numeric reword", () => {
  const stem = bank.find((item) => item.id === "PHY15011101").stem.text;
  for (const [path, body, level, id] of [
    ["book5/ch01-radiation-and-radioactivity/25-1.html", stem, "L1", "PHY15011101"],
    ["book5/ch02-rate-of-decay-and-uses-of-radionuclides/26-2.html", "Device uses isotope 241; lifetime 432 years; service interval 100 years; retirement fraction 80 percent.", "L2.2", "PHY15023108"],
  ]) {
    const file = resolve(here, "../notes", path);
    const original = readFileSync(file, "utf8");
    try {
      writeFileSync(file, original.replace(/<\/body>/i, `<p>${body}</p></body>`));
      const result = runLeakCheck();
      assert.ok(result.errors.some((error) => error.startsWith(`${level} `) && error.includes(`item ${id}:`)), result.errors.join("\n"));
      assert.ok(result.stale.some((key) => key.startsWith(`${level}|notes/${path}|${id}|`)));
    } finally {
      writeFileSync(file, original);
    }
  }
});

test("content evidence changes for additional copies across all levels", () => {
  const stem = bank.find((item) => item.id === "PHY15011101").stem.text;
  const answer = bank.find((item) => item.answer?.worked && fp.items.find((row) => row.id === item.id)?.w.length >= 2);
  for (const [block, level, id] of [
    [stem, "L1", "PHY15011101"],
    ["241 432 100 80", "L2.2", "PHY15023108"],
    [answer.answer.worked, "L3", answer.id],
    ["See PHY15011101 for practice.", "L4", "PHY15011101"],
  ]) {
    const find = (blocks) => checkBlocks(blocks, fp).find((finding) => finding.level === level && finding.item === id);
    const original = find([block]);
    assert.ok(original, `${level} ${id}`);
    assert.equal(find([block, "Unrelated prose."]).contentHash, original.contentHash);
    assert.notEqual(find([block, block]).contentHash, original.contentHash);
  }
  const first = checkBlocks(["241 432 100 80"], fp).find((finding) => finding.level === "L2.2" && finding.item === "PHY15023108");
  const reword = checkBlocks(["Given 241 then 432 then 100 then 80."], fp).find((finding) => finding.level === "L2.2" && finding.item === "PHY15023108");
  assert.notEqual(first.contentHash, reword.contentHash);
});

test("CLI cannot authorize leaks or overwrite the baseline", () => {
  const before = readFileSync(DEFAULT_BASELINE);
  const file = page("<p>See PHY15011101 for practice.</p>");
  const result = spawnSync(process.execPath, [join(here, "leak-check.mjs"), "--update-baseline", file], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unknown option: --update-baseline/);
  assert.deepEqual(readFileSync(DEFAULT_BASELINE), before);
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

test("fingerprints cover all canonical and published identities", () => {
  const paths = [
    ...readdirSync(join(staging, "qb/items")).filter((name) => name.endsWith(".json")).map((name) => join(staging, "qb/items", name)),
    join(staging, "dse-mc/index.json"),
    join(staging, "dse-lq/index.json"),
    ...readdirSync(resolve(here, "../notes/qb/data")).filter((name) => name.endsWith(".json")).map((name) => resolve(here, "../notes/qb/data", name)),
  ];
  const ids = new Set(fp.items.map((item) => item.id));
  for (const path of paths) {
    const data = readJson(path);
    for (const item of (Array.isArray(data) ? data : data.items) ?? []) {
      assert.ok(ids.has(item.id), `${path}: missing ${item.id}`);
    }
  }
});

test("Book 2 and Book 4 canonical stems fail L1", () => {
  for (const [name, id] of [["QB_201", "PHY12013101"], ["QB_401", "PHY14013001"]]) {
    const item = readJson(join(staging, `qb/items/${name}.json`)).items.find((row) => row.id === id);
    const errors = runLeakCheck({ files: [page(`<p>${item.stem.text}</p>`)] }).errors;
    assert.ok(errors.some((error) => error.startsWith("L1 ") && error.includes(`item ${id}:`)), errors.join("\n"));
  }
});

test("DSE stems and textless LQ identities are protected in both representations", () => {
  const mc = readJson(join(staging, "dse-mc/index.json"))[0];
  const published = readJson(resolve(here, "../notes/qb/data/dse_mc.json")).items[0];
  const lq = readJson(join(staging, "dse-lq/index.json")).items[0];
  const errors = runLeakCheck({ files: [page(`<p>${mc.statementPreview}</p><p>${mc.id} ${published.id} ${lq.id}</p>`)] }).errors;
  for (const id of [mc.id, published.id]) {
    assert.ok(errors.some((error) => error.startsWith("L1 ") && error.includes(`item ${id}:`)), errors.join("\n"));
  }
  for (const id of [mc.id, published.id, lq.id]) {
    assert.ok(errors.some((error) => error.startsWith("L4 ") && error.includes(`item ${id}:`)), errors.join("\n"));
  }
});

test("generator retains index-only identities without masking available text", () => {
  const root = mkdtempSync(join(fixtureRoot, "corpus-"));
  const save = (path, data) => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(data));
  };
  save("staging/qb/items/QB_201.json", { items: [{ id: "CANONICAL", stem: "A canonical protected question uses 12 34 56 78 for its given values." }] });
  save("staging/qb/items/index.json", { items: [{ id: "CANONICAL" }, { id: "INDEX_ONLY" }, { id: "LATER_TEXT" }] });
  save("staging/dse-mc/index.json", [{ id: "MC_ONLY" }]);
  save("staging/dse-lq/index.json", { items: [{ id: "LQ_ONLY" }] });
  save("data/mirror.json", { items: [{ id: "CANONICAL", stem: "An incomplete mirror." }, { id: "LATER_TEXT", stem: "This protected question has enough words to produce several unique fingerprints." }, { id: "MIRROR_ONLY" }] });
  const doc = JSON.parse(execFileSync("python3", ["-c", `
import importlib.util, json, sys
from pathlib import Path
spec = importlib.util.spec_from_file_location("leak_fingerprints", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.STAGING = Path(sys.argv[2]) / "staging"
module.DATA_DIR = Path(sys.argv[2]) / "data"
print(json.dumps(module.build()))
`, resolve(here, "../../paper2db/scripts/leak_fingerprints.py"), root], { encoding: "utf8", env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" } }));
  assert.deepEqual(doc.items.map((item) => item.id), ["CANONICAL", "INDEX_ONLY", "LATER_TEXT", "LQ_ONLY", "MC_ONLY", "MIRROR_ONLY"]);
  assert.equal(doc.items.find((item) => item.id === "CANONICAL").nums.length, 4);
  assert.ok(doc.items.find((item) => item.id === "LATER_TEXT").g.length >= 2);
  for (const item of doc.items.filter((item) => item.id.endsWith("ONLY"))) {
    assert.deepEqual([item.g, item.w, item.nums], [[], [], []]);
  }
});

test("SVG text is checked while deck exemptions still apply", () => {
  const item = bank.find((row) => row.id === "PHY15011101");
  const body = `<svg><text>${item.stem.text.replace(/\n/g, " ")}</text><text>${item.id}</text></svg>`;
  const errors = runLeakCheck({ files: [page(body)] }).errors;
  for (const level of ["L1", "L4"]) {
    assert.ok(errors.some((error) => error.startsWith(`${level} `) && error.includes(`item ${item.id}:`)), errors.join("\n"));
  }
  assert.deepEqual(levels(page(body, '<meta name="leak-check" content="deck">')), []);
});

test("only explicit HTML inputs and the fixed corpus are accepted by the CLI", () => {
  const html = page("<p>PHY12013101</p>");
  const cli = join(here, "leak-check.mjs");
  const valid = spawnSync(process.execPath, [cli, html], { encoding: "utf8" });
  assert.equal(valid.status, 1);
  assert.match(valid.stderr, /L4 .*item PHY12013101:/);
  const alternate = spawnSync(process.execPath, [cli, "--fingerprints", "unused.gz", html], { encoding: "utf8" });
  assert.notEqual(alternate.status, 0);
  assert.match(alternate.stderr, /unknown option: --fingerprints/);
  const brief = join(fixtureRoot, "brief.md");
  writeFileSync(brief, "PHY12013101");
  assert.throws(() => runLeakCheck({ files: [brief] }), /expected an HTML file/);
  const nonHtml = spawnSync(process.execPath, [cli, brief], { encoding: "utf8" });
  assert.notEqual(nonHtml.status, 0);
  assert.match(nonHtml.stderr, /expected an HTML file/);
});
