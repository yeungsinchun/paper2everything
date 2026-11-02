/* Book 8 page behaviour shared by every subsection page.
   - Section chips (nav.idea-chips): the chip of the idea in view gets .is-current.
   - Print and PDF export: worked solutions open so the sheet carries them. */
(function () {
  "use strict";

  function initChips() {
    var nav = document.querySelector(".idea-chips");
    if (!nav || !window.IntersectionObserver) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var byId = {};
    var ideas = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (!el) return;
      byId[id] = a;
      ideas.push(el);
    });
    var shown = {};
    function mark() {
      var current = null;
      ideas.forEach(function (el) {
        if (shown[el.id] && !current) current = el.id;
      });
      links.forEach(function (a) {
        var on = a === byId[current];
        a.classList.toggle("is-current", on);
        if (on && nav.scrollWidth > nav.clientWidth) {
          var left = a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2;
          nav.scrollLeft = Math.max(0, left);
        }
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        shown[e.target.id] = e.isIntersecting;
      });
      mark();
    }, { rootMargin: "-140px 0px -45% 0px", threshold: 0 });
    ideas.forEach(function (el) { io.observe(el); });
  }

  var reopened = [];
  window.addEventListener("beforeprint", function () {
    Array.prototype.slice.call(document.querySelectorAll(".worked > details:not([open])")).forEach(function (d) {
      d.open = true;
      reopened.push(d);
    });
  });
  window.addEventListener("afterprint", function () {
    reopened.forEach(function (d) { d.open = false; });
    reopened = [];
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChips);
  } else {
    initChips();
  }
})();
