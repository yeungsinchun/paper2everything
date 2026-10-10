/* Book 3 figure engine: 2D canvas stages shared by every chapter.

   Markup contract (one per figure):
     <figure class="fig" id="...">
       <div class="visual play stage" id="x-vis" data-scene="name" [data-autoplay]>
         <canvas class="scene-canvas" aria-label="..."></canvas>
         <span class="hud-label" data-hud="key">label</span>
         [<button type="button" class="stage-replay" data-replay="x-vis">Replay</button>]
       </div>
       <figcaption>...</figcaption>
       [<div class="sim-controls">
          <div class="row"><label class="row-label" for="id">...</label>
            <input id="id" type="range" data-param="p" ...>
            <output class="readout" data-out="p">...</output></div>
          <div class="row"><button type="button" data-param="mode" data-value="a">A</button>...</div>
          <span class="readout" data-out="key"></span>
        </div>]
     </figure>

   A scene file registers builders with B3.scene(name, builder). A builder gets
   an api and returns { draw(t), clip } where clip is the length in seconds of a
   finite clip (it holds its last frame and gets a Replay button) or 0 for a
   loop. Wave figures are flat, so the camera never moves and nothing zooms.

   Motion rules (PRD 6.5): a stage animates only while on screen; with
   prefers-reduced-motion it draws one settled frame (the end of a clip, or
   the frame at `settle` seconds for a loop) and redraws only when a control
   changes. Canvas 2D needs no WebGL, so there is no blank-box failure mode. */
