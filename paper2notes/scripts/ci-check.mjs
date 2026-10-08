#!/usr/bin/env node
// Minimal CI check for paper2notes.
//
// When `notes/` does not exist yet (bare `main`), this is a no-op skip.
// Checks Book 5's three chapter indexes, Book 2's ten chapters, Book 4's
// eight chapters, and Book 8's four chapters when present, plus in-repo relative links (href/src) that
// can be resolved on disk without a browser, plus lavish notes-refactor boards
// (before/after side-by-side and readable prose — enforced only on boards
// carrying the notes-refactor marker; see .agents/skills/paper2everything-lavish-board/SKILL.md),
// plus the deploy-commit footer (muted `deployed commit: <6-char> <subject>` per HTML),
// plus leak-check (notes must not reproduce protected question/answer text;
// see scripts/leak-check.mjs),
// plus anchor ids / moves.json / answer pointers (see scripts/anchor-lint.mjs),
// plus the DSE availability record: every published DSE section must be
// recorded in notes/dse/availability.json with a reason, and every published
// crop must be a question the papers really hold (see
// scripts/dse-availability.mjs).

import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { runLeakCheck } from "./leak-check.mjs";
import { lintAnchors } from "./anchor-lint.mjs";
import { checkAbsencePanels, checkPage, checkSnapshot, loadAvailability, loadSource, referenceCounts, checkDocumentedReferenceCounts } from "./dse-availability.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const notesDir = join(repoRoot, "notes");
const book5Dir = join(notesDir, "book5");
const book8Dir = join(notesDir, "book8");

const errors = [];

function fail(message) {
  errors.push(message);
}

function isNonEmptyFile(path) {
  return existsSync(path) && statSync(path).isFile() && statSync(path).size > 0;
}

function findChapterDir(prefix) {
  if (!existsSync(book5Dir)) return null;
  const entries = readdirSync(book5Dir, { withFileTypes: true });
  const match = entries.find((e) => e.isDirectory() && e.name.startsWith(prefix));
  return match ? join(book5Dir, match.name) : null;
}

function checkBook5Structure() {
  const bookIndex = join(book5Dir, "index.html");
  if (!isNonEmptyFile(bookIndex)) {
    fail(`Missing or empty book5 index: ${relative(repoRoot, bookIndex)}`);
  }

  for (const prefix of ["ch01-", "ch02-", "ch03-"]) {
    const chapterDir = findChapterDir(prefix);
    if (!chapterDir) {
      fail(`Missing chapter directory matching "${prefix}*" under ${relative(repoRoot, book5Dir)}`);
      continue;
    }
    const chapterIndex = join(chapterDir, "index.html");
    if (!isNonEmptyFile(chapterIndex)) {
      fail(`Missing or empty chapter index: ${relative(repoRoot, chapterIndex)}`);
    }
  }
}

function checkBook2Structure() {
  const book2Dir = join(notesDir, "book2");
  if (!existsSync(book2Dir)) return;
  const bookIndex = join(book2Dir, "index.html");
  if (!isNonEmptyFile(bookIndex)) {
    fail(`Missing or empty book2 index: ${relative(repoRoot, bookIndex)}`);
  }
  const entries = readdirSync(book2Dir, { withFileTypes: true });
  const chapterDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith("ch"));
  if (chapterDirs.length < 10) {
    fail(`Book2 should have 10 chapters, found ${chapterDirs.length} under ${relative(repoRoot, book2Dir)}`);
  }
  for (const entry of chapterDirs) {
    const chapterIndex = join(book2Dir, entry.name, "index.html");
    if (!isNonEmptyFile(chapterIndex)) {
      fail(`Missing or empty chapter index: ${relative(repoRoot, chapterIndex)}`);
    }
  }
}

