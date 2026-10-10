// Guards the shared audit modules' bank, page, image, and answer-pointer contracts.
// Broken mappings or audit checks fail before the command can publish bad results.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { repoRoot, auditRoot } from "../scripts/audit/paths.mjs";
import { allBanks, pagesForBank, sectionPagesForBank, sectionIdForPage, cumulativePagesForBank, bankForSection } from "../scripts/audit/bank-pages.mjs";
import { loadDseSection, dseItemsForPage } from "../scripts/audit/dse.mjs";
import { runPi } from "../scripts/audit/map.mjs";
import { extractFigures, stripDseBlocks } from "../scripts/audit/bundle.mjs";
import { pointerCandidates, ideaAnchors, parseAnchorHeading } from "../scripts/audit/pointers.mjs";
import { deterministicQuoteCheck } from "../scripts/audit/judge.mjs";
import { verify } from "../scripts/audit/verify.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const auditCli = path.resolve(here, "../scripts/audit/audit.mjs");
const chrome = fs.existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");

test("books.json lists all 21 banks", () => {
  assert.equal(allBanks().length, 21);
});

test("Book 2 chapters resolve to their index.html with a book2/chNN section id", () => {
  const pages = pagesForBank(repoRoot, "QB_202");
  assert.deepEqual(pages.map(p => path.basename(p)), ["index.html"]);
  assert.equal(sectionIdForPage("QB_202", pages[0]), "book2/ch02");
  assert.equal(cumulativePagesForBank(repoRoot, "QB_203").length, 3);
});

test("Book 5 chapters resolve to section pages", () => {
  const ids = sectionPagesForBank(repoRoot, "QB_501").map(p => sectionIdForPage("QB_501", p));
  assert.deepEqual(ids, ["25-1", "25-2", "25-3"]);
  assert.equal(bankForSection(repoRoot, "25.1").bank, "QB_501");
});

test("P2E_AUDIT_ROOT overrides the audit root", () => {
  const prev = process.env.P2E_AUDIT_ROOT;
  process.env.P2E_AUDIT_ROOT = "/tmp/p2e-root-x";
  try { assert.equal(auditRoot(), "/tmp/p2e-root-x"); } finally { if (prev === undefined) delete process.env.P2E_AUDIT_ROOT; else process.env.P2E_AUDIT_ROOT = prev; }
});

test("DSE loader turns deck slides into items with resolved images", () => {
  const [d] = loadDseSection(repoRoot, "25.1");
  assert.equal(d.bank, "DSE_25-1");
  assert.equal(d.parent_bank, "QB_501");
  assert.ok(d.items.length > 0);
  assert.match(d.items[0].id, /^DSE_25-1:(mc|lq)-/);
  for (const item of d.items.filter(i => i.images.stem.length)) assert.ok(fs.existsSync(item.images.stem[0]));
  // LQ items carry the tracked marking-scheme crops when they exist
  const lqWithCrop = d.items.find(i => i.type === "lq" && i.images.answer.length);
  assert.ok(lqWithCrop, "expected at least one LQ item with a tracked answer crop");
  assert.ok(fs.existsSync(path.join(repoRoot, lqWithCrop.images.answer[0])));
});

