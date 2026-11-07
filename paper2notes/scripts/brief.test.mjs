// Acceptance tests for brief.mjs: node --test paper2notes/scripts/brief.test.mjs
//
// The tests drive the CLI against a temporary audit root (results + inventory)
// and a fake `pi`, so they need no model, no Chrome and no committed audit
// output. Leak-check runs for real against paper2notes/scripts/leak/fingerprints.v1.json.gz.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { buildBrief, briefPaths, itemRef, matchLos, pageLos, resolvePage, fallbackClusters, applyClusters, collectConcepts, pageItems } from "./brief.mjs";
import { mustFixItems, conceptCitationCounts } from "./audit/report.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const paper2notes = resolve(here, "..");
const briefCli = join(here, "brief.mjs");
const BOOK2_PAGE = "book2/ch03-forces-and-newton-i/index.html";
const BOOK5_PAGE = "book5/ch01-radiation-and-radioactivity/25-1.html"; // has no lo-block
const bank5 = JSON.parse(readFileSync(join(paper2notes, "notes/qb/data/qb_book5.json"), "utf8")).items;
const protectedItem = bank5.find(item => item.id === "PHY15011101");

const roots = [];
process.on("exit", () => { for (const root of roots) rmSync(root, { recursive: true, force: true }); });
function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), "brief-test-"));
  roots.push(root);
  return root;
}

/** One result file with the shape run.mjs writes: tiers → samples → answer.missing / judge.marking. */
function result({ id, bank, section, verdict = "gap", type = "mc", marks = 2, missing = [], lost = [], pointer_candidates = [] }) {
  const tierVerdict = verdict === "pass" ? "pass" : "gap";
  const sample = { answer: { missing: missing.map(concept => ({ concept })) }, judge: { cause: verdict === "pass" ? "ok" : "knowledge-gap", marking: lost.map(concept => ({ concept, verdict: "lost-knowledge" })) }, quote_check: { passed: true } };
  if (verdict === "pass") sample.judge.marking = [{ concept: "graded", verdict: "earned" }];
  return {
    id, bank, section, verdict, tiers: {
      S: { verdict: tierVerdict, samples: [sample] },
      B: { verdict: tierVerdict, samples: [sample] },
    },
    pointer_candidates,
  };
}

/** A temporary audit root: <root>/results/<bank>/<id>.json plus <root>/inventory/<bank>.json. */
function auditRoot({ bank, items, results }) {
  const root = tempRoot();
  mkdirSync(join(root, "results", bank), { recursive: true });
  mkdirSync(join(root, "inventory"), { recursive: true });
  writeFileSync(join(root, "inventory", `${bank}.json`), JSON.stringify({ bank, items }, null, 2));
  for (const file of results) writeFileSync(join(root, "results", bank, `${file.id}.json`), JSON.stringify(file, null, 2));
  return root;
}

/** A fake `pi` that answers the clustering call with `payload` and records its arguments. */
function fakePi(payload) {
  const dir = tempRoot();
  const bin = join(dir, "pi");
  const payloadFile = join(dir, "answer.json");
  const argvFile = join(dir, "argv.txt");
  writeFileSync(payloadFile, JSON.stringify(payload));
  writeFileSync(bin, `#!/bin/sh
if [ "$1" = "--version" ]; then echo fake-1; exit 0; fi
: > "${argvFile}"
for a in "$@"; do printf '%s\\n' "$a" >> "${argvFile}"; done
cat "${payloadFile}"
`, { mode: 0o755 });
  return { bin, argvFile };
}