function checkBook8Structure() {
  if (!existsSync(book8Dir)) return;
  const bookIndex = join(book8Dir, "index.html");
  if (!isNonEmptyFile(bookIndex)) {
    fail(`Missing or empty book8 index: ${relative(repoRoot, bookIndex)}`);
  }
  const chapters = {
    "ch01-lighting": ["1-1.html", "1-2.html", "1-3.html"],
    "ch02-cooking-and-air-conditioning": ["2-1.html", "2-2.html"],
    "ch03-buildings-and-transportation": ["3-1.html", "3-2.html"],
    "ch04-different-sources-of-energy": ["4-1.html", "4-2.html", "4-3.html"],
  };
  for (const [name, sections] of Object.entries(chapters)) {
    const chapterDir = join(book8Dir, name);
    const chapterIndex = join(chapterDir, "index.html");
    if (!isNonEmptyFile(chapterIndex)) {
      fail(`Missing or empty chapter index: ${relative(repoRoot, chapterIndex)}`);
    }
    for (const page of [...sections, "summary.html"]) {
      const path = join(chapterDir, page);
      if (!isNonEmptyFile(path)) fail(`Missing or empty Book 8 page: ${relative(repoRoot, path)}`);
    }
  }
  const landing = readFileSync(join(notesDir, "index.html"), "utf8");
  if (!landing.includes('href="book8/index.html"')) {
    fail(`Book 8 is missing from the notes landing page: ${relative(repoRoot, join(notesDir, "index.html"))}`);
  }
}

function checkBook4Structure() {
  const book4Dir = join(notesDir, "book4");
  if (!existsSync(book4Dir)) return;
  const bookIndex = join(book4Dir, "index.html");
  if (!isNonEmptyFile(bookIndex)) {
    fail(`Missing or empty book4 index: ${relative(repoRoot, bookIndex)}`);
  }
  const entries = readdirSync(book4Dir, { withFileTypes: true });
  const chapterDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith("ch"));
  if (chapterDirs.length < 8) {
    fail(`Book4 should have 8 chapters, found ${chapterDirs.length} under ${relative(repoRoot, book4Dir)}`);
  }
  for (const entry of chapterDirs) {
    const chapterIndex = join(book4Dir, entry.name, "index.html");
    if (!isNonEmptyFile(chapterIndex)) {
      fail(`Missing or empty chapter index: ${relative(repoRoot, chapterIndex)}`);
    }
  }
}

function walkHtmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

// Matches href="..." / src="..." (single or double quoted), but not
// lookalike attributes like data-src or data-gm-src.
const LINK_ATTR_RE = /(?<![\w-])(?:href|src)\s*=\s*("([^"]*)"|'([^']*)')/g;

function isSkippableLink(url) {
  if (!url) return true;
  if (url.startsWith("#")) return true; // in-page anchor
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return true; // scheme e.g. http:, mailto:, data:, tel:, javascript:
  if (url.startsWith("//")) return true; // protocol-relative
  return false;
}

// `notes/**/_local/` holds reference images (e.g. DSE past-paper crops)
// that are intentionally kept out of git (see .gitignore). Links into a
// `_local/` directory can never resolve in-repo, so they are not
// treated as broken links here.
function isKnownLocalOnly(withoutFragment) {
  return withoutFragment.split("/").includes("_local");
}

function checkRelativeLinks() {
  if (!existsSync(notesDir)) return;
  const htmlFiles = walkHtmlFiles(notesDir);

  for (const file of htmlFiles) {
    const contents = readFileSync(file, "utf8");
    let match;
    while ((match = LINK_ATTR_RE.exec(contents)) !== null) {
      const raw = match[2] !== undefined ? match[2] : match[3];
      if (isSkippableLink(raw)) continue;

      // Strip query string and fragment before resolving to a filesystem path.
      const withoutFragment = raw.split("#")[0].split("?")[0];
      if (!withoutFragment) continue; // pure fragment/query link on this attribute value
      if (isKnownLocalOnly(withoutFragment)) continue;

      const target = resolve(dirname(file), decodeURIComponent(withoutFragment));
      if (!existsSync(target)) {
        fail(`Broken relative link in ${relative(repoRoot, file)}: "${raw}"`);
      }
    }
  }
}

if (!existsSync(notesDir)) {
  console.log("ci-check: notes/ not found on this branch, skipping (nothing to check).");
  process.exit(0);
}

// The Cloud Run service moved from asia-east1 to asia-east2 and the old
// asia-east1 service was deleted, so any *.run.app URL pointing at the old
// region serves Google's generic "Error: Page not found" page for every
// path (including /, /book5/ and /book5/index.html), which looks like a
// missing route in the container. Guard against reintroducing the stale
// host: every region-scoped *.run.app URL in the deploy docs/config must
// use the Deploy workflow's GCP_REGION, and the deploy scripts' region
// defaults must agree with it.
//
// Monorepo adaptation of paper2notes PR 14 (chore: ignore .lavish and guard
// deploy region): workflow lives at .github/workflows/deploy-notes.yml at
// the monorepo root; site docs live in README.md (root), paper2notes/README.md,
// and paper2notes/deploy/cloudrun/* .
const REGION_SCOPED_RUN_APP_RE = /[A-Za-z0-9-]+\.(asia-[a-z]+\d+)\.run\.app/g;

