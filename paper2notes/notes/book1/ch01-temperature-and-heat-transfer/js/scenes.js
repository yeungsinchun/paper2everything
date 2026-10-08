/* Book 1 Ch.1 scenes: temperature, heat and the three ways heat travels.
   Registered with the shared runner in ../../js/diagrams3d.js. All 2D canvas. */
(function () {
  "use strict";

  var S = window.Book1Stage;
  if (!S) return;
  var C = S.colours;

  /* Pick a design box that fills the canvas: wide on a laptop, taller on a phone. */
  function frame(ctx, wide, narrow) { return ctx.frame(wide, narrow); }

  /* Point at arc length s (0..1) along a polyline [[x,y],...]. */
  function along(poly, s) {
    var lens = [];
    var total = 0;
    var i;
    for (i = 1; i < poly.length; i += 1) {
      var l = Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
      lens.push(l);
      total += l;
    }
    var d = s * total;
    for (i = 0; i < lens.length; i += 1) {
      if (d <= lens[i] || i === lens.length - 1) {
        var u = lens[i] ? Math.min(1, d / lens[i]) : 0;
        return {
          x: poly[i][0] + (poly[i + 1][0] - poly[i][0]) * u,
          y: poly[i][1] + (poly[i + 1][1] - poly[i][1]) * u,
          a: Math.atan2(poly[i + 1][1] - poly[i][1], poly[i + 1][0] - poly[i][0])
        };
      }
      d -= lens[i];
    }
    return { x: poly[0][0], y: poly[0][1], a: 0 };
  }

  /* A short travelling wave packet centred at (x, y) heading at angle a. */
  function packet(ctx, x, y, a, opt) {
    var len = opt.len || 46;
    ctx.wavy(ctx.g, x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2,
      x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2,
      { colour: opt.colour, amp: opt.amp || 5, waves: opt.waves || 3, width: opt.width || 2.6, phase: opt.phase || 0 });
  }

  /* ---------- 1.1 B: Celsius fixed points (finite clip) ---------- */

  S.register("celsius", {
    mode: "2d",
    build: function (ctx) {
      var g = ctx.g;
      var Y0 = 170;   /* column top at 0 °C */
      var Y100 = 42;  /* column top at 100 °C */
      var yRoom = Y0 - 0.25 * (Y0 - Y100);
      function beaker(x, kind, t) {
        var w = ctx.w / Math.max(ctx.h, 1) > 1.7 ? 150 : 120;
        var top = 178;
        var bottom = 268;
        g.fillStyle = C.coldSoft;
        g.fillRect(x - w / 2, 200, w, bottom - 200);
        if (kind === "ice") {
          var r = ctx.rng(7);
          for (var i = 0; i < 9; i += 1) {
            var cx = x - w / 2 + 14 + r() * (w - 28);
            var cy = 210 + r() * 48;
            ctx.roundRect(g, cx - 9, cy - 8, 18, 16, 3);
            g.fillStyle = "#ffffff";
            g.fill();
            g.strokeStyle = C.guide;
            g.lineWidth = 1;
            g.stroke();
          }
        } else {
          for (var b = 0; b < 10; b += 1) {
            var bx = x - w / 2 + 14 + ((b * 37) % (w - 28));
            var by = 264 - ((t * 60 + b * 23) % 60);
            ctx.dot(g, bx, by, 3 + (b % 3), "#ffffff", C.guide);
          }
          for (var s = 0; s < 3; s += 1) {
            g.save();
            g.strokeStyle = C.guide;
            g.lineWidth = 2;
            g.beginPath();
            for (var k = 0; k <= 20; k += 1) {
              var yy = 190 - k * 2.4;
              var xx = x - 40 + s * 40 + 6 * Math.sin(k * 0.6 + t * 4 + s);
              if (k === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
            }
            g.stroke();
            g.restore();
          }
        }
        g.strokeStyle = C.ink3;
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(x - w / 2, top);
        g.lineTo(x - w / 2, bottom);
        g.lineTo(x + w / 2, bottom);
        g.lineTo(x + w / 2, top);
        g.stroke();
      }
      function thermometer(x, dy, level, marks, ticks) {
        var top = 20 + dy;
        var bulbY = 252 + dy;
        g.fillStyle = "#ffffff";
        ctx.roundRect(g, x - 9, top, 18, bulbY - top, 9);
        g.fill();
        g.strokeStyle = C.ink2;
        g.lineWidth = 2;
        g.stroke();
        g.fillStyle = C.hot;
        g.fillRect(x - 3, level + dy, 6, bulbY - (level + dy));
        ctx.dot(g, x, bulbY, 15, C.hot, C.ink2);
        g.strokeStyle = C.ink;
        g.lineWidth = 2;
        if (marks.ice > 0) {
          g.globalAlpha = marks.ice;
          g.beginPath();
          g.moveTo(x + 9, Y0 + dy);
          g.lineTo(x + 26, Y0 + dy);
          g.stroke();
          g.globalAlpha = 1;
        }
        if (marks.steam > 0) {
          g.globalAlpha = marks.steam;
          g.beginPath();
          g.moveTo(x + 9, Y100 + dy);
          g.lineTo(x + 26, Y100 + dy);
          g.stroke();
          g.globalAlpha = 1;
        }
        if (ticks > 0) {
          g.lineWidth = 1.2;
          var n = Math.floor(ticks * 9 + 0.0001);
          for (var i = 1; i <= n; i += 1) {
            var y = Y0 - (i / 10) * (Y0 - Y100) + dy;
            g.beginPath();
            g.moveTo(x + 9, y);
            g.lineTo(x + 19, y);
            g.stroke();
          }
        }
      }
      return {
        duration: 9.8,
        settle: 9.8,
        draw: function (t) {
          var f = frame(ctx, [720, 300], [440, 300]);
          var xIce = f.wide ? 170 : 105;
          var xSteam = f.wide ? 550 : 335;
          beaker(xIce, "ice", t);
          beaker(xSteam, "steam", t);
          var x = xIce;
          var dy = 0;
          var level;
          if (t < 3.4) {
            level = ctx.lerp(yRoom, Y0, ctx.ease((t - 0.4) / 2.6));
          } else if (t < 4.6) {
            var u = (t - 3.4) / 1.2;
            x = ctx.lerp(xIce, xSteam, ctx.ease(u));
            dy = -80 * Math.sin(Math.PI * ctx.clamp(u, 0, 1));
            level = Y0;
          } else {
            x = xSteam;
            level = ctx.lerp(Y0, Y100, ctx.ease((t - 4.6) / 2.6));
          }
          var marks = {
            ice: ctx.clamp((t - 3.0) / 0.4, 0, 1),
            steam: ctx.clamp((t - 7.2) / 0.4, 0, 1)
          };
          var ticks = ctx.clamp((t - 7.7) / 1.8, 0, 1);
          thermometer(x, dy, level, marks, ticks);
          ctx.placeV("ice", x - 78, Y0 + dy, marks.ice > 0 ? "ice point · 0 °C" : "");
          ctx.placeV("steam", x - 86, Y100 + dy, marks.steam > 0 ? "steam point · 100 °C" : "");
          ctx.placeV("div", f.wide ? x + 96 : x - 82, (Y0 + Y100) / 2 + dy, ticks > 0 ? "100 equal steps" : "");
          ctx.placeV("melt", xIce, 286, "pure melting ice");
          ctx.placeV("boil", xSteam, 286, "pure boiling water");
          var h = ctx.hud("ice");
          if (h) h.hidden = marks.ice <= 0;
          h = ctx.hud("steam");
          if (h) h.hidden = marks.steam <= 0;
          h = ctx.hud("div");
          if (h) h.hidden = ticks <= 0;
        },
        snapshot: function () { return { ice: 0, steam: 100, divisions: 100 }; }
      };
    }
  });

  /* ---------- 1.1 C: calibration by proportion (still, slider) ---------- */

  S.register("calibrate", {
    mode: "2d",
    build: function (ctx) {
      var g = ctx.g;
      var L0 = 4.0;
      var L100 = 22.0;
      var len = 13.0;
      function theta(l) { return (l - L0) / (L100 - L0) * 100; }
      return {
        still: true,
        set: function (key, v) { if (key === "len") len = v; },
        format: function (key, v) { return "ℓ = " + v.toFixed(1) + " cm"; },
        snapshot: function () { return { len: len, theta: theta(len) }; },
        draw: function () {
          var f = frame(ctx, [720, 320], [480, 360]);
          var ox = f.wide ? 230 : 70;
          var oy = f.H - 50;
          var gw = f.wide ? 440 : 380;
          var gh = f.H - 100;
          var X = function (th) { return ox + th / 110 * gw; };
          var Y = function (l) { return oy - l / 25 * gh; };
          /* thermometer column on the left (laptop only, where there is room) */
          if (f.wide) {
            var tx = 110;
            var top = Y(25);
            ctx.roundRect(g, tx - 10, top, 20, oy - top + 6, 10);
            g.fillStyle = "#fff";
            g.fill();
            g.strokeStyle = C.ink2;
            g.lineWidth = 2;
            g.stroke();
            g.fillStyle = C.hot;
            g.fillRect(tx - 3.5, Y(len), 7, oy - Y(len));
            ctx.dot(g, tx, oy + 14, 16, C.hot, C.ink2);
            g.strokeStyle = C.ink;
            g.lineWidth = 1.5;
            [L0, L100].forEach(function (l) {
              g.beginPath();
              g.moveTo(tx + 10, Y(l));
              g.lineTo(tx + 24, Y(l));
              g.stroke();
            });
            g.setLineDash([5, 5]);
            g.strokeStyle = C.guide;
            g.beginPath();
            g.moveTo(tx + 12, Y(len));
            g.lineTo(ox, Y(len));
            g.stroke();
            g.setLineDash([]);
          }
          /* similar triangles */
          var th = theta(len);
          g.fillStyle = "rgba(31,149,133,0.10)";
          g.beginPath();
          g.moveTo(X(0), Y(L0));
          g.lineTo(X(100), Y(L0));
          g.lineTo(X(100), Y(L100));
          g.closePath();
          g.fill();
          g.fillStyle = "rgba(242,107,58,0.18)";
          g.beginPath();
          g.moveTo(X(0), Y(L0));
          g.lineTo(X(th), Y(L0));
          g.lineTo(X(th), Y(len));
          g.closePath();
          g.fill();
          ctx.axes(g, ox, oy, gw + 20, gh + 20);
          ctx.label("θ / °C", ox + gw + 20, oy - ctx.px(14), { align: "right", colour: C.ink2 });
          ctx.label("ℓ / cm", ox + ctx.px(6), oy - gh - 26, { align: "left", colour: C.ink2 });
          [0, 100].forEach(function (v) {
            ctx.label(String(v), X(v), oy + ctx.px(14), { colour: C.ink3, weight: 600 });
          });
          [L0, L100].forEach(function (v) {
            ctx.label(v.toFixed(1), ox - ctx.px(8), Y(v), { align: "right", colour: C.ink3, weight: 600 });
          });
          /* the calibration line */
          g.strokeStyle = C.teal;
          g.lineWidth = ctx.px(3);
          g.beginPath();
          g.moveTo(X(0), Y(L0));
          g.lineTo(X(100), Y(L100));
          g.stroke();
          ctx.dot(g, X(0), Y(L0), ctx.px(5), C.tealDeep);
          ctx.dot(g, X(100), Y(L100), ctx.px(5), C.tealDeep);
          /* guides for the reading */
          g.setLineDash([5, 5]);
          g.strokeStyle = C.ink3;
          g.lineWidth = ctx.px(1.5);
          g.beginPath();
          g.moveTo(ox, Y(len));
          g.lineTo(X(th), Y(len));
          g.lineTo(X(th), oy);
          g.stroke();
          g.setLineDash([]);
          ctx.dot(g, X(th), Y(len), ctx.px(6), C.hot, C.ink);
          ctx.placeV("theta", X(th), oy + ctx.px(36), "θ = " + th.toFixed(1) + " °C");
          ctx.placeV("fixed0", X(0) + ctx.px(48), Y(L0) - ctx.px(16), "ice point");
          ctx.placeV("fixed100", X(100) - ctx.px(10), Y(L100) - ctx.px(18), "steam point");
        }
      };
    }
  });

  /* ---------- 1.2 A: molecules in a cold and a hot body (loop) ---------- */

  S.register("molecules", {
    mode: "2d",
    build: function (ctx) {
      var g = ctx.g;
      var hot = ctx.host.getAttribute("data-temp") === "hot";
      var r = ctx.rng(hot ? 11 : 5);
      var n = 26;
      var W = 420;
      var H = 260;
      var mean = hot ? 150 : 72; /* speeds exaggerated for visibility, not to scale */
      var ps = [];
      for (var i = 0; i < n; i += 1) {
        var sp = mean * (0.45 + 1.1 * r());
        var a = r() * Math.PI * 2;
        ps.push({ x: 30 + r() * (W - 60), y: 30 + r() * (H - 60), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, sp: sp });
      }
      var start = ps.map(function (p) { return { x: p.x, y: p.y, vx: p.vx, vy: p.vy }; });
      var simT = 0;
      function stepTo(t) {
        if (t < simT) {
          ps.forEach(function (p, j) { p.x = start[j].x; p.y = start[j].y; p.vx = start[j].vx; p.vy = start[j].vy; });
          simT = 0;
        }
        while (simT < t) {
          var dt = Math.min(1 / 60, t - simT);
          ps.forEach(function (p) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.x < 18) { p.x = 18; p.vx = Math.abs(p.vx); }
            if (p.x > W - 18) { p.x = W - 18; p.vx = -Math.abs(p.vx); }
            if (p.y < 18) { p.y = 18; p.vy = Math.abs(p.vy); }
            if (p.y > H - 18) { p.y = H - 18; p.vy = -Math.abs(p.vy); }
          });
          simT += dt;
        }
      }
      return {
        settle: 1.2,
        draw: function (t) {
          ctx.view(W, H);
          stepTo(t);
          ctx.roundRect(g, 6, 6, W - 12, H - 12, 12);
          g.fillStyle = hot ? C.hotSoft : C.coldSoft;
          g.fill();
          g.strokeStyle = C.ink3;
          g.lineWidth = 2;
          g.stroke();
          ps.forEach(function (p) {
            var k = (p.sp - 30) / 220;
            g.strokeStyle = "rgba(23,33,43,0.25)";
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.lineTo(p.x - p.vx * 0.09, p.y - p.vy * 0.09);
            g.stroke();
            ctx.dot(g, p.x, p.y, 9, ctx.heatColour(k), C.ink);
          });
          ctx.placeV("avg", W / 2, 26, hot ? "hot: faster on average" : "cold: slower on average");
        },
        snapshot: function () {
          var ke = ps.reduce(function (s, p) { return s + p.vx * p.vx + p.vy * p.vy; }, 0) / ps.length;
          return { hot: hot, meanSquareSpeed: ke };
        }
      };
    }
  });

  /* ---------- 1.2 C: heat flows until the temperatures are equal (finite) ---------- */

  S.register("equilibrium", {
    mode: "2d",
    build: function (ctx) {
      var g = ctx.g;
      var Th0 = 80;
      var Tc0 = 20;
      var Tf = 60; /* the tea has twice the heat capacity of the cup */
      var tau = 1.7;
      function temps(t) {
        var e = Math.exp(-t / tau);
        return { hot: Tf + (Th0 - Tf) * e, cold: Tf - (Tf - Tc0) * e };
      }
      function bar(x, y, h, T) {
        ctx.roundRect(g, x - 8, y, 16, h, 8);
        g.fillStyle = "#fff";
        g.fill();
        g.strokeStyle = C.ink2;
        g.lineWidth = 2;
        g.stroke();
        var fill = (T - 0) / 100 * (h - 10);
        g.fillStyle = C.hot;
        g.fillRect(x - 3, y + h - 6 - fill, 6, fill);
      }
      return {
        duration: 9,
        settle: 9,
        draw: function (t) {
          var f = frame(ctx, [720, 300], [480, 330]);
          var T = temps(t);
          var cx = f.W / 2;
          var top = f.wide ? 70 : 90;
          var bw = f.wide ? 200 : 150;
          var bh = 170;
          /* the two bodies in contact */
          g.fillStyle = ctx.heatColour((T.hot - 20) / 60);
          ctx.roundRect(g, cx - bw - 2, top, bw, bh, 14);
          g.fill();
          g.fillStyle = ctx.heatColour((T.cold - 20) / 60);
          ctx.roundRect(g, cx + 2, top, bw, bh, 14);
          g.fill();
          g.strokeStyle = C.ink;
          g.lineWidth = 2;
          ctx.roundRect(g, cx - bw - 2, top, bw, bh, 14);
          g.stroke();
          ctx.roundRect(g, cx + 2, top, bw, bh, 14);
          g.stroke();
          /* heat packets crossing the contact, at a rate set by the temperature gap */
          var gap = (T.hot - T.cold) / (Th0 - Tc0);
          for (var i = 0; i < 6; i += 1) {
            var u = ((t * 0.9 + i / 6) % 1);
            var x = cx - 60 + u * 120;
            var y = top + 28 + i * 24;
            g.globalAlpha = Math.max(0, gap) * Math.sin(Math.PI * u);
            ctx.arrow(g, x - 22, y, x + 22, y, { colour: C.energy, width: 4, head: 12 });
          }
          g.globalAlpha = 1;
          bar(cx - bw - 30, top + 10, bh - 20, T.hot);
          bar(cx + bw + 30, top + 10, bh - 20, T.cold);
          ctx.placeV("hot", cx - bw / 2, top - 22, "tea " + T.hot.toFixed(0) + " °C");
          ctx.placeV("cold", cx + bw / 2, top - 22, "cup " + T.cold.toFixed(0) + " °C");
          ctx.placeV("flow", cx, top + bh + 26, gap > 0.03 ? "heat flows hot → cold" : "same temperature: heat flow stops");
        },
        snapshot: function () { var T = temps(9); return { hot: T.hot, cold: T.cold, final: Tf }; }
      };
    }
  });

  /* ---------- 1.3 A: convection current in a tank (loop) ---------- */

  S.register("convection", {
    mode: "2d",
    build: function (ctx) {
      var g = ctx.g;
      var r = ctx.rng(3);
      var dots = [];
      for (var i = 0; i < 70; i += 1) dots.push({ s: r(), lane: r(), speed: 0.07 + 0.03 * r() });
      return {
        settle: 2.5,
        draw: function (t) {
          var f = frame(ctx, [720, 300], [480, 340]);
          var x0 = f.wide ? 150 : 40;
          var x1 = f.W - x0;
          var y0 = 30;
          var y1 = f.H - 40;
          g.fillStyle = C.coldSoft;
          g.fillRect(x0, y0, x1 - x0, y1 - y0);
          g.strokeStyle = C.ink3;
          g.lineWidth = 3;
          g.beginPath();
          g.moveTo(x0, y0 - 10);
          g.lineTo(x0, y1);
          g.lineTo(x1, y1);
          g.lineTo(x1, y0 - 10);
          g.stroke();
          /* heater under the left side */
          var hx = x0 + (x1 - x0) * 0.2;
          g.fillStyle = C.hot;
          ctx.roundRect(g, hx - 40, y1 + 8, 80, 12, 6);
          g.fill();
          /* circulation: up on the heated side, across the top, down the far side, back along the bottom */
          dots.forEach(function (d) {
            var inset = 20 + d.lane * ((y1 - y0) / 2 - 40);
            var loop = [
              [hx, y1 - inset * 0.6],
              [hx, y0 + inset],
              [x1 - inset, y0 + inset],
              [x1 - inset, y1 - inset],
              [hx, y1 - inset * 0.6]
            ];
            var p = along(loop, (d.s + t * d.speed) % 1);
            var warm = p.x < hx + 10 && p.y < y1 ? 1 : 0;
            var k = 0.15;
            /* warm while rising and along the top; cools on the way down */
            var seg = (d.s + t * d.speed) % 1;
            if (seg < 0.25) k = 0.95;
            else if (seg < 0.55) k = 0.95 - (seg - 0.25) * 2.6;
            else k = 0.15;
            ctx.dot(g, p.x, p.y, 5, ctx.heatColour(Math.max(k, warm * 0.9)), null);
          });
          ctx.arrow(g, hx + 30, y1 - 60, hx + 30, y0 + 50, { colour: C.hot, width: 3, dash: [8, 6] });
          ctx.arrow(g, x1 - 40, y0 + 50, x1 - 40, y1 - 50, { colour: C.cold, width: 3, dash: [8, 6] });
          ctx.placeV("heater", hx, y1 + 36, "heater");
          ctx.placeV("rise", hx + 30, y0 + 22, "warm water rises (less dense)");
          ctx.placeV("sink", x1 - 40, y1 - 24, "cool water sinks (denser)");
        }
      };
    }
  });

  /* ---------- 1.3 A: sea and land breezes (loop, day / night) ---------- */

  S.register("breeze", {
    mode: "2d",
    build: function (ctx) {
      var g = ctx.g;
      var day = true;
      var r = ctx.rng(9);
      var dots = [];
      for (var i = 0; i < 40; i += 1) dots.push({ s: r(), lane: r() });
      return {
        settle: 2,
        set: function (key, v) { if (key === "mode") day = v !== "night"; },
        snapshot: function () { return { day: day, wind: day ? "sea to land" : "land to sea" }; },
        draw: function (t) {
          var f = frame(ctx, [720, 300], [480, 330]);
          var W = f.W;
          var ground = f.H - 60;
          var mid = W / 2;
          g.fillStyle = day ? "#ffffff" : "#F0EBDF";
          g.fillRect(0, 0, W, f.H);
          g.fillStyle = C.copper;
          g.globalAlpha = 0.55;
          g.fillRect(0, ground, mid, f.H - ground);
          g.globalAlpha = 1;
          g.fillStyle = C.coldSoft;
          g.fillRect(mid, ground, W - mid, f.H - ground);
          g.strokeStyle = C.cold;
          g.lineWidth = 2;
          g.beginPath();
          for (var x = mid; x <= W; x += 6) {
            var y = ground + 3 * Math.sin(x * 0.08 + t * 2);
            if (x === mid) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.stroke();
          /* sun or moon */
          if (day) {
            ctx.dot(g, 60, 50, 22, "#F5B83D", null);
          } else {
            ctx.dot(g, 60, 50, 20, "#ffffff", C.ink3);
            ctx.dot(g, 70, 44, 18, "#F0EBDF", null);
          }
          /* circulation: rises over the warmer side, sinks over the cooler side */
          var warmX = day ? mid * 0.5 : mid + (W - mid) * 0.5;
          var coolX = day ? mid + (W - mid) * 0.5 : mid * 0.5;
          /* the loop itself, faint, so the circulation reads at a glance */
          g.setLineDash([6, 8]);
          g.strokeStyle = C.guide;
          g.lineWidth = 2;
          g.strokeRect(Math.min(coolX, warmX), 82, Math.abs(warmX - coolX), ground - 30 - 82);
          g.setLineDash([]);
          ctx.arrow(g, warmX, ground - 60, warmX, 110, { colour: C.hot, width: 3 });
          ctx.arrow(g, coolX, 110, coolX, ground - 60, { colour: C.cold, width: 3 });
          dots.forEach(function (d) {
            var inset = d.lane * 16;
            var lo = ground - 22 - inset * 0.5;
            var hi = 74 + inset;
            var loop = [[coolX, lo], [warmX, lo], [warmX, hi], [coolX, hi], [coolX, lo]];
            var p = along(loop, (d.s + t * 0.06) % 1);
            var seg = (d.s + t * 0.06) % 1;
            var k = seg < 0.25 ? 0.2 : seg < 0.5 ? 0.9 : seg < 0.75 ? 0.6 : 0.2;
            ctx.dot(g, p.x, p.y, 4.5, ctx.heatColour(k), null);
          });
          var dir = day ? -1 : 1;
          ctx.arrow(g, mid - dir * 60, ground - 14, mid + dir * 60, ground - 14, { colour: C.ink, width: 4, head: 14 });
          ctx.placeV("wind", mid, ground - 40, day ? "sea breeze: towards the land" : "land breeze: towards the sea");
          ctx.placeV("land", mid * 0.5, ground + 30, day ? "land warms quickly" : "land cools quickly");
          ctx.placeV("sea", mid + (W - mid) * 0.5, ground + 30, day ? "sea stays cooler" : "sea stays warmer");
        }
      };
    }
  });

  /* ---------- 1.3 B: conduction in a poor and a good conductor (finite) ---------- */

  S.register("conduction", {
    mode: "2d",
    build: function (ctx) {
      var g = ctx.g;
      var metal = ctx.host.getAttribute("data-material") === "metal";
      var D = metal ? 5.5 : 0.45;  /* spread rate in atoms² per second, for the picture only */
      var cols = 11;
      var rows = 3;
      var r = ctx.rng(metal ? 21 : 2);
      var electrons = [];
      for (var i = 0; i < 9; i += 1) electrons.push({ x: r(), y: r(), a: r() * 6.28, v: 0.5 + r() });
      function level(i, t) {
        if (t <= 0) return i === 0 ? 1 : 0;
        return Math.exp(-(i * i) / (4 * D * t));
      }
      return {
        duration: 8,
        settle: 8,
        draw: function (t) {
          ctx.view(420, 260);
          var x0 = 70;
          var dx = 32;
          var y0 = 85;
          var dy = 46;
          /* flame at the left end */
          g.fillStyle = C.hot;
          g.beginPath();
          g.moveTo(14, 200);
          g.quadraticCurveTo(26, 120 - 6 * Math.sin(t * 9), 44, 200);
          g.closePath();
          g.fill();
          ctx.roundRect(g, x0 - 22, y0 - 26, (cols - 1) * dx + 44, (rows - 1) * dy + 52, 10);
          g.fillStyle = metal ? "#EEF1F4" : "#FBF8F1";
          g.fill();
          g.strokeStyle = C.ink3;
          g.lineWidth = 2;
          g.stroke();
          for (var c = 0; c < cols; c += 1) {
            var lv = level(c, t);
            var amp = 1 + 5 * lv;
            for (var rr = 0; rr < rows; rr += 1) {
              var ph = c * 1.7 + rr * 2.3;
              var x = x0 + c * dx + amp * Math.sin(t * 19 + ph);
              var y = y0 + rr * dy + amp * Math.cos(t * 23 + ph * 1.3);
              ctx.dot(g, x, y, 10, ctx.heatColour(lv), C.ink);
            }
          }
          if (metal) {
            electrons.forEach(function (e, j) {
              var span = (cols - 1) * dx + 30;
              var px = x0 - 15 + ((e.x * span + t * 140 * e.v) % span);
              var py = y0 - 12 + Math.abs(((e.y * 120 + t * 90 * e.v + j * 17) % 240) - 120) * ((rows - 1) * dy + 24) / 120;
              ctx.dot(g, px, py, 4, C.cold, null);
            });
          }
          ctx.placeV("end", 60, 226, "heated end");
          ctx.placeV("kind", 230, 30, metal ? "metal: free electrons carry energy fast" : "glass: atom to atom only, slow");
        },
        snapshot: function () { return { metal: metal, farEndLevel: level(cols - 1, 8) }; }
      };
    }
  });

  /* ---------- 1.3 C: emitters and absorbers (loop, hotter / colder than the room) ---------- */

  S.register("radiation", {
    mode: "2d",
    build: function (ctx) {
      var g = ctx.g;
      var hotter = true;
      function can(x, y, black) {
        ctx.roundRect(g, x - 55, y, 110, 150, 10);
        if (black) {
          g.fillStyle = "#2B3138";
          g.fill();
        } else {
          var grad = g.createLinearGradient(x - 55, 0, x + 55, 0);
          grad.addColorStop(0, "#C9D1D9");
          grad.addColorStop(0.45, "#FFFFFF");
          grad.addColorStop(1, "#AEB8C2");
          g.fillStyle = grad;
          g.fill();
        }
        g.strokeStyle = C.ink;
        g.lineWidth = 2;
        g.stroke();
      }
      return {
        settle: 0.6,
        set: function (key, v) { if (key === "mode") hotter = v !== "colder"; },
        snapshot: function () { return { hotter: hotter, net: hotter ? "emit" : "absorb" }; },
        draw: function (t) {
          var f = frame(ctx, [720, 300], [480, 330]);
          var y = f.H - 190;
          var xb = f.W * 0.28;
          var xs = f.W * 0.72;
          g.fillStyle = C.lineSoft;
          g.fillRect(0, y + 150, f.W, f.H - y - 150);
          can(xb, y, true);
          can(xs, y, false);
          var ph = t * 6;
          var outB = hotter ? 4 : 1;
          var outS = hotter ? 1 : 0;
          var i;
          /* emission: wavy arrows leaving each can */
          for (i = 0; i < outB; i += 1) {
            var ang = -Math.PI / 2 + (i - (outB - 1) / 2) * 0.55;
            var r0 = 70;
            var u = (t * 0.6 + i * 0.27) % 1;
            var rr = r0 + u * 70;
            g.globalAlpha = Math.sin(Math.PI * u);
            packet(ctx, xb + Math.cos(ang) * rr, y + 75 + Math.sin(ang) * rr, ang, { colour: C.hot, phase: ph, width: 3 });
          }
          for (i = 0; i < outS; i += 1) {
            var u2 = (t * 0.6 + 0.5) % 1;
            g.globalAlpha = Math.sin(Math.PI * u2);
            packet(ctx, xs, y - 10 - u2 * 70, -Math.PI / 2, { colour: C.hot, phase: ph, width: 2 });
          }
          /* absorption: arrows arriving from the room; black takes them in, shiny bounces most */
          var inN = hotter ? 1 : 3;
          for (i = 0; i < inN; i += 1) {
            var u3 = (t * 0.5 + i / 3) % 1;
            var a = Math.PI * (0.2 + 0.2 * i);
            g.globalAlpha = Math.sin(Math.PI * u3);
            var dist = 150 - u3 * 85;
            packet(ctx, xb - 55 - Math.cos(a) * dist * 0.6, y + 40 - Math.sin(a) * dist * 0.5, a * 0 + 0.25, { colour: C.energy, phase: ph });
            if (u3 < 0.6) {
              packet(ctx, xs + 55 + (1 - u3 / 0.6) * 80, y + 50 + i * 18, Math.PI, { colour: C.energy, phase: ph });
            } else {
              packet(ctx, xs + 55 + ((u3 - 0.6) / 0.4) * 80, y + 50 + i * 18 - ((u3 - 0.6) / 0.4) * 30, -0.35, { colour: C.energy, phase: ph });
            }
          }
          g.globalAlpha = 1;
          ctx.placeV("black", xb, y + 172, "dull black");
          ctx.placeV("shiny", xs, y + 172, "shiny silver");
          ctx.placeV("net", f.W / 2, 22, hotter ? "cans hotter than the room: net emitters, black cools faster" : "cans colder than the room: net absorbers, black warms faster");
        }
      };
    }
  });

  /* ---------- 1.4 C: greenhouse (loop) ---------- */

  S.register("greenhouse", {
    mode: "2d",
    build: function (ctx) {
      var g = ctx.g;
      var r = ctx.rng(17);
      var air = [];
      for (var i = 0; i < 18; i += 1) air.push({ x: r(), y: r(), a: r() * 6.28, v: 0.4 + r() * 0.6 });
      return {
        settle: 1.4,
        draw: function (t) {
          var f = frame(ctx, [720, 300], [480, 340]);
          var W = f.W;
          var ground = f.H - 40;
          var left = W * 0.25;
          var right = W * 0.8;
          var eave = ground - 110;
          var ridge = ground - 170;
          var midx = (left + right) / 2;
          g.fillStyle = C.copper;
          g.globalAlpha = 0.45;
          g.fillRect(0, ground, W, f.H - ground);
          g.globalAlpha = 1;
          /* glass house */
          g.fillStyle = "rgba(232,244,241,0.65)";
          g.beginPath();
          g.moveTo(left, ground);
          g.lineTo(left, eave);
          g.lineTo(midx, ridge);
          g.lineTo(right, eave);
          g.lineTo(right, ground);
          g.closePath();
          g.fill();
          g.strokeStyle = C.teal;
          g.lineWidth = 3;
          g.stroke();
          ctx.dot(g, 50, 40, 24, "#F5B83D", null);
          /* warm air trapped inside */
          air.forEach(function (a) {
            var x = left + 15 + ((a.x * (right - left - 30) + Math.sin(t * a.v + a.a) * 20) % (right - left - 30));
            var y = eave + 10 + a.y * (ground - eave - 25) + Math.cos(t * a.v * 1.3 + a.a) * 8;
            ctx.dot(g, x, y, 4, ctx.heatColour(0.85), null);
          });
          var ph = t * 7;
          /* visible light: short waves straight through the roof to the soil */
          for (var k = 0; k < 3; k += 1) {
            var u = (t * 0.35 + k / 3) % 1;
            var sx = 80 + k * 30;
            var ex = left + 40 + k * 70;
            var p = along([[sx, 60], [ex, ground - 6]], u);
            g.globalAlpha = Math.min(1, Math.sin(Math.PI * u) * 1.6);
            packet(ctx, p.x, p.y, p.a, { colour: "#E8A317", waves: 5, amp: 3, len: 40, phase: ph });
          }
          /* infrared: longer waves from the warm soil, mostly sent back by the glass */
          for (k = 0; k < 3; k += 1) {
            var u2 = (t * 0.3 + k / 3 + 0.15) % 1;
            var bx = left + 70 + k * 80;
            var roofY = eave - (bx < midx ? (bx - left) : (right - bx)) / (midx - left) * (eave - ridge);
            var path = k === 2
              ? [[bx, ground - 6], [bx + 25, roofY + 4], [bx + 50, roofY - 70]]
              : [[bx, ground - 6], [bx + 20, roofY + 8], [bx + 40, ground - 6]];
            var q = along(path, u2);
            g.globalAlpha = Math.min(1, Math.sin(Math.PI * u2) * 1.6);
            packet(ctx, q.x, q.y, q.a, { colour: C.hot, waves: 2, amp: 6, len: 46, phase: ph });
          }
          g.globalAlpha = 1;
          ctx.placeV("sun", 150, 26, "visible light passes the glass");
          ctx.placeV("ir", midx, ridge - 22, "infrared from the warm soil: mostly kept in");
          ctx.placeV("air", midx, ground + 22, "warm air trapped: no convection loss");
        }
      };
    }
  });
})();
