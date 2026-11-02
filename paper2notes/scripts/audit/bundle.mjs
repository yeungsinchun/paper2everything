#!/usr/bin/env node
/**
 * bundle.mjs — Notes bundle extractor (plan §4.3 + D4 override)
 *
 * Extracts student-visible content from one or more notes HTML pages into
 * a bundle for the notes-only solver. Implements plan
 * sections 4.3–4.7 as adjusted by captain decision D4:
 *   - DSE decks (section.section-dse) are STRIPPED from the bundle: the decks
 *     are audited as items (dse.mjs), so the solver must not read them as notes.
 *     Only the count of stripped decks is recorded in the manifest.
 *   - Anchors come only from DOM ids: idea `id`, figure/stage `id`.
 *
 * Gate: extracting a bundle from notes/book5/.../25-1.html includes every
 * idea block and every figure (3 frames for animated ones), and no DSE deck.
 *
 * Uses a zero-dependency CDP pattern for browser capture.
 * (node:net freePort, WebSocket, Page.captureScreenshot at DPR 2).
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn, execSync } from "node:child_process";
import { createServer } from "node:net";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { auditDirs } from "./paths.mjs";
import { sectionIdForPath } from "./bank-pages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const DEFAULT_OUT = auditDirs().bundles;

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
function sha256File(filePath) {
  return sha256Hex(fs.readFileSync(filePath));
}
function getGitSha() {
  try {
    return execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

/** Find a free TCP port for browser capture. */
function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close((err) => (err ? reject(err) : resolve(port)));
    });
    s.on("error", reject);
  });
}

/**
 * Static file server for notes/ so relative vendor/katex etc. resolve
 * like Cloud Run nginx does.
 */