function runCli(args, { env = {}, expectFailure = false } = {}) {
  const r = spawnSync(process.execPath, [briefCli, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
  if (!expectFailure) assert.equal(r.status, 0, `brief.mjs failed:\n${r.stdout}\n${r.stderr}`);
  return r;
}

const CONCEPTS = {
  netForce: "net force as the vector sum of coplanar forces",
  components: "resolving a force into perpendicular components at an angle",
  friction: "friction as a force opposing the tendency of motion",
};

test("--page resolves against books.json and refuses an unknown page", () => {
  const hit = resolvePage(BOOK2_PAGE);
  assert.equal(hit.bank, "QB_203");
  assert.equal(hit.section, "book2/ch03");
  assert.ok(hit.page.endsWith("notes/book2/ch03-forces-and-newton-i/index.html"));
  assert.equal(resolvePage("book2/ch03").section, "book2/ch03");
  assert.equal(resolvePage("25.1").section, "25-1");
  assert.throws(() => resolvePage("book2/ch03-forces-and-newton-i/nope.html"), /No notes page/);
});

test("learning objectives are read from the page: ids, positions and the no-block case", () => {
  const book2 = pageLos(readFileSync(resolve(paper2notes, "notes", BOOK2_PAGE), "utf8"));
  assert.equal(book2.present, true);
  assert.deepEqual(book2.block_ids, ["ch--lo-1"]);
  assert.equal(book2.los.length, 5);
  assert.equal(book2.los[4].text, "resolve a force into components along two perpendicular directions");
  assert.ok(book2.los.every(l => l.id === "ch--lo-1" && Number.isInteger(l.index)));

  const book5 = pageLos(readFileSync(resolve(paper2notes, "notes", BOOK5_PAGE), "utf8"));
  assert.equal(book5.present, false);
  assert.deepEqual(book5.los, []);
  assert.match(book5.note, /no learning-objective block/);
  assert.equal(matchLos("anything at all", book5).match, "page-has-no-lo-block");

  const lo = { present: true, block_ids: ["ch--lo-1"], los: [{ id: "ch--lo-1", index: 1, text: "describe inertia and mass" }, { id: "ch--lo-1", index: 2, text: "resolve a force into components" }] };
  assert.deepEqual(matchLos("resolving a force into components", lo).los.map(l => l.index), [2]);
  assert.equal(matchLos("photoelectric effect", lo).match, "unmatched");
});

test("item refs are leak-safe: no protected question id reaches a brief", () => {
  assert.equal(itemRef({ bank: "QB_501", dse: { slide: "dse-mc-2015-4" }, inventory_index: 3 }), "QB_501#3");
  assert.equal(itemRef({ bank: "DSE_25-1", id: "DSE_25-1:mc-2022-31", inventory_index: 0 }), "DSE_25-1#0");
  assert.equal(itemRef({ bank: "QB_501", inventory_index: null }), "QB_501#unmatched");
});

test("the brief clusters with one model call and keeps every missing concept", async () => {
  const bank = "QB_203";
  const root = auditRoot({
    bank,
    items: [
      { id: "QBITEM-1", part: "core", marks: 2, type: "mc" },
      { id: "QBITEM-2", part: "core", marks: 2, type: "mc" },
      { id: "QBITEM-3", part: "core", marks: 2, type: "mc" },
    ],
    results: [
      result({ id: "QBITEM-1", bank, section: "book2/ch03", missing: [CONCEPTS.netForce] }),
      result({ id: "QBITEM-2", bank, section: "book2/ch03", missing: [CONCEPTS.components], lost: [CONCEPTS.components] }),
      result({ id: "QBITEM-3", bank, section: "book2/ch03", missing: [CONCEPTS.netForce, CONCEPTS.components, CONCEPTS.friction] }),
    ],
  });
  const pi = fakePi({
    clusters: [
      { label: "Adding and splitting forces", concepts: [CONCEPTS.netForce, CONCEPTS.components], lo_indices: [5], note: "teach the component sum with a worked diagram" },
      { label: "Friction", concepts: [CONCEPTS.friction], lo_indices: [99], note: "" },
    ],
  });
  const out = join(root, "briefs");
  runCli(["--page", BOOK2_PAGE, "--results", join(root, "results"), "--out", out], { env: { PI_BIN: pi.bin } });

  const { json, markdown } = briefPaths(out, BOOK2_PAGE.replace(/\.html$/, ""));
  const brief = JSON.parse(readFileSync(json, "utf8"));
  assert.equal(brief.schema, "paper2everything.concept-brief.v1");
  assert.equal(brief.page, `notes/${BOOK2_PAGE}`);
  assert.equal(brief.section, "book2/ch03");
  assert.equal(brief.bank, bank);
  assert.deepEqual(brief.item_banks, [bank]);
  assert.equal(brief.counts.items, 3);
  assert.equal(brief.counts.concepts, 3);
  assert.equal(brief.model.called, true);
  assert.equal(brief.model.cluster_source, "model");

  // one call, and it carried the page, its LOs and the concepts
  const argv = readFileSync(pi.argvFile, "utf8");
  assert.match(argv, /meta\/muse-spark-1\.2-contributor/);
  assert.match(argv, /resolve a force into components along two perpendicular directions/);
  assert.match(argv, new RegExp(CONCEPTS.netForce.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  // two clusters, every concept exactly once, labels from the model
  assert.equal(brief.brief.length, 2);
  const texts = brief.brief.flatMap(c => c.concepts.map(x => x.text)).sort();
  assert.deepEqual(texts, [CONCEPTS.components, CONCEPTS.friction, CONCEPTS.netForce].sort());
  assert.equal(brief.brief[0].label, "Adding and splitting forces");
  assert.equal(brief.brief[0].note, "teach the component sum with a worked diagram");
  assert.equal(brief.brief[1].label, "Friction");
  // an LO index outside the page is dropped, not printed
  assert.deepEqual(brief.brief[1].lo_ids, ["ch--lo-1"]); // matched by text, not by the invented index 99
  assert.equal(brief.brief[1].los[0].index, 3);
  assert.equal(brief.brief[0].los[0].index, 5);
  assert.equal(brief.brief[0].concepts.every(c => c.lo_match === "model"), true);

  // the markdown is the same computation
  const md = readFileSync(markdown, "utf8");
  assert.match(md, /^# Concept brief — /m);
  for (const cluster of brief.brief) assert.match(md, new RegExp(`^## ${cluster.rank}\\. `, "m"));
  for (const cluster of brief.brief) assert.ok(md.includes(cluster.label), cluster.label);
  for (const concept of texts) assert.ok(md.includes(concept), concept);
  assert.equal((md.match(/^## \d+\. /gm) || []).length, brief.brief.length);
});

test("must-fix ranking is the audit rule, then the number of items that miss the concept", () => {
  const bank = "QB_203";
  const root = auditRoot({
    bank,
    items: [
      { id: "QBITEM-1", part: "core", marks: 2, type: "mc" },
      { id: "QBITEM-2", part: "core", marks: 2, type: "mc" },
      { id: "QBITEM-3", part: "core", marks: 6, type: "lq" },
      { id: "QBITEM-4", part: "core", marks: 1, type: "mc" },
      { id: "QBITEM-5", part: "core", marks: 1, type: "mc" },
      { id: "QBITEM-6", part: "core", marks: 1, type: "mc" },
      { id: "QBITEM-7", part: "core", marks: 1, type: "mc" },
    ],
    results: [
      result({ id: "QBITEM-1", bank, section: "book2/ch03", missing: ["shared gap"] }),
      result({ id: "QBITEM-2", bank, section: "book2/ch03", missing: ["shared gap"] }), // 2 failing core items -> must-fix
      result({ id: "QBITEM-3", bank, section: "book2/ch03", missing: ["long-question gap"], marks: 6, type: "lq" }), // 6 marks -> must-fix
      result({ id: "QBITEM-4", bank, section: "book2/ch03", missing: ["loner A"] }),
      result({ id: "QBITEM-5", bank, section: "book2/ch03", missing: ["loner B"] }),
      result({ id: "QBITEM-6", bank, section: "book2/ch03", missing: ["loner C"] }),
      result({ id: "QBITEM-7", bank, section: "book2/ch03", verdict: "pass", missing: [] }),
    ],
  });
  const pi = fakePi({
    clusters: [
      { label: "Shared gap", concepts: ["shared gap"], lo_indices: [4] },
      { label: "Long question gap", concepts: ["long-question gap"], lo_indices: [1] },
      { label: "Two gaps in one", concepts: ["loner A", "loner B"], lo_indices: [] },
      { label: "One more gap", concepts: ["loner C"], lo_indices: [] },
    ],
  });
  const out = join(root, "briefs");
  runCli(["--page", BOOK2_PAGE, "--results", join(root, "results"), "--out", out], { env: { PI_BIN: pi.bin } });
  const { json, markdown } = briefPaths(out, BOOK2_PAGE.replace(/\.html$/, ""));
  const brief = JSON.parse(readFileSync(json, "utf8"));

  // the brief's must-fix flags are the audit's, computed on the same items
  const items = pageItems(join(root, "results"), "book2/ch03");
  const auditMustFix = new Set(mustFixItems(items).map(i => i.id));
  assert.deepEqual([...auditMustFix].sort(), ["QBITEM-1", "QBITEM-2", "QBITEM-3"]);
  assert.equal(items.length, 7);
  assert.equal(brief.counts.must_fix_items, 3);
  assert.equal(brief.counts.must_fix_clusters, 2);
  const flagged = [...new Set(brief.brief.flatMap(c => c.concepts).filter(c => c.must_fix).flatMap(c => c.items.map(i => i.ref)))].sort();
  assert.deepEqual(flagged, ["QB_203#0", "QB_203#1", "QB_203#2"]);

  // order: must-fix clusters first, then the items missed
  assert.deepEqual(brief.brief.map(c => [c.label, c.must_fix, c.item_count]), [
    ["Shared gap", true, 2],
    ["Long question gap", true, 1],
    ["Two gaps in one", false, 2],
    ["One more gap", false, 1],
  ]);
  assert.match(brief.brief[0].must_fix_reasons.join(" "), /concept-cited-by-2\+-failing-core-items/);
  assert.match(brief.brief[1].must_fix_reasons.join(" "), /marks-at-least-4-with-known-section/);
  assert.deepEqual(brief.brief[2].must_fix_items, []);
  assert.equal(brief.brief[0].concepts[0].must_fix, true);
  assert.equal(brief.brief[2].concepts.every(c => c.must_fix === false), true);
  const md = readFileSync(markdown, "utf8");
  assert.ok(md.indexOf("MUST FIX") < md.indexOf("should fix"), "must-fix entries come first");
  assert.match(md, /^## 3\. should fix · Two gaps in one$/m);
});

test("a page with no learning-objective block says so instead of dropping the concept", () => {
  const bank = "QB_501";
  const root = auditRoot({
    bank,
    items: [{ id: "QBITEM-1", part: "core", marks: 2, type: "mc" }],
    results: [result({ id: "QBITEM-1", bank, section: "25-1", missing: ["the photoelectric equation solved from a graph"] })],
  });
  const out = join(root, "briefs");
  runCli(["--page", BOOK5_PAGE, "--results", join(root, "results"), "--out", out, "--no-model"]);
  const { json, markdown } = briefPaths(out, BOOK5_PAGE.replace(/\.html$/, ""));
  const brief = JSON.parse(readFileSync(json, "utf8"));
  assert.equal(brief.learning_objectives.present, false);
  assert.deepEqual(brief.brief[0].lo_ids, []);
  assert.equal(brief.brief[0].concepts[0].lo_match, "page-has-no-lo-block");
  assert.match(brief.brief[0].concepts[0].lo_note, /no learning-objective block/);
  const md = readFileSync(markdown, "utf8");
  assert.match(md, /Learning objectives blocked: none named — .*no learning-objective block/);
  assert.match(md, /the photoelectric equation solved from a graph/);
});

test("a deck item keeps its inventory handle and its pointer candidate is reported", () => {
  const bank = "DSE_25-1";
  const root = auditRoot({
    bank,
    items: [{ id: "DSE_25-1:mc-2022-31", part: "core", marks: 1, type: "mc", dse: { section: "25-1", slide: "dse-mc-2022-31", page: `notes/${BOOK5_PAGE}` } }],
    results: [{
      id: "DSE_25-1:mc-2022-31",
      bank,
      parent_bank: "QB_501",
      section: "25-1",
      verdict: "gap",
      tiers: { S: { verdict: "gap", samples: [{ answer: { missing: [{ concept: "how a voltage divider shares the supply" }] }, judge: { cause: "knowledge-gap", marking: [] } }] }, B: { verdict: "gap", samples: [] } },
      pointer_candidates: [{ page: `notes/${BOOK5_PAGE}`, section: "25-1", anchor: "knockout", heading: "Knocking an electron out", rank: "primary", score: 3 }],
    }],
  });
  const out = join(root, "briefs");
  runCli(["--page", BOOK5_PAGE, "--results", join(root, "results"), "--out", out, "--no-model"]);
  const brief = JSON.parse(readFileSync(briefPaths(out, BOOK5_PAGE.replace(/\.html$/, "")).json, "utf8"));
  assert.equal(brief.bank, "QB_501");
  assert.deepEqual(brief.item_banks, [bank]);
  assert.deepEqual(brief.brief[0].concepts[0].items.map(i => i.ref), ["DSE_25-1#0"]);
  assert.deepEqual(brief.brief[0].anchors.map(a => a.anchor), ["knockout"]);
});

test("leak check runs over both files; a protected stem blocks the write", () => {
  const bank = "QB_203";
  const clean = auditRoot({
    bank,
    items: [{ id: protectedItem.id, part: "core", marks: 2, type: "mc" }],
    results: [result({ id: protectedItem.id, bank, section: "book2/ch03", missing: ["the vector sum of coplanar forces"] })],
  });
  const out = join(clean, "briefs");
  runCli(["--page", BOOK2_PAGE, "--results", join(clean, "results"), "--out", out, "--no-model"]);
  const { json, markdown } = briefPaths(out, BOOK2_PAGE.replace(/\.html$/, ""));
  const brief = JSON.parse(readFileSync(json, "utf8"));
  assert.equal(brief.leak_check.result, "clean");
  assert.equal(brief.leak_check.findings, "none");
  assert.equal(brief.leak_check.checked_by, "paper2notes/scripts/leak-check.mjs");
  assert.match(brief.leak_check.levels, /L4 protected item id/);
  // the real item id lives in the result file but never in the brief
  assert.ok(readFileSync(join(clean, "results", bank, `${protectedItem.id}.json`), "utf8").includes(protectedItem.id));
  assert.ok(!readFileSync(json, "utf8").includes(protectedItem.id));
  assert.ok(!readFileSync(markdown, "utf8").includes(protectedItem.id));
  assert.match(readFileSync(markdown, "utf8"), /QB_203#0/);
  // a deck slide id is a protected id too (rule L4), so it never prints either
  assert.ok(!readFileSync(markdown, "utf8").includes("dse-mc-"));

  // a concept that reproduces a protected stem fails L1 and nothing is written
  const dirty = auditRoot({
    bank,
    items: [{ id: protectedItem.id, part: "core", marks: 2, type: "mc" }],
    results: [result({ id: protectedItem.id, bank, section: "book2/ch03", missing: [protectedItem.stem.text.replace(/\s+/g, " ")] })],
  });
  const dirtyOut = join(dirty, "briefs");
  const failed = runCli(["--page", BOOK2_PAGE, "--results", join(dirty, "results"), "--out", dirtyOut, "--no-model"], { expectFailure: true });
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /leak-check found/);
  assert.match(failed.stderr, /L1 item PHY15011101/);
  assert.equal(existsSync(briefPaths(dirtyOut, BOOK2_PAGE.replace(/\.html$/, "")).json), false);
  assert.equal(existsSync(briefPaths(dirtyOut, BOOK2_PAGE.replace(/\.html$/, "")).markdown), false);

  // citing a protected item id is an L4 error too
  const citing = auditRoot({
    bank,
    items: [{ id: protectedItem.id, part: "core", marks: 2, type: "mc" }],
    results: [result({ id: protectedItem.id, bank, section: "book2/ch03", missing: [`see item ${protectedItem.id} for the stem`] })],
  });
  const l4 = runCli(["--page", BOOK2_PAGE, "--results", join(citing, "results"), "--out", join(citing, "briefs"), "--no-model"], { expectFailure: true });
  assert.equal(l4.status, 1);
  assert.match(l4.stderr, /L4 item PHY15011101/);
});

test("--dry-run writes nothing and prints the brief", () => {
  const bank = "QB_203";
  const root = auditRoot({
    bank,
    items: [{ id: "QBITEM-1", part: "core", marks: 2, type: "mc" }],
    results: [result({ id: "QBITEM-1", bank, section: "book2/ch03", missing: ["net force as the vector sum of coplanar forces"] })],
  });
  const out = join(root, "briefs");
  const r = runCli(["--page", BOOK2_PAGE, "--results", join(root, "results"), "--out", out, "--no-model", "--dry-run"]);
  assert.match(r.stdout, /dry run, nothing written/);
  assert.match(r.stdout, /leak-check OK \(\d+ blocks,/);
  assert.equal(existsSync(out), false);
});

test("--no-model clusters, the call is skipped, and an unknown option fails loudly", async () => {
  const bank = "QB_203";
  const root = auditRoot({
    bank,
    items: [
      { id: "QBITEM-1", part: "core", marks: 2, type: "mc" },
      { id: "QBITEM-2", part: "core", marks: 2, type: "mc" },
    ],
    results: [
      result({ id: "QBITEM-1", bank, section: "book2/ch03", missing: [CONCEPTS.netForce, CONCEPTS.components] }),
      result({ id: "QBITEM-2", bank, section: "book2/ch03", missing: [CONCEPTS.friction] }),
    ],
  });
  const out = join(root, "briefs");
  const pi = fakePi({ clusters: [{ label: "should not be used", concepts: [CONCEPTS.netForce] }] });
  runCli(["--page", BOOK2_PAGE, "--results", join(root, "results"), "--out", out, "--no-model"], { env: { PI_BIN: pi.bin } });
  assert.equal(existsSync(pi.argvFile), false, "no model call with --no-model");
  const brief = JSON.parse(readFileSync(briefPaths(out, BOOK2_PAGE.replace(/\.html$/, "")).json, "utf8"));
  assert.equal(brief.model.called, false);
  assert.equal(brief.model.cluster_source, "fallback");
  assert.deepEqual(brief.brief.flatMap(c => c.concepts.map(x => x.text)),
    // all three tie on item count and must-fix, so the label orders them
    ["friction as a force opposing the tendency of motion", "net force as the vector sum of coplanar forces", "resolving a force into perpendicular components at an angle"]);

  // concepts the model names twice, or invents, never lose a gap and never double-count
  const concepts = collectConcepts(pageItems(join(root, "results"), "book2/ch03"));
  const applied = applyClusters({ concepts, lo: { present: false, los: [] }, clusters: [
    { label: "a", concepts: [CONCEPTS.netForce, CONCEPTS.netForce, "invented concept"] },
    { label: "b", concepts: [CONCEPTS.components] },
  ] });
  assert.deepEqual(applied.flatMap(c => c.members.map(m => m.text)).sort(), [CONCEPTS.components, CONCEPTS.friction, CONCEPTS.netForce].sort());
  assert.equal(applied.length, 3);
  assert.equal(applied[2].source, "leftover");
  assert.equal(fallbackClusters(concepts).length, 3);

  const bad = runCli(["--page", BOOK2_PAGE, "--nope"], { expectFailure: true });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /unknown option --nope/);
  const missingPage = runCli([], { expectFailure: true });
  assert.match(missingPage.stderr, /--page .* is required/);
});

test("the exported builders work without the CLI and keep the two renderings in step", () => {
  const bank = "QB_203";
  const root = auditRoot({
    bank,
    items: [{ id: "QBITEM-1", part: "core", marks: 2, type: "mc" }],
    results: [result({ id: "QBITEM-1", bank, section: "book2/ch03", missing: ["net force as the vector sum of coplanar forces"], pointer_candidates: [{ page: `notes/${BOOK2_PAGE}`, anchor: "vector-forces", heading: "Adding and splitting forces", rank: "primary", score: 4 }] })],
  });
  const html = readFileSync(resolve(paper2notes, "notes", BOOK2_PAGE), "utf8");
  const items = pageItems(join(root, "results"), "book2/ch03");
  const concepts = collectConcepts(items);
  const built = buildBrief({
    page: BOOK2_PAGE,
    section: "book2/ch03",
    bank,
    title: "Forces and Newton I",
    html,
    items,
    clusters: applyClusters({ concepts, lo: pageLos(html), clusters: fallbackClusters(concepts) }),
    model: { pi: "test", called: false, cluster_source: "fallback", error: null },
  });
  assert.equal(built.brief.counts.concepts, 1);
  assert.match(built.markdown, /# Concept brief — Forces and Newton I/);
  assert.match(built.markdown, /notes\/book2\/ch03-forces-and-newton-i\/index\.html#vector-forces/);
  assert.match(built.markdown, /QB_203#0/);
  assert.equal(conceptCitationCounts(items).size, 1);
});

test("the CLI runs as a module import and as a script", () => {
  const source = readFileSync(briefCli, "utf8");
  assert.match(source, /if \(import\.meta\.url === `file:\/\/\$\{process\.argv\[1\]\}`\)/);
  const help = spawnSync(process.execPath, [briefCli, "--help"], { encoding: "utf8" });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /--page <page relative to notes\/>/);
});
