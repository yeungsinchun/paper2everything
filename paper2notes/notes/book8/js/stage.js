/* Book 8 stage engine: flat 2D canvas scenes for every figure that moves or
   answers a control. None of the Book 8 physics needs depth, so the scenes use
   a fixed 2D view instead of three.js (PRD 6.5: orbit only where depth carries
   meaning).

   Markup contract (same shape as the three.js books):
     figure.fig
       .visual.play.stage[data-scene="name"][data-autoplay]
         canvas.scene-canvas[aria-label]
         button.stage-replay[data-replay]        finite clips only
       .ctl-row > label.ctl > input[type=range][data-param] + output[data-out]
       .seg > button[data-param][data-value]     step controls
       .readouts > .readout [data-out]
       figcaption

   A chapter script registers each scene:
     B8Stage.scene("name", function (S) {
       return {
         draw: function (S) {},      required; S.ctx, S.w, S.h (CSS px), S.t (s), S.p (params), S.k (kit), S.C (colours)
         duration: 6,                finite clip: plays once, Replay restarts it
         still: true,                no animation: drawn on load, resize and control changes only
         settle: 2.5,                the frame shown for reduced motion and print
         readouts: function (p) {}   returns { key: "text" } for [data-out] elements
       };
     });

   Behaviour: animation starts when the figure enters the viewport and pauses
   off screen; prefers-reduced-motion renders one settled frame; print renders
   the settled frame; every label is drawn at a fixed CSS pixel size so it stays
   readable at 390px. */