async function startStaticServer(rootDir) {
  const port = await freePort();
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/book5/index.html";
    // security: prevent traversal
    const file = path.join(rootDir, path.normalize(urlPath).replace(/^\/+/, ""));
    if (!file.startsWith(rootDir)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      res.end("not found: " + urlPath);
      return;
    }
    const ext = path.extname(file).toLowerCase();
    const mime = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".woff2": "font/woff2",
    }[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve, reject) => {
    server.listen(port, "127.0.0.1", resolve);
    server.on("error", reject);
  });
  return { server, port };
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label + " timed out after " + ms + "ms")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function closeServer(server, timeoutMs = 3000) {
  if (!server) return;
  // Force-close existing connections if Node supports it
  try { if (server.closeAllConnections) server.closeAllConnections(); } catch {}
  await Promise.race([
    new Promise((resolve) => server.close(() => resolve())),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

// ---------- HTML parsing helpers (no deps) ----------

function extractIdeaBlocks(html) {
  const re = /<section\s+class="idea"[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const inner = m[2];
    // find sec-num like <span class="sec-num">A</span>
    const secNumM = inner.match(/<span\s+class="sec-num">([^<]+)<\/span>/i);
    const secNum = secNumM ? secNumM[1].trim() : "?";
    // heading
    const h2M = inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const heading = h2M ? stripTags(h2M[1]).trim() : id;
    blocks.push({ id, secNum, html: m[0], inner, heading });
  }
  return blocks;
}
function extractLoBlock(html) {
  const m = html.match(/<section\s+class="lo-block"[\s\S]*?<\/section>/i);
  return m ? m[0] : "";
}
const DSE_DECK_RE = /<section\s+class="section-dse[^"]*"[\s\S]*?<\/section>/gi;
function stripDseBlocks(html) {
  let count = 0;
  const stripped = html.replace(DSE_DECK_RE, () => { count++; return ""; });
  return { html: stripped, count };
}
function extractFigures(html) {
  // <figure class="fig" ...> (DSE decks are stripped before extraction)
  const re = /<figure\s+class="[^"]*\bfig\b[^"]*"[^>]*>([\s\S]*?)<\/figure>/gi;
  const figs = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const full = m[0];
    const inner = m[1];
    const isAnimated = /class="[^"]*\bvisual\b[^"]*\bplay\b/.test(full) || /data-scene=/.test(full);
    const isSvg = /class="[^"]*\bsvg-fig\b/.test(full) || /<svg\b/.test(inner);
    // anchor: DOM id only (own id, else first descendant id); null when the DOM has none
    const idM = full.match(/\bid="([^"]+)"/);
    const anchor = idM ? idM[1] : null;
    const fileKey = (anchor || `fig${figs.length}`).replace(/[^a-z0-9-_]/gi, "-").replace(/--+/g, "-").slice(0, 40);
    // hud labels
    const huds = [];
    const hudRe = /<span\s+class="hud-label"[^>]*>([^<]+)<\/span>/gi;
    let hm;
    while ((hm = hudRe.exec(inner)) !== null) huds.push(hm[1].trim());
    const captionM = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
    const caption = captionM ? stripTags(captionM[1]).trim() : "";
    figs.push({ html: full, anchor, fileKey, isAnimated, isSvg, caption, huds, kind: isAnimated ? "animated" : isSvg ? "svg" : "static" });
  }
  return { ideaFigs: figs };
}
function extractTables(html) {
  const re = /<table\s+class="notes"[^>]*>([\s\S]*?)<\/table>/gi;
  const tables = [];
  let m;
  while ((m = re.exec(html)) !== null) tables.push(m[0]);
  return tables;
}
function stripTags(s) {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function htmlToText(html) {
  // Very small HTML -> text helper for notes.md: keep structure
  let t = html;
  // KaTeX: annotation encoding="application/x-tex" -> keep LaTeX
  t = t.replace(/<annotation\s+encoding="application\/x-tex">([\s\S]*?)<\/annotation>/gi, (_, tex) => ` $${tex.trim()}$ `);
  // Remove scripts, styles, comments
  t = t.replace(/<!--[\s\S]*?-->/g, " ");
  t = t.replace(/<script[\s\S]*?<\/script>/gi, " ");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, " ");
  // Replace html entities minimal
  t = t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  // Keep block separators
  t = t.replace(/<\/p>/gi, "\n\n").replace(/<\/li>/gi, "\n").replace(/<\/tr>/gi, "\n").replace(/<\/h[1-6]>/gi, "\n\n");
  t = stripTags(t);
  return t;
}
function tableToMarkdown(tableHtml) {
  // Parse simple <table class="notes">
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRe = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
  const rows = [];
  let rm;
  while ((rm = rowRe.exec(tableHtml)) !== null) {
    const cells = [];
    let cm;
    const rowInner = rm[1];
    // reset regex
    cellRe.lastIndex = 0;
    while ((cm = cellRe.exec(rowInner)) !== null) {
      let cell = cm[1];
      cell = cell.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/gi, (m) => {
        const texM = m.match(/<annotation[^>]*>([\s\S]*?)<\/annotation>/i);
        return texM ? `$${texM[1].trim()}$` : "";
      });
      cell = stripTags(cell).replace(/\|/g, "\\|");
      cells.push(cell.trim());
    }
    if (cells.length) rows.push(cells);
  }
  if (!rows.length) return "";
  const header = rows[0];
  const lines = [];
  lines.push("| " + header.join(" | ") + " |");
  lines.push("| " + header.map(() => "---").join(" | ") + " |");
  for (let i = 1; i < rows.length; i++) {
    // pad if row shorter
    while (rows[i].length < header.length) rows[i].push("");
    lines.push("| " + rows[i].join(" | ") + " |");
  }
  return lines.join("\n");
}

