/* Book 3 Ch.1 (syllabus 13) scenes: waves, kinds of waves, wave terms,
   particle motion and the s-d / s-t graphs. Drawn with ../js/stage.js. */
(function () {
  "use strict";
  var TAU = Math.PI * 2;

  function pulse(x) {
    return Math.exp(-x * x / 0.18);
  }

  /* Fig. 13.3 idea: a hand flicks the first ball of a ball-and-spring chain
     once; the bump travels along while each ball only moves up and back. */
  B3.scene("ballspring", function (api) {
    var C = api.C;
    var N = 19;
    var v = 2.2;
    api.view(-0.6, 9.7, -1.0, 1.75);
    function y(x, t) {
      var c = v * (t - 0.6);
      return 1.05 * pulse(x - c) * (x <= c + 1.4 ? 1 : 1);
    }
    return {
      clip: 4.6,
      settle: 2.4,
      draw: function (t) {
        var i, x, pts = [];
        for (i = 0; i < N; i += 1) {
          x = i * 0.5;
          pts.push([x, x === 0 ? 1.05 * pulse(v * (0.6 - t)) : y(x, t)]);
        }
        api.line(-0.3, 0, 9.3, 0, C.guide, 1.2, [5, 5]);
        api.line(9.35, -0.8, 9.35, 1.35, C.ink, 4);
        api.path(pts.concat([[9.35, 0]]), C.muted, 1.6, [3, 3]);
        for (i = 0; i < N; i += 1) {
          api.dot(pts[i][0], pts[i][1], api.narrow() ? 4.5 : 6, i === 8 ? C.disp : C.ink);
        }
        var tag = pts[8];
        api.line(tag[0], 0, tag[0], tag[1], C.disp, 1.6);
        var peak = v * (t - 0.6);
        api.hud("pulse", Math.max(0.6, Math.min(8.6, peak)), 1.45, null, peak < 0.2 || peak > 9);
        api.hud("hand", 1.1, -0.6);
        api.hud("ball", tag[0], -0.5);
      }
    };
  });

  /* Fig. 13.6 idea: a leaf on a pond rides up and down as ripples pass; it is
     not carried along, so the wave moves energy, not water. */
  B3.scene("leaf", function (api) {
    var C = api.C;
    var lam = 2.4, f = 0.55, A = 0.42;
    api.view(-5, 5, -1.6, 1.7);
    function s(x, t) { return A * Math.sin(TAU * (x / lam - f * t)); }
    return {
      clip: 0,
      settle: 1.1,
      draw: function (t) {
        var pts = [];
        var x;
        for (x = -5; x <= 5.001; x += 0.05) pts.push([x, s(x, t)]);
        api.path(pts.concat([[5, -1.6], [-5, -1.6]]), null, 0, null, true, C.soft);
        api.path(pts, C.field, 2.4);
        api.line(-5, 0, 5, 0, C.guide, 1, [5, 5]);
        var ly = s(0, t);
        api.path([[-0.42, ly + 0.02], [0, ly + 0.17], [0.42, ly + 0.02], [0, ly - 0.06]], null, 0, null, true, C.field);
        api.arrow(0.65, 0, 0.65, s(0, t + 0.05) > ly ? 0.55 : -0.55, C.vel, 2, 9);
        api.arrow(-4.4, 1.35, -2.2, 1.35, C.energy, 2.4, 11);
        api.hud("leaf", 0, 1.05);
        api.hud("energy", -3.3, 1.62);
      }
    };
  });

  /* Transverse and longitudinal waves, one row of particles each. */
  function particleWave(api, kind) {
    var C = api.C;
    var lam = 4, f = 0.5, A = kind === "t" ? 0.7 : 0.38;
    var N = 25;
    api.view(-0.6, 12.6, -1.5, 1.6);
    function s(x0, t) { return A * Math.sin(TAU * (f * t - x0 / lam)); }
    return {
      clip: 0,
      settle: 0.5,
      draw: function (t) {
        var i, x0, sp, X, Y;
        var rows = kind === "t" ? [0] : [-0.5, 0, 0.5];
        api.line(-0.4, kind === "t" ? 0 : -0.95, 12.4, kind === "t" ? 0 : -0.95, C.guide, 1, [5, 5]);
        for (i = 0; i < N; i += 1) {
          x0 = i * 0.5;
          sp = s(x0, t);
          X = kind === "t" ? x0 : x0 + sp;
          Y = kind === "t" ? sp : 0;
          rows.forEach(function (ry) {
            var tagged = i === 12;
            api.dot(X, Y + ry, api.narrow() ? 3.5 : 5, tagged ? C.disp : C.ink);
          });
          if (kind === "l") api.line(x0, -0.9, x0, -1.0, C.guide, 1);
        }
        var tx0 = 6;
        var tsp = s(tx0, t);
        var vel = A * TAU * f * Math.cos(TAU * (f * t - tx0 / lam));
        if (kind === "t") {
          api.arrow(tx0 + 0.35, tsp, tx0 + 0.35, tsp + vel * 0.45, C.vel, 2, 9);
          api.hud("particle", tx0, -1.15, null);
        } else {
          api.arrow(tx0 + tsp, 0.85, tx0 + tsp + vel * 0.45, 0.85, C.vel, 2, 9);
          api.hud("particle", tx0 + tsp, 1.3, null);
          /* compression centre: where s = 0 and s is falling with x, i.e. where
             the particles on both sides close in */
          var cx = ((f * t * lam) % lam + lam) % lam;
          var rx = cx + lam / 2;
          if (rx > 12) rx -= lam;
          api.hud("comp", cx + (cx < 1.2 ? lam : 0), -1.3);
          api.hud("rare", rx + (rx < 1.2 ? lam : 0), -1.3);
        }
        api.arrow(8.6, 1.35, 11.6, 1.35, C.energy, 2.4, 11);
        api.hud("travel", 10.1, 1.0);
      }
    };
  }
  B3.scene("transverse", function (api) { return particleWave(api, "t"); });
  B3.scene("longitudinal", function (api) { return particleWave(api, "l"); });

  /* Fig. 13.15 + 13.18: one wave train with its terms. Frequency is set by the
     source; speed is set by the spring (tension). So lambda = v / f follows. */
  B3.scene("terms", function (api) {
    var C = api.C;
    var A = 0.8;
    api.view(-0.3, 10.3, -1.55, 1.75);
    var shift = 0;
    var last = null;
    function speed() { return api.param("tension", "low") === "high" ? 4.8 : 2.4; }
    function out() {
      var f = api.param("f", 1);
      var v = speed();
      var lam = v / f;
      api.out("f", f.toFixed(1) + " Hz");
      api.out("T", "T = " + (1 / f).toFixed(2) + " s");
      api.out("lam", "λ = " + lam.toFixed(2) + " m");
      api.out("v", "v = " + v.toFixed(1) + " m/s");
    }
    return {
      clip: 0,
      settle: 0,
      ready: function () { out(); api.onParam(out); },
      draw: function (t) {
        var f = api.param("f", 1);
        var v = speed();
        var lam = v / f;
        if (last != null) shift += (t - last) * v;
        last = t;
        if (B3.reduced) shift = 0;
        var phase = function (x) { return TAU * (x - shift) / lam; };
        api.line(0, 0, 10, 0, C.guide, 1.2, [5, 5]);
        api.curve(function (x) { return A * Math.sin(phase(x)); }, 0, 10, C.disp, 2.6);
        /* first crest at or after x = 0.5 */
        var xc = shift + lam / 4;
        xc = xc - Math.floor((xc - 0.5) / lam) * lam;
        if (xc + lam <= 9.8) {
          api.line(xc, A, xc, A + 0.55, C.guide, 1, [3, 3]);
          api.line(xc + lam, A, xc + lam, A + 0.55, C.guide, 1, [3, 3]);
          api.span(xc, A + 0.42, xc + lam, A + 0.42, C.dist);
          api.hud("lam", xc + lam / 2, A + 0.62);
        } else {
          api.hud("lam", 0, 0, null, true);
        }
        api.span(xc, 0, xc, A, C.dist);
        api.hud("amp", xc + 0.12, A / 2, null);
        api.hud("crest", xc + lam, A + 0.24, null, xc + lam > 9.8);
        var xt = xc + lam / 2;
        if (xt > 9.8) xt -= lam;
        api.hud("trough", xt, -A - 0.32);
        api.hud("eq", 9.3, 0.2);
      }
    };
  });

  /* Phase: pick a reference particle; the ones a whole wavelength away move
     with it (in phase), the ones half a wavelength away move against it. */
  B3.scene("phase", function (api) {
    var C = api.C;
    var lam = 4, f = 0.35, A = 0.85;
    var names = "ABCDEFGHIJ".split("");
    api.view(-0.5, 9.6, -1.6, 1.7);
    function s(x, t) { return A * Math.sin(TAU * (f * t - x / lam)); }
    return {
      clip: 0,
      settle: 0.4,
      draw: function (t) {
        var ref = names.indexOf(api.param("ref", "C"));
        if (ref < 0) ref = 2;
        api.line(-0.3, 0, 9.4, 0, C.guide, 1, [5, 5]);
        api.curve(function (x) { return s(x, t); }, 0, 9.1, C.muted, 1.6);
        var inPhase = [], anti = [];
        names.forEach(function (nm, i) {
          var x = i;
          var d = ((i - ref) % 4 + 4) % 4;
          var y = s(x, t);
          var fill = C.ink, ring = null, r = 5;
          if (i === ref) { fill = C.disp; r = 7; }
          else if (d === 0) { fill = C.disp; inPhase.push(nm); }
          else if (d === 2) { fill = "#ffffff"; ring = C.disp; anti.push(nm); }
          api.dot(x, y, r, fill, ring);
          api.text(nm, x, -1.35, C.ink, "center", 13);
        });
        api.out("inphase", inPhase.length ? inPhase.join(", ") : "none");
        api.out("anti", anti.length ? anti.join(", ") : "none");
        api.hud("ref", ref, s(ref, t) + 0.42, names[ref]);
      }
    };
  });

  /* s-d graph (a snapshot of every particle) above, s-t graph (one particle
     over time) below. The marked particle C links the two. */
  B3.scene("sdst", function (api) {
    var C = api.C;
    var lam = 4, T = 4, A = 1;
    var xC = 1;
    api.view(-0.9, 9.5, -4.6, 1.95);
    function s(x, t) { return A * Math.sin(TAU * (t / T - x / lam)); }
    return {
      clip: 0,
      settle: 1.4,
      draw: function (t) {
        var tt = t % (2 * T);
        /* top: s-d */
        api.arrow(-0.3, 0, 9.2, 0, C.ink, 1.4, 8);
        api.arrow(0, -1.25, 0, 1.45, C.ink, 1.4, 8);
        api.text("s", -0.45, 1.3, C.ink, "center", 12);
        api.text("d", 9.25, -0.3, C.ink, "center", 12);
        api.curve(function (x) { return s(x, tt); }, 0, 8.8, C.disp, 2.4);
        api.dot(xC, s(xC, tt), 6, C.disp);
        api.line(xC, -1.15, xC, 1.15, C.guide, 1, [3, 3]);
        /* bottom: s-t of particle C, 0 .. 2T mapped onto 0 .. 8.8 */
        var y0 = -3;
        var k = 8.8 / (2 * T);
        api.arrow(-0.3, y0, 9.2, y0, C.ink, 1.4, 8);
        api.arrow(0, y0 - 1.25, 0, y0 + 1.45, C.ink, 1.4, 8);
        api.text("s", -0.45, y0 + 1.3, C.ink, "center", 12);
        api.text("t", 9.25, y0 - 0.3, C.ink, "center", 12);
        api.curve(function (x) { return y0 + s(xC, x / k); }, 0, 8.8, C.guide, 1.4, [4, 4]);
        api.curve(function (x) { return y0 + s(xC, x / k); }, 0, tt * k, C.disp, 2.4);
        api.dot(tt * k, y0 + s(xC, tt), 6, C.disp);
        api.span(0.02, y0 - 1.15, T * k, y0 - 1.15, C.dist);
        api.span(0.6, 1.25, 0.6 + lam, 1.25, C.dist);
        api.hud("sd", 6.6, 1.25);
        api.hud("st", 6.6, y0 + 1.25);
        api.hud("lam", 0.6 + lam / 2, 1.55);
        api.hud("T", T * k / 2, y0 - 1.45);
        api.hud("c", xC + 0.45, s(xC, tt) + 0.35);
      }
    };
  });

  /* Longitudinal wave with its s-d graph underneath. Displacement to the
     right is positive, so a compression centre sits where s = 0 and the
     graph slopes down; a rarefaction centre where s = 0 and it slopes up. */
  B3.scene("longsd", function (api) {
    var C = api.C;
    var lam = 6, f = 0.18, A = 0.75;
    api.view(-0.8, 12.6, -3.3, 1.5);
    function s(x0, t) { return A * Math.sin(TAU * (f * t - x0 / lam)); }
    return {
      clip: 0,
      settle: 0,
      draw: function (t) {
        var i, x0;
        for (i = 0; i <= 24; i += 1) {
          x0 = i * 0.5;
          api.line(x0, 0.55, x0, 0.75, C.guide, 1);
          api.dot(x0 + s(x0, t), 0.95, api.narrow() ? 3.5 : 5, C.ink);
        }
        var y0 = -1.6;
        api.arrow(-0.3, y0, 12.4, y0, C.ink, 1.4, 8);
        api.arrow(0, y0 - 1.25, 0, y0 + 1.35, C.ink, 1.4, 8);
        api.text("s", -0.45, y0 + 1.2, C.ink, "center", 12);
        api.text("d", 12.45, y0 - 0.3, C.ink, "center", 12);
        api.curve(function (x) { return y0 + s(x, t); }, 0, 12, C.disp, 2.4);
        /* zeros of sin(TAU(f t - x/lam)): x = lam (f t - m / 2) */
        var base = lam * f * t;
        var m, xz, comp = null, rare = null;
        for (m = -10; m <= 10; m += 1) {
          xz = base - m * lam / 2;
          if (xz < 0.8 || xz > 11.2) continue;
          var slope = -Math.cos(TAU * (f * t - xz / lam));
          if (slope < 0 && comp == null) comp = xz;
          if (slope > 0 && rare == null) rare = xz;
        }
        if (comp != null) {
          api.line(comp, y0, comp, 0.6, C.field, 1.4, [4, 4]);
          api.hud("comp", comp, 1.35);
        }
        if (rare != null) {
          api.line(rare, y0, rare, 0.6, C.guide, 1.4, [4, 4]);
          api.hud("rare", rare, 1.35);
        }
        api.hud("comp", comp == null ? 0 : comp, 1.35, null, comp == null);
        api.hud("rare", rare == null ? 0 : rare, 1.35, null, rare == null);
      }
    };
  });
})();
