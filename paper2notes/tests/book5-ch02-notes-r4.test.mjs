/* R4 reference tests for 26.1 §B (Half-life) and §D (Half-life from real data).
   Proves the five R4 claims on the actual page:
     1. long maths stays inside the viewport, no page-level overflow;
     2. parent/daughter and recorded/background/corrected values stay in sync
        with the figure and its slider/preset controls;
     3. a finite Replay/Pause clip with a stable terminal frame;
     4. complete optional working behind Show/Hide disclosures;
     5. a concise visible digest, plus wrong-to-retry-to-right checks and the
        DSE deck Prev/Next contract.

   Chrome is required. Run: node --test paper2notes/tests/book5-ch02-notes-r4.test.mjs
   The stale notes.interactives.test.mjs suite predates the #84 design-system
   migration and is red on origin/main; this file is the gate for R4. */

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const notesDir = path.resolve(here, "../notes/book5/ch02-rate-of-decay-and-uses-of-radionuclides");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

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

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
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

  async evaluate(expression, timeoutMs) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    }, timeoutMs);
    if (result.exceptionDetails) {
      const desc = result.exceptionDetails.exception && result.exceptionDetails.exception.description;
      throw new Error(desc || result.exceptionDetails.text || "evaluate failed");
    }
    return result.result.value;
  }

  async waitFor(expression, timeoutMs, label) {
    const start = Date.now();
    let last;
    while (Date.now() - start < timeoutMs) {
      try {
        const value = await this.evaluate(expression);
        if (value) return value;
      } catch (err) {
        last = err;
      }
      await new Promise((r) => setTimeout(r, 80));
    }
    throw new Error((label || "waitFor") + " timed out" + (last ? ": " + last.message : ""));
  }

  async goto(url) {
    const dest = new URL(url);
    dest.searchParams.set("_cdp", String(Date.now()));
    const nav = await this.send("Page.navigate", { url: dest.href });
    if (nav && nav.errorText) throw new Error("navigate " + dest.href + ": " + nav.errorText);
    await this.waitFor(
      "document.readyState === 'complete' || document.readyState === 'interactive'",
      15000,
      "load " + dest.pathname
    );
    await this.evaluate("new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)))", 8000)
      .catch(() => { /* WebGL boot may starve rAF; tests wait on scenes */ });
  }

  async setViewport(width, height, mobile) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: !!mobile
    });
  }
}

let chromeProc;
let cdp;
let profileDir;