// ---------- CDP screenshot (optional) ----------
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function tryCdpScreenshots(pageUrls, serverPort, outDir, figureInfos) {
  // Hard timeout for the whole CDP session (plan requirement: never block indefinitely)
  const OVERALL_MS = 360000;
  const NAV_MS = 15000;
  const EVALUATE_MS = 8000;
  const CAPTURE_MS = 15000;
  if (!fs.existsSync(chromePath)) return false;
  let chromeProc = null;
  let profileDir = null;
  let ws = null;
  const run = async () => {
    const port = await freePort();
    profileDir = fs.mkdtempSync(path.join(fs.realpathSync("/tmp"), "bundle-chrome-"));
    chromeProc = spawn(
      chromePath,
      [
        "--headless=new",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--allow-file-access-from-files",
        "--remote-debugging-port=" + port,
        "--user-data-dir=" + profileDir,
        "--window-size=1280,900",
        "about:blank",
      ],
      { stdio: "ignore" }
    );
    // wait for cdp (hard timeout NAV_MS)
    const target = await withTimeout(
      waitFor(async () => {
        const res = await fetch("http://127.0.0.1:" + port + "/json/list");
        if (!res.ok) throw new Error("cdp not ready");
        const list = await res.json();
        const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
        if (!page) throw new Error("no page target");
        return page;
      }, 12000, "chrome page target"),
      NAV_MS,
      "chrome cdp connect"
    );
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await withTimeout(
      new Promise((resolve, reject) => {
        ws.addEventListener("open", resolve, { once: true });
        ws.addEventListener("error", reject, { once: true });
        setTimeout(() => reject(new Error("ws open timeout")), 5000);
      }),
      6000,
      "ws open"
    );
    const cdp = makeCdp(ws);
    await withTimeout(cdp.send("Page.enable"), 5000, "Page.enable");
    await withTimeout(cdp.send("Page.setLifecycleEventsEnabled", { enabled: true }), 5000, "Page.setLifecycleEventsEnabled");
    await withTimeout(cdp.send("Runtime.enable"), 5000, "Runtime.enable");
    try {
      await withTimeout(cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 2, mobile: false }), 5000, "Emulation");
    } catch {}
    for (const u of pageUrls) {
      await withTimeout(cdpNavigate(cdp, u), NAV_MS, "navigate " + u);
      const figs = figureInfos[pageUrls.indexOf(u)];
      const document = await withTimeout(cdp.send("DOM.getDocument", { depth: 1 }), EVALUATE_MS, "DOM.getDocument");
      const found = await withTimeout(cdp.send("DOM.querySelectorAll", { nodeId: document.root.nodeId, selector: "figure.fig" }), EVALUATE_MS, "DOM.querySelectorAll");
      if (found.nodeIds.length !== figs.length) throw new Error(`Figure count mismatch: ${found.nodeIds.length} vs ${figs.length}`);
      for (let i = 0; i < figs.length; i++) {
        const fig = figs[i];
        const frames = fig.kind === "animated" ? ["t0", "tmid", "tend"] : ["t0"];
        for (const frame of frames) {
          if (frame !== "t0") await new Promise(resolve => setTimeout(resolve, 900));
          const box = await withTimeout(cdp.send("DOM.getBoxModel", { nodeId: found.nodeIds[i] }), EVALUATE_MS, `DOM.getBoxModel ${i}`);
          const quad = box.model.border;
          const rect = { x: Math.min(quad[0], quad[2], quad[4], quad[6]), y: Math.min(quad[1], quad[3], quad[5], quad[7]), width: box.model.width, height: box.model.height };
          if (!rect.width || !rect.height || rect.width > 5000 || rect.height > 5000) throw new Error(`Invalid figure bounds ${i}`);
          const shot = await withTimeout(cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { ...rect, scale: 1 } }), CAPTURE_MS, `capture ${i}`);
          fs.writeFileSync(path.join(outDir, `fig-${fig.page}-${fig.fileKey}-${frame}.png`), Buffer.from(shot.data, "base64"));
        }
      }
    }
    return true;
  };
  try {
    return await withTimeout(run(), OVERALL_MS, "tryCdpScreenshots overall");
  } catch (e) {
    throw e;
  } finally {
    try { if (ws) ws.close(); } catch {}
    try { if (chromeProc) chromeProc.kill("SIGKILL"); } catch {}
    // Give chrome a moment to exit, but don't block forever
    await new Promise((r) => setTimeout(r, 250));
    try { if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 4, retryDelay: 50 }); } catch {}
  }
}

