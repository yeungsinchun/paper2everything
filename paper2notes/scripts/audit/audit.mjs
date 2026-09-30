#!/usr/bin/env node
/**
 * audit.mjs — single entry point: audit <run|map|bundle|report|verify> [args]
 *
 * run/map/bundle/report forward to their scripts; `verify` checks the local
 * artefacts under .audit/ (or P2E_AUDIT_ROOT) for consistency.
 */
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { main as verifyMain } from "./verify.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [cmd, ...args] = process.argv.slice(2);
const scripts = { run: "run.mjs", map: "map.mjs", bundle: "bundle.mjs", report: "report.mjs" };

if (cmd === "verify") {
  try { process.exitCode = verifyMain(args); } catch (e) { console.error(e.message); process.exitCode = 2; }
} else if (scripts[cmd]) {
  const r = spawnSync(process.execPath, [path.join(__dirname, scripts[cmd]), ...args], { stdio: "inherit" });
  process.exitCode = r.status ?? 1;
} else {
  console.error("Usage: audit.mjs <run|map|bundle|report|verify> [args]");
  process.exitCode = 2;
}
