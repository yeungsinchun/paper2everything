(function () {
  "use strict";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function svgEl(name, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach(function (key) {
      el.setAttribute(key, String(attrs[key]));
    });
    return el;
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

  function initImaging() {
    /* imaging is a three.js scene; replay is handled by data-scene + notes-replay */
  }

  function initIsotopes() {
    $all("[data-iso]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (window.NotesScenes && window.NotesScenes.hydrogen) {
          window.NotesScenes.hydrogen.setN(Number(btn.getAttribute("data-iso")));
        }
      });
    });
  }

  function initNuclides() {
    $all("[data-nuclide]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (window.NotesScenes && window.NotesScenes.nuclide) {
          window.NotesScenes.nuclide.setKey(btn.getAttribute("data-nuclide"));
        }
      });
    });
  }

  var series = [
    { el: "U", a: 238, z: 92, n: 146, kind: "α" },
    { el: "Th", a: 234, z: 90, n: 144, kind: "β" },
    { el: "Pa", a: 234, z: 91, n: 143, kind: "β" },
    { el: "U", a: 234, z: 92, n: 142, kind: "α" },
    { el: "Th", a: 230, z: 90, n: 140, kind: "α" },
    { el: "Ra", a: 226, z: 88, n: 138, kind: "α" },
    { el: "Rn", a: 222, z: 86, n: 136, kind: "α" },
    { el: "Po", a: 218, z: 84, n: 134, kind: "α" },
    { el: "Pb", a: 214, z: 82, n: 132, kind: "β" },
    { el: "Bi", a: 214, z: 83, n: 131, kind: "β" },
    { el: "Po", a: 214, z: 84, n: 130, kind: "α" },
    { el: "Pb", a: 210, z: 82, n: 128, kind: "β" },
    { el: "Bi", a: 210, z: 83, n: 127, kind: "β" },
    { el: "Po", a: 210, z: 84, n: 126, kind: "α" },
    { el: "Pb", a: 206, z: 82, n: 124, kind: "stable" }
  ];

  function initSeries() {
    var az = $("#series-az");
    var nz = $("#series-nz");
    var readout = $("#series-readout");
    if (!az || !nz) return;
    var step = 0;
    var left = 48;
    var right = 292;
    var top = 22;
    var bottom = 208;
    var zMin = 81;
    var zMax = 93;
    var aMin = 204;
    var aMax = 240;
    var nMin = 122;
    var nMax = 148;

    function xFromZ(z) {
      return left + (z - zMin) * (right - left) / (zMax - zMin);
    }
    function yFromA(a) {
      return bottom - (a - aMin) * (bottom - top) / (aMax - aMin);
    }
    function yFromN(n) {
      return bottom - (n - nMin) * (bottom - top) / (nMax - nMin);
    }

    function plot(svg, yOf, key) {
      $all(".plot", svg).forEach(function (node) { node.remove(); });
      var pts = "";
      var i;
      var dots = [];
      for (i = 0; i <= step; i += 1) {
        var nu = series[i];
        var x = xFromZ(nu.z);
        var y = yOf(key === "a" ? nu.a : nu.n);
        pts += x + "," + y + " ";
        var fill = "#8aa39c";
        if (i === step) fill = "#0e5f56";
        else if (i > 0 && series[i - 1].kind === "β") fill = "#1d4f91";
        else if (i > 0) fill = "#c0392b";
        dots.push({ x: x, y: y, r: i === step ? 5 : 3.2, fill: fill });
      }
      svg.appendChild(svgEl("polyline", {
        class: "plot",
        points: pts,
        fill: "none",
        stroke: "#6b7380",
        "stroke-width": "1.6"
      }));
      dots.forEach(function (dot) {
        svg.appendChild(svgEl("circle", {
          class: "plot", cx: dot.x, cy: dot.y, r: dot.r, fill: dot.fill
        }));
      });
    }

    function draw() {
      plot(az, yFromA, "a");
      plot(nz, yFromN, "n");
      var nu = series[step];
      var next = nu.kind === "stable" ? "stable" : "next " + nu.kind;
      readout.textContent =
        nu.el + "-" + nu.a + "   Z = " + nu.z + "   N = " + nu.n + "   ·  " + next +
        "   ·  γ would not move this point";
    }

    $("#series-next") && $("#series-next").addEventListener("click", function () {
      step = Math.min(series.length - 1, step + 1);
      draw();
    });
    $("#series-reset") && $("#series-reset").addEventListener("click", function () {
      step = 0;
      draw();
    });
    draw();
  }

  function initDecayEq() {
    $all("[data-decay]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-decay");
        $all("[data-decay]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        $all("[data-decay-panel]").forEach(function (p) {
          p.hidden = p.getAttribute("data-decay-panel") !== kind;
        });
        var vis = document.getElementById("decay-" + kind);
        if (vis) replay(vis);
      });
    });
  }

  function jitter(n) {
    return n + Math.round((Math.random() - 0.5) * 8);
  }

  function initGm() {
    var display = $("#gm-rate");
    var bgEl = $("#gm-bg");
    var corr = $("#gm-corr");
    if (!display) return;
    var bg = 1;
    var extra = 0;
    var gridOn = true;
    var picked = 0;
    var needGridOff = false;
    function applyExtra() {
      extra = gridOn && needGridOff ? 0 : picked;
    }
    function tick() {
      var shown = Math.max(0, jitter(bg + extra));
      display.textContent = String(shown);
      if (corr) corr.textContent = String(Math.max(0, shown - bg));
    }
    setInterval(tick, 700);
    tick();
    $("#gm-bg-btn") && $("#gm-bg-btn").addEventListener("click", function () {
      picked = 0;
      needGridOff = false;
      applyExtra();
    });
    $all("[data-gm-src]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        picked = Number(btn.getAttribute("data-gm-src"));
        needGridOff = btn.getAttribute("data-need-grid") === "off";
        applyExtra();
      });
    });
    $("#gm-grid") && $("#gm-grid").addEventListener("click", function () {
      gridOn = !gridOn;
      this.setAttribute("aria-pressed", gridOn ? "true" : "false");
      this.textContent = gridOn ? "plastic grid on (blocks α)" : "plastic grid off (α can enter)";
      applyExtra();
    });
    if (bgEl) bgEl.textContent = "Hong Kong typical background ≈ 1 count s⁻¹";
  }

  function initIonCurrent() {
    $all("[data-current]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (window.NotesScenes && window.NotesScenes.current && window.NotesScenes.current.setKind) {
          window.NotesScenes.current.setKind(btn.getAttribute("data-current"));
        }
      });
    });
  }

  function initTracks() {
    var buttons = $all("[data-track]");
    function press(kind) {
      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-track") === kind ? "true" : "false");
      });
    }
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-track");
        if (window.NotesScenes && window.NotesScenes.tracks) {
          window.NotesScenes.tracks.setKind(kind);
        }
        press(kind);
      });
    });
    if (buttons.length) press("alpha");
  }

  var sources = {
    abg: { a: 200, b: 385, g: 254, label: "Case 3" },
    bg: { a: 0, b: 385, g: 254, label: "Case 1 · Example 25.6" },
    ag: { a: 150, b: 0, g: 254, label: "Case 2" }
  };

  function absorberCount(src, paper, al, pb, bg) {
    var count = bg;
    var alphaStopped = paper || al || pb;
    var betaStopped = al || pb;
    if (src.a && !alphaStopped) count += src.a;
    if (src.b && !betaStopped) count += src.b;
    if (src.g) count += pb ? src.g / 2 : src.g;
    return Math.max(bg, Math.round(count));
  }

  function initAbsorbers() {
    var rateEl = $("#abs-rate");
    var note = $("#abs-note");
    if (!rateEl) return;
    var src = sources.bg;
    var paper = false;
    var al = false;
    var pb = false;
    var bg = 61;

    function render() {
      var r = jitter(absorberCount(src, paper, al, pb, bg));
      rateEl.textContent = r + " cpm";
      var bits = [];
      if (paper) bits.push("paper");
      if (al) bits.push("5 mm Al");
      if (pb) bits.push("25 mm Pb");
      if (note) {
        note.textContent = src.label + (bits.length ? "  ·  " + bits.join(", ") : "  ·  air only") +
          "  ·  background ≈ " + bg + " cpm";
      }
      if (window.NotesScenes && window.NotesScenes.absorbers) {
        window.NotesScenes.absorbers.set({
          hasA: !!src.a,
          hasB: !!src.b,
          hasG: !!src.g,
          paper: paper,
          al: al,
          pb: pb
        });
      }
    }

    $all("[data-abs-src]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        src = sources[btn.getAttribute("data-abs-src")];
        render();
      });
    });
    $("#abs-paper") && $("#abs-paper").addEventListener("click", function () {
      paper = !paper;
      this.setAttribute("aria-pressed", paper ? "true" : "false");
      render();
    });
    $("#abs-al") && $("#abs-al").addEventListener("click", function () {
      al = !al;
      this.setAttribute("aria-pressed", al ? "true" : "false");
      render();
    });
    $("#abs-pb") && $("#abs-pb").addEventListener("click", function () {
      pb = !pb;
      this.setAttribute("aria-pressed", pb ? "true" : "false");
      render();
    });
    render();
  }

  var flowSteps = [
    { text: "Unknown source in front of a GM tube. Subtract background later." },
    { text: "Insert paper. Example 25.6: no drop (700 → 700) → no α. A drop would mean α is present." },
    { text: "Insert ~5 mm Al. Example 25.6: drop from the paper reading (700 → 315) → β is present." },
    { text: "β present. Continue to the Pb test for γ." },
    { text: "Insert ~25 mm Pb. Example 25.6: drop but still above background (315 → 190) → γ is present (halved, not zero)." },
    { text: "γ present. Strength only halved by 25 mm Pb, never read below background." },
    { text: "Confirm: E or B splits α / β; γ straight. Tracks: thick / thin / faint." }
  ];

  function initFlow() {
    var svg = $("#id-flow");
    var talk = $("#flow-talk");
    if (!svg) return;
    var i = 0;
    var hasAlpha = null;
    var hasBeta = null;

    function talkText() {
      if (hasAlpha === true && i <= 1) {
        return "Significant drop at paper → α is present. Still insert Al, then Pb.";
      }
      if (hasAlpha === true && i === 2) {
        return "α already found. Insert ~5 mm Al to test for β, then Pb for γ.";
      }
      if (hasAlpha === true && i === 4) {
        return "Insert ~25 mm Pb to test for γ. Remaining count above background → γ is present.";
      }
      if (hasBeta === false && i === 4) {
        return "No drop at Al → no β. Insert ~25 mm Pb to test for γ.";
      }
      return flowSteps[i].text;
    }

    function show() {
      $all(".node", svg).forEach(function (n) {
        n.classList.remove("active", "done");
        var raw = n.getAttribute("data-step");
        if (raw === "alpha") {
          if (hasAlpha === true) n.classList.add(i <= 1 ? "active" : "done");
          return;
        }
        var idx = Number(raw);
        if (idx === 1 && hasAlpha === true && i <= 1) {
          n.classList.add("done");
          return;
        }
        if (idx === 3 && hasBeta !== true) return;
        if (idx < i) n.classList.add("done");
        if (idx === i) n.classList.add("active");
      });
      $all(".edge", svg).forEach(function (e) {
        var branch = e.getAttribute("data-side");
        var need = Number(e.getAttribute("data-until"));
        var lit = false;
        if (branch === "alpha") lit = hasAlpha === true;
        else if (branch === "no-alpha") lit = hasAlpha === false && i >= 2;
        else if (branch === "beta") lit = hasBeta === true && i >= need;
        else if (branch === "no-beta") lit = hasBeta === false && i >= 4;
        else lit = i >= need;
        e.classList.toggle("lit", lit);
      });
      if (talk) talk.textContent = talkText();
    }

    $("#flow-next") && $("#flow-next").addEventListener("click", function () {
      if (i === 1 && hasAlpha === null) hasAlpha = false;
      if (i === 2 && hasBeta === null) {
        if (hasAlpha === true) {
          i = Math.min(flowSteps.length - 1, 4);
          show();
          return;
        }
        hasBeta = true;
      }
      i = Math.min(flowSteps.length - 1, i + 1);
      show();
    });
    $("#flow-reset") && $("#flow-reset").addEventListener("click", function () {
      hasAlpha = null;
      hasBeta = null;
      i = 0;
      show();
    });
    $all(".node", svg).forEach(function (n) {
      n.addEventListener("click", function () {
        var raw = n.getAttribute("data-step");
        if (raw === "alpha") {
          hasAlpha = true;
          hasBeta = null;
          i = 1;
          show();
          return;
        }
        var idx = Number(raw);
        if (idx === 0) {
          hasAlpha = null;
          hasBeta = null;
        } else if (idx === 1) {
          hasBeta = null;
        } else if (idx === 2) {
          if (hasAlpha === null) hasAlpha = false;
          hasBeta = null;
        } else if (idx === 3) {
          hasBeta = true;
          if (hasAlpha === null) hasAlpha = false;
        } else if (idx === 4) {
          if (hasBeta === null && hasAlpha !== true) hasBeta = false;
        }
        i = idx;
        show();
      });
    });
    show();
  }

  function initFields() {
    var flip = $("#b-flip");
    var mark = document.querySelector("[data-b-mark]");
    if (!flip && !mark) return;
    var into = true;

    function setB() {
      if (window.NotesScenes && window.NotesScenes.bfield) {
        window.NotesScenes.bfield.setInto(into);
      }
      $all("[data-b-mark]").forEach(function (t) {
        t.textContent = into ? "×  B into the page" : "·  B out of the page";
      });
    }

    if (flip) {
      flip.addEventListener("click", function () {
        into = !into;
        setB();
      });
    }
    setB();
  }

  function initBadge() {
    $all("[data-badge]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-badge");
        if (window.NotesScenes && window.NotesScenes.badge) {
          window.NotesScenes.badge.setKind(kind);
        }
      });
    });
  }

  /* Ch.6 summary: drag the coil angle. The coil is drawn edge on, so the torque
     arm is the horizontal separation of the two sides: it is longest when the
     coil plane lies along B and vanishes when the normal points along B. The
     force on each side is unchanged; only the arm changes. */
  function initMotorAngle() {
    var demo = document.querySelector("[data-coil-demo]");
    var slider = document.getElementById("coil-angle");
    if (!demo || !slider) return;
    var readout = document.getElementById("coil-readout");
    var line = $("[data-coil-line]", demo);
    var out = $("[data-coil-out]", demo);
    var into = $("[data-coil-in]", demo);
    var fUp = $("[data-coil-f-up]", demo);
    var fDown = $("[data-coil-f-down]", demo);
    var fUpLbl = $("[data-coil-f-up-lbl]", demo);
    var fDownLbl = $("[data-coil-f-down-lbl]", demo);
    var normal = $("[data-coil-normal]", demo);
    var normalLbl = $("[data-coil-normal-lbl]", demo);
    var arc = $("[data-coil-arc]", demo);
    var angleText = $("[data-coil-angle-text]", demo);
    var coilLbl = $("[data-coil-coil-lbl]", demo);
    if (!line || !out || !into || !fUp || !fDown || !normal || !arc || !angleText) return;
    var cx = 240, cy = 120, r = 62, fn = 40, nn = 58;

    function round(n) {
      return Math.round(n * 100) / 100;
    }

    function render() {
      var phi = Number(slider.value) || 0;
      var rad = phi * Math.PI / 180;
      var dx = Math.sin(rad), dy = -Math.cos(rad);
      var px = round(cx + r * dx), py = round(cy + r * dy);
      var mx = round(cx - r * dx), my = round(cy - r * dy);
      var nx = Math.cos(rad), ny = Math.sin(rad);
      var nLen = 58;

      line.setAttribute("x1", px); line.setAttribute("y1", py);
      line.setAttribute("x2", mx); line.setAttribute("y2", my);
      out.setAttribute("transform", "translate(" + px + "," + py + ")");
      into.setAttribute("transform", "translate(" + mx + "," + my + ")");

      fUp.setAttribute("x1", px); fUp.setAttribute("y1", py);
      fUp.setAttribute("x2", px); fUp.setAttribute("y2", round(py - fn));
      fDown.setAttribute("x1", mx); fDown.setAttribute("y1", my);
      fDown.setAttribute("x2", mx); fDown.setAttribute("y2", round(my + fn));
      if (fUpLbl) { fUpLbl.setAttribute("x", round(px + 10)); fUpLbl.setAttribute("y", round(py - 6)); }
      if (fDownLbl) { fDownLbl.setAttribute("x", round(mx - 10)); fDownLbl.setAttribute("y", round(my + 18)); }

      var tx = round(cx + nLen * nx), ty = round(cy + nLen * ny);
      normal.setAttribute("x2", tx); normal.setAttribute("y2", ty);
      if (normalLbl) {
        normalLbl.setAttribute("x", round(cx + (nLen + 14) * nx + 6));
        normalLbl.setAttribute("y", round(cy + (nLen + 14) * ny - 6));
      }

      arc.setAttribute("d", "M " + (cx + 34) + " " + cy +
        " A 34 34 0 0 1 " + round(cx + 34 * nx) + " " + round(cy + 34 * ny));
      var ax = round(cx + 30 * Math.cos(rad / 2));
      var ay = round(cy + 30 * Math.sin(rad / 2) - (phi < 15 ? 14 : 0));
      angleText.setAttribute("x", ax);
      angleText.setAttribute("y", ay);
      angleText.textContent = "φ";
      if (coilLbl) {
        coilLbl.setAttribute("x", round(cx - 16 * nx));
        coilLbl.setAttribute("y", round(cy - 16 * ny + 5));
      }

      var frac = Math.sin(rad);
      var tauText = "τ = " + (phi === 0 ? "0" : phi === 90 ? "NBIA (largest)" : frac.toFixed(2) + " NBIA");
      var full = "φ = " + phi + "° · " + tauText;
      if (readout) readout.textContent = full;
      slider.setAttribute("aria-valuetext", full);
    }

    slider.addEventListener("input", render);
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReplays();
    initImaging();
    initIsotopes();
    initNuclides();
    initSeries();
    initDecayEq();
    initGm();
    initIonCurrent();
    initTracks();
    initAbsorbers();
    initFlow();
    initFields();
    initBadge();
    initMotorAngle();
  });
})();