before(async () => {
  if (!fs.existsSync(chromePath)) {
    throw new Error("Google Chrome is required to exercise the notes pages");
  }
  profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "notes-r4-chrome-"));
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
      "about:blank"
    ],
    { stdio: "ignore" }
  );
  const target = await new Promise((resolve, reject) => {
    const start = Date.now();
    (function poll() {
      fetch("http://127.0.0.1:" + port + "/json/list")
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("cdp not ready"))))
        .then((list) => {
          const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
          if (!page) throw new Error("no page target");
          resolve(page);
        })
        .catch((err) => {
          if (Date.now() - start > 15000) reject(err);
          else setTimeout(poll, 150);
        });
    })();
  });
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  cdp = new Cdp(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.setViewport(1280, 900, false);
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

async function openR4Page() {
  await cdp.goto(pageUrl("26-1.html"));
  await cdp.waitFor(
    "!!(window.NotesScenes && window.NotesScenes.halfN && window.NotesScenes.countbg)",
    10000,
    "26.1 R4 scenes"
  );
}

describe("26.1 R4 half-life and background reference", { concurrency: 1 }, () => {
  test("half-life: every 8 days halves N; parent + daughter always fill 40 billion", { timeout: 120000 }, async () => {
    await openR4Page();
    const steps = await cdp.evaluate(`(function () {
      function read(t) {
        var slider = document.getElementById("half-time");
        slider.value = String(t);
        slider.dispatchEvent(new Event("input", { bubbles: true }));
        var s = window.NotesScenes.halfN.snapshot();
        return {
          asked: t,
          tDays: s.tDays,
          n: s.remaining,
          d: s.decayed,
          total: s.remaining + s.decayed,
          conserved: s.conserved,
          playing: s.playing,
          outN: document.querySelector('[data-out="n"]').textContent,
          outD: document.querySelector('[data-out="d"]').textContent,
          outSum: document.querySelector('[data-out="sum"]').textContent,
          outT: document.getElementById("half-time-out").textContent,
          slider: slider.value
        };
      }
      return [read(0), read(8), read(16), read(24)];
    })()`);
    assert.deepEqual(steps.map((s) => s.tDays), [0, 8, 16, 24]);
    assert.deepEqual(steps.map((s) => Math.round(s.n * 100) / 100), [40, 20, 10, 5]);
    assert.deepEqual(steps.map((s) => Math.round(s.d * 100) / 100), [0, 20, 30, 35]);
    steps.forEach((s) => {
      assert.ok(Math.abs(s.total - 40) < 1e-9, "N + D must stay 40 billion at t=" + s.asked);
      assert.equal(s.conserved, true);
      assert.equal(s.playing, false, "a manual time selection pauses the clip");
      assert.match(s.outSum, /N \+ D = 40\.0 billion/);
    });
    assert.equal(steps[0].outN, "N = 40.0 billion");
    assert.equal(steps[1].outN, "N = 20.0 billion");
    assert.equal(steps[2].outD, "D = 30.0 billion");
    assert.equal(steps[3].outN, "N = 5.0 billion");
    assert.deepEqual(steps.map((s) => s.outT), ["0 d", "8 d", "16 d", "24 d"]);

    const preset = await cdp.evaluate(`(function () {
      document.querySelector('[data-half-set="16"]').click();
      var s = window.NotesScenes.halfN.snapshot();
      return {
        tDays: s.tDays,
        slider: document.getElementById("half-time").value,
        outT: document.getElementById("half-time-out").textContent,
        pressed: document.querySelector('[data-half-set="16"]').getAttribute("aria-pressed"),
        unpressed: document.querySelector('[data-half-set="0"]').getAttribute("aria-pressed")
      };
    })()`);
    assert.equal(preset.tDays, 16);
    assert.equal(preset.slider, "16");
    assert.equal(preset.outT, "16 d");
    assert.equal(preset.pressed, "true");
    assert.equal(preset.unpressed, "false");
  });

  test("half-life: Replay restarts the finite clip, Pause holds the clock", { timeout: 120000 }, async () => {
    await openR4Page();
    const paused = await cdp.evaluate(`(function () {
      var btn = document.querySelector('[data-pause="halfn-vis"]');
      document.querySelector('[data-replay="halfn-vis"]').click();
      var started = window.NotesScenes.halfN.snapshot();
      btn.click();
      var held = window.NotesScenes.halfN.snapshot();
      return {
        startedPlaying: started.playing,
        startedT: started.tDays,
        heldPlaying: held.playing,
        heldT: held.tDays,
        label: btn.textContent,
        pressed: btn.getAttribute("aria-pressed")
      };
    })()`);
    assert.equal(paused.startedPlaying, true);
    assert.equal(paused.startedT, 0);
    assert.equal(paused.heldPlaying, false);
    assert.equal(paused.label, "Play");
    assert.equal(paused.pressed, "true");
    await new Promise((r) => setTimeout(r, 500));
    const still = await cdp.evaluate("window.NotesScenes.halfN.snapshot()");
    assert.equal(still.playing, false);
    assert.ok(Math.abs(still.tDays - paused.heldT) < 0.05, "paused clock must not advance");

    await cdp.evaluate("document.querySelector('[data-pause=\"halfn-vis\"]').click()");
    await cdp.waitFor(
      "window.NotesScenes.halfN.snapshot().tDays > " + (paused.heldT + 0.5),
      6000,
      "resumed half-life clock"
    );
    const resumed = await cdp.evaluate(`({
      playing: window.NotesScenes.halfN.snapshot().playing,
      label: document.querySelector('[data-pause="halfn-vis"]').textContent
    })`);
    assert.equal(resumed.playing, true);
    assert.equal(resumed.label, "Pause");

    const bgPause = await cdp.evaluate(`(function () {
      var scene = window.NotesScenes.countbg;
      var btn = document.querySelector('[data-pause="countbg-vis"]');
      scene.replay();
      var started = scene.snapshot();
      btn.click();
      var held = scene.snapshot();
      return { started: started.playing, held: held.playing, heldT: held.tH, label: btn.textContent };
    })()`);
    assert.equal(bgPause.started, true);
    assert.equal(bgPause.held, false);
    assert.equal(bgPause.label, "Play");
    await new Promise((r) => setTimeout(r, 500));
    const bgStill = await cdp.evaluate("window.NotesScenes.countbg.snapshot()");
    assert.ok(Math.abs(bgStill.tH - bgPause.heldT) < 0.05, "paused background clock must not advance");
  });

  test("background: recorded − background = corrected at every selected time", { timeout: 120000 }, async () => {
    await openR4Page();
    const rows = await cdp.evaluate(`(function () {
      function read(t) {
        var slider = document.getElementById("bg-time");
        slider.value = String(t);
        slider.dispatchEvent(new Event("input", { bubbles: true }));
        var s = window.NotesScenes.countbg.snapshot();
        return {
          asked: t,
          tH: s.tH,
          recorded: s.recorded,
          corrected: s.corrected,
          background: s.background,
          playing: s.playing,
          sumOk: Math.abs(s.corrected + s.background - s.recorded) < 1e-6,
          outRec: document.querySelector('[data-out="rec"]').textContent,
          outBg: document.querySelector('[data-out="bg"]').textContent,
          outCorr: document.querySelector('[data-out="corr"]').textContent,
          outT: document.getElementById("bg-time-out").textContent,
          target: s.targetRecorded,
          targetAt: s.targetAtH
        };
      }
      return [read(0), read(10), read(40), read(80)];
    })()`);
    assert.deepEqual(rows.map((r) => r.tH), [0, 10, 40, 80]);
    assert.deepEqual(rows.map((r) => Math.round(r.recorded)), [840, 440, 90, 43]);
    assert.deepEqual(rows.map((r) => Math.round(r.corrected)), [800, 400, 50, 3]);
    assert.deepEqual(rows.map((r) => r.background), [40, 40, 40, 40]);
    rows.forEach((r) => {
      assert.equal(r.sumOk, true, "corrected + background must equal recorded");
      assert.equal(r.playing, false, "a manual time selection pauses the clip");
      assert.equal(r.target, 440, "the one-half-life recorded target is 440 min-1");
      assert.equal(r.targetAt, 10);
    });
    assert.equal(rows[1].outRec, "recorded = 440 min⁻¹");
    assert.equal(rows[1].outBg, "background = 40 min⁻¹");
    assert.equal(rows[1].outCorr, "corrected = 400 min⁻¹");
    assert.deepEqual(rows.map((r) => r.outT), ["0 h", "10 h", "40 h", "80 h"]);

    const preset = await cdp.evaluate(`(function () {
      document.querySelector('[data-bg-set="10"]').click();
      var s = window.NotesScenes.countbg.snapshot();
      return {
        tH: s.tH,
        slider: document.getElementById("bg-time").value,
        recorded: s.recorded,
        pressed: document.querySelector('[data-bg-set="10"]').getAttribute("aria-pressed")
      };
    })()`);
    assert.equal(preset.tH, 10);
    assert.equal(preset.slider, "10");
    assert.equal(Math.round(preset.recorded), 440);
    assert.equal(preset.pressed, "true");
  });

  test("checks: a wrong pick nudges and stays retryable, the right pick locks in", { timeout: 120000 }, async () => {
    await openR4Page();
    const check = await cdp.evaluate(`(function () {
      function attempt(selector, wrong, right) {
        var box = document.querySelector(selector);
        var wrongBtn = box.querySelector('[data-choice="' + wrong + '"]');
        var rightBtn = box.querySelector('[data-choice="' + right + '"]');
        wrongBtn.click();
        var state = {
          feedbackWrong: box.querySelector(".feedback").textContent,
          wrongClass: wrongBtn.className,
          wrongDisabled: wrongBtn.disabled,
          rightStillLive: !rightBtn.disabled,
          explainHiddenAfterWrong: box.querySelector(".explain").hidden
        };
        rightBtn.click();
        state.feedbackRight = box.querySelector(".feedback").textContent;
        state.rightClass = rightBtn.className;
        state.explainShown = !box.querySelector(".explain").hidden;
        state.wrongDisabledAfterRight = wrongBtn.disabled;
        return state;
      }
      return {
        half: attempt("#halflife .check[data-check='mc']", "B", "A"),
        bg: attempt("#background .check[data-check='mc']", "A", "B")
      };
    })()`);
    for (const state of [check.half, check.bg]) {
      assert.match(state.feedbackWrong, /Not quite/);
      assert.match(state.wrongClass, /wrong/);
      assert.equal(state.wrongDisabled, true, "only the wrong option is retired");
      assert.equal(state.rightStillLive, true, "a retry must stay possible");
      assert.equal(state.explainHiddenAfterWrong, true, "reasoning waits for the right answer");
      assert.match(state.feedbackRight, /Right/);
      assert.match(state.rightClass, /correct/);
      assert.equal(state.explainShown, true, "the full reasoning is shown after the right answer");
    }
  });

  test("working stays optional: Show/Hide disclosures and the written-answer reveal", { timeout: 120000 }, async () => {
    await openR4Page();
    const toggled = await cdp.evaluate(`(function () {
      var half = document.querySelector("#halflife details.worked-more");
      var halfBefore = half.open;
      half.querySelector("summary").click();
      var halfOpen = half.open;
      half.querySelector("summary").click();
      var halfClosed = half.open;
      var bg = document.querySelector("#background details.worked-more");
      var bgBefore = bg.open;
      bg.querySelector("summary").click();
      var bgOpen = bg.open;
      var reveal = document.querySelector("[data-reveal]");
      var model = reveal.parentElement.querySelector(".model");
      var revealBefore = model.hidden;
      reveal.click();
      var afterClick = { hidden: model.hidden, label: reveal.textContent, expanded: reveal.getAttribute("aria-expanded") };
      reveal.click();
      var afterSecond = { hidden: model.hidden, label: reveal.textContent };
      return {
        halfBefore: halfBefore,
        halfOpen: halfOpen,
        halfClosed: halfClosed,
        halfSteps: half.querySelectorAll("ol.steps li").length,
        halfText: half.querySelector(".worked").textContent,
        bgBefore: bgBefore,
        bgOpen: bgOpen,
        bgSteps: bg.querySelectorAll("ol.steps li").length,
        revealBefore: revealBefore,
        afterClick: afterClick,
        afterSecond: afterSecond
      };
    })()`);
    assert.equal(toggled.halfBefore, false, "complete working starts collapsed");
    assert.equal(toggled.halfOpen, true);
    assert.equal(toggled.halfClosed, false, "Show/Hide hides it again");
    assert.ok(toggled.halfSteps >= 3, "the full three-part working is present");
    assert.match(toggled.halfText, /6\.25/);
    assert.match(toggled.halfText, /93\.75/);
    assert.equal(toggled.bgBefore, false);
    assert.equal(toggled.bgOpen, true);
    assert.ok(toggled.bgSteps >= 2, "the background derivation is complete");
    assert.equal(toggled.revealBefore, true);
    assert.equal(toggled.afterClick.hidden, false);
    assert.equal(toggled.afterClick.label, "Hide answer");
    assert.equal(toggled.afterClick.expanded, "true");
    assert.equal(toggled.afterSecond.hidden, true);
    assert.equal(toggled.afterSecond.label, "Show answer");
  });

  test("no page-level overflow and every HUD label stays inside its stage at 390 and 1280", { timeout: 180000 }, async () => {
    for (const viewport of [{ w: 390, h: 844, mobile: true }, { w: 1280, h: 800, mobile: false }]) {
      await cdp.setViewport(viewport.w, viewport.h, viewport.mobile);
      await openR4Page();
      const probe = await cdp.evaluate(`(function () {
        var doc = document.documentElement;
        var offenders = [];
        ["halfn-vis", "countbg-vis"].forEach(function (id) {
          var stage = document.getElementById(id);
          var sr = stage.getBoundingClientRect();
          Array.prototype.forEach.call(stage.querySelectorAll(".hud-label"), function (hud) {
            var hr = hud.getBoundingClientRect();
            if (hr.left < sr.left - 1 || hr.right > sr.right + 1 || hr.top < sr.top - 1 || hr.bottom > sr.bottom + 1) {
              offenders.push(id + ":" + hud.getAttribute("data-hud") + " [" +
                Math.round(hr.left - sr.left) + "," + Math.round(hr.right - sr.right) + "," +
                Math.round(hr.top - sr.top) + "," + Math.round(hr.bottom - sr.bottom) + "]");
            }
          });
        });
        var eqOverflow = Array.prototype.map.call(
          document.querySelectorAll("#halflife .eq, #background .eq"),
          function (eq) { return eq.scrollWidth - eq.clientWidth; }
        );
        var tableOverflow = Array.prototype.map.call(
          document.querySelectorAll("#halflife table.notes"),
          function (t) { return { page: t.offsetWidth, self: t.scrollWidth - t.clientWidth }; }
        );
        return {
          docWidth: doc.clientWidth,
          scrollWidth: doc.scrollWidth,
          offenders: offenders,
          eqOverflow: eqOverflow,
          tableOverflow: tableOverflow,
          digestEntries: document.querySelectorAll("#halflife .quick-digest p, #background .quick-digest p").length
        };
      })()`);
      assert.ok(
        probe.scrollWidth <= probe.docWidth + 1,
        "page overflows at " + viewport.w + "px: " + probe.scrollWidth + " > " + probe.docWidth
      );
      assert.deepEqual(probe.offenders, [], "clipped/outside HUD labels at " + viewport.w);
      probe.eqOverflow.forEach((extra, i) => assert.ok(extra <= 2, "equation " + i + " scrolls sideways at " + viewport.w));
      assert.ok(probe.digestEntries >= 6, "both units keep a concise visible digest");
    }
    await cdp.setViewport(1280, 900, false);
  });

  test("DSE deck Prev/Next still shows one paper at a time", { timeout: 120000 }, async () => {
    await openR4Page();
    const deck = await cdp.evaluate(`(function () {
      var mc = document.querySelector('[data-quiz="mc"]');
      var first = mc.querySelector(".quiz-slide.is-current").id;
      mc.querySelector("[data-quiz-next]").click();
      var second = mc.querySelector(".quiz-slide.is-current").id;
      var status = mc.querySelector(".quiz-status").textContent;
      mc.querySelector("[data-quiz-prev]").click();
      var back = mc.querySelector(".quiz-slide.is-current").id;
      return { first: first, second: second, back: back, status: status };
    })()`);
    assert.notEqual(deck.second, deck.first);
    assert.equal(deck.back, deck.first);
    assert.match(deck.status, /^\d+ of \d+$/);
  });
});