(function (global) {
  "use strict";

  var builders = {};
  var mounted = [];
  var frozen = false;
  var REDUCED = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  /* Physics colours are semantic and match the design-system figure palette. */
  function palette() {
    return {
      ink: cssVar("--fig-ink", "#17212B"),
      muted: cssVar("--ink-3", "#6E7885"),
      guide: cssVar("--fig-guide", "#B9B2A1"),
      line: cssVar("--line", "#E6E0D2"),
      disp: cssVar("--fig-displacement", "#7A4FC2"),
      vel: cssVar("--fig-velocity", "#2A62A8"),
      dist: cssVar("--fig-distance", "#2A8FA8"),
      energy: cssVar("--fig-energy", "#C89A10"),
      field: cssVar("--fig-field", "#1F9585"),
      accent: cssVar("--teal-600", "#137568"),
      soft: cssVar("--teal-50", "#E8F4F1"),
      sun: cssVar("--sun-100", "#FDF1D3"),
      bg: "#ffffff"
    };
  }

  function scene(name, builder) {
    builders[name] = builder;
  }

  function Api(host) {
    var canvas = host.querySelector("canvas");
    var ctx = canvas.getContext("2d");
    var fig = host.closest("figure") || host.parentNode;
    var self = this;
    var world = { x0: -1, x1: 1, y0: -1, y1: 1 };
    var map = { s: 1, ox: 0, oy: 0 };
    var params = {};
    var listeners = [];

    this.host = host;
    this.canvas = canvas;
    this.ctx = ctx;
    this.fig = fig;
    this.C = palette();
    this.W = 0;
    this.H = 0;

    /* World box in scene units, y up. The box is fitted inside the canvas and
       centred, so the apparatus fills the frame at every width. */
    this.view = function (x0, x1, y0, y1) {
      world = { x0: x0, x1: x1, y0: y0, y1: y1 };
      self.resize();
    };

    this.resize = function () {
      var w = canvas.clientWidth || canvas.width || 600;
      var h = canvas.clientHeight || canvas.height || 300;
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      self.W = w;
      self.H = h;
      var ww = world.x1 - world.x0;
      var wh = world.y1 - world.y0;
      map.s = Math.min(w / ww, h / wh);
      map.ox = (w - ww * map.s) / 2 - world.x0 * map.s;
      map.oy = (h + wh * map.s) / 2 + world.y0 * map.s;
    };

    this.X = function (x) { return map.ox + x * map.s; };
    this.Y = function (y) { return map.oy - y * map.s; };
    this.S = function (d) { return d * map.s; };
    /* inverse map, for pointer input */
    this.toWorld = function (px, py) { return { x: (px - map.ox) / map.s, y: (map.oy - py) / map.s }; };
    this.narrow = function () { return self.W < 480; };

    this.clear = function () {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    /* ---- drawing helpers, all in world units ---- */
    this.stroke = function (color, width, dash) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width || 2;
      ctx.setLineDash(dash || []);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
    this.line = function (x1, y1, x2, y2, color, width, dash) {
      self.stroke(color, width, dash);
      ctx.beginPath();
      ctx.moveTo(self.X(x1), self.Y(y1));
      ctx.lineTo(self.X(x2), self.Y(y2));
      ctx.stroke();
      ctx.setLineDash([]);
    };
    this.path = function (pts, color, width, dash, close, fill) {
      if (!pts.length) return;
      ctx.beginPath();
      ctx.moveTo(self.X(pts[0][0]), self.Y(pts[0][1]));
      for (var i = 1; i < pts.length; i += 1) ctx.lineTo(self.X(pts[i][0]), self.Y(pts[i][1]));
      if (close) ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (color) {
        self.stroke(color, width, dash);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    };
    /* y = f(x) sampled across [xa, xb] */
    this.curve = function (f, xa, xb, color, width, dash, n) {
      var pts = [];
      var steps = n || Math.max(40, Math.round(self.S(xb - xa) / 3));
      for (var i = 0; i <= steps; i += 1) {
        var x = xa + (xb - xa) * i / steps;
        pts.push([x, f(x)]);
      }
      self.path(pts, color, width, dash);
    };
    this.dot = function (x, y, rPx, fill, ring) {
      ctx.beginPath();
      ctx.arc(self.X(x), self.Y(y), rPx, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (ring) {
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeStyle = ring;
        ctx.stroke();
      }
    };
    this.arrow = function (x1, y1, x2, y2, color, width, headPx) {
      var X1 = self.X(x1), Y1 = self.Y(y1), X2 = self.X(x2), Y2 = self.Y(y2);
      var len = Math.hypot(X2 - X1, Y2 - Y1);
      if (len < 1) return;
      var h = Math.min(headPx || 10, len * 0.6);
      var ux = (X2 - X1) / len, uy = (Y2 - Y1) / len;
      self.stroke(color, width || 2);
      ctx.beginPath();
      ctx.moveTo(X1, Y1);
      ctx.lineTo(X2 - ux * h * 0.6, Y2 - uy * h * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X2, Y2);
      ctx.lineTo(X2 - ux * h - uy * h * 0.5, Y2 - uy * h + ux * h * 0.5);
      ctx.lineTo(X2 - ux * h + uy * h * 0.5, Y2 - uy * h - ux * h * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    /* two-headed bracket for a length such as a wavelength or an amplitude */
    this.span = function (x1, y1, x2, y2, color) {
      self.arrow((x1 + x2) / 2, (y1 + y2) / 2, x1, y1, color, 1.6, 8);
      self.arrow((x1 + x2) / 2, (y1 + y2) / 2, x2, y2, color, 1.6, 8);
    };
    this.rect = function (x, y, w, h, fill, color, width) {
      ctx.beginPath();
      ctx.rect(self.X(x), self.Y(y + h), self.S(w), self.S(h));
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (color) {
        self.stroke(color, width || 1.5);
        ctx.stroke();
      }
    };
    /* small canvas text for axis ticks only; object labels are HUD spans */
    this.text = function (str, x, y, color, align, sizePx, base) {
      ctx.fillStyle = color || self.C.muted;
      ctx.font = "600 " + (sizePx || 12) + "px Nunito, system-ui, sans-serif";
      ctx.textAlign = align || "center";
      ctx.textBaseline = base || "middle";
      ctx.fillText(str, self.X(x), self.Y(y));
    };

    /* ---- HUD labels: real DOM text, kept on their objects ---- */
    var huds = {};
    var order = [];
    Array.prototype.forEach.call(host.querySelectorAll("[data-hud]"), function (el) {
      huds[el.getAttribute("data-hud")] = el;
    });
    this.hud = function (key, x, y, textValue, hide) {
      var el = huds[key];
      if (!el) return;
      if (textValue != null && el.textContent !== textValue) el.textContent = textValue;
      el.style.left = (canvas.offsetLeft + self.X(x)) + "px";
      el.style.top = (canvas.offsetTop + self.Y(y)) + "px";
      el.hidden = !!hide;
      if (!hide && order.indexOf(el) < 0) order.push(el);
    };
    /* Labels never overlap (PRD 6.3): placed in call order, a label that
       would cover one placed earlier in the same frame is hidden. */
    this.settleHuds = function () {
      var kept = [];
      order.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var clash = kept.some(function (k) {
          return r.left < k.right + 2 && r.right > k.left - 2 && r.top < k.bottom + 1 && r.bottom > k.top - 1;
        });
        if (clash) el.hidden = true;
        else kept.push(r);
      });
      order = [];
    };

    /* ---- controls ---- */
    this.param = function (name, fallback) {
      if (!(name in params)) params[name] = fallback;
      return params[name];
    };
    this.set = function (name, value) {
      params[name] = value;
      listeners.forEach(function (fn) { fn(name, value); });
    };
    this.onParam = function (fn) { listeners.push(fn); };
    this.out = function (key, textValue) {
      Array.prototype.forEach.call(fig.querySelectorAll('[data-out="' + key + '"]'), function (el) {
        if (el.textContent !== textValue) el.textContent = textValue;
      });
    };
    this.params = params;
  }

  function bindControls(api, redraw) {
    var fig = api.fig;
    Array.prototype.forEach.call(fig.querySelectorAll("input[data-param]"), function (input) {
      var name = input.getAttribute("data-param");
      var num = input.type === "range" || input.type === "number";
      api.params[name] = num ? parseFloat(input.value) : input.value;
      input.addEventListener("input", function () {
        api.set(name, num ? parseFloat(input.value) : input.value);
        redraw();
      });
    });
    Array.prototype.forEach.call(fig.querySelectorAll("button[data-param]"), function (btn) {
      var name = btn.getAttribute("data-param");
      if (btn.getAttribute("aria-pressed") === "true") api.params[name] = btn.getAttribute("data-value");
      btn.addEventListener("click", function () {
        api.set(name, btn.getAttribute("data-value"));
        Array.prototype.forEach.call(fig.querySelectorAll('button[data-param="' + name + '"]'), function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        redraw();
      });
    });
  }

  function mount(host) {
    var name = host.getAttribute("data-scene");
    var build = builders[name];
    if (!build) return;
    var api = new Api(host);
    var sceneObj;
    try {
      sceneObj = build(api) || {};
    } catch (err) {
      if (global.console) console.error("Book 3 scene failed:", name, err);
      return;
    }
    var clip = sceneObj.clip || 0;
    var settle = sceneObj.settle != null ? sceneObj.settle : clip;
    var t0 = null;
    var tNow = REDUCED ? settle : 0;
    var running = false;
    var visible = false;
    var raf = 0;

    function paint(t) {
      api.resize();
      api.clear();
      sceneObj.draw(t);
      api.settleHuds();
    }

    function tick(now) {
      raf = 0;
      if (!running) return;
      if (t0 == null) t0 = now;
      tNow = (now - t0) / 1000;
      if (clip && tNow >= clip) {
        tNow = clip;
        paint(tNow);
        running = false;
        return;
      }
      paint(tNow);
      raf = global.requestAnimationFrame(tick);
    }

    function start(fromZero) {
      if (REDUCED || frozen) {
        paint(settle);
        return;
      }
      if (fromZero) {
        t0 = null;
        tNow = 0;
      } else if (t0 != null) {
        t0 = performance.now() - tNow * 1000;
      }
      if (clip && tNow >= clip && !fromZero) {
        paint(tNow);
        return;
      }
      running = true;
      if (!raf) raf = global.requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (raf) global.cancelAnimationFrame(raf);
      raf = 0;
    }

    /* A control change redraws at once; a loop that is running picks it up
       on its next frame anyway. */
    function redraw() {
      if (!running) paint(REDUCED ? settle : tNow);
    }

    mounted.push({
      freeze: function () {
        stop();
        tNow = settle;
        paint(settle);
      }
    });

    bindControls(api, redraw);
    if (sceneObj.ready) sceneObj.ready(redraw);
    paint(tNow);

    host.addEventListener("notes-replay", function () {
      if (visible || REDUCED) start(true);
    });
    global.addEventListener("resize", function () { redraw(); });

    if (typeof IntersectionObserver === "function") {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible = entry.isIntersecting;
          if (visible) start(clip ? (tNow >= clip) : false);
          else stop();
        });
      }, { threshold: 0.3 }).observe(host);
    } else {
      visible = true;
      start(true);
    }
  }

  function initReplays() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-replay]"), function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.getAttribute("data-replay"));
        if (target) target.dispatchEvent(new Event("notes-replay"));
      });
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll(".stage[data-scene]"), mount);
    initReplays();
  }

  /* Print and still captures: stop every loop and draw its settled frame. */
  function freeze() {
    frozen = true;
    mounted.forEach(function (m) { m.freeze(); });
  }
  global.addEventListener("beforeprint", freeze);

  global.B3 = { scene: scene, reduced: REDUCED, freeze: freeze };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
