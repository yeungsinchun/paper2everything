#!/usr/bin/env node
// Injects a small unobtrusive footer showing the deployed commit (first 6 chars)
// into every HTML file under paper2notes/notes. Idempotent: updates existing
// footer or inserts before </body>.
//
// Usage:
//   node paper2notes/scripts/inject-commit-footer.mjs --commit abc123
//   node paper2notes/scripts/inject-commit-footer.mjs --commit 7d5562f --root paper2notes/notes
//   GIT_COMMIT=abc123 node paper2notes/scripts/inject-commit-footer.mjs
//   GITHUB_SHA=abc123 node paper2notes/scripts/inject-commit-footer.mjs
//
// Resolves commit from (in order): --commit arg, $GIT_COMMIT, $DEPLOY_COMMIT, $GITHUB_SHA, `git rev-parse HEAD`.

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const defaultNotesDir = join(repoRoot, "paper2notes/notes");

function parseArgs() {
  const args = process.argv.slice(2);
  let commit = null;
  let root = null;
  let check = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--commit" && i + 1 < args.length) commit = args[++i];
    else if (a.startsWith("--commit=")) commit = a.slice("--commit=".length);
    else if (a === "--root" && i + 1 < args.length) root = args[++i];
    else if (a.startsWith("--root=")) root = a.slice("--root=".length);
    else if (a === "--check") check = true;
    else if (a === "--help" || a === "-h") {
      console.log("Usage: inject-commit-footer.mjs [--commit <sha>] [--root <dir>] [--check]");
      process.exit(0);
    }
  }
  return { commit, root, check };
}

function resolveCommit(explicit) {
  if (explicit) return explicit.trim();
  for (const env of ["GIT_COMMIT", "DEPLOY_COMMIT", "GITHUB_SHA", "COMMIT_SHA"]) {
    if (process.env[env]) return process.env[env].trim();
  }
  try {
    const sha = execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
    if (sha) return sha;
  } catch {}
  // fallback: try git in notes dir
  try {
    const sha2 = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    if (sha2) return sha2;
  } catch {}
  return "local";
}

function shortCommit(sha) {
  const clean = sha.trim();
  if (!clean || clean === "local") return "local";
  // take first 6 hex chars
  const m = clean.match(/[0-9a-f]{6,40}/i);
  if (m) return m[0].slice(0, 6).toLowerCase();
  return clean.slice(0, 6);
}

function walkHtml(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // skip _source, _local, vendor asset dirs that have no html, but still walk if they have html (they don't)
      // Don't skip, just walk all; _source has no html, vendor has no html, _local is gitignored and not deployed
      if (entry.name === "_source" || entry.name === "_local" || entry.name === ".git") continue;
      // but we want to ensure deployed html in dse, qb, book* are covered
      walkHtml(full, out);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function buildFooter(short) {
  // keep inline style for unobtrusive, no external css dependency
  // uses monospace for commit, muted color, small size, subtle top border
  return `<footer class="deploy-commit-footer" style="text-align:center;font-size:0.68rem;color:#9aa0a8;padding:10px 1rem 12px;border-top:1px solid #e9e3d6;margin-top:2rem;font-family:ui-monospace,Menlo,Consolas,monospace" data-commit="${short}">deployed commit: <code style="font:inherit;color:inherit;background:none;border:0;padding:0">${short}</code></footer>`;
}

function injectIntoFile(file, short, checkMode) {
  let content = readFileSync(file, "utf8");
  const footer = buildFooter(short);
  const marker = "deploy-commit-footer";

  // If footer already exists, update its commit
  if (content.includes(marker)) {
    // replace data-commit and code content
    let next = content
      // update data-commit="..."
      .replace(/data-commit="[^"]*"/g, `data-commit="${short}"`)
      // update inner code: deployed commit: <code...>xxxx</code>
      .replace(/deployed commit:\s*<code[^>]*>[^<]*<\/code>/gi, `deployed commit: <code style="font:inherit;color:inherit;background:none;border:0;padding:0">${short}</code>`);
    // also handle case where footer uses plain text without code tag
    next = next.replace(/deployed commit:\s*[0-9a-f]{6,40}/gi, `deployed commit: <code style="font:inherit;color:inherit;background:none;border:0;padding:0">${short}</code>`);
    if (next !== content) {
      if (checkMode) return { changed: true, reason: "update" };
      writeFileSync(file, next, "utf8");
      return { changed: true, reason: "updated" };
    }
    return { changed: false, reason: "already correct" };
  }

  // No footer yet: inject before </body> (case-insensitive)
  const bodyCloseRe = /<\/body\s*>/i;
  if (!bodyCloseRe.test(content)) {
    // fallback: append at end
    if (checkMode) return { changed: true, reason: "missing body close" };
    content = content + "\n" + footer + "\n";
    writeFileSync(file, content, "utf8");
    return { changed: true, reason: "appended" };
  }
  const injected = content.replace(bodyCloseRe, `${footer}\n</body>`);
  if (injected !== content) {
    if (checkMode) return { changed: true, reason: "inject" };
    writeFileSync(file, injected, "utf8");
    return { changed: true, reason: "injected" };
  }
  return { changed: false };
}

function main() {
  const { commit: explicit, root, check } = parseArgs();
  const notesDir = root ? resolve(root) : defaultNotesDir;
  const sha = resolveCommit(explicit);
  const short = shortCommit(sha);
  const files = walkHtml(notesDir);

  if (!files.length) {
    console.error(`inject-commit-footer: no HTML files found under ${notesDir}`);
    process.exit(check ? 1 : 0);
  }

  let changed = 0;
  let updated = 0;
  let injected = 0;
  for (const f of files) {
    const res = injectIntoFile(f, short, check);
    if (res.changed) {
      changed++;
      if (res.reason === "updated" || res.reason === "update") updated++;
      else injected++;
      if (!check) console.log(`${res.reason}: ${relative(repoRoot, f)}`);
    }
  }

  // also write commit.txt and version.txt at notes root for debugging / future JS fallback
  if (!check) {
    try {
      const commitTxt = join(notesDir, "commit.txt");
      writeFileSync(commitTxt, short + "\n", "utf8");
      const versionTxt = join(notesDir, "version.txt");
      writeFileSync(versionTxt, short + "\n", "utf8");
      // also at repo root for reference
    } catch (e) {
      console.warn("warning: could not write commit.txt:", e.message);
    }
  }

  if (check) {
    if (changed > 0) {
      console.error(`inject-commit-footer --check: ${changed} file(s) need injection/update (short=${short})`);
      process.exit(1);
    } else {
      console.log(`inject-commit-footer --check: OK (${files.length} files, short=${short})`);
      process.exit(0);
    }
  } else {
    console.log(`inject-commit-footer: done short=${short} files=${files.length} changed=${changed} (updated=${updated} injected=${injected})`);
  }
}

main();
