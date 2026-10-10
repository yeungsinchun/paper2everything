/* Book 8 Chapter 4 scenes (Different sources of energy). Engine: ../../js/stage.js. */
(function () {
  "use strict";
  var scene = window.B8Stage.scene;

  function sig(v, unit) {
    var s = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
    return s + " " + unit;
  }

  function power(W) {
    if (W >= 1e9) return sig(W / 1e9, "GW");
    if (W >= 1e6) return sig(W / 1e6, "MW");
    if (W >= 1e3) return sig(W / 1e3, "kW");
    return sig(W, "W");
  }

  /* Fig. 4.2 Binding energy per nucleon against mass number. */
  var CURVE = [[1, 0], [2, 1.11], [3, 2.57], [4, 7.07], [6, 5.33], [7, 5.61], [9, 6.46], [12, 7.68], [16, 7.98], [20, 8.03], [28, 8.45], [40, 8.55], [56, 8.79], [80, 8.71], [100, 8.6], [140, 8.38], [180, 8.05], [208, 7.87], [235, 7.59], [250, 7.5]];
  var NUC = [
    { A: 2, eb: 1.11, name: "hydrogen-2", way: "fusion" },
    { A: 4, eb: 7.07, name: "helium-4", way: "fusion (it is a fusion product)" },
    { A: 56, eb: 8.79, name: "iron-56", way: "neither: most stable" },
    { A: 235, eb: 7.59, name: "uranium-235", way: "fission" }
  ];

  scene("binding-curve", function () {
    return {
      still: true,
      readouts: function (p) {
        var n = NUC[p.nuc];
        return { name: n.name, eb: n.eb.toFixed(2) + " MeV", way: n.way };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var L = 46, R = w - 18, T = 34, B = h - 40;
        function X(A) { return L + (A / 250) * (R - L); }
        function Y(e) { return B - (e / 10) * (B - T); }
        var iron = X(56);
        k.rect(L, T, iron - L, B - T, { fill: k.rgba(C.cold, 0.07) });
        k.rect(iron, T, R - iron, B - T, { fill: k.rgba(C.heat, 0.07) });
        k.line(L, B, R, B, { color: C.ink, width: 2 });
        k.line(L, B, L, T - 6, { color: C.ink, width: 2 });
        [0, 50, 100, 150, 200, 250].forEach(function (A) { k.text(String(A), X(A), B + 14, { size: 12, color: C.ink2, weight: 600 }); });
        [0, 2, 4, 6, 8, 10].forEach(function (e) { k.text(String(e), L - 8, Y(e), { size: 12, align: "right", color: C.ink2, weight: 600 }); });
        k.text("mass number A", (L + R) / 2, h - 10, { size: 12, color: C.ink2 });
        k.text("Eb/A / MeV", L - 4, T - 18, { size: 12, color: C.ink2, align: "left" });
        k.poly(CURVE.map(function (q) { return [X(q[0]), Y(q[1])]; }), { color: C.ink, width: 3 });
        k.label("fusion", (L + iron) / 2 + 6, Y(3), { size: 12, dot: C.cold });
        k.label("fission", (iron + R) / 2, Y(3), { size: 12, dot: C.heat });
        k.arrow((L + iron) / 2 + 6, Y(4.2), (L + iron) / 2 + 22, Y(6.6), { color: C.cold, width: 2, head: 8 });
        k.arrow((iron + R) / 2, Y(4.2), (iron + R) / 2 - 30, Y(6.8), { color: C.heat, width: 2, head: 8 });
        var n = NUC[S.p.nuc];
        k.line(X(n.A), B, X(n.A), Y(n.eb), { color: C.ink2, width: 1.5, dash: [5, 4] });
        k.circle(X(n.A), Y(n.eb), 7, { fill: C.light, stroke: C.ink, width: 2 });
        var right = X(n.A) > w * 0.7;
        k.label(n.name + " · " + n.eb.toFixed(2) + " MeV", X(n.A) + (right ? -12 : 12), Y(n.eb) - 22, { align: right ? "right" : "left" });
      }
    };
  });

  /* Fig. 4.3 Chain reaction: each step doubles without control; control rods hold it at one. */
  scene("chain", function () {
    var STEPS = 4, DT = 1.6;
    return {
      duration: STEPS * DT + 1.2,
      settle: STEPS * DT + 1,
      readouts: function (p) {
        return { last: p.ctrl ? "1" : String(Math.pow(2, STEPS - 1)) };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var ctrl = S.p.ctrl === 1;
        var t = S.t;
        var colW = (w - 40) / STEPS;
        var top = 36, bot = h - 20;
        k.text(ctrl ? "control rods absorb the extra neutrons" : "each fission frees 2 neutrons that go on", w / 2, 16, { size: 12, color: C.ink2 });
        var prev = [h / 2];
        var rowsFor = function (n) {
          var out = [];
          for (var i = 0; i < n; i += 1) out.push(top + (bot - top) * (i + 0.5) / n);
          return out;
        };
        for (var s = 0; s < STEPS; s += 1) {
          var count = ctrl ? 1 : Math.pow(2, s);
          var ys = rowsFor(count);
          var x = 30 + colW * (s + 0.55);
          var t0 = s * DT;
          var u = k.clamp((t - t0) / DT, 0, 1);
          ys.forEach(function (y, i) {
            var py = prev[Math.floor(i / (ctrl ? 1 : 2))] != null ? prev[ctrl ? 0 : Math.floor(i / 2)] : h / 2;
            var px = s === 0 ? 14 : 30 + colW * (s - 1 + 0.55) + 14;
            if (u > 0) {
              var nx = k.lerp(px, x - 14, Math.min(1, u * 1.6));
              var ny = k.lerp(py, y, Math.min(1, u * 1.6));
              k.line(px, py, nx, ny, { color: C.neutron, width: 2, dash: [5, 4] });
              if (u < 0.62) k.circle(nx, ny, 5, { fill: C.neutron });
            }
            var split = u >= 0.62;
            if (!split) {
              k.circle(x, y, 11, { fill: C.light, stroke: C.ink, width: 2 });
            } else {
              var e = k.smooth((u - 0.62) / 0.38);
              var d = 4 + 9 * e;
              k.circle(x, y, 22 * e, { stroke: k.rgba(C.heat, 1 - e), width: 3 });
              k.circle(x - d, y - d * 0.6, 7, { fill: C.heat, stroke: C.ink, width: 1.6 });
              k.circle(x + d, y + d * 0.6, 7, { fill: C.heat, stroke: C.ink, width: 1.6 });
              if (ctrl && s < STEPS - 1) {
                k.circle(x + 10, y - 20, 4, { fill: C.neutron });
                k.rect(x + 16, y - 34, 8, 30, { fill: C.ink2, radius: 2 });
              }
            }
          });
          if (s === 0) {
            k.label("neutron", 14, h / 2 + 22, { size: 12, align: "left", dot: C.neutron });
            k.label("U-235", x, ys[0] - 34, { size: 12, dot: C.light });
          }
          prev = ys;
        }
      }
    };
  });

  /* Fig. 4.5 Wind turbine: power in the swept circle. */
  scene("wind", function () {
    var RHO = 1.2;
    return {
      settle: 1,
      readouts: function (p) {
        var A = Math.PI * p.r * p.r;
        var Pm = 0.5 * RHO * A * Math.pow(p.v, 3);
        return { v: p.v + " m/s", r: p.r + " m", eta: Number(p.eta).toFixed(2), A: A.toFixed(0) + " m²", Pmax: power(Pm), P: power(p.eta * Pm) };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var p = S.p;
        var cx = w * 0.62, cy = h * 0.42;
        var R = Math.min(h * 0.34, w * 0.3) * (0.35 + 0.65 * p.r / 60);
        k.line(cx, cy, cx, h - 14, { color: C.ink2, width: 6 });
        k.line(16, h - 14, w - 16, h - 14, { color: C.ink, width: 2 });
        k.circle(cx, cy, R, { fill: k.rgba(C.cold, 0.08), stroke: C.cold, width: 1.5, dash: [5, 5] });
        var ang = S.t * p.v * 0.18;
        for (var b = 0; b < 3; b += 1) {
          var a = ang + b * Math.PI * 2 / 3;
          k.line(cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R, { color: C.ink, width: 5 });
        }
        k.circle(cx, cy, 7, { fill: C.card, stroke: C.ink, width: 2.5 });
        var n = 7;
        for (var i = 0; i < n; i += 1) {
          var y = cy - R * 0.85 + (2 * R * 0.85) * i / (n - 1);
          var off = ((S.t * p.v * 9 + i * 23) % 60);
          for (var x = 16 - 60 + off; x < cx - 20; x += 60) {
            if (x > 14) k.arrow(x, y, Math.min(x + 26, cx - 20), y, { color: k.rgba(C.cold, 0.7), width: 2, head: 7 });
          }
        }
        k.label("wind v = " + p.v + " m/s", 16, 18, { align: "left", dot: C.cold });
        k.label("A = πr², r = " + p.r + " m", cx, cy + R + 16 > h - 30 ? cy - R - 16 : cy + R + 16, {});
      }
    };
  });

  /* Fig. 4.6 Hydroelectric station: water falls through h to the turbine. */
  scene("hydro", function () {
    var G = 9.81;
    return {
      settle: 1,
      readouts: function (p) {
        var m = p.q * 1000;
        var pe = m * G * p.h;
        var mant = m / Math.pow(10, Math.floor(Math.log10(m)));
        return { q: p.q + " m³/s", h: p.h + " m", eta: Number(p.eta).toFixed(2), m: mant.toFixed(1) + " × 10" + sup(Math.floor(Math.log10(m))) + " kg", pe: power(pe), P: power(p.eta * pe) };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var p = S.p;
        var base = h - 24;
        var drop = (h - 70) * (0.25 + 0.75 * p.h / 300);
        var upper = base - drop;
        var damX = w * 0.42;
        k.rect(14, upper, damX - 14, base - upper, { fill: k.rgba(C.cold, 0.18) });
        k.line(14, upper, damX, upper, { color: C.cold, width: 2.5 });
        k.poly([[damX, upper - 16], [damX + 22, upper - 16], [damX + 60, base], [damX, base]], { fill: C.ink3, close: true });
        var lowY = base - 18;
        k.rect(damX + 60, lowY, w - damX - 74, base - lowY, { fill: k.rgba(C.cold, 0.18) });
        k.line(damX + 60, lowY, w - 14, lowY, { color: C.cold, width: 2.5 });
        k.line(14, base, w - 14, base, { color: C.ink, width: 2 });
        var tx = damX + 92, ty = lowY - 16;
        var pipe = [[damX - 8, upper + 24], [damX + 30, ty]];
        k.line(pipe[0][0], pipe[0][1], pipe[1][0], pipe[1][1], { color: C.ink2, width: 12 });
        var flow = Math.min(1, p.q / 300);
        for (var i = 0; i < 6; i += 1) {
          var u = (S.t * (0.25 + flow * 0.5) + i / 6) % 1;
          k.circle(k.lerp(pipe[0][0], pipe[1][0], u), k.lerp(pipe[0][1], pipe[1][1], u), 3 + flow * 2, { fill: C.cold });
        }
        k.line(damX + 30, ty, tx - 14, ty, { color: C.ink2, width: 12 });
        k.circle(tx, ty, 14, { fill: C.card, stroke: C.ink, width: 2.5 });
        var a = S.t * (1 + flow * 3);
        for (var b = 0; b < 4; b += 1) k.line(tx, ty, tx + Math.cos(a + b * Math.PI / 2) * 11, ty + Math.sin(a + b * Math.PI / 2) * 11, { color: C.ink, width: 2 });
        k.circle(tx + 46, ty, 16, { fill: C.tealSoft, stroke: C.electric, width: 2.5 });
        k.text("G", tx + 46, ty + 1, { size: 13 });
        k.line(tx + 14, ty, tx + 30, ty, { color: C.ink, width: 3 });
        var hx = 30;
        k.arrow(hx, lowY, hx, upper + 2, { color: C.ink, width: 1.8, head: 8 });
        k.arrow(hx, upper, hx, lowY - 2, { color: C.ink, width: 1.8, head: 8 });
        k.line(14, lowY, damX, lowY, { color: C.ink2, width: 1.2, dash: [5, 4] });
        k.label("h = " + p.h + " m", hx + 8, (upper + lowY) / 2, { align: "left" });
        k.label("reservoir", damX / 2 + 20, upper - 16, { dot: C.cold });
        k.label("turbine + generator", Math.min(tx + 20, w - 80), ty - 34, {});
      }
    };
  });

  function sup(n) {
    var map = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
    return String(n).split("").map(function (c) { return map[c] || c; }).join("");
  }

  /* Fig. 4.7 A tilted solar panel: power falls with cos θ. */
  scene("panel", function () {
    var I = 900, AREA = 1.6, ETA = 0.18;
    return {
      still: true,
      readouts: function (p) {
        var c = Math.cos(p.th * Math.PI / 180);
        return { th: p.th + "°", cos: c.toFixed(3), Pin: (I * AREA * c).toFixed(0) + " W", P: (ETA * I * AREA * c).toFixed(0) + " W" };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var th = S.p.th * Math.PI / 180;
        var cx = w / 2, cy = h * 0.66;
        var half = Math.min(w * 0.3, 150);
        var ex = Math.cos(th) * half, ey = Math.sin(th) * half;
        var x1 = cx - ex, y1 = cy + ey, x2 = cx + ex, y2 = cy - ey;
        var hit = 0;
        for (var i = -7; i <= 7; i += 1) {
          var x = cx + i * 18;
          var tParam = (x - cx) / ex;
          if (Math.abs(tParam) <= 1 && Math.abs(ex) > 0.5) {
            var yHit = cy - tParam * ey;
            k.arrow(x, 14, x, yHit - 3, { color: C.light, width: 2, head: 7 });
            hit += 1;
          } else {
            k.line(x, 14, x, h - 14, { color: k.rgba(C.light, 0.25), width: 1.5 });
          }
        }
        k.line(x1, y1, x2, y2, { color: C.ink, width: 7 });
        var nx = Math.sin(th), ny = -Math.cos(th);
        k.line(cx, cy, cx + nx * 70, cy + ny * 70, { color: C.ink2, width: 1.5, dash: [5, 4] });
        k.text("normal", cx + nx * 82, cy + ny * 82, { size: 12, color: C.ink2 });
        if (S.p.th > 0) {
          var ctx = S.ctx;
          ctx.save();
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + th, false);
          ctx.stroke();
          ctx.restore();
          k.text("θ", cx + Math.sin(th / 2) * 54, cy - Math.cos(th / 2) * 54, { size: 15 });
        }
        k.label(hit + " rays hit the panel", 16, h - 18, { align: "left", dot: C.light });
      }
    };
  });

  /* Fig. 4.11 Greenhouse effect: sunlight in, infrared out, part of it sent back down. */
  scene("greenhouse", function () {
    var TEMP = ["about −18 °C", "about 15 °C", "above 15 °C and rising"];
    return {
      settle: 1,
      readouts: function (p) { return { T: TEMP[p.gas] }; },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var gas = S.p.gas;
        var ph = S.t * 4;
        var ground = h - 34;
        var atmTop = 44, atmBot = h * 0.5;
        var mid = (atmTop + atmBot) / 2;
        if (gas > 0) {
          k.rect(0, atmTop, w, atmBot - atmTop, { fill: k.rgba(C.cold, gas === 2 ? 0.22 : 0.11) });
          k.label(gas === 2 ? "more greenhouse gas" : "atmosphere", w - 10, atmTop + 14, { align: "right", size: 12 });
        }
        k.rect(0, ground, w, h - ground, { fill: k.rgba(C.heat, [0.25, 0.55, 0.85][gas]) });
        k.label("ground", 10, ground + 17, { align: "left" });
        for (var i = 0; i < 2; i += 1) {
          var sx = w * (0.08 + i * 0.12);
          k.wave(sx, 30, sx + 46, ground - 6, { color: C.light, wavelength: 9, amp: 4, phase: ph * 1.6, head: true });
        }
        k.label("sunlight (short λ)", 10, 16, { align: "left", dot: C.light });
        var cols = [0.5, 0.68, 0.86];
        cols.forEach(function (c, j) {
          var bx = w * c;
          if (j >= gas) {
            k.wave(bx, ground - 4, bx, 22, { color: C.hot, wavelength: 20, amp: 5, phase: ph, head: true });
            return;
          }
          k.wave(bx, ground - 4, bx, mid + 8, { color: C.hot, wavelength: 20, amp: 5, phase: ph });
          k.circle(bx, mid, 7 + Math.sin(ph) * 1.5, { fill: C.hot, stroke: C.ink, width: 1.5 });
          k.wave(bx - 4, mid - 8, bx - 18, 22, { color: k.rgba(C.hot, 0.7), wavelength: 20, amp: 4, phase: ph, head: true });
          k.wave(bx + 12, mid + 10, bx + 26, ground - 8, { color: C.hot, wavelength: 20, amp: 4, phase: ph, head: true });
        });
        k.label("infrared (long λ)", w * 0.5 - 10, ground - 16, { align: "right", dot: C.hot, size: 12 });
        if (gas > 0) k.label("sent back down", w * 0.5 + 30, atmBot + 22, { align: "left", size: 12 });
      }
    };
  });
})();
