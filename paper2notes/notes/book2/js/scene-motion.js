/* Reusable motion and label contract for Book 2 scene stages (F03/F05).

   One timeline is the single source of truth for a finite demonstration: the
   path, the moving object, every anchored label and every numeric readout are
   all functions of `progress`. Nothing else animates — no CSS keyframe may
   duplicate a scene's motion.

   Markup contract:
     <div class="visual stage" data-scene="NAME">
       <canvas class="scene-canvas"></canvas>
       <span class="hud-label" data-hud="KEY" data-anchor="true"></span>
     </div>
   The controller appends <div class="scene-toolbar" data-toolbar-for="…">
   right after the stage, so the controls never cover the drawing, and exposes
   it to the scene renderer through `onState`.

   Behaviour contract:
   - Pause / Play / Replay from one button, a scrub range and a % output.
   - Auto-play once when the stage first becomes visible; suspend while the
     stage is offscreen or the document is hidden; resume from the same frame.
   - prefers-reduced-motion: no autoplay, the terminal frame is shown directly
     and Replay jumps to the terminal frame instead of animating.
   - `placeLabel` anchors a label to a projected world point and clamps it
     inside the canvas with a readable pad, so endpoints are never clipped.
   - `snapshot()`-style state for tests: progress, playing, started, visible.

   Usage:
     var scene = NotesMotion.create({ host: host, canvas: canvas, render: renderAt });
   where renderAt(progress) draws every moving part of the frame. */
