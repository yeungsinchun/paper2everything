/* Book 8 Chapter 1 scenes (Lighting). Engine: ../../js/stage.js. */
(function () {
  "use strict";
  var scene = window.B8Stage.scene;

  function pct(v) {
    var r = Math.round(v * 10) / 10;
    return (r % 1 === 0 ? r.toFixed(0) : r.toFixed(1)) + "%";
  }

  /* Fig. 1.3 Efficiency chain: fuel → power station → transmission → appliance.
     Each dot is one share of the fuel's energy; it drops out at the stage that
     wastes it, so the dots that reach the end are the overall efficiency. */
  scene("efficiency-chain", function () {
    var dots = [];
    for (var i = 0; i < 70; i += 1) dots.push({ f: (i + 0.5) / 70, o: ((i * 37) % 70) / 70 });
    return {
      settle: 2.2,
      readouts: function (p) {
        return { plant: pct(p.plant), line: pct(p.line), app: pct(p.app), overall: pct(p.plant * p.line * p.app / 10000) };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var narrow = w < 520;
        var a = [1, S.p.plant / 100];
        a.push(a[1] * S.p.line / 100);
        a.push(a[2] * S.p.app / 100);
        var T = Math.min(h * 0.34, 104);
        var top = 72;
        var gx = [w * 0.04, w * 0.29, w * 0.54, w * 0.78, w * 0.97];
        var cols = [C.chemical, C.electric, C.electric, C.light];
        var i;
        /* losses first, so the main ribbon sits on top */
        for (i = 1; i <= 3; i += 1) {
          var lossT = T * (a[i - 1] - a[i]);
          if (lossT < 0.6) continue;
          var ym = top + T * (a[i] + a[i - 1]) / 2;
          var r = lossT / 2 + 6;
          var yEnd = h - 40;
          var ctx = S.ctx;
          ctx.save();
          ctx.strokeStyle = k.rgba(C.heat, 0.85);
          ctx.lineWidth = lossT;
          ctx.lineCap = "butt";
          ctx.beginPath();
          ctx.moveTo(gx[i] - 1, ym);
          ctx.arcTo(gx[i] + r, ym, gx[i] + r, ym + r, r);
          ctx.lineTo(gx[i] + r, yEnd);
          ctx.stroke();
          ctx.restore();
          var hw = Math.max(lossT / 2 + 4, 7);
          k.poly([[gx[i] + r - hw, yEnd], [gx[i] + r + hw, yEnd], [gx[i] + r, yEnd + Math.min(14, hw)]], { fill: k.rgba(C.heat, 0.85), close: true });
          k.label(pct((a[i - 1] - a[i]) * 100).replace("%", "") + " lost", gx[i] + r, h - 14, { border: C.heat });
        }
        for (i = 0; i < 4; i += 1) {
          var x2 = i === 3 ? gx[4] - 14 : gx[i + 1];
          k.rect(gx[i], top, x2 - gx[i] + 1, Math.max(T * a[i], 0.8), { fill: cols[i] });
        }
        var endT = Math.max(T * a[3], 0.8);
        k.poly([[gx[4] - 14, top - 6], [gx[4], top + endT / 2], [gx[4] - 14, top + endT + 6]], { fill: C.light, close: true });
        /* flowing dots */
        var len = gx[4] - gx[0];
        dots.forEach(function (d) {
          var s = ((S.t * 0.16 + d.o) % 1) * (len + 120);
          var exit = 0;
          for (var g = 1; g <= 3; g += 1) {
            if (d.f > a[g]) { exit = g; break; }
          }
          var y = top + d.f * T;
          var x = gx[0] + s;
          if (exit) {
            var lossT2 = T * (a[exit - 1] - a[exit]);
            var r2 = lossT2 / 2 + 6;
            var bendX = gx[exit] + r2;
            if (x > bendX) {
              var frac = (d.f - a[exit]) / Math.max(a[exit - 1] - a[exit], 1e-6);
              var xs = bendX + (0.5 - frac) * lossT2;
              y = y + (x - bendX);
              x = xs;
              if (y > h - 44) return;
            }
          } else if (x > gx[4] - 16) {
            return;
          }
          k.circle(x, y, 2.2, { fill: "rgba(255,255,255,0.85)" });
        });
        var names = narrow ? ["station", "lines", "appliance"] : ["power station", "transmission", "appliance"];
        for (i = 1; i <= 3; i += 1) {
          k.line(gx[i], top - 12, gx[i], top + T + 4, { color: C.ink3, width: 1.5, dash: [4, 4] });
          k.label(names[i - 1], gx[i], 22, {});
        }
        k.label("fuel 100", gx[0], top - 18, { align: "left", dot: C.chemical });
        k.label("useful " + pct(a[3] * 100).replace("%", ""), w - 4, top - 18, { align: "right", dot: C.light });
      }
    };
  });
  /* Wavelength (nm) to an sRGB colour for drawing visible light. */
  function spectrumColour(nm, alpha) {
    var r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780) { r = 1; }
    var f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (780 - nm) / 80 : 1;
    function c(v) { return Math.round(255 * Math.pow(Math.max(0, v) * f, 0.8)); }
    return "rgba(" + c(r) + "," + c(g) + "," + c(b) + "," + (alpha == null ? 1 : alpha) + ")";
  }

  /* CIE photopic sensitivity, Gaussian fit, normalised to 1 at 555 nm. */
  function eyeV(nm) {
    var u = nm / 1000 - 0.559;
    return Math.exp(-285.4 * u * u) / Math.exp(-285.4 * 0.004 * 0.004);
  }

  function colourName(nm) {
    if (nm < 450) return "violet";
    if (nm < 495) return "blue";
    if (nm < 570) return "green";
    if (nm < 590) return "yellow";
    if (nm < 620) return "orange";
    return "red";
  }

  /* Plot frame helper: returns a mapper from data to canvas pixels. */
  function frame(S, x0, x1, y0, y1, pad) {
    var L = pad.l, R = S.w - pad.r, T = pad.t, B = S.h - pad.b;
    return {
      L: L, R: R, T: T, B: B,
      x: function (v) { return L + (v - x0) / (x1 - x0) * (R - L); },
      y: function (v) { return B - (v - y0) / (y1 - y0) * (B - T); }
    };
  }

  function axes(S, f, xlab, ylab) {
    var k = S.k;
    k.arrow(f.L, f.B, f.R + 6, f.B, { color: S.C.ink2, width: 1.6, head: 8 });
    k.arrow(f.L, f.B, f.L, f.T - 8, { color: S.C.ink2, width: 1.6, head: 8 });
    k.text(xlab, f.R, f.B + 26, { size: 12, align: "right", color: S.C.ink2, weight: 600 });
    k.text(ylab, f.L + 8, f.T - 12, { size: 12, align: "left", color: S.C.ink2, weight: 600 });
  }

  /* Fig. 1.5 Eye sensitivity curve with a wavelength marker. */
  scene("eye-curve", function () {
    return {
      still: true,
      readouts: function (p) {
        return { lambda: p.lambda + " nm", colour: colourName(p.lambda), flux: Math.round(683 * eyeV(p.lambda)) + " lm" };
      },
      draw: function (S) {
        var k = S.k;
        var f = frame(S, 400, 700, 0, 1.08, { l: 36, r: 24, t: 34, b: 44 });
        var ctx = S.ctx;
        for (var nm = 400; nm < 700; nm += 2) {
          var x = f.x(nm);
          ctx.fillStyle = spectrumColour(nm, 0.55);
          ctx.fillRect(x, f.y(eyeV(nm)), f.x(nm + 2) - x + 0.5, f.B - f.y(eyeV(nm)));
        }
        var pts = [];
        for (nm = 400; nm <= 700; nm += 2) pts.push([f.x(nm), f.y(eyeV(nm))]);
        k.poly(pts, { color: S.C.ink, width: 2.5 });
        axes(S, f, "wavelength / nm", "eye sensitivity");
        [400, 500, 600, 700].forEach(function (v) {
          k.line(f.x(v), f.B, f.x(v), f.B + 5, { color: S.C.ink2, width: 1.5 });
          k.text(String(v), f.x(v), f.B + 13, { size: 12, color: S.C.ink2, weight: 600 });
        });
        var lam = S.p.lambda;
        var mx = f.x(lam);
        var my = f.y(eyeV(lam));
        k.line(mx, f.B, mx, my, { color: S.C.ink, width: 2, dash: [5, 4] });
        k.circle(mx, my, 6, { fill: spectrumColour(lam), stroke: S.C.ink, width: 2 });
        var lab = "sensitivity " + eyeV(lam).toFixed(2);
        k.label(lab, mx, my - 20, {});
      }
    };
  });

  /* Fig. 1.7 Energy levels: excitation, then emission of a wave carrying ΔE. */
  scene("energy-levels", function () {
    return {
      settle: 4.6,
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var P = 3.2;
        var cyc = Math.floor(S.t / P) % 2;
        var u = (S.t % P) / P;
        var xL = w * 0.08;
        var xR = w * 0.42;
        var y1 = h * 0.8;
        var y2 = h * 0.52;
        var y3 = h * 0.22;
        var top = cyc === 0 ? y2 : y3;
        var col = cyc === 0 ? spectrumColour(650) : spectrumColour(450);
        [[y1, "E₁"], [y2, "E₂"], [y3, "E₃"]].forEach(function (lv) {
          k.line(xL, lv[0], xR, lv[0], { color: C.ink, width: 3 });
          k.text(lv[1], xR + 16, lv[0], { size: 14, align: "left" });
        });
        var ex = (xL + xR) / 2;
        var ey;
        if (u < 0.25) {
          var a = k.smooth(u / 0.25);
          ey = k.lerp(y1, top, a);
          k.wave(ex - 96, y1 + 36, ex - 12, y1 + 8, { color: C.heat, amp: 4, wavelength: 10, phase: S.t * 12, taper: true });
        } else if (u < 0.45) {
          ey = top;
        } else if (u < 0.62) {
          ey = k.lerp(top, y1, k.smooth((u - 0.45) / 0.17));
        } else {
          ey = y1;
        }
        if (u >= 0.25 && u < 0.62) k.arrow(ex + 24, top + 6, ex + 24, y1 - 6, { color: C.ink3, width: 1.5, dash: [4, 4], head: 7 });
        if (u >= 0.25 && u < 0.62) k.label("ΔE", ex + 44, (top + y1) / 2, {});
        k.circle(ex, ey, 8, { fill: C.electron, stroke: "#fff", width: 2 });
        if (u >= 0.5) {
          var prog = k.clamp((u - 0.5) / 0.45, 0, 1);
          var x0 = ex + 30;
          var span = w - 30 - x0;
          var head = x0 + span * prog;
          var lam = cyc === 0 ? 30 : 16;
          k.wave(Math.max(x0, head - 150), y1 - 4, head, y1 - 4, { color: col, amp: 8, wavelength: lam, phase: S.t * 14, width: 3 });
          k.label(cyc === 0 ? "small drop: red light" : "big drop: blue light", Math.min(head, w - 80), y1 - 40, { dot: col });
        }
        if (u < 0.3) k.label("energy in", ex - 110, y1 + 40, { dot: C.heat, align: "right" });
        k.label("electron", ex - 16, ey - 22, { dot: C.electron, align: "right" });
      }
    };
  });

  var H = 6.626e-34, CL = 2.998e8, KB = 1.381e-23;
  function planck(nm, T) {
    var l = nm * 1e-9;
    return 1 / (Math.pow(l, 5) * (Math.exp(H * CL / (l * KB * T)) - 1));
  }
  function visibleShare(T) {
    var tot = 0, vis = 0;
    for (var nm = 50; nm < 40000; nm += nm < 3000 ? 5 : 50) {
      var step = nm < 3000 ? 5 : 50;
      var v = planck(nm + step / 2, T) * step;
      tot += v;
      if (nm >= 400 && nm < 700) vis += v;
    }
    return vis / tot;
  }
  function glowColour(T) {
    var t = T / 100, r, g, b;
    r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
    g = t <= 66 ? 99.47 * Math.log(t) - 161.1 : 288.1 * Math.pow(t - 60, -0.0755);
    b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305.0;
    function c(v) { return Math.round(Math.max(0, Math.min(255, v))); }
    return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
  }

  /* Fig. 1.8 Hot-filament spectrum against temperature. */
  scene("filament-spectrum", function () {
    return {
      still: true,
      readouts: function (p) {
        return { T: p.T + " K", peak: Math.round(2.898e6 / p.T / 10) * 10 + " nm", visible: Math.round(visibleShare(p.T) * 100) + "%" };
      },
      draw: function (S) {
        var k = S.k;
        var T = S.p.T;
        var narrow = S.w < 520;
        var f = frame(S, 100, 3000, 0, 1.1, { l: 36, r: narrow ? 20 : 120, t: 34, b: 44 });
        var ctx = S.ctx;
        for (var nm = 400; nm < 700; nm += 3) {
          ctx.fillStyle = spectrumColour(nm, 0.28);
          ctx.fillRect(f.x(nm), f.T, f.x(nm + 3) - f.x(nm) + 0.5, f.B - f.T);
        }
        var peak = planck(2.898e6 / T, T);
        var pts = [];
        for (nm = 100; nm <= 3000; nm += 10) pts.push([f.x(nm), f.y(planck(nm, T) / peak)]);
        var fill = pts.concat([[f.x(3000), f.B], [f.x(100), f.B]]);
        k.poly(fill, { fill: S.k.rgba(S.C.heat, 0.18), close: true });
        k.poly(pts, { color: S.C.heat, width: 2.5 });
        axes(S, f, "wavelength / nm", "intensity (scaled to peak)");
        [500, 1000, 2000, 3000].forEach(function (v) {
          k.line(f.x(v), f.B, f.x(v), f.B + 5, { color: S.C.ink2, width: 1.5 });
          k.text(String(v), f.x(v), f.B + 13, { size: 12, color: S.C.ink2, weight: 600 });
        });
        k.label("visible", f.x(550), f.T + 14, {});
        k.label("infrared", f.x(narrow ? 2300 : 2000), f.T + 14, { dot: S.C.heat });
        if (!narrow) {
          var gx = S.w - 60;
          var gy = S.h / 2;
          var g = glowColour(T);
          k.circle(gx, gy, 34, { fill: g, stroke: S.C.line, width: 2 });
          k.text("glow", gx, gy + 52, { size: 12, color: S.C.ink2, weight: 600 });
        }
      }
    };
  });

  /* Fig. 1.9 Fluorescent tube: electron → mercury → UV → phosphor → light. */
  scene("ftl", function () {
    var atoms = [[0.22, 0.35], [0.36, 0.7], [0.5, 0.3], [0.63, 0.62], [0.77, 0.38]];
    var electrons = [];
    for (var i = 0; i < 9; i += 1) electrons.push({ y: 0.2 + 0.6 * ((i * 0.37) % 1), o: i / 9 });
    var vis = [650, 545, 450, 610, 520];
    return {
      settle: 1.3,
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var x0 = w * 0.06;
        var x1 = w * 0.94;
        var yT = h * 0.32;
        var yB = h * 0.7;
        var th = yB - yT;
        k.rect(x0, yT, x1 - x0, th, { fill: C.paper, stroke: C.ink2, width: 2, radius: th / 2 });
        k.rect(x0 + 5, yT + 4, x1 - x0 - 10, th - 8, { stroke: k.rgba(C.light, 0.7), width: 5, radius: th / 2 - 4 });
        [x0 + th * 0.35, x1 - th * 0.35].forEach(function (fx) {
          var pts = [];
          for (var j = 0; j <= 8; j += 1) pts.push([fx + (j % 2 ? 6 : -6), yT + th * 0.25 + j * th * 0.0625]);
          k.poly(pts, { color: C.ink, width: 2 });
        });
        atoms.forEach(function (a) {
          k.circle(x0 + a[0] * (x1 - x0), yT + a[1] * th, 8, { fill: C.guide, stroke: C.ink2, width: 1.5 });
        });
        var span = x1 - x0 - th * 0.8;
        electrons.forEach(function (e) {
          var u = (S.t * 0.35 + e.o) % 1;
          var x = x0 + th * 0.4 + span * u * u;
          k.circle(x, yT + e.y * th, 3.5, { fill: C.electron });
        });
        var P = 2.6;
        atoms.forEach(function (a, n) {
          var ax = x0 + a[0] * (x1 - x0);
          var ay = yT + a[1] * th;
          var te = (S.t + n * P / atoms.length) % P;
          var up = a[1] < 0.5;
          var wallY = up ? yT + 6 : yB - 6;
          if (te < 0.25) k.circle(ax, ay, 8 + 10 * te / 0.25, { stroke: k.rgba(C.kinetic, 1 - te / 0.25), width: 2 });
          if (te < 0.8) {
            var pr = k.clamp(te / 0.7, 0, 1);
            var yy = k.lerp(ay, wallY, pr);
            k.wave(ax, ay + (up ? -9 : 9), ax, yy, { color: C.kinetic, amp: 3.5, wavelength: 7, phase: S.t * 20, width: 2 });
          } else if (te < 1.6) {
            var q = (te - 0.8) / 0.8;
            var outY = up ? wallY - 6 - q * (yT * 0.75) : wallY + 6 + q * ((h - yB) * 0.75);
            k.wave(ax, up ? wallY - 4 : wallY + 4, ax, outY, { color: spectrumColour(vis[n]), amp: 5, wavelength: 13, phase: S.t * 14, width: 2.5 });
          }
        });
        var narrow = w < 520;
        k.label("filament", x0 + th * 0.35, yB + 20, {});
        k.label(narrow ? "Hg atom" : "mercury atom", x0 + 0.5 * (x1 - x0), yT + 0.3 * th - 22, {});
        k.label("electrons →", x0 + 0.36 * (x1 - x0), yB + 20, { dot: C.electron });
        k.label("UV", x0 + 0.63 * (x1 - x0) + 30, yT + 0.62 * th + 16, { dot: C.kinetic });
        k.label(narrow ? "phosphor" : "phosphor coating", x0 + 0.86 * (x1 - x0), yT - 14, { dot: C.light });
        k.label("visible light", x0 + 0.2 * (x1 - x0), 16, {});
      }
    };
  });

  /* Fig. 1.10 LED: electrons and holes meet at the junction and give out light. */
  scene("led", function () {
    var N = 7;
    var carriers = [];
    for (var i = 0; i < N; i += 1) carriers.push({ y: 0.15 + 0.7 * ((i * 0.43) % 1), o: (i * 0.61) % 1 });
    return {
      settle: 2.3,
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var fwd = S.p.bias !== "reverse";
        var xL = w * 0.1;
        var xR = w * 0.9;
        var jx = w * 0.5;
        var yT = h * 0.34;
        var yB = h * 0.74;
        var bh = yB - yT;
        k.rect(xL, yT, jx - xL, bh, { fill: k.rgba(C.proton, 0.08), stroke: C.ink2, width: 2 });
        k.rect(jx, yT, xR - jx, bh, { fill: k.rgba(C.electron, 0.08), stroke: C.ink2, width: 2 });
        k.line(jx, yT - 8, jx, yB + 8, { color: C.ink, width: 2.5 });
        var half = jx - xL;
        var speed = 0.32;
        carriers.forEach(function (c) {
          var y = yT + c.y * bh;
          if (fwd) {
            var u = (S.t * speed + c.o) % 1;
            var ex = xR - 10 - (xR - 10 - jx) * u;
            var hx = xL + 10 + (jx - xL - 10) * u;
            k.circle(ex, y, 5, { fill: C.electron });
            k.circle(hx, y, 5, { fill: "#fff", stroke: C.proton, width: 2 });
            var age = ((S.t * speed + c.o) % 1) / speed;
            if (age < 1.1) {
              var px = jx + (c.o - 0.5) * 70;
              var py = y - age * (y - 6) / 1.1;
              k.wave(px, py, px + (c.o - 0.5) * 20, py - 26, { color: C.force, amp: 3.5, wavelength: 9, phase: S.t * 16, width: 2.4, taper: true });
            }
          } else {
            var jit = Math.sin(S.t * 3 + c.o * 10) * 3;
            var gap = half * 0.45;
            k.circle(jx + gap + (xR - jx - gap - 12) * c.o + jit, y, 5, { fill: C.electron });
            k.circle(jx - gap - (jx - xL - gap - 12) * c.o - jit, y, 5, { fill: "#fff", stroke: C.proton, width: 2 });
          }
        });
        var narrow = w < 520;
        k.label("p-type", xL + half / 2, yB + 20, {});
        k.label("n-type", jx + half / 2, yB + 20, {});
        k.label("hole", xL + 34, yT - 16, { dot: C.proton });
        k.label("electron", xR - 44, yT - 16, { dot: C.electron });
        if (fwd) k.label(narrow ? "light" : "light at the junction", jx, 16, { dot: C.force });
        else k.label("no current, no light", jx, 16, {});
        k.label(fwd ? "field p → n" : "field n → p", jx, h - 12, {});
      }
    };
  });

  /* Fig. 1.12 Lambert's cosine law: a fixed parallel beam on a tilting surface. */
  scene("lambert", function () {
    return {
      still: true,
      readouts: function (p) {
        var c = Math.cos(p.theta * Math.PI / 180);
        return { theta: p.theta + "°", area: "× " + (1 / c).toFixed(2), E: Math.round(500 * c) + " lx" };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var th = S.p.theta * Math.PI / 180;
        var cx = w * 0.5;
        var cy = h * 0.66;
        var b = Math.min(w * 0.18, 110);
        var tan = Math.tan(th);
        var yAt = function (x) { return cy + (x - cx) * tan; };
        var xa = cx - b / 2;
        var xb = cx + b / 2;
        k.poly([[xa, 26], [xb, 26], [xb, yAt(xb)], [xa, yAt(xa)]], { fill: k.rgba(C.light, 0.28), close: true });
        for (var i = 0; i <= 4; i += 1) {
          var x = xa + b * i / 4;
          k.arrow(x, 30, x, yAt(x) - 2, { color: C.light, width: 2, head: 8 });
        }
        var L = Math.min(w * 0.36, 220);
        var ux = Math.cos(th);
        var uy = Math.sin(th);
        k.line(cx - ux * L, cy - uy * L, cx + ux * L, cy + uy * L, { color: C.ink, width: 6, cap: "butt" });
        k.line(xa, yAt(xa), xb, yAt(xb), { color: C.heat, width: 6, cap: "butt" });
        var nx = Math.sin(th);
        var ny = -Math.cos(th);
        k.line(cx, cy, cx + nx * h * 0.42, cy + ny * h * 0.42, { color: C.ink2, width: 1.8, dash: [6, 5] });
        if (S.p.theta > 2) {
          var ctx = S.ctx;
          ctx.save();
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 46, -Math.PI / 2, Math.atan2(ny, nx), false);
          ctx.stroke();
          ctx.restore();
          k.text("θ", cx + 22 * Math.sin(th / 2) + 6, cy - 58 * Math.cos(th / 2) + 4, { size: 15 });
        }
        k.label("parallel beam", xb + 8, 46, { align: "left" });
        k.label("normal", cx + nx * h * 0.42, cy + ny * h * 0.42 - 6, {});
        k.label("lit area", xb + 14, yAt(xb) + 22, { align: "left", dot: C.heat });
      }
    };
  });

  /* Fig. 1.13 Inverse-square law: the same flux spreads over r² unit squares. */
  scene("inverse-square", function () {
    return {
      still: true,
      readouts: function (p) {
        return { r: p.r.toFixed(1) + " m", E: (1200 / (4 * Math.PI * p.r * p.r)).toFixed(1) + " lx", spread: "× " + (p.r * p.r).toFixed(2) };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var r = S.p.r;
        var sx = w * 0.07;
        var sy = h * 0.5;
        var sideW = w * 0.58;
        var unit = (sideW - 20) / 4;
        var half = Math.min(unit * 0.5, (h - 64) / 8);
        var scrX = sx + unit * r;
        var hh = half * r;
        k.poly([[sx, sy], [scrX, sy - hh], [scrX, sy + hh]], { fill: k.rgba(C.light, 0.3), close: true });
        k.line(sx, sy, scrX, sy - hh, { color: C.light, width: 2 });
        k.line(sx, sy, scrX, sy + hh, { color: C.light, width: 2 });
        for (var d = 1; d <= 4; d += 1) {
          var gx = sx + unit * d;
          k.line(gx, sy - half * d, gx, sy + half * d, { color: C.guide, width: 1.5, dash: [4, 4] });
          k.text(d + " m", gx, h - 14, { size: 12, color: C.ink2, weight: 600 });
        }
        k.line(scrX, sy - hh - 4, scrX, sy + hh + 4, { color: C.ink, width: 4 });
        k.circle(sx, sy, 7, { fill: C.light, stroke: C.ink, width: 2 });
        /* front view of the screen: r × r unit squares */
        var px = w * 0.7;
        var pw = w * 0.27;
        var cell = Math.min(pw / 4, (h - 70) / 4);
        var gy = (h - cell * 4) / 2 + 8;
        k.rect(px, gy, cell * 4, cell * 4, { stroke: C.line, width: 1.5 });
        for (var i = 1; i < 4; i += 1) {
          k.line(px + cell * i, gy, px + cell * i, gy + cell * 4, { color: C.lineSoft, width: 1.5 });
          k.line(px, gy + cell * i, px + cell * 4, gy + cell * i, { color: C.lineSoft, width: 1.5 });
        }
        var lit = cell * r;
        var alpha = k.clamp(0.95 / (r * r), 0.12, 0.95);
        k.rect(px, gy + cell * 4 - lit, lit, lit, { fill: k.rgba(C.light, alpha), stroke: C.light, width: 2 });
        k.text("screen, front view", px + cell * 2, gy - 14, { size: 12, color: C.ink2, weight: 600 });
        k.label("point source", sx + 8, sy - half - 26, { align: "left" });
      }
    };
  });

  /* Fig. 1.14 A point lamp above a floor: inverse square and cosine together. */
  scene("oblique", function () {
    var PHI = 2000, D = 2.5;
    return {
      still: true,
      readouts: function (p) {
        var r = Math.hypot(p.x, D);
        var c = D / r;
        return { x: p.x.toFixed(1) + " m", r: r.toFixed(2) + " m", cos: c.toFixed(3), E: (PHI * c / (4 * Math.PI * r * r)).toFixed(1) + " lx" };
      },
      draw: function (S) {
        var k = S.k;
        var C = S.C;
        var w = S.w;
        var h = S.h;
        var x = S.p.x;
        var floorY = h * 0.8;
        var sc = Math.min((w * 0.82) / 4.6, (floorY - 34) / D);
        var lx = w * 0.12;
        var ly = floorY - D * sc;
        var X = lx + x * sc;
        k.line(16, floorY, w - 16, floorY, { color: C.ink, width: 3 });
        k.line(lx, ly, lx, floorY, { color: C.ink2, width: 1.8, dash: [6, 5] });
        k.line(lx, ly, X, floorY, { color: C.light, width: 3 });
        k.line(X, floorY, X, floorY - D * sc * 0.6, { color: C.ink2, width: 1.5, dash: [4, 4] });
        k.rect(X - 14, floorY - 3, 28, 6, { fill: C.heat });
        k.circle(lx, ly, 9, { fill: C.light, stroke: C.ink, width: 2 });
        if (x > 0.15) {
          var ang = Math.atan2(floorY - ly, X - lx);
          var ctx = S.ctx;
          ctx.save();
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(X, floorY, 30, -Math.PI / 2, ang + Math.PI, true);
          ctx.stroke();
          ctx.restore();
          k.text("θ", X - 12, floorY - 44, { size: 15 });
        }
        k.label("d = 2.5 m", lx + 4, (ly + floorY) / 2, { align: "left" });
        k.label("r", (lx + X) / 2 + 12, (ly + floorY) / 2 - 16, {});
        k.label("lamp, 2000 lm", lx - 4, ly - 22, { align: "left" });
        k.label("surface X", X, floorY + 20, { dot: C.heat });
      }
    };
  });
})();
