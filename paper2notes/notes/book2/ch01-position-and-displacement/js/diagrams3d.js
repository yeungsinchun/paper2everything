(function (global) {
  "use strict";

  var THREE = global.THREE;
  if (!THREE) return;

  var COLORS = {
    ink: 0x174f78,
    accent: 0xc34832,
    green: 0x18846e,
    pale: 0xabb8c2,
    gold: 0xc39422
  };
  var reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function createLine(scene, points, color) {
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var object = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: color }));
    scene.add(object);
    return object;
  }

  function createDashedLine(scene, points, color) {
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var object = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: color, dashSize: 0.12, gapSize: 0.09 }));
    object.computeLineDistances();
    scene.add(object);
    return object;
  }

  function createBall(scene, radius, color) {
    var object = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16),
      new THREE.MeshBasicMaterial({ color: color })
    );
    scene.add(object);
    return object;
  }

  function createMouse(scene) {
    var mouse = new THREE.Group();
    var body = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 24, 16),
      new THREE.MeshBasicMaterial({ color: COLORS.gold })
    );
    body.scale.set(1.35, 0.9, 1);
    mouse.add(body);
    [-0.09, 0.09].forEach(function (offset) {
      var ear = new THREE.Mesh(
        new THREE.CircleGeometry(0.085, 18),
        new THREE.MeshBasicMaterial({ color: COLORS.accent })
      );
      ear.position.set(0.1, offset, 0.03);
      mouse.add(ear);
    });
    scene.add(mouse);
    return mouse;
  }

  function createArrow(scene, origin, color) {
    var object = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin.clone(), 0.001, color, 0.22, 0.13);
    scene.add(object);
    return object;
  }

  function setArrow(object, origin, target, visible) {
    var vector = target.clone().sub(origin);
    var length = vector.length();
    object.visible = visible !== false && length > 0.015;
    object.position.copy(origin);
    if (!object.visible) return;
    object.setDirection(vector.normalize());
    object.setLength(length, Math.min(0.24, length * 0.26), Math.min(0.14, length * 0.16));
  }

  function setLine(object, points) {
    object.geometry.dispose();
    object.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }

  function placeHud(label, canvas, camera, point, offsetX, offsetY) {
    if (!label) return;
    var projected = point.clone().project(camera);
    label.style.left = ((projected.x + 1) * 50) + "%";
    label.style.top = ((1 - projected.y) * 50) + "%";
    label.style.marginLeft = (offsetX || 0) + "px";
    label.style.marginTop = (offsetY || 0) + "px";
  }

  function addControls(host, renderAt) {
    var controls = document.createElement("div");
    controls.className = "scene-controls";
    controls.innerHTML = '<button type="button">Pause</button><input type="range" min="0" max="1000" value="0" aria-label="Scrub animation"><output>0%</output>';
    host.appendChild(controls);
    var button = controls.querySelector("button");
    var range = controls.querySelector("input");
    var output = controls.querySelector("output");
    var playing = false;
    var progress = 0;
    var lastTime = null;
    var duration = 6200;
    var hasStarted = false;

    function paint() {
      range.value = String(Math.round(progress * 1000));
      range.setAttribute("aria-valuetext", Math.round(progress * 100) + "% through animation");
      output.value = Math.round(progress * 100) + "%";
      output.textContent = output.value;
      button.textContent = progress >= 1 ? "Replay" : playing ? "Pause" : "Play";
      button.setAttribute("aria-pressed", playing ? "true" : "false");
      renderAt(progress);
    }

    function frame(time) {
      if (lastTime === null) lastTime = time;
      if (playing) {
        progress = clamp(progress + (time - lastTime) / duration, 0, 1);
        if (progress >= 1) playing = false;
        paint();
      }
      lastTime = time;
      global.requestAnimationFrame(frame);
    }

    button.addEventListener("click", function () {
      if (progress >= 1) progress = 0;
      playing = !playing;
      hasStarted = true;
      lastTime = null;
      paint();
    });

    range.addEventListener("input", function () {
      progress = Number(range.value) / 1000;
      playing = false;
      hasStarted = true;
      paint();
    });

    paint();
    if ("IntersectionObserver" in global) {
      var observer = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting || hasStarted) return;
        hasStarted = true;
        playing = !reduceMotion;
        lastTime = null;
        paint();
        observer.disconnect();
      }, { threshold: 0.35 });
      observer.observe(host);
    } else {
      hasStarted = true;
      playing = !reduceMotion;
    }
    global.requestAnimationFrame(frame);
    return function () { return progress; };
  }

  function addTooltip(host, canvas, describe) {
    var tooltip = document.createElement("span");
    tooltip.className = "scene-tooltip";
    tooltip.hidden = true;
    tooltip.setAttribute("role", "status");
    host.appendChild(tooltip);

    canvas.addEventListener("pointermove", function (event) {
      var bounds = host.getBoundingClientRect();
      tooltip.textContent = describe();
      tooltip.style.left = clamp(event.clientX - bounds.left, 8, bounds.width - 170) + "px";
      tooltip.style.top = clamp(event.clientY - bounds.top, 40, bounds.height - 36) + "px";
      tooltip.hidden = false;
    });
    canvas.addEventListener("pointerleave", function () { tooltip.hidden = true; });
  }

  function boot(canvas) {
    var host = canvas.closest("[data-scene]");
    var name = host.getAttribute("data-scene");
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    var camera = new THREE.OrthographicCamera(-4, 4, 2.35, -2.35, 0.1, 30);
    camera.position.set(0, 0, 12);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    var currentProgress = 0;
    var hoverText = "Drag the timeline to inspect the diagram.";
    var hudPoints = [];

    function resize() {
      var width = canvas.clientWidth || 640;
      var height = canvas.clientHeight || 300;
      renderer.setSize(width, height, false);
      var aspect = width / height;
      camera.left = -2.35 * aspect;
      camera.right = 2.35 * aspect;
      camera.top = 2.35;
      camera.bottom = -2.35;
      camera.updateProjectionMatrix();
      hudPoints.forEach(function (item) {
        placeHud(item.label, canvas, camera, item.point, item.x, item.y);
      });
      renderer.render(scene, camera);
    }

    function pinHud(key, point, x, y) {
      var label = host.querySelector('[data-hud="' + key + '"]');
      if (!label) return;
      hudPoints.push({ label: label, point: point, x: x, y: y });
    }

    function renderTrench(progress) {
      var legProgress = progress * 2;
      var current;
      var points;
      if (legProgress <= 1) {
        current = new THREE.Vector3(lerp(pointA.x, pointB.x, legProgress), pointA.y, 0);
        points = [pointA, current];
      } else {
        current = new THREE.Vector3(pointB.x, lerp(pointB.y, pointC.y, legProgress - 1), 0);
        points = [pointA, pointB, current];
      }
      mouse.position.copy(current);
      setLine(travelled, points);
      setArrow(displacement, pointA, current, progress > 0.003);
      var east = Math.min(legProgress, 1) * 500;
      var north = Math.max(legProgress - 1, 0) * 500;
      var distance = progress * 1000;
      var magnitude = Math.hypot(east, north);
      distHud.textContent = "Distance travelled: " + Math.round(distance) + " m";
      var direction = north > 1 ? " NE" : east > 1 ? " E" : "";
      dispHud.textContent = "Displacement: " + Math.round(magnitude) + " m" + direction;
      hoverText = "At " + Math.round(progress * 100) + "%: distance " + Math.round(distance) + " m; displacement " + Math.round(magnitude) + " m.";
    }

    var renderAt;
    if (name === "trench") {
      var pointA = new THREE.Vector3(-2.8, -1.25, 0);
      var pointB = new THREE.Vector3(0.25, -1.25, 0);
      var pointC = new THREE.Vector3(0.25, 1.45, 0);
      createDashedLine(scene, [pointA, pointB, pointC], COLORS.pale);
      createBall(scene, 0.11, COLORS.ink).position.copy(pointA);
      createBall(scene, 0.11, COLORS.ink).position.copy(pointB);
      createBall(scene, 0.11, COLORS.ink).position.copy(pointC);
      var travelled = createLine(scene, [pointA, pointA], COLORS.ink);
      var displacement = createArrow(scene, pointA, COLORS.accent);
      var mouse = createMouse(scene);
      var distHud = host.querySelector('[data-hud="dist"]');
      var dispHud = host.querySelector('[data-hud="disp"]');
      pinHud("A", pointA, -12, 8);
      pinHud("B", pointB, 10, 8);
      pinHud("C", pointC, 10, -20);
      renderAt = renderTrench;
    } else if (name === "vector-add") {
      var start = new THREE.Vector3(-2.35, -1.25, 0);
      var corner = new THREE.Vector3(0, -1.25, 0);
      var finish = new THREE.Vector3(0, 1.2, 0);
      var eastArrow = createArrow(scene, start, COLORS.ink);
      var northArrow = createArrow(scene, corner, COLORS.green);
      var resultArrow = createArrow(scene, start, COLORS.accent);
      pinHud("res", new THREE.Vector3(-0.9, 0.18, 0), 0, -18);
      renderAt = function (progress) {
        setArrow(eastArrow, start, new THREE.Vector3(lerp(start.x, corner.x, clamp(progress * 3, 0, 1)), start.y, 0));
        setArrow(northArrow, corner, new THREE.Vector3(corner.x, lerp(corner.y, finish.y, clamp(progress * 3 - 1, 0, 1)), 0));
        setArrow(resultArrow, start, new THREE.Vector3(lerp(start.x, finish.x, clamp(progress * 3 - 2, 0, 1)), lerp(start.y, finish.y, clamp(progress * 3 - 2, 0, 1)), 0));
        hoverText = progress < 0.34 ? "Step 1: draw the east vector." : progress < 0.67 ? "Step 2: put the north vector tail at the first tip." : "Step 3: the resultant joins the original start to the final tip.";
      };
    } else if (name === "peter") {
      var left = new THREE.Vector3(-2.1, 0, 0);
      var right = new THREE.Vector3(2.1, 0, 0);
      var redPath = [];
      var greenPath = [];
      for (var curveIndex = 0; curveIndex <= 80; curveIndex += 1) {
        var curveAmount = curveIndex / 80;
        redPath.push(new THREE.Vector3(2.1 * Math.cos(Math.PI * (1 - curveAmount)), 1.35 * Math.sin(Math.PI * curveAmount), 0));
        greenPath.push(new THREE.Vector3(2.1 * Math.cos(Math.PI * curveAmount), -1.35 * Math.sin(Math.PI * curveAmount), 0));
      }
      createLine(scene, redPath, COLORS.accent);
      createLine(scene, greenPath, COLORS.green);
      createBall(scene, 0.1, COLORS.ink).position.copy(left);
      createBall(scene, 0.1, COLORS.ink).position.copy(right);
      var peter = createBall(scene, 0.18, COLORS.gold);
      pinHud("red", new THREE.Vector3(0, 1.35, 0), 0, -16);
      pinHud("green", new THREE.Vector3(0, -1.35, 0), 0, 8);
      renderAt = function (progress) {
        var amount = progress * 2;
        var angle;
        if (amount <= 1) {
          angle = Math.PI * (1 - amount);
          peter.position.set(2.1 * Math.cos(angle), 1.35 * Math.sin(angle), 0);
          hoverText = "Outward trip: displacement points from O to P.";
        } else {
          angle = Math.PI * (amount - 1);
          peter.position.set(2.1 * Math.cos(angle), -1.35 * Math.sin(angle), 0);
          hoverText = progress >= 0.995 ? "Back at O: total distance is non-zero, but displacement is zero." : "Return trip: same distance, opposite displacement.";
        }
      };
    } else if (name === "st-vt") {
      var axisOrigin = new THREE.Vector3(-3.2, -1.55, 0);
      setArrow(createArrow(scene, axisOrigin, COLORS.pale), axisOrigin, new THREE.Vector3(3.3, -1.55, 0));
      setArrow(createArrow(scene, axisOrigin, COLORS.pale), axisOrigin, new THREE.Vector3(-3.2, 1.9, 0));
      var curvePoints = [];
      for (var graphIndex = 0; graphIndex <= 80; graphIndex += 1) {
        var graphAmount = graphIndex / 80;
        curvePoints.push(new THREE.Vector3(-3 + 6 * graphAmount, -1.35 + 2.9 * graphAmount * graphAmount, 0));
      }
      createLine(scene, curvePoints, COLORS.accent);
      var graphPoint = createBall(scene, 0.16, COLORS.gold);
      var tangent = createLine(scene, [axisOrigin, axisOrigin], COLORS.ink);
      pinHud("slope", new THREE.Vector3(0.65, 1.35, 0), 0, -14);
      renderAt = function (progress) {
        var x = -3 + 6 * progress;
        var y = -1.35 + 2.9 * progress * progress;
        graphPoint.position.set(x, y, 0);
        var slope = 0.97 * progress;
        setLine(tangent, [new THREE.Vector3(x - 0.62, y - slope * 0.62, 0), new THREE.Vector3(x + 0.62, y + slope * 0.62, 0)]);
        hoverText = "Time " + (progress * 10).toFixed(1) + " s · displacement " + (progress * progress * 20).toFixed(1) + " m · slope (velocity) " + (progress * 4).toFixed(1) + " m/s.";
      };
    } else if (name === "shirley") {
      var shirleyStart = new THREE.Vector3(-2.5, -1.35, 0);
      var shirleyCorner = new THREE.Vector3(-0.1, -1.35, 0);
      var shirleyFinish = new THREE.Vector3(-0.1, 1.45, 0);
      var east = createArrow(scene, shirleyStart, COLORS.ink);
      var north = createArrow(scene, shirleyCorner, COLORS.green);
      var resultant = createArrow(scene, shirleyStart, COLORS.accent);
      pinHud("Shirley", new THREE.Vector3(-1.35, -1.35, 0), 0, 10);
      pinHud("Simon", new THREE.Vector3(-0.1, 0.1, 0), 16, 0);
      renderAt = function (progress) {
        var phase = progress * 3;
        setArrow(east, shirleyStart, new THREE.Vector3(lerp(shirleyStart.x, shirleyCorner.x, clamp(phase, 0, 1)), shirleyStart.y, 0));
        setArrow(north, shirleyCorner, new THREE.Vector3(shirleyCorner.x, lerp(shirleyCorner.y, shirleyFinish.y, clamp(phase - 1, 0, 1)), 0));
        setArrow(resultant, shirleyStart, new THREE.Vector3(lerp(shirleyStart.x, shirleyFinish.x, clamp(phase - 2, 0, 1)), lerp(shirleyStart.y, shirleyFinish.y, clamp(phase - 2, 0, 1)), 0));
        hoverText = phase < 1 ? "3 m east." : phase < 2 ? "Then 4 m north." : "Resultant: 5 m north-east (a 3–4–5 triangle).";
      };
    } else {
      return;
    }

    function render(progress) {
      currentProgress = progress;
      renderAt(progress);
      renderer.render(scene, camera);
    }

    resize();
    global.addEventListener("resize", resize);
    addControls(host, render);
    addTooltip(host, canvas, function () { return hoverText; });
    render(currentProgress);
  }

  function init() {
    document.querySelectorAll("canvas.scene-canvas").forEach(boot);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
