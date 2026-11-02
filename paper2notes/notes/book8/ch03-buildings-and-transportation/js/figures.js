/* Book 8 Chapter 3 scenes (Buildings and transportation). Engine: ../../js/stage.js. */
(function () {
  "use strict";
  var scene = window.B8Stage.scene;
  var MATERIAL = { 1: "glass", 0.8: "concrete", 0.14: "wood", 0.04: "glass wool" };

  function fmt(v, unit) {
    var s = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
    return s + " " + unit;
  }

  /* Fig. 3.2 Law of conduction through a 1 m² layer. */
  scene("conduction", function () {
    var N = 36;
    return {
      settle: 1.5,
      readouts: function (p) {
        var U = p.kappa / (p.d / 100);
        return { d: p.d + " cm", dT: p.dT + " K", U: fmt(U, "W m⁻² K⁻¹"), P: fmt(U * p.dT, "W") };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var p = S.p;
        var P = p.kappa / (p.d / 100) * p.dT;
        var cx = w / 2;
        var thick = Math.max(8, p.d / 30 * w * 0.42);
        var top = 46;
        var bot = h - 46;
        k.rect(0, 0, cx - thick / 2, h, { fill: k.rgba(C.hot, 0.06 + 0.012 * p.dT) });
        k.rect(cx + thick / 2, 0, w - cx - thick / 2, h, { fill: k.rgba(C.cold, 0.1) });
        k.rect(cx - thick / 2, top, thick, bot - top, { fill: k.rgba(C.ink3, 0.25), stroke: C.ink2, width: 2 });
        var frac = k.clamp(Math.log(P) / Math.log(10) / 3.3, 0.06, 1);
        var span = w * 0.8;
        for (var i = 0; i < N; i += 1) {
          if (i / N > frac) break;
          var u = (S.t * 0.22 + (i * 0.618) % 1) % 1;
          var x = w * 0.1 + span * u;
          var y = top + 12 + ((i * 0.37) % 1) * (bot - top - 24);
          var hot = x < cx;
          k.circle(x, y, 3.2, { fill: hot ? C.heat : k.rgba(C.heat, 0.55) });
        }
        k.arrow(w * 0.12, h - 18, w * 0.88, h - 18, { color: C.heat, width: 2.5, head: 10 });
        k.label("hot side", w * 0.12, 20, { align: "left", dot: C.hot });
        k.label("cold side", w * 0.88, 20, { align: "right", dot: C.cold });
        k.label(MATERIAL[p.kappa] || "layer", cx, 20, {});
        k.label("d = " + p.d + " cm", cx, top + (bot - top) / 2, {});
        k.label("heat flow", cx, h - 18, {});
      }
    };
  });

  function car(S, x, y, L, spin) {
    var k = S.k;
    var C = S.C;
    var H = L * 0.28;
    k.rect(x - L / 2, y - H, L, H, { fill: C.card, stroke: C.ink, width: 2.5, radius: 10 });
    k.poly([[x - L * 0.3, y - H], [x - L * 0.18, y - H * 1.7], [x + L * 0.2, y - H * 1.7], [x + L * 0.32, y - H]], { fill: C.card, color: C.ink, width: 2.5, close: true });
    [-0.3, 0.3].forEach(function (f) {
      var wx = x + f * L;
      k.circle(wx, y, L * 0.1, { fill: C.ink });
      k.line(wx, y, wx + Math.cos(spin) * L * 0.08, y + Math.sin(spin) * L * 0.08, { color: C.card, width: 2 });
    });
  }

  function bar(S, x, y, wBar, frac, colour, name) {
    var k = S.k;
    k.rect(x, y, wBar, 14, { fill: S.C.lineSoft, radius: 7 });
    if (frac > 0.005) k.rect(x, y, Math.max(14, wBar * Math.min(frac, 1)), 14, { fill: colour, radius: 7 });
    k.text(name, x, y - 10, { size: 12, align: "left", color: S.C.ink2 });
  }

  /* Fig. 3.6 Regenerative braking: speed up, cruise, brake; energy bars follow. */
  scene("regen", function () {
    var T1 = 3, T2 = 4.5, T3 = 8.5;
    function speed(t) {
      if (t < T1) return t / T1;
      if (t < T2) return 1;
      if (t < T3) return 1 - (t - T2) / (T3 - T2);
      return 0;
    }
    function dist(t) {
      var s = 0;
      for (var u = 0; u < t; u += 0.05) s += speed(u) * 0.05;
      return s;
    }
    return {
      duration: 9.5,
      settle: 6.2,
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var t = S.t;
        var v = speed(t);
        var ke = v * v;
        var battery;
        var heat;
        if (t < T2) {
          battery = 1 - 0.5 * ke / 0.8;
          heat = 0.5 * ke / 0.8 * 0.2;
        } else {
          var used = 0.5 / 0.8;
          var lost = 0.5 * (1 - ke);
          battery = 1 - used + lost * 0.5;
          heat = used * 0.2 + lost * 0.5;
        }
        var narrow = w < 520;
        var roadY = h * 0.8;
        var L = Math.min(w * (narrow ? 0.5 : 0.36), 230);
        var cx = narrow ? w * 0.3 : w * 0.3;
        k.line(0, roadY + L * 0.1, w, roadY + L * 0.1, { color: C.ink, width: 3 });
        var off = (dist(t) * 160) % 60;
        for (var x = -off; x < w; x += 60) k.line(x, roadY + L * 0.1 + 12, x + 26, roadY + L * 0.1 + 12, { color: C.guide, width: 3 });
        car(S, cx, roadY, L, -dist(t) * 6);
        var phase = t < T1 ? "speeding up" : t < T2 ? "cruising" : t < T3 ? "braking" : "stopped";
        var bx = cx - L * 0.2;
        var mx = cx + L * 0.22;
        var my = roadY - L * 0.12;
        k.rect(bx - 20, my - 10, 40, 20, { fill: C.chemical, radius: 4 });
        k.circle(mx, my, 11, { fill: C.card, stroke: C.kinetic, width: 3 });
        if (t < T1) k.arrow(bx + 22, my, mx - 13, my, { color: C.electric, width: 3, head: 9 });
        else if (t >= T2 && t < T3) k.arrow(mx - 13, my, bx + 22, my, { color: C.electric, width: 3, head: 9 });
        k.label(phase, cx, 20, {});
        k.label(t >= T2 && t < T3 ? "motor as generator" : "motor", mx + (narrow ? 0 : 14), my - L * 0.48, {});
        var bxs = narrow ? w * 0.62 : w * 0.62;
        var bw = w * 0.34;
        bar(S, bxs, h * 0.2, bw, battery, C.chemical, "battery (chemical)");
        bar(S, bxs, h * 0.38, bw, ke * 0.5 / 0.8 * 1.25, C.kinetic, "kinetic energy");
        bar(S, bxs, h * 0.56, bw, heat * 1.6, C.heat, "heat");
      }
    };
  });

  /* Fig. 3.7 Hybrid power paths for four driving situations. */
  scene("hev", function () {
    return {
      settle: 1,
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var mode = S.p.mode;
        var narrow = w < 520;
        var bw = narrow ? 82 : 110;
        var bh = 40;
        var pos = {
          tank: [w * 0.04, h * 0.18],
          engine: [w * 0.4, h * 0.18],
          battery: [w * 0.04, h * 0.62],
          motor: [w * 0.4, h * 0.62],
          wheels: [w * 0.96 - bw, h * 0.4]
        };
        var names = { tank: "fuel tank", engine: "engine", battery: "battery", motor: mode === "brake" ? "generator" : "motor", wheels: "wheels" };
        function mid(n, side) {
          var p = pos[n];
          if (side === "r") return [p[0] + bw, p[1] + bh / 2];
          if (side === "l") return [p[0], p[1] + bh / 2];
          return [p[0] + bw / 2, p[1] + bh / 2];
        }
        var paths = [
          { a: mid("tank", "r"), b: mid("engine", "l"), on: mode === "cruise" || mode === "boost", col: C.chemical },
          { a: mid("engine", "r"), b: mid("wheels", "l"), on: mode === "cruise" || mode === "boost", col: C.kinetic },
          { a: mid("battery", "r"), b: mid("motor", "l"), on: mode === "start" || mode === "boost", col: C.electric },
          { a: mid("motor", "r"), b: mid("wheels", "l"), on: mode === "start" || mode === "boost", col: C.kinetic },
          { a: mid("wheels", "l"), b: mid("motor", "r"), on: mode === "brake", col: C.kinetic, back: true },
          { a: mid("motor", "l"), b: mid("battery", "r"), on: mode === "brake", col: C.electric, back: true }
        ];
        paths.forEach(function (p) {
          if (p.back && !p.on) return;
          var a = p.a;
          var b = p.b;
          if (!p.on) {
            k.line(a[0], a[1], b[0], b[1], { color: C.line, width: 4, dash: [6, 6] });
            return;
          }
          k.arrow(a[0], a[1], b[0], b[1], { color: p.col, width: 5, head: 12 });
          for (var i = 0; i < 4; i += 1) {
            var u = (S.t * 0.6 + i / 4) % 1;
            k.circle(k.lerp(a[0], b[0], u * 0.9), k.lerp(a[1], b[1], u * 0.9), 3, { fill: "#fff" });
          }
        });
        Object.keys(pos).forEach(function (n) {
          var p = pos[n];
          k.rect(p[0], p[1], bw, bh, { fill: C.card, stroke: C.ink, width: 2, radius: 10 });
          k.text(names[n], p[0] + bw / 2, p[1] + bh / 2, { size: 13 });
        });
        var say = { start: "motor only: no fuel burnt", cruise: "engine only", boost: "engine and motor together", brake: "wheels drive the generator; battery charges" };
        k.label(say[mode] || "", w / 2, h - 16, {});
      }
    };
  });

  /* Fig. 3.8 Resistive forces on a car against speed. */
  scene("resistance", function () {
    var FR = 300, KA = 0.4;
    return {
      still: true,
      readouts: function (p) {
        var F = FR + KA * p.v * p.v;
        return { v: p.v + " m/s", F: Math.round(F) + " N", P: (F * p.v / 1000).toFixed(1) + " kW" };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var L = 48, R = S.w - 20, T = 30, B = S.h - 44;
        function X(v) { return L + v / 40 * (R - L); }
        function Y(F) { return B - F / 1000 * (B - T); }
        k.arrow(L, B, R + 6, B, { color: C.ink2, width: 1.6, head: 8 });
        k.arrow(L, B, L, T - 8, { color: C.ink2, width: 1.6, head: 8 });
        k.text("speed / m s⁻¹", R, B + 28, { size: 12, align: "right", color: C.ink2, weight: 600 });
        k.text("force / N", L + 8, T - 12, { size: 12, align: "left", color: C.ink2, weight: 600 });
        [0, 10, 20, 30, 40].forEach(function (v) { k.text(String(v), X(v), B + 13, { size: 12, color: C.ink2, weight: 600 }); });
        [500, 1000].forEach(function (F) { k.text(String(F), L - 6, Y(F), { size: 12, align: "right", color: C.ink2, weight: 600 }); });
        var air = [], tot = [];
        for (var v = 0; v <= 40; v += 1) {
          air.push([X(v), Y(KA * v * v)]);
          tot.push([X(v), Y(FR + KA * v * v)]);
        }
        k.line(X(0), Y(FR), X(40), Y(FR), { color: C.chemical, width: 2.5 });
        k.poly(air, { color: C.cold, width: 2.5 });
        k.poly(tot, { color: C.ink, width: 3 });
        var vv = S.p.v;
        var F = FR + KA * vv * vv;
        k.line(X(vv), B, X(vv), Y(F), { color: C.ink2, width: 1.5, dash: [5, 4] });
        k.circle(X(vv), Y(F), 6, { fill: C.heat, stroke: C.ink, width: 2 });
        k.label("rolling friction", X(4), Y(FR) - 16, { align: "left", dot: C.chemical });
        k.label("air resistance", X(36), Y(KA * 36 * 36) + 26, { align: "right", dot: C.cold });
        k.label("total", X(34), Y(FR + KA * 34 * 34) - 18, { align: "right" });
      }
    };
  });
})();
