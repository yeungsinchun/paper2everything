/* Interactive contract test for the Book 4 ch6 recap page (design-system reference R5).
 *
 * Covers the recap units: chapter-specific formula cards and traps, the labelled
 * coil-angle control with its boundary conditions, the wrong -> retry -> right
 * quick check, the Show/Hide written answer, and no page-level overflow at the
 * two review viewports (1280x800 and 390x844).
 *
 * Needs Google Chrome, like the Book 5 harness: node --test js/summary.interactives.test.mjs
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const chapterDir = path.resolve(here, "..");
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function pageUrl(name) {
  return pathToFileURL(path.join(chapterDir, name)).href;
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
    await this.navigateOnce(dest.href, 30000);
    try { await this.send("Page.bringToFront"); } catch (_) { /* headless */ }
    await this.evaluate("new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)))", 8000);
  }

  async viewport(width, height, mobile) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: mobile ? 3 : 2,
      mobile: !!mobile,
    });
    await this.evaluate("new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)))");
  }

  async screenshot(filePath) {
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
  profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "notes-summary-chrome-"));
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
  await cdp.send("Network.enable");
  /* The recap page must pass offline: the only remote assets are optional font
     and mask URLs, so block them instead of letting a stalled DNS delay load. */
  await cdp.send("Network.setBlockedURLs", {
    urls: ["*://fonts.googleapis.com/*", "*://fonts.gstatic.com/*", "*://unpkg.com/*"],
  });
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
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

function chromeTest(name, fn) {
  test(name, { timeout: 60000 }, fn);
}

