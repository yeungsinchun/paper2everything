/* Book 9 Ch.1 scenes (Vision and Hearing). Drawn by ../../js/stage.js. */
(function () {
  "use strict";
  var S = window.B9Stage;
  if (!S) return;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmt(v, d) { return Number(v).toFixed(d); }

  /* ---------- the eye, shared by the focusing scenes ---------- */

  var EYE = { cx: 470, cy: 160, r: 112, cornea: 352, lens: 398, retina: 580 };

  function drawEyeball(g, lensHalfWidth) {
    var c = g.c;
    g.circle(EYE.cx, EYE.cy, EYE.r, { c: c.ink, w: 2.5, fill: c.bg });
    /* cornea bulge */
    g.ctx.beginPath();
    g.style({ c: c.ink, w: 2.5 });
    g.ctx.ellipse(EYE.cx - EYE.r + 6, EYE.cy, 20, 62, 0, Math.PI / 2, Math.PI * 1.5);
    g.ctx.stroke();
    /* retina: thick arc at the back */
    g.ctx.beginPath();
    g.style({ c: c.teal600, w: 5 });
    g.ctx.arc(EYE.cx, EYE.cy, EYE.r - 3, -0.75, 0.75);
    g.ctx.stroke();
    /* iris above and below the lens */
    g.line(EYE.lens - 4, EYE.cy - 72, EYE.lens - 4, EYE.cy - 50, { c: c.muted, w: 4 });
    g.line(EYE.lens - 4, EYE.cy + 50, EYE.lens - 4, EYE.cy + 72, { c: c.muted, w: 4 });
    /* lens */
    g.ellipse(EYE.lens + 8, EYE.cy, lensHalfWidth, 46, { c: c.ink, w: 2, fill: c.teal50 });
    /* optic nerve */
    /* optic nerve leaves below the axis (the blind spot); the yellow spot is on the axis */
    g.poly([[EYE.cx + 100, EYE.cy + 40], [EYE.cx + 150, EYE.cy + 52], [EYE.cx + 150, EYE.cy + 70], [EYE.cx + 94, EYE.cy + 58]], { c: c.ink, w: 1.5, fill: c.lineSoft, close: true });
    g.circle(EYE.retina + 2, EYE.cy, 4, { fill: c.sun400 });
  }

  /* ---------- 1.1 B/C: eye power and accommodation ---------- */

  var EYE_DEPTH = 0.02; /* m, cornea to retina in the simplified eye */
  var P_FAR = 1 / EYE_DEPTH; /* 50 D: power needed for an object at infinity */
  var NEAR_POINT = 0.25; /* m */
  var P_MAX = P_FAR + 1 / NEAR_POINT; /* 54 D */

  function eyeU(s) {
    /* slider 0..100: 100 is infinity, otherwise 10 cm to 5 m on a log scale */
    if (s >= 100) return Infinity;
    return 0.1 * Math.pow(50, s / 99);
  }

  function eyeModel(state) {
    var u = eyeU(state.u);
    var need = P_FAR + (isFinite(u) ? 1 / u : 0);
    var P = Math.min(need, P_MAX);
    var vImage = 1 / (P - (isFinite(u) ? 1 / u : 0));
    return { u: u, need: need, P: P, v: vImage, sharp: need <= P_MAX + 1e-9 };
  }

  S.scene("eye-power", {
    state: { u: 100 },
    draw: function (g, t, st) {
      var c = g.c;
      var m = eyeModel(st);
      var axisY = EYE.cy;
      g.line(18, axisY, 630, axisY, { c: c.guide, w: 1.5, dash: [6, 6] });
      var lensW = 9 + (m.P - P_FAR) * 3.2;
      drawEyeball(g, lensW);
      /* where the rays meet, measured from the lens, scaled so 2 cm = lens to retina */
      var scale = (EYE.retina - EYE.lens) / EYE_DEPTH;
      var meetX = EYE.lens + m.v * scale;
      var heights = [-40, -20, 20, 40];
      var srcX;
      if (!isFinite(m.u)) {
        heights.forEach(function (h) {
          g.line(22, axisY + h, EYE.lens, axisY + h, { c: c.energy, w: 2 });
        });
        g.text("parallel rays", 24, axisY - 62, { size: 13, c: c.muted, weight: 600, align: "left" });
      } else {
        /* object position: log scale from 5 m (x = 40) to 10 cm (x = 300) */
        var f = Math.log(m.u / 0.1) / Math.log(50);
        srcX = 300 - f * 260;
        g.circle(srcX, axisY, 7, { fill: c.energy });
        heights.forEach(function (h) {
          g.line(srcX, axisY, EYE.lens, axisY + h, { c: c.energy, w: 2 });
        });
        g.text("u = " + (m.u >= 1 ? fmt(m.u, 1) + " m" : fmt(m.u * 100, 0) + " cm"), srcX, axisY - 26, { size: 13, mono: true });
      }
      heights.forEach(function (h) {
        var endX = Math.min(meetX, EYE.retina);
        var y0 = axisY + h;
        var k = (endX - EYE.lens) / (meetX - EYE.lens);
        g.line(EYE.lens, y0, endX, y0 + (axisY - y0) * k, { c: c.energy, w: 2 });
        if (meetX > EYE.retina + 1) {
          g.line(endX, y0 + (axisY - y0) * k, meetX, axisY, { c: c.energy, w: 1.5, dash: [4, 5], alpha: 0.7 });
        }
      });
      if (m.sharp) {
        g.circle(EYE.retina, axisY, 5, { fill: c.ok });
        g.text("sharp image on the retina", EYE.cx, axisY + EYE.r + 22, { size: 13, c: c.ok });
      } else {
        g.text("closer than the near point: blurred", EYE.cx, axisY + EYE.r + 22, { size: 13, c: c.nudge });
      }
      g.text("lens", EYE.lens + 8, axisY - 88, { size: 13 });
      g.text("retina", EYE.retina + 12, axisY - 92, { size: 13, c: c.teal700 });
    },
    outputs: function (st) {
      var m = eyeModel(st);
      var uText = isFinite(m.u) ? (m.u >= 1 ? fmt(m.u, 1) + " m" : fmt(m.u * 100, 0) + " cm") : "infinity";
      var cil;
      if (!isFinite(m.u)) cil = "ciliary muscle relaxed, lens thin";
      else if (m.sharp) cil = "ciliary muscle contracted, lens fatter";
      else cil = "ciliary muscle fully contracted, lens at its fattest";
      return {
        u: "u = " + uText,
        P: "P needed = " + fmt(m.need, 1) + " D",
        state: m.sharp ? cil : cil + "; still not enough"
      };
    }
  });

  /* ---------- 1.1 D: resolving power ---------- */

  /* Bessel J1 (Abramowitz and Stegun 9.4.4 and 9.4.6). */
  function besselJ1(x) {
    var ax = Math.abs(x);
    if (ax < 3) {
      var y = (x / 3) * (x / 3);
      return x * (0.5 - 0.56249985 * y + 0.21093573 * y * y - 0.03954289 * y * y * y + 0.00443319 * y * y * y * y - 0.00031761 * y * y * y * y * y + 0.00001109 * y * y * y * y * y * y);
    }
    var z = 3 / ax;
    var f1 = 0.79788456 + 0.00000156 * z + 0.01659667 * z * z + 0.00017105 * z * z * z - 0.00249511 * z * z * z * z + 0.00113653 * z * z * z * z * z - 0.00020033 * z * z * z * z * z * z;
    var th = ax - 2.35619449 + 0.12499612 * z + 0.0000565 * z * z - 0.00637879 * z * z * z + 0.00074348 * z * z * z * z + 0.00079824 * z * z * z * z * z - 0.00029166 * z * z * z * z * z * z;
    var r = f1 * Math.cos(th) / Math.sqrt(ax);
    return x < 0 ? -r : r;
  }

  function airy(phi, thetaMin) {
    var x = 3.8317 * phi / thetaMin;
    if (Math.abs(x) < 1e-6) return 1;
    var v = 2 * besselJ1(x) / x;
    return v * v;
  }

  function resolveModel(st) {
    var D = st.D / 1000;
    var lam = st.lam * 1e-9;
    var tmin = 1.22 * lam / D; /* rad */
    var sep = st.sep * 1e-6;
    return { tmin: tmin, sep: sep, ok: sep >= tmin };
  }

  S.scene("resolve", {
    state: { sep: 300, D: 3, lam: 550 },
    draw: function (g, t, st) {
      var c = g.c;
      var m = resolveModel(st);
      var x0 = 40, x1 = 600, yBase = 210, h = 150;
      var span = 900e-6; /* plotted angle range, rad, each side */
      function X(phi) { return x0 + (phi + span) / (2 * span) * (x1 - x0); }
      g.line(x0, yBase, x1, yBase, { c: c.guide, w: 1.5 });
      var a = [], b = [], sum = [];
      for (var i = 0; i <= 280; i += 1) {
        var phi = -span + (2 * span) * i / 280;
        var ia = airy(phi + m.sep / 2, m.tmin);
        var ib = airy(phi - m.sep / 2, m.tmin);
        a.push([X(phi), yBase - ia * h]);
        b.push([X(phi), yBase - ib * h]);
        sum.push([X(phi), yBase - Math.min(ia + ib, 1.25) * h * 0.8]);
      }
      g.poly(a, { c: c.guide, w: 1.5, dash: [5, 5] });
      g.poly(b, { c: c.guide, w: 1.5, dash: [5, 5] });
      g.poly(sum, { c: m.ok ? c.teal600 : c.nudge, w: 3 });
      /* the image on the retina as a grey strip */
      var stripY = 240, stripH = 34;
      for (var j = 0; j < 140; j += 1) {
        var p = -span + (2 * span) * (j + 0.5) / 140;
        var v = Math.min(airy(p + m.sep / 2, m.tmin) + airy(p - m.sep / 2, m.tmin), 1);
        g.rect(X(p) - (x1 - x0) / 280 - 0.5, stripY, (x1 - x0) / 140 + 1, stripH, { fill: c.ink, alpha: v });
      }
      g.rect(x0, stripY, x1 - x0, stripH, { c: c.line, w: 1.5 });
      g.text("image on the retina", (x0 + x1) / 2, stripY + stripH + 18, { size: 13, c: c.muted, weight: 600 });
      g.text(m.ok ? "two dots: resolved" : "one blur: not resolved", (x0 + x1) / 2, 34, { size: 15, c: m.ok ? c.teal700 : c.nudge });
    },
    outputs: function (st) {
      var m = resolveModel(st);
      return {
        sep: "θ = " + Math.round(m.sep * 1e6) + " μrad",
        D: "D = " + fmt(st.D, 1) + " mm",
        tmin: "θmin = " + Math.round(m.tmin * 1e6) + " μrad",
        verdict: m.ok ? "θ ≥ θmin: resolved" : "θ < θmin: not resolved"
      };
    }
  });

  /* ---------- 1.1 E: spectral response ---------- */

  function gauss(x, mu, s) { return Math.exp(-0.5 * ((x - mu) / s) * ((x - mu) / s)); }
  var RECEPTORS = [
    { key: "s", name: "S", mu: 440, s: 24 },
    { key: "m", name: "M", mu: 535, s: 40 },
    { key: "l", name: "L", mu: 565, s: 46 }
  ];
  function rodResponse(l) { return gauss(l, 505, 42); }

  /* Approximate visible colour of a wavelength, for the spectrum strip only. */
  function spectrumColour(l) {
    var r = 0, gr = 0, b = 0;
    if (l < 440) { r = -(l - 440) / 60; b = 1; }
    else if (l < 490) { gr = (l - 440) / 50; b = 1; }
    else if (l < 510) { gr = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; gr = 1; }
    else if (l < 645) { r = 1; gr = -(l - 645) / 65; }
    else { r = 1; }
    var f = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : l > 700 ? 0.3 + 0.7 * (750 - l) / 50 : 1;
    function ch(v) { return Math.round(255 * Math.pow(clamp(v * f, 0, 1), 0.8)); }
    return "rgb(" + ch(r) + "," + ch(gr) + "," + ch(b) + ")";
  }

  S.scene("cones", {
    state: { lam: 555 },
    draw: function (g, t, st) {
      var c = g.c;
      var x0 = 60, x1 = 610, y0 = 250, h = 190;
      function X(l) { return x0 + (l - 380) / (750 - 380) * (x1 - x0); }
      for (var l = 380; l < 750; l += 2) g.rect(X(l), y0 + 6, X(l + 2) - X(l) + 0.6, 16, { fill: spectrumColour(l) });
      g.line(x0, y0, x1, y0, { c: c.ink, w: 2 });
      g.line(x0, y0, x0, y0 - h - 10, { c: c.ink, w: 2 });
      [400, 500, 600, 700].forEach(function (v) {
        g.text(String(v), X(v), y0 + 38, { size: 12, mono: true, c: c.muted, weight: 500 });
      });
      g.text("wavelength / nm", (x0 + x1) / 2, y0 + 60, { size: 12, c: c.muted, weight: 600 });
      var styles = { s: { c: c.ink, dash: null }, m: { c: c.teal600, dash: null }, l: { c: c.sun700, dash: null } };
      RECEPTORS.forEach(function (r) {
        var pts = [];
        for (var k = 380; k <= 750; k += 3) pts.push([X(k), y0 - gauss(k, r.mu, r.s) * h]);
        g.poly(pts, { c: styles[r.key].c, w: 2.5 });
        g.text(r.name, X(r.mu), y0 - h - 8, { size: 14, c: styles[r.key].c });
      });
      var rod = [];
      for (var q = 380; q <= 750; q += 3) rod.push([X(q), y0 - rodResponse(q) * h * 0.9]);
      g.poly(rod, { c: c.faint, w: 2, dash: [6, 5] });
      g.text("dashed: rods", x1, y0 - h - 8, { size: 13, c: c.faint, align: "right" });
      var lx = X(st.lam);
      g.line(lx, y0, lx, y0 - h - 4, { c: c.ink, w: 1.5, dash: [3, 4] });
      RECEPTORS.forEach(function (r) {
        var v = gauss(st.lam, r.mu, r.s);
        if (v > 0.02) g.circle(lx, y0 - v * h, 6, { fill: styles[r.key].c });
      });
    },
    outputs: function (st) {
      var o = { lam: st.lam + " nm" };
      RECEPTORS.forEach(function (r) { o[r.key] = r.name + " " + Math.round(gauss(st.lam, r.mu, r.s) * 100) + "%"; });
      return o;
    }
  });

  /* ---------- 1.1 F: short and long sight ---------- */

  S.scene("defects", {
    state: { eye: "normal", obj: "far", lens: "off" },
    draw: function (g, t, st) {
      var c = g.c;
      var axisY = EYE.cy;
      g.line(18, axisY, 630, axisY, { c: c.guide, w: 1.5, dash: [6, 6] });
      drawEyeball(g, st.obj === "near" ? 16 : 11);
      var corrected = st.lens === "on" && st.eye !== "normal";
      /* where the eye brings the rays to a focus, before any correction */
      var shift = 0;
      if (st.eye === "short" && st.obj === "far") shift = -52;
      if (st.eye === "long" && st.obj === "near") shift = 52;
      if (corrected) shift = 0;
      var meetX = EYE.retina + shift;
      var heights = [-36, -14, 14, 36];
      var specX = 300;
      var srcX = 70;
      heights.forEach(function (h) {
        var entryY = axisY + h;
        if (st.obj === "far") {
          if (st.lens === "on" && st.eye === "short") {
            g.line(20, axisY + h * 0.7, specX, axisY + h * 0.7, { c: c.energy, w: 2 });
            g.line(specX, axisY + h * 0.7, EYE.cornea, entryY, { c: c.energy, w: 2 });
          } else {
            g.line(20, entryY, EYE.cornea, entryY, { c: c.energy, w: 2 });
          }
        } else {
          if (st.lens === "on" && st.eye === "long") {
            g.line(srcX, axisY, specX, axisY + h * 1.2, { c: c.energy, w: 2 });
            g.line(specX, axisY + h * 1.2, EYE.cornea, entryY, { c: c.energy, w: 2 });
          } else {
            g.line(srcX, axisY, EYE.cornea, entryY, { c: c.energy, w: 2 });
          }
        }
        var endX = Math.min(meetX, EYE.retina);
        if (meetX < EYE.retina) {
          g.line(EYE.cornea, entryY, meetX, axisY, { c: c.energy, w: 2 });
          var k = (EYE.retina - EYE.cornea) / (meetX - EYE.cornea);
          g.line(meetX, axisY, EYE.retina, entryY + (axisY - entryY) * k, { c: c.energy, w: 2 });
        } else {
          var kk = (endX - EYE.cornea) / (meetX - EYE.cornea);
          g.line(EYE.cornea, entryY, endX, entryY + (axisY - entryY) * kk, { c: c.energy, w: 2 });
          if (meetX > EYE.retina + 1) g.line(endX, entryY + (axisY - entryY) * kk, meetX, axisY, { c: c.energy, w: 1.5, dash: [4, 5], alpha: 0.7 });
        }
      });
      if (st.obj === "near") {
        g.circle(srcX, axisY, 7, { fill: c.energy });
        g.text("near object", srcX, axisY + 30, { size: 13, c: c.muted, weight: 600 });
      } else {
        g.text("far object", 70, axisY + 58, { size: 13, c: c.muted, weight: 600 });
      }
      if (st.lens === "on" && st.eye !== "normal") {
        var concave = st.eye === "short";
        g.ctx.beginPath();
        g.style({ c: c.ink, w: 2.5, fill: c.teal50 });
        if (concave) {
          g.ctx.moveTo(specX - 12, axisY - 60);
          g.ctx.lineTo(specX + 12, axisY - 60);
          g.ctx.quadraticCurveTo(specX + 2, axisY, specX + 12, axisY + 60);
          g.ctx.lineTo(specX - 12, axisY + 60);
          g.ctx.quadraticCurveTo(specX - 2, axisY, specX - 12, axisY - 60);
        } else {
          g.ctx.moveTo(specX, axisY - 60);
          g.ctx.quadraticCurveTo(specX + 22, axisY, specX, axisY + 60);
          g.ctx.quadraticCurveTo(specX - 22, axisY, specX, axisY - 60);
        }
        g.ctx.closePath();
        g.ctx.fillStyle = c.teal50;
        g.ctx.fill();
        g.ctx.stroke();
        g.text(concave ? "concave lens" : "convex lens", specX, axisY - 78, { size: 13 });
      }
      var sharp = Math.abs(meetX - EYE.retina) < 1;
      var msg = sharp ? "focus on the retina: sharp" : (meetX < EYE.retina ? "focus in front of the retina: blurred" : "focus behind the retina: blurred");
      g.text(msg, EYE.cx - 20, axisY + EYE.r + 24, { size: 13, c: sharp ? c.ok : c.nudge });
    },
    outputs: function (st) {
      var txt = {
        normal: "Normal eye: far point at infinity, near point 25 cm.",
        short: "Short sight: eye too strong or eyeball too long. Far objects blur.",
        long: "Long sight: eye too weak or eyeball too short. Near objects blur."
      };
      return { what: txt[st.eye] };
    }
  });

  /* ---------- 1.2 C: cochlea, uncoiled ---------- */

  function placeFor(f) {
    /* 0 at the base (20 kHz) to 1 at the apex (20 Hz), log scale */
    return clamp(Math.log(20000 / f) / Math.log(1000), 0, 1);
  }
  function freqFromSlider(v) { return 20 * Math.pow(1000, v / 100); }

  S.scene("cochlea", {
    state: { f: 50 },
    draw: function (g, t, st) {
      var c = g.c;
      var f = freqFromSlider(st.f);
      var x0 = 90, x1 = 600, yMid = 150;
      /* the tube narrows from base to apex; the membrane does the opposite */
      g.poly([[x0, yMid - 70], [x1, yMid - 40], [x1 + 18, yMid], [x1, yMid + 40], [x0, yMid + 70]], { c: c.ink, w: 2.5, fill: c.teal50 });
      g.line(x0, yMid - 70, x0, yMid + 70, { c: c.ink, w: 2.5 });
      g.circle(x0, yMid - 36, 10, { c: c.ink, w: 2, fill: c.bg });
      g.circle(x0, yMid + 36, 10, { c: c.ink, w: 2, fill: c.bg });
      g.text("oval window", x0 - 4, yMid - 90, { size: 12, align: "left", c: c.muted, weight: 600 });
      g.text("round window", x0 - 4, yMid + 92, { size: 12, align: "left", c: c.muted, weight: 600 });
      var place = placeFor(f);
      var peakX = x0 + place * (x1 - x0);
      var pts = [];
      var phase = t * 7;
      for (var i = 0; i <= 240; i += 1) {
        var s = i / 240;
        var x = x0 + s * (x1 - x0);
        var env = Math.exp(-Math.pow((s - place) / 0.07, 2)) * (s <= place ? 1 : Math.exp(-(s - place) * 30));
        var grow = s <= place ? 0.15 + 0.85 * Math.pow(s / Math.max(place, 0.01), 3) : 1;
        var a = 26 * env * grow + 1.5 * (s < place ? (s / Math.max(place, 0.01)) : 0);
        pts.push([x, yMid + a * Math.sin(phase - s * 40)]);
      }
      g.poly(pts, { c: c.teal700, w: 3 });
      g.line(peakX, yMid - 46, peakX, yMid + 46, { c: c.sun700, w: 1.5, dash: [4, 4] });
      g.text("largest vibration", peakX, yMid - 112 + (place > 0.85 ? 0 : 0), { size: 13, c: c.sun700 });
      g.text("base: narrow, stiff", x0 + 70, 290, { size: 12, c: c.muted, weight: 600 });
      g.text("apex: wide, floppy", x1 - 60, 290, { size: 12, c: c.muted, weight: 600 });
    },
    outputs: function (st) {
      var f = freqFromSlider(st.f);
      var place = placeFor(f);
      var where = place < 0.33 ? "near the base" : place < 0.67 ? "in the middle" : "near the apex";
      return {
        f: "f = " + (f >= 1000 ? fmt(f / 1000, 1) + " kHz" : Math.round(f) + " Hz"),
        where: "resonates " + where
      };
    }
  });

  /* ---------- 1.2 D: intensity and sound intensity level ---------- */

  var SOUNDS = [
    { L: 0, name: "threshold of hearing" },
    { L: 20, name: "whisper" },
    { L: 60, name: "conversation" },
    { L: 85, name: "busy traffic" },
    { L: 120, name: "threshold of discomfort" },
    { L: 140, name: "threshold of pain" }
  ];

  S.scene("db-ladder", {
    state: { logI: -6 },
    draw: function (g, t, st) {
      var c = g.c;
      var L = 10 * (st.logI + 12);
      var x = 170, top = 40, bot = 440;
      function Y(v) { return bot - v / 140 * (bot - top); }
      g.line(x, bot, x, top, { c: c.ink, w: 2.5 });
      for (var v = 0; v <= 140; v += 20) {
        g.line(x - 8, Y(v), x, Y(v), { c: c.ink, w: 2 });
        g.text(v + " dB", x - 16, Y(v), { size: 12, mono: true, align: "right", c: c.muted, weight: 500 });
        g.text("10^" + (v / 10 - 12), x + 24 + 0, Y(v), { size: 12, mono: true, align: "left", c: c.faint, weight: 500 });
      }
      g.text("I / W m⁻²", x + 24, top - 22, { size: 12, align: "left", c: c.faint, weight: 600 });
      SOUNDS.forEach(function (s) {
        g.line(x + 90, Y(s.L), x + 110, Y(s.L), { c: c.guide, w: 1.5 });
        g.text(s.name, x + 118, Y(s.L), { size: 13, align: "left", weight: 600 });
      });
      var y = Y(clamp(L, 0, 140));
      g.rect(x - 6, y, 12, bot - y, { fill: c.teal300, alpha: 0.9 });
      g.arrow(x + 80, y, x + 10, y, { c: c.teal700, w: 2.5 });
    },
    outputs: function (st) {
      var L = 10 * (st.logI + 12);
      var exp = st.logI;
      var mant = Math.pow(10, exp - Math.floor(exp));
      return {
        I: "I = " + fmt(mant, 1) + " × 10^" + Math.floor(exp) + " W m⁻²",
        L: "L = " + fmt(L, 0) + " dB"
      };
    }
  });

  /* ---------- 1.2 E: curves of equal loudness (schematic) ---------- */

  var TPTS = [[20, 75], [50, 44], [100, 26], [200, 14], [500, 5], [1000, 0], [2000, -2], [3500, -6], [5000, -3], [8000, 10], [12000, 15], [16000, 30], [20000, 60]];
  function threshold(f) {
    var lf = Math.log10(f);
    for (var i = 0; i < TPTS.length - 1; i += 1) {
      var a = TPTS[i], b = TPTS[i + 1];
      var la = Math.log10(a[0]), lb = Math.log10(b[0]);
      if (lf <= lb) {
        var k = (lf - la) / (lb - la);
        return a[1] + (b[1] - a[1]) * k;
      }
    }
    return TPTS[TPTS.length - 1][1];
  }
  function levelFor(f, phon) { var T = threshold(f); return phon + T * (1 - phon / 150); }
  function phonFor(f, L) { var T = threshold(f); return (L - T) / (1 - T / 150); }

  S.scene("loudness", {
    state: { f: 33, L: 60 },
    draw: function (g, t, st) {
      var c = g.c;
      var x0 = 80, x1 = 610, y0 = 420, y1 = 40;
      function X(f) { return x0 + (Math.log10(f) - Math.log10(20)) / 3 * (x1 - x0); }
      function Y(L) { return y0 - (L + 10) / 150 * (y0 - y1); }
      g.line(x0, y0, x1, y0, { c: c.ink, w: 2 });
      g.line(x0, y0, x0, y1, { c: c.ink, w: 2 });
      [20, 100, 1000, 10000].forEach(function (f) {
        g.line(X(f), y0, X(f), y0 + 6, { c: c.ink, w: 1.5 });
        g.text(f >= 1000 ? f / 1000 + "k" : String(f), X(f), y0 + 20, { size: 12, mono: true, c: c.muted, weight: 500 });
      });
      g.text("frequency / Hz", (x0 + x1) / 2, y0 + 42, { size: 12, c: c.muted, weight: 600 });
      [0, 40, 80, 120].forEach(function (L) {
        g.text(String(L), x0 - 10, Y(L), { size: 12, mono: true, align: "right", c: c.muted, weight: 500 });
      });
      g.text("level / dB", x0 - 6, y1 - 18, { size: 12, align: "left", c: c.muted, weight: 600 });
      g.line(x0, Y(120), x1, Y(120), { c: c.guide, w: 1.5, dash: [6, 6] });
      g.text("discomfort", x1 - 4, Y(120) - 12, { size: 12, align: "right", c: c.faint, weight: 600 });
      [0, 20, 40, 60, 80, 100].forEach(function (p) {
        var pts = [];
        for (var k = 0; k <= 120; k += 1) {
          var f = 20 * Math.pow(1000, k / 120);
          pts.push([X(f), Y(levelFor(f, p))]);
        }
        g.poly(pts, { c: p === 0 ? c.ink : c.teal600, w: p === 0 ? 3 : 2 });
        g.text(p === 0 ? "0 phon: threshold" : p + " phon", X(1000) + 6, Y(p) - 10, { size: 12, align: "left", c: p === 0 ? c.ink : c.teal700 });
      });
      g.line(X(1000), y0, X(1000), y1 + 20, { c: c.guide, w: 1, dash: [3, 5] });
      var f = 20 * Math.pow(1000, st.f / 100);
      g.circle(X(f), Y(st.L), 8, { fill: c.sun400, c: c.ink, w: 2 });
    },
    outputs: function (st) {
      var f = 20 * Math.pow(1000, st.f / 100);
      var p = phonFor(f, st.L);
      return {
        f: "f = " + (f >= 1000 ? fmt(f / 1000, 1) + " kHz" : Math.round(f) + " Hz"),
        L: "level = " + st.L + " dB",
        p: p < 0 ? "below the threshold: not heard" : "loudness ≈ " + Math.round(p) + " phon"
      };
    }
  });
})();
