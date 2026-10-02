/* Book 4 Ch.4 section 22.2 - domestic circuit figures.
   Two reusable contracts for this family of pages:
   - wiring: a live/neutral/earth parallel circuit with a finite live-to-case
     fault demonstration (Replay, Pause, offscreen/document-hidden suspension,
     reduced-motion static terminal frame).
   - fuse: working current -> standard fuse -> compatible cable as three steps
     selected on the figure.
   Markup contract (also asserted in notes.interactives.test.mjs):
   - .visual[data-circuit="wiring"] > svg with [data-part=live|neutral|earth|
     fuse|fuse-closed|fuse-open|case|earth-bond|branch-lamp|branch-heater|
     fault-*] groups, [data-circuit-state], [data-circuit-replay],
     [data-circuit-pause] controls and #wiring-status[aria-live].
   - .visual[data-circuit="fuse"] > svg with [data-part=working-current|fuse|
     cable|...], [data-fuse-step="1|2|3"] controls and #fuse-step-readout. */
(function () {
  "use strict";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var reducedMotion = typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- A · household circuit ---------- */

  function initWiring() {
    var host = $('[data-circuit="wiring"]');
    if (!host) return null;
    var svg = $("svg", host);
    if (!svg) return null;

    var status = document.getElementById("wiring-status");
    var stateButtons = $all("[data-circuit-state]");
    var replayButton = $("[data-circuit-replay]");
    var pauseButton = $("[data-circuit-pause]");
    var faultFlow = $('[data-part="fault-flow"]', svg);

    var DURATION = 2600;
    var state = {
      mode: "normal", /* normal | fault */
      phase: 0, /* 0 normal · 1 fault flows · 2 fuse opens · 3 dead and safe */
      progress: 0,
      playing: false,
      paused: false,
      suspended: false
    };
    var rafId = null;
    var lastTs = 0;

    function phaseAt(progress) {
      if (progress < 0.45) return 1;
      if (progress < 0.6) return 2;
      return 3;
    }

    function statusText() {
      if (state.mode === "normal") {
        return "Parallel branches: 220 V each; earth bonds the metal case.";
      }
      if (state.phase === 1) {
        return "Fault: live touches the case, so current returns through the earth wire.";
      }
      if (state.phase === 2) {
        return "The large fault current blows the fuse and breaks the live wire.";
      }
      return "Fuse open: every branch is dead, and the case stays at 0 V.";
    }

    function render() {
      host.setAttribute("data-state", state.mode);
      host.setAttribute("data-phase", String(state.phase));
      host.setAttribute("data-progress", state.progress.toFixed(3));
      if (faultFlow) {
        faultFlow.setAttribute("stroke-dashoffset", String(-Math.round(state.progress * 520)));
      }
      if (status) status.textContent = statusText();
      stateButtons.forEach(function (btn) {
        var on = btn.getAttribute("data-circuit-state") === state.mode;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (pauseButton) {
        pauseButton.setAttribute("aria-pressed", state.paused ? "true" : "false");
        pauseButton.textContent = state.paused ? "Resume" : "Pause";
      }
    }

    function stopTicking() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function tick(ts) {
      rafId = null;
      if (!state.playing || state.paused || state.suspended) return;
      var dt = lastTs ? ts - lastTs : 16;
      lastTs = ts;
      state.progress = Math.min(1, state.progress + dt / DURATION);
      state.phase = phaseAt(state.progress);
      render();
      if (state.progress >= 1) {
        state.playing = false;
        lastTs = 0;
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    }

    function ensureTicking() {
      if (rafId === null && state.playing && !state.paused && !state.suspended) {
        lastTs = 0;
        rafId = window.requestAnimationFrame(tick);
      }
    }

    function play() {
      state.mode = "fault";
      state.progress = 0;
      state.phase = 1;
      state.playing = true;
      state.paused = false;
      lastTs = 0;
      if (reducedMotion) {
        state.progress = 1;
        state.phase = 3;
        state.playing = false;
      }
      render();
      ensureTicking();
      return snapshot();
    }

    function reset() {
      state.mode = "normal";
      state.phase = 0;
      state.progress = 0;
      state.playing = false;
      state.paused = false;
      lastTs = 0;
      stopTicking();
      render();
      return snapshot();
    }

    function setPaused(paused) {
      state.paused = paused;
      if (paused) stopTicking();
      else ensureTicking();
      render();
      return snapshot();
    }

    /* Deterministic frame for tests and evidence capture: no clock involved. */
    function seek(progress) {
      var p = Math.max(0, Math.min(1, Number(progress) || 0));
      if (p > 0) {
        state.mode = "fault";
        state.phase = phaseAt(p);
      } else {
        state.mode = "normal";
        state.phase = 0;
      }
      state.progress = p;
      state.playing = false;
      state.paused = false;
      stopTicking();
      render();
      return snapshot();
    }

    function snapshot() {
      return {
        mode: state.mode,
        phase: state.phase,
        progress: state.progress,
        playing: state.playing,
        paused: state.paused,
        suspended: state.suspended,
        fuseOpen: state.mode === "fault" && state.phase >= 2,
        earthPathActive: state.mode === "fault" && state.phase === 1,
        caseSafe: state.mode === "fault" && state.phase >= 2,
        status: status ? status.textContent : ""
      };
    }

    stateButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-circuit-state") === "fault") play();
        else reset();
      });
    });
    if (replayButton) replayButton.addEventListener("click", play);
    if (pauseButton) {
      pauseButton.hidden = reducedMotion;
      pauseButton.addEventListener("click", function () { setPaused(!state.paused); });
    }

    /* Suspend while the tab is hidden or the figure is scrolled away, and pick
       the run back up when it is visible again. */
    function setSuspended(value) {
      if (state.suspended === value) return;
      state.suspended = value;
      if (value) stopTicking();
      else ensureTicking();
    }
    document.addEventListener("visibilitychange", function () {
      setSuspended(document.visibilityState === "hidden" || !onscreen);
    });
    var onscreen = true;
    if (typeof IntersectionObserver === "function") {
      var watcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { onscreen = entry.isIntersecting; });
        setSuspended(document.visibilityState === "hidden" || !onscreen);
      }, { threshold: 0.2 });
      watcher.observe(host);
    }

    render();
    return {
      play: play,
      replay: play,
      pause: function () { return setPaused(true); },
      resume: function () { return setPaused(false); },
      normal: reset,
      seek: seek,
      snapshot: snapshot
    };
  }

  /* ---------- B · fuse and cable choice ---------- */

  function initFuse() {
    var host = $('[data-circuit="fuse"]');
    if (!host) return null;
    var readout = document.getElementById("fuse-step-readout");
    var buttons = $all("[data-fuse-step]");
    if (!buttons.length) return null;
    var STEP_WHY = {
      "1": "Working current: what the load draws at 220 V.",
      "2": "Fuse: the lowest standard rating above the working current.",
      "3": "Cable: rated at or above the fuse, so it outlasts the fuse."
    };
    var step = "1";

    function render() {
      host.setAttribute("data-step", step);
      buttons.forEach(function (btn) {
        var on = btn.getAttribute("data-fuse-step") === step;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (readout) readout.textContent = STEP_WHY[step];
    }

    function setStep(next) {
      if (!STEP_WHY[next]) return snapshot();
      step = next;
      render();
      return snapshot();
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () { setStep(btn.getAttribute("data-fuse-step")); });
    });

    function snapshot() {
      return {
        step: Number(step),
        why: readout ? readout.textContent : "",
        workingCurrent: "I = P / V = 2000 / 220 ≈ 9.1 A",
        fuse: "13 A",
        cable: "rated ≥ 13 A"
      };
    }

    render();
    return { setStep: setStep, snapshot: snapshot };
  }

  function boot() {
    var wiring = initWiring();
    var fuse = initFuse();
    window.NotesCircuit = {
      wiring: wiring,
      fuse: fuse,
      snapshot: function () {
        return {
          wiring: wiring ? wiring.snapshot() : null,
          fuse: fuse ? fuse.snapshot() : null
        };
      }
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
