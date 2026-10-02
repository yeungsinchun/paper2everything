import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const notesDir = path.resolve(here, "..");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const evidenceDir = process.env.EVIDENCE_DIR || "";

function pageUrl(name) {
  return pathToFileURL(path.join(notesDir, name)).href;
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close((err) => (err ? reject(err) : resolve(port)));
    });
    server.on("error", reject);
  });
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, 80));
    }
  }
  throw new Error((label || "waitFor") + " timed out: " + (last && last.message));
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.lifecycleWaiters = [];
    this.recentLifecycle = [];
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
        return;
      }
      if (msg.method === "Page.lifecycleEvent") {
        this.recentLifecycle.push(msg.params || {});
        if (this.recentLifecycle.length > 30) this.recentLifecycle.shift();
        this.flushLifecycleWaiters();
      }
    });
  }

  send(method, params, timeoutMs) {
    const id = this.nextId++;
    const ms = timeoutMs == null ? 20000 : timeoutMs;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(method + " timed out after " + ms + "ms"));
      }, ms);
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  lifecycleMatches(waiter, params) {
    if (waiter.name !== params.name) return false;
    if (!waiter.loaderId) return false;
    return waiter.loaderId === params.loaderId;
  }

  flushLifecycleWaiters() {
    for (let i = 0; i < this.lifecycleWaiters.length; i += 1) {
      const waiter = this.lifecycleWaiters[i];
      const hit = this.recentLifecycle.find((params) => this.lifecycleMatches(waiter, params));
      if (!hit) continue;
      this.lifecycleWaiters.splice(i, 1);
      clearTimeout(waiter.timer);
      waiter.resolve(hit);
      i -= 1;
    }
  }

  waitLifecycle(name, loaderId, timeoutMs) {
    return new Promise((resolve, reject) => {
      const waiter = { name, loaderId, resolve, reject, timer: null };
      waiter.timer = setTimeout(() => {
        this.lifecycleWaiters = this.lifecycleWaiters.filter((w) => w !== waiter);
        reject(new Error("Page.lifecycleEvent " + name + " timed out"));
      }, timeoutMs);
      this.lifecycleWaiters.push(waiter);
      this.flushLifecycleWaiters();
    });
  }

  async evaluate(expression, timeoutMs) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, timeoutMs);
    if (result.exceptionDetails) {
      const desc = result.exceptionDetails.exception && result.exceptionDetails.exception.description;
      throw new Error(desc || result.exceptionDetails.text || "evaluate failed");
    }
    return result.result.value;
  }

  async navigateOnce(url, timeoutMs) {
    const nav = await this.send("Page.navigate", { url });
    if (nav && nav.errorText) throw new Error("navigate " + url + ": " + nav.errorText);
    if (!nav || !nav.loaderId) return;
    try {
      await this.waitLifecycle("load", nav.loaderId, timeoutMs);
    } catch (err) {
      const state = await this.evaluate("document.readyState");
      if (state !== "complete" && state !== "interactive") throw err;
    }
  }

  async goto(url) {
    const dest = new URL(url);
    dest.searchParams.set("_cdp", String(Date.now()));
    await this.navigateOnce("about:blank", 8000);
    await this.navigateOnce(dest.href, 15000);
    try { await this.send("Page.bringToFront"); } catch (_) { /* headless */ }
    try {
      await this.evaluate("new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)))", 8000);
    } catch (_) {
      // Multi-canvas notes pages can starve rAF while WebGL boots; tests wait on scenes.
    }
  }

  async screenshot(filePath, selector) {
    if (selector) {
      await this.evaluate(
        "(function () { var el = document.querySelector(" +
          JSON.stringify(selector) +
          "); el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -72); })()"
      );
      await this.evaluate("new Promise((r) => setTimeout(r, 120))");
    }
    const shot = await this.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filePath, Buffer.from(shot.data, "base64"));
  }
}

let chromeProc;
let cdp;
let profileDir;

