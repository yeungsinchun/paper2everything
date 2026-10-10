/* Book 7 scenes: shared three.js renderers for every Book 7 chapter.

   Markup contract (same as Books 4 and 5):
     figure.fig > .visual.play.stage[data-scene="<name>"][data-autoplay]
       > canvas.scene-canvas[aria-label] + span.hud-label[data-hud] ... + p.stage-fallback

   Engine rules (PRD 6.5):
   - fixed orthographic camera, no orbit, no zoom; flat figure palette read from
     the design-system tokens on :root, so a scene never invents a colour;
   - a scene runs only while it is on screen; a finite clip stops on a settled
     frame and offers Replay; a loop has no Replay;
   - prefers-reduced-motion renders one settled frame and never loops;
   - printing renders the settled frame;
   - without WebGL the stage shows its description (.stage-fallback).

   Interactive scenes expose a small API on window.NotesScenes[<name>]; the
   controls that drive them live in notes.js. */
(function (global) {
  "use strict";

  var THREE = global.THREE;
  var api = {};
  var reduced = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- tokens ---------- */

  var tokenCache = {};
  function tok(name, fallback) {
    if (tokenCache[name]) return tokenCache[name];
    var v = "";
    try {
      v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    } catch (err) { v = ""; }
    tokenCache[name] = v || fallback;
    return tokenCache[name];
  }
  function col(name, fallback) { return new THREE.Color(tok(name, fallback)); }

  /* Colour of visible light of wavelength nm (data, not decoration); ultraviolet
     and infrared fall back to the figure ink so they still read on white. */
  function spectralHex(nm) {
    var r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm >= 440 && nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm >= 490 && nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm >= 580 && nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm >= 645 && nm <= 750) { r = 1; }
    else return null;
    /* darken so thin strokes keep contrast on white */
    var k = 0.82;
    return "rgb(" + Math.round(r * 255 * k) + "," + Math.round(g * 235 * k) + "," + Math.round(b * 255 * k) + ")";
  }
  global.NotesSpectral = spectralHex;

  /* ---------- deterministic random numbers (settled frames never flicker) ---------- */

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- stage ---------- */

  function stage(host, fit) {
    var canvas = host.querySelector("canvas.scene-canvas");
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    } catch (err) {
      return null;
    }
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.setClearColor(new THREE.Color(tok("--fig-bg", "#ffffff")), 1);
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-7, 7, 3.5, -3.5, 0.1, 100);
    if (fit && fit.iso) {
      camera.position.set(9, 7, 11);
    } else {
      camera.position.set(0, 0, 20);
    }
    camera.lookAt(0, 0, 0);
    var halfW = (fit && fit.halfW) || 7;
    var halfH = (fit && fit.halfH) || 3.5;
    var cx = (fit && fit.cx) || 0;
    var cy = (fit && fit.cy) || 0;
    function resize() {
      var w = canvas.clientWidth || canvas.width;
      var h = canvas.clientHeight || canvas.height;
      renderer.setSize(w, h, false);
      var aspect = w / Math.max(h, 1);
      var hh = halfH;
      var hw = halfW;
      if (aspect >= halfW / halfH) hw = hh * aspect;
      else hh = hw / aspect;
      camera.left = cx - hw;
      camera.right = cx + hw;
      camera.top = cy + hh;
      camera.bottom = cy - hh;
      camera.updateProjectionMatrix();
    }
    resize();
    return { host: host, canvas: canvas, renderer: renderer, scene: scene, camera: camera, resize: resize };
  }

  function placeHud(el, gfx, x, y, z) {
    if (!el) return;
    var v = new THREE.Vector3(x, y, z || 0).project(gfx.camera);
    var c = gfx.canvas;
    el.style.left = ((v.x * 0.5 + 0.5) * (c.clientWidth || 1) + (c.offsetLeft || 0)) + "px";
    el.style.top = ((-v.y * 0.5 + 0.5) * (c.clientHeight || 1) + (c.offsetTop || 0)) + "px";
  }

  /* ---------- flat 2D drawing helpers (z = layer) ---------- */

  function basic(color, opacity) {
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: opacity != null && opacity < 1,
      opacity: opacity == null ? 1 : opacity,
      depthTest: false
    });
  }

  function disc(r, color, z, opacity) {
    var m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), basic(color, opacity));
    m.position.z = z || 0;
    m.renderOrder = Math.round((z || 0) * 10);
    return m;
  }

  function ringMesh(r, w, color, z, opacity) {
    var m = new THREE.Mesh(new THREE.RingGeometry(Math.max(0.001, r - w / 2), r + w / 2, 96), basic(color, opacity));
    m.position.z = z || 0;
    m.renderOrder = Math.round((z || 0) * 10);
    return m;
  }

  function rect(x0, y0, x1, y1, color, z, opacity) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0)), basic(color, opacity));
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, z || 0);
    m.renderOrder = Math.round((z || 0) * 10);
    return m;
  }

  function seg(ax, ay, bx, by, w, color, z, opacity) {
    var dx = bx - ax;
    var dy = by - ay;
    var len = Math.sqrt(dx * dx + dy * dy) || 0.0001;
    var m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), basic(color, opacity));
    m.position.set((ax + bx) / 2, (ay + by) / 2, z || 0);
    m.rotation.z = Math.atan2(dy, dx);
    m.renderOrder = Math.round((z || 0) * 10);
    return m;
  }

  function polyline(points, w, color, z, opacity, closed) {
    var g = new THREE.Group();
    var n = points.length;
    var i;
    for (i = 0; i < n - 1 + (closed ? 1 : 0); i += 1) {
      var a = points[i];
      var b = points[(i + 1) % n];
      g.add(seg(a[0], a[1], b[0], b[1], w, color, z, opacity));
    }
    for (i = 0; i < n; i += 1) {
      var j = disc(w / 2, color, z, opacity);
      j.position.x = points[i][0];
      j.position.y = points[i][1];
      g.add(j);
    }
    return g;
  }

  function head(size, color, z, opacity) {
    var s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(-size, size * 0.5);
    s.lineTo(-size, -size * 0.5);
    s.lineTo(0, 0);
    var m = new THREE.Mesh(new THREE.ShapeGeometry(s), basic(color, opacity));
    m.position.z = z || 0;
    m.renderOrder = Math.round((z || 0) * 10);
    return m;
  }

  function arrow(ax, ay, bx, by, w, color, z) {
    var g = new THREE.Group();
    var ang = Math.atan2(by - ay, bx - ax);
    var hs = Math.max(0.22, w * 4);
    g.add(seg(ax, ay, bx - Math.cos(ang) * hs * 0.8, by - Math.sin(ang) * hs * 0.8, w, color, z));
    var h = head(hs, color, z);
    h.position.x = bx;
    h.position.y = by;
    h.rotation.z = ang;
    g.add(h);
    return g;
  }

  /* A photon glyph: a short wavy arrow along +x from (0,0), length len. Move it
     with position and rotation. */
  function photonGlyph(len, amp, waves, w, color, z) {
    var g = new THREE.Group();
    var pts = [];
    var n = 36;
    var body = len - 0.28;
    var i;
    for (i = 0; i <= n; i += 1) {
      var s = i / n;
      pts.push([s * body, amp * Math.sin(s * waves * Math.PI * 2)]);
    }
    g.add(polyline(pts, w, color, z));
    var h = head(0.3, color, z);
    h.position.x = len;
    g.add(h);
    g.userData.setColor = function (c) {
      g.traverse(function (o) { if (o.material) o.material.color.set(c); });
    };
    return g;
  }

  function disposeGroup(g) {
    g.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }

  /* ---------- engine ---------- */

  /* A scene object: { reset(), step(dt), draw(), duration?: s (finite clip),
     settleT?: s (frame used for print and reduced motion) }. */
  function run(host, gfx, sc) {
    var t = 0;
    var playing = false;
    var visible = false;
    var last = 0;
    var started = false;
    var finite = !!sc.duration;

    function render() {
      sc.draw();
      gfx.renderer.render(gfx.scene, gfx.camera);
    }

    function simulateTo(T) {
      sc.reset();
      t = 0;
      var dt = 1 / 60;
      while (t + dt <= T) { sc.step(dt); t += dt; }
    }

    function settle() {
      simulateTo(sc.settleT != null ? sc.settleT : (sc.duration || 3));
      render();
    }

    function frame(now) {
      if (!playing) return;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (finite && t + dt >= sc.duration) {
        dt = Math.max(0, sc.duration - t);
        sc.step(dt);
        t = sc.duration;
        render();
        playing = false;
        return;
      }
      sc.step(dt);
      t += dt;
      render();
      global.requestAnimationFrame(frame);
    }

    function play() {
      if (reduced) { settle(); return; }
      if (playing) return;
      if (finite && t >= sc.duration) { render(); return; }
      playing = true;
      last = performance.now();
      global.requestAnimationFrame(frame);
    }

    function pause() { playing = false; }

    function replay() {
      pause();
      sc.reset();
      t = 0;
      if (reduced) { settle(); return; }
      render();
      play();
    }

    /* Start on the settled frame so the box is never blank before it scrolls in. */
    settle();

    var replayBtn = host.querySelector("[data-replay]");
    if (replayBtn) replayBtn.addEventListener("click", replay);

    host.addEventListener("notes-render", function () { if (!playing) render(); });

    if (typeof IntersectionObserver === "function") {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible) {
            if (!started) {
              started = true;
              if (finite) { replay(); return; }
              sc.reset();
              t = 0;
            }
            play();
          } else {
            pause();
          }
        });
      }, { threshold: 0.35 });
      io.observe(host);
    } else {
      started = true;
      play();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause();
      else if (visible) play();
    });
    global.addEventListener("beforeprint", function () { pause(); settle(); });
    global.addEventListener("resize", function () { gfx.resize(); render(); });

    return { render: render, replay: replay };
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll(".stage[data-scene]"), function (host) {
      var name = host.getAttribute("data-scene");
      var build = builders[name];
      if (!build) return;
      function fallback() {
        host.classList.add("no-webgl");
        if (!host.querySelector(".stage-fallback")) {
          var p = document.createElement("p");
          p.className = "stage-fallback";
          var c = host.querySelector("canvas");
          p.textContent = c ? c.getAttribute("aria-label") : "";
          host.appendChild(p);
        }
      }
      if (!THREE) { fallback(); return; }
      try {
        var made = build(host);
        if (!made) { fallback(); return; }
        var ctl = run(host, made.gfx, made.scene);
        if (made.api) {
          made.api.render = ctl.render;
          api[name] = made.api;
        }
      } catch (err) {
        fallback();
        if (global.console) global.console.error("Book 7 scene failed:", name, err);
      }
    });
    document.dispatchEvent(new CustomEvent("notes-scenes-ready"));
  }

  var builders = {};

  /* =================================================================
     1.1 A  Light in, electrons out (loop)
     Photons fall on a metal surface; each absorbed photon frees one electron.
     ================================================================= */
  builders.photoemission = function (host) {
    var gfx = stage(host, { halfW: 6.6, halfH: 3.3 });
    if (!gfx) return null;
    var S = gfx.scene;
    var ink = col("--fig-ink", "#17212B");
    var photonC = col("--fig-energy", "#C89A10");
    var eC = col("--fig-electron", "#2A62A8");
    S.add(rect(-6.8, -3.4, 6.8, -1.6, col("--al", "#c5ccd4"), 0));
    S.add(seg(-6.8, -1.6, 6.8, -1.6, 0.06, ink, 0.1));
    var photons = [];
    var electrons = [];
    var i;
    for (i = 0; i < 8; i += 1) {
      var p = photonGlyph(1.5, 0.13, 2.5, 0.06, photonC, 1);
      p.visible = false;
      S.add(p);
      photons.push({ g: p, on: false });
    }
    for (i = 0; i < 12; i += 1) {
      var e = disc(0.15, eC, 2);
      e.visible = false;
      S.add(e);
      electrons.push({ g: e, on: false, x: 0, y: 0, vx: 0, vy: 0 });
    }
    var dir = new THREE.Vector2(0.62, -1).normalize();
    var ang = Math.atan2(dir.y, dir.x);
    var R, clock, nextSpawn;
    var hudLight = host.querySelector('[data-hud="light"]');
    var hudMetal = host.querySelector('[data-hud="metal"]');
    var hudE = host.querySelector('[data-hud="electrons"]');

    function spawnPhoton() {
      var slot = photons.find(function (p) { return !p.on; });
      if (!slot) return;
      var tx = -4.8 + R() * 8.6;
      slot.on = true;
      slot.tx = tx;
      slot.d = 6.2;
      slot.g.visible = true;
      slot.g.rotation.z = ang;
    }
    function spawnElectron(x) {
      var slot = electrons.find(function (e) { return !e.on; });
      if (!slot) return;
      var a = (55 + R() * 60) * Math.PI / 180;
      var sp = 1.6 + R() * 1.6;
      slot.on = true;
      slot.x = x;
      slot.y = -1.45;
      slot.vx = Math.cos(a) * sp;
      slot.vy = Math.sin(a) * sp;
      slot.g.visible = true;
    }
    return {
      gfx: gfx,
      scene: {
        settleT: 3.4,
        reset: function () {
          R = rng(7);
          clock = 0;
          nextSpawn = 0;
          photons.forEach(function (p) { p.on = false; p.g.visible = false; });
          electrons.forEach(function (e) { e.on = false; e.g.visible = false; });
        },
        step: function (dt) {
          clock += dt;
          if (clock >= nextSpawn) { spawnPhoton(); nextSpawn = clock + 0.42; }
          photons.forEach(function (p) {
            if (!p.on) return;
            p.d -= 4.2 * dt;
            if (p.d <= 0) {
              p.on = false;
              p.g.visible = false;
              spawnElectron(p.tx);
              return;
            }
            var tipX = p.tx - dir.x * p.d;
            var tipY = -1.6 - dir.y * p.d;
            p.g.position.set(tipX - Math.cos(ang) * 1.5, tipY - Math.sin(ang) * 1.5, 1);
          });
          electrons.forEach(function (e) {
            if (!e.on) return;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            if (e.y > 3.8 || e.x > 7.6 || e.x < -7.6) { e.on = false; e.g.visible = false; }
            e.g.position.set(e.x, e.y, 2);
          });
        },
        draw: function () {
          placeHud(hudLight, gfx, -4.9, 2.7);
          placeHud(hudMetal, gfx, 0, -2.5);
          placeHud(hudE, gfx, 4.6, 2.7);
        }
      }
    };
  };

  /* =================================================================
     1.1 B  Photocell (interactive loop)
     Cathode (left) and anode (right) in an evacuated tube. Frequency, intensity,
     voltage and metal are set from notes.js; the I-V model is shared with the
     graph through NotesPhotocell.
     ================================================================= */
  var PC = {
    h: 6.63e-34,
    e: 1.60e-19,
    metals: { caesium: 2.1, sodium: 2.3, zinc: 4.3 },
    /* fraction of emitted electrons that reach the anode at voltage V (volts) */
    collect: function (V) { return V >= 0 ? 1 - 0.12 * Math.exp(-V / 0.35) : 0.88; },
    fractionAbove: function (V, Kmax) {
      if (V >= 0) return 1;
      if (Kmax <= 0) return 0;
      var u = -V / Kmax;
      return u >= 1 ? 0 : Math.pow(1 - u, 1.6);
    },
    photonEV: function (f14) { return PC.h * f14 * 1e14 / PC.e; },
    state: function (p) {
      var E = PC.photonEV(p.f);
      var phi = PC.metals[p.metal];
      var Kmax = E - phi;
      var emits = Kmax > 0;
      var Isat = 0.2 * p.intensity;
      var I = emits ? Isat * PC.collect(p.V) * PC.fractionAbove(p.V, Kmax) : 0;
      return { E: E, phi: phi, Kmax: Math.max(0, Kmax), emits: emits, Vs: Math.max(0, Kmax), Isat: emits ? Isat : 0, I: I };
    }
  };
  global.NotesPhotocell = PC;

  builders.photocell = function (host) {
    var gfx = stage(host, { halfW: 6.6, halfH: 3.2 });
    if (!gfx) return null;
    var S = gfx.scene;
    var ink = col("--fig-ink", "#17212B");
    var guide = col("--fig-guide", "#B9B2A1");
    var eC = col("--fig-electron", "#2A62A8");
    var X_C = -4.0;
    var X_A = 4.4;
    var tube = [];
    var k;
    for (k = 0; k <= 48; k += 1) {
      var th = k / 48 * Math.PI * 2;
      tube.push([6.0 * Math.cos(th), 2.75 * Math.sin(th)]);
    }
    S.add(polyline(tube, 0.05, guide, 0, 1, true));
    S.add(rect(X_C - 0.42, -1.8, X_C, 1.8, col("--al", "#c5ccd4"), 0.5));
    S.add(polyline([[X_C - 0.42, -1.8], [X_C, -1.8], [X_C, 1.8], [X_C - 0.42, 1.8]], 0.05, ink, 0.6, 1, true));
    S.add(seg(X_A, -1.5, X_A, 1.5, 0.16, ink, 0.6));
    var photons = [];
    var electrons = [];
    var i;
    for (i = 0; i < 7; i += 1) {
      var p = photonGlyph(1.4, 0.12, 2.5, 0.06, col("--fig-energy", "#C89A10"), 1);
      p.visible = false;
      S.add(p);
      photons.push({ g: p, on: false });
    }
    for (i = 0; i < 40; i += 1) {
      var e = disc(0.13, eC, 2);
      e.visible = false;
      S.add(e);
      electrons.push({ g: e, on: false });
    }
    var hud = {
      light: host.querySelector('[data-hud="light"]'),
      cathode: host.querySelector('[data-hud="cathode"]'),
      anode: host.querySelector('[data-hud="anode"]'),
      none: host.querySelector('[data-hud="none"]')
    };
    var params = { f: 7.0, intensity: 3, V: 1.0, metal: "sodium" };
    var dir = new THREE.Vector2(-1, -0.75).normalize();
    var ang = Math.atan2(dir.y, dir.x);
    var R, clock, nextPhoton, nextElectron;

    function photonColor() {
      var nm = 3e8 / (params.f * 1e14) * 1e9;
      return spectralHex(nm) || tok("--fig-displacement", "#7A4FC2");
    }
    function paintPhotons() {
      var c = new THREE.Color(photonColor());
      photons.forEach(function (p) { p.g.userData.setColor(c); });
    }

    function spawnPhoton() {
      var slot = photons.find(function (p) { return !p.on; });
      if (!slot) return;
      slot.on = true;
      slot.ty = -1.4 + R() * 2.8;
      slot.d = 5.0;
      slot.g.visible = true;
      slot.g.rotation.z = ang;
    }
    function spawnElectron(y) {
      var st = PC.state(params);
      if (!st.emits) return;
      var slot = electrons.find(function (e) { return !e.on; });
      if (!slot) return;
      /* KE drawn so that the share with K > u is (1 - u/Kmax)^1.6, matching the graph */
      var K0 = st.Kmax * (1 - Math.pow(R(), 1 / 1.6));
      slot.on = true;
      slot.K0 = K0;
      slot.x = X_C;
      slot.y = y;
      slot.s = 1;
      slot.miss = R() > PC.collect(params.V);
      slot.vy = slot.miss ? (y > 0 ? 1 : -1) * (1.2 + R()) : (R() - 0.5) * 0.25;
      slot.g.visible = true;
    }

    return {
      gfx: gfx,
      api: {
        set: function (next) {
          var k2;
          for (k2 in next) if (Object.prototype.hasOwnProperty.call(next, k2)) params[k2] = next[k2];
          paintPhotons();
          host.dispatchEvent(new Event("notes-render"));
        },
        get: function () { return Object.assign({}, params); }
      },
      scene: {
        settleT: 4,
        reset: function () {
          R = rng(11);
          clock = 0;
          nextPhoton = 0;
          nextElectron = 0;
          paintPhotons();
          photons.forEach(function (p) { p.on = false; p.g.visible = false; });
          electrons.forEach(function (e) { e.on = false; e.g.visible = false; });
        },
        step: function (dt) {
          clock += dt;
          var period = 0.9 / params.intensity;
          if (clock >= nextPhoton) { spawnPhoton(); nextPhoton = clock + period; }
          photons.forEach(function (p) {
            if (!p.on) return;
            p.d -= 4.5 * dt;
            if (p.d <= 0) {
              p.on = false;
              p.g.visible = false;
              spawnElectron(p.ty);
              return;
            }
            var tipX = X_C + 0.02 - dir.x * p.d;
            var tipY = p.ty - dir.y * p.d;
            p.g.position.set(tipX - Math.cos(ang) * 1.4, tipY - Math.sin(ang) * 1.4, 1);
          });
          var gap = X_A - X_C;
          electrons.forEach(function (e) {
            if (!e.on) return;
            var K = e.K0 + params.V * (e.x - X_C) / gap;
            if (K <= 0.0 && e.s > 0) e.s = -1;
            var v = 1.1 + 2.0 * Math.sqrt(Math.max(K, 0.04));
            e.x += e.s * v * dt;
            e.y += e.vy * dt;
            if (e.x >= X_A || e.x <= X_C - 0.05 || Math.abs(e.y) > 2.4) { e.on = false; e.g.visible = false; }
            e.g.position.set(e.x, e.y, 2);
          });
        },
        draw: function () {
          var st = PC.state(params);
          placeHud(hud.light, gfx, -0.4, 2.15);
          placeHud(hud.cathode, gfx, X_C - 0.2, -2.25);
          placeHud(hud.anode, gfx, X_A, -2.0);
          if (hud.none) {
            hud.none.hidden = st.emits;
            placeHud(hud.none, gfx, 0.6, 0);
          }
        }
      }
    };
  };

  /* =================================================================
     2.1 B  α scattering: plum-pudding prediction and nuclear-atom result (loops)
     ================================================================= */
  function scatterScene(host, nuclear) {
    var gfx = stage(host, { halfW: 6.2, halfH: 3.2 });
    if (!gfx) return null;
    var S = gfx.scene;
    var aC = col("--fig-alpha", "#C0392B");
    var guide = col("--fig-guide", "#B9B2A1");
    var hudSrc = host.querySelector('[data-hud="source"]');
    var hudT = host.querySelector('[data-hud="target"]');
    var hudBack = host.querySelector('[data-hud="back"]');
    var paths = [];
    var bs = nuclear ? [-2.7, -2.1, -1.5, -0.95, -0.5, -0.18, 0, 0.12, 0.42, 0.85, 1.4, 2.0, 2.6] :
      [-2.6, -2.0, -1.4, -0.85, -0.3, 0.25, 0.8, 1.35, 1.9, 2.5];
    if (nuclear) {
      S.add(disc(0.2, col("--fig-proton", "#C0392B"), 1));
      S.add(ringMesh(0.2, 0.05, col("--fig-ink", "#17212B"), 1.1));
    } else {
      var soft = col("--fig-proton", "#C0392B");
      [-0.95, 0.95].forEach(function (x) {
        [-2.2, 0, 2.2].forEach(function (y) {
          var d = disc(1.08, soft, 0, 0.12);
          d.position.set(x, y, 0);
          S.add(d);
          var e1 = disc(0.1, col("--fig-electron", "#2A62A8"), 0.5);
          e1.position.set(x + 0.4, y + 0.3, 0.5);
          S.add(e1);
          var e2 = disc(0.1, col("--fig-electron", "#2A62A8"), 0.5);
          e2.position.set(x - 0.35, y - 0.4, 0.5);
          S.add(e2);
        });
      });
    }
    /* Coulomb repulsion from a point nucleus at the origin, integrated once. */
    bs.forEach(function (b) {
      var pts = [];
      var x = -6.4;
      var y = b;
      var vx = 3.2;
      var vy = 0;
      var kq = nuclear ? 2.6 : 0.0;
      var dt = 0.004;
      var n;
      for (n = 0; n < 6000; n += 1) {
        var r2 = x * x + y * y;
        var r = Math.sqrt(r2);
        var ax = 0;
        var ay = 0;
        if (nuclear) {
          ax = kq * x / (r2 * r);
          ay = kq * y / (r2 * r);
        } else {
          /* spread-out positive charge: tiny nudges only */
          ax = 0.06 * Math.sin(y * 3.1) * Math.exp(-x * x / 4);
          ay = 0.06 * Math.cos(x * 2.7) * Math.exp(-x * x / 4);
        }
        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;
        if (n % 6 === 0) pts.push([x, y]);
        if (Math.abs(x) > 6.6 || Math.abs(y) > 3.6) break;
      }
      var trail = polyline(pts, 0.035, guide, 0.2, 0.9);
      trail.visible = false;
      S.add(trail);
      var dot = disc(0.14, aC, 2);
      dot.visible = false;
      S.add(dot);
      paths.push({ pts: pts, trail: trail, dot: dot });
    });
    var clock;
    var order = paths.map(function (p, i) { return i; });
    return {
      gfx: gfx,
      scene: {
        settleT: 14,
        reset: function () {
          clock = 0;
          paths.forEach(function (p) { p.trail.visible = false; p.dot.visible = false; });
        },
        step: function (dt) {
          clock += dt;
          var cycle = order.length * 1.1 + 1.5;
          var tc = clock % cycle;
          if (tc < dt) paths.forEach(function (p) { p.trail.visible = false; });
          order.forEach(function (idx, k) {
            var p = paths[idx];
            var start = k * 1.1;
            var life = 2.4;
            var u = (tc - start) / life;
            if (u < 0) { p.dot.visible = false; return; }
            p.trail.visible = true;
            if (u > 1) { p.dot.visible = false; return; }
            var j = Math.min(p.pts.length - 1, Math.floor(u * (p.pts.length - 1)));
            p.dot.visible = true;
            p.dot.position.set(p.pts[j][0], p.pts[j][1], 2);
          });
        },
        draw: function () {
          placeHud(hudSrc, gfx, -5.0, 2.95);
          placeHud(hudT, gfx, nuclear ? 0 : 0, nuclear ? -0.6 : -3.0);
          if (hudBack) placeHud(hudBack, gfx, -3.6, 0.55);
        }
      }
    };
  }
  builders["scatter-pudding"] = function (host) { return scatterScene(host, false); };
  builders["scatter-nucleus"] = function (host) { return scatterScene(host, true); };

  /* =================================================================
     2.1 C  Classical prediction: an orbiting electron radiates and spirals in
     (finite clip, Replay)
     ================================================================= */
  builders.spiral = function (host) {
    var gfx = stage(host, { halfW: 6.4, halfH: 3.3 });
    if (!gfx) return null;
    var S = gfx.scene;
    S.add(disc(0.24, col("--fig-proton", "#C0392B"), 1));
    var eDot = disc(0.17, col("--fig-electron", "#2A62A8"), 3);
    S.add(eDot);
    var trailPts = [];
    var trail = null;
    var photons = [];
    var i;
    for (i = 0; i < 9; i += 1) {
      var p = photonGlyph(1.2, 0.11, 2.5, 0.05, col("--fig-energy", "#C89A10"), 2);
      p.visible = false;
      S.add(p);
      photons.push({ g: p, on: false });
    }
    var hudE = host.querySelector('[data-hud="electron"]');
    var hudN = host.querySelector('[data-hud="nucleus"]');
    var hudR = host.querySelector('[data-hud="radiation"]');
    var clock, theta, nextP;
    var DUR = 6.5;
    function radius(t) { return 0.3 + 2.6 * Math.pow(Math.max(0, 1 - t / 6.0), 0.65); }
    function rebuildTrail() {
      if (trail) { S.remove(trail); disposeGroup(trail); }
      trail = polyline(trailPts, 0.04, col("--fig-guide", "#B9B2A1"), 0.5);
      S.add(trail);
    }
    return {
      gfx: gfx,
      scene: {
        duration: DUR,
        reset: function () {
          clock = 0;
          theta = 0;
          nextP = 0.3;
          trailPts = [];
          rebuildTrail();
          photons.forEach(function (p) { p.on = false; p.g.visible = false; });
        },
        step: function (dt) {
          clock += dt;
          var r = radius(clock);
          theta += dt * 2.4 / Math.pow(r, 1.5);
          var x = r * Math.cos(theta);
          var y = r * Math.sin(theta);
          if (clock < 6.0) {
            trailPts.push([x, y]);
            if (trailPts.length % 4 === 0) rebuildTrail();
          }
          eDot.visible = clock < 6.0;
          eDot.position.set(x, y, 3);
          if (clock >= nextP && clock < 6.0) {
            var slot = photons.find(function (q) { return !q.on; });
            if (slot) {
              slot.on = true;
              slot.x = x;
              slot.y = y;
              slot.a = Math.atan2(y, x);
              slot.d = 0;
              slot.g.visible = true;
              slot.g.rotation.z = slot.a;
            }
            nextP = clock + 0.55;
          }
          photons.forEach(function (q) {
            if (!q.on) return;
            q.d += 2.6 * dt;
            q.g.position.set(q.x + Math.cos(q.a) * q.d, q.y + Math.sin(q.a) * q.d, 2);
            if (q.d > 5) { q.on = false; q.g.visible = false; }
          });
        },
        draw: function () {
          placeHud(hudN, gfx, 0, -0.62);
          placeHud(hudE, gfx, -4.6, 2.6);
          placeHud(hudR, gfx, 4.4, 2.6);
        }
      }
    };
  };

  /* =================================================================
     2.3 A  Bohr atom: electron drops from n = 3 to n = 2 and emits one photon
     (finite clip, Replay)
     ================================================================= */
  builders["bohr-jump"] = function (host) {
    var gfx = stage(host, { halfW: 6.4, halfH: 3.35 });
    if (!gfx) return null;
    var S = gfx.scene;
    var guide = col("--fig-guide", "#B9B2A1");
    var R1 = 0.36;
    [1, 2, 3].forEach(function (n) { S.add(ringMesh(R1 * n * n, 0.04, guide, 0)); });
    S.add(disc(0.16, col("--fig-proton", "#C0392B"), 1));
    var eDot = disc(0.17, col("--fig-electron", "#2A62A8"), 3);
    S.add(eDot);
    var ph = photonGlyph(1.6, 0.15, 3, 0.07, new THREE.Color(spectralHex(656) || "#c0392b"), 2);
    ph.visible = false;
    S.add(ph);
    var hud = {
      n1: host.querySelector('[data-hud="n1"]'),
      n2: host.querySelector('[data-hud="n2"]'),
      n3: host.querySelector('[data-hud="n3"]'),
      photon: host.querySelector('[data-hud="photon"]')
    };
    var clock, theta, phase;
    var T_JUMP = 2.6;
    var T_LAND = 3.1;
    /* end while the photon is still in the box, so the settled frame shows it */
    var DUR = 3.9;
    return {
      gfx: gfx,
      scene: {
        duration: DUR,
        reset: function () { clock = 0; theta = 2.2; phase = 0; ph.visible = false; },
        step: function (dt) {
          clock += dt;
          var r;
          if (clock < T_JUMP) {
            r = R1 * 9;
            theta += dt * 0.55;
          } else if (clock < T_LAND) {
            var u = (clock - T_JUMP) / (T_LAND - T_JUMP);
            r = R1 * (9 - 5 * u);
            theta += dt * (0.55 + 1.3 * u);
          } else {
            r = R1 * 4;
            theta += dt * 1.85;
          }
          eDot.position.set(r * Math.cos(theta), r * Math.sin(theta), 3);
          if (clock >= T_JUMP) {
            if (!ph.visible) { ph.visible = true; phase = theta; }
            var d = (clock - T_JUMP) * 2.2;
            var a = phase;
            ph.rotation.z = a;
            ph.position.set((R1 * 6.5 + d) * Math.cos(a), (R1 * 6.5 + d) * Math.sin(a), 2);
          }
        },
        draw: function () {
          placeHud(hud.n1, gfx, 0, -R1 - 0.32);
          placeHud(hud.n2, gfx, 0, -R1 * 4 - 0.32);
          placeHud(hud.n3, gfx, 0, -R1 * 9 + 0.32);
          if (hud.photon) {
            hud.photon.hidden = !ph.visible;
            var a = ph.rotation.z;
            placeHud(hud.photon, gfx, ph.position.x + Math.cos(a) * 0.8, ph.position.y + Math.sin(a) * 0.8 + 0.45);
          }
        }
      }
    };
  };

  /* =================================================================
     3.1 C  Electron diffraction through graphite (interactive loop)
     Left: side view of gun, foil and screen. Right: the screen face-on, where
     hits build up into rings whose size follows λ = h / sqrt(2 m e V).
     ================================================================= */
  var DB = {
    h: 6.63e-34, m: 9.11e-31, e: 1.60e-19,
    lambdaPm: function (kV) { return DB.h / Math.sqrt(2 * DB.m * DB.e * kV * 1000) * 1e12; }
  };
  global.NotesDeBroglie = DB;

  builders.diffraction = function (host) {
    var gfx = stage(host, { halfW: 6.6, halfH: 3.2 });
    if (!gfx) return null;
    var S = gfx.scene;
    var ink = col("--fig-ink", "#17212B");
    var guide = col("--fig-guide", "#B9B2A1");
    var eC = col("--fig-electron", "#2A62A8");
    /* side view */
    S.add(rect(-6.4, -0.45, -5.0, 0.45, col("--al", "#c5ccd4"), 0));
    S.add(polyline([[-6.4, -0.45], [-5.0, -0.45], [-5.0, 0.45], [-6.4, 0.45]], 0.05, ink, 0.1, 1, true));
    S.add(rect(-3.05, -0.9, -2.85, 0.9, col("--fig-displacement", "#7A4FC2"), 0.2, 0.7));
    S.add(seg(-0.6, -2.4, -0.6, 2.4, 0.1, ink, 0.2));
    var beam = seg(-5.0, 0, -2.95, 0, 0.05, guide, 0.1);
    S.add(beam);
    var cone = new THREE.Group();
    S.add(cone);
    /* face-on screen */
    var SX = 3.6;
    var face = disc(2.75, col("--line-soft", "#F0EBDF"), 0);
    face.position.x = SX;
    S.add(face);
    var rim = ringMesh(2.75, 0.05, ink, 0.1);
    rim.position.x = SX;
    S.add(rim);
    var pointsGeo = new THREE.BufferGeometry();
    var MAXP = 1600;
    var pos = new Float32Array(MAXP * 3);
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pointsGeo.setDrawRange(0, 0);
    var dots = new THREE.Points(pointsGeo, new THREE.PointsMaterial({ color: eC, size: 3, sizeAttenuation: false, depthTest: false }));
    dots.position.set(SX, 0, 0);
    dots.renderOrder = 30;
    S.add(dots);
    var flyers = [];
    var i;
    for (i = 0; i < 6; i += 1) {
      var d = disc(0.1, eC, 2);
      d.visible = false;
      S.add(d);
      flyers.push({ g: d, on: false });
    }
    var hud = {
      gun: host.querySelector('[data-hud="gun"]'),
      foil: host.querySelector('[data-hud="foil"]'),
      screen: host.querySelector('[data-hud="screen"]')
    };
    var params = { kV: 4 };
    var R, count, clock, nextFly;
    var RING = [1.0, 1.73];
    function ringScale() { return DB.lambdaPm(params.kV) / DB.lambdaPm(4) * 0.95; }
    function drawCone() {
      while (cone.children.length) { var c = cone.children.pop(); disposeGroup(c); }
      var s = ringScale();
      RING.forEach(function (r0) {
        var r = Math.min(2.6, r0 * s);
        cone.add(seg(-2.95, 0, -0.6, r * 0.85, 0.035, guide, 0.1));
        cone.add(seg(-2.95, 0, -0.6, -r * 0.85, 0.035, guide, 0.1));
      });
    }
    function addHit() {
      if (count >= MAXP) return;
      var s = ringScale();
      var r;
      var u = R();
      if (u < 0.12) r = 0.12 * R();
      else r = RING[u < 0.62 ? 0 : 1] * s + (R() - 0.5) * 0.16;
      if (r > 2.65) r = 0.12 * R();
      var a = R() * Math.PI * 2;
      pos[count * 3] = r * Math.cos(a);
      pos[count * 3 + 1] = r * Math.sin(a);
      pos[count * 3 + 2] = 0;
      count += 1;
      pointsGeo.setDrawRange(0, count);
      pointsGeo.attributes.position.needsUpdate = true;
    }
    return {
      gfx: gfx,
      api: {
        set: function (next) {
          if (next.kV != null) params.kV = next.kV;
          count = 0;
          pointsGeo.setDrawRange(0, 0);
          var k2;
          for (k2 = 0; k2 < 500; k2 += 1) addHit();
          drawCone();
          host.dispatchEvent(new Event("notes-render"));
        }
      },
      scene: {
        settleT: 6,
        reset: function () {
          R = rng(5);
          count = 0;
          clock = 0;
          nextFly = 0;
          pointsGeo.setDrawRange(0, 0);
          drawCone();
          flyers.forEach(function (f) { f.on = false; f.g.visible = false; });
        },
        step: function (dt) {
          clock += dt;
          var k2;
          for (k2 = 0; k2 < 3; k2 += 1) addHit();
          if (count >= MAXP) { count = 0; pointsGeo.setDrawRange(0, 0); }
          if (clock >= nextFly) {
            var f = flyers.find(function (q) { return !q.on; });
            if (f) { f.on = true; f.x = -5.0; f.g.visible = true; }
            nextFly = clock + 0.3;
          }
          flyers.forEach(function (q) {
            if (!q.on) return;
            q.x += 5 * dt;
            q.g.position.set(q.x, 0, 2);
            if (q.x > -2.95) { q.on = false; q.g.visible = false; }
          });
        },
        draw: function () {
          placeHud(hud.gun, gfx, -5.7, -0.95);
          placeHud(hud.foil, gfx, -2.95, -1.3);
          placeHud(hud.screen, gfx, SX, -3.0);
        }
      }
    };
  };

  /* =================================================================
     3.2 D  Scanning tunnelling microscope (interactive loop)
     Constant-height mode records the current; constant-current mode records
     the tip height. Both traces map the surface atoms.
     ================================================================= */
  builders.stm = function (host) {
    var gfx = stage(host, { halfW: 6.6, halfH: 3.3 });
    if (!gfx) return null;
    var S = gfx.scene;
    var ink = col("--fig-ink", "#17212B");
    var guide = col("--fig-guide", "#B9B2A1");
    var atomC = col("--fig-neutron", "#2F7A4A");
    var BASE = -2.2;
    var A_R = 0.42;
    var xs = [];
    var x;
    for (x = -5.6; x <= 5.7; x += 0.9) xs.push(x);
    xs.forEach(function (ax) {
      var a = disc(A_R, atomC, 0, 0.85);
      a.position.set(ax, BASE, 0);
      S.add(a);
    });
    function surface(px) {
      var best = BASE + A_R * 0.2;
      xs.forEach(function (ax) {
        var d = px - ax;
        if (Math.abs(d) < A_R) best = Math.max(best, BASE + Math.sqrt(A_R * A_R - d * d));
      });
      return best;
    }
    var tipShape = new THREE.Shape();
    tipShape.moveTo(0, 0);
    tipShape.lineTo(-0.32, 1.5);
    tipShape.lineTo(0.32, 1.5);
    tipShape.lineTo(0, 0);
    var tip = new THREE.Mesh(new THREE.ShapeGeometry(tipShape), basic(col("--fig-ink", "#17212B")));
    tip.renderOrder = 20;
    S.add(tip);
    var spark = seg(0, 0, 0, 0.3, 0.06, col("--fig-energy", "#C89A10"), 1.5);
    S.add(spark);
    /* trace panel */
    var PANEL_Y0 = 1.05;
    var PANEL_H = 1.8;
    S.add(seg(-6.2, PANEL_Y0, 6.2, PANEL_Y0, 0.04, guide, 0));
    S.add(seg(-6.2, PANEL_Y0, -6.2, PANEL_Y0 + PANEL_H + 0.2, 0.04, guide, 0));
    var N = 260;
    var tracePos = new Float32Array(N * 3);
    var traceGeo = new THREE.BufferGeometry();
    traceGeo.setAttribute("position", new THREE.BufferAttribute(tracePos, 3));
    traceGeo.setDrawRange(0, 0);
    var traceMat = new THREE.PointsMaterial({ color: col("--teal-600", "#137568"), size: 3, sizeAttenuation: false, depthTest: false });
    var trace = new THREE.Points(traceGeo, traceMat);
    trace.renderOrder = 25;
    S.add(trace);
    var hud = {
      tip: host.querySelector('[data-hud="tip"]'),
      atoms: host.querySelector('[data-hud="atoms"]'),
      trace: host.querySelector('[data-hud="trace"]')
    };
    var params = { mode: "height" };
    var clock, n;
    var H_CONST = BASE + A_R + 0.55;
    var GAP = 0.32;
    function current(gap) { return Math.exp(-5.2 * (gap - 0.1)); }
    return {
      gfx: gfx,
      api: {
        set: function (next) {
          if (next.mode) params.mode = next.mode;
          clock = 0;
          n = 0;
          traceGeo.setDrawRange(0, 0);
          host.dispatchEvent(new Event("notes-render"));
        },
        get: function () { return Object.assign({}, params); }
      },
      scene: {
        settleT: 9.5,
        reset: function () { clock = 0; n = 0; traceGeo.setDrawRange(0, 0); },
        step: function (dt) {
          clock += dt;
          var u = (clock % 10) / 10;
          if (u < dt / 10) { n = 0; }
          var px = -5.6 + u * 11.2;
          var sy = surface(px);
          var ty = params.mode === "height" ? H_CONST : sy + GAP;
          tip.position.set(px, ty, 0);
          spark.position.set(px, (ty + sy) / 2, 1.5);
          spark.scale.set(Math.max(0.05, (ty - sy) / 0.3), 1, 1);
          var val = params.mode === "height"
            ? Math.min(1, current(ty - sy) / current(GAP - 0.12)) * 0.95
            : (ty - (BASE + 0.1 + GAP)) / (A_R + 0.05);
          n = Math.min(N, Math.floor(u * N) + 1);
          var idx = n - 1;
          tracePos[idx * 3] = px;
          tracePos[idx * 3 + 1] = PANEL_Y0 + 0.1 + Math.max(0, Math.min(1, val)) * PANEL_H;
          tracePos[idx * 3 + 2] = 0;
          traceGeo.setDrawRange(0, n);
          traceGeo.attributes.position.needsUpdate = true;
        },
        draw: function () {
          placeHud(hud.tip, gfx, tip.position.x + 1.15, tip.position.y + 1.1);
          placeHud(hud.atoms, gfx, 0, BASE - A_R - 0.35);
          if (hud.trace) {
            hud.trace.textContent = params.mode === "height" ? "tunnelling current" : "tip height";
            placeHud(hud.trace, gfx, -4.4, PANEL_Y0 + PANEL_H + 0.15);
          }
        }
      }
    };
  };

  /* =================================================================
     3.3 D  Cut a cube into smaller cubes: same volume, more surface (interactive)
     ================================================================= */
  builders.cubes = function (host) {
    var gfx = stage(host, { halfW: 3.6, halfH: 2.0, iso: true, cy: 0.1 });
    if (!gfx) return null;
    var S = gfx.scene;
    S.add(new THREE.AmbientLight(0xffffff, 0.62));
    var key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(4, 9, 6);
    S.add(key);
    var group = new THREE.Group();
    S.add(group);
    var face = col("--teal-300", "#6FBFB0");
    var edge = col("--fig-ink", "#17212B");
    var params = { k: 1 };
    var hudA = host.querySelector('[data-hud="area"]');
    function build() {
      while (group.children.length) { var c = group.children.pop(); disposeGroup(c); }
      var k = params.k;
      var L = 2.4;
      var gap = k === 1 ? 0 : 0.5 / k;
      var s = (L - gap * (k - 1)) / k;
      var geo = new THREE.BoxGeometry(s, s, s);
      var mat = new THREE.MeshLambertMaterial({ color: face });
      var egeo = new THREE.EdgesGeometry(geo);
      var emat = new THREE.LineBasicMaterial({ color: edge });
      var i, j, l;
      for (i = 0; i < k; i += 1) for (j = 0; j < k; j += 1) for (l = 0; l < k; l += 1) {
        var m = new THREE.Mesh(geo, mat);
        var off = -L / 2 + s / 2;
        m.position.set(off + i * (s + gap), off + j * (s + gap), off + l * (s + gap));
        group.add(m);
        var e = new THREE.LineSegments(egeo, emat);
        e.position.copy(m.position);
        group.add(e);
      }
    }
    return {
      gfx: gfx,
      api: {
        set: function (next) {
          if (next.k) params.k = next.k;
          build();
          host.dispatchEvent(new Event("notes-render"));
        }
      },
      scene: {
        duration: 0.05,
        reset: function () { if (!group.children.length) build(); },
        step: function () { },
        draw: function () { placeHud(hudA, gfx, 0, -1.95, 1.2); }
      }
    };
  };

  global.NotesScenes = api;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
