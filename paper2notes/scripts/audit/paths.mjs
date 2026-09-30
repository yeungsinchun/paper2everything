/**
 * paths.mjs — Shared locations for the audit harness.
 *
 * P2E_AUDIT_ROOT overrides the gitignored `.audit/` output root (results,
 * bundles, mapping, cache, inventory, coverage, board).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "../..");
export const monoRepoRoot = path.resolve(repoRoot, "..");

export function auditRoot() {
  return process.env.P2E_AUDIT_ROOT ? path.resolve(process.env.P2E_AUDIT_ROOT) : path.join(repoRoot, ".audit");
}

export function auditDirs(root = auditRoot()) {
  return {
    root,
    results: path.join(root, "results"),
    bundles: path.join(root, "bundles"),
    cache: path.join(root, "cache"),
    mapping: path.join(root, "mapping"),
    inventory: path.join(root, "inventory"),
    coverage: path.join(root, "coverage.json"),
    lavish: path.join(root, "lavish/qb-audit"),
    fixtures: path.join(root, "fixtures"),
  };
}

export function resolveImagePath(image) {
  if (!image) return null;
  if (path.isAbsolute(image)) return fs.existsSync(image) ? image : null;
  const candidates = [
    path.resolve(repoRoot, image),
    path.join(repoRoot, "../paper2db/qb-pdf", image),
    path.join(repoRoot, "paper2db/qb-pdf", image),
    path.join(monoRepoRoot, "paper2db/qb-pdf", image),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return path.resolve(repoRoot, image);
}

export function qbItemsCandidates(bank) {
  return [
    path.join(repoRoot, "../paper2db/qb-pdf/items", `${bank}.json`),
    path.join(monoRepoRoot, "paper2db/qb-pdf/items", `${bank}.json`),
    path.join(repoRoot, `paper2db/qb-pdf/items/${bank}.json`),
  ];
}

export function inventoryCandidates(bank) {
  return [
    ...qbItemsCandidates(bank),
    path.join(auditDirs().inventory, `${bank}.json`),
    path.join(auditDirs().fixtures, `${bank}.json`),
    path.join(__dirname, "fixtures", `${bank}.json`),
  ];
}

/** Split a comma-separated CLI list. */
export function parseList(v) {
  return String(v).split(",").map(s => s.trim()).filter(Boolean);
}