before(async () => {
  if (!fs.existsSync(chromePath)) {
    throw new Error("Google Chrome is required to exercise the notes pages");
  }
  profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "notes-chrome-"));
  const port = await freePort();
  chromeProc = spawn(
    chromePath,
    [
      "--headless=new",
      "--use-angle=swiftshader",
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
  const target = await waitFor(async () => {
    const res = await fetch("http://127.0.0.1:" + port + "/json/list");
    if (!res.ok) throw new Error("cdp not ready");
    const list = await res.json();
    const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    if (!page) throw new Error("no page target");
    return page;
  }, 15000, "chrome page target");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  cdp = new Cdp(ws);
  await cdp.send("Page.enable");
  await cdp.send("Page.setLifecycleEventsEnabled", { enabled: true });
  await cdp.send("Runtime.enable");
  try {
    await cdp.send("Network.enable");
    /* The chapter pages @import Google Fonts; the system fallbacks render the
       same layout, and a slow font fetch must not stall the load event. */
    await cdp.send("Network.setBlockedURLs", {
      urls: ["*://fonts.googleapis.com/*", "*://fonts.gstatic.com/*"],
    });
  } catch (_) { /* older Chrome */ }
  try {
    await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  } catch (_) { /* older Chrome */ }
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });
});

after(async () => {
  if (cdp && cdp.ws) {
    try { cdp.ws.close(); } catch (_) { /* already closed */ }
  }
  if (chromeProc) {
    chromeProc.kill("SIGKILL");
    await new Promise((r) => setTimeout(r, 200));
  }
  if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 8, retryDelay: 50 });
});

function near(actual, expected, tol) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    "expected " + actual + " within " + tol + " of " + expected
  );
}

function chromeTest(name, fn) {
  test(name, { timeout: evidenceDir ? 240000 : 180000 }, fn);
}

/* Section 22.2 contracts (reference pack R2):
   - figure: recognisable live/neutral/earth parallel circuit, fault state
   - arithmetic: working current -> standard fuse -> compatible cable
   - cable colours are the physical code, separate from the quantity palette
   - wrong -> retry -> right checks, Show/Hide, selectors, Replay/Pause, Prev/Next
   - no page overflow at 390x844 or 1280x800, resize keeps state */
