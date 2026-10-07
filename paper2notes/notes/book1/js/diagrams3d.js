/* Book 1 stage runner, shared by every chapter.

   Markup (PRD 6.5):
     <figure class="fig" id="...">
       <div class="visual play stage" id="x-vis" data-autoplay data-scene="name">
         <canvas class="scene-canvas" aria-label="what the figure shows"></canvas>
         <span class="hud-label" data-hud="key" style="left:30%;top:20%">label</span>
         <button type="button" class="stage-replay" data-replay="x-vis">Replay</button>   (finite clips only)
       </div>
       <figcaption>...</figcaption>
     </figure>

   A chapter's js/scenes.js registers builders:
     Book1Stage.register("name", { mode: "2d" | "3d", build: function (ctx) { return scene; } });
   The builder returns { draw(t), settle, duration?, set?(key, value), snapshot?() }.
     draw(t)   render the frame at t seconds since the clip started
     settle    the time whose frame is the readable static picture (print, reduced motion)
     duration  seconds for a finite clip (it stops on its last frame and offers Replay);
               omit for a continuous loop
     still     true for a figure that only changes through its controls (no animation loop)

   The runner owns the lifecycle so every scene behaves the same:
   - it plays only while at least 35% of the box is on screen and pauses off screen;
   - a finite clip restarts when it comes back into view, and on Replay;
   - prefers-reduced-motion and printing render the settled frame only;
   - a 3D scene without WebGL shows its aria-label text instead of a blank box. */
