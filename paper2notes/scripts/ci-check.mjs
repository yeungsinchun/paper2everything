#!/usr/bin/env node
// Minimal CI check for paper2notes.
//
// When `notes/` does not exist yet (bare `main`), this is a no-op skip.
// When `notes/book5/` exists, it asserts that the book5 index and both
// chapter indexes exist and are non-empty, and it fails on broken
// in-repo relative links (href/src) that it can resolve on disk without
// a browser.

import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const notesDir = join(repoRoot, "notes");
const book5Dir = join(notesDir, "book5");

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

checkSiteRegionConsistency();

if (existsSync(book5Dir)) {
  checkBook5Structure();
}

checkBook2Structure();
checkBook4Structure();

checkRelativeLinks();

if (errors.length > 0) {
  console.error(`ci-check: ${errors.length} problem(s) found:\n`);
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log("ci-check: OK");
process.exit(0);
