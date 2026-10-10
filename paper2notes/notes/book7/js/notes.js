/* Book 7 page behaviour shared by every chapter:
   - section chips (.idea-nav) mark the idea in view;
   - real simulation controls: photocell (with its I-V graph), electron
     diffraction, STM mode, cube cutting;
   - interactive SVG figures: hydrogen transitions, exciting an atom, Rayleigh
     criterion.
   Every control works without WebGL: readouts and SVG graphs are computed here,
   and the three.js scene (diagrams3d.js) only mirrors them when it exists.
   Concept checks live in checks.js. */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(name, attrs, parent, text) {
    var n = document.createElementNS(SVGNS, name);
    var k;
    for (k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function scene(name) { return window.NotesScenes && window.NotesScenes[name]; }

  function fmt(x, d) { return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }

  function sci(x, d) {
    if (x === 0) return "0";
    var e = Math.floor(Math.log10(Math.abs(x)));
    var m = x / Math.pow(10, e);
    if (Math.abs(m) >= 9.995) { m /= 10; e += 1; }
    return fmt(m, d) + " × 10" + sup(e);
  }

  function sup(n) {
    var map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
    return String(n).split("").map(function (c) { return map[c] || c; }).join("");
  }

  /* ---------- section chips ---------- */

  function initIdeaNav() {
    var nav = $(".idea-nav");
    if (!nav) return;
    var links = $all("a[href^='#']", nav);
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var ideas = $all("section.idea").filter(function (s) { return byId[s.id]; });
    if (!ideas.length) return;
    function mark(id) {
      links.forEach(function (a) {
        if (a === byId[id]) {
          a.setAttribute("aria-current", "true");
          if (nav.scrollWidth > nav.clientWidth) {
            var left = a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2;
            nav.scrollTo ? nav.scrollTo({ left: left, behavior: "auto" }) : (nav.scrollLeft = left);
          }
        } else {
          a.removeAttribute("aria-current");
        }
      });
    }
    function update() {
      var line = Math.min(window.innerHeight * 0.35, 260);
      var current = null;
      ideas.forEach(function (s) {
        if (s.getBoundingClientRect().top <= line) current = s;
      });
      if (current) mark(current.id);
      else links.forEach(function (a) { a.removeAttribute("aria-current"); });
    }
    var queued = false;
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; update(); });
    }, { passive: true });
    update();
  }

  /* ---------- 1.1 photocell + I-V graph ---------- */

  var IV = { x0: 64, x1: 456, y0: 206, y1: 24, vmin: -4, vmax: 3, imax: 1.05 };
  function ivX(V) { return IV.x0 + (V - IV.vmin) / (IV.vmax - IV.vmin) * (IV.x1 - IV.x0); }
  function ivY(I) { return IV.y0 - I / IV.imax * (IV.y0 - IV.y1); }

  function drawIvAxes(svg) {
    var g = el("g", {}, svg);
    el("line", { x1: IV.x0, y1: IV.y0, x2: IV.x1 + 6, y2: IV.y0, "class": "axis" }, g);
    el("line", { x1: ivX(0), y1: IV.y0 + 6, x2: ivX(0), y2: IV.y1 - 8, "class": "axis" }, g);
    var v;
    for (v = -4; v <= 3; v += 1) {
      el("line", { x1: ivX(v), y1: IV.y0, x2: ivX(v), y2: IV.y0 + 5, "class": "axis" }, g);
      el("text", { x: ivX(v), y: IV.y0 + 20, "text-anchor": "middle", "class": "small" }, g, v === 0 ? "0" : String(v).replace("-", "−"));
    }
    el("text", { x: IV.x1 + 10, y: IV.y0 + 4, "class": "sym" }, g, "V");
    el("text", { x: IV.x1 - 4, y: IV.y0 + 36, "text-anchor": "end", "class": "small" }, g, "voltage of anode / V");
    el("text", { x: ivX(0) + 8, y: IV.y1 - 2, "class": "small" }, g, "current / μA");
    [0.5, 1.0].forEach(function (i) {
      el("line", { x1: ivX(0) - 5, y1: ivY(i), x2: ivX(0), y2: ivY(i), "class": "axis" }, g);
      el("text", { x: ivX(0) - 9, y: ivY(i) + 4, "text-anchor": "end", "class": "small" }, g, fmt(i, 1));
    });
    return el("g", {}, svg);
  }

  function initPhotocell() {
    $all("[data-photocell]").forEach(function (box) {
      var PC = window.NotesPhotocell;
      if (!PC) return;
      var params = { f: 7.0, intensity: 3, V: 1.0, metal: "sodium" };
      var fIn = $("[data-pc='f']", box);
      var iIn = $("[data-pc='intensity']", box);
      var vIn = $("[data-pc='V']", box);
      var svg = $("svg[data-iv-graph]", box.closest("figure") || box);
      var layer = svg ? drawIvAxes(svg) : null;
      function out(name, text, off) {
        var o = $("[data-out='" + name + "']", box);
        if (!o) return;
        o.textContent = text;
        o.classList.toggle("is-off", !!off);
      }
      function update() {
        var st = PC.state(params);
        var nm = 3e8 / (params.f * 1e14) * 1e9;
        out("f", fmt(params.f, 1) + " × 10¹⁴ Hz (" + Math.round(nm) + " nm)");
        out("intensity", "×" + params.intensity);
        out("V", (params.V < 0 ? "−" : "+") + fmt(Math.abs(params.V), 1) + " V");
        out("E", "photon energy hf = " + fmt(st.E, 2) + " eV");
        out("phi", "work function φ = " + fmt(st.phi, 1) + " eV");
        out("K", st.emits ? "Kₘₐₓ = " + fmt(st.Kmax, 2) + " eV" : "hf < φ: no photoelectrons", !st.emits);
        out("Vs", st.emits ? "stopping potential = " + fmt(st.Vs, 2) + " V" : "stopping potential: none");
        out("I", "current = " + fmt(st.I, 2) + " μA", st.I === 0);
        $all("[data-pc-metal]", box).forEach(function (b) {
          b.setAttribute("aria-pressed", b.getAttribute("data-pc-metal") === params.metal ? "true" : "false");
        });
        if (layer) {
          clear(layer);
          var pts = [];
          var v;
          for (v = IV.vmin; v <= IV.vmax + 1e-9; v += 0.05) {
            var I = st.emits ? st.Isat * PC.collect(v) * PC.fractionAbove(v, st.Kmax) : 0;
            pts.push(fmt(ivX(v), 1) + "," + fmt(ivY(I), 1));
          }
          el("polyline", { points: pts.join(" "), "class": "curve" }, layer);
          if (st.emits && st.Vs <= 4) {
            el("line", { x1: ivX(-st.Vs), y1: IV.y0, x2: ivX(-st.Vs), y2: IV.y0 - 34, "class": "guide" }, layer);
            el("text", { x: ivX(-st.Vs), y: IV.y0 - 40, "text-anchor": "middle", "class": "small" }, layer, "−Vₛ");
          }
          if (st.emits) {
            el("text", { x: IV.x1, y: ivY(st.Isat) - 8, "text-anchor": "end", "class": "small" }, layer, "saturation current");
          }
          el("circle", { cx: ivX(params.V), cy: ivY(st.I), r: 6, "class": "electron" }, layer);
        }
        var sc = scene("photocell");
        if (sc) sc.set(params);
      }
      if (fIn) fIn.addEventListener("input", function () { params.f = parseFloat(fIn.value); update(); });
      if (iIn) iIn.addEventListener("input", function () { params.intensity = parseInt(iIn.value, 10); update(); });
      if (vIn) vIn.addEventListener("input", function () { params.V = parseFloat(vIn.value); update(); });
      $all("[data-pc-metal]", box).forEach(function (b) {
        b.addEventListener("click", function () { params.metal = b.getAttribute("data-pc-metal"); update(); });
      });
      if (fIn) params.f = parseFloat(fIn.value);
      if (iIn) params.intensity = parseInt(iIn.value, 10);
      if (vIn) params.V = parseFloat(vIn.value);
      update();
      document.addEventListener("notes-scenes-ready", update);
    });
  }

  /* ---------- 2.3 hydrogen energy levels and transitions ---------- */

  var H = {
    E: function (n) { return -13.6 / (n * n); },
    series: { 1: "Lyman", 2: "Balmer", 3: "Paschen" },
    region: function (nm) { return nm < 400 ? "ultraviolet" : (nm <= 700 ? "visible" : "infrared"); }
  };

  /* level y on a 0..-13.6 eV axis, with the crowded top stretched for reading */
  function levelY(E, top, bottom) {
    var u = Math.pow(-E / 13.6, 0.55);
    return top + u * (bottom - top);
  }

  function initLevels() {
    $all("[data-levels]").forEach(function (box) {
      var svg = $("svg", box);
      if (!svg) return;
      var state = { up: 3, low: 2 };
      var TOP = 30;
      var BOT = 300;
      var X0 = 150;
      var X1 = 420;
      var lv = el("g", {}, svg);
      var n;
      for (n = 1; n <= 6; n += 1) {
        var y = levelY(H.E(n), TOP, BOT);
        el("line", { x1: X0, y1: y, x2: X1, y2: y, "class": "level", "data-n": n }, lv);
        /* n = 5 and 6 sit too close for two labels, so they share one */
        if (n <= 4) el("text", { x: X1 + 10, y: y + 5, "class": "small" }, lv, "n = " + n);
        if (n === 6) el("text", { x: X1 + 10, y: (y + levelY(H.E(5), TOP, BOT)) / 2 + 5, "class": "small" }, lv, "n = 5, 6");
        if (n <= 4) el("text", { x: X0 - 10, y: y + 5, "text-anchor": "end", "class": "small" }, lv, (n === 1 ? "−13.6" : String(fmt(H.E(n), 2)).replace("-", "−")) + " eV");
      }
      el("line", { x1: X0, y1: TOP - 14, x2: X1, y2: TOP - 14, "class": "guide" }, lv);
      el("text", { x: X1 + 10, y: TOP - 9, "class": "small" }, lv, "n = ∞");
      el("text", { x: X0 - 10, y: TOP - 9, "text-anchor": "end", "class": "small" }, lv, "0 eV");
      var arrowLayer = el("g", {}, svg);
      function update() {
        if (state.low >= state.up) state.low = state.up - 1;
        var dE = H.E(state.up) - H.E(state.low);
        var nm = 1243 / dE;
        var region = H.region(nm);
        var colour = (window.NotesSpectral && window.NotesSpectral(nm)) || "var(--fig-ink)";
        clear(arrowLayer);
        var yU = levelY(H.E(state.up), TOP, BOT);
        var yL = levelY(H.E(state.low), TOP, BOT);
        var x = X0 + 60 + (state.low - 1) * 80 + (state.up - state.low - 1) * 12;
        el("line", { x1: x, y1: yU, x2: x, y2: yL - 12, style: "stroke:" + colour + ";stroke-width:4" }, arrowLayer);
        el("path", { d: "M" + (x - 8) + "," + (yL - 14) + " L" + x + "," + yL + " L" + (x + 8) + "," + (yL - 14) + " Z", style: "fill:" + colour }, arrowLayer);
        $all(".level", lv).forEach(function (l) {
          var ln = parseInt(l.getAttribute("data-n"), 10);
          l.classList.toggle("is-on", ln === state.up || ln === state.low);
        });
        var o = function (k, t) { var e = $("[data-out='" + k + "']", box); if (e) e.textContent = t; };
        o("dE", "photon energy = " + fmt(dE, 2) + " eV");
        o("lambda", "wavelength = " + Math.round(nm) + " nm");
        o("series", (H.series[state.low] || "") + " series, " + region);
        $all("[data-up]", box).forEach(function (b) { b.setAttribute("aria-pressed", String(parseInt(b.getAttribute("data-up"), 10) === state.up)); });
        $all("[data-low]", box).forEach(function (b) {
          var v = parseInt(b.getAttribute("data-low"), 10);
          b.setAttribute("aria-pressed", String(v === state.low));
          b.disabled = v >= state.up;
        });
      }
      $all("[data-up]", box).forEach(function (b) {
        b.addEventListener("click", function () { state.up = parseInt(b.getAttribute("data-up"), 10); update(); });
      });
      $all("[data-low]", box).forEach(function (b) {
        b.addEventListener("click", function () { state.low = parseInt(b.getAttribute("data-low"), 10); update(); });
      });
      update();
    });
  }

  /* ---------- 2.3 exciting a hydrogen atom: photon versus electron ---------- */

  function initExcite() {
    $all("[data-excite]").forEach(function (box) {
      var range = $("input[type='range']", box);
      var mode = "photon";
      var svg = $("svg", box);
      /* Excitation energy measured up from the ground state. The axis is broken
         at 9 eV so the crowded upper levels get room: 30 px per eV above it. */
      var X0 = 80;
      var X1 = 220;
      var BOT = 280;
      var BRK = 250;
      function yOf(e) { return e <= 9 ? BOT - e * (BOT - BRK) / 9 : BRK - (e - 9) * 30; }
      var lvls = null;
      var arrows = null;
      function label(x, y, text, anchor) {
        return el("text", { x: x, y: y, "text-anchor": anchor || "start", "class": "small halo" }, arrows, text);
      }
      if (svg) {
        lvls = el("g", {}, svg);
        el("path", { d: "M" + (X0 - 6) + "," + (BRK + 8) + " l12,-6 M" + (X0 - 6) + "," + (BRK + 14) + " l12,-6", "class": "axis" }, lvls);
        var yI = yOf(13.6);
        el("line", { x1: X0, y1: yI, x2: X1, y2: yI, "class": "guide" }, lvls);
        el("text", { x: X1 + 10, y: yI + 5, "class": "small" }, lvls, "n = ∞");
        el("text", { x: X0 - 8, y: yI + 5, "text-anchor": "end", "class": "small" }, lvls, "13.6 eV");
        el("text", { x: X0 - 8, y: yI - 26, "text-anchor": "end", "class": "small" }, lvls, "ionized");
        var k;
        for (k = 1; k <= 6; k += 1) {
          var ex = H.E(k) - H.E(1);
          var yk = yOf(ex);
          el("line", { x1: X0, y1: yk, x2: X1, y2: yk, "class": "level", "data-n": k }, lvls);
          if (k <= 4) {
            el("text", { x: X1 + 10, y: yk + 5, "class": "small" }, lvls, "n = " + k);
            el("text", { x: X0 - 8, y: yk + 5, "text-anchor": "end", "class": "small" }, lvls, fmt(ex, 1) + " eV");
          }
        }
        arrows = el("g", {}, svg);
      }
      function arrow(x, y0, y1, cls) {
        el("line", { x1: x, y1: y0, x2: x, y2: y1 + 12, "class": cls }, arrows);
        el("path", { d: "M" + (x - 7) + "," + (y1 + 14) + " L" + x + "," + y1 + " L" + (x + 7) + "," + (y1 + 14), "class": cls }, arrows);
      }
      function draw(E, reached, absorbed) {
        if (!svg) return;
        clear(arrows);
        var yE = yOf(Math.min(E, 16));
        $all(".level", lvls).forEach(function (l) {
          l.classList.toggle("is-on", parseInt(l.getAttribute("data-n"), 10) === reached && reached > 1);
        });
        if (mode === "photon") {
          arrow(110, BOT, yE, absorbed ? "energy-line" : "guide");
          label(118, Math.min(yE + 24, BOT - 40), absorbed ? "absorbed" : "passes through");
        } else if (reached > 1 || E >= 13.6) {
          var yTop = E >= 13.6 ? yOf(13.6) : yOf(H.E(reached) - H.E(1));
          arrow(110, BOT, yTop, "electron-line");
          if (yE < yTop - 6) {
            arrow(170, yTop, yE, "guide");
            label(164, yE + 4, "kept as KE", "end");
          }
        } else {
          label(118, BOT - 40, "elastic: no loss");
        }
      }
      function update() {
        var E = parseFloat(range.value);
        var reached = 1;
        var absorbed = false;
        var o = function (k, t) { var e = $("[data-out='" + k + "']", box); if (e) e.textContent = t; };
        o("energy", (mode === "photon" ? "photon energy " : "electron KE ") + fmt(E, 1) + " eV");
        var msg;
        if (E >= 13.6) {
          msg = "Ionized: the atom loses its electron. " + (mode === "photon" ? "The freed electron leaves with " : "The two electrons share ") + fmt(E - 13.6, 1) + " eV of KE.";
        } else if (mode === "photon") {
          var hit = 0;
          var n;
          for (n = 2; n <= 6; n += 1) if (Math.abs(E - (H.E(n) - H.E(1))) < 0.06) hit = n;
          reached = hit || 1;
          absorbed = !!hit;
          msg = hit ? "Absorbed: the photon's energy matches n = 1 → " + hit + " exactly. The photon disappears."
            : "Not absorbed: the energy matches no gap from n = 1. The photon passes through.";
        } else {
          var top = 1;
          var n2;
          for (n2 = 2; n2 <= 6; n2 += 1) if (E >= H.E(n2) - H.E(1)) top = n2;
          reached = top;
          msg = top === 1 ? "No excitation: below 10.2 eV the collision is elastic and the electron keeps its KE."
            : "Can excite up to n = " + top + ". If it goes to n = " + top + ", the electron keeps " + fmt(E - (H.E(top) - H.E(1)), 1) + " eV of KE.";
        }
        if (E >= 13.6) absorbed = true;
        o("result", msg);
        draw(E, reached, absorbed);
        $all("[data-excite-mode]", box).forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-excite-mode") === mode)); });
      }
      range.addEventListener("input", update);
      $all("[data-excite-mode]", box).forEach(function (b) {
        b.addEventListener("click", function () { mode = b.getAttribute("data-excite-mode"); update(); });
      });
      update();
    });
  }

  /* ---------- 3.2 Rayleigh criterion ---------- */

  /* Bessel J1 by its power series: plenty for |x| < 12. */
  function j1(x) {
    var sum = 0;
    var term = x / 2;
    var k;
    for (k = 0; k < 30; k += 1) {
      sum += term;
      term *= -(x * x / 4) / ((k + 1) * (k + 2));
    }
    return sum;
  }
  function airy(u) {
    if (Math.abs(u) < 1e-6) return 1;
    var v = 2 * j1(u) / u;
    return v * v;
  }

  function initRayleigh() {
    $all("[data-rayleigh]").forEach(function (box) {
      var svg = $("svg", box);
      var range = $("input[type='range']", box);
      if (!svg || !range) return;
      var X0 = 30;
      var X1 = 450;
      var Y0 = 200;
      var Y1 = 30;
      var FIRST_ZERO = 3.8317;
      el("line", { x1: X0, y1: Y0, x2: X1, y2: Y0, "class": "axis" }, svg);
      var layer = el("g", {}, svg);
      function update() {
        var s = parseFloat(range.value);
        clear(layer);
        var span = 3.2;
        var pa = [];
        var pb = [];
        var pt = [];
        var maxT = 0;
        var i;
        var samples = [];
        for (i = 0; i <= 220; i += 1) {
          var th = -span + i / 220 * 2 * span;
          var a = airy((th + s / 2) * FIRST_ZERO);
          var b = airy((th - s / 2) * FIRST_ZERO);
          samples.push([th, a, b]);
          if (a + b > maxT) maxT = a + b;
        }
        var scale = Math.max(maxT, 1.0);
        samples.forEach(function (q) {
          var x = X0 + (q[0] + span) / (2 * span) * (X1 - X0);
          pa.push(fmt(x, 1) + "," + fmt(Y0 - q[1] / scale * (Y0 - Y1), 1));
          pb.push(fmt(x, 1) + "," + fmt(Y0 - q[2] / scale * (Y0 - Y1), 1));
          pt.push(fmt(x, 1) + "," + fmt(Y0 - (q[1] + q[2]) / scale * (Y0 - Y1), 1));
        });
        el("polyline", { points: pa.join(" "), "class": "guide" }, layer);
        el("polyline", { points: pb.join(" "), "class": "guide" }, layer);
        el("polyline", { points: pt.join(" "), "class": "curve" }, layer);
        var verdict;
        if (s < 0.97) verdict = "Not resolved: the two images merge into one blur.";
        else if (s <= 1.03) verdict = "Just resolved: the peak of one image sits on the first dark ring of the other.";
        else verdict = "Resolved: two separate peaks with a clear dip between them.";
        var o = function (k, t) { var e = $("[data-out='" + k + "']", box); if (e) e.textContent = t; };
        o("sep", "separation = " + fmt(s, 2) + " × θₘᵢₙ");
        o("verdict", verdict);
      }
      range.addEventListener("input", update);
      update();
    });
  }

  /* ---------- 3.1 electron diffraction, 3.2 STM, 3.3 cubes ---------- */

  function initDiffraction() {
    $all("[data-diffraction]").forEach(function (box) {
      var range = $("input[type='range']", box);
      if (!range || !window.NotesDeBroglie) return;
      function update() {
        var kV = parseFloat(range.value);
        var lam = window.NotesDeBroglie.lambdaPm(kV);
        var o = function (k, t) { var e = $("[data-out='" + k + "']", box); if (e) e.textContent = t; };
        o("kV", fmt(kV, 1) + " kV");
        o("lambda", "λ = " + fmt(lam, 1) + " pm");
        var sc = scene("diffraction");
        if (sc) sc.set({ kV: kV });
      }
      range.addEventListener("input", update);
      update();
      document.addEventListener("notes-scenes-ready", update);
    });
  }

  function initStm() {
    $all("[data-stm]").forEach(function (box) {
      var btns = $all("[data-stm-mode]", box);
      function pick(mode) {
        btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-stm-mode") === mode)); });
        var o = $("[data-out='mode']", box);
        if (o) o.textContent = mode === "height" ? "tip at fixed height; the current rises over each atom" : "current held fixed; the tip rises over each atom";
        var sc = scene("stm");
        if (sc) sc.set({ mode: mode });
      }
      btns.forEach(function (b) { b.addEventListener("click", function () { pick(b.getAttribute("data-stm-mode")); }); });
      pick("height");
    });
  }

  function initCubes() {
    $all("[data-cubes]").forEach(function (box) {
      var range = $("input[type='range']", box);
      if (!range) return;
      function update() {
        var k = parseInt(range.value, 10);
        var o = function (key, t) { var e = $("[data-out='" + key + "']", box); if (e) e.textContent = t; };
        o("k", "each edge cut into " + k);
        o("n", k * k * k + " cube" + (k === 1 ? "" : "s"));
        o("area", "total surface area " + 6 * k + " cm²");
        o("ratio", "surface area ÷ volume = " + 6 * k + " cm⁻¹");
        var sc = scene("cubes");
        if (sc) sc.set({ k: k });
      }
      range.addEventListener("input", update);
      update();
      document.addEventListener("notes-scenes-ready", update);
    });
  }

  function boot() {
    initIdeaNav();
    initPhotocell();
    initLevels();
    initExcite();
    initRayleigh();
    initDiffraction();
    initStm();
    initCubes();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