(function (global) {
  "use strict";

  var defs = {};
  var mounted = [];
  var reduced = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var C = null;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smooth(t) {
    var u = clamp(t, 0, 1);
    return u * u * (3 - 2 * u);
  }

  /* Colours come from the design-system tokens on :root, so the canvas never
     invents a hue. */
  function readColours() {
    var cs = global.getComputedStyle(document.documentElement);
    function tok(name, fallback) {
      var v = cs.getPropertyValue(name).trim();
      return v || fallback;
    }
    return {
      ink: tok("--ink", "#17212B"),
      ink2: tok("--ink-2", "#4A5562"),
      ink3: tok("--ink-3", "#6E7885"),
      line: tok("--line", "#E6E0D2"),
      lineSoft: tok("--line-soft", "#F0EBDF"),
      paper: tok("--paper", "#FAF7F0"),
      card: tok("--card", "#FFFFFF"),
      guide: tok("--fig-guide", "#B9B2A1"),
      teal: tok("--teal-600", "#137568"),
      tealSoft: tok("--teal-50", "#E8F4F1"),
      electric: tok("--b8-electric", "#1F9585"),
      light: tok("--b8-light", "#E8A317"),
      heat: tok("--b8-heat", "#F26B3A"),
      kinetic: tok("--b8-kinetic", "#7A4FC2"),
      chemical: tok("--b8-chemical", "#2A8FA8"),
      cold: tok("--b8-cold", "#2A62A8"),
      hot: tok("--b8-hot", "#D64545"),
      field: tok("--fig-field", "#1F9585"),
      force: tok("--fig-force", "#D64545"),
      electron: tok("--fig-electron", "#2A62A8"),
      proton: tok("--fig-proton", "#C0392B"),
      neutron: tok("--fig-neutron", "#2F7A4A"),
      sun: tok("--sun-400", "#F5B83D"),
      sunSoft: tok("--sun-100", "#FDF1D3"),
      font: tok("--font-body", "Nunito, system-ui, sans-serif"),
      mono: tok("--font-mono", "ui-monospace, Menlo, monospace")
    };
  }

  function rgba(hex, a) {
    var h = String(hex).replace("#", "").trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return hex;
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  /* Drawing kit bound to one canvas context. Coordinates are CSS pixels. */
  function makeKit(S) {
    var k = {};

    k.clear = function () {
      var ctx = S.ctx;
      ctx.fillStyle = S.C.card;
      ctx.fillRect(0, 0, S.w, S.h);
    };

    k.line = function (x1, y1, x2, y2, o) {
      var ctx = S.ctx;
      o = o || {};
      ctx.save();
      ctx.strokeStyle = o.color || S.C.ink;
      ctx.lineWidth = o.width || 2;
      ctx.lineCap = o.cap || "round";
      if (o.dash) ctx.setLineDash(o.dash);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    };

    k.poly = function (pts, o) {
      var ctx = S.ctx;
      o = o || {};
      if (!pts.length) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
      if (o.close) ctx.closePath();
      if (o.fill) {
        ctx.fillStyle = o.fill;
        ctx.fill();
      }
      if (o.color || !o.fill) {
        ctx.strokeStyle = o.color || S.C.ink;
        ctx.lineWidth = o.width || 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        if (o.dash) ctx.setLineDash(o.dash);
        ctx.stroke();
      }
      ctx.restore();
    };

    k.arrow = function (x1, y1, x2, y2, o) {
      var ctx = S.ctx;
      o = o || {};
      var w = o.width || 2.5;
      var head = o.head || Math.max(8, w * 3.2);
      var ang = Math.atan2(y2 - y1, x2 - x1);
      var len = Math.hypot(x2 - x1, y2 - y1);
      if (len < 1) return;
      var bx = x2 - Math.cos(ang) * head * 0.85;
      var by = y2 - Math.sin(ang) * head * 0.85;
      ctx.save();
      ctx.strokeStyle = o.color || S.C.ink;
      ctx.fillStyle = o.color || S.C.ink;
      ctx.lineWidth = w;
      ctx.lineCap = "butt";
      if (o.dash) ctx.setLineDash(o.dash);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - Math.cos(ang - 0.42) * head, y2 - Math.sin(ang - 0.42) * head);
      ctx.lineTo(x2 - Math.cos(ang + 0.42) * head, y2 - Math.sin(ang + 0.42) * head);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    /* A wide flow arrow whose thickness carries an amount of energy. */
    k.band = function (x1, y1, x2, y2, thick, color, o) {
      var ctx = S.ctx;
      o = o || {};
      if (thick <= 0.4) return;
      var ang = Math.atan2(y2 - y1, x2 - x1);
      var nx = -Math.sin(ang);
      var ny = Math.cos(ang);
      var head = o.head === 0 ? 0 : Math.max(10, Math.min(thick * 0.9, 26));
      var hw = thick / 2;
      var ex = x2 - Math.cos(ang) * head;
      var ey = y2 - Math.sin(ang) * head;
      var flare = head ? Math.max(hw + 5, hw * 1.35) : hw;
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1 + nx * hw, y1 + ny * hw);
      ctx.lineTo(ex + nx * hw, ey + ny * hw);
      if (head) {
        ctx.lineTo(ex + nx * flare, ey + ny * flare);
        ctx.lineTo(x2, y2);
        ctx.lineTo(ex - nx * flare, ey - ny * flare);
      }
      ctx.lineTo(ex - nx * hw, ey - ny * hw);
      ctx.lineTo(x1 - nx * hw, y1 - ny * hw);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    k.circle = function (x, y, r, o) {
      var ctx = S.ctx;
      o = o || {};
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
      if (o.fill) {
        ctx.fillStyle = o.fill;
        ctx.fill();
      }
      if (o.stroke) {
        ctx.strokeStyle = o.stroke;
        ctx.lineWidth = o.width || 2;
        if (o.dash) ctx.setLineDash(o.dash);
        ctx.stroke();
      }
      ctx.restore();
    };

    k.rect = function (x, y, w, h, o) {
      var ctx = S.ctx;
      o = o || {};
      var r = Math.min(o.radius || 0, Math.abs(w) / 2, Math.abs(h) / 2);
      ctx.save();
      ctx.beginPath();
      if (r > 0) {
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      } else {
        ctx.rect(x, y, w, h);
      }
      if (o.fill) {
        ctx.fillStyle = o.fill;
        ctx.fill();
      }
      if (o.stroke) {
        ctx.strokeStyle = o.stroke;
        ctx.lineWidth = o.width || 2;
        if (o.dash) ctx.setLineDash(o.dash);
        ctx.stroke();
      }
      ctx.restore();
    };

    k.font = function (size, weight, mono) {
      return (weight || 700) + " " + (size || 12) + "px " + (mono ? S.C.mono : S.C.font);
    };

    k.text = function (str, x, y, o) {
      var ctx = S.ctx;
      o = o || {};
      ctx.save();
      ctx.font = k.font(o.size || 13, o.weight || 700, o.mono);
      ctx.fillStyle = o.color || S.C.ink;
      ctx.textAlign = o.align || "center";
      ctx.textBaseline = o.baseline || "middle";
      ctx.fillText(str, x, y);
      ctx.restore();
    };

    k.measure = function (str, o) {
      var ctx = S.ctx;
      o = o || {};
      ctx.save();
      ctx.font = k.font(o.size || 12, o.weight || 700, o.mono);
      var w = ctx.measureText(str).width;
      ctx.restore();
      return w;
    };

    /* The design system's HUD label: white pill, hairline border, 12px bold.
       The label is kept inside the canvas so it is never clipped. */
    k.label = function (str, x, y, o) {
      var ctx = S.ctx;
      o = o || {};
      var size = o.size || 12;
      var padX = 8;
      var h = size + 9;
      var w = k.measure(str, { size: size, mono: o.mono }) + padX * 2 + (o.dot ? 12 : 0);
      var align = o.align || "center";
      var left = align === "left" ? x : align === "right" ? x - w : x - w / 2;
      left = clamp(left, 2, S.w - w - 2);
      var top = clamp(y - h / 2, 2, S.h - h - 2);
      k.rect(left, top, w, h, { fill: "rgba(255,255,255,0.94)", stroke: o.border || S.C.lineSoft, width: 2, radius: h / 2 });
      if (o.dot) k.circle(left + padX + 3, top + h / 2, 4, { fill: o.dot });
      k.text(str, left + w / 2 + (o.dot ? 6 : 0), top + h / 2 + 0.5, { size: size, color: o.color || S.C.ink, mono: o.mono });
      return { x: left, y: top, w: w, h: h };
    };

    /* A sinusoid drawn along a segment: photons, EM waves, microwaves. */
    k.wave = function (x1, y1, x2, y2, o) {
      var ctx = S.ctx;
      o = o || {};
      var len = Math.hypot(x2 - x1, y2 - y1);
      if (len < 2) return;
      var ux = (x2 - x1) / len;
      var uy = (y2 - y1) / len;
      var amp = o.amp == null ? 5 : o.amp;
      var lam = o.wavelength || 14;
      var ph = o.phase || 0;
      ctx.save();
      ctx.strokeStyle = o.color || S.C.light;
      ctx.lineWidth = o.width || 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (var s = 0; s <= len; s += 1.5) {
        var env = o.taper ? Math.sin(Math.PI * s / len) : 1;
        var d = amp * env * Math.sin((s / lam) * Math.PI * 2 - ph);
        var px = x1 + ux * s - uy * d;
        var py = y1 + uy * s + ux * d;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      if (o.head) {
        ctx.restore();
        k.arrow(x2 - ux * 2, y2 - uy * 2, x2 + ux * 6, y2 + uy * 6, { color: o.color || S.C.light, width: 2, head: 8 });
        return;
      }
      ctx.restore();
    };

    k.rgba = rgba;
    k.clamp = clamp;
    k.lerp = lerp;
    k.smooth = smooth;
    return k;
  }

  function scene(name, factory) {
    defs[name] = factory;
    if (document.readyState !== "loading") boot();
  }

  function numberOrString(v) {
    var n = parseFloat(v);
    return isNaN(n) || String(n) !== String(v).trim() ? v : n;
  }

  function mount(stageEl) {
    if (stageEl.getAttribute("data-stage-ready")) return;
    var name = stageEl.getAttribute("data-scene");
    var factory = defs[name];
    if (!factory) return;
    var canvas = stageEl.querySelector("canvas.scene-canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    stageEl.setAttribute("data-stage-ready", "true");
    canvas.style.touchAction = "pan-y";

    if (!C) C = readColours();
    var fig = stageEl.closest("figure") || stageEl.parentNode;
    var S = { ctx: ctx, w: 300, h: 150, t: 0, p: {}, C: C, canvas: canvas, el: stageEl };
    S.k = makeKit(S);

    var controls = Array.prototype.slice.call(fig.querySelectorAll("[data-param]"));
    controls.forEach(function (c) {
      var key = c.getAttribute("data-param");
      if (c.tagName === "BUTTON") {
        if (c.getAttribute("aria-pressed") === "true" || !(key in S.p)) S.p[key] = numberOrString(c.getAttribute("data-value"));
      } else {
        S.p[key] = parseFloat(c.value);
      }
    });

    var def = factory(S) || {};
    var still = !!def.still;
    var duration = def.duration || 0;
    var settle = def.settle != null ? def.settle : (duration || 0);
    var visible = false;
    var running = false;
    var last = 0;
    var started = false;

    function readouts() {
      if (!def.readouts) return;
      var out = def.readouts(S.p) || {};
      Object.keys(out).forEach(function (key) {
        Array.prototype.slice.call(fig.querySelectorAll('[data-out="' + key + '"]')).forEach(function (el) {
          if (el.textContent !== out[key]) el.textContent = out[key];
        });
      });
    }

    function draw() {
      ctx.setTransform(S.dpr || 1, 0, 0, S.dpr || 1, 0, 0);
      S.k.clear();
      def.draw(S);
    }

    function resize() {
      var w = canvas.clientWidth || 300;
      var h = canvas.clientHeight || 150;
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      S.w = w;
      S.h = h;
      S.dpr = dpr;
      var bw = Math.round(w * dpr);
      var bh = Math.round(h * dpr);
      if (canvas.width !== bw) canvas.width = bw;
      if (canvas.height !== bh) canvas.height = bh;
      draw();
    }

    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      S.t += dt;
      S.dt = dt;
      if (duration && S.t >= duration) {
        S.t = duration;
        draw();
        running = false;
        return;
      }
      draw();
      global.requestAnimationFrame(frame);
    }

    function play() {
      if (still || reduced || running || !visible) return;
      if (duration && S.t >= duration) return;
      running = true;
      last = 0;
      global.requestAnimationFrame(frame);
    }

    function pause() {
      running = false;
    }

    function setControl(c) {
      var key = c.getAttribute("data-param");
      if (c.tagName === "BUTTON") {
        S.p[key] = numberOrString(c.getAttribute("data-value"));
        controls.forEach(function (o) {
          if (o.tagName === "BUTTON" && o.getAttribute("data-param") === key) {
            o.setAttribute("aria-pressed", o === c ? "true" : "false");
          }
        });
      } else {
        S.p[key] = parseFloat(c.value);
      }
      if (def.onParam) def.onParam(S.p, key);
      readouts();
      if (!running) draw();
    }

    controls.forEach(function (c) {
      c.addEventListener(c.tagName === "BUTTON" ? "click" : "input", function () { setControl(c); });
    });

    var replay = stageEl.querySelector("[data-replay]");
    if (replay) {
      replay.addEventListener("click", function () {
        S.t = reduced ? settle : 0;
        if (def.onReplay) def.onReplay(S);
        if (reduced) {
          draw();
          return;
        }
        play();
      });
    }

    if (reduced || still) S.t = settle;
    readouts();
    resize();

    if (global.ResizeObserver) {
      new global.ResizeObserver(function () { resize(); }).observe(canvas);
    } else {
      global.addEventListener("resize", resize);
    }

    if (global.IntersectionObserver) {
      new global.IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible) {
            if (!started) {
              started = true;
              if (!stageEl.hasAttribute("data-autoplay") && !still) S.t = settle;
            }
            play();
          } else {
            pause();
          }
        });
      }, { threshold: 0.15 }).observe(stageEl);
    } else {
      visible = true;
      play();
    }

    var api = {
      el: stageEl,
      S: S,
      redraw: draw,
      settleFrame: function () {
        pause();
        S.t = settle;
        draw();
      },
      resume: function () {
        if (!reduced && !still && duration && S.t >= duration) return;
        play();
      }
    };
    stageEl.b8 = api;
    mounted.push(api);
  }

  function boot() {
    Array.prototype.slice.call(document.querySelectorAll(".stage[data-scene]")).forEach(mount);
  }

  /* Print and PDF export use the settled frame of every scene. */
  global.addEventListener("beforeprint", function () {
    mounted.forEach(function (m) { m.settleFrame(); });
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      mounted.forEach(function (m) { m.redraw(); });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.B8Stage = { scene: scene, boot: boot, mounted: mounted };
})(window);