(function (global) {
  "use strict";

  var builders = {};
  var live = [];
  var reduceMotion = false;
  try {
    reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (err) { reduceMotion = false; }

  /* Design-system figure palette (Paper2Notes Design System tokens). One colour, one meaning. */
  var C = {
    ink: "#17212B",
    ink2: "#4A5562",
    ink3: "#6E7885",
    guide: "#B9B2A1",
    line: "#E6E0D2",
    lineSoft: "#F0EBDF",
    paper: "#FAF7F0",
    white: "#FFFFFF",
    hot: "#F26B3A",      /* --flame-500: hot end of every temperature scale */
    hotSoft: "#FFE6DB",  /* --flame-100 */
    cold: "#2A62A8",     /* --fig-velocity blue: cold end of the scale */
    coldSoft: "#E6EEF8", /* --book2-soft: water, cold fluid */
    energy: "#C89A10",   /* --fig-energy: heat (energy in transit) */
    energySoft: "#FDF1D3",
    teal: "#1F9585",     /* --fig-field / teal-500: apparatus highlights */
    tealDeep: "#0F5C54",
    tealSoft: "#E8F4F1",
    metal: "#9AA7B4",    /* --tier-silver */
    copper: "#C9793A",   /* --tier-bronze */
    force: "#D64545"     /* --fig-force: force arrows only (gas pressure) */
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  /* Temperature colour: 0 = cold blue, 1 = hot orange, mixed in sRGB. */
  function heatColour(k) {
    k = clamp(k, 0, 1);
    var a = [0x2a, 0x62, 0xa8];
    var b = [0xf2, 0x6b, 0x3a];
    var r = Math.round(lerp(a[0], b[0], k));
    var g = Math.round(lerp(a[1], b[1], k));
    var bl = Math.round(lerp(a[2], b[2], k));
    return "rgb(" + r + "," + g + "," + bl + ")";
  }

  /* Seeded random numbers so every load (and every screenshot) draws the same particles. */
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return (s >>> 0) / 4294967296;
    };
  }

  /* ---------- 2D drawing helpers ---------- */

  function arrow(g, x1, y1, x2, y2, opt) {
    opt = opt || {};
    var w = opt.width || 3;
    var head = opt.head || Math.max(9, w * 3.2);
    var ang = Math.atan2(y2 - y1, x2 - x1);
    g.save();
    g.strokeStyle = opt.colour || C.ink;
    g.fillStyle = opt.colour || C.ink;
    g.lineWidth = w;
    g.lineCap = "round";
    if (opt.dash) g.setLineDash(opt.dash);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2 - Math.cos(ang) * head * 0.8, y2 - Math.sin(ang) * head * 0.8);
    g.stroke();
    g.setLineDash([]);
    g.beginPath();
    g.moveTo(x2, y2);
    g.lineTo(x2 - Math.cos(ang - 0.42) * head, y2 - Math.sin(ang - 0.42) * head);
    g.lineTo(x2 - Math.cos(ang + 0.42) * head, y2 - Math.sin(ang + 0.42) * head);
    g.closePath();
    g.fill();
    g.restore();
  }

  function wavy(g, x1, y1, x2, y2, opt) {
    opt = opt || {};
    var len = Math.hypot(x2 - x1, y2 - y1);
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var amp = opt.amp || 6;
    var waves = opt.waves || Math.max(2, len / 26);
    var phase = opt.phase || 0;
    g.save();
    g.translate(x1, y1);
    g.rotate(ang);
    g.strokeStyle = opt.colour || C.energy;
    g.fillStyle = opt.colour || C.energy;
    g.lineWidth = opt.width || 2.6;
    g.lineCap = "round";
    g.beginPath();
    var stop = len - 12;
    for (var s = 0; s <= stop; s += 2) {
      var y = amp * Math.sin((s / len) * waves * Math.PI * 2 + phase);
      if (s === 0) g.moveTo(s, y); else g.lineTo(s, y);
    }
    g.stroke();
    g.beginPath();
    g.moveTo(len, 0);
    g.lineTo(len - 13, -6.5);
    g.lineTo(len - 13, 6.5);
    g.closePath();
    g.fill();
    g.restore();
  }

  function roundRect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function dot(g, x, y, r, fill, stroke) {
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = fill;
    g.fill();
    if (stroke) {
      g.lineWidth = 1.2;
      g.strokeStyle = stroke;
      g.stroke();
    }
  }

  function text(g, s, x, y, opt) {
    opt = opt || {};
    g.save();
    g.font = (opt.weight || 700) + " " + (opt.size || 13) + "px Nunito, system-ui, sans-serif";
    g.fillStyle = opt.colour || C.ink;
    g.textAlign = opt.align || "center";
    g.textBaseline = opt.baseline || "middle";
    g.fillText(s, x, y);
    g.restore();
  }

  /* Axes for a small graph: origin (x0, y0), width w, height h (y grows upward). */
  function axes(g, x0, y0, w, h, opt) {
    opt = opt || {};
    arrow(g, x0, y0, x0 + w, y0, { colour: C.ink, width: 2, head: 9 });
    arrow(g, x0, y0, x0, y0 - h, { colour: C.ink, width: 2, head: 9 });
    if (opt.x) text(g, opt.x, x0 + w - 4, y0 + 16, { align: "right", size: 13, colour: C.ink2 });
    if (opt.y) text(g, opt.y, x0 + 8, y0 - h + 2, { align: "left", size: 13, colour: C.ink2 });
  }

  /* ---------- lifecycle ---------- */

  function makeCtx(host, canvas, mode) {
    var ctx = {
      host: host,
      canvas: canvas,
      mode: mode,
      w: 0,
      h: 0,
      C: C,
      clamp: clamp,
      lerp: lerp,
      ease: ease,
      heatColour: heatColour,
      rng: rng,
      arrow: arrow,
      wavy: wavy,
      roundRect: roundRect,
      dot: dot,
      text: text,
      axes: axes,
      hud: function (key) { return host.querySelector('[data-hud="' + key + '"]'); },
      /* Put a HUD label at canvas pixel (x, y); the label's centre sits there. */
      place: function (key, x, y, label) {
        var el = ctx.hud(key);
        if (!el) return;
        var left = canvas.offsetLeft + x;
        var top = canvas.offsetTop + y;
        el.style.left = left + "px";
        el.style.top = top + "px";
        if (label != null && el.textContent !== label) el.textContent = label;
      },
      /* 2D only: draw in a W x H design box scaled to fit the canvas and centred.
         Returns the scale; ctx.k keeps it so on-canvas text stays a fixed screen size. */
      view: function (W, H) {
        var k = Math.min(ctx.w / W, ctx.h / H);
        var ox = (ctx.w - W * k) / 2;
        var oy = (ctx.h - H * k) / 2;
        ctx.k = k;
        ctx.ox = ox;
        ctx.oy = oy;
        ctx.g.setTransform(ctx.dpr * k, 0, 0, ctx.dpr * k, ctx.dpr * ox, ctx.dpr * oy);
        return k;
      },
      /* A HUD label at design-box coordinates (after view()). */
      placeV: function (key, x, y, label) {
        ctx.place(key, ctx.ox + x * ctx.k, ctx.oy + y * ctx.k, label);
      },
      /* Canvas text whose size is in screen pixels whatever the scale. */
      label: function (s, x, y, opt) {
        opt = opt || {};
        var o = {};
        for (var key in opt) o[key] = opt[key];
        o.size = (opt.size || 13) / (ctx.k || 1);
        text(ctx.g, s, x, y, o);
      },
      /* A width that looks the same on every screen (n screen pixels). */
      px: function (n) { return n / (ctx.k || 1); }
    };
    return ctx;
  }

  function size2d(ctx) {
    var canvas = ctx.canvas;
    var w = canvas.clientWidth || canvas.width;
    var h = canvas.clientHeight || canvas.height;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.w = w;
    ctx.h = h;
    ctx.dpr = dpr;
    ctx.k = 1;
    ctx.ox = 0;
    ctx.oy = 0;
    ctx.g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function webglAvailable(canvas) {
    if (!global.THREE) return false;
    try {
      return !!(global.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch (err) {
      return false;
    }
  }

  function fallback(host, canvas) {
    host.classList.add("no-webgl");
    if (host.querySelector(".stage-fallback")) return;
    var p = document.createElement("p");
    p.className = "stage-fallback";
    p.textContent = canvas.getAttribute("aria-label") || "Figure unavailable in this browser.";
    host.appendChild(p);
  }

  /* three.js stage with a fixed orthographic camera that keeps a content box
     (halfW x halfH world units) in view at any aspect ratio. */
  function stage3d(ctx, fit) {
    var THREE = global.THREE;
    var canvas = ctx.canvas;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    var camera;
    if (fit && fit.persp) {
      camera = new THREE.PerspectiveCamera(fit.persp.fov || 30, 2, 0.1, 100);
      camera.position.set(fit.persp.x, fit.persp.y, fit.persp.z);
      camera.lookAt(new THREE.Vector3(fit.persp.lookX || 0, fit.persp.lookY || 0, fit.persp.lookZ || 0));
    } else {
      camera = new THREE.OrthographicCamera(-6, 6, 3, -3, 0.1, 60);
      camera.position.set(0, 0, 20);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    var key = new THREE.DirectionalLight(0xfff4e0, 0.9);
    key.position.set(-4, 6, 8);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9bb6c4, 0.35);
    fill.position.set(6, -2, 4);
    scene.add(fill);
    var halfW = (fit && fit.halfW) || 6;
    var halfH = (fit && fit.halfH) || 3;
    function resize() {
      var w = canvas.clientWidth || canvas.width;
      var h = canvas.clientHeight || canvas.height;
      renderer.setSize(w, h, false);
      ctx.w = w;
      ctx.h = h;
      var aspect = w / Math.max(h, 1);
      if (camera.isPerspectiveCamera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        return;
      }
      var hh = halfH;
      var hw = hh * aspect;
      if (hw < halfW) { hw = halfW; hh = hw / aspect; }
      camera.left = -hw;
      camera.right = hw;
      camera.top = hh;
      camera.bottom = -hh;
      camera.updateProjectionMatrix();
    }
    resize();
    function project(v) {
      var p = v.clone().project(camera);
      return { x: (p.x * 0.5 + 0.5) * ctx.w, y: (-p.y * 0.5 + 0.5) * ctx.h };
    }
    return {
      THREE: THREE,
      scene: scene,
      camera: camera,
      renderer: renderer,
      resize: resize,
      project: project,
      render: function () { renderer.render(scene, camera); }
    };
  }

  function boot(host) {
    var name = host.getAttribute("data-scene");
    var spec = builders[name];
    var canvas = host.querySelector("canvas.scene-canvas");
    if (!spec || !canvas || host.getAttribute("data-stage-ready")) return;
    host.setAttribute("data-stage-ready", "true");
    var mode = spec.mode || "2d";
    var ctx = makeCtx(host, canvas, mode);
    if (mode === "3d") {
      if (!webglAvailable(canvas)) { fallback(host, canvas); return; }
      try {
        ctx.stage3d = function (fit) { ctx.gfx = stage3d(ctx, fit); return ctx.gfx; };
      } catch (err) { fallback(host, canvas); return; }
    } else {
      ctx.g = canvas.getContext("2d");
      if (!ctx.g) { fallback(host, canvas); return; }
      size2d(ctx);
    }
    var scene;
    try {
      scene = spec.build(ctx);
    } catch (err) {
      if (global.console) console.error("Book1Stage failed:", name, err);
      fallback(host, canvas);
      return;
    }
    if (!scene || typeof scene.draw !== "function") return;

    var state = {
      host: host,
      ctx: ctx,
      scene: scene,
      t: 0,
      playing: false,
      visible: false,
      last: 0,
      raf: 0,
      lastStart: -1e9
    };
    live.push(state);

    function paint(t) {
      if (mode === "2d") {
        size2d(ctx);
        ctx.g.clearRect(0, 0, ctx.w, ctx.h);
        ctx.g.fillStyle = C.white;
        ctx.g.fillRect(0, 0, ctx.w, ctx.h);
      }
      scene.draw(t);
      if (mode === "3d" && ctx.gfx) ctx.gfx.render();
    }
    state.paint = paint;

    function frame(now) {
      state.raf = 0;
      if (!state.playing) return;
      var dt = Math.min(0.05, (now - state.last) / 1000);
      state.last = now;
      state.t += dt;
      if (scene.duration && state.t >= scene.duration) {
        state.t = scene.duration;
        state.playing = false;
        paint(state.t);
        host.classList.add("is-done");
        return;
      }
      paint(state.t);
      state.raf = global.requestAnimationFrame(frame);
    }

    function play(fromStart) {
      if (scene.still) { paint(state.t); return; }
      if (reduceMotion) { paint(scene.settle != null ? scene.settle : 0); return; }
      if (fromStart) { state.t = 0; host.classList.remove("is-done"); }
      if (scene.duration && state.t >= scene.duration) { paint(state.t); return; }
      state.playing = true;
      state.last = global.performance.now();
      if (!state.raf) state.raf = global.requestAnimationFrame(frame);
    }

    function pause() {
      state.playing = false;
      if (state.raf) { global.cancelAnimationFrame(state.raf); state.raf = 0; }
    }

    state.play = play;
    state.pause = pause;
    state.redraw = function () { paint(reduceMotion && scene.settle != null ? scene.settle : state.t); };

    /* First paint is the settled frame, so the box is never empty before it plays. */
    paint(scene.settle != null ? scene.settle : 0);

    var replay = host.querySelector(".stage-replay");
    if (replay) {
      if (!scene.duration) {
        replay.parentNode.removeChild(replay);
      } else {
        replay.addEventListener("click", function () {
          pause();
          if (reduceMotion) { paint(scene.settle != null ? scene.settle : scene.duration); return; }
          play(true);
        });
      }
    }

    host.addEventListener("stage-set", function (ev) {
      if (scene.set) scene.set(ev.detail.key, ev.detail.value);
      if (!state.playing) state.redraw();
    });

    if (typeof IntersectionObserver !== "function") {
      state.visible = true;
      play(true);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var on = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        if (on === state.visible) return;
        state.visible = on;
        if (on) {
          var now = global.performance.now();
          var restart = !!scene.duration && now - state.lastStart > 1200;
          if (restart) state.lastStart = now;
          play(restart || state.t === 0);
        } else {
          pause();
        }
      });
    }, { threshold: [0, 0.35, 0.6] });
    io.observe(host);
  }

  function bootAll() {
    Array.prototype.forEach.call(document.querySelectorAll(".stage[data-scene]"), boot);
  }

  var resizeTimer = 0;
  global.addEventListener("resize", function () {
    if (resizeTimer) global.clearTimeout(resizeTimer);
    resizeTimer = global.setTimeout(function () {
      live.forEach(function (s) {
        if (s.ctx.gfx) s.ctx.gfx.resize();
        if (!s.playing) s.redraw();
      });
    }, 80);
  });

  /* Print and PDF export use the readable settled frame of every figure. */
  global.addEventListener("beforeprint", function () {
    live.forEach(function (s) {
      s.pause();
      if (s.ctx.gfx) s.ctx.gfx.resize();
      s.paint(s.scene.settle != null ? s.scene.settle : s.t);
    });
  });

  /* Sliders and step buttons: <input data-stage-ctrl="x-vis" data-key="mass"> or
     <button data-stage-ctrl="x-vis" data-key="mode" data-value="vacuum">.
     A live readout is any [data-readout="x-vis:key"] element; scenes may also
     format it through scene.format(key, value). */
  function initControls() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-stage-ctrl]"), function (el) {
      var target = document.getElementById(el.getAttribute("data-stage-ctrl"));
      if (!target) return;
      var key = el.getAttribute("data-key");
      function send(value) {
        target.dispatchEvent(new CustomEvent("stage-set", { detail: { key: key, value: value } }));
        var out = document.querySelector('[data-readout="' + target.id + ":" + key + '"]');
        var s = live.filter(function (x) { return x.host === target; })[0];
        if (out) {
          var shown = s && s.scene.format ? s.scene.format(key, value) : value;
          out.textContent = shown;
        }
      }
      if (el.tagName === "INPUT") {
        el.addEventListener("input", function () { send(parseFloat(el.value)); });
        send(parseFloat(el.value));
      } else {
        el.addEventListener("click", function () {
          Array.prototype.forEach.call(document.querySelectorAll('[data-stage-ctrl="' + target.id + '"][data-key="' + key + '"]'), function (b) {
            b.setAttribute("aria-pressed", b === el ? "true" : "false");
          });
          send(el.getAttribute("data-value"));
        });
      }
    });
  }

  global.Book1Stage = {
    register: function (name, spec) { builders[name] = spec; },
    colours: C,
    /* Test hook: the live scene objects by host id. */
    scene: function (id) {
      var s = live.filter(function (x) { return x.host.id === id; })[0];
      return s ? s.scene : null;
    }
  };

  function start() {
    bootAll();
    initControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    global.setTimeout(start, 0);
  }
})(window);