(function (global) {
  "use strict";

  var reduceQuery = global.matchMedia ? global.matchMedia("(prefers-reduced-motion: reduce)") : null;

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function create(options) {
    var host = options.host;
    var canvas = options.canvas;
    var render = options.render;
    var duration = options.duration || 6200;
    var reduceMotion = !!(reduceQuery && reduceQuery.matches);
    var progress = reduceMotion ? 1 : 0;
    var playing = false;
    var started = false;
    var visible = true;
    var lastTime = null;
    var frameId = null;
    var onState = options.onState || function () {};

    var toolbar = document.createElement("div");
    toolbar.className = "scene-toolbar";
    toolbar.setAttribute("data-toolbar-for", host.id || "scene");
    toolbar.setAttribute("role", "group");
    toolbar.setAttribute("aria-label", (options.label || "Diagram") + " controls");
    toolbar.innerHTML =
      '<button type="button" data-motion="toggle">Play</button>' +
      '<input type="range" min="0" max="1000" step="1" value="' + Math.round(progress * 1000) +
      '" data-motion="scrub" aria-label="Scrub ' + (options.label || "the animation") + '" aria-valuetext="0% of the journey">' +
      '<output data-motion="output">0%</output>';
    host.parentNode.insertBefore(toolbar, host.nextSibling);

    var toggle = toolbar.querySelector('[data-motion="toggle"]');
    var scrub = toolbar.querySelector('[data-motion="scrub"]');
    var output = toolbar.querySelector('[data-motion="output"]');

    function paint() {
      var percent = Math.round(progress * 100);
      scrub.value = String(Math.round(progress * 1000));
      scrub.setAttribute("aria-valuetext", percent + "% of the journey");
      output.textContent = percent + "%";
      if (reduceMotion) {
        /* No motion: the button jumps between the start and the final frame and
           the scrub range still lets the student step through by hand. */
        toggle.textContent = progress >= 1 ? "Show start" : "Show end";
        toggle.setAttribute("aria-pressed", progress >= 1 ? "true" : "false");
      } else {
        toggle.textContent = progress >= 1 ? "Replay" : playing ? "Pause" : "Play";
        toggle.setAttribute("aria-pressed", playing ? "true" : "false");
      }
      render(progress);
      onState();
    }

    function play() {
      if (reduceMotion) {
        seek(progress >= 1 ? 0 : 1);
        return;
      }
      if (progress >= 1) progress = 0;
      playing = true;
      lastTime = null;
      paint();
    }

    function pause() {
      playing = false;
      lastTime = null;
      paint();
    }

    function replay() {
      if (reduceMotion) {
        progress = progress >= 1 ? 0 : 1;
        playing = false;
        lastTime = null;
        paint();
        return;
      }
      progress = 0;
      playing = true;
      lastTime = null;
      paint();
    }

    function seek(value) {
      progress = clamp(Number(value) || 0, 0, 1);
      playing = false;
      lastTime = null;
      paint();
    }

    function frame(time) {
      if (lastTime === null) lastTime = time;
      var step = time - lastTime;
      lastTime = time;
      if (playing && visible && !document.hidden && step > 0) {
        progress = clamp(progress + step / duration, 0, 1);
        if (progress >= 1) playing = false;
        paint();
      }
      frameId = global.requestAnimationFrame(frame);
    }

    toggle.addEventListener("click", function () {
      started = true;
      if (progress >= 1) replay();
      else if (playing) pause();
      else play();
    });

    scrub.addEventListener("input", function () {
      started = true;
      seek(Number(scrub.value) / 1000);
    });

    if ("IntersectionObserver" in global) {
      var observer = new global.IntersectionObserver(function (entries) {
        var entry = entries[entries.length - 1];
        visible = entry.intersectionRatio > 0.05;
        if (!entry.isIntersecting || started || entry.intersectionRatio < 0.35) return;
        started = true;
        if (reduceMotion) paint();
        else play();
      }, { threshold: [0, 0.05, 0.35] });
      observer.observe(host);
    } else {
      started = true;
      visible = true;
      if (!reduceMotion) play();
    }

    document.addEventListener("visibilitychange", function () {
      lastTime = null;
    });

    if (reduceQuery && reduceQuery.addEventListener) {
      reduceQuery.addEventListener("change", function (event) {
        reduceMotion = !!event.matches;
        if (reduceMotion) {
          playing = false;
          progress = 1;
        }
        paint();
      });
    }

    paint();
    frameId = global.requestAnimationFrame(frame);

    return {
      play: play,
      pause: pause,
      replay: replay,
      seek: seek,
      toolbar: toolbar,
      state: function () {
        return {
          progress: progress,
          playing: playing,
          started: started,
          visible: visible,
          reduceMotion: reduceMotion
        };
      },
      destroy: function () {
        if (frameId !== null) global.cancelAnimationFrame(frameId);
        frameId = null;
        if (observer) observer.disconnect();
      }
    };
  }

  /* Project a world point to canvas pixels (origin top-left of the canvas). */
  function projectToCanvas(camera, canvas, point) {
    var projected = point.clone().project(camera);
    return {
      x: (projected.x + 1) * 0.5 * canvas.clientWidth,
      y: (1 - projected.y) * 0.5 * canvas.clientHeight,
      ndcX: projected.x,
      ndcY: projected.y
    };
  }

  /* Anchor a label to a projected point, keeping the whole label box inside the
     canvas with a readable pad. Returns where the label actually landed. */
  function placeLabel(label, camera, canvas, point, options) {
    var settings = options || {};
    var at = projectToCanvas(camera, canvas, point);
    var pad = settings.pad == null ? 8 : settings.pad;
    var width = label.offsetWidth || 0;
    var height = label.offsetHeight || 0;
    var padLeft = canvas.offsetLeft || 0;
    var padTop = canvas.offsetTop || 0;
    var minX = padLeft + pad + width / 2;
    var maxX = padLeft + canvas.clientWidth - pad - width / 2;
    var minY = padTop + pad + height / 2;
    var maxY = padTop + canvas.clientHeight - pad - height / 2;
    var x = clamp(at.x + padLeft + (settings.dx || 0), Math.min(minX, maxX), Math.max(minX, maxX));
    var y = clamp(at.y + padTop + (settings.dy || 0), Math.min(minY, maxY), Math.max(minY, maxY));
    label.style.left = x + "px";
    label.style.top = y + "px";
    return {
      hudLeft: x,
      hudTop: y,
      width: width,
      height: height,
      anchorX: at.x + padLeft,
      anchorY: at.y + padTop,
      ndcX: at.ndcX,
      ndcY: at.ndcY,
      inside: x - width / 2 >= padLeft && x + width / 2 <= padLeft + canvas.clientWidth &&
        y - height / 2 >= padTop && y + height / 2 <= padTop + canvas.clientHeight
    };
  }

  /* Fit an orthographic camera to a world-space box, reserving padPx of frame
     padding for labels while keeping one scale on both axes (no stretching). */
  function fitCamera(camera, bounds, canvas, padPx) {
    var width = canvas.clientWidth || 640;
    var height = canvas.clientHeight || 320;
    var pad = padPx == null ? 30 : padPx;
    var geometryWidth = Math.max(bounds.maxX - bounds.minX, 0.001);
    var geometryHeight = Math.max(bounds.maxY - bounds.minY, 0.001);
    var centreX = (bounds.minX + bounds.maxX) / 2;
    var centreY = (bounds.minY + bounds.maxY) / 2;
    var usableWidth = Math.max(width - 2 * pad, 40);
    var usableHeight = Math.max(height - 2 * pad, 40);
    var unitsPerPx = Math.max(geometryWidth / usableWidth, geometryHeight / usableHeight);
    var halfWidth = unitsPerPx * width / 2;
    var halfHeight = unitsPerPx * height / 2;
    camera.left = centreX - halfWidth;
    camera.right = centreX + halfWidth;
    camera.top = centreY + halfHeight;
    camera.bottom = centreY - halfHeight;
    camera.updateProjectionMatrix();
    return { unitsPerPx: unitsPerPx, padPx: pad };
  }

  global.NotesMotion = {
    create: create,
    projectToCanvas: projectToCanvas,
    placeLabel: placeLabel,
    fitCamera: fitCamera
  };
})(window);
