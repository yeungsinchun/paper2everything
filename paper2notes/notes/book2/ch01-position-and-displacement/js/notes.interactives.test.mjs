/* Book 2 Ch.1 reference interactions (R1).
   Proves the reference contracts on the two R1 sections:
   - two named definitions, a formula key and a compact comparison (no page overflow);
   - path, mouse, anchored labels and readouts all follow one timeline;
   - Pause / Replay / scrub / reduced-motion terminal frame;
   - a retryable check with the full working behind Show answer;
   - side-by-side figures that stack on phones.
   Run: node --test paper2notes/notes/book2/ch01-position-and-displacement/js/notes.interactives.test.mjs */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const notesDir = path.resolve(here, "..", "..", "..");
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
    const ms = timeoutMs == null ? 60000 : timeoutMs;
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
    return waiter.name === params.name && waiter.loaderId === params.loaderId;
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
      awaitPromise: true
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
    await this.evaluate("new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)))");
  }

  async viewport(width, height, mobile) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: !!mobile
    });
  }

  async screenshot(filePath, selector) {
    if (selector) {
      await this.evaluate(
        "(function () { var el = document.querySelector(" + JSON.stringify(selector) +
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
  profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "book2-ch01-chrome-"));
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
  await cdp.viewport(1280, 800, false);
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

function near(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    (message ? message + ": " : "") + "expected " + actual + " within " + tolerance + " of " + expected
  );
}

function normalizeHex(value) {
  return String(value || "").trim().toLowerCase();
}

const page = "book2/ch01-position-and-displacement/index.html";
const distanceCheck = `(function () {
  var box = document.querySelector('#distance-vs-displacement .check[data-check="mc"]');
  var btn = box.querySelector('button[data-reveal]');
  var model = box.querySelector('.model');
  return {
    answer: box.getAttribute('data-answer'),
    stem: box.querySelector('p').textContent.trim(),
    hiddenBefore: model.hidden,
    ariaBefore: btn.getAttribute('aria-expanded'),
    choices: Array.from(box.querySelectorAll('button[data-choice]')).length
  };
})()`;

function readCheck(selector, answer) {
  return `(function () {
    var box = document.querySelector(${JSON.stringify(selector)});
    var wrong = box.querySelector('[data-choice="A"]');
    var right = box.querySelector('[data-choice="${answer || "B"}"]');
    function state() {
      return {
        feedback: box.querySelector('.feedback').textContent.trim(),
        feedbackClass: box.querySelector('.feedback').className,
        disabled: Array.from(box.querySelectorAll('[data-choice]')).map(function (b) { return b.disabled; }),
        wrongMarked: wrong.className,
        rightMarked: right.className,
        modelHidden: box.querySelector('.model').hidden,
        revealLabel: box.querySelector('button[data-reveal]').textContent.trim(),
        aria: box.querySelector('button[data-reveal]').getAttribute('aria-expanded')
      };
    }
    wrong.click();
    var afterWrong = state();
    right.click();
    var afterRight = state();
    box.querySelector('button[data-reveal]').click();
    var afterReveal = state();
    box.querySelector('button[data-reveal]').click();
    var afterHide = state();
    return { afterWrong: afterWrong, afterRight: afterRight, afterReveal: afterReveal, afterHide: afterHide };
  })()`;
}

