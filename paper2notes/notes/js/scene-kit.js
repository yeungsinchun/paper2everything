/* Shared three.js scene kit for notes figures (window.P2NScene).
   Load after ../../vendor/three/three.min.js and before a chapter's js/diagrams3d.js.
   A chapter keeps its own scenes, its scene registry and boot(), and takes these helpers:
     stage(canvas, fit, orbitScenes)   white scene, key/fill lights, ortho camera framed to
                                       fit.halfH / fit.halfW (or fit.persp), resize, and
                                       drag-to-orbit only for scene names in orbitScenes
     placeHud(el, canvas, camera, world, { clamp })   put a .hud-label on a world point;
                                       clamp keeps the label inside the frame
     projectXY, hudXY, ball, box, wavyArrow, axes, curveLine, clamp01, lerp
   Change a helper here for every book; a chapter that needs a variant wraps it. */
(function (global) {
  "use strict";

  var THREE = global.THREE;
  if (!THREE) return;

  function clamp01(t) {
    return Math.max(0, Math.min(1, t));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function ball(radius, hex) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius, 20, 14),
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.45,
        metalness: 0.08,
        transparent: true,
        opacity: 1
      })
    );
  }

  function box(w, h, d, hex) {
    return new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: hex, roughness: 0.55, metalness: 0.08 })
    );
  }

  function stage(canvas, fit, orbitScenes) {
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    var persp = fit && fit.persp;
    var look = persp
      ? new THREE.Vector3(persp.lookX || 0, persp.lookY || 0, persp.lookZ || 0)
      : new THREE.Vector3(0, 0, 0);
    var camera;
    if (persp) {
      camera = new THREE.PerspectiveCamera(persp.fov || 32, 2, 0.1, 80);
      camera.position.set(persp.x, persp.y, persp.z);
      camera.lookAt(look);
    } else {
      camera = new THREE.OrthographicCamera(-7.2, 7.2, 3.6, -3.6, 0.1, 40);
      camera.position.set(0.4, 1.6, 12);
      camera.lookAt(look);
    }
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    var key = new THREE.DirectionalLight(0xfff4e0, 0.95);
    key.position.set(-4, 6, 8);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x9bb6c4, 0.38);
    fill.position.set(6, -2, 4);
    scene.add(fill);
    var contentHalfH = (fit && fit.halfH != null) ? fit.halfH : 3.6;
    var contentHalfW = (fit && fit.halfW != null) ? fit.halfW : null;
    function resize() {
      var w = canvas.clientWidth || canvas.width;
      var h = canvas.clientHeight || canvas.height;
      renderer.setSize(w, h, false);
      var aspect = w / Math.max(h, 1);
      if (camera.isPerspectiveCamera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        return;
      }
      var halfH;
      var halfW;
      if (contentHalfW != null) {
        var boxAspect = contentHalfW / Math.max(contentHalfH, 0.01);
        if (aspect >= boxAspect) {
          halfH = contentHalfH;
          halfW = halfH * aspect;
        } else {
          halfW = contentHalfW;
          halfH = halfW / aspect;
        }
      } else {
        halfH = contentHalfH;
        halfW = halfH * aspect;
      }
      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);
    var orbit = attachOrbit(canvas, camera, look, orbitScenes);
    return { scene: scene, camera: camera, renderer: renderer, resize: resize, look: look, orbit: orbit };
  }

  function attachOrbit(canvas, camera, target, orbitScenes) {
    var host = canvas.closest ? canvas.closest("[data-scene]") : null;
    var name = host ? host.getAttribute("data-scene") : "";
    if (!orbitScenes || !orbitScenes[name]) {
      return { target: target, enabled: false, nudge: function () { /* fixed camera */ } };
    }
    if (host) host.setAttribute("data-orbit", "");
    var sph = new THREE.Spherical();
    var dragging = false;
    var lastX = 0;
    var lastY = 0;
    var synced = false;
    function sync() {
      sph.setFromVector3(camera.position.clone().sub(target));
      synced = true;
    }
    function apply() {
      camera.position.copy(new THREE.Vector3().setFromSpherical(sph).add(target));
      camera.lookAt(target);
      camera.updateMatrixWorld();
    }
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      if (!synced) sync();
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      sph.theta -= (e.clientX - lastX) * 0.008;
      sph.phi -= (e.clientY - lastY) * 0.008;
      sph.phi = Math.max(0.18, Math.min(Math.PI - 0.18, sph.phi));
      lastX = e.clientX;
      lastY = e.clientY;
      apply();
    });
    function endDrag() { dragging = false; }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    return {
      target: target,
      enabled: true,
      nudge: function (dx, dy) {
        if (!synced) sync();
        sph.theta -= dx * 0.008;
        sph.phi = Math.max(0.18, Math.min(Math.PI - 0.18, sph.phi - dy * 0.008));
        apply();
      }
    };
  }

  function projectXY(camera, canvas, world) {
    var v = world.clone().project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * (canvas.clientWidth || 1) + (canvas.offsetLeft || 0),
      y: (-v.y * 0.5 + 0.5) * (canvas.clientHeight || 1) + (canvas.offsetTop || 0)
    };
  }

  function placeHud(el, canvas, camera, world, opts) {
    if (!el) return;
    var p = projectXY(camera, canvas, world);
    /* opts.clamp keeps a label inside the frame: a clamped pill is readable, a clipped one
       is a defect (26.1 background read the label half outside the box). */
    var width = canvas.clientWidth || canvas.width || 0;
    if (opts && opts.clamp && width > 0) {
      var half = (el.offsetWidth || 0) / 2 + 6;
      var min = half;
      var max = width - half;
      if (max < min) min = max = width / 2;
      p.x = Math.max(min, Math.min(max, p.x));
    }
    el.style.left = p.x + "px";
    el.style.top = p.y + "px";
  }

  function hudXY(el) {
    return {
      x: el ? parseFloat(el.style.left) : null,
      y: el ? parseFloat(el.style.top) : null
    };
  }

  function wavyArrow(scene, opts) {
    var origin = opts.origin;
    var dir = opts.dir.clone().normalize();
    var length = opts.length || 1.35;
    var amp = opts.amp != null ? opts.amp : 0.12;
    var waves = opts.waves || 3.1;
    var radius = opts.radius || 0.032;
    var n = opts.n || 28;
    var hex = opts.hex || 0xd4a017;
    var binormal = opts.side ? opts.side.clone() : new THREE.Vector3(0, 0, 1);
    if (Math.abs(dir.dot(binormal)) > 0.92) binormal = new THREE.Vector3(0, 1, 0);
    var side = new THREE.Vector3().crossVectors(dir, binormal).normalize();
    var pts = [];
    var i;
    for (i = 0; i <= n; i += 1) {
      var s = i / n;
      var p = origin.clone().addScaledVector(dir, s * length);
      p.addScaledVector(side, amp * Math.sin(s * waves * Math.PI * 2 + (opts.phase || 0)));
      pts.push(p);
    }
    var mat = new THREE.MeshBasicMaterial({
      color: hex,
      transparent: true,
      opacity: 0.92
    });
    var tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, radius, 6, false),
      mat
    );
    var tipDir = pts[n].clone().sub(pts[n - 1]).normalize();
    var cone = new THREE.Mesh(new THREE.ConeGeometry(radius * 2.4, 0.16, 8), mat);
    cone.position.copy(pts[n]);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tipDir);
    var group = new THREE.Group();
    group.add(tube, cone);
    scene.add(group);
    group.userData.dir = dir;
    group.userData.origin = origin.clone();
    group.userData.tip = pts[n].clone();
    group.userData.axisEnd = origin.clone().addScaledVector(dir, length);
    group.userData.length = length;
    group.userData.mid = pts[Math.floor(n / 2)].clone();
    group.userData.update = function (t) {
      mat.opacity = 0.55 + 0.4 * Math.abs(Math.sin(t * 4 + (opts.phase || 0)));
    };
    return group;
  }

  function axes(scene, x0, y0, x1, y1) {
    var xBar = box(x1 - x0, 0.04, 0.04, 0x5b6573);
    xBar.position.set((x0 + x1) / 2, y0, 0);
    var yBar = box(0.04, y1 - y0, 0.04, 0x5b6573);
    yBar.position.set(x0, (y0 + y1) / 2, 0);
    scene.add(xBar, yBar);
  }

  function curveLine(scene, pts, hex) {
    var geom = new THREE.BufferGeometry().setFromPoints(pts);
    var line = new THREE.Line(geom, new THREE.LineBasicMaterial({ color: hex, linewidth: 2 }));
    scene.add(line);
    return line;
  }

  global.P2NScene = {
    clamp01: clamp01,
    lerp: lerp,
    ball: ball,
    box: box,
    stage: stage,
    attachOrbit: attachOrbit,
    projectXY: projectXY,
    placeHud: placeHud,
    hudXY: hudXY,
    wavyArrow: wavyArrow,
    axes: axes,
    curveLine: curveLine
  };
})(window);
