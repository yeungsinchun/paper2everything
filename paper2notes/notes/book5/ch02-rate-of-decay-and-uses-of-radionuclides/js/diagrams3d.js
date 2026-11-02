(function (global) {
  "use strict";

  var THREE = global.THREE;

  /* Shared helpers: ../../../js/scene-kit.js. */
  var Kit = global.P2NScene;
  var clamp01 = Kit.clamp01;
  var lerp = Kit.lerp;
  var ball = Kit.ball;
  var box = Kit.box;
  var projectXY = Kit.projectXY;
  var hudXY = Kit.hudXY;
  var wavyArrow = Kit.wavyArrow;
  var axes = Kit.axes;
  var curveLine = Kit.curveLine;

  function stage(canvas, fit) {
    return Kit.stage(canvas, fit, ORBIT_SCENES);
  }

  /* Keep a label inside the frame: a clamped pill is readable, a clipped one
     is a defect (26.1 background read the label half outside the box). */
  function placeHud(el, canvas, camera, world) {
    Kit.placeHud(el, canvas, camera, world, { clamp: true });
  }

  var scenes = {};

  /* Drag-to-rotate only where the third dimension carries meaning (depth of a
     film under a hand, an angled target, a nucleon cluster). Flat, diagram-like
     scenes keep a fixed camera so nothing on the page invites fiddling. */
  var ORBIT_SCENES = { gammaknife: 1 };

  /* A scene keeps a synchronized DOM readout row inside its <figure> honest:
     [data-out="n"] etc. The row and the canvas always show one model. */
  function modelOut(host, key) {
    if (!host || !host.closest) return null;
    var fig = host.closest("figure");
    return fig ? fig.querySelector('[data-out="' + key + '"]') : null;
  }

  function setText(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function dice(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, { halfW: 5.6, halfH: 3.4 });
    gfx.camera.position.set(0.2, 8.2, 9.4);
    gfx.camera.lookAt(0, 0, 0);
    var hudLive = host.querySelector('[data-hud="live"]');
    var cells = [];
    var i;
    var j;
    for (i = 0; i < 10; i += 1) {
      for (j = 0; j < 10; j += 1) {
        var n = ball(0.22, 0xc47a12);
        n.position.set((j - 4.5) * 0.52, 0.22, (i - 4.5) * 0.52);
        gfx.scene.add(n);
        cells.push({ mesh: n, live: true });
      }
    }
    var tray = box(5.6, 0.12, 5.6, 0x1d4f91);
    tray.position.y = -0.08;
    gfx.scene.add(tray);
    var remaining = 100;
    var throwsDone = 0;
    var t0 = 0;
    var playing = false;

    function reset() {
      remaining = 100;
      throwsDone = 0;
      playing = true;
      t0 = performance.now();
      cells.forEach(function (c) {
        c.live = true;
        c.mesh.visible = true;
        c.mesh.material.color.setHex(0xc47a12);
        c.mesh.position.y = 0.22;
      });
    }

    function throwOnce() {
      if (throwsDone >= 8) {
        playing = false;
        return;
      }
      throwsDone += 1;
      cells.forEach(function (c) {
        if (!c.live) return;
        if (Math.random() < 1 / 6) {
          c.live = false;
          remaining -= 1;
          c.mesh.material.color.setHex(0x8aa39c);
          c.mesh.position.y = 0.08;
        }
      });
    }

    host.addEventListener("notes-replay", reset);
    reset();

    function frame(now) {
      if (playing && now - t0 > 700) {
        t0 = now;
        throwOnce();
      }
      placeHud(hudLive, canvas, gfx.camera, new THREE.Vector3(0, 2.6, -3.2));
      if (hudLive) hudLive.textContent = remaining + " undecayed";
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.dice = {
      snapshot: function () {
        return {
          remaining: remaining,
          nTotal: 100,
          throwsDone: throwsDone,
          p: 1 / 6
        };
      },
      replay: reset,
      orbitBy: function (dx, dy) { gfx.orbit.nudge(dx, dy); }
    };
  }

  /* Half-life (26.1 §B): one finite 24-day run of iodine-131. The parent bar
     halves on every 8-day mark while the daughter bar grows; the two always
     fill the same 40-billion frame. The slider/buttons drive t directly. */
  function halfN(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, { halfW: 6.4, halfH: 3.5 });
    var hudSum = host.querySelector('[data-hud="sum"]');
    var hudT = host.querySelector('[data-hud="t"]');
    var hudT8 = host.querySelector('[data-hud="t8"]');
    var hudT16 = host.querySelector('[data-hud="t16"]');
    var hudT24 = host.querySelector('[data-hud="t24"]');
    var outN = modelOut(host, "n");
    var outD = modelOut(host, "d");
    var outSum = modelOut(host, "sum");
    var N0 = 40;
    var HALF = 8;
    var SPAN = 24;
    var DURATION = 12000;
    var X0 = -5.2;
    var XW = 9.8;
    var Y0 = -2.4;
    var YW = 4.8;
    var BAR_X = 0.85;
    function xOf(t) { return X0 + t * (XW / SPAN); }
    function yOf(n) { return Y0 + n * (YW / N0); }
    axes(gfx.scene, X0, Y0, 4.6, 2.8);
    var pts = [];
    var s;
    for (s = 0; s <= 48; s += 1) {
      var tt = s / 48 * SPAN;
      pts.push(new THREE.Vector3(xOf(tt), yOf(N0 * Math.pow(0.5, tt / HALF)), 0));
    }
    curveLine(gfx.scene, pts, 0x1f7a45);
    [HALF, 2 * HALF, SPAN].forEach(function (d) {
      var xg = xOf(d);
      curveLine(gfx.scene, [
        new THREE.Vector3(xg, Y0, -0.2), new THREE.Vector3(xg, 2.0, -0.2)
      ], 0xe6e0d2);
      var tick = box(0.06, 0.2, 0.06, 0x5b6573);
      tick.position.set(xg, Y0 + 0.1, 0);
      gfx.scene.add(tick);
    });
    var marker = ball(0.14, 0x0e5f56);
    gfx.scene.add(marker);
    var remain = box(0.7, 1, 0.7, 0xc47a12);
    var decayed = box(0.7, 1, 0.7, 0x8aa39c);
    gfx.scene.add(remain, decayed);
    var totalFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.78, 4.4, 0.78)),
      new THREE.LineBasicMaterial({ color: 0xb9b2a1 })
    );
    gfx.scene.add(totalFrame);
    var playing = !reducedMotion();
    var t0 = performance.now();
    var tDays = playing ? 0 : SPAN;

    function place(t) {
      tDays = clamp01(t / SPAN) * SPAN;
      var nLive = N0 * Math.pow(0.5, tDays / HALF);
      var nDead = N0 - nLive;
      var x = xOf(tDays);
      var y = yOf(nLive);
      marker.position.set(x, y, 0.2);
      var liveH = Math.max(0.04, nLive * (4.4 / N0));
      var deadH = nDead * (4.4 / N0);
      remain.scale.set(1, liveH, 1);
      remain.position.set(x + BAR_X, Y0 + liveH / 2, 0);
      decayed.visible = nDead > 0;
      decayed.scale.set(1, deadH, 1);
      decayed.position.set(x + BAR_X, Y0 + liveH + deadH / 2, 0);
      totalFrame.position.set(x + BAR_X, Y0 + 2.2, 0);
      setText(hudT, "t = " + tDays.toFixed(0) + " d");
      setText(outN, "N = " + nLive.toFixed(1) + " billion");
      setText(outD, "D = " + nDead.toFixed(1) + " billion");
      setText(outSum, "N + D = " + N0.toFixed(1) + " billion");
      placeHud(hudSum, canvas, gfx.camera, new THREE.Vector3(-5.1, 3.05, 0));
      placeHud(hudT, canvas, gfx.camera, new THREE.Vector3(4.6, 3.05, 0));
      placeHud(hudT8, canvas, gfx.camera, new THREE.Vector3(xOf(HALF), -2.78, 0));
      placeHud(hudT16, canvas, gfx.camera, new THREE.Vector3(xOf(2 * HALF), -2.78, 0));
      placeHud(hudT24, canvas, gfx.camera, new THREE.Vector3(xOf(SPAN), -2.78, 0));
      host.dispatchEvent(new CustomEvent("notes-scene-tick", { detail: { t: tDays, playing: playing } }));
    }
    function replay() {
      playing = true;
      t0 = performance.now();
      place(0);
    }
    function pause() {
      playing = false;
      place(tDays);
    }
    function play() {
      if (tDays >= SPAN) tDays = 0;
      t0 = performance.now() - (tDays / SPAN) * DURATION;
      playing = true;
      place(tDays);
    }
    host.addEventListener("notes-replay", replay);
    place(tDays);
    function frame(now) {
      if (playing) {
        tDays = Math.min(SPAN, (now - t0) / DURATION * SPAN);
        if (tDays >= SPAN) playing = false;
      }
      place(tDays);
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.halfN = {
      setT: function (t) { playing = false; place(t); },
      replay: replay,
      pause: pause,
      play: play,
      snapshot: function () {
        var nLive = N0 * Math.pow(0.5, tDays / HALF);
        return {
          tDays: tDays,
          remaining: nLive,
          decayed: N0 - nLive,
          total: N0,
          conserved: Math.abs(nLive + (N0 - nLive) - N0) < 1e-9,
          deadVisible: decayed.visible,
          deadHeight: decayed.scale.y,
          playing: playing,
          halfLifeDays: HALF,
          spanDays: SPAN,
          liveHeight: remain.scale.y
        };
      },
      orbitBy: function (dx, dy) { gfx.orbit.nudge(dx, dy); }
    };
  }

  function activityN(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, {
      persp: { fov: 34, x: 0.2, y: 4.8, z: 11, lookY: 0.2 }
    });
    var hudA = host.querySelector('[data-hud="a"]');
    var hudN = host.querySelector('[data-hud="n"]');
    var nuclei = [];
    var k;
    for (k = 0; k < 32; k += 1) {
      var b = ball(0.16, 0xc47a12);
      gfx.scene.add(b);
      nuclei.push(b);
    }
    var step = 0;
    var t0 = performance.now();
    function layout(live) {
      var i;
      for (i = 0; i < nuclei.length; i += 1) {
        var on = i < live;
        nuclei[i].visible = on;
        var col = i % 6;
        var row = Math.floor(i / 6);
        nuclei[i].position.set((col - 2.5) * 0.48, 0.2, (row - 2) * 0.48);
      }
    }
    function frame(now) {
      var u = ((now - t0) / 2600) % 3;
      step = Math.floor(u);
      var live = [32, 16, 8][step];
      var activity = [4000, 2000, 1000][step];
      layout(live);
      var anchor = new THREE.Vector3(0, 1.1, 0);
      placeHud(hudA, canvas, gfx.camera, anchor);
      placeHud(hudN, canvas, gfx.camera, new THREE.Vector3(0, -0.9, 1.4));
      if (hudA) hudA.textContent = "A = " + activity + " Bq";
      if (hudN) hudN.textContent = live + " undecayed (of 32 shown)";
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.activityN = {
      snapshot: function () {
        var live = [32, 16, 8][step];
        var activity = [4000, 2000, 1000][step];
        return {
          nUndecayed: live,
          activityBq: activity,
          halved: activity * (32 / live) === 4000
        };
      },
      orbitBy: function (dx, dy) { gfx.orbit.nudge(dx, dy); }
    };
  }

  function activityA(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, { halfW: 6.4, halfH: 3.5 });
    var hudA = host.querySelector('[data-hud="a"]');
    axes(gfx.scene, -5.2, -2.4, 5.4, 2.8);
    var pts = [];
    var s;
    for (s = 0; s <= 48; s += 1) {
      var t = s / 48 * 24;
      var a = 1000 * Math.pow(0.5, t / 8);
      pts.push(new THREE.Vector3(-5.2 + t * (10.2 / 24), -2.4 + a * (4.8 / 1000), 0));
    }
    curveLine(gfx.scene, pts, 0xc47a12);
    var marker = ball(0.14, 0xc47a12);
    gfx.scene.add(marker);
    var tDays = 0;
    var t0 = performance.now();
    function frame(now) {
      var u = ((now - t0) / 9000) % 1;
      tDays = u * 24;
      var a = 1000 * Math.pow(0.5, tDays / 8);
      var x = -5.2 + tDays * (10.2 / 24);
      var y = -2.4 + a * (4.8 / 1000);
      marker.position.set(x, y, 0.2);
      placeHud(hudA, canvas, gfx.camera, marker.position.clone().add(new THREE.Vector3(0.2, 0.35, 0)));
      if (hudA) hudA.textContent = "A = " + a.toFixed(0) + " Bq";
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.activityA = {
      snapshot: function () {
        var a = 1000 * Math.pow(0.5, tDays / 8);
        return { tDays: tDays, activityBq: a, startBq: 1000 };
      },
      orbitBy: function (dx, dy) { gfx.orbit.nudge(dx, dy); }
    };
  }

  /* Background correction (26.1 §D): one finite 80-hour run. The recorded
     curve flattens on the 40 min-1 background floor; the amber 440 min-1 line
     marks the one-half-life read. The slider/buttons drive t directly. */
  function countbg(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, { halfW: 6.4, halfH: 3.5 });
    var hudRec = host.querySelector('[data-hud="rec"]');
    var hudBg = host.querySelector('[data-hud="bg"]');
    var hudTarget = host.querySelector('[data-hud="target"]');
    var hudTh = host.querySelector('[data-hud="th"]');
    var outRec = modelOut(host, "rec");
    var outBg = modelOut(host, "bg");
    var outCorr = modelOut(host, "corr");
    var BG = 40;
    var START = 840;
    var HALF = 10;
    var SPAN = 80;
    var DURATION = 16000;
    var X0 = -5.2;
    var XW = 10.2;
    var Y0 = -2.4;
    var YW = 4.8;
    function xOf(t) { return X0 + t * (XW / SPAN); }
    function yOf(rate) { return Y0 + rate * (YW / START); }
    axes(gfx.scene, X0, Y0, 5.4, 2.8);
    var bgY = yOf(BG);
    var bgLine = box(XW, 0.03, 0.03, 0x5b6573);
    bgLine.position.set(X0 + XW / 2, bgY, 0);
    gfx.scene.add(bgLine);
    var targetY = yOf((START - BG) / 2 + BG);
    var targetLine = box(XW, 0.03, 0.03, 0xc9a227);
    targetLine.position.set(X0 + XW / 2, targetY, 0);
    gfx.scene.add(targetLine);
    var targetDot = ball(0.11, 0xc9a227);
    targetDot.position.set(xOf(HALF), targetY, 0.15);
    gfx.scene.add(targetDot);
    gfx.scene.add(curveLine(gfx.scene, [
      new THREE.Vector3(xOf(HALF), Y0, -0.15), new THREE.Vector3(xOf(HALF), targetY, -0.15)
    ], 0xe6e0d2));
    var pts = [];
    var s;
    for (s = 0; s <= 60; s += 1) {
      var tt = s / 60 * SPAN;
      var corr = (START - BG) * Math.pow(0.5, tt / HALF);
      pts.push(new THREE.Vector3(xOf(tt), yOf(corr + BG), 0));
    }
    curveLine(gfx.scene, pts, 0x1f7a45);
    var marker = ball(0.12, 0x0e5f56);
    gfx.scene.add(marker);
    var playing = !reducedMotion();
    var t0 = performance.now();
    var tH = playing ? 0 : HALF;

    function place(h) {
      tH = clamp01(h / SPAN) * SPAN;
      var corr = (START - BG) * Math.pow(0.5, tH / HALF);
      var rec = corr + BG;
      var x = xOf(tH);
      var y = yOf(rec);
      marker.position.set(x, y, 0.2);
      setText(hudRec, "recorded " + rec.toFixed(0) + " min⁻¹");
      setText(outRec, "recorded = " + rec.toFixed(0) + " min⁻¹");
      setText(outBg, "background = " + BG.toFixed(0) + " min⁻¹");
      setText(outCorr, "corrected = " + corr.toFixed(0) + " min⁻¹");
      placeHud(hudRec, canvas, gfx.camera, new THREE.Vector3(x + 0.35, y + 0.32, 0));
      placeHud(hudBg, canvas, gfx.camera, new THREE.Vector3(X0 + 0.6, bgY + 0.34, 0));
      placeHud(hudTarget, canvas, gfx.camera, new THREE.Vector3(-1.0, targetY + 0.28, 0));
      placeHud(hudTh, canvas, gfx.camera, new THREE.Vector3(xOf(HALF), -2.78, 0));
      host.dispatchEvent(new CustomEvent("notes-scene-tick", { detail: { t: tH, playing: playing } }));
    }
    function replay() {
      playing = true;
      t0 = performance.now();
      place(0);
    }
    function pause() {
      playing = false;
      place(tH);
    }
    function play() {
      if (tH >= SPAN) tH = 0;
      t0 = performance.now() - (tH / SPAN) * DURATION;
      playing = true;
      place(tH);
    }
    host.addEventListener("notes-replay", replay);
    place(tH);
    function frame(now) {
      if (playing) {
        tH = Math.min(SPAN, (now - t0) / DURATION * SPAN);
        if (tH >= SPAN) playing = false;
      }
      place(tH);
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.countbg = {
      setT: function (h) { playing = false; place(h); },
      replay: replay,
      pause: pause,
      play: play,
      snapshot: function () {
        var corr = (START - BG) * Math.pow(0.5, tH / HALF);
        return {
          background: BG,
          recorded: corr + BG,
          corrected: corr,
          tH: tH,
          playing: playing,
          halfLifeH: HALF,
          spanH: SPAN,
          targetRecorded: (START - BG) / 2 + BG,
          targetAtH: HALF,
          floor: Math.abs(corr) < 30 || tH > 40
        };
      }
    };
  }

  function gammaknife(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, {
      persp: { fov: 32, x: 0.4, y: 2.4, z: 9.5, lookY: 0.3 }
    });
    var hudG = host.querySelector('[data-hud="gamma"]');
    var hudT = host.querySelector('[data-hud="target"]');
    var helmet = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.18, 12, 48, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x2d3038, roughness: 0.4, metalness: 0.35 })
    );
    helmet.rotation.x = Math.PI / 2;
    helmet.position.y = 1.1;
    gfx.scene.add(helmet);
    var head = ball(0.85, 0xe0c09a);
    gfx.scene.add(head);
    var target = ball(0.22, 0xc0392b);
    target.position.set(0, 0.15, 0.1);
    gfx.scene.add(target);
    var rays = [];
    var i;
    for (i = 0; i < 9; i += 1) {
      var ang = lerp(-1.15, 1.15, i / 8);
      var origin = new THREE.Vector3(Math.sin(ang) * 2.0, 1.55, -Math.cos(ang) * 0.35);
      var dir = target.position.clone().sub(origin);
      rays.push(wavyArrow(gfx.scene, {
        origin: origin,
        dir: dir,
        length: dir.length() - 0.25,
        hex: 0xc9a227,
        amp: 0.05,
        waves: 2.2,
        phase: i * 0.4
      }));
    }
    var t0 = performance.now();
    function frame(now) {
      var t = (now - t0) / 1000;
      rays.forEach(function (r) { r.userData.update(t); });
      placeHud(hudG, canvas, gfx.camera, new THREE.Vector3(0, 2.15, 0));
      placeHud(hudT, canvas, gfx.camera, target.position.clone().add(new THREE.Vector3(0.4, 0.2, 0)));
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.gammaknife = {
      snapshot: function () {
        return { nRays: rays.length, longLived: true, source: "gamma" };
      },
      orbitBy: function (dx, dy) { gfx.orbit.nudge(dx, dy); }
    };
  }

  function pipeline(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, {
      persp: { fov: 30, x: 3.4, y: 3.8, z: 9.2, lookX: 0.2, lookY: 0.2 }
    });
    var hudC = host.querySelector('[data-hud="count"]');
    var hudL = host.querySelector('[data-hud="leak"]');
    var soil = box(8.4, 0.18, 3.2, 0x8d6e3f);
    soil.position.y = -0.4;
    var pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 7.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x6b7380, metalness: 0.4, roughness: 0.35 })
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, -0.05, 0);
    var leak = ball(0.22, 0xc9a227);
    leak.position.set(1.1, 0.35, 0.15);
    var det = box(0.5, 0.7, 0.5, 0x0e5f56);
    det.position.set(1.1, 1.55, 0.9);
    gfx.scene.add(soil, pipe, leak, det);
    var ray = wavyArrow(gfx.scene, {
      origin: new THREE.Vector3(1.1, 0.5, 0.15),
      dir: new THREE.Vector3(0, 1, 0.4),
      length: 1.1,
      hex: 0xc9a227,
      amp: 0.06
    });
    var leaking = true;
    function setLeak(on) {
      leaking = !!on;
      leak.visible = leaking;
      ray.visible = leaking;
    }
    setLeak(true);
    var t0 = performance.now();
    function frame(now) {
      ray.userData.update((now - t0) / 1000);
      var count = leaking ? 420 : 55;
      placeHud(hudC, canvas, gfx.camera, det.position.clone().add(new THREE.Vector3(0.6, 0.2, 0)));
      placeHud(hudL, canvas, gfx.camera, leak.position.clone().add(new THREE.Vector3(0.45, 0.1, 0)));
      if (hudC) hudC.textContent = count + " min⁻¹";
      if (hudL) hudL.textContent = leaking ? "γ leak" : "no leak";
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.pipeline = {
      setLeak: setLeak,
      snapshot: function () {
        return { leak: leaking, count: leaking ? 420 : 55, kind: "gamma" };
      },
      orbitBy: function (dx, dy) { gfx.orbit.nudge(dx, dy); }
    };
  }

  function thickness(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, {
      persp: { fov: 30, x: 0.2, y: 2.2, z: 8.8, lookY: 0.4 }
    });
    var hudC = host.querySelector('[data-hud="count"]');
    var source = box(0.55, 0.7, 0.55, 0xc47a12);
    source.position.set(-2.2, 0.6, 0);
    var det = box(0.55, 0.7, 0.55, 0x0e5f56);
    det.position.set(2.2, 0.6, 0);
    var sheet = box(0.18, 1.6, 2.2, 0xc5ccd4);
    sheet.position.set(0, 0.7, 0);
    gfx.scene.add(source, det, sheet);
    var rays = [];
    var i;
    for (i = 0; i < 5; i += 1) {
      rays.push(wavyArrow(gfx.scene, {
        origin: new THREE.Vector3(-1.8, 0.35 + i * 0.18, 0),
        dir: new THREE.Vector3(1, 0, 0),
        length: 3.5,
        hex: 0x1d4f91,
        amp: 0.04,
        waves: 2.4,
        phase: i
      }));
    }
    var thick = 1;
    function setThick(s) {
      thick = s;
      sheet.scale.set(1 + (s - 1) * 1.8, 1, 1);
    }
    setThick(1);
    var t0 = performance.now();
    function frame(now) {
      var t = (now - t0) / 1000;
      rays.forEach(function (r, idx) {
        r.visible = idx < Math.max(1, 6 - Math.round(thick * 2));
        r.userData.update(t);
      });
      var count = Math.round(900 / thick);
      placeHud(hudC, canvas, gfx.camera, det.position.clone().add(new THREE.Vector3(0.55, 0.25, 0)));
      if (hudC) hudC.textContent = count + " min⁻¹";
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.thickness = {
      setThick: setThick,
      snapshot: function () {
        return { thick: thick, count: Math.round(900 / thick), kind: "beta" };
      },
      orbitBy: function (dx, dy) { gfx.orbit.nudge(dx, dy); }
    };
  }

  function smoke(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, { halfW: 5.8, halfH: 3.2 });
    var hudI = host.querySelector('[data-hud="i"]');
    var hudA = host.querySelector('[data-hud="alarm"]');
    var chamber = box(4.6, 2.4, 0.2, 0xd7cbb6);
    chamber.position.z = -0.4;
    var src = ball(0.18, 0xc0392b);
    src.position.set(-0.2, -0.2, 0);
    var plus = box(0.12, 2.0, 0.12, 0x2d3038);
    plus.position.set(-1.7, 0, 0);
    var minus = box(0.12, 2.0, 0.12, 0x2d3038);
    minus.position.set(1.7, 0, 0);
    gfx.scene.add(chamber, src, plus, minus);
    var ion = ball(0.11, 0xd35400);
    var elec = ball(0.09, 0x2a62a8);
    gfx.scene.add(ion, elec);
    var smokes = [];
    var k;
    for (k = 0; k < 8; k += 1) {
      var p = ball(0.13, 0x6b7380);
      p.visible = false;
      gfx.scene.add(p);
      smokes.push(p);
    }
    var fire = false;
    function setFire(on) {
      fire = !!on;
      smokes.forEach(function (p, idx) {
        p.visible = fire;
        p.position.set((idx % 4) * 0.45 - 0.7, (idx < 4 ? 0.55 : -0.55), 0.2);
      });
    }
    setFire(false);
    var t0 = performance.now();
    function frame(now) {
      var u = ((now - t0) / 900) % 1;
      if (fire) {
        ion.position.set(0.1, 0.05, 0);
        elec.position.set(-0.1, -0.05, 0);
      } else {
        ion.position.set(lerp(-0.2, 1.55, u), lerp(-0.2, 0.4, u), 0);
        elec.position.set(lerp(-0.2, -1.55, u), lerp(-0.2, -0.35, u), 0);
      }
      placeHud(hudI, canvas, gfx.camera, new THREE.Vector3(0, 1.35, 0));
      placeHud(hudA, canvas, gfx.camera, new THREE.Vector3(2.4, 1.15, 0));
      if (hudI) hudI.textContent = fire ? "current drops" : "current flows";
      if (hudA) hudA.textContent = fire ? "alarm on" : "alarm off";
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.smoke = {
      setFire: setFire,
      snapshot: function () {
        return { fire: fire, alarm: fire, currentOn: !fire, source: "alpha" };
      }
    };
  }

  function dating(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, { halfW: 6.6, halfH: 3.2 });
    var hudA = host.querySelector('[data-hud="a"]');
    var samples = [];
    var labels = ["alive", "just dead", "1 half-life", "2 half-lives"];
    var fracs = [1, 1, 0.5, 0.25];
    var i;
    for (i = 0; i < 4; i += 1) {
      var body = box(0.9, 1.6, 0.7, 0xe0c09a);
      body.position.set(-4.2 + i * 2.7, -0.2, 0);
      var live = box(0.7, 1.2, 0.5, 0xc47a12);
      live.position.copy(body.position);
      gfx.scene.add(body, live);
      samples.push({ body: body, live: live, frac: fracs[i], label: labels[i] });
    }
    var sel = 0;
    function setAge(iSel) {
      sel = iSel;
    }
    function frame() {
      samples.forEach(function (s, idx) {
        var h = 0.25 + s.frac * 1.1;
        s.live.scale.set(1, h / 1.2, 1);
        s.live.position.y = -0.2 - 0.55 + h / 2;
        s.live.material.emissive = new THREE.Color(idx === sel ? 0x3a2a10 : 0x000000);
        s.live.material.emissiveIntensity = idx === sel ? 0.25 : 0;
      });
      var a = samples[sel];
      placeHud(hudA, canvas, gfx.camera, a.body.position.clone().add(new THREE.Vector3(0, 1.25, 0)));
      if (hudA) hudA.textContent = a.label + " · A = " + a.frac.toFixed(2) + " A₀";
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.dating = {
      setAge: setAge,
      snapshot: function () {
        return {
          sel: sel,
          frac: samples[sel].frac,
          aliveEqualsJustDead: samples[0].frac === samples[1].frac
        };
      }
    };
  }

  function sterile(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, {
      persp: { fov: 30, x: 2.8, y: 3.2, z: 8.4, lookY: 0.3 }
    });
    var hud = host.querySelector('[data-hud="food"]');
    var belt = box(6.4, 0.12, 1.6, 0x6b7380);
    var box1 = box(1.1, 0.9, 0.9, 0xc47a12);
    box1.position.set(-1.6, 0.55, 0);
    var src = box(0.5, 0.4, 0.5, 0xc9a227);
    src.position.set(-1.6, 2.0, 0);
    gfx.scene.add(belt, box1, src);
    var ray = wavyArrow(gfx.scene, {
      origin: new THREE.Vector3(-1.6, 1.75, 0),
      dir: new THREE.Vector3(0, -1, 0),
      length: 0.85,
      hex: 0xc9a227,
      amp: 0.05
    });
    var t0 = performance.now();
    function frame(now) {
      var u = ((now - t0) / 4000) % 1;
      box1.position.x = lerp(-2.6, 2.4, u);
      src.position.x = -1.6;
      ray.visible = Math.abs(box1.position.x + 1.6) < 0.7;
      ray.userData.update((now - t0) / 1000);
      placeHud(hud, canvas, gfx.camera, box1.position.clone().add(new THREE.Vector3(0, 0.7, 0)));
      if (hud) hud.textContent = "packaged food · not radioactive";
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.sterile = {
      snapshot: function () {
        return { activatesFood: false, kind: "gamma" };
      }
    };
  }

  function dose(host) {
    if (!THREE) return;
    var canvas = host.querySelector("canvas");
    var gfx = stage(canvas, {
      persp: { fov: 32, x: 0.6, y: 2.6, z: 9, lookY: 0.5 }
    });
    var hudA = host.querySelector('[data-hud="act"]');
    var hudD = host.querySelector('[data-hud="dose"]');
    var src = box(0.8, 0.8, 0.8, 0xc47a12);
    src.position.set(-2.6, 0.7, 0);
    var body = box(1.3, 2.4, 0.7, 0xe0c09a);
    body.position.set(1.6, 0.5, 0);
    gfx.scene.add(src, body);
    var rays = [];
    var i;
    for (i = 0; i < 4; i += 1) {
      rays.push(wavyArrow(gfx.scene, {
        origin: new THREE.Vector3(-2.1, 0.4 + i * 0.22, 0),
        dir: new THREE.Vector3(1, 0.05 * (i - 1.5), 0),
        length: 3.0,
        hex: 0xc9a227,
        amp: 0.05,
        phase: i * 0.5
      }));
    }
    var t0 = performance.now();
    function frame(now) {
      var t = (now - t0) / 1000;
      rays.forEach(function (r) { r.userData.update(t); });
      placeHud(hudA, canvas, gfx.camera, src.position.clone().add(new THREE.Vector3(0, 0.7, 0)));
      placeHud(hudD, canvas, gfx.camera, body.position.clone().add(new THREE.Vector3(0.2, 1.4, 0)));
      gfx.renderer.render(gfx.scene, gfx.camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    scenes.dose = {
      snapshot: function () {
        return {
          activityLabel: hudA ? hudA.textContent : "",
          doseLabel: hudD ? hudD.textContent : ""
        };
      }
    };
  }

  var builders = {
    dice: dice,
    halfN: halfN,
    activityN: activityN,
    activityA: activityA,
    countbg: countbg,
    gammaknife: gammaknife,
    pipeline: pipeline,
    thickness: thickness,
    smoke: smoke,
    dating: dating,
    sterile: sterile,
    dose: dose
  };

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-scene]"), function (host) {
      var name = host.getAttribute("data-scene");
      try {
        if (builders[name]) builders[name](host);
      } catch (err) {
        console.error("NotesScenes failed:", name, err);
      }
    });
  }

  global.NotesScenes = scenes;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