function checkSiteRegionConsistency() {
  const monorepoRoot = resolve(repoRoot, "..");
  const isMonorepo = existsSync(join(monorepoRoot, "paper2notes/notes/book5"));
  const workflowFile = isMonorepo
    ? join(monorepoRoot, ".github/workflows/deploy-notes.yml")
    : join(repoRoot, ".github/workflows/deploy.yml");
  if (!existsSync(workflowFile)) {
    fail(`Cannot determine deploy region: ${isMonorepo ? ".github/workflows/deploy-notes.yml" : ".github/workflows/deploy.yml"} is missing`);
    return;
  }
  const workflow = readFileSync(workflowFile, "utf8");
  const regionMatch = workflow.match(/GCP_REGION:\s*([a-z0-9-]+)/);
  if (!regionMatch) {
    fail(`Cannot determine deploy region: GCP_REGION not found in ${isMonorepo ? ".github/workflows/deploy-notes.yml" : ".github/workflows/deploy.yml"}`);
    return;
  }
  const region = regionMatch[1];

  const scriptFiles = ["deploy/cloudrun/deploy.sh", "deploy/cloudrun/provision.sh"];
  for (const rel of scriptFiles) {
    const file = join(repoRoot, rel);
    if (!existsSync(file)) continue;
    const contents = readFileSync(file, "utf8");
    const defMatch = contents.match(/\$\{GCP_REGION:-([a-z0-9-]+)\}/);
    if (defMatch && defMatch[1] !== region) {
      fail(`${rel} defaults to region "${defMatch[1]}" but the Deploy workflow uses "${region}"`);
    }
  }

  const siteUrlFiles = isMonorepo
    ? [
        join(monorepoRoot, "README.md"),
        join(repoRoot, "README.md"),
        join(repoRoot, "deploy/cloudrun/README.md"),
        join(repoRoot, "deploy/cloudrun/deploy.sh"),
        join(repoRoot, "deploy/cloudrun/provision.sh"),
        workflowFile,
      ]
    : [
        join(repoRoot, "README.md"),
        join(repoRoot, "deploy/cloudrun/README.md"),
        join(repoRoot, "deploy/cloudrun/deploy.sh"),
        join(repoRoot, "deploy/cloudrun/provision.sh"),
        workflowFile,
      ];
  for (const file of siteUrlFiles) {
    if (!existsSync(file)) continue;
    const contents = readFileSync(file, "utf8");
    let match;
    REGION_SCOPED_RUN_APP_RE.lastIndex = 0;
    while ((match = REGION_SCOPED_RUN_APP_RE.exec(contents)) !== null) {
      if (match[1] !== region) {
        const rel = isMonorepo ? relative(monorepoRoot, file) : relative(repoRoot, file);
        fail(`${rel} references a *.run.app URL in region "${match[1]}" but the Deploy workflow uses "${region}" (stale region hosts serve a generic not-found page for every path)`);
      }
    }
  }
}