describe("Book 2 Ch.1 reference interactions", { concurrency: 1 }, () => {
  test("R1 definitions, formula key, comparison and retryable check", { timeout: 180000 }, async () => {
    await cdp.goto(pageUrl(page));
    const structure = await cdp.evaluate(`(function () {
      var section = document.querySelector('#distance-vs-displacement');
      var definitions = Array.from(section.querySelectorAll('.p2n-def'));
      var formula = section.querySelector('.p2n-formula');
      var compare = Array.from(section.querySelectorAll('.p2n-compare-card'));
      return {
        definitionTerms: definitions.map(function (d) { return d.querySelector('dt').textContent.trim(); }),
        definitionQuantities: definitions.map(function (d) { return d.getAttribute('data-quantity'); }),
        definitionLines: definitions.map(function (d) { return d.querySelectorAll('dd').length; }),
        formulaText: formula ? formula.textContent.replace(/\\s+/g, ' ').trim() : '',
        formulaKey: formula ? formula.querySelectorAll('.p2n-formula-key dt').length : 0,
        formulaKatex: formula ? !!formula.querySelector('.katex') : false,
        compareQuantities: compare.map(function (c) { return c.getAttribute('data-quantity'); }),
        compareRows: compare.map(function (c) { return c.querySelectorAll('.p2n-compare-row').length; }),
        tables: section.querySelectorAll('table').length,
        readouts: Array.from(section.querySelectorAll('.p2n-readout')).map(function (r) {
          return {
            quantity: r.getAttribute('data-quantity'),
            label: r.querySelector('b').textContent.trim(),
            swatch: !!r.querySelector('.p2n-swatch')
          };
        })
      };
    })()`);
    assert.deepEqual(structure.definitionTerms, ["Distance", "Displacement"]);
    assert.deepEqual(structure.definitionQuantities, ["distance", "displacement"]);
    assert.deepEqual(structure.definitionLines, [2, 2], "each definition carries two short lines and grows freely");
    assert.match(structure.formulaText, /Δ/);
    assert.match(structure.formulaText, /final/);
    assert.match(structure.formulaText, /initial/);
    assert.equal(structure.formulaKey, 3);
    assert.equal(structure.formulaKatex, true, "the formula card renders through KaTeX");
    assert.deepEqual(structure.compareQuantities, ["distance", "displacement"]);
    assert.deepEqual(structure.compareRows, [3, 3]);
    assert.equal(structure.tables, 0, "the pannable comparison table is replaced by stacking cards");
    assert.deepEqual(structure.readouts.map((r) => r.quantity), ["distance", "displacement"]);
    assert.ok(structure.readouts.every((r) => r.swatch), "each readout carries the quantity swatch");

    const text = await cdp.evaluate(distanceCheck);
    assert.equal(text.answer, "B");
    assert.match(text.stem, /Which arrow is the displacement/);
    assert.equal(text.hiddenBefore, true, "full working stays hidden");
    assert.equal(text.ariaBefore, "false");
    assert.equal(text.choices, 4);

    const check = await cdp.evaluate(readCheck("#distance-vs-displacement .check"));
    assert.match(check.afterWrong.feedback, /Not quite/);
    assert.match(check.afterWrong.feedbackClass, /no$/, "wrong feedback is the amber nudge");
    assert.match(check.afterWrong.wrongMarked, /wrong/);
    assert.equal(check.afterWrong.rightMarked.includes("correct"), false, "a wrong pick does not reveal the key");
    assert.equal(check.afterWrong.modelHidden, true, "reasoning stays closed after a wrong pick");
    assert.ok(check.afterWrong.disabled.some((d) => d === false), "retry stays possible");
    assert.equal(check.afterWrong.disabled.filter(Boolean).length, 1, "only the wrong option locks");
    assert.equal(check.afterRight.feedback, "Right.");
    assert.match(check.afterRight.feedbackClass, /ok$/, "right feedback is green");
    assert.match(check.afterRight.rightMarked, /correct/);
    assert.equal(check.afterReveal.modelHidden, false);
    assert.equal(check.afterReveal.aria, "true");
    assert.equal(check.afterReveal.revealLabel, "Hide answer");
    assert.equal(check.afterHide.modelHidden, true);
    assert.equal(check.afterHide.revealLabel, "Show answer");

    const arithmetic = await cdp.evaluate(
      "document.querySelector('#distance-vs-displacement .model').textContent.replace(/\\s+/g, ' ')"
    );
    assert.match(arithmetic, /500 \+ 500 = 1000/);
    assert.match(arithmetic, /707/);

    if (evidenceDir) {
      await cdp.screenshot(path.join(evidenceDir, "b2-ch01-definitions-formula.png"), "#distance-vs-displacement .p2n-formula");
    }
  });

  test("R1 trench keeps path, mouse, labels and readouts on one timeline", { timeout: 180000 }, async () => {
    await cdp.goto(pageUrl(page));
    const states = await cdp.evaluate(`(function () {
      var scene = window.NotesScenes.trench;
      scene.pause();
      function sample(p, dx, dy) {
        scene.seek(p);
        var snap = scene.snapshot();
        var readDistance = document.querySelector('[data-readout="distance"] .p2n-num').textContent.trim();
        var readDisplacement = document.querySelector('[data-readout="displacement"] .p2n-num').textContent.trim();
        snap.readDistance = readDistance;
        snap.readDisplacement = readDisplacement;
        return snap;
      }
      return {
        start: sample(0),
        quarter: sample(0.25),
        half: sample(0.5),
        threeQuarter: sample(0.75),
        end: sample(1)
      };
    })()`);

    assert.equal(states.start.distanceM, 0);
    assert.equal(states.start.displacementM, 0);
    assert.equal(states.start.readDistance, "0 m");
    assert.equal(states.start.readDisplacement, "0 m");

    assert.equal(states.quarter.distanceM, 250);
    assert.equal(states.quarter.legs.eastM, 250);
    assert.equal(states.quarter.legs.northM, 0);
    assert.equal(states.quarter.readDistance, "250 m");
    assert.equal(states.quarter.readDisplacement, "250 m E");
    assert.equal(states.quarter.mouse.y, states.quarter.anchors.A.y, "the mouse stays on the east leg");
    near(states.quarter.mouse.x, (states.quarter.anchors.A.x + states.quarter.anchors.B.x) / 2, 0.001);

    assert.equal(states.half.distanceM, 500);
    assert.equal(states.half.displacementM, 500);
    assert.equal(states.half.readDistance, "500 m");
    assert.equal(states.half.readDisplacement, "500 m E");

    assert.equal(states.threeQuarter.distanceM, 750);
    assert.equal(states.threeQuarter.legs.eastM, 500);
    assert.equal(states.threeQuarter.legs.northM, 250);
    assert.equal(states.threeQuarter.displacementM, 559);
    assert.equal(states.threeQuarter.readDistance, "750 m");
    assert.equal(states.threeQuarter.readDisplacement, "559 m NE");

    assert.equal(states.end.distanceM, 1000);
    assert.equal(states.end.displacementM, 707);
    assert.equal(states.end.readDistance, "1000 m");
    assert.equal(states.end.readDisplacement, "707 m NE");
    assert.equal(states.end.mouse.x, states.end.anchors.C.x);
    assert.equal(states.end.mouse.y, states.end.anchors.C.y);

    /* The drawn diagonal and the readout are the same number, measured from the drawn dots. */
    const drawn = Math.hypot(
      states.end.mouse.x - states.end.anchors.A.x,
      states.end.mouse.y - states.end.anchors.A.y
    ) * states.end.metresPerUnit;
    near(drawn, states.end.displacementM, 1, "drawn diagonal matches the displacement readout");

    /* One meaning = one colour: cyan distance, violet displacement, straight from the tokens. */
    const tokens = await cdp.evaluate(`(function () {
      var style = getComputedStyle(document.documentElement);
      return {
        distance: style.getPropertyValue('--fig-distance').trim(),
        displacement: style.getPropertyValue('--fig-displacement').trim()
      };
    })()`);
    assert.equal(normalizeHex(states.end.colors.distance), normalizeHex(tokens.distance));
    assert.equal(normalizeHex(states.end.colors.displacement), normalizeHex(tokens.displacement));
    assert.notEqual(normalizeHex(states.end.colors.distance), normalizeHex(states.end.colors.displacement));

    /* Anchored labels: every label resolves to its anchor and stays inside the frame. */
    const keys = Object.keys(states.end.labels);
    assert.ok(keys.length >= 6, "expected endpoint and quantity labels, got " + keys.join(","));
    Object.keys(states.end.labels).forEach((key) => {
      const info = states.end.labels[key];
      if (!info) return;
      assert.equal(info.inside, true, key + " label must stay inside the frame");
    });
    ["A", "B", "C"].forEach((key) => {
      const info = states.end.labels[key];
      near(info.hudLeft, info.anchorX, 26, key + " label sits on its anchor");
      near(info.hudTop, info.anchorY, 26, key + " label sits on its anchor");
    });
    const mouseLabel = states.end.labels.mouse;
    assert.equal(mouseLabel, null, "the body label gives way to C at the finish");

    if (evidenceDir) {
      await cdp.evaluate("window.NotesScenes.trench.seek(0.5)");
      await cdp.evaluate("document.querySelector('#distance-vs-displacement').scrollIntoView({block:'start'}); window.scrollBy(0,-72);");
      await cdp.screenshot(path.join(evidenceDir, "b2-ch01-trench-halfway.png"));
    }
  });

  test("R1 motion state: pause holds, replay resets, reduced motion shows the terminal frame", { timeout: 180000 }, async () => {
    await cdp.goto(pageUrl(page));
    const paused = await cdp.evaluate(`(function () {
      var scene = window.NotesScenes.trench;
      scene.replay();
      scene.seek(0.4);
      scene.pause();
      var first = scene.snapshot().progress;
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve({ first: first, second: scene.snapshot().progress, playing: scene.snapshot().playing });
        }, 400);
      });
    })()`);
    assert.equal(paused.first, 0.4);
    assert.equal(paused.second, 0.4, "a paused timeline does not drift");
    assert.equal(paused.playing, false);

    const replay = await cdp.evaluate(`(function () {
      var scene = window.NotesScenes.trench;
      scene.seek(1);
      var before = scene.snapshot().progress;
      scene.replay();
      var after = scene.snapshot();
      scene.pause();
      return { before: before, progress: after.progress, playing: after.playing };
    })()`);
    assert.equal(replay.before, 1);
    assert.ok(replay.progress < 0.2, "replay restarts from the beginning");
    assert.equal(replay.playing, true, "replay resumes the demonstration");

    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }]
    });
    await cdp.goto(pageUrl(page));
    const reduced = await cdp.evaluate(`(function () {
      var scene = window.NotesScenes.trench;
      var snap = scene.snapshot();
      var button = document.querySelector('#trench-vis + .scene-toolbar [data-motion="toggle"]');
      return {
        reduceMotion: snap.reduceMotion,
        playing: snap.playing,
        progress: snap.progress,
        readDistance: document.querySelector('[data-readout="distance"] .p2n-num').textContent.trim(),
        readDisplacement: document.querySelector('[data-readout="displacement"] .p2n-num').textContent.trim(),
        button: button ? button.textContent.trim() : null
      };
    })()`);
    assert.equal(reduced.reduceMotion, true);
    assert.equal(reduced.playing, false, "reduced motion never autoplays");
    assert.equal(reduced.progress, 1, "the terminal frame is shown directly");
    assert.equal(reduced.readDistance, "1000 m");
    assert.equal(reduced.readDisplacement, "707 m NE");
    assert.equal(reduced.button, "Show start");

    const jumped = await cdp.evaluate(`(function () {
      document.querySelector('#trench-vis + .scene-toolbar [data-motion="toggle"]').click();
      var snap = window.NotesScenes.trench.snapshot();
      return {
        progress: snap.progress,
        readDistance: document.querySelector('[data-readout="distance"] .p2n-num').textContent.trim()
      };
    })()`);
    assert.equal(jumped.progress, 0, "the reduced-motion control jumps instead of animating");
    assert.equal(jumped.readDistance, "0 m");
    await cdp.send("Emulation.setEmulatedMedia", { features: [] });

    /* The scrub range is a real control with an accessible name and value text. */
    const scrub = await cdp.evaluate(`(function () {
      var input = document.querySelector('#trench-vis + .scene-toolbar [data-motion="scrub"]');
      var before = window.NotesScenes.trench.snapshot().progress;
      input.value = '600';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      var after = window.NotesScenes.trench.snapshot();
      return {
        label: input.getAttribute('aria-label'),
        valueText: input.getAttribute('aria-valuetext'),
        before: before,
        progress: after.progress,
        distance: document.querySelector('[data-readout="distance"] .p2n-num').textContent.trim()
      };
    })()`);
    assert.ok(scrub.label && scrub.label.length > 3);
    assert.match(scrub.valueText, /60% of the journey/);
    assert.equal(scrub.before, 0);
    assert.equal(scrub.progress, 0.6);
    assert.equal(scrub.distance, "600 m");
  });

  test("R1 scalars and vectors: stacked figures, anchored labels, return-trip readouts", { timeout: 180000 }, async () => {
    await cdp.goto(pageUrl(page));
    const panes = await cdp.evaluate(`(function () {
      var pair = document.querySelector('#scalars-vectors .fig-pair');
      return {
        figures: pair.querySelectorAll(':scope > figure.fig').length,
        captions: Array.from(pair.querySelectorAll(':scope > figure.fig > figcaption')).map(function (c) { return c.textContent.trim(); }),
        definitions: Array.from(document.querySelectorAll('#scalars-vectors .p2n-def')).map(function (d) {
          return {
            term: d.querySelector('dt').textContent.replace(/\\s+/g, ' ').trim(),
            quantity: d.getAttribute('data-quantity'),
            icon: !!d.querySelector('.p2n-qicon svg'),
            items: Array.from(d.querySelectorAll('li')).map(function (li) { return li.textContent.trim(); })
          };
        }),
        tables: document.querySelectorAll('#scalars-vectors table').length
      };
    })()`);
    assert.equal(panes.figures, 2, "tip-to-tail and the return trip are separate figures");
    assert.match(panes.captions[0], /^Fig 1\.2a/);
    assert.match(panes.captions[1], /^Fig 1\.2b/);
    assert.equal(panes.tables, 0, "the list table is replaced by two short definition lists");
    assert.deepEqual(panes.definitions.map((d) => d.quantity), ["scalar", "vector"]);
    assert.ok(panes.definitions.every((d) => d.icon), "each row shows a magnitude/direction icon");
    assert.ok(panes.definitions[0].term.startsWith("Scalar"));
    assert.ok(panes.definitions[1].term.startsWith("Vector"));
    assert.ok(panes.definitions[0].items.includes("speed"));
    assert.ok(panes.definitions[1].items.includes("velocity"));

    const arrows = await cdp.evaluate(`(function () {
      var scene = window.NotesScenes['vector-add'];
      scene.pause();
      function sample(p) {
        scene.seek(p);
        return scene.snapshot();
      }
      var stage = document.getElementById('vector-add-vis');
      var canvas = stage.querySelector('canvas');
      return {
        first: sample(1 / 3).arrows,
        second: sample(2 / 3).arrows,
        third: sample(1).arrows,
        labels: sample(1).labels,
        canvasWidth: canvas.clientWidth,
        canvasHeight: canvas.clientHeight
      };
    })()`);
    assert.equal(arrows.first.a, 1);
    assert.equal(arrows.first.b, 0);
    assert.equal(arrows.first.resultant, 0);
    assert.equal(arrows.second.b, 1);
    assert.equal(arrows.second.resultant, 0, "the resultant appears only after both vectors are drawn");
    assert.equal(arrows.third.resultant, 1);
    ["start", "junction", "finish", "leg-a", "leg-b", "resultant"].forEach((key) => {
      const info = arrows.labels[key];
      assert.ok(info, "missing anchored label " + key);
      assert.equal(info.inside, true, key + " label inside the frame");
      assert.ok(info.hudLeft - info.width / 2 >= -2, key + " label starts inside the pane");
      assert.ok(info.hudLeft + info.width / 2 <= arrows.canvasWidth + 2, key + " label ends inside the pane");
      assert.ok(info.hudTop - info.height / 2 >= -2, key + " label tops out inside the pane");
      assert.ok(info.hudTop + info.height / 2 <= arrows.canvasHeight + 2, key + " label bottoms out inside the pane");
    });

    const trip = await cdp.evaluate(`(function () {
      var scene = window.NotesScenes.peter;
      scene.pause();
      function sample(p) {
        scene.seek(p);
        var snap = scene.snapshot();
        var pane = document.getElementById('peter-vis').parentNode;
        snap.readDistance = pane.querySelector('[data-readout="distance"] .p2n-num').textContent.trim();
        snap.readDisplacement = pane.querySelector('[data-readout="displacement"] .p2n-num').textContent.trim();
        return snap;
      }
      return { quarter: sample(0.25), half: sample(0.5), end: sample(1) };
    })()`);
    near(trip.quarter.distanceM, 31, 1, "a quarter of the timeline is a quarter of the outbound arc");
    near(trip.quarter.displacementM, 28, 1);
    assert.equal(trip.half.distanceM, 63);
    assert.equal(trip.half.displacementM, 40, "at P the displacement is the full 40 m diameter");
    assert.equal(trip.half.readDistance, "63 m");
    assert.equal(trip.half.readDisplacement, "40 m");
    assert.equal(trip.end.distanceM, 126);
    assert.equal(trip.end.displacementM, 0, "back at O the displacement is zero");
    assert.equal(trip.end.readDisplacement, "0 m");
    assert.equal(trip.end.labels["displacement-label"], null, "no displacement label when the arrow vanishes");
    ["origin", "far", "out", "back", "walker"].forEach((key) => {
      const info = trip.end.labels[key];
      assert.ok(info, "missing anchored label " + key);
      assert.equal(info.inside, true, key + " label inside the frame");
    });

    const check = await cdp.evaluate(readCheck("#scalars-vectors .check", "C"));
    assert.match(check.afterWrong.feedback, /Not quite/);
    assert.equal(check.afterWrong.modelHidden, true);
    assert.equal(check.afterRight.feedback, "Right.");
    assert.equal(check.afterReveal.modelHidden, false);
    assert.equal(check.afterReveal.aria, "true");

    if (evidenceDir) {
      await cdp.evaluate("window.NotesScenes.peter.seek(0.5)");
      await cdp.screenshot(path.join(evidenceDir, "b2-ch01-scalars-vectors-pair.png"), "#scalars-vectors .fig-pair");
    }
  });

  test("R1 layout: no page overflow and inside-frame controls at both viewports", { timeout: 180000 }, async () => {
    await cdp.goto(pageUrl(page));
    for (const [width, height, mobile] of [[1280, 800, false], [390, 844, true]]) {
      await cdp.viewport(width, height, mobile);
      await cdp.evaluate("new Promise((r) => setTimeout(r, 120))");
      const layout = await cdp.evaluate(`(function () {
        var doc = document.documentElement;
        var main = document.querySelector('main').getBoundingClientRect();
        var stages = Array.from(document.querySelectorAll('[data-scene]')).map(function (stage) {
          var rect = stage.getBoundingClientRect();
          var toolbar = stage.nextElementSibling;
          var button = toolbar && toolbar.querySelector('[data-motion="toggle"]');
          var input = toolbar && toolbar.querySelector('[data-motion="scrub"]');
          var labels = Array.from(stage.querySelectorAll('.hud-label')).filter(function (l) { return !l.hidden; });
          return {
            id: stage.id,
            left: rect.left,
            right: rect.right,
            width: rect.width,
            canvasWidth: stage.querySelector('canvas').clientWidth,
            hasToolbar: !!toolbar && toolbar.classList.contains('scene-toolbar'),
            toolbarInside: !!toolbar && toolbar.getBoundingClientRect().right <= doc.clientWidth + 1,
            buttonHeight: button ? button.getBoundingClientRect().height : 0,
            inputLabel: input ? input.getAttribute('aria-label') : null,
            labelsOutside: labels.filter(function (label) {
              var box = label.getBoundingClientRect();
              var frame = stage.getBoundingClientRect();
              return box.left < frame.left - 1 || box.right > frame.right + 1 || box.top < frame.top - 1 || box.bottom > frame.bottom + 1;
            }).map(function (label) { return label.getAttribute('data-hud'); })
          };
        });
        var grid = document.querySelector('#distance-vs-displacement .p2n-compare');
        var cards = Array.from(grid.querySelectorAll('.p2n-compare-card')).map(function (c) {
          var r = c.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, scrollWidth: c.scrollWidth, clientWidth: c.clientWidth };
        });
        var readouts = Array.from(document.querySelectorAll('.p2n-readout')).map(function (r) {
          return { scrollWidth: r.scrollWidth, clientWidth: r.clientWidth, right: r.getBoundingClientRect().right };
        });
        var formula = document.querySelector('.p2n-formula').getBoundingClientRect();
        var pairFigures = Array.from(document.querySelectorAll('#scalars-vectors .fig-pair > figure.fig')).map(function (f) {
          var r = f.getBoundingClientRect();
          return { top: r.top, left: r.left, width: r.width };
        });
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          mainRight: main.right,
          mainLeft: main.left,
          stages: stages,
          cards: cards,
          readouts: readouts,
          formulaRight: formula.right,
          formulaLeft: formula.left,
          pairFigures: pairFigures
        };
      })()`);

      assert.equal(layout.scrollWidth, layout.clientWidth, "no page-level overflow at " + width + "px");
      layout.stages.forEach((stage) => {
        assert.ok(stage.width > 120, stage.id + " has a real width");
        assert.ok(stage.right <= layout.clientWidth + 1, stage.id + " stays on the page");
        assert.equal(stage.hasToolbar, true, stage.id + " keeps its motion toolbar outside the drawing");
        assert.equal(stage.toolbarInside, true, stage.id + " toolbar stays on the page");
        assert.ok(stage.buttonHeight >= 44, stage.id + " control target is at least 44px, got " + stage.buttonHeight);
        assert.ok(stage.inputLabel && stage.inputLabel.length > 3, stage.id + " scrub range is labelled");
        assert.deepEqual(stage.labelsOutside, [], stage.id + " labels stay inside the frame");
      });
      layout.readouts.forEach((row) => {
        assert.ok(row.scrollWidth <= row.clientWidth + 1, "readout text never overflows its card");
        assert.ok(row.right <= layout.clientWidth + 1, "readout stays on the page");
      });
      assert.ok(layout.formulaRight <= layout.clientWidth + 1);
      assert.ok(layout.formulaLeft >= 0);
      if (width === 390) {
        assert.ok(
          layout.cards[1].top >= layout.cards[0].bottom - 1,
          "comparison cards stack on phones instead of panning"
        );
        assert.ok(
          layout.pairFigures[1].top >= layout.pairFigures[0].top,
          "the figure pair stacks on phones"
        );
        assert.ok(layout.pairFigures[0].width >= 300, "stacked figures use the full gutter width");
        assert.equal(layout.pairFigures[0].left, layout.pairFigures[1].left, "stacked figures share one left gutter");
      } else {
        near(layout.cards[0].top, layout.cards[1].top, 1, "comparison cards sit side by side on laptops");
        near(layout.pairFigures[0].top, layout.pairFigures[1].top, 1, "the figure pair sits side by side on laptops");
        assert.ok(layout.pairFigures[1].left > layout.pairFigures[0].left, "the pair is side by side, not stacked");
      }
    }

    /* Resize keeps the held frame and re-anchors the labels. */
    const resized = await cdp.evaluate(`(function () {
      var scene = window.NotesScenes.trench;
      scene.pause();
      scene.seek(0.5);
      return scene.snapshot().displacementM;
    })()`);
    await cdp.viewport(1280, 800, false);
    await cdp.evaluate("new Promise((r) => setTimeout(r, 150))");
    const after = await cdp.evaluate(`(function () {
      var snap = window.NotesScenes.trench.snapshot();
      var stage = document.getElementById('trench-vis');
      var frame = stage.getBoundingClientRect();
      var outside = Array.from(stage.querySelectorAll('.hud-label')).filter(function (label) {
        if (label.hidden) return false;
        var box = label.getBoundingClientRect();
        return box.left < frame.left - 1 || box.right > frame.right + 1 ||
          box.top < frame.top - 1 || box.bottom > frame.bottom + 1;
      }).map(function (label) { return label.getAttribute('data-hud'); });
      return {
        distanceM: snap.distanceM,
        displacementM: snap.displacementM,
        outside: outside,
        readDistance: document.querySelector('[data-readout="distance"] .p2n-num').textContent.trim()
      };
    })()`);
    assert.equal(after.displacementM, resized, "resize does not reset the timeline");
    assert.equal(after.distanceM, 500);
    assert.equal(after.readDistance, "500 m");
    assert.deepEqual(after.outside, [], "labels stay inside the frame after resize");

    if (evidenceDir) {
      await cdp.evaluate("window.NotesScenes.trench.seek(1)");
      await cdp.evaluate("document.querySelector('#distance-vs-displacement').scrollIntoView({block:'start'}); window.scrollBy(0,-72);");
      await cdp.screenshot(path.join(evidenceDir, "b2-ch01-trench-desktop.png"));
      await cdp.viewport(390, 844, true);
      await cdp.evaluate("new Promise((r) => setTimeout(r, 150))");
      await cdp.screenshot(path.join(evidenceDir, "b2-ch01-trench-phone.png"));
      await cdp.evaluate("document.querySelector('#scalars-vectors').scrollIntoView({block:'start'}); window.scrollBy(0,-72);");
      await cdp.screenshot(path.join(evidenceDir, "b2-ch01-scalars-phone.png"));
    }
  });
});
