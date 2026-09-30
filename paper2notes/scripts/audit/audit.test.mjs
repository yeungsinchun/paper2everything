import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { repoRoot, auditRoot } from "./paths.mjs";
import { allBanks, pagesForBank, sectionPagesForBank, sectionIdForPage, cumulativePagesForBank, bankForSection } from "./bank-pages.mjs";
import { loadDseSection } from "./dse.mjs";
import { extractFigures, stripDseBlocks } from "./bundle.mjs";
import { pointerCandidates, ideaAnchors } from "./pointers.mjs";
import { verify } from "./verify.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
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
  for (const item of d.items) assert.ok(fs.existsSync(item.images.stem[0]));
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
    const write = (id, anchor) => fs.writeFileSync(path.join(results, "QB_501", `${id}.json`), JSON.stringify({ id, bank: "QB_501", section: "25-1", verdict: "gap", pointer_candidates: [{ page, anchor }] }));
    write("good", ideaAnchors(fs.readFileSync(path.join(repoRoot, page), "utf8"))[0].anchor);
    write("bad", "made-up-heading");
    const res = verify({ results, bundles: path.join(root, "b"), mapping: path.join(root, "m") });
    assert.equal(res.errors.length, 1);
    assert.match(res.errors[0].msg, /made-up-heading/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
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
    const run = spawnSync(process.execPath, [path.join(here, "audit.mjs"), "run", "--dse-section", "25.1", "--items", id, "--k", "1", "--concurrency", "1"], { env, encoding: "utf8" });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    const result = JSON.parse(fs.readFileSync(path.join(root, "results/DSE_25-1", `${id}.json`), "utf8"));
    assert.equal(result.section, "25-1");
    assert.ok(result.pointer_candidates.length > 0);
    const v = spawnSync(process.execPath, [path.join(here, "audit.mjs"), "verify", "--strict"], { env, encoding: "utf8" });
    assert.equal(v.status, 0, v.stdout + v.stderr);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