function checkLavishBoards() {
  // Enforces .agents/skills/paper2everything-lavish-board/SKILL.md:
  // - every lavish board about refactoring notes HTML must render before/after
  //   side-by-side (left = before/main, right = after/branch) using iframes
  //   at both desktop (1280) and phone (390) widths
  // - no text may live in a narrow text box that renders unreadable —
  //   lavish container must use min-width >= 600px for prose, flex/grid wraps
  //   to full-width on small viewports, and long prose uses readable
  //   measures (>= 45ch).
  const lavishRoots = [];
  const monorepoRoot = resolve(repoRoot, "..");
  const isMonorepo = existsSync(join(monorepoRoot, "paper2notes/notes/book5"));
  if (isMonorepo) {
    lavishRoots.push(join(monorepoRoot, ".lavish"));
    lavishRoots.push(join(monorepoRoot, "paper2notes/.lavish"));
  } else {
    lavishRoots.push(join(repoRoot, ".lavish"));
    lavishRoots.push(join(repoRoot, "paper2notes/.lavish"));
  }
  const seen = new Set();
  const boards = [];
  for (const root of lavishRoots) {
    if (!existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const cur = stack.pop();
      for (const entry of readdirSync(cur, { withFileTypes: true })) {
        const full = join(cur, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.isFile() && entry.name.endsWith(".html")) {
          if (seen.has(full)) continue;
          seen.add(full);
          boards.push(full);
        }
      }
    }
  }
  for (const file of boards) {
    // Snapshots used as before sources for iframes (e.g. .lavish/**/before/paper2notes/...) are notes HTML, not boards.
    if (file.includes("/before/")) continue;
    const rel = isMonorepo ? relative(monorepoRoot, file) : relative(repoRoot, file);
    let contents;
    try { contents = readFileSync(file, "utf8"); } catch { continue; }
    const hasMarker = /lavish-board-kind["'\s>]*notes-refactor/.test(contents) || /notes-refactor-board/.test(contents);
    const hasIframeNotes = /<iframe[^>]*src=["'][^"']*notes\//i.test(contents);
    const looksLikeNotesRefactor = hasMarker || (/p2e-book5-ch27-migrate/i.test(file) || /p2e-.*migrate/i.test(contents)) || (hasIframeNotes && /book5\//i.test(contents));
    // Boards that are clearly notes-refactor but forgot the marker: fail on missing marker so the skill is discoverable.
    if (hasIframeNotes && /book5\/ch03/i.test(contents) && !hasMarker) {
      fail(`Lavish board ${rel}: missing marker <meta name="lavish-board-kind" content="notes-refactor"> or class "notes-refactor-board" required for notes-refactor boards (see .agents/skills/paper2everything-lavish-board/SKILL.md)`);
      continue;
    }
    if (!looksLikeNotesRefactor) continue;
    // (a) side-by-side
    const hasGrid = /before-after-grid|compare-grid|side-by-side/.test(contents);
    const iframeCount = (contents.match(/<iframe/gi) || []).length;
    const hasBefore = /Before/i.test(contents);
    const hasAfter = /After/i.test(contents);
    const hasDesktop = /1280/.test(contents);
    const hasPhone = /390/.test(contents);
    if (!hasGrid) {
      fail(`Lavish board ${rel}: missing side-by-side grid — expected class "before-after-grid" (or "compare-grid"/"side-by-side") for left=before / right=after layout`);
    }
    if (iframeCount < 2) {
      fail(`Lavish board ${rel}: expected >= 2 iframes with before/after src into notes/ — found ${iframeCount}`);
    } else if (!hasIframeNotes) {
      fail(`Lavish board ${rel}: iframes must src into paper2notes/notes/ (before = main, after = branch)`);
    }
    if (!hasBefore || !hasAfter) {
      fail(`Lavish board ${rel}: must label panes "Before — origin/main" and "After — this branch" (left/right)`);
    }
    if (!hasDesktop || !hasPhone) {
      fail(`Lavish board ${rel}: must render both desktop (1280) and phone (390) widths — missing ${!hasDesktop ? '1280' : ''}${!hasDesktop && !hasPhone ? ' and ' : ''}${!hasPhone ? '390' : ''} iframe/width`);
    }
    // (b) no narrow unreadable text boxes
    const hasReadableMeasure = /min-width\s*:\s*(600px|45ch)/i.test(contents) || /max-width\s*:\s*(65ch|48rem)/i.test(contents);
    const hasMinmax = /minmax\s*\(\s*0\s*,\s*1fr\s*\)/.test(contents);
    const hasWrapMedia = /@media\s*\([^)]*max-width\s*:\s*900px[^)]*\)[\s\S]*?grid-template-columns\s*:\s*1fr/.test(contents);
    const hasNarrowBox = /(\.frame|\.pane|\.card|\.prose|\.content|\.lavish-frame)[^\}]*max-width\s*:\s*(32|34|36|38)0px/i.test(contents) || /(\.frame|\.pane)[^\}]*width\s*:\s*3[0-9]{2}px/i.test(contents) || /grid-template-columns\s*:\s*repeat\s*\(\s*3/.test(contents) && !hasWrapMedia;
    if (hasNarrowBox) {
      fail(`Lavish board ${rel}: narrow text box detected — CSS uses max-width < 400px or 3-column grid without phone fallback. Prose containers must be >= 600px / 45ch and grids must use minmax(0,1fr) and collapse to 1fr on small viewports (see skill section 2)`);
    }
    if (!hasReadableMeasure) {
      fail(`Lavish board ${rel}: missing readable measure — add min-width: 600px (or 45ch) for prose and max-width: 65ch (or 48rem) for long paragraphs so text is not cramped`);
    }
    if (!hasMinmax) {
      fail(`Lavish board ${rel}: missing grid safeguard — use grid-template-columns: minmax(0,1fr) minmax(0,1fr) and min-width:0 on children so flex/grid does not overflow`);
    }
    if (!hasWrapMedia) {
      fail(`Lavish board ${rel}: missing responsive wrap — add @media (max-width: 900px) { .before-after-grid { grid-template-columns: 1fr; } } so panes are full-width on phones`);
    }
  }
}

