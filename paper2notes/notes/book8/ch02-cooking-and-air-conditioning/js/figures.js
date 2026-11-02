/* Book 8 Chapter 2 scenes (Cooking and air-conditioning). Engine: ../../js/stage.js. */
(function () {
  "use strict";
  var scene = window.B8Stage.scene;

  /* Fig. 2.2 Induction cooker: reversing coil current, changing field, eddy currents. */
  scene("induction", function () {
    return {
      settle: 0.6,
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var narrow = w < 520;
        var cx = w / 2;
        var I = Math.sin(S.t * Math.PI * 1.1);
        var dI = Math.cos(S.t * Math.PI * 1.1);
        var potL = cx - Math.min(w * 0.27, 170);
        var potR = cx + Math.min(w * 0.27, 170);
        var baseY = h * 0.43;
        var topY = h * 0.13;
        var glassY = baseY + 4;
        var coilY = h * 0.62;
        var a = (potR - potL) * 0.27;
        /* field lines: two loops, one round each half of the flat coil */
        var strength = Math.abs(I);
        for (var n = 0; n < 3; n += 1) {
          var rx = a * (0.55 + n * 0.32);
          var ry = Math.min((coilY - baseY + 8) * (1 + n * 0.32), h - coilY - 30);
          [-1, 1].forEach(function (side) {
            var ctx = S.ctx;
            ctx.save();
            ctx.strokeStyle = k.rgba(C.field, 0.25 + 0.65 * strength);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(cx + side * rx, coilY, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          });
          var up = I >= 0 ? -1 : 1;
          var ay = coilY - ry * 0.7;
          if (strength > 0.2) k.arrow(cx, ay - up * 6, cx, ay + up * 6, { color: C.field, width: 2, head: 9 });
        }
        /* water and pot */
        k.rect(potL + 6, topY + 26, potR - potL - 12, baseY - topY - 30, { fill: k.rgba(C.cold, 0.12) });
        var warm = Math.min(1, S.t / 8);
        k.rect(potL, baseY - 12, potR - potL, 12, { fill: k.rgba(C.heat, 0.25 + 0.6 * warm) });
        k.poly([[potL, topY], [potL, baseY], [potR, baseY], [potR, topY]], { color: C.ink, width: 4 });
        /* eddy current loops in the base */
        var flow = dI;
        [-1, 1].forEach(function (side) {
          var ex = cx + side * a;
          var erx = a * 0.6;
          var ctx = S.ctx;
          ctx.save();
          ctx.strokeStyle = k.rgba(C.hot, 0.25 + 0.6 * Math.abs(flow));
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(ex, baseY - 6, erx, 4, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          for (var j = 0; j < 5; j += 1) {
            var ph = (S.t * 1.6 * Math.sign(flow || 1) * side + j / 5) * Math.PI * 2;
            k.circle(ex + erx * Math.cos(ph), baseY - 6 + 4 * Math.sin(ph), 2.6, { fill: C.hot });
          }
        });
        /* glass top and coil */
        k.rect(w * 0.08, glassY, w * 0.84, 8, { fill: k.rgba(C.cold, 0.15), stroke: C.ink2, width: 1.5 });
        var wires = 8;
        for (var i = 0; i < wires; i += 1) {
          var side2 = i < wires / 2 ? -1 : 1;
          var idx = i < wires / 2 ? i : i - wires / 2;
          var x = cx + side2 * (a * 0.35 + idx * a * 0.3);
          k.circle(x, coilY, 7, { fill: C.card, stroke: C.kinetic, width: 2.5 });
          var out = (I >= 0) === (side2 < 0);
          if (Math.abs(I) > 0.12) {
            if (out) k.circle(x, coilY, 2.4, { fill: C.kinetic });
            else {
              k.line(x - 3.5, coilY - 3.5, x + 3.5, coilY + 3.5, { color: C.kinetic, width: 2 });
              k.line(x - 3.5, coilY + 3.5, x + 3.5, coilY - 3.5, { color: C.kinetic, width: 2 });
            }
          }
        }
        k.label(narrow ? "metal pot" : "metal pot: eddy currents heat it", cx, topY - 14, {});
        k.label(narrow ? "glass top" : "glass top (no heat made here)", w * 0.08, glassY + 26, { align: "left" });
        k.label(narrow ? "coil, high-freq. ac" : "coil carrying high-frequency ac", cx, h - 16, { dot: C.kinetic });
        k.label("field", cx + a * 1.7, coilY - (coilY - baseY) * 0.4, { dot: C.field });
      }
    };
  });

  /* Fig. 2.3 Microwave oven: polar water molecules follow a reversing field. */
  scene("microwave", function () {
    var mols = [];
    for (var r = 0; r < 3; r += 1) {
      for (var c = 0; c < 5; c += 1) mols.push({ c: c, r: r, j: (c * 7 + r * 3) % 5 });
    }
    function molecule(S, x, y, ang, s) {
      var k = S.k;
      var C = S.C;
      var hx1 = x + Math.cos(ang - 0.92) * 16 * s;
      var hy1 = y + Math.sin(ang - 0.92) * 16 * s;
      var hx2 = x + Math.cos(ang + 0.92) * 16 * s;
      var hy2 = y + Math.sin(ang + 0.92) * 16 * s;
      k.line(x, y, hx1, hy1, { color: C.ink2, width: 3 });
      k.line(x, y, hx2, hy2, { color: C.ink2, width: 3 });
      k.circle(hx1, hy1, 6 * s, { fill: C.card, stroke: C.ink, width: 1.8 });
      k.circle(hx2, hy2, 6 * s, { fill: C.card, stroke: C.ink, width: 1.8 });
      k.circle(x, y, 10 * s, { fill: C.force });
      k.text("−", x, y + 0.5, { size: 13, color: "#fff" });
      k.text("+", hx1, hy1 + 0.5, { size: 10 });
      k.text("+", hx2, hy2 + 0.5, { size: 10 });
    }
    return {
      settle: 0.4,
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var E = Math.sin(S.t * Math.PI * 0.9);
        var fx = w * 0.12;
        for (var i = 0; i < 3; i += 1) {
          var y = h * (0.3 + i * 0.22);
          var L = 34 * E;
          if (Math.abs(L) > 3) k.arrow(fx, y + L / 2, fx, y - L / 2, { color: C.electric, width: 3, head: 10 });
        }
        k.label("field E", fx, h - 16, { dot: C.electric });
        var x0 = w * 0.28;
        var x1 = w * 0.92;
        var s = Math.min(1, w / 640 + 0.25);
        mols.forEach(function (m) {
          var x = x0 + (x1 - x0) * (m.c + 0.5) / 5;
          var y = h * (0.26 + m.r * 0.25);
          var lag = Math.sin(S.t * Math.PI * 0.9 - 0.5 - m.j * 0.08);
          var ang = -Math.PI / 2 * Math.max(-1, Math.min(1, lag * 1.6)) + Math.sin(S.t * 7 + m.j) * 0.12;
          molecule(S, x, y, ang + Math.PI, s);
        });
        k.label("water molecules flip as the field reverses", (x0 + x1) / 2, 16, {});
      }
    };
  });

  /* Fig. 2.4 Heat pump energy flows for a fixed 3 kW cooling capacity. */
  scene("heat-pump", function () {
    var QC = 3;
    return {
      settle: 1,
      readouts: function (p) {
        var W = QC / p.cop;
        return { cop: p.cop.toFixed(1), work: W.toFixed(2) + " kW", qh: (QC + W).toFixed(2) + " kW" };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var W = QC / S.p.cop;
        var unit = Math.min(h * 0.075, 24);
        var midY = h * 0.6;
        var bw = Math.min(w * 0.25, 150);
        var boxL = [w * 0.02, w / 2 - bw / 2 * 0.8, w * 0.98 - bw];
        var bwid = [bw, bw * 0.8, bw];
        var bh = 64;
        var tQC = QC * unit;
        var tW = W * unit;
        var tQH = (QC + W) * unit;
        /* bands */
        k.band(boxL[0] + bwid[0] - 4, midY + tW / 2, boxL[1] + 6, midY + tW / 2, tQC, k.rgba(C.cold, 0.8), { head: 0 });
        k.band(boxL[1] + bwid[1] / 2, 40, boxL[1] + bwid[1] / 2, midY - tQC / 2 + tW / 2 - 2, tW, k.rgba(C.electric, 0.85), { head: 0 });
        k.band(boxL[1] + bwid[1] - 6, midY, boxL[2] + 2, midY, tQH, k.rgba(C.heat, 0.85), {});
        /* moving dots */
        for (var i = 0; i < 12; i += 1) {
          var u = (S.t * 0.35 + i / 12) % 1;
          k.circle(k.lerp(boxL[0] + bwid[0], boxL[1], u), midY + tW / 2 + (((i * 5) % 7) / 7 - 0.5) * tQC * 0.7, 2.2, { fill: "rgba(255,255,255,0.85)" });
          k.circle(k.lerp(boxL[1] + bwid[1], boxL[2], u), midY + (((i * 3) % 7) / 7 - 0.5) * tQH * 0.7, 2.2, { fill: "rgba(255,255,255,0.85)" });
        }
        var names = ["cool room", "heat pump", "hot outdoors"];
        var fills = [k.rgba(C.cold, 0.1), C.card, k.rgba(C.hot, 0.1)];
        for (i = 0; i < 3; i += 1) {
          k.rect(boxL[i], midY - bh / 2, bwid[i], bh, { fill: fills[i], stroke: C.ink, width: 2, radius: 12 });
          k.text(names[i], boxL[i] + bwid[i] / 2, midY, { size: 13 });
        }
        k.label("work W " + W.toFixed(2) + " kW", boxL[1] + bwid[1] / 2, 22, { dot: C.electric });
        k.label("QC 3.0 kW", (boxL[0] + bwid[0] + boxL[1]) / 2, midY + bh / 2 + 34, { dot: C.cold });
        k.label("QH " + (QC + W).toFixed(2) + " kW", (boxL[1] + bwid[1] + boxL[2]) / 2, midY + bh / 2 + 34, { dot: C.heat });
      }
    };
  });

  /* Fig. 2.5 Refrigeration cycle: refrigerant round evaporator, compressor, condenser, valve. */
  scene("fridge-cycle", function () {
    var N = 44;
    return {
      settle: 1,
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var narrow = w < 520;
        var L = w * 0.2;
        var R = w * 0.8;
        var T = h * 0.2;
        var B = h * 0.8;
        var wallX = w * 0.34;
        k.rect(0, 0, wallX, h, { fill: k.rgba(C.cold, 0.06) });
        k.rect(wallX, 0, w - wallX, h, { fill: k.rgba(C.hot, 0.05) });
        k.line(wallX, 8, wallX, h - 8, { color: C.ink3, width: 2, dash: [8, 6] });
        var per = 2 * (R - L) + 2 * (B - T);
        function point(s) {
          var d = s * per;
          if (d < B - T) return [L, B - d, "evap", d / (B - T)];
          d -= B - T;
          if (d < R - L) return [L + d, T, "comp", d / (R - L)];
          d -= R - L;
          if (d < B - T) return [R, T + d, "cond", d / (B - T)];
          d -= B - T;
          return [R - d, B, "valve", d / (R - L)];
        }
        k.rect(L, T, R - L, B - T, { stroke: C.line, width: 10 });
        /* coils */
        [L, R].forEach(function (x) {
          var pts = [];
          for (var j = 0; j <= 12; j += 1) pts.push([x + (j % 2 ? 12 : -12), T + 30 + j * (B - T - 60) / 12]);
          k.poly(pts, { color: C.ink2, width: 2 });
        });
        for (var i = 0; i < N; i += 1) {
          var s = (i / N + S.t * 0.06) % 1;
          var p = point(s);
          var col;
          var gas;
          if (p[2] === "evap") { col = C.cold; gas = p[3] > 0.6; }
          else if (p[2] === "comp") { col = p[3] < 0.5 ? C.cold : C.hot; gas = true; }
          else if (p[2] === "cond") { col = C.hot; gas = p[3] < 0.4; }
          else { col = p[3] < 0.5 ? C.hot : C.cold; gas = false; }
          k.circle(p[0], p[1], gas ? 3 : 5, { fill: col, stroke: gas ? null : "#fff", width: 1 });
        }
        /* compressor and valve */
        var cw = Math.max(Math.min(w * 0.18, 110), 90);
        k.rect((L + R) / 2 - cw / 2, T - 18, cw, 36, { fill: C.card, stroke: C.ink, width: 2, radius: 8 });
        k.text("compressor", (L + R) / 2, T, { size: 12 });
        k.poly([[(L + R) / 2 - 14, B - 12], [(L + R) / 2 + 14, B + 12], [(L + R) / 2 + 14, B - 12], [(L + R) / 2 - 14, B + 12]], { fill: C.card, color: C.ink, width: 2, close: true });
        /* heat arrows */
        for (var q = 0; q < 3; q += 1) {
          var y = T + (B - T) * (0.3 + q * 0.2);
          var ph = S.t * 8;
          k.wave(Math.max(8, L - 70), y, L - 18, y, { color: C.heat, amp: 3, wavelength: 10, phase: ph, width: 2 });
          k.arrow(L - 22, y, L - 16, y, { color: C.heat, width: 2, head: 7 });
          k.wave(R + 18, y, Math.min(w - 8, R + 70), y, { color: C.heat, amp: 3, wavelength: 10, phase: ph, width: 2 });
          k.arrow(Math.min(w - 12, R + 66), y, Math.min(w - 6, R + 72), y, { color: C.heat, width: 2, head: 7 });
        }
        k.label("indoors", wallX - 8, 16, { align: "right" });
        k.label("outdoors", wallX + 8, 16, { align: "left" });
        k.label("evaporator", L, B + 26, {});
        k.label("condenser", R, B + 26, {});
        k.label(narrow ? "valve" : "expansion valve", (L + R) / 2, B + 30, {});
        k.label(narrow ? "heat in" : "heat from room", Math.max(L - 44, 40), T + (B - T) * 0.18, {});
        k.label(narrow ? "heat out" : "heat to outside", Math.min(R + 44, w - 40), T + (B - T) * 0.18, {});
        k.label("big dots: liquid", (L + R) / 2 - (narrow ? 62 : 80), h - 14, {});
        k.label("small dots: gas", (L + R) / 2 + (narrow ? 62 : 80), h - 14, {});
      }
    };
  });
})();
