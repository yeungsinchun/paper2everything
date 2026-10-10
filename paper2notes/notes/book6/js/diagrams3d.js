/* Book 6 scene engine: one renderer contract for every stage in the book.

   A chapter's js/scenes.js registers its scenes with NotesStage.define(name, build).
   Markup (PRD 6.5):
     figure.fig > .visual.play.stage[data-scene="name"][data-autoplay]
       > canvas.scene-canvas[aria-label]  + span.hud-label[data-hud="key"]*
       + button.stage-replay (finite clips only)
     figure.fig > .sim-controls  input[data-param="p"] | button[data-set="p:value"]  + [data-out="key"]
   build(S) receives a Stage (drawing helpers, label placement, outputs) and returns
     { update(t), duration?, settle?, onParam?(name, value), snapshot?() }
   update(t) draws the state at t seconds; it must depend on t and the parameters only,
   so a settled frame (reduced motion, print) is just update(settle).

   Behaviour:
   - A scene animates only while it is on screen.
   - A finite clip (duration > 0) restarts when it comes back into view and on Replay.
   - prefers-reduced-motion and print render one settled frame; controls still redraw it.
   - No three.js or no WebGL: the canvas label is shown as text instead of a blank box. */
(function (global) {
  "use strict";

  var THREE = global.THREE;
  var builders = {};
  var records = [];
  var printing = false;
  var reduceMotion = false;
  try {
    reduceMotion = global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (err) { /* old browser: animate */ }

  /* Design-system colours (css/p2n.css). Physics colours keep their meaning:
     force red, velocity blue, energy gold, field teal. */
  var C = {
    ink: 0x17212b, ink2: 0x4a5562, ink3: 0x6e7885, guide: 0xb9b2a1,
    line: 0xe6e0d2, lineSoft: 0xf0ebdf, paper: 0xfaf7f0, white: 0xffffff,
    teal: 0x1f9585, tealDeep: 0x0f5c54, teal300: 0x6fbfb0, tealSoft: 0xcfe8e2,
    sun: 0xe8a317, sun400: 0xf5b83d, sun700: 0x9a6a05, sunSoft: 0xfdf1d3,
    flame: 0xf26b3a, nudge: 0xd9822b,
    force: 0xd64545, velocity: 0x2a62a8, accel: 0xe07b1f,
    displacement: 0x7a4fc2, distance: 0x2a8fa8, energy: 0xc89a10, field: 0x1f9585
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* Colour of a blackbody at temperature T (K) as 0xRRGGBB, from the standard
     colour-temperature fit (valid 1000 K to 40 000 K). Star colours in every scene come
     from this one rule, so a star's colour always means its surface temperature. */
  function starColor(T) {
    var t = clamp(T, 1000, 40000) / 100;
    var r;
    var g;
    var b;
    if (t <= 66) {
      r = 255;
      g = 99.4708025861 * Math.log(t) - 161.1195681661;
    } else {
      r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
      g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    }
    if (t >= 66) b = 255;
    else if (t <= 19) b = 0;
    else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    r = Math.round(clamp(r, 0, 255));
    g = Math.round(clamp(g, 0, 255));
    b = Math.round(clamp(b, 0, 255));
    return (r << 16) | (g << 8) | b;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  /* ---------- polyline geometry ---------- */

  /* A flat ribbon of width w along a polyline in the z = 0 plane (WebGL lines are
     always 1 px, so every stroke is a thin mesh). Joins are mitred, capped at 2w. */
  function ribbon(pts, w, closed) {
    var n = pts.length;
    var pos = [];
    var idx = [];
    if (n < 2) return { pos: pos, idx: idx };
    var half = w / 2;
    var i;
    function seg(a, b) {
      var dx = b[0] - a[0];
      var dy = b[1] - a[1];
      var len = Math.hypot(dx, dy) || 1;
      return [-dy / len, dx / len];
    }
    for (i = 0; i < n; i += 1) {
      var prev = i > 0 ? pts[i - 1] : (closed ? pts[n - 1] : null);
      var next = i < n - 1 ? pts[i + 1] : (closed ? pts[0] : null);
      var nx;
      var ny;
      var scale = 1;
      if (prev && next) {
        var n1 = seg(prev, pts[i]);
        var n2 = seg(pts[i], next);
        nx = n1[0] + n2[0];
        ny = n1[1] + n2[1];
        var l = Math.hypot(nx, ny);
        if (l < 1e-6) { nx = n1[0]; ny = n1[1]; } else {
          nx /= l; ny /= l;
          scale = Math.min(2, 1 / Math.max(0.5, nx * n1[0] + ny * n1[1]));
        }
      } else if (next) {
        var a = seg(pts[i], next); nx = a[0]; ny = a[1];
      } else {
        var b = seg(prev, pts[i]); nx = b[0]; ny = b[1];
      }
      pos.push(pts[i][0] + nx * half * scale, pts[i][1] + ny * half * scale, 0,
        pts[i][0] - nx * half * scale, pts[i][1] - ny * half * scale, 0);
    }
    var segs = closed ? n : n - 1;
    for (i = 0; i < segs; i += 1) {
      var j = (i + 1) % n;
      idx.push(2 * i, 2 * i + 1, 2 * j, 2 * i + 1, 2 * j + 1, 2 * j);
    }
    return { pos: pos, idx: idx };
  }

  /* Cut a polyline into dash pieces of length dash with gaps of length gap. */
  function dashes(pts, dash, gap, closed) {
    var path = closed ? pts.concat([pts[0]]) : pts;
    var out = [];
    var cur = [];
    var on = true;
    var left = dash;
    var i;
    cur.push(path[0]);
    for (i = 1; i < path.length; i += 1) {
      var a = path[i - 1];
      var b = path[i];
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var done = 0;
      while (len - done > left) {
        done += left;
        var f = done / len;
        var p = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
        if (on) { cur.push(p); out.push(cur); cur = []; } else { cur = [p]; }
        on = !on;
        left = on ? dash : gap;
      }
      left -= len - done;
      if (on) cur.push(b);
    }
    if (on && cur.length > 1) out.push(cur);
    return out;
  }

  function buildLineGeometry(pts, w, opts) {
    var pieces = opts.dash ? dashes(pts, opts.dash[0], opts.dash[1], opts.closed) : [pts];
    var pos = [];
    var idx = [];
    pieces.forEach(function (piece) {
      var r = ribbon(piece, w, !opts.dash && opts.closed);
      var base = pos.length / 3;
      pos.push.apply(pos, r.pos);
      r.idx.forEach(function (k) { idx.push(k + base); });
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    return g;
  }

  function circlePts(cx, cy, r, n, a0, a1) {
    var out = [];
    var from = a0 == null ? 0 : a0;
    var to = a1 == null ? Math.PI * 2 : a1;
    var steps = n || 96;
    var full = a0 == null && a1 == null;
    var i;
    for (i = 0; i < (full ? steps : steps + 1); i += 1) {
      var a = from + (to - from) * i / steps;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return out;
  }

  function ellipsePts(cx, cy, a, b, n, rot) {
    var out = [];
    var steps = n || 128;
    var c = Math.cos(rot || 0);
    var s = Math.sin(rot || 0);
    var i;
    for (i = 0; i < steps; i += 1) {
      var th = Math.PI * 2 * i / steps;
      var x = a * Math.cos(th);
      var y = b * Math.sin(th);
      out.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return out;
  }

  var dotTexture = null;
  function roundDot() {
    if (dotTexture) return dotTexture;
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(32, 32, 30, 0, Math.PI * 2);
    g.fill();
    dotTexture = new THREE.CanvasTexture(c);
    return dotTexture;
  }

  var glowCache = {};
  function glowTexture(hex) {
    if (glowCache[hex]) return glowCache[hex];
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var g = c.getContext("2d");
    var col = new THREE.Color(hex);
    var rgb = Math.round(col.r * 255) + "," + Math.round(col.g * 255) + "," + Math.round(col.b * 255);
    var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(" + rgb + ",0.55)");
    grad.addColorStop(0.45, "rgba(" + rgb + ",0.22)");
    grad.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    glowCache[hex] = new THREE.CanvasTexture(c);
    return glowCache[hex];
  }

  /* ---------- Stage: one canvas, one orthographic top-down camera ---------- */

  function Stage(host, canvas, fig) {
    this.host = host;
    this.canvas = canvas;
    this.fig = fig;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(C.white);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
    this.camera.position.set(0, 0, 50);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
    if (!this.renderer.getContext()) throw new Error("no WebGL context");
    this.renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    this.key = new THREE.DirectionalLight(0xffffff, 0.75);
    this.key.position.set(-3, 4, 8);
    this.scene.add(this.key);
    this.box = { cx: 0, cy: 0, halfW: 5, halfH: 2.5 };
    this.view = { left: -5, right: 5, top: 2.5, bottom: -2.5, w: 1, h: 1 };
    this.huds = {};
    var self = this;
    Array.prototype.forEach.call(host.querySelectorAll("[data-hud]"), function (el) {
      self.huds[el.getAttribute("data-hud")] = el;
    });
  }

  Stage.prototype.C = C;

  /* Keep the content box [cx +- halfW] x [cy +- halfH] fully in view at any aspect. */
  Stage.prototype.fit = function (halfW, halfH, cx, cy) {
    this.box = { cx: cx || 0, cy: cy || 0, halfW: halfW, halfH: halfH };
    this.resize();
  };

  Stage.prototype.resize = function () {
    var w = this.canvas.clientWidth || this.canvas.width;
    var h = this.canvas.clientHeight || this.canvas.height;
    this.renderer.setSize(w, h, false);
    var aspect = w / Math.max(h, 1);
    var b = this.box;
    var halfW;
    var halfH;
    if (aspect >= b.halfW / b.halfH) { halfH = b.halfH; halfW = halfH * aspect; } else { halfW = b.halfW; halfH = halfW / aspect; }
    var cam = this.camera;
    cam.left = b.cx - halfW;
    cam.right = b.cx + halfW;
    cam.top = b.cy + halfH;
    cam.bottom = b.cy - halfH;
    cam.position.set(0, 0, 50);
    cam.updateProjectionMatrix();
    this.view = { left: cam.left, right: cam.right, top: cam.top, bottom: cam.bottom, w: w, h: h };
    this.unitPx = h / (2 * halfH);
  };

  /* World units per CSS pixel: lets a scene keep strokes and dots readable at phone width. */
  Stage.prototype.px = function (n) { return n / (this.unitPx || 40); };

  Stage.prototype.add = function (obj, parent) { (parent || this.scene).add(obj); return obj; };

  Stage.prototype.material = function (hex, opacity) {
    return new THREE.MeshBasicMaterial({
      color: hex, transparent: opacity != null && opacity < 1, opacity: opacity == null ? 1 : opacity,
      side: THREE.DoubleSide, depthWrite: !(opacity != null && opacity < 1)
    });
  };

  /* Stroke along points [[x, y], ...]. opts: w, color, z, closed, dash: [d, g], opacity, parent.
     The returned mesh has set(points) for moving strokes. */
  Stage.prototype.line = function (pts, opts) {
    opts = opts || {};
    var w = opts.w || 0.05;
    var mesh = new THREE.Mesh(buildLineGeometry(pts, w, opts), this.material(opts.color == null ? C.ink : opts.color, opts.opacity));
    mesh.position.z = opts.z || 0;
    mesh.set = function (p) {
      mesh.geometry.dispose();
      mesh.geometry = buildLineGeometry(p, w, opts);
    };
    return this.add(mesh, opts.parent);
  };

  Stage.prototype.circle = function (cx, cy, r, opts) {
    opts = opts || {};
    var o = {}; var k;
    for (k in opts) o[k] = opts[k];
    o.closed = true;
    return this.line(circlePts(cx, cy, r, opts.n || 120), o);
  };

  Stage.prototype.disc = function (r, hex, opts) {
    opts = opts || {};
    var mesh = new THREE.Mesh(new THREE.CircleGeometry(r, opts.segments || 48), this.material(hex, opts.opacity));
    mesh.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    return this.add(mesh, opts.parent);
  };

  Stage.prototype.ring = function (r, w, hex, opts) {
    opts = opts || {};
    var mesh = new THREE.Mesh(new THREE.RingGeometry(r - w / 2, r + w / 2, opts.segments || 96), this.material(hex, opts.opacity));
    mesh.position.set(opts.x || 0, opts.y || 0, opts.z || 0);
    return this.add(mesh, opts.parent);
  };

  /* A shaded sphere: planets, stars and spacecraft read as bodies, not flat dots. */
  Stage.prototype.ball = function (r, hex, opts) {
    opts = opts || {};
    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 20),
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.55, metalness: 0.05, emissive: opts.emissive || 0x000000 })
    );
    mesh.position.set(opts.x || 0, opts.y || 0, opts.z == null ? 1 : opts.z);
    return this.add(mesh, opts.parent);
  };

  /* A self-luminous body: a flat bright disc with a soft halo. */
  Stage.prototype.star = function (r, hex, opts) {
    opts = opts || {};
    var g = new THREE.Group();
    var halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(hex), depthWrite: false, transparent: true }));
    halo.scale.set(r * (opts.halo || 4.2), r * (opts.halo || 4.2), 1);
    g.add(halo);
    var core = new THREE.Mesh(new THREE.CircleGeometry(r, 48), this.material(hex));
    core.position.z = 0.05;
    g.add(core);
    g.core = core;
    g.halo = halo;
    g.position.set(opts.x || 0, opts.y || 0, opts.z == null ? 1 : opts.z);
    return this.add(g, opts.parent);
  };

  /* Arrow from [x0, y0] to [x1, y1]; set(from, to) moves it. */
  Stage.prototype.arrow = function (from, to, opts) {
    opts = opts || {};
    var self = this;
    var w = opts.w || 0.06;
    var headL = opts.head || w * 4.2;
    var g = new THREE.Group();
    var mat = this.material(opts.color == null ? C.ink : opts.color, opts.opacity);
    var shaft = new THREE.Mesh(new THREE.PlaneGeometry(1, w), mat);
    var headShape = new THREE.Shape();
    headShape.moveTo(0, 0);
    headShape.lineTo(-headL, headL * 0.5);
    headShape.lineTo(-headL, -headL * 0.5);
    headShape.lineTo(0, 0);
    var head = new THREE.Mesh(new THREE.ShapeGeometry(headShape), mat);
    g.add(shaft, head);
    g.position.z = opts.z || 0.4;
    g.set = function (a, b) {
      var dx = b[0] - a[0];
      var dy = b[1] - a[1];
      var len = Math.hypot(dx, dy);
      g.visible = len > 1e-4;
      if (!g.visible) return;
      var ang = Math.atan2(dy, dx);
      var hl = Math.min(headL, len * 0.6);
      var sl = Math.max(len - hl * 0.9, 1e-4);
      shaft.scale.set(sl, 1, 1);
      shaft.position.set(a[0] + Math.cos(ang) * sl / 2, a[1] + Math.sin(ang) * sl / 2, 0);
      shaft.rotation.z = ang;
      head.scale.set(hl / headL, hl / headL, 1);
      head.position.set(b[0], b[1], 0.001);
      head.rotation.z = ang;
    };
    g.set(from, to);
    return self.add(g, opts.parent);
  };

  /* Filled polygon drawn as a fan from its first point (sectors, swept areas, bars).
     set(points) reshapes it. */
  Stage.prototype.fill = function (pts, hex, opts) {
    opts = opts || {};
    function geom(p) {
      var pos = [];
      var idx = [];
      p.forEach(function (q) { pos.push(q[0], q[1], 0); });
      for (var i = 1; i < p.length - 1; i += 1) idx.push(0, i, i + 1);
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      return g;
    }
    var mesh = new THREE.Mesh(geom(pts), this.material(hex, opts.opacity));
    mesh.position.z = opts.z || 0;
    mesh.set = function (p) { mesh.geometry.dispose(); mesh.geometry = geom(p); };
    return this.add(mesh, opts.parent);
  };

  Stage.prototype.rect = function (x0, y0, x1, y1, hex, opts) {
    return this.fill([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], hex, opts);
  };

  /* Round dots of a fixed pixel size (background stars, particles). */
  Stage.prototype.dots = function (pts, sizePx, hex, opts) {
    opts = opts || {};
    var pos = [];
    pts.forEach(function (p) { pos.push(p[0], p[1], 0); });
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    var m = new THREE.PointsMaterial({
      size: sizePx * Math.min(global.devicePixelRatio || 1, 2), sizeAttenuation: false, color: hex,
      map: roundDot(), transparent: true, alphaTest: 0.4, opacity: opts.opacity == null ? 1 : opts.opacity
    });
    var p = new THREE.Points(g, m);
    p.position.z = opts.z || 0.2;
    p.set = function (list) {
      var arr = [];
      list.forEach(function (q) { arr.push(q[0], q[1], 0); });
      p.geometry.dispose();
      p.geometry = new THREE.BufferGeometry();
      p.geometry.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    };
    return this.add(p, opts.parent);
  };

  Stage.prototype.group = function (parent) { return this.add(new THREE.Group(), parent); };

  /* ---------- labels and outputs ---------- */

  /* Centre label `key` on world point (x, y), nudged by (dx, dy) CSS px, kept inside the canvas. */
  Stage.prototype.place = function (key, x, y, dx, dy) {
    var el = this.huds[key];
    if (!el) return;
    var v = this.view;
    var px = (x - v.left) / (v.right - v.left) * v.w + (dx || 0);
    var py = (v.top - y) / (v.top - v.bottom) * v.h + (dy || 0);
    var hw = (el.offsetWidth || 40) / 2 + 4;
    var hh = (el.offsetHeight || 18) / 2 + 4;
    px = clamp(px, hw, Math.max(hw, v.w - hw));
    py = clamp(py, hh, Math.max(hh, v.h - hh));
    el.style.left = (this.canvas.offsetLeft + px).toFixed(1) + "px";
    el.style.top = (this.canvas.offsetTop + py).toFixed(1) + "px";
    if (!el.classList.contains("is-placed")) el.classList.add("is-placed");
  };

  Stage.prototype.text = function (key, str) {
    var el = this.huds[key];
    if (el && el.textContent !== str) el.textContent = str;
  };

  Stage.prototype.show = function (key, on) {
    var el = this.huds[key];
    if (el) el.style.display = on ? "" : "none";
  };

  /* Write a live value into every [data-out="key"] of this figure. */
  Stage.prototype.out = function (key, str) {
    if (!this.fig) return;
    Array.prototype.forEach.call(this.fig.querySelectorAll('[data-out="' + key + '"]'), function (el) {
      if (el.textContent !== str) el.textContent = str;
    });
  };

  /* ---------- lifecycle ---------- */

  function settleTime(rec) {
    var d = rec.def;
    if (d.settle != null) return d.settle;
    return d.duration || 0;
  }

  function draw(rec) {
    try {
      rec.def.update(rec.t);
      rec.stage.renderer.render(rec.stage.scene, rec.stage.camera);
    } catch (err) {
      if (global.console) global.console.error("NotesStage draw failed:", rec.name, err);
      rec.ok = false;
    }
  }

  function restart(rec) {
    rec.t = (reduceMotion || printing) ? settleTime(rec) : 0;
    rec.playing = !(reduceMotion || printing);
    rec.dirty = true;
  }

  function fallback(host, canvas) {
    host.classList.add("is-fallback");
    if (host.querySelector(".stage-fallback")) return;
    var p = document.createElement("p");
    p.className = "stage-fallback";
    p.textContent = (canvas && canvas.getAttribute("aria-label")) || "Diagram unavailable in this browser.";
    host.insertBefore(p, host.firstChild);
  }

  function bindControls(rec) {
    var fig = rec.fig;
    if (!fig || !rec.def.onParam) return;
    var host = rec.host;
    function owns(el) {
      var target = el.getAttribute("data-for");
      return !target || target === host.id;
    }
    Array.prototype.forEach.call(fig.querySelectorAll("input[data-param]"), function (input) {
      if (!owns(input)) return;
      var name = input.getAttribute("data-param");
      function apply() {
        rec.def.onParam(name, parseFloat(input.value));
        rec.dirty = true;
      }
      input.addEventListener("input", apply);
      apply();
    });
    var groups = {};
    Array.prototype.forEach.call(fig.querySelectorAll("button[data-set]"), function (btn) {
      if (!owns(btn)) return;
      var parts = btn.getAttribute("data-set").split(":");
      var name = parts[0];
      (groups[name] = groups[name] || []).push(btn);
      btn.addEventListener("click", function () {
        groups[name].forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        rec.def.onParam(name, parts[1]);
        if (rec.def.restartOnSet) restart(rec);
        rec.dirty = true;
      });
    });
    Object.keys(groups).forEach(function (name) {
      var on = groups[name].filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })[0];
      if (on) rec.def.onParam(name, on.getAttribute("data-set").split(":")[1]);
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-scene]"), function (host) {
      var name = host.getAttribute("data-scene");
      var canvas = host.querySelector("canvas.scene-canvas");
      if (!canvas || !builders[name]) return;
      if (!THREE) { fallback(host, canvas); return; }
      var fig = host.closest ? host.closest("figure") : null;
      var stage;
      try {
        stage = new Stage(host, canvas, fig);
      } catch (err) {
        fallback(host, canvas);
        return;
      }
      var rec = { name: name, host: host, fig: fig, stage: stage, t: 0, playing: false, visible: false, dirty: true, ok: true, lastEntry: -1e9 };
      try {
        rec.def = builders[name](stage) || {};
      } catch (err) {
        if (global.console) global.console.error("NotesStage build failed:", name, err);
        fallback(host, canvas);
        return;
      }
      if (typeof rec.def.update !== "function") rec.def.update = function () {};
      canvas.style.touchAction = "pan-y";
      bindControls(rec);
      rec.t = (reduceMotion || !host.hasAttribute("data-autoplay")) ? settleTime(rec) : 0;
      rec.playing = !reduceMotion && host.hasAttribute("data-autoplay");
      var replay = host.querySelector(".stage-replay");
      if (replay) replay.addEventListener("click", function () { restart(rec); });
      records.push(rec);
      if (typeof ResizeObserver === "function") {
        new ResizeObserver(function () { stage.resize(); rec.dirty = true; }).observe(canvas);
      }
    });

    global.addEventListener("resize", function () {
      records.forEach(function (rec) { rec.stage.resize(); rec.dirty = true; });
    });

    if (typeof IntersectionObserver === "function") {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var rec = records.filter(function (r) { return r.host === entry.target; })[0];
          if (!rec) return;
          rec.visible = entry.isIntersecting;
          if (rec.visible) rec.dirty = true;
          /* A finite clip is never found already finished: it starts again each time
             most of it comes back into view (at most once per 1.2 s). */
          var inView = entry.intersectionRatio >= 0.45;
          if (inView && !rec.inView && rec.def.duration && rec.host.hasAttribute("data-autoplay")) {
            var now = global.performance.now();
            if (now - rec.lastEntry > 1200) { rec.lastEntry = now; restart(rec); }
          }
          rec.inView = inView;
        });
      }, { threshold: [0, 0.45] });
      records.forEach(function (rec) { io.observe(rec.host); });
    } else {
      records.forEach(function (rec) { rec.visible = true; });
    }

    var last = global.performance.now();
    function tick(now) {
      var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      records.forEach(function (rec) {
        if (!rec.ok || !rec.visible) return;
        if (rec.playing && !reduceMotion && !printing) {
          rec.t += dt;
          var d = rec.def.duration;
          if (d && rec.t >= d) { rec.t = d; rec.playing = false; }
          rec.dirty = true;
        }
        if (rec.dirty) { rec.dirty = false; draw(rec); }
      });
      global.requestAnimationFrame(tick);
    }
    global.requestAnimationFrame(tick);

    /* Print and PDF export: every stage shows its settled frame. */
    var saved = [];
    global.addEventListener("beforeprint", function () {
      printing = true;
      saved = records.map(function (rec) { return { t: rec.t, playing: rec.playing }; });
      records.forEach(function (rec) {
        rec.t = settleTime(rec);
        rec.playing = false;
        if (rec.ok) draw(rec);
      });
    });
    global.addEventListener("afterprint", function () {
      printing = false;
      records.forEach(function (rec, i) {
        if (saved[i]) { rec.t = saved[i].t; rec.playing = saved[i].playing; }
        rec.dirty = true;
      });
    });
  }

  global.NotesStage = {
    define: function (name, build) { builders[name] = build; },
    records: records,
    C: C,
    util: { starColor: starColor, clamp: clamp, lerp: lerp, smooth: smooth, circlePts: circlePts, ellipsePts: ellipsePts },
    /* Test hook: the named scene's own snapshot plus engine state. */
    snapshot: function (name) {
      var rec = records.filter(function (r) { return r.name === name; })[0];
      if (!rec) return null;
      var s = rec.def.snapshot ? rec.def.snapshot() : {};
      s.t = rec.t;
      s.playing = rec.playing;
      s.ok = rec.ok;
      return s;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    global.setTimeout(boot, 0);
  }
})(window);