function checkDeployFooter() {
  if (!existsSync(notesDir)) return;
  const htmlFiles = walkHtmlFiles(notesDir);
  // Only deployed notes: skip _source and _local (gitignored) and vendor-less html
  const deployed = htmlFiles.filter(f => !f.includes("/_source/") && !f.includes("/_local/") && !f.includes("/.lavish/"));
  const missing = [];
  for (const file of deployed) {
    const content = readFileSync(file, "utf8");
    if (!content.includes("deploy-commit-footer") || !content.includes("deployed commit:")) {
      missing.push(relative(repoRoot, file));
    } else {
      // also ensure commit looks like 6 hex chars (or "local")
      const m = content.match(/data-commit="([^"]+)"/);
      if (m) {
        const v = m[1];
        if (v !== "local" && !/^[0-9a-f]{6}$/i.test(v)) {
          fail(`Invalid deploy-commit footer in ${relative(repoRoot, file)}: data-commit="${v}" (expected 6 hex chars or "local")`);
        }
      }
      // inline code should also have commit
      const codeM = content.match(/deployed commit:\s*<code[^>]*>([^<]+)<\/code>/i);
      if (codeM) {
        const cv = codeM[1].trim();
        if (cv !== "local" && !/^[0-9a-f]{6}$/i.test(cv)) {
          fail(`Invalid deployed commit code in ${relative(repoRoot, file)}: "${cv}" (expected 6 hex chars or "local")`);
        }
      }
    }
  }
  if (missing.length) {
    // report first 10, then summary
    const preview = missing.slice(0, 10).join(", ");
    const more = missing.length > 10 ? ` and ${missing.length - 10} more` : "";
    fail(`Missing deploy-commit footer in ${missing.length} HTML file(s): ${preview}${more}. Run: node paper2notes/scripts/inject-commit-footer.mjs --commit $(git rev-parse HEAD | cut -c1-6) (see paper2notes/deploy/cloudrun/Dockerfile)`);
  }
}

function checkLeaks() {
  const { errors: leaks } = runLeakCheck();
  for (const e of leaks) fail(`leak-check: ${e}`);
}

/* notes/dse/availability.json must match what notes/dse/ holds, what the
   source papers hold, and what each page shows or states, so a section with no
   published long question stays a recorded decision instead of drifting back
   into a silent gap. quiz-audit.mjs runs the same rules and prints them per
   page with the rest of the quiz contracts. */
function checkDseAvailability() {
  if (!existsSync(notesDir)) return;
  for (const p of checkSnapshot({ repoRoot }).problems) fail(`dse-availability: ${p.detail}`);

  const availability = { ...loadAvailability(repoRoot), repoRoot };
  const source = loadSource(repoRoot);
  for (const file of walkHtmlFiles(notesDir)) {
    if (file.includes("/_source/") || file.includes("/_local/") || file.includes("/.lavish/")) continue;
    const page = relative(repoRoot, file);
    const html = readFileSync(file, "utf8");
    for (const p of checkPage(html, { page, availability, source }).problems) {
      fail(`dse-availability: ${page}: ${p.detail}`);
    }
    for (const p of checkAbsencePanels(html, { page, availability }).problems) {
      fail(`dse-availability: ${page}: ${p.detail}`);
    }
  }

  /* docs/ARCHITECTURE.md quotes how many DSE references the pages load. Count
     them from the pages and refuse the quote when it drifts, so the number is
     never a hand-copied value again. */
  const doc = join(repoRoot, "..", "docs", "ARCHITECTURE.md");
  if (existsSync(doc)) {
    for (const p of checkDocumentedReferenceCounts(readFileSync(doc, "utf8"), referenceCounts(repoRoot))) {
      fail(`dse-availability: ${p.detail}`);
    }
  }
}

checkSiteRegionConsistency();
checkLavishBoards();

if (existsSync(book5Dir)) {
  checkBook5Structure();
}

checkBook2Structure();
checkBook4Structure();
checkBook8Structure();

checkRelativeLinks();
checkDeployFooter();
checkLeaks();
checkDseAvailability();
errors.push(...lintAnchors({ repoRoot }).errors);

if (errors.length > 0) {
  console.error(`ci-check: ${errors.length} problem(s) found:\n`);
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log("ci-check: OK");
process.exit(0);