describe("Book 4 Ch.4 section 22.2 domestic circuit", { concurrency: 1 }, () => {

chromeTest("22.2 wiring figure is a labelled live/neutral/earth parallel circuit", async () => {
  await cdp.goto(pageUrl("22-2.html"));
  const fig = await cdp.evaluate(`(function () {
    var host = document.getElementById("wiring-figure");
    var svg = host.querySelector("svg");
    var stroke = function (sel) { return getComputedStyle(svg.querySelector(sel)).stroke; };
    var fuseBox = svg.querySelector('[data-part="fuse"] .fuse-body').getBBox();
    var caseBox = svg.querySelector('[data-part="case"]').getBBox();
    var bond = svg.querySelector('[data-part="earth-bond"]');
    var bondLen = bond.getTotalLength();
    var bondStart = bond.getPointAtLength(0);
    var bondEnd = bond.getPointAtLength(bondLen);
    var texts = Array.from(svg.querySelectorAll("text")).map(function (t) {
      var b = t.getBBox();
      return { text: t.textContent, x: b.x, y: b.y, w: b.width, h: b.height };
    });
    var outside = texts.filter(function (t) {
      return t.x < 0 || t.y < 0 || t.x + t.w > 640 || t.y + t.h > 440;
    }).map(function (t) { return t.text; });
    return {
      canvas: !!host.querySelector("canvas"),
      hudLabels: document.querySelectorAll("#wiring .hud-label").length,
      role: svg.getAttribute("role"),
      title: (svg.querySelector("title") || {}).textContent || "",
      live: !!svg.querySelector('[data-part="live"]'),
      neutral: !!svg.querySelector('[data-part="neutral"]'),
      earth: !!svg.querySelector('[data-part="earth"]'),
      branches: svg.querySelectorAll(".branch").length,
      switches: svg.querySelectorAll(".switch-box").length,
      fuseInLive: Math.abs(fuseBox.y + fuseBox.height / 2 - 140) < 1,
      caseTop: caseBox.y,
      bondTop: [bondStart.x, bondStart.y],
      bondEnd: [bondEnd.x, bondEnd.y],
      caseLeft: caseBox.x,
      caseRight: caseBox.x + caseBox.width,
      caseBottom: caseBox.y + caseBox.height,
      liveStroke: stroke(".wire-live"),
      neutralStroke: stroke(".wire-neutral"),
      earthStroke: stroke(".wire-earth"),
      wireTokens: ["--wire-live", "--wire-neutral", "--wire-earth"].map(function (key) {
        return getComputedStyle(document.documentElement).getPropertyValue(key).trim();
      }),
      legend: document.querySelector(".wire-legend").textContent.replace(/\\s+/g, " ").trim(),
      legendKeys: document.querySelectorAll(".wire-legend .wire-key").length,
      svgMentionsQuantityPalette: /fig-(force|velocity|accel|displacement|distance|energy|field)/.test(svg.innerHTML),
      outside: outside,
      labels: texts.map(function (t) { return t.text; }).join(" | ")
    };
  })()`);
  assert.equal(fig.canvas, false, "the wiring figure is a responsive SVG, not a three.js canvas");
  assert.equal(fig.hudLabels, 0, "the clipped HUD label is gone");
  assert.equal(fig.role, "img");
  assert.match(fig.title, /live, neutral and earth/i);
  assert.equal(fig.live, true);
  assert.equal(fig.neutral, true);
  assert.equal(fig.earth, true);
  assert.equal(fig.branches, 2, "two parallel appliance branches");
  assert.equal(fig.switches, 2, "each branch is switched in live");
  assert.equal(fig.fuseInLive, true, "the fuse sits on the live conductor");
  assert.ok(fig.caseTop >= 235, "metal case drawn below the live bus");
  assert.ok(Math.abs(fig.bondTop[0] - 560) < 2, "earth bond starts at the case");
  assert.ok(fig.bondTop[1] <= fig.caseBottom + 1 && fig.bondTop[1] >= fig.caseBottom - 1,
    "earth bond leaves the case bottom");
  assert.ok(fig.bondTop[0] >= fig.caseLeft && fig.bondTop[0] <= fig.caseRight);
  assert.ok(fig.bondEnd[1] >= fig.caseBottom + 60, "earth bond reaches the earth bus");
  assert.equal(fig.liveStroke, "rgb(124, 74, 33)");
  assert.equal(fig.neutralStroke, "rgb(36, 86, 166)");
  assert.equal(fig.earthStroke, "rgb(46, 125, 70)");
  assert.deepEqual(fig.wireTokens, ["#7c4a21", "#2456a6", "#2e7d46"]);
  assert.match(fig.legend, /Live · brown/);
  assert.match(fig.legend, /Neutral · blue/);
  assert.match(fig.legend, /Earth · green\/yellow/);
  assert.match(fig.legend, /Cable colours identify conductors, not quantities\./);
  assert.equal(fig.legendKeys, 3);
  assert.equal(fig.svgMentionsQuantityPalette, false, "wire colours never reuse the quantity palette");
  assert.deepEqual(fig.outside, [], "every figure label sits inside the viewBox");
  assert.match(fig.labels, /main fuse/);
  assert.match(fig.labels, /metal case/);
  assert.match(fig.labels, /2 kW/);
  assert.doesNotMatch(fig.labels, /Household ci|Fuse and cab/);
});

chromeTest("22.2 fault runs a finite earth sequence with Replay and Pause", async () => {
  await cdp.goto(pageUrl("22-2.html"));
  await cdp.evaluate("document.getElementById('wiring').scrollIntoView()");

  async function visual() {
    return cdp.evaluate(`(function () {
      var svg = document.querySelector("#wiring-figure svg");
      var op = function (sel) { return parseFloat(getComputedStyle(svg.querySelector(sel)).opacity); };
      var show = function (sel) { return getComputedStyle(svg.querySelector(sel)).display !== "none"; };
      return {
        phase: document.getElementById("wiring-figure").getAttribute("data-phase"),
        state: document.getElementById("wiring-figure").getAttribute("data-state"),
        flow: op('[data-part="fault-flow"]'),
        strike: op('[data-part="fault-strike"]'),
        caseLive: op('[data-part="case-live"]'),
        caseSafe: op('[data-part="case-safe"]'),
        faultCase: op('[data-part="fault-case"]'),
        fuseOpenShown: show('[data-part="fuse-open"]'),
        fuseClosedShown: show('[data-part="fuse-closed"]'),
        branchOpacity: parseFloat(getComputedStyle(svg.querySelector(".branch")).opacity),
        dashOffset: Number(svg.querySelector('[data-part="fault-flow"]').getAttribute("stroke-dashoffset"))
      };
    })()`);
  }

  const normal = await cdp.evaluate("window.NotesCircuit.wiring.snapshot()");
  assert.equal(normal.mode, "normal");
  assert.equal(normal.fuseOpen, false);
  let view = await visual();
  assert.equal(view.state, "normal");
  assert.equal(view.phase, "0");
  assert.equal(view.flow, 0);
  assert.equal(view.caseSafe, 0);

  const early = await cdp.evaluate("window.NotesCircuit.wiring.seek(0.2)");
  assert.equal(early.mode, "fault");
  assert.equal(early.phase, 1);
  assert.equal(early.earthPathActive, true);
  assert.equal(early.fuseOpen, false);
  view = await visual();
  assert.equal(view.phase, "1");
  assert.equal(view.flow, 1, "earth path lights up while the fault flows");
  assert.equal(view.strike, 1, "the live-to-case strike is drawn");
  assert.equal(view.caseLive, 1, "the case is labelled live");
  assert.equal(view.fuseClosedShown, true, "the fuse has not yet opened");
  assert.ok(view.dashOffset < 0, "fault current animates along the earth path");
  assert.equal(await cdp.evaluate("document.getElementById('wiring-status').textContent").then((t) => /earth wire/.test(t)), true);

  const terminal = await cdp.evaluate("window.NotesCircuit.wiring.seek(1)");
  assert.equal(terminal.phase, 3);
  assert.equal(terminal.fuseOpen, true);
  assert.equal(terminal.caseSafe, true);
  view = await waitFor(async () => {
    const snap = await visual();
    if (!(snap.branchOpacity < 0.5)) throw new Error("branch opacity still " + snap.branchOpacity);
    return snap;
  }, 3000, "branches dim");
  assert.equal(view.fuseOpenShown, true, "the fuse shows its break");
  assert.equal(view.fuseClosedShown, false);
  assert.equal(view.caseSafe, 1, "the terminal frame labels the case safe");
  assert.match(await cdp.evaluate("document.getElementById('wiring-status').textContent"), /Fuse open/);

  await cdp.evaluate("window.NotesCircuit.wiring.normal()");
  const started = await cdp.evaluate("window.NotesCircuit.wiring.play()");
  assert.equal(started.playing, true);
  assert.equal(started.earthPathActive, true);
  await new Promise((r) => setTimeout(r, 350));
  const paused = await cdp.evaluate("window.NotesCircuit.wiring.pause()");
  assert.equal(paused.paused, true);
  assert.ok(paused.progress > 0 && paused.progress < 1, "paused mid-run, p=" + paused.progress);
  await new Promise((r) => setTimeout(r, 400));
  const frozen = await cdp.evaluate("window.NotesCircuit.wiring.snapshot()");
  assert.equal(frozen.progress, paused.progress, "Pause freezes the run");
  await cdp.evaluate("window.NotesCircuit.wiring.resume()");
  const finished = await waitFor(async () => {
    const snap = await cdp.evaluate("window.NotesCircuit.wiring.snapshot()");
    if (snap.playing) throw new Error("still running");
    return snap;
  }, 6000, "fault run completes after Resume");
  assert.equal(finished.progress, 1);
  assert.equal(finished.fuseOpen, true);

  const replayed = await cdp.evaluate("window.NotesCircuit.wiring.replay()");
  assert.equal(replayed.playing, true);
  assert.ok(replayed.progress < finished.progress, "Replay restarts the finite run");
  await waitFor(async () => {
    const snap = await cdp.evaluate("window.NotesCircuit.wiring.snapshot()");
    if (snap.playing) throw new Error("still running");
    return snap;
  }, 6000, "replayed run settles");

  await cdp.evaluate("window.NotesCircuit.wiring.normal()");
  const reset = await visual();
  assert.equal(reset.state, "normal");
  assert.equal(reset.phase, "0");
  assert.equal(reset.fuseOpenShown, false);

  if (evidenceDir) {
    await cdp.evaluate("window.NotesCircuit.wiring.seek(0.2)");
    await cdp.screenshot(path.join(evidenceDir, "22-2-wiring-fault.png"), "#wiring");
    await cdp.evaluate("window.NotesCircuit.wiring.seek(1)");
    await cdp.screenshot(path.join(evidenceDir, "22-2-wiring-fuse-open.png"), "#wiring");
    await cdp.evaluate("window.NotesCircuit.wiring.normal()");
  }
});

chromeTest("22.2 reduced motion jumps to the labelled terminal frame", async () => {
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  try {
    await cdp.goto(pageUrl("22-2.html"));
    const snap = await cdp.evaluate("window.NotesCircuit.wiring.play()");
    assert.equal(snap.progress, 1);
    assert.equal(snap.playing, false);
    assert.equal(snap.fuseOpen, true);
    assert.equal(snap.caseSafe, true);
  } finally {
    await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  }
});

chromeTest("22.2 fuse steps keep current, fuse and cable compatible", async () => {
  await cdp.goto(pageUrl("22-2.html"));
  const fuseHost = await cdp.evaluate(`(function () {
    var host = document.getElementById("fuse-figure");
    var svg = host.querySelector("svg");
    return {
      step: host.getAttribute("data-step"),
      readout: document.getElementById("fuse-step-readout").textContent,
      steps: Array.from(document.querySelectorAll("[data-fuse-step]")).map(function (b) {
        return {
          step: b.getAttribute("data-fuse-step"),
          pressed: b.getAttribute("aria-pressed"),
          text: b.textContent.replace(/\\s+/g, " ").trim()
        };
      }),
      cable: svg.querySelector('[data-part="cable"] text').textContent,
      labels: Array.from(svg.querySelectorAll("text")).map(function (t) { return t.textContent; }).join(" | "),
      focus: (function () {
        var f = function (part) { return getComputedStyle(svg.querySelector('[data-part="' + part + '"]')).filter; };
        return { current: f("working-current"), fuse: f("fuse"), cable: f("cable") };
      })()
    };
  })()`);
  assert.equal(fuseHost.step, "1");
  assert.match(fuseHost.readout, /Working current/);
  assert.deepEqual(fuseHost.steps.map(function (s) { return s.step; }), ["1", "2", "3"]);
  assert.deepEqual(fuseHost.steps.map(function (s) { return s.pressed; }), ["true", "false", "false"]);
  assert.match(fuseHost.steps[0].text, /2000 \/ 220 ≈ 9\.1 A/);
  assert.match(fuseHost.steps[1].text, /13 A/);
  assert.match(fuseHost.steps[2].text, /≥ 13 A/);
  assert.match(fuseHost.labels, /13 A fuse/);
  assert.match(fuseHost.cable, /cable rated ≥ 13 A/);
  assert.notEqual(fuseHost.focus.current, "none", "step 1 highlights the working current");
  assert.equal(fuseHost.focus.fuse, "none");
  assert.equal(fuseHost.focus.cable, "none");

  async function focusState() {
    return cdp.evaluate(`(function () {
      var svg = document.querySelector("#fuse-figure svg");
      var f = function (part) { return getComputedStyle(svg.querySelector('[data-part="' + part + '"]')).filter; };
      return { current: f("working-current"), fuse: f("fuse"), cable: f("cable") };
    })()`);
  }

  const step2 = await cdp.evaluate("window.NotesCircuit.fuse.setStep('2')");
  assert.equal(step2.step, 2);
  assert.match(step2.why, /lowest standard rating/);
  /* filter transitions; pause until the active part owns the glow */
  const focus2 = await waitFor(async () => {
    const f = await focusState();
    if (f.current !== "none" || f.fuse === "none" || f.cable !== "none") {
      throw new Error("step 2 focus not settled: " + JSON.stringify(f));
    }
    return f;
  }, 3000, "step 2 focus");
  assert.notEqual(focus2.fuse, "none", "step 2 highlights the fuse");

  const step3 = await cdp.evaluate("window.NotesCircuit.fuse.setStep('3')");
  assert.equal(step3.step, 3);
  assert.match(step3.why, /outlasts the fuse/);
  const focus3 = await waitFor(async () => {
    const f = await focusState();
    if (f.current !== "none" || f.fuse !== "none" || f.cable === "none") {
      throw new Error("step 3 focus not settled: " + JSON.stringify(f));
    }
    return f;
  }, 3000, "step 3 focus");
  assert.notEqual(focus3.cable, "none", "step 3 highlights the cable");

  const copy = await cdp.evaluate("document.getElementById('fuse').innerText");
  assert.match(copy, /I = 2000 \/ 220 ≈ 9\.1 A/);
  assert.match(copy, /next standard above 9\.1 A → 13 A/);
  assert.match(copy, /rated ≥ 13 A/);
  const source = await cdp.evaluate("document.getElementById('fuse').textContent");
  assert.match(source, /1500\/220/, "the hidden Show-answer working keeps the kettle arithmetic");
  assert.match(source, /6\.8/);
  assert.match(copy, /Simplified classroom model: standard fuses 3 A, 5 A and 13 A/);
  assert.doesNotMatch(copy, /≥\s*10 A/, "the cable limit below the fuse is gone");
  assert.doesNotMatch(copy, /13 A fuse, cable rated/, "the old inconsistent option text is gone");
  assert.doesNotMatch(copy, /below the cable limit/);

  const answers = await cdp.evaluate(`(function () {
    var mc = document.querySelector("#fuse .check[data-check='mc']");
    var sa = document.querySelector("#fuse .check[data-check='sa']");
    return {
      mcAnswer: mc.getAttribute("data-answer"),
      mcCorrect: mc.querySelector('[data-choice="B"]').textContent.trim(),
      saPrompt: sa.querySelector("p").textContent,
      saModel: sa.querySelector(".model").innerText
    };
  })()`);
  assert.equal(answers.mcAnswer, "B");
  assert.match(answers.mcCorrect, /13 A fuse on live; cable rated ≥ 13 A/);
  assert.match(answers.saModel, /6\.8 A/);
  assert.match(answers.saModel, /13 A/);
  assert.match(answers.saModel, /≥ 13 A/);
  assert.match(answers.saPrompt, /1\.5 kW kettle/);

  if (evidenceDir) {
    await cdp.screenshot(path.join(evidenceDir, "22-2-fuse-step3.png"), "#fuse");
  }
});

chromeTest("22.2 checks nudge wrong answers, allow retry and reveal answers", async () => {
  await cdp.goto(pageUrl("22-2.html"));
  const heading = await cdp.evaluate(`Array.from(document.querySelectorAll(".idea .check h3")).map(function (h) { return h.textContent; })`);
  assert.deepEqual(heading, ["Quick check 1", "Quick check 2", "Write it 3"]);

  const wrong = await cdp.evaluate(`(function () {
    var box = document.querySelector("#wiring .check");
    box.querySelector('[data-choice="A"]').click();
    return {
      marks: {
        a: box.querySelector('[data-choice="A"]').classList.contains("wrong"),
        aDisabled: box.querySelector('[data-choice="A"]').disabled,
        bLive: !box.querySelector('[data-choice="B"]').disabled,
        cLive: !box.querySelector('[data-choice="C"]').disabled
      },
      feedback: box.querySelector(".feedback").textContent,
      feedbackClass: box.querySelector(".feedback").className,
      explainHidden: box.querySelector(".explain").hidden,
      rightNotRevealed: !box.querySelector('[data-choice="B"]').classList.contains("correct")
    };
  })()`);
  assert.equal(wrong.marks.a, true);
  assert.equal(wrong.marks.aDisabled, true);
  assert.equal(wrong.marks.bLive, true, "a wrong pick leaves the other options live");
  assert.equal(wrong.marks.cLive, true);
  assert.match(wrong.feedback, /Try another/);
  assert.match(wrong.feedbackClass, /no\b/);
  assert.equal(wrong.explainHidden, true, "reasoning waits for the right answer");
  assert.equal(wrong.rightNotRevealed, true);

  const right = await cdp.evaluate(`(function () {
    var box = document.querySelector("#wiring .check");
    box.querySelector('[data-choice="B"]').click();
    return {
      correct: box.querySelector('[data-choice="B"]').classList.contains("correct"),
      locked: Array.from(box.querySelectorAll("[data-choice]")).every(function (b) { return b.disabled; }),
      feedback: box.querySelector(".feedback").textContent,
      explain: !box.querySelector(".explain").hidden,
      explainText: box.querySelector(".explain").textContent.trim()
    };
  })()`);
  assert.equal(right.correct, true);
  assert.equal(right.locked, true, "the correct answer locks the group");
  assert.equal(right.feedback, "Right.");
  assert.equal(right.explain, true);
  assert.match(right.explainText, /full 220 V and independent switching/);

  const fuseWrong = await cdp.evaluate(`(function () {
    var box = document.querySelector("#fuse .check[data-check='mc']");
    box.querySelector('[data-choice="D"]').click();
    return { feedback: box.querySelector(".feedback").textContent, retry: !box.querySelector('[data-choice="B"]').disabled };
  })()`);
  assert.match(fuseWrong.feedback, /Try another/);
  assert.equal(fuseWrong.retry, true);
  const fuseRight = await cdp.evaluate(`(function () {
    var box = document.querySelector("#fuse .check[data-check='mc']");
    box.querySelector('[data-choice="B"]').click();
    return {
      correct: box.querySelector('[data-choice="B"]').classList.contains("correct"),
      explain: box.querySelector(".explain").textContent
    };
  })()`);
  assert.equal(fuseRight.correct, true);
  assert.match(fuseRight.explain, /9\.1 A/);
  assert.match(fuseRight.explain, /rated ≥ 13 A/);
  assert.match(fuseRight.explain, /never neutral or earth/);

  const sa = await cdp.evaluate(`(function () {
    var box = document.querySelector("#fuse .check[data-check='sa']");
    var btn = box.querySelector("[data-reveal]");
    var model = box.querySelector(".model");
    var before = { text: btn.textContent, expanded: btn.getAttribute("aria-expanded"), hidden: model.hidden };
    btn.click();
    var open = { text: btn.textContent, expanded: btn.getAttribute("aria-expanded"), hidden: model.hidden, body: model.innerText };
    btn.click();
    var closed = { text: btn.textContent, expanded: btn.getAttribute("aria-expanded"), hidden: model.hidden };
    return { before: before, open: open, closed: closed };
  })()`);
  assert.equal(sa.before.text, "Show answer");
  assert.equal(sa.before.expanded, "false");
  assert.equal(sa.before.hidden, true);
  assert.equal(sa.open.text, "Hide answer");
  assert.equal(sa.open.expanded, "true");
  assert.equal(sa.open.hidden, false);
  assert.match(sa.open.body, /6\.8 A/);
  assert.match(sa.open.body, /13 A/);
  assert.match(sa.open.body, /≥ 13 A/);
  assert.equal(sa.closed.text, "Show answer");
  assert.equal(sa.closed.expanded, "false");
  assert.equal(sa.closed.hidden, true);

  if (evidenceDir) {
    await cdp.screenshot(path.join(evidenceDir, "22-2-checks-retry-right.png"), "#wiring .check");
  }
});

chromeTest("22.2 page fits 390 and 1280, resizes with state and keeps deck Prev/Next", async () => {
  const sizes = [
    { width: 1280, height: 800, mobile: false },
    { width: 390, height: 844, mobile: true },
  ];
  for (const size of sizes) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: size.width, height: size.height, deviceScaleFactor: 1, mobile: size.mobile,
    });
    await cdp.goto(pageUrl("22-2.html"));
    const layout = await cdp.evaluate(`(function () {
      var mainBox = document.querySelector("main").getBoundingClientRect();
      var hostBox = function (id) {
        var r = document.getElementById(id).getBoundingClientRect();
        return { left: r.left, right: r.right, width: r.width, height: r.height };
      };
      var controls = Array.from(document.querySelectorAll(".row button, .step-card, .quiz-nav button")).filter(function (b) {
        return b.offsetParent !== null;
      }).map(function (b) {
        return { label: b.textContent.trim().slice(0, 24), height: b.getBoundingClientRect().height };
      });
      return {
        viewport: [window.innerWidth, window.innerHeight],
        scrollWidth: document.documentElement.scrollWidth,
        main: { left: mainBox.left, right: mainBox.right, width: mainBox.width },
        wiring: hostBox("wiring-figure"),
        fuse: hostBox("fuse-figure"),
        controls: controls
      };
    })()`);
    assert.equal(layout.viewport[0], size.width);
    assert.ok(layout.scrollWidth <= size.width + 1, "no page overflow at " + size.width + " (scrollWidth=" + layout.scrollWidth + ")");
    assert.ok(layout.wiring.left >= layout.main.left - 1 && layout.wiring.right <= layout.main.right + 1,
      "wiring figure stays inside main at " + size.width);
    assert.ok(layout.fuse.left >= layout.main.left - 1 && layout.fuse.right <= layout.main.right + 1,
      "fuse figure stays inside main at " + size.width);
    assert.ok(layout.wiring.height > 150 && layout.fuse.height > 150, "figures keep a readable aspect at " + size.width);
    layout.controls.forEach(function (control) {
      assert.ok(control.height >= 43.5, "control \"" + control.label + "\" is " + control.height + "px at " + size.width);
    });
  }

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
  });
  await cdp.goto(pageUrl("22-2.html"));
  await cdp.evaluate("document.getElementById('wiring').scrollIntoView(); window.NotesCircuit.wiring.seek(1)");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  });
  const resized = await cdp.evaluate(`(function () {
    var host = document.getElementById("wiring-figure");
    var rect = host.getBoundingClientRect();
    return {
      phase: host.getAttribute("data-phase"),
      fuseOpen: !getComputedStyle(host.querySelector('[data-part="fuse-open"]')).display.includes("none"),
      width: rect.width,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth
    };
  })()`);
  assert.equal(resized.phase, "3", "fault terminal state survives the resize");
  assert.equal(resized.fuseOpen, true);
  assert.ok(resized.scrollWidth <= resized.viewport + 1, "resize keeps the page inside the phone viewport");
  assert.ok(resized.width > 250 && resized.width < 360, "figure rescales to the phone content width");

  const deck = await cdp.evaluate(`(function () {
    var mc = document.querySelector('[data-quiz="mc"]');
    var status = mc.querySelector(".quiz-status");
    var first = status.textContent;
    mc.querySelector("[data-quiz-next]").click();
    var second = status.textContent;
    var secondSlide = mc.querySelector(".quiz-slide:not([hidden])").id;
    mc.querySelector("[data-quiz-prev]").click();
    var back = status.textContent;
    var firstSlide = mc.querySelector(".quiz-slide:not([hidden])").id;
    var lq = document.querySelector('[data-quiz="lq"]');
    return {
      first: first, second: second, back: back,
      firstSlide: firstSlide, secondSlide: secondSlide,
      dots: mc.querySelectorAll(".quiz-dot").length,
      lqStatus: lq.querySelector(".quiz-status").textContent
    };
  })()`);
  assert.equal(deck.first, "1 of 2");
  assert.equal(deck.second, "2 of 2");
  assert.equal(deck.back, "1 of 2");
  assert.notEqual(deck.firstSlide, deck.secondSlide);
  assert.equal(deck.dots, 2);
  assert.equal(deck.lqStatus, "1 of 1");
});

});
