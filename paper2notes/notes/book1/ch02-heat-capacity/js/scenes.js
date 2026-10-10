/* Book 1 Ch.2 scenes: power, heat capacity, mixtures and the high specific heat
   capacity of water. Every figure here is a still graph driven by its controls. */
(function () {
  "use strict";

  var S = window.Book1Stage;
  if (!S) return;
  var C = S.colours;

  var MATERIALS = {
    water: { name: "water", c: 4200 },
    aluminium: { name: "aluminium", c: 900 },
    copper: { name: "copper", c: 390 },
    lead: { name: "lead", c: 130 }
  };

  function fmt(v, dp) { return v.toFixed(dp); }

  /* Graph box helper: returns mapping functions for a plot area inside the design box. */
  function plot(ctx, f, xmax, ymin, ymax, opt) {
    opt = opt || {};
    var left = f.wide ? 110 : 64;
    var right = f.W - (f.wide ? 60 : 24);
    var top = 34;
    var bottom = f.H - 46;
    var X = function (x) { return left + x / xmax * (right - left); };
    var Y = function (y) { return bottom - (y - ymin) / (ymax - ymin) * (bottom - top); };
    var g = ctx.g;
    g.strokeStyle = C.lineSoft;
    g.lineWidth = ctx.px(1);
    (opt.gridX || []).forEach(function (x) {
      g.beginPath(); g.moveTo(X(x), top); g.lineTo(X(x), bottom); g.stroke();
      ctx.label(String(x), X(x), bottom + ctx.px(14), { colour: C.ink3, weight: 600 });
    });
    (opt.gridY || []).forEach(function (y) {
      g.beginPath(); g.moveTo(left, Y(y)); g.lineTo(right, Y(y)); g.stroke();
      ctx.label(String(y), left - ctx.px(8), Y(y), { align: "right", colour: C.ink3, weight: 600 });
    });
    ctx.axes(g, left, bottom, right - left + 14, bottom - top + 14);
    if (opt.x) ctx.label(opt.x, right + 10, bottom - ctx.px(14), { align: "right", colour: C.ink2 });
    if (opt.y) ctx.label(opt.y, left + ctx.px(8), top - ctx.px(14), { align: "left", colour: C.ink2 });
    return { X: X, Y: Y, left: left, right: right, top: top, bottom: bottom };
  }

  function line(ctx, pts, colour, width, dash) {
    var g = ctx.g;
    g.save();
    g.strokeStyle = colour;
    g.lineWidth = ctx.px(width);
    if (dash) g.setLineDash(dash.map(ctx.px));
    g.beginPath();
    pts.forEach(function (p, i) { if (i === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); });
    g.stroke();
    g.restore();
  }

  /* ---------- 2.1: energy against time at constant power ---------- */

  S.register("power", {
    mode: "2d",
    build: function (ctx) {
      var P = 2.0; /* kW */
      return {
        still: true,
        set: function (k, v) { if (k === "power") P = v; },
        format: function (k, v) { return "P = " + fmt(v, 1) + " kW"; },
        snapshot: function () { return { powerKW: P, energyAt60sKJ: P * 60 }; },
        draw: function () {
          var f = ctx.frame([720, 320], [440, 340]);
          var p = plot(ctx, f, 60, 0, 180, { gridX: [0, 20, 40, 60], gridY: [0, 60, 120, 180], x: "t / s", y: "E / kJ" });
          line(ctx, [[p.X(0), p.Y(0)], [p.X(60), p.Y(60)]], C.guide, 2, [6, 6]);
          var tEnd = Math.min(60, 180 / P);
          line(ctx, [[p.X(0), p.Y(0)], [p.X(tEnd), p.Y(P * tEnd)]], C.teal, 3.5);
          /* slope triangle from 10 s to 30 s */
          var t1 = 10;
          var t2 = Math.min(30, tEnd);
          var g = ctx.g;
          g.fillStyle = "rgba(31,149,133,0.12)";
          g.beginPath();
          g.moveTo(p.X(t1), p.Y(P * t1));
          g.lineTo(p.X(t2), p.Y(P * t1));
          g.lineTo(p.X(t2), p.Y(P * t2));
          g.closePath();
          g.fill();
          line(ctx, [[p.X(t1), p.Y(P * t1)], [p.X(t2), p.Y(P * t1)], [p.X(t2), p.Y(P * t2)]], C.tealDeep, 2);
          ctx.dot(g, p.X(tEnd), p.Y(P * tEnd), ctx.px(5), C.tealDeep);
          ctx.placeV("ref", p.X(60) - ctx.px(40), p.Y(60) + ctx.px(16), "1 kW");
          ctx.placeV("slope", (p.X(t1) + p.X(t2)) / 2 + ctx.px(20), p.Y(P * t1) + ctx.px(18),
            "slope = " + fmt(P * (t2 - t1), 0) + " kJ ÷ " + fmt(t2 - t1, 0) + " s = " + fmt(P, 1) + " kW");
          ctx.placeV("end", Math.min(p.X(tEnd), p.right - ctx.px(60)), p.Y(P * tEnd) - ctx.px(18),
            "E = " + fmt(P * tEnd, 0) + " kJ after " + fmt(tEnd, 0) + " s");
        }
      };
    }
  });

  /* ---------- 2.2: heating curve, slope = P / (mc) ---------- */

  S.register("heating", {
    mode: "2d",
    build: function (ctx) {
      var P = 1000;
      var m = 1.0;
      var mat = "water";
      function rate() { return P / (m * MATERIALS[mat].c); }
      return {
        still: true,
        set: function (k, v) {
          if (k === "mass") m = v;
          if (k === "material") mat = v;
        },
        format: function (k, v) { return k === "mass" ? "m = " + fmt(v, 1) + " kg" : v; },
        snapshot: function () { return { mass: m, material: mat, heatCapacity: m * MATERIALS[mat].c, ratePerSecond: rate() }; },
        draw: function () {
          var f = ctx.frame([720, 320], [440, 340]);
          var p = plot(ctx, f, 120, 20, 100, { gridX: [0, 30, 60, 90, 120], gridY: [20, 40, 60, 80, 100], x: "t / s", y: "T / °C" });
          /* reference: 1 kg of water */
          line(ctx, [[p.X(0), p.Y(20)], [p.X(120), p.Y(20 + 120 * P / 4200)]], C.guide, 2, [6, 6]);
          var r = rate();
          var tTop = Math.min(120, 80 / r);
          line(ctx, [[p.X(0), p.Y(20)], [p.X(tTop), p.Y(20 + r * tTop)]], C.hot, 3.5);
          ctx.dot(ctx.g, p.X(tTop), p.Y(20 + r * tTop), ctx.px(5), C.hot, C.ink);
          var Cap = m * MATERIALS[mat].c;
          ctx.placeV("ref", p.X(120) - ctx.px(56), p.Y(20 + 120 * P / 4200) + ctx.px(16), "1 kg water");
          ctx.placeV("cap", p.left + ctx.px(120), p.top + ctx.px(10), "C = mc = " + Math.round(Cap) + " J °C⁻¹");
          ctx.placeV("rate", p.left + ctx.px(120), p.top + ctx.px(36), "rise = P ÷ C = " + fmt(r, 2) + " °C s⁻¹");
        }
      };
    }
  });

  /* ---------- 2.3: mixing, energy released = energy absorbed ---------- */

  S.register("mixing", {
    mode: "2d",
    build: function (ctx) {
      var m1 = 0.3;          /* hot water, kg */
      var T1 = 90;
      var m2 = 0.5;          /* cold body, kg */
      var T2 = 20;
      var mat = "water";
      function final() {
        var c1 = 4200;
        var c2 = MATERIALS[mat].c;
        return (m1 * c1 * T1 + m2 * c2 * T2) / (m1 * c1 + m2 * c2);
      }
      return {
        still: true,
        set: function (k, v) {
          if (k === "mass") m1 = v;
          if (k === "material") mat = v;
        },
        format: function (k, v) { return k === "mass" ? "hot water " + fmt(v, 2) + " kg" : v; },
        snapshot: function () {
          var T = final();
          return { T: T, released: m1 * 4200 * (T1 - T), absorbed: m2 * MATERIALS[mat].c * (T - T2) };
        },
        draw: function () {
          var f = ctx.frame([720, 320], [440, 360]);
          var g = ctx.g;
          var T = final();
          var Q = m1 * 4200 * (T1 - T) / 1000;
          var top = 40;
          var bottom = f.H - 40;
          var Y = function (t) { return bottom - t / 100 * (bottom - top); };
          var ax = f.wide ? 90 : 56;
          ctx.arrow(g, ax, bottom, ax, top - 14, { colour: C.ink, width: 2, head: 9 });
          [0, 20, 40, 60, 80, 100].forEach(function (t) {
            line(ctx, [[ax - 6, Y(t)], [ax, Y(t)]], C.ink, 1.5);
            ctx.label(String(t), ax - ctx.px(10), Y(t), { align: "right", colour: C.ink3, weight: 600 });
          });
          ctx.label("T / °C", ax + ctx.px(6), top - ctx.px(18), { align: "left", colour: C.ink2 });
          var xh = f.wide ? 210 : 140;
          var xc = f.wide ? 330 : 240;
          /* hot water falls from T1 to T, cold body rises from T2 to T */
          ctx.dot(g, xh, Y(T1), 9, C.hot, C.ink);
          ctx.arrow(g, xh, Y(T1) + 10, xh, Y(T) - 4, { colour: C.hot, width: 4 });
          ctx.dot(g, xc, Y(T2), 9, C.cold, C.ink);
          ctx.arrow(g, xc, Y(T2) - 10, xc, Y(T) + 4, { colour: C.cold, width: 4 });
          line(ctx, [[ax, Y(T)], [f.wide ? 420 : 300, Y(T)]], C.ink3, 1.5, [6, 6]);
          ctx.placeV("hot", xh, Y(T1) - ctx.px(20), "hot water " + T1 + " °C");
          ctx.placeV("cold", xc, Y(T2) + ctx.px(22), MATERIALS[mat].name + " " + T2 + " °C");
          ctx.placeV("T", f.wide ? 470 : 360, Y(T), "T = " + fmt(T, 1) + " °C");
          /* the two energies, always equal without loss */
          if (f.wide) {
            var bx = 500;
            var bw = Math.min(180, Q / 60 * 180);
            g.fillStyle = C.hotSoft;
            g.fillRect(bx, 100, bw, 34);
            g.fillStyle = C.coldSoft;
            g.fillRect(bx, 170, bw, 34);
            g.strokeStyle = C.ink3;
            g.lineWidth = 1.5;
            g.strokeRect(bx, 100, bw, 34);
            g.strokeRect(bx, 170, bw, 34);
            ctx.placeV("out", bx + 90, 88, "released " + fmt(Q, 1) + " kJ");
            ctx.placeV("in", bx + 90, 222, "absorbed " + fmt(Q, 1) + " kJ");
          } else {
            ctx.placeV("out", 340, 46, "released " + fmt(Q, 1) + " kJ");
            ctx.placeV("in", 340, 72, "absorbed " + fmt(Q, 1) + " kJ");
          }
        }
      };
    }
  });

  /* ---------- 2.4: same energy into 1 kg of four materials ---------- */

  S.register("same-energy", {
    mode: "2d",
    build: function (ctx) {
      var E = 8000;
      var order = ["water", "aluminium", "copper", "lead"];
      return {
        still: true,
        set: function (k, v) { if (k === "energy") E = v * 1000; },
        format: function (k, v) { return "E = " + fmt(v, 1) + " kJ"; },
        snapshot: function () {
          var out = {};
          order.forEach(function (k) { out[k] = E / MATERIALS[k].c; });
          return out;
        },
        draw: function () {
          var f = ctx.frame([720, 300], [440, 320]);
          var g = ctx.g;
          var left = f.wide ? 170 : 110;
          var right = f.W - 30;
          var row = (f.H - 70) / 4;
          var max = 100;
          order.forEach(function (k, i) {
            var y = 30 + i * row;
            var dT = E / MATERIALS[k].c;
            var w = Math.min(1, dT / max) * (right - left);
            g.fillStyle = C.lineSoft;
            g.fillRect(left, y, right - left, row * 0.55);
            g.fillStyle = ctx.heatColour(Math.min(1, dT / max));
            g.fillRect(left, y, w, row * 0.55);
            ctx.label(MATERIALS[k].name, left - ctx.px(10), y + row * 0.27, { align: "right" });
            ctx.placeV("dt-" + k, Math.min(left + w + ctx.px(46), right - ctx.px(46)), y + row * 0.27,
              "+" + fmt(dT, dT < 10 ? 1 : 0) + " °C");
          });
          ctx.label("temperature rise of 1 kg (0 to 100 °C shown)", (left + right) / 2, f.H - 20, { colour: C.ink3, weight: 600 });
        }
      };
    }
  });
})();