function makeCdp(ws) {
  let nextId = 1;
  const pending = new Map();
  const lifecycle = [];
  const waiters = [];
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === "Page.lifecycleEvent") {
      lifecycle.push(msg.params);
      for (const waiter of waiters.splice(0)) {
        if (lifecycle.some(event => event.name === "load" && event.loaderId === waiter.loaderId)) waiter.resolve();
        else waiters.push(waiter);
      }
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });
  return {
    waitLoad(loaderId) {
      if (!loaderId || lifecycle.some(event => event.name === "load" && event.loaderId === loaderId)) return Promise.resolve();
      return new Promise(resolve => waiters.push({ loaderId, resolve }));
    },
    send(method, params, timeoutMs = 20000) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(method + " timed out"));
        }, timeoutMs);
        pending.set(id, {
          resolve: (v) => { clearTimeout(timer); resolve(v); },
          reject: (e) => { clearTimeout(timer); reject(e); },
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    async evaluate(expression) {
      const result = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "evaluate failed");
      return result.result.value;
    },
  };
}
async function cdpNavigate(cdp, url) {
  await cdp.send("Page.navigate", { url: "about:blank" });
  const nav = await withTimeout(cdp.send("Page.navigate", { url }), 8000, "Page.navigate");
  if (nav?.errorText) throw new Error("navigate: " + nav.errorText);
  await withTimeout(cdp.waitLoad(nav?.loaderId), 15000, "page load");
  try { await withTimeout(cdp.send("Page.bringToFront"), 3000, "bringToFront"); } catch {}
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    try { return await fn(); } catch (err) { last = err; await new Promise((r) => setTimeout(r, 80)); }
  }
  throw new Error((label || "waitFor") + " timed out: " + (last && last.message));
}

// ---------- Main bundle logic ----------

