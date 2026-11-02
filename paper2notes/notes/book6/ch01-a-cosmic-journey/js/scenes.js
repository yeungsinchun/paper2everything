/* Book 6 Ch.1 scenes. Engine and helpers: ../../js/diagrams3d.js. */
(function () {
  "use strict";

  var NS = window.NotesStage;
  if (!NS) return;
  var C = NS.C;
  var U = NS.util;

  /* Seeded random numbers so every visit draws the same cloud. */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* 1.1 B: a light pulse leaves the Sun; the clock counts light-minutes as it
     passes each planet. Distances to scale along one line (1 AU = 2.3 units). */
  NS.define("light-time", function (S) {
    var AU = 2.3;
    var x0 = -6.0;
    var C_AU_PER_MIN = 60 * 2.998e8 / 1.496e11;
    var MIN_PER_S = 5.2;
    var planets = [
      { key: "mercury", name: "Mercury", au: 0.387, r: 0.09, hex: C.ink3 },
      { key: "venus", name: "Venus", au: 0.723, r: 0.13, hex: C.sun400 },
      { key: "earth", name: "Earth", au: 1.0, r: 0.14, hex: C.teal },
      { key: "mars", name: "Mars", au: 1.524, r: 0.11, hex: C.flame },
      { key: "jupiter", name: "Jupiter", au: 5.203, r: 0.3, hex: C.sun700 }
    ];
    S.fit(6.7, 1.5, 0, 0);
    S.line([[x0, 0], [x0 + 5.4 * AU, 0]], { w: S.px(1.5), color: C.line, z: 0 });
    S.star(0.42, C.sun, { x: x0, y: 0, halo: 3.2 });
    planets.forEach(function (p) {
      p.x = x0 + p.au * AU;
      p.mesh = S.ball(p.r, p.hex, { x: p.x, y: 0 });
      p.minutes = p.au / C_AU_PER_MIN;
    });
    var front = S.line([[x0, -1.1], [x0, 1.1]], { w: S.px(3), color: C.sun, z: 0.6, opacity: 0.85 });
    var glow = S.fill([[x0, -1.1], [x0, -1.1], [x0, 1.1], [x0, 1.1]], C.sun400, { opacity: 0.16, z: 0.1 });
    var duration = planets[4].minutes / MIN_PER_S + 1.2;
    var state = { minutes: 0, reached: null };
    return {
      duration: duration,
      settle: duration,
      update: function (t) {
        var minutes = Math.min(t * MIN_PER_S, 47);
        var x = x0 + minutes * C_AU_PER_MIN * AU;
        front.position.x = x - x0;
        glow.set([[x0, -1.1], [x, -1.1], [x, 1.1], [x0, 1.1]]);
        var reached = null;
        planets.forEach(function (p) { if (minutes >= p.minutes) reached = p; });
        state.minutes = minutes;
        state.reached = reached ? reached.name : null;
        S.text("clock", "t = " + minutes.toFixed(1) + " min");
        S.place("clock", x, 1.25);
        S.place("sun", x0, -0.85);
        S.place("earth", planets[2].x, -0.62);
        S.place("jupiter", planets[4].x, -0.75);
        if (reached) {
          S.show("reached", true);
          S.text("reached", reached.name + " reached: " + (reached.minutes < 20 ? reached.minutes.toFixed(1) : reached.minutes.toFixed(0)) + " min");
          S.place("reached", reached.x, 0.62);
        } else {
          S.show("reached", false);
        }
      },
      snapshot: function () {
        return {
          minutes: state.minutes,
          reached: state.reached,
          earthMinutes: planets[2].minutes,
          jupiterMinutes: planets[4].minutes
        };
      }
    };
  });

  /* 1.2 B: a cold cloud of gas and dust contracts under its own gravity, breaks
     into clumps, and the clumps light up as the stars of one cluster. */
  NS.define("nebula", function (S) {
    S.fit(5.6, 2.5, 0, 0);
    var rand = rng(20261006);
    var seeds = [[-2.4, 0.6], [-0.9, -0.9], [0.5, 0.8], [1.9, -0.4], [3.1, 0.9], [-3.4, -0.8]];
    var N = 340;
    var parts = [];
    var i;
    for (i = 0; i < N; i += 1) {
      var a = rand() * Math.PI * 2;
      var rr = Math.sqrt(rand());
      var p0 = [Math.cos(a) * rr * 5.0, Math.sin(a) * rr * 2.2];
      var best = 0;
      var bd = 1e9;
      seeds.forEach(function (s, k) {
        var d = Math.hypot(s[0] - p0[0] * 0.7, s[1] - p0[1] * 0.7);
        if (d < bd) { bd = d; best = k; }
      });
      var ang = rand() * Math.PI * 2;
      var off = 0.05 + rand() * 0.22;
      parts.push({ p0: p0, seed: best, off: [Math.cos(ang) * off, Math.sin(ang) * off], stay: rand() < 0.22 });
    }
    var dust = S.dots(parts.map(function (p) { return p.p0; }), 3.2, C.ink3, { opacity: 0.75, z: 0.2 });
    /* Young cluster stars: a few hot blue ones, the rest white and yellow. */
    var temps = [22000, 7500, 9800, 5800, 15000, 4600];
    var stars = seeds.map(function (s, k) {
      var st = S.star(0.16, U.starColor(temps[k]), { x: s[0], y: s[1], halo: 6 });
      st.scale.set(0.001, 0.001, 1);
      return st;
    });
    var duration = 9;
    var lit = 0;
    return {
      duration: duration,
      settle: duration,
      update: function (t) {
        var squeeze = U.smooth(t / 3.2);
        var clump = U.smooth((t - 2.6) / 3.4);
        var glowUp = U.smooth((t - 5.4) / 2.2);
        dust.set(parts.map(function (p) {
          var mid = [p.p0[0] * (1 - 0.3 * squeeze), p.p0[1] * (1 - 0.3 * squeeze)];
          if (p.stay) return mid;
          var s = seeds[p.seed];
          var target = [s[0] + p.off[0] * (1 - 0.5 * glowUp), s[1] + p.off[1] * (1 - 0.5 * glowUp)];
          return [U.lerp(mid[0], target[0], clump), U.lerp(mid[1], target[1], clump)];
        }));
        dust.material.opacity = 0.75 - 0.45 * glowUp;
        lit = 0;
        stars.forEach(function (st, k) {
          var g = U.smooth((t - 5.4 - k * 0.18) / 1.6);
          if (g > 0.5) lit += 1;
          var sc = Math.max(0.001, g);
          st.scale.set(sc, sc, 1);
        });
        var phase = t < 2.6 ? "cold cloud of gas and dust" : (t < 5.6 ? "gravity pulls clumps together" : "clumps shine: a star cluster is born");
        S.text("phase", phase);
        S.place("phase", 0, 2.25);
        S.place("cluster", 0.3, -1.95);
        S.show("cluster", t > 6.2);
      },
      snapshot: function () { return { starsLit: lit, seeds: seeds.length }; }
    };
  });
})();
