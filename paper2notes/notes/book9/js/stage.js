/* Book 9 stage runner: every Book 9 figure stage uses it.

   Markup contract (same as Books 4 and 5):
     <div class="visual play stage" id="X" data-scene="name" [data-autoplay]>
       <canvas class="scene-canvas" aria-label="..."></canvas>
       <span class="hud-label" data-hud="key">text</span>
       <div class="stage-controls"><button class="stage-replay" data-replay="X">Replay</button></div>
     </div>
   Controls under the figure carry data-for="X" plus data-key (and data-value for
   buttons). Readouts carry data-out-for="X" data-out="key".

   Scenes are flat 2D diagrams, so they draw on a 2D canvas with a fixed view (no
   orbit, no zoom). A scene is registered with B9Stage.scene(name, def):
     def.box      logical size [w, h]; 640 x 320 by default, 640 x 480 for .tall
     def.duration seconds for a finite clip (gets Replay); omit for a loop
     def.still    time shown when motion is reduced (default: duration or 0)
     def.state    initial control values
     def.draw(g, t, state)  draws one frame at time t
   Drawing uses logical coordinates; stroke widths and text sizes are CSS pixels,
   so lines and labels stay readable at 390px as well as 1280px. */
(function (global) {
  "use strict";

  var defs = {};
  var reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var colours = null;

  function token(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }

  function palette() {
    if (colours) return colours;
    colours = {
      ink: token("--fig-ink", "#17212B"),
      guide: token("--fig-guide", "#B9B2A1"),
      bg: token("--fig-bg", "#FFFFFF"),
      muted: token("--ink-2", "#4A5562"),
      faint: token("--ink-3", "#6E7885"),
      line: token("--line", "#E6E0D2"),
      lineSoft: token("--line-soft", "#F0EBDF"),
      paper: token("--paper", "#FAF7F0"),
      force: token("--fig-force", "#D64545"),
      velocity: token("--fig-velocity", "#2A62A8"),
      accel: token("--fig-accel", "#E07B1F"),
      displacement: token("--fig-displacement", "#7A4FC2"),
      distance: token("--fig-distance", "#2A8FA8"),
      energy: token("--fig-energy", "#C89A10"),
      field: token("--fig-field", "#1F9585"),
      alpha: token("--fig-alpha", "#C0392B"),
      beta: token("--fig-beta", "#1D4F91"),
      gamma: token("--fig-gamma", "#B8901A"),
      teal50: token("--teal-50", "#E8F4F1"),
      teal100: token("--teal-100", "#CFE8E2"),
      teal300: token("--teal-300", "#6FBFB0"),
      teal600: token("--teal-600", "#137568"),
      teal700: token("--teal-700", "#0F5C54"),
      sun100: token("--sun-100", "#FDF1D3"),
      sun400: token("--sun-400", "#F5B83D"),
      sun700: token("--sun-700", "#9A6A05"),
      ok: token("--ok", "#1F9D5C"),
      nudge: token("--nudge", "#D9822B"),
      fontBody: token("--font-body", "system-ui, sans-serif"),
      fontMono: token("--font-mono", "ui-monospace, monospace")
    };
    return colours;
  }

  function scene(name, def) {
    defs[name] = def;
  }

  /* ---------- drawing surface ---------- */

  function Surface(host, canvas, box) {
    this.host = host;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = box[0];
    this.H = box[1];
    this.s = 1;
    this.ox = 0;
    this.oy = 0;
    this.dpr = 1;
    this.c = palette();
    this.huds = {};
    var self = this;
    Array.prototype.forEach.call(host.querySelectorAll("[data-hud]"), function (el) {
      self.huds[el.getAttribute("data-hud")] = el;
    });
  }

  Surface.prototype.fit = function () {
    var cw = this.canvas.clientWidth || this.canvas.width;
    var ch = this.canvas.clientHeight || this.canvas.height;
    this.dpr = Math.min(global.devicePixelRatio || 1, 2);
    var pw = Math.round(cw * this.dpr);
    var ph = Math.round(ch * this.dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
    }
    this.cw = cw;
    this.ch = ch;
    this.s = Math.min(cw / this.W, ch / this.H);
    this.ox = (cw - this.W * this.s) / 2;
    this.oy = (ch - this.H * this.s) / 2;
  };

  Surface.prototype.clear = function () {
    var ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.c.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.dpr * this.s, 0, 0, this.dpr * this.s, this.dpr * this.ox, this.dpr * this.oy);
  };

  /* CSS px -> logical units */
  Surface.prototype.px = function (n) {
    return n / this.s;
  };

  Surface.prototype.style = function (o) {
    var ctx = this.ctx;
    o = o || {};
    ctx.strokeStyle = o.c || this.c.ink;
    ctx.fillStyle = o.fill || o.c || this.c.ink;
    ctx.lineWidth = this.px(o.w != null ? o.w : 2.5);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(o.dash ? o.dash.map(this.px, this) : []);
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
  };

  Surface.prototype.line = function (x1, y1, x2, y2, o) {
    this.style(o);
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  Surface.prototype.poly = function (pts, o) {
    o = o || {};
    this.style(o);
    var ctx = this.ctx;
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
    if (o.close) ctx.closePath();
    if (o.fill) {
      ctx.fillStyle = o.fill;
      ctx.fill();
    }
    if (o.c || !o.fill) ctx.stroke();
    ctx.globalAlpha = 1;
  };

  Surface.prototype.rect = function (x, y, w, h, o) {
    o = o || {};
    this.style(o);
    var ctx = this.ctx;
    ctx.beginPath();
    var r = o.r ? Math.min(o.r, w / 2, h / 2) : 0;
    if (r) {
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
    if (o.c) ctx.stroke();
    ctx.globalAlpha = 1;
  };

  Surface.prototype.circle = function (x, y, r, o) {
    o = o || {};
    this.style(o);
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (o.fill) {
      ctx.fillStyle = o.fill;
      ctx.fill();
    }
    if (o.c) ctx.stroke();
    ctx.globalAlpha = 1;
  };

  Surface.prototype.ellipse = function (x, y, rx, ry, o) {
    o = o || {};
    this.style(o);
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(rx, 0.01), Math.max(ry, 0.01), o.rot || 0, 0, Math.PI * 2);
    if (o.fill) {
      ctx.fillStyle = o.fill;
      ctx.fill();
    }
    if (o.c) ctx.stroke();
    ctx.globalAlpha = 1;
  };

  /* Filled arrowhead at (x2, y2); head length in CSS px. */
  Surface.prototype.arrow = function (x1, y1, x2, y2, o) {
    o = o || {};
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var head = this.px(o.head || 10);
    var ux = dx / len;
    var uy = dy / len;
    var bx = x2 - ux * head;
    var by = y2 - uy * head;
    this.line(x1, y1, bx, by, o);
    var ctx = this.ctx;
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    ctx.fillStyle = o.c || this.c.ink;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(bx - uy * head * 0.45, by + ux * head * 0.45);
    ctx.lineTo(bx + uy * head * 0.45, by - ux * head * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  /* Text at a fixed CSS size (default 13px), never below 12px. */
  Surface.prototype.text = function (str, x, y, o) {
    o = o || {};
    var ctx = this.ctx;
    var size = Math.max(12, o.size || 13);
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    ctx.font = (o.weight || 700) + " " + this.px(size) + "px " + (o.mono ? this.c.fontMono : this.c.fontBody);
    ctx.textAlign = o.align || "center";
    ctx.textBaseline = o.base || "middle";
    if (o.halo !== false) {
      ctx.lineWidth = this.px(4);
      ctx.strokeStyle = this.c.bg;
      ctx.lineJoin = "round";
      ctx.setLineDash([]);
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = o.c || this.c.ink;
    ctx.fillText(str, x, y);
    ctx.globalAlpha = 1;
  };

  /* Place a HUD label (its centre) at a logical point; optionally set its text. */
  Surface.prototype.hud = function (key, x, y, text) {
    var el = this.huds[key];
    if (!el) return;
    el.style.left = (this.canvas.offsetLeft + this.ox + x * this.s) + "px";
    el.style.top = (this.canvas.offsetTop + this.oy + y * this.s) + "px";
    if (text != null && el.textContent !== text) el.textContent = text;
    el.hidden = false;
  };

  Surface.prototype.hideHud = function (key) {
    if (this.huds[key]) this.huds[key].hidden = true;
  };

  /* Sine-wave packet along a line, for light, sound or X-ray glyphs. */
  Surface.prototype.wave = function (x1, y1, x2, y2, o) {
    o = o || {};
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len;
    var uy = dy / len;
    var amp = o.amp != null ? o.amp : 6;
    var cycles = o.cycles || len / 18;
    var pts = [];
    var n = Math.max(24, Math.round(cycles * 12));
    for (var i = 0; i <= n; i += 1) {
      var f = i / n;
      var a = amp * Math.sin(f * cycles * Math.PI * 2 + (o.phase || 0));
      pts.push([x1 + dx * f - uy * a, y1 + dy * f + ux * a]);
    }
    this.poly(pts, o);
    if (o.head) {
      var p = pts[pts.length - 1];
      this.arrow(p[0] - ux * 2, p[1] - uy * 2, p[0] + ux * 8, p[1] + uy * 8, { c: o.c, w: o.w, head: 9 });
    }
  };

  /* ---------- stage lifecycle ---------- */

  function Stage(host) {
    var name = host.getAttribute("data-scene");
    var def = defs[name];
    var canvas = host.querySelector("canvas.scene-canvas");
    this.ok = !!(def && canvas && canvas.getContext);
    if (!this.ok) return;
    this.host = host;
    this.def = def;
    var tall = canvas.classList.contains("tall");
    var box = def.box || (tall ? [640, 480] : [640, 320]);
    this.g = new Surface(host, canvas, box);
    this.state = {};
    var k;
    for (k in def.state || {}) this.state[k] = def.state[k];
    this.t = 0;
    this.playing = false;
    this.paused = false;
    this.visible = false;
    this.last = 0;
    this.raf = 0;
    this.finite = def.duration != null;
    this.still = def.still != null ? def.still : (this.finite ? def.duration : 0);
    this.bindControls();
    if (def.init) def.init(this.state, this);
  }

  Stage.prototype.render = function () {
    this.g.fit();
    this.g.clear();
    this.def.draw(this.g, this.t, this.state, this);
    this.outputs();
  };

  Stage.prototype.out = function (key, text) {
    var id = this.host.id;
    Array.prototype.forEach.call(document.querySelectorAll('[data-out-for="' + id + '"][data-out="' + key + '"]'), function (el) {
      if (el.textContent !== text) el.textContent = text;
    });
  };

  Stage.prototype.outputs = function () {
    if (!this.def.outputs) return;
    var o = this.def.outputs(this.state, this.t);
    for (var k in o) this.out(k, o[k]);
  };

  Stage.prototype.bindControls = function () {
    var self = this;
    var id = this.host.id;
    if (!id) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-for="' + id + '"]'), function (el) {
      var key = el.getAttribute("data-key");
      if (!key) return;
      if (el.tagName === "INPUT") {
        var read = function () {
          self.state[key] = Number(el.value);
          if (self.def.onInput) self.def.onInput(self.state, key, self);
          self.render();
        };
        el.addEventListener("input", read);
        self.state[key] = Number(el.value);
      } else {
        if (el.getAttribute("aria-pressed") === "true") self.state[key] = parseValue(el.getAttribute("data-value"));
        el.addEventListener("click", function () {
          self.state[key] = parseValue(el.getAttribute("data-value"));
          Array.prototype.forEach.call(document.querySelectorAll('[data-for="' + id + '"][data-key="' + key + '"]'), function (b) {
            if (b.tagName === "BUTTON") b.setAttribute("aria-pressed", b === el ? "true" : "false");
          });
          if (self.def.onInput) self.def.onInput(self.state, key, self);
          if (self.finite && self.def.restartOnInput) {
            self.replay();
          } else {
            self.render();
          }
        });
      }
    });
  };

  function parseValue(v) {
    if (v === "true") return true;
    if (v === "false") return false;
    if (v !== null && v !== "" && !isNaN(Number(v))) return Number(v);
    return v;
  }

  Stage.prototype.tick = function (now) {
    var self = this;
    this.raf = 0;
    if (!this.playing || this.paused || !this.visible) return;
    var dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0;
    this.last = now;
    this.t += dt;
    if (this.finite && this.t >= this.def.duration) {
      this.t = this.def.duration;
      this.playing = false;
    }
    this.render();
    if (this.playing) this.raf = requestAnimationFrame(function (n) { self.tick(n); });
  };

  Stage.prototype.play = function () {
    var self = this;
    if (reduceMotion) {
      this.t = this.still;
      this.render();
      return;
    }
    this.playing = true;
    this.last = 0;
    if (!this.raf) this.raf = requestAnimationFrame(function (n) { self.tick(n); });
  };

  Stage.prototype.replay = function () {
    this.t = 0;
    this.paused = false;
    this.syncPause();
    this.play();
    if (reduceMotion) return;
    this.render();
  };

  Stage.prototype.syncPause = function () {
    var btn = this.host.querySelector("[data-pause]");
    if (btn) {
      btn.setAttribute("aria-pressed", this.paused ? "true" : "false");
      btn.textContent = this.paused ? "Play" : "Pause";
    }
  };

  Stage.prototype.settle = function () {
    this.t = this.still;
    this.render();
  };

  var stages = [];

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll(".stage[data-scene]"), function (host) {
      var st = new Stage(host);
      if (!st.ok) return;
      stages.push(st);
      host.__stage = st;
      if (st.finite && !host.getAttribute("data-autoplay")) st.t = st.still;
      st.render();
    });

    document.addEventListener("click", function (ev) {
      var r = ev.target.closest && ev.target.closest("[data-replay]");
      if (r) {
        var host = document.getElementById(r.getAttribute("data-replay"));
        if (host && host.__stage) host.__stage.replay();
        return;
      }
      var p = ev.target.closest && ev.target.closest("[data-pause]");
      if (p) {
        var h = document.getElementById(p.getAttribute("data-pause"));
        var s = h && h.__stage;
        if (!s) return;
        s.paused = !s.paused;
        s.syncPause();
        if (!s.paused) {
          if (s.finite && s.t >= s.def.duration) s.t = 0;
          s.play();
        }
      }
    });

    var lastPlay = new WeakMap();
    if (typeof IntersectionObserver === "function") {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var st = entry.target.__stage;
          if (!st) return;
          st.visible = entry.isIntersecting;
          if (!entry.isIntersecting) return;
          if (!st.host.hasAttribute("data-autoplay")) {
            st.render();
            return;
          }
          if (st.finite) {
            /* Finite clips start again when the box comes back into view, so a
               clip is never found already finished. */
            var now = performance.now();
            if (now - (lastPlay.get(st) || -1e9) < 1200) return;
            lastPlay.set(st, now);
            if (st.t >= st.def.duration || !st.playing) st.t = 0;
          }
          if (!st.paused) st.play();
        });
      }, { threshold: 0.35 });
      stages.forEach(function (st) { io.observe(st.host); });
    } else {
      stages.forEach(function (st) {
        st.visible = true;
        if (st.host.hasAttribute("data-autoplay")) st.play();
      });
    }

    var resizeTimer = 0;
    global.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        stages.forEach(function (st) { st.render(); });
      }, 80);
    });
    global.addEventListener("beforeprint", function () {
      stages.forEach(function (st) {
        st.playing = false;
        st.settle();
      });
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        stages.forEach(function (st) { st.render(); });
      });
    }

    initIdeaChips();
  }

  /* Idea chips: mark the chip of the idea currently in view. */
  function initIdeaChips() {
    var nav = document.querySelector(".idea-chips");
    if (!nav || typeof IntersectionObserver !== "function") return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    var inView = {};
    function mark() {
      var current = null;
      sections.forEach(function (sec) { if (inView[sec.id]) current = current || sec.id; });
      if (!current) return;
      links.forEach(function (a) {
        if (a === byId[current]) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { inView[e.target.id] = e.isIntersecting; });
      mark();
    }, { rootMargin: "-20% 0px -55% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  global.B9Stage = { scene: scene, palette: palette };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    setTimeout(boot, 0);
  }
})(window);