function parseArgs(argv) {
  const pages = [];
  let out = DEFAULT_OUT;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out" && argv[i + 1]) {
      out = path.resolve(argv[++i]);
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown option ${a}`);
    } else {
      pages.push(path.resolve(a));
    }
  }
  return { pages, out };
}

async function main() {
  const { pages, out } = parseArgs(process.argv.slice(2));
  if (!pages.length) {
    console.error("Usage: bundle.mjs <page.html>... --out <dir>");
    console.error("  Example: node scripts/audit/bundle.mjs notes/book5/ch01-radiation-and-radioactivity/25-1.html --out .audit/bundles/book5/25-1");
    process.exit(1);
  }
  // Validate pages exist
  for (const p of pages) {
    if (!fs.existsSync(p)) {
      console.error(`Page not found: ${p}`);
      process.exit(1);
    }
  }

  fs.mkdirSync(out, { recursive: true });
  for (const file of fs.readdirSync(out).filter(name => name.startsWith("fig-") || name.startsWith("dse-"))) fs.unlinkSync(path.join(out, file));

  // Determine book/section for naming
  // We keep out as requested; do not auto-subdir, but manifest records pages.
  const notesRoot = path.join(repoRoot, "notes");
  const gitSha = getGitSha();

  // Attempt static server + CDP screenshots (best effort) with hard timeouts
  let cdpOk = false;
  let server = null;
  let serverPort = null;
  if (fs.existsSync(chromePath)) {
    try {
      const s = await withTimeout(startStaticServer(notesRoot), 6000, "startStaticServer");
      server = s.server;
      serverPort = s.port;
      const pageUrls = pages.map((p) => {
        const rel = path.relative(notesRoot, p).replace(/\\/g, "/");
        return `http://127.0.0.1:${serverPort}/${rel}`;
      });
      const figureInfos = pages.map(p => extractFigures(stripDseBlocks(fs.readFileSync(p, "utf8")).html).ideaFigs.map(fig => ({ ...fig, page: path.basename(p, ".html") })));
      cdpOk = await tryCdpScreenshots(pageUrls, serverPort, out, figureInfos);
    } finally {
      await closeServer(server, 2000);
    }
  }

  // Build notes.md deterministically from HTML
  let mdParts = [];
  let allFigures = []; // for manifest
  let dseDecksStripped = 0;
  let pageInfos = [];

  mdParts.push(`# Notes bundle`);
  mdParts.push(`Generated: ${new Date().toISOString()}`);
  mdParts.push(`Notes ref: ${gitSha}`);
  mdParts.push(`Pages: ${pages.map((p) => path.relative(repoRoot, p)).join(", ")}`);
  mdParts.push("");

  for (const pagePath of pages) {
    const rawHtml = fs.readFileSync(pagePath, "utf8");
    const { html, count: stripped } = stripDseBlocks(rawHtml);
    dseDecksStripped += stripped;
    const pageFigs = extractFigures(html).ideaFigs;
    const rel = path.relative(notesRoot, pagePath);
    const pageSha = sha256Hex(Buffer.from(rawHtml, "utf8"));
    pageInfos.push({ input: path.relative(repoRoot, pagePath), relative: rel, sha256: pageSha });

    // Derive section id like 25-1 from filename
    const base = path.basename(pagePath, ".html"); // 25-1 or summary
    const bookMatch = pagePath.match(/notes\/(book\d+)\//);
    const book = bookMatch ? bookMatch[1] : "book5";

    mdParts.push(`## Page: ${rel} [${book}:${base}]`);
    mdParts.push("");
    const pageId = sectionIdForPath(pagePath);

    // LO block: anchor is the id named by the section's aria-labelledby, resolved
    // inside the section; emit no LO token when the section has no such id.
    const loBlock = extractLoBlock(html);
    const loLabelledBy = loBlock ? (loBlock.match(/aria-labelledby="([^"]+)"/) || [])[1] : null;
    const loAnchor = loLabelledBy && loBlock.includes(`id="${loLabelledBy}"`);
    if (loBlock && loAnchor) {
      const loText = htmlToText(loBlock);
      mdParts.push(`### Learning objectives [§${pageId}.lo #${loLabelledBy}]`);
      mdParts.push(loText);
      mdParts.push("");
    }

    // Idea blocks
    const ideas = extractIdeaBlocks(html);
    for (const idea of ideas) {
      const secNum = idea.secNum;
      // Stable anchor format per plan: [§25-1.B #knockout], page-qualified
      const mdAnchor = `[§${pageId}.${secNum} #${idea.id}]`;
      mdParts.push(`### ${mdAnchor} ${stripTags(idea.heading)}`);
      mdParts.push("");
      // Extract scope: text without figures for reading order, then figures
      let ideaText = idea.inner;
      // Keep hud labels as text
      const huds = [];
      const hudRe = /<span\s+class="hud-label"[^>]*>([^<]+)<\/span>/gi;
      let hm;
      while ((hm = hudRe.exec(idea.inner)) !== null) huds.push(hm[1].trim());
      // Remove figure blocks temporarily to avoid duplication, but we will render them as separate subsections
      const figuresInIdea = [];
      const figRe = /<figure[\s\S]*?<\/figure>/gi;
      let cleaned = idea.inner.replace(figRe, (m) => {
        // Check if this is an idea figure; stash for later
        figuresInIdea.push(m);
        return " [FIGURE] ";
      });
      // Convert remaining inner to text + tables
      const tables = extractTables(cleaned);
      // Strip figure placeholders already
      let textPart = htmlToText(cleaned);
      if (textPart) {
        mdParts.push(textPart);
        mdParts.push("");
      }
      if (tables.length) {
        for (const t of tables) {
          mdParts.push(tableToMarkdown(t));
          mdParts.push("");
        }
      }
      if (huds.length) {
        mdParts.push(`HUD labels: ${huds.join(", ")}`);
        mdParts.push("");
      }
      // Now emit figures that sit inside this idea (page-level extraction keeps file keys stable)
      const ideaFigData = pageFigs.filter(f => idea.html.includes(f.html));
      for (const fig of ideaFigData) {
        if (fig.anchor) mdParts.push(`#### [§${pageId}.${secNum} #${fig.anchor}]`);
        else mdParts.push(`#### Figure (no DOM id; cite #${idea.id})`);
        if (fig.caption) mdParts.push(fig.caption);
        if (fig.huds.length) mdParts.push(`HUD: ${fig.huds.join(", ")}`);
        mdParts.push(`Figure type: ${fig.kind}${fig.anchor ? ` (anchor: ${fig.anchor})` : ""}`);
        mdParts.push("");
        allFigures.push({ anchor: fig.anchor, fileKey: fig.fileKey, page: base, kind: fig.kind, idea: idea.id });
      }
      // Checks (concept checks) – they are revealed content, keep them
      const checkRe = /<div\s+class="check"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
      // Simpler: capture hidden explains
      const explains = [];
      const expRe = /<div\s+class="explain"[^>]*hidden[^>]*>([\s\S]*?)<\/div>/gi;
      let em;
      while ((em = expRe.exec(idea.inner)) !== null) {
        explains.push(htmlToText(em[1]));
      }
      if (explains.length) {
        mdParts.push(`Checks (revealed):`);
        for (const ex of explains) mdParts.push(`- ${ex.slice(0, 300)}`);
        mdParts.push("");
      }
    }

  }

  const notesMd = mdParts.join("\n");
  const notesMdPath = path.join(out, "notes.md");
  fs.writeFileSync(notesMdPath, notesMd, "utf8");
  const notesSha = sha256Hex(Buffer.from(notesMd, "utf8"));

  const figFiles = [];
  for (const fig of allFigures) {
    const frames = fig.kind === "animated" ? ["t0", "tmid", "tend"] : ["t0"];
    for (const frame of frames) {
      const name = `fig-${fig.page}-${fig.fileKey}-${frame}.png`;
      if (!fs.existsSync(path.join(out, name))) throw new Error(`Missing captured figure ${name}`);
      figFiles.push({ anchor: fig.anchor, file: name, frame, kind: fig.kind, page: fig.page });
    }
  }
  // If no figures found (edge), ensure at least we scanned correctly – don't fail gate, just record
  // Also ensure CDP pngs are counted
  const finalPngs = fs.readdirSync(out).filter((f) => f.endsWith(".png"));

  // Manifest
  const manifest = {
    version: "bundle.v1",
    generated_at: new Date().toISOString(),
    pages: pageInfos,
    notes_ref: gitSha,
    notes_md: { path: "notes.md", sha256: notesSha, bytes: Buffer.byteLength(notesMd, "utf8") },
    figures: figFiles,
    png_count: finalPngs.length,
    cdp_used: cdpOk,
    dse_decks_stripped: dseDecksStripped,
    byte_length: Buffer.byteLength(notesMd, "utf8"),
    token_estimate: Math.ceil(Buffer.byteLength(notesMd, "utf8") / 4) + figFiles.length * 3000, // ~3k per figure as per plan
    includes_dse: false,
  };
  // Bundle sha is sha of notes.md + figure list (deterministic)
  const bundleSha = sha256Hex(Buffer.from(notesSha + JSON.stringify(figFiles.map(f => [f.file, sha256File(path.join(out, f.file))])), "utf8"));
  manifest.bundle_sha = bundleSha;

  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log(`Bundle written to ${out}`);
  console.log(`  pages: ${pageInfos.length}, figures: ${figFiles.length} (pngs: ${finalPngs.length}), DSE decks stripped: ${dseDecksStripped}`);
  console.log(`  notes.md ${manifest.notes_md.bytes} bytes, token_est ${manifest.token_estimate}, bundle_sha ${bundleSha.slice(0, 12)}`);
}

export { extractFigures, extractIdeaBlocks, stripDseBlocks };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
