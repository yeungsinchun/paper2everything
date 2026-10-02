(function () {
  "use strict";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  /* Concept checks (MC / true-false / written answer) live in ../../js/checks.js. */

  function replay(el) {
    el.classList.remove("play");
    void el.offsetWidth;
    el.classList.add("play");
    el.dispatchEvent(new Event("notes-replay"));
  }

  function initReplays() {
    $all("[data-replay]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.getAttribute("data-replay"));
        if (target) replay(target);
      });
    });
    /* Autoplay clips start when the student scrolls to them, and start again
       each time the box comes back into view, so a clip is never found already
       finished. Without IntersectionObserver they simply play at load. */
    var autos = $all(".visual[data-autoplay]");
    if (!autos.length) return;
    if (typeof IntersectionObserver !== "function") {
      autos.forEach(replay);
      return;
    }
    var lastPlay = new WeakMap();
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var now = performance.now();
        if (now - (lastPlay.get(entry.target) || -1e9) < 1200) return;
        lastPlay.set(entry.target, now);
        replay(entry.target);
      });
    }, { threshold: 0.45 });
    autos.forEach(function (v) { watcher.observe(v); });
  }

  function initPipeline() {
    $all("[data-leak]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("data-leak") === "on";
        if (window.NotesScenes && window.NotesScenes.pipeline) {
          window.NotesScenes.pipeline.setLeak(on);
        }
        $all("[data-leak]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
      });
    });
  }

  function initThickness() {
    var slider = $("#thick-slider");
    if (!slider) return;
    function apply() {
      var v = Number(slider.value);
      if (window.NotesScenes && window.NotesScenes.thickness) {
        window.NotesScenes.thickness.setThick(v);
      }
    }
    slider.addEventListener("input", apply);
    apply();
  }

  function initSmoke() {
    $all("[data-fire]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var on = btn.getAttribute("data-fire") === "on";
        if (window.NotesScenes && window.NotesScenes.smoke) {
          window.NotesScenes.smoke.setFire(on);
        }
        $all("[data-fire]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
      });
    });
  }

  function initDating() {
    $all("[data-age]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = Number(btn.getAttribute("data-age"));
        if (window.NotesScenes && window.NotesScenes.dating) {
          window.NotesScenes.dating.setAge(i);
        }
        $all("[data-age]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
      });
    });
  }

  function sceneFor(el) {
    var name = el && el.getAttribute("data-scene");
    return name && window.NotesScenes ? window.NotesScenes[name] : null;
  }

  function setPauseLabel(btn, paused) {
    var label = paused ? "Play" : "Pause";
    if (btn.textContent !== label) btn.textContent = label;
    var pressed = paused ? "true" : "false";
    if (btn.getAttribute("aria-pressed") !== pressed) btn.setAttribute("aria-pressed", pressed);
    var aria = paused ? "Play animation" : "Pause animation";
    if (btn.getAttribute("aria-label") !== aria) btn.setAttribute("aria-label", aria);
  }

  function initPause() {
    $all("[data-pause]").forEach(function (btn) {
      var target = document.getElementById(btn.getAttribute("data-pause"));
      var scene = sceneFor(target);
      if (!scene || typeof scene.pause !== "function" || typeof scene.play !== "function") return;
      btn.addEventListener("click", function () {
        var paused = btn.getAttribute("aria-pressed") === "true";
        if (paused) scene.play();
        else scene.pause();
        setPauseLabel(btn, !paused);
      });
      if (target) {
        target.addEventListener("notes-scene-tick", function (ev) {
          setPauseLabel(btn, !ev.detail.playing);
        });
      }
      setPauseLabel(btn, false);
    });
  }

  /* One time model drives the slider, the preset buttons and the readout row;
     the scene's notes-scene-tick keeps the slider honest while the finite clip
     plays. Manual use pauses the clip so the selected value stays put. */
  function initTimeSelect(opts) {
    var host = document.getElementById(opts.host);
    var slider = document.getElementById(opts.slider);
    var out = document.getElementById(opts.out);
    if (!host || !slider || !out) return;
    var scene = sceneFor(host);
    if (!scene || typeof scene.setT !== "function") return;
    var buttons = $all("[" + opts.attr + "]");

    function setPressed(v) {
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute(opts.attr) === v ? "true" : "false");
      });
    }

    function apply(value) {
      var v = Number(value);
      scene.setT(v);
      var shown = String(Math.round(v));
      if (slider.value !== shown) slider.value = shown;
      var label = Math.round(v) + " " + opts.unit;
      if (out.textContent !== label) out.textContent = label;
      setPressed(shown);
    }

    slider.addEventListener("input", function () { apply(slider.value); });
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        slider.value = btn.getAttribute(opts.attr);
        apply(slider.value);
      });
    });
    host.addEventListener("notes-scene-tick", function (ev) {
      var shown = String(Math.round(ev.detail.t));
      if (slider.value !== shown) slider.value = shown;
      var label = shown + " " + opts.unit;
      if (out.textContent !== label) out.textContent = label;
      setPressed(shown);
    });
    apply(slider.value);
  }

  function initHalfLife() {
    initTimeSelect({ host: "halfn-vis", slider: "half-time", out: "half-time-out", unit: "d", attr: "data-half-set" });
  }

  function initCountbg() {
    initTimeSelect({ host: "countbg-vis", slider: "bg-time", out: "bg-time-out", unit: "h", attr: "data-bg-set" });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReplays();
    initPause();
    initHalfLife();
    initCountbg();
    initPipeline();
    initThickness();
    initSmoke();
    initDating();
  });
})();