test("DSE loader emits one item per slide and marks missing evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audit-dse-"));
  try {
    const pageDir = path.join(root, "notes/book5/ch01-x/9-1.html");
    fs.mkdirSync(path.dirname(pageDir), { recursive: true });
    fs.mkdirSync(path.join(root, "notes/book5/_local/dse/mc/9"), { recursive: true });
    fs.writeFileSync(path.join(root, "notes/book5/_local/dse/mc/9/a.png"), "png");
    fs.writeFileSync(pageDir, `<section class="section-dse" data-quiz="mc">
<article class="quiz-slide" id="dse-mc-1"><figure class="dse-paper"><img src="../_local/dse/mc/9/a.png"></figure></article>
<article class="quiz-slide" id="dse-mc-2"><figure class="dse-paper"><img src="../_local/dse/mc/9/missing.png"></figure></article>
</section>`);
    const { items, missing } = dseItemsForPage(root, "QB_501", pageDir);
    assert.equal(items.length, 2);
    assert.equal(missing.length, 1);
    const bad = items.find(i => i.id === "DSE_9-1:mc-2");
    assert.equal(bad.missing_evidence, true);
    assert.equal(bad.images.stem.length, 0);
    assert.equal(items.find(i => i.id === "DSE_9-1:mc-1").images.stem.length, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("quote check resolves anchors per page and supports the LO anchor", () => {
  const notesMd = [
    "### [§book2/ch02.A #quiz]",
    "average velocity is displacement divided by time",
    "",
    "### [§book2/ch03.A #quiz]",
    "momentum is mass times velocity",
    "",
    "### Learning objectives [§25-1.lo #lo-heading]",
    "describe how X-rays are produced by fast electrons",
  ].join("\n");
  const ok = deterministicQuoteCheck({ steps: [
    { source: "notes:book2/ch02#quiz", quote: "average velocity is displacement divided by time" },
    { source: "notes:25-1.lo#lo-heading", quote: "describe how X-rays are produced by fast electrons" },
    { source: "notes:25-1#lo-heading", quote: "describe how X-rays are produced" },
  ]}, notesMd);
  assert.equal(ok.length, 0);
  // same bare id on another page must not satisfy a page-qualified citation
  const wrongPage = deterministicQuoteCheck({ steps: [
    { source: "notes:book2/ch02#quiz", quote: "momentum is mass times velocity" },
  ]}, notesMd);
  assert.equal(wrongPage.length, 1);
  // a bare id that exists on several pages is ambiguous, not silently last-wins
  const ambiguous = deterministicQuoteCheck({ steps: [
    { source: "notes:quiz", quote: "average velocity is displacement divided by time" },
  ]}, notesMd);
  assert.equal(ambiguous.length, 1);
  // the old synthetic #lo token is not a DOM id and must not resolve
  const lo = deterministicQuoteCheck({ steps: [
    { source: "notes:25-1#lo", quote: "describe how X-rays are produced" },
  ]}, notesMd);
  assert.equal(lo.length, 1);
});

test("anchor headings carry a page qualifier and the LO anchor is a real DOM id", () => {
  const idea = parseAnchorHeading("§book2/ch02.A #quiz");
  assert.equal(idea.page, "book2/ch02");
  assert.equal(idea.sec, "A");
  assert.equal(idea.id, "quiz");
  const lo = parseAnchorHeading("§25-1.lo #lo-heading");
  assert.equal(lo.page, "25-1");
  assert.equal(lo.id, "lo-heading");
});

test("bundle strips DSE decks and takes anchors only from DOM ids", () => {
  const html = `<section class="idea" id="a"><figure class="fig"><div id="stage-1"></div><figcaption>Caption text</figcaption></figure><figure class="fig"><svg></svg><figcaption>No id here</figcaption></figure></section>
<section class="section-dse lo-quiz" data-quiz="mc"><article class="quiz-slide" id="dse-mc-1"></article></section>`;
  const { html: stripped, count } = stripDseBlocks(html);
  assert.equal(count, 1);
  assert.ok(!stripped.includes("section-dse"));
  const { ideaFigs } = extractFigures(stripped);
  assert.equal(ideaFigs[0].anchor, "stage-1");
  assert.equal(ideaFigs[1].anchor, null);
  assert.equal(ideaFigs[1].fileKey, "fig1");
});

test("pointer candidates only name DOM-id anchors of real pages", () => {
  const pages = sectionPagesForBank(repoRoot, "QB_501");
  const cands = pointerCandidates({ repoRoot, bank: "QB_501", sectionPages: pages, mapped: { section: "25-1", secondary: ["25-2"] }, concepts: ["X-ray production by fast electrons"] });
  assert.ok(cands.length > 0);
  for (const c of cands) {
    const html = fs.readFileSync(path.join(repoRoot, c.page), "utf8");
    assert.ok(ideaAnchors(html).some(i => i.anchor === c.anchor));
  }
});

test("verify flags a pointer that is not a DOM id", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audit-verify-"));
  try {
    const results = path.join(root, "results");
    fs.mkdirSync(path.join(results, "QB_501"), { recursive: true });
    const page = "notes/book5/ch01-radiation-and-radioactivity/25-1.html";
    const write = (id, anchor, pageArg = page) => fs.writeFileSync(path.join(results, "QB_501", `${id}.json`), JSON.stringify({ id, bank: "QB_501", section: "25-1", verdict: "gap", pointer_candidates: [{ page: pageArg, anchor }] }));
    write("good", ideaAnchors(fs.readFileSync(path.join(repoRoot, page), "utf8"))[0].anchor);
    write("bad", "made-up-heading");
    write("nopage", "made-up-heading", "");
    const res = verify({ results, bundles: path.join(root, "b"), mapping: path.join(root, "m") });
    assert.equal(res.errors.length, 2);
    assert.ok(res.errors.some(e => /made-up-heading/.test(e.msg)));
    assert.ok(res.errors.some(e => /page missing/.test(e.msg)));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("map pi call completes when the pi binary blocks on stdin (execFile regression)", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audit-pi-"));
  try {
    // The real pi binary reads stdin forever, so execFile's pipe stdin deadlocks
    // (execFile waits for the stdin pipe to close); this shim reproduces that.
    const fake = path.join(root, "pi");
    fs.writeFileSync(fake, `#!/bin/sh\ncat >/dev/null || true\necho '{"section":"25-1","confidence":0.9}'\n`, { mode: 0o755 });
    const res = await runPi(fake, ["-p", "--mode", "text", "hello"]);
    assert.match(res.stdout, /"section":"25-1","confidence":0\.9/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

const piBin = process.env.PI_BIN || "pi";
const piAvailable = (() => {
  try { return spawnSync(piBin, ["--version"], { encoding: "utf8" }).status === 0; } catch { return false; }
})();

test("real long-running pi -p completes through the map runner", { skip: !piAvailable, timeout: 120000 }, async () => {
  const res = await runPi(piBin, ["-p", "--model", "meta/muse-spark-1.2-contributor", "--thinking", "high", "--no-tools", "--no-extensions", "--no-skills", "--no-context-files", "--no-prompt-templates", "--no-themes", "--no-session", "--mode", "text", "say hello"]);
  // The model is not provisioned here; pi exits 1 with a message. The regression
  // was that the process never exited at all, so completion with any output is
  // the assertion (execFile returned empty output only after the 120s timeout).
  assert.ok((res.stdout + res.stderr).length > 0);
});

test("run --dse-section end to end with a fake pi, then verify", { skip: !chrome, timeout: 600000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "audit-e2e-"));
  try {
    const fake = path.join(root, "pi");
    fs.writeFileSync(fake, `#!/bin/sh
[ "$1" = "--version" ] && { echo fake-1; exit 0; }
cat <<'EOT'
\`\`\`json
{"id":"x","answer":"A","steps":[],"missing":[{"concept":"X-ray production by fast electrons"}],"self_verdict":"solved","confidence":0.9,"cause":"knowledge-gap","marking":[],"mc_correct":false,"step_judgements":[]}
\`\`\`
EOT
`, { mode: 0o755 });
    const env = { ...process.env, PI_BIN: fake, P2E_AUDIT_ROOT: root };
    const [d] = loadDseSection(repoRoot, "25.1");
    const id = d.items[0].id;
    const run = spawnSync(process.execPath, [auditCli, "run", "--dse-section", "25.1", "--items", id, "--k", "1", "--concurrency", "1"], { env, encoding: "utf8" });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    const result = JSON.parse(fs.readFileSync(path.join(root, "results/DSE_25-1", `${id}.json`), "utf8"));
    assert.equal(result.section, "25-1");
    assert.ok(result.pointer_candidates.length > 0);
    // the mapping file keeps every deck item, not just the selected one
    const mapping = JSON.parse(fs.readFileSync(path.join(root, "mapping/DSE_25-1.json"), "utf8"));
    assert.equal(mapping.mappings.length, d.items.length);
    const v = spawnSync(process.execPath, [auditCli, "verify"], { env, encoding: "utf8" });
    assert.equal(v.status, 0, v.stdout + v.stderr);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