describe("Book 4 Ch.6 summary interactives", { concurrency: 1 }, () => {
  chromeTest("recap units are chapter-specific, not the copied scaffolding", async () => {
    await cdp.goto(pageUrl("summary.html"));
    const data = await cdp.evaluate(`(function () {
      var text = document.body.innerText;
      var cards = Array.prototype.map.call(document.querySelectorAll(".formula-card"), function (card) {
        return {
          title: card.querySelector("h3").textContent.trim(),
          tex: (card.querySelector(".eq annotation") || { textContent: "" }).textContent.trim(),
          katex: !!card.querySelector(".eq .katex"),
          terms: card.querySelector(".terms").textContent.replace(/\\s+/g, " ").trim(),
          when: card.querySelector(".when").textContent.trim(),
        };
      });
      return {
        cards: cards,
        traps: document.querySelectorAll(".trap").length,
        trapPairs: document.querySelectorAll(".trap .trap-pair .no .text").length +
          document.querySelectorAll(".trap .trap-pair .yes .text").length,
        compareCards: document.querySelectorAll("#visual-comparison .compare-card").length,
        tables: document.querySelectorAll("#visual-comparison table").length,
        copied: ["Ohm", "ideal transformer", "slip ring", "Motor vs generator", "Lenz", "Uniform E/B"].filter(function (s) {
          return text.indexOf(s) !== -1;
        }),
        sections: Array.prototype.map.call(document.querySelectorAll("main > section.idea"), function (s) { return s.id; }),
      };
    })()`);
    assert.equal(data.cards.length, 4, "four named formula cards");
    const titles = data.cards.map((c) => c.title);
    assert.deepEqual(titles, ["Force on a wire", "Force on a moving charge", "Direction rule", "Torque on a coil"]);
    const all = data.cards.map((c) => c.title + " " + c.tex + " " + c.terms + " " + c.when).join(" | ");
    assert.equal(data.cards[0].katex, true, "wire relation is typeset");
    assert.match(data.cards[0].tex, /F = B I l \\sin\\theta/);
    assert.match(data.cards[1].tex, /F = B Q v \\sin\\theta/);
    assert.match(data.cards[3].tex, /\\tau = N B I A \\sin\\phi/);
    assert.match(all, /coil normal/);
    assert.match(all, /conventional current/);
    for (const card of data.cards) {
      assert.ok(card.terms.length > 10, card.title + " lists quantity keys");
      assert.ok(card.when.length > 10, card.title + " states its condition");
    }
    assert.equal(data.traps, 4, "four amber trap cards");
    assert.equal(data.trapPairs, 8, "each trap has a wrong and a right line");
    assert.equal(data.compareCards, 3, "wire, charge and coil compared");
    assert.equal(data.tables, 0, "the copied generic table is gone");
    assert.deepEqual(data.copied, [], "no other book's recap text");
    assert.deepEqual(data.sections, ["formula-sheet", "common-mistakes", "visual-comparison"]);
  });

  chromeTest("coil angle control teaches the normal convention at its boundaries", async () => {
    await cdp.goto(pageUrl("summary.html"));
    const setAngle = (phi) => cdp.evaluate(`(function () {
      var s = document.getElementById("coil-angle");
      s.value = ${phi};
      s.dispatchEvent(new Event("input", { bubbles: true }));
      var line = document.querySelector("[data-coil-line]");
      var normal = document.querySelector("[data-coil-normal]");
      var fUp = document.querySelector("[data-coil-f-up]");
      var fDown = document.querySelector("[data-coil-f-down]");
      var out = document.getElementById("coil-readout");
      return {
        readout: out.textContent,
        valuetext: s.getAttribute("aria-valuetext"),
        x1: Number(line.getAttribute("x1")), y1: Number(line.getAttribute("y1")),
        x2: Number(line.getAttribute("x2")), y2: Number(line.getAttribute("y2")),
        nx: Number(normal.getAttribute("x2")), ny: Number(normal.getAttribute("y2")),
        upX: Number(fUp.getAttribute("x1")), upTail: Number(fUp.getAttribute("y1")), upTip: Number(fUp.getAttribute("y2")),
        downX: Number(fDown.getAttribute("x1")), downTail: Number(fDown.getAttribute("y1")), downTip: Number(fDown.getAttribute("y2")),
        arc: document.querySelector("[data-coil-arc]").getAttribute("d"),
        phi: document.querySelector("[data-coil-angle-text]").textContent,
      };
    })()`);
    const max = await setAngle(90);
    assert.match(max.readout, /largest/);
    assert.match(max.valuetext, /90/);
    assert.equal(Math.round(max.y1), Math.round(max.y2), "plane parallel to B: coil line horizontal");
    assert.ok(max.upTip < max.upTail, "out-of-page side carried up");
    assert.ok(max.downTip > max.downTail, "into-page side carried down");
    assert.equal(Math.round(max.nx), 240, "normal points down at phi = 90");
    assert.match(max.arc, /^M 274 120 A 34 34 0 0 1 240 154$/);
    assert.equal(max.phi, "φ");
    const zero = await setAngle(0);
    assert.match(zero.readout, /τ = 0/);
    assert.equal(Math.round(zero.x1), Math.round(zero.x2), "normal along B: coil line vertical, zero arm");
    assert.equal(Math.round(zero.ny), 120, "normal points along B");
    assert.equal(Math.round(zero.upX), Math.round(zero.downX), "both sides at the same x: torque arm gone");
    assert.ok(zero.upTip < zero.upTail && zero.downTip > zero.downTail, "forces still act, but no turning");
    assert.match(zero.arc, /^M 274 120 A 34 34 0 0 1 274 120$/);
    const mid = await setAngle(45);
    assert.match(mid.readout, /0\.71 NBIA/);
    assert.equal(Math.abs(Math.round(mid.x1) - Math.round(mid.x2)), Math.abs(Math.round(mid.y1) - Math.round(mid.y2)), "coil line at 45 degrees");
    assert.ok(!/NaN/.test(mid.arc + mid.readout), "no broken geometry");
    const back = await setAngle(90);
    assert.equal(back.readout, max.readout, "returning to 90 restores the max state");
  });

  chromeTest("quick check: wrong is a retryable nudge, right reveals the reason", async () => {
    await cdp.goto(pageUrl("summary.html"));
    const handle = await cdp.evaluate(`(function () {
      var box = document.getElementById("recap-electron-check");
      var wrong = box.querySelector("[data-choice='A']");
      var right = box.querySelector("[data-choice='B']");
      wrong.click();
      var afterWrong = {
        wrongClass: wrong.classList.contains("wrong"),
        wrongDisabled: wrong.disabled,
        rightDisabled: right.disabled,
        feedback: box.querySelector(".feedback").textContent,
        explainHidden: box.querySelector(".explain").hidden,
        heading: box.querySelector("h3").textContent,
        answer: box.getAttribute("data-answer"),
      };
      right.click();
      var afterRight = {
        rightClass: right.classList.contains("correct"),
        allDisabled: Array.prototype.every.call(box.querySelectorAll("[data-choice]"), function (b) { return b.disabled; }),
        feedback: box.querySelector(".feedback").textContent,
        explainHidden: box.querySelector(".explain").hidden,
        explain: box.querySelector(".explain").textContent,
      };
      return { afterWrong: afterWrong, afterRight: afterRight };
    })()`);
    assert.equal(handle.afterWrong.answer, "B");
    assert.ok(handle.afterWrong.wrongClass, "wrong option is marked amber");
    assert.ok(handle.afterWrong.wrongDisabled, "wrong option is out");
    assert.equal(handle.afterWrong.rightDisabled, false, "retry stays possible");
    assert.equal(handle.afterWrong.feedback, "Not quite. Try another.");
    assert.equal(handle.afterWrong.explainHidden, true, "no answer leak on a wrong try");
    assert.equal(handle.afterWrong.heading, "Quick check 1");
    assert.ok(handle.afterRight.rightClass, "right option goes green");
    assert.ok(handle.afterRight.allDisabled, "check settles after the right answer");
    assert.equal(handle.afterRight.feedback, "Right.");
    assert.equal(handle.afterRight.explainHidden, false, "reasoning is revealed");
    assert.match(handle.afterRight.explain, /Conventional current is opposite v/);
  });

  chromeTest("written check: Show answer toggles the model answer", async () => {
    await cdp.goto(pageUrl("summary.html"));
    const data = await cdp.evaluate(`(function () {
      var box = document.getElementById("recap-coil-check");
      var btn = box.querySelector("button[data-reveal]");
      var model = box.querySelector(".model");
      var states = [{
        hidden: model.hidden,
        label: btn.textContent,
        expanded: btn.getAttribute("aria-expanded"),
      }];
      btn.click();
      states.push({ hidden: model.hidden, label: btn.textContent, expanded: btn.getAttribute("aria-expanded") });
      btn.click();
      states.push({ hidden: model.hidden, label: btn.textContent, expanded: btn.getAttribute("aria-expanded") });
      return { states: states, heading: box.querySelector("h3").textContent, model: model.innerText };
    })()`);
    assert.equal(data.heading, "Write it 2");
    assert.deepEqual(data.states, [
      { hidden: true, label: "Show answer", expanded: "false" },
      { hidden: false, label: "Hide answer", expanded: "true" },
      { hidden: true, label: "Show answer", expanded: "false" },
    ]);
    assert.match(data.model, /NBIA/);
    assert.match(data.model, /commutator/);
  });

  chromeTest("no page-level overflow and a one-column digest at 390x844", async () => {
    await cdp.goto(pageUrl("summary.html"));
    const measure = () => cdp.evaluate(`(function () {
      var doc = document.documentElement;
      var wide = [];
      Array.prototype.forEach.call(document.querySelectorAll(".formula-card, .compare-card, .coil-demo, .check, .trap"), function (el) {
        if (el.scrollWidth > el.clientWidth + 1) wide.push(el.className);
      });
      return {
        inner: window.innerWidth,
        scroll: doc.scrollWidth,
        wide: wide,
        formulaCols: getComputedStyle(document.querySelector(".formula-cards")).gridTemplateColumns.split(" ").length,
        compareCols: getComputedStyle(document.querySelector(".compare-grid")).gridTemplateColumns.split(" ").length,
        svgOver: Array.prototype.some.call(document.querySelectorAll(".coil-demo svg, .check-fig svg"), function (svg) {
          var host = svg.parentElement;
          return svg.getBoundingClientRect().width > host.getBoundingClientRect().width + 1;
        }),
      };
    })()`);
    await cdp.viewport(1280, 800, false);
    const desktop = await measure();
    assert.ok(desktop.scroll <= desktop.inner, "1280: no page overflow");
    assert.deepEqual(desktop.wide, [], "1280: no block overflows");
    assert.equal(desktop.formulaCols, 2, "1280: formula cards sit in two columns");
    assert.equal(desktop.compareCols, 3, "1280: three comparison cards in a row");
    assert.equal(desktop.svgOver, false);
    await cdp.viewport(390, 844, true);
    const phone = await measure();
    assert.ok(phone.scroll <= phone.inner, "390: no page overflow");
    assert.deepEqual(phone.wide, [], "390: no block overflows");
    assert.equal(phone.formulaCols, 1, "390: formula cards stack");
    assert.equal(phone.compareCols, 1, "390: comparison cards stack");
    assert.equal(phone.svgOver, false);
    await cdp.viewport(1280, 800, false);
  });

  chromeTest("figure labels survive a resize", async () => {
    await cdp.goto(pageUrl("summary.html"));
    const read = () => cdp.evaluate(`(function () {
      var line = document.querySelector("[data-coil-line]");
      var out = document.getElementById("coil-readout");
      return {
        x1: line.getAttribute("x1"), y1: line.getAttribute("y1"),
        x2: line.getAttribute("x2"), y2: line.getAttribute("y2"),
        readout: out.textContent,
        box: document.querySelector(".coil-demo svg").getBoundingClientRect().width,
        font: getComputedStyle(document.querySelector(".coil-lbl")).fontSize,
      };
    })()`);
    await cdp.viewport(1280, 800, false);
    const desktop = await read();
    await cdp.viewport(390, 844, true);
    const phone = await read();
    await cdp.viewport(1280, 800, false);
    const back = await read();
    assert.equal(desktop.readout, phone.readout);
    assert.equal(phone.readout, back.readout);
    assert.equal(desktop.x1 + desktop.y1 + desktop.x2 + desktop.y2, phone.x1 + phone.y1 + phone.x2 + phone.y2, "SVG geometry is viewBox based, not pixel based");
    assert.ok(desktop.box > 0 && phone.box > 0 && back.box > 0);
    assert.notEqual(desktop.box, phone.box, "figure actually changed width");
  });
});
