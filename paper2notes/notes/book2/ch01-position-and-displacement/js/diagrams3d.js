/* Chapter 1 scene renderers (3D stages).
   Every scene is a pure function of one timeline value: `render(progress)` draws
   the path, the moving object, the anchored labels and the readouts together, so
   the figure can never disagree with itself. Motion state (Pause / Replay /
   scrub / reduced motion) comes from ../js/scene-motion.js; each scene only
   supplies geometry and formatting.
   Palette contract: distance is cyan and dashed, displacement is violet,
   velocity blue, guide geometry pale — all read from the design-system tokens,
   never re-invented.
   Tests read `window.NotesScenes[NAME].snapshot()`. */
(function (global) {
  "use strict";

  var THREE = global.THREE;
  var motion = global.NotesMotion;
  if (!THREE || !motion) return;

  function cssToken(name, fallback) {
    var value = "";
    try {
      value = global.getComputedStyle(document.documentElement).getPropertyValue(name) || "";
    } catch (error) {
      value = "";
    }
    value = value.trim();
    return value || fallback;
  }

  var COLORS = {
    ink: cssToken("--fig-ink", "#17212B"),
    guide: cssToken("--fig-guide", "#B9B2A1"),
    distance: cssToken("--fig-distance", "#2A8FA8"),
    displacement: cssToken("--fig-displacement", "#7A4FC2"),
    velocity: cssToken("--fig-velocity", "#2A62A8")
  };

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function point(x, y) {
    return new THREE.Vector3(x, y, 0);
  }

  function midpoint(a, b) {
    return new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, 0);
  }

  function createLine(scene, points, color, dashed) {
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var material = dashed
      ? new THREE.LineDashedMaterial({ color: color, dashSize: 0.14, gapSize: 0.1 })
      : new THREE.LineBasicMaterial({ color: color });
    var object = new THREE.Line(geometry, material);
    object.userData.dashed = !!dashed;
    if (dashed) object.computeLineDistances();
    scene.add(object);
    return object;
  }

  function setLine(object, points) {
    object.geometry.dispose();
    object.geometry = new THREE.BufferGeometry().setFromPoints(points);
    if (object.userData.dashed) object.computeLineDistances();
  }

  function createArrow(scene, color, scale) {
    var object = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.001, color, 0.2, 0.12);
    object.userData.scale = scale || 1;
    scene.add(object);
    return object;
  }

  function setArrow(object, origin, target, visible) {
    var vector = target.clone().sub(origin);
    var length = vector.length();
    var visibleNow = visible !== false && length > 0.02;
    object.visible = visibleNow;
    object.position.copy(origin);
    if (!visibleNow) return;
    object.setDirection(vector.normalize());
    var scale = object.userData.scale || 1;
    object.setLength(length, Math.min(0.24, length * 0.26) * scale, Math.min(0.15, length * 0.17) * scale);
  }

  function createDot(scene, radius, color) {
    var dot = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 20, 14),
      new THREE.MeshBasicMaterial({ color: color })
    );
    scene.add(dot);
    return dot;
  }

  function createMouse(scene, color) {
    var mouse = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 20, 14),
      new THREE.MeshBasicMaterial({ color: color })
    );
    body.scale.set(1.3, 0.95, 1);
    mouse.add(body);
    [-0.07, 0.07].forEach(function (offset) {
      var ear = new THREE.Mesh(
        new THREE.CircleGeometry(0.07, 16),
        new THREE.MeshBasicMaterial({ color: color })
      );
      ear.position.set(0.07, offset, 0.03);
      mouse.add(ear);
    });
    scene.add(mouse);
    return mouse;
  }

  function setText(host, key, value) {
    var target = host.parentNode.querySelector('[data-readout="' + key + '"] .p2n-num');
    if (target) target.textContent = value;
  }

  /* Fit an orthographic camera to a fixed world box, then anchor labels after
     every frame and every resize. */
  function createFrame(host, canvas, camera, bounds, pad) {
    return {
      fit: function () {
        return motion.fitCamera(camera, bounds, canvas, pad);
      },
      anchor: function (key, worldPoint, dx, dy) {
        var label = host.querySelector('[data-hud="' + key + '"]');
        if (!label) return null;
        if (worldPoint === null) {
          label.hidden = true;
          return null;
        }
        label.hidden = false;
        return motion.placeLabel(label, camera, canvas, worldPoint, { dx: dx, dy: dy });
      }
    };
  }

  function base(state) {
    return {
      progress: state.progress,
      playing: state.playing,
      started: state.started,
      visible: state.visible,
      reduceMotion: state.reduceMotion
    };
  }

  function withLabels(out, labels) {
    out.labels = labels;
    return out;
  }

  var SCENES = {};

  /* ---------- A · the trench: 500 m east, 500 m north, 1000 m path, 707 m NE ---------- */
  SCENES.trench = function (host, canvas, scene, camera) {
    var metresPerUnit = 500 / 3;
    var A = point(-1.5, -1.5);
    var B = point(1.5, -1.5);
    var C = point(1.5, 1.5);
    var frame = createFrame(host, canvas, camera, { minX: -1.5, maxX: 1.5, minY: -1.5, maxY: 1.5 }, 42);
    var labels = {};

    createLine(scene, [A, B, C], COLORS.guide, true);
    [A, B, C].forEach(function (corner) { createDot(scene, 0.075, COLORS.ink).position.copy(corner); });
    var travelled = createLine(scene, [A, A], COLORS.distance, true);
    var displacement = createArrow(scene, COLORS.displacement, 1.25);
    var mouse = createMouse(scene, COLORS.ink);

    function legs(progress) {
      var legProgress = progress * 2;
      return {
        east: Math.min(legProgress, 1),
        north: clamp(legProgress - 1, 0, 1)
      };
    }

    function travelledPath(progress) {
      var walked = legs(progress);
      var currentY = lerp(A.y, B.y, walked.east);
      var current = point(lerp(A.x, B.x, walked.east), lerp(currentY, C.y, walked.north));
      var path = [A];
      if (walked.east > 0) path.push(point(current.x, A.y));
      if (walked.north > 0) path.push(current);
      return { current: current, path: path };
    }

    function metres(progress) {
      var walked = legs(progress);
      var eastMetres = walked.east * 500;
      var northMetres = walked.north * 500;
      return {
        east: eastMetres,
        north: northMetres,
        distance: eastMetres + northMetres,
        displacement: Math.hypot(eastMetres, northMetres),
        direction: northMetres > 1 ? " NE" : eastMetres > 1 ? " E" : ""
      };
    }

    function render(progress) {
      var move = travelledPath(progress);
      var values = metres(progress);
      setLine(travelled, move.path);
      mouse.position.copy(move.current);
      setArrow(displacement, A, move.current);
      setText(host, "distance", Math.round(values.distance) + " m");
      setText(host, "displacement", Math.round(values.displacement) + " m" + values.direction);

      labels.A = frame.anchor("A", A, -14, 12);
      labels.B = frame.anchor("B", B, 12, 12);
      labels.C = frame.anchor("C", C, 16, -16);
      labels["leg-east"] = frame.anchor("leg-east", midpoint(A, B), 0, 18);
      labels["leg-north"] = frame.anchor("leg-north", midpoint(B, C), 54, 0);
      labels.diag = frame.anchor("diag", midpoint(A, move.current), -16, -14);
      /* The body label never fights the endpoint label at the finish. */
      labels.mouse = frame.anchor("mouse", move.current.distanceTo(C) < 0.4 ? null : move.current, 20, -12);
    }

    return {
      label: "The mouse trench",
      layout: frame.fit,
      render: render,
      snapshot: function (state) {
        var move = travelledPath(state.progress);
        var values = metres(state.progress);
        return withLabels(Object.assign(base(state), {
          distanceM: Math.round(values.distance),
          displacementM: Math.round(values.displacement),
          direction: values.direction.trim(),
          legs: { eastM: Math.round(values.east), northM: Math.round(values.north) },
          mouse: { x: move.current.x, y: move.current.y },
          anchors: { A: { x: A.x, y: A.y }, B: { x: B.x, y: B.y }, C: { x: C.x, y: C.y } },
          metresPerUnit: metresPerUnit
        }), labels);
      }
    };
  };

  /* ---------- B1 · tip-to-tail: a + b ---------- */
  SCENES["vector-add"] = function (host, canvas, scene, camera) {
    var start = point(-1.5, -2);
    var junction = point(1.5, -2);
    var finish = point(1.5, 2);
    var frame = createFrame(host, canvas, camera, { minX: -1.5, maxX: 1.5, minY: -2, maxY: 2 }, 40);
    var labels = {};

    [start, junction, finish].forEach(function (corner) { createDot(scene, 0.09, COLORS.ink).position.copy(corner); });
    var legA = createArrow(scene, COLORS.displacement);
    var legB = createArrow(scene, COLORS.displacement);
    var resultant = createArrow(scene, COLORS.displacement, 1.3);

    function phases(progress) {
      var phase = progress * 3;
      return {
        a: clamp(phase, 0, 1),
        b: clamp(phase - 1, 0, 1),
        resultant: clamp(phase - 2, 0, 1)
      };
    }

    function render(progress) {
      var out = phases(progress);
      setArrow(legA, start, point(lerp(start.x, junction.x, out.a), start.y), true);
      setArrow(legB, junction, point(junction.x, lerp(junction.y, finish.y, out.b)), true);
      setArrow(resultant, start, point(lerp(start.x, finish.x, out.resultant), lerp(start.y, finish.y, out.resultant)), out.resultant > 0.02);

      labels.start = frame.anchor("start", start, -20, 6);
      labels.junction = frame.anchor("junction", junction, 0, 20);
      labels.finish = frame.anchor("finish", finish, 0, -16);
      labels["leg-a"] = frame.anchor("leg-a", midpoint(start, junction), 0, -20);
      labels["leg-b"] = frame.anchor("leg-b", midpoint(junction, finish), 32, 0);
      labels.resultant = frame.anchor("resultant", midpoint(start, finish), -20, -12);
    }

    return {
      label: "Tip-to-tail addition",
      layout: frame.fit,
      render: render,
      snapshot: function (state) {
        return withLabels(Object.assign(base(state), { arrows: phases(state.progress) }), labels);
      }
    };
  };

  /* ---------- B2 · the return trip: distance grows, displacement returns to zero ---------- */
  SCENES.peter = function (host, canvas, scene, camera) {
    var metresPerUnit = 20 / 1.5;
    var radius = 1.5;
    var origin = point(-1.5, 0);
    var far = point(1.5, 0);
    var arcLengthMetres = Math.PI * radius * metresPerUnit;
    var frame = createFrame(host, canvas, camera, { minX: -1.5, maxX: 1.5, minY: -1.65, maxY: 1.65 }, 38);
    var labels = {};
    var guideUp = [];
    var guideDown = [];
    var step = 0;
    for (step = 0; step <= 72; step += 1) {
      var amount = step / 72;
      guideUp.push(point(radius * Math.cos(Math.PI * (1 - amount)), radius * Math.sin(Math.PI * amount)));
      guideDown.push(point(radius * Math.cos(Math.PI * amount), -radius * Math.sin(Math.PI * amount)));
    }
    createLine(scene, guideUp, COLORS.guide, true);
    createLine(scene, guideDown, COLORS.guide, true);
    createDot(scene, 0.1, COLORS.ink).position.copy(origin);
    createDot(scene, 0.1, COLORS.ink).position.copy(far);
    var outPath = createLine(scene, [origin, origin], COLORS.distance, true);
    var backPath = createLine(scene, [origin, origin], COLORS.distance, true);
    var displacement = createArrow(scene, COLORS.displacement, 1.15);
    var walker = createDot(scene, 0.14, COLORS.ink);

    function position(progress) {
      var amount = progress * 2;
      if (amount <= 1) {
        return point(radius * Math.cos(Math.PI * (1 - amount)), radius * Math.sin(Math.PI * amount));
      }
      return point(radius * Math.cos(Math.PI * (amount - 1)), -radius * Math.sin(Math.PI * (amount - 1)));
    }

    function distances(progress) {
      var amount = progress * 2;
      var current = position(progress);
      return {
        travelled: Math.min(amount, 1) * arcLengthMetres + clamp(amount - 1, 0, 1) * arcLengthMetres,
        displacement: current.distanceTo(origin) * metresPerUnit,
        current: current,
        amount: amount
      };
    }

    function render(progress) {
      var values = distances(progress);
      var outCount = Math.round(Math.min(values.amount, 1) * 72);
      var backCount = Math.round(clamp(values.amount - 1, 0, 1) * 72);
      setLine(outPath, outCount < 1 ? [origin, origin] : [origin].concat(guideUp.slice(1, outCount + 1)));
      setLine(backPath, backCount < 1 ? [origin, origin] : [origin].concat(guideDown.slice(1, backCount + 1)));
      walker.position.copy(values.current);
      setArrow(displacement, origin, values.current, values.displacement > 1);
      setText(host, "distance", Math.round(values.travelled) + " m");
      setText(host, "displacement", Math.round(values.displacement) + " m");

      labels.origin = frame.anchor("origin", origin, -18, 10);
      labels.far = frame.anchor("far", far, 18, 10);
      labels.out = frame.anchor("out", point(0, radius + 0.18), 0, -14);
      labels.back = frame.anchor("back", point(0, -radius - 0.18), 0, 14);
      labels["displacement-label"] = frame.anchor("displacement-label",
        values.displacement > 15 ? origin.clone().lerp(values.current, 0.66) : null, 0, -20);
      labels.walker = frame.anchor("walker", values.current, 16, -14);
    }

    return {
      label: "The return trip",
      layout: frame.fit,
      render: render,
      snapshot: function (state) {
        var values = distances(state.progress);
        return withLabels(Object.assign(base(state), {
          distanceM: Math.round(values.travelled),
          displacementM: Math.round(values.displacement),
          arcLengthM: arcLengthMetres,
          metresPerUnit: metresPerUnit,
          anchors: { origin: { x: origin.x, y: origin.y }, far: { x: far.x, y: far.y } }
        }), labels);
      }
    };
  };

  /* ---------- C · reading an s–t graph (slope readout tracks the curve) ---------- */
  SCENES["st-vt"] = function (host, canvas, scene, camera) {
    var origin = point(-3, -1.5);
    var frame = createFrame(host, canvas, camera, { minX: -3.4, maxX: 3.4, minY: -1.9, maxY: 2.1 }, 34);
    var labels = {};
    var curve = [];
    var step = 0;
    for (step = 0; step <= 80; step += 1) {
      var amount = step / 80;
      curve.push(point(-3 + 6 * amount, -1.35 + 2.9 * amount * amount));
    }
    setArrow(createArrow(scene, COLORS.guide), origin, point(3.3, -1.5));
    setArrow(createArrow(scene, COLORS.guide), origin, point(-3, 2));
    createLine(scene, curve, COLORS.ink);
    var marker = createDot(scene, 0.14, COLORS.velocity);
    var tangent = createLine(scene, [origin, origin], COLORS.velocity, true);

    function render(progress) {
      var x = -3 + 6 * progress;
      var y = -1.35 + 2.9 * progress * progress;
      var slope = 0.97 * progress;
      marker.position.set(x, y, 0);
      setLine(tangent, [point(x - 0.62, y - slope * 0.62), point(x + 0.62, y + slope * 0.62)]);
      labels.slope = frame.anchor("slope", point(x, y), -6, -18);
    }

    return {
      label: "s–t graph",
      layout: frame.fit,
      render: render,
      snapshot: function (state) {
        return withLabels(Object.assign(base(state), { slope: 0.97 * state.progress }), labels);
      }
    };
  };

  /* ---------- D · the worked 3–4–5 walk (outside R1 scope, migrated as-is) ---------- */
  SCENES.shirley = function (host, canvas, scene, camera) {
    var start = point(-1.5, -2);
    var corner = point(1.5, -2);
    var finish = point(1.5, 2);
    var frame = createFrame(host, canvas, camera, { minX: -1.5, maxX: 1.5, minY: -2, maxY: 2 }, 40);
    var labels = {};
    var east = createArrow(scene, COLORS.displacement);
    var north = createArrow(scene, COLORS.displacement);
    var resultant = createArrow(scene, COLORS.displacement, 1.3);

    function phases(progress) {
      var phase = progress * 3;
      return {
        east: clamp(phase, 0, 1),
        north: clamp(phase - 1, 0, 1),
        resultant: clamp(phase - 2, 0, 1)
      };
    }

    function render(progress) {
      var out = phases(progress);
      setArrow(east, start, point(lerp(start.x, corner.x, out.east), start.y), true);
      setArrow(north, corner, point(corner.x, lerp(corner.y, finish.y, out.north)), true);
      setArrow(resultant, start, point(lerp(start.x, finish.x, out.resultant), lerp(start.y, finish.y, out.resultant)), out.resultant > 0.02);
      labels.Shirley = frame.anchor("Shirley", start, 10, 18);
      labels.Simon = frame.anchor("Simon", finish, 0, -16);
    }

    return {
      label: "Shirley and Simon",
      layout: frame.fit,
      render: render,
      snapshot: function (state) {
        return withLabels(Object.assign(base(state), { arrows: phases(state.progress) }), labels);
      }
    };
  };

  function boot(host) {
    var canvas = host.querySelector("canvas.scene-canvas");
    var name = host.getAttribute("data-scene");
    var factory = SCENES[name];
    if (!factory || !canvas) return null;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(cssToken("--fig-bg", "#FFFFFF"));
    var camera = new THREE.OrthographicCamera(-4, 4, 2.35, -2.35, 0.1, 30);
    camera.position.set(0, 0, 12);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));

    var machine = factory(host, canvas, scene, camera);
    var controller = null;

    function draw(progress) {
      machine.render(progress);
      renderer.render(scene, camera);
    }

    function resize() {
      renderer.setSize(canvas.clientWidth || 640, canvas.clientHeight || 320, false);
      if (machine.layout) machine.layout();
      draw(controller ? controller.state().progress : 0);
    }

    controller = motion.create({
      host: host,
      canvas: canvas,
      label: machine.label,
      render: draw,
      duration: name === "trench" ? 5600 : 6000
    });

    global.addEventListener("resize", resize);
    host.setAttribute("data-scene-ready", "true");
    resize();

    global.NotesScenes = global.NotesScenes || {};
    global.NotesScenes[name] = {
      name: name,
      host: host,
      canvas: canvas,
      snapshot: function () {
        var snapshot = machine.snapshot(controller.state());
        snapshot.name = name;
        snapshot.colors = {
          distance: COLORS.distance,
          displacement: COLORS.displacement,
          guide: COLORS.guide,
          body: COLORS.ink,
          velocity: COLORS.velocity
        };
        return snapshot;
      },
      replay: controller.replay,
      play: controller.play,
      pause: controller.pause,
      seek: controller.seek,
      state: controller.state
    };
    return true;
  }

  function init() {
    document.querySelectorAll("[data-scene]").forEach(boot);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
