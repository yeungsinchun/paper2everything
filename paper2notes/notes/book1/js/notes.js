/* Book 1 page chrome shared by every chapter page.
   - Keeps --topbar-h equal to the sticky top bar's height, so the idea chips
     can stick under it and jump targets are not hidden behind it.
   - Marks the idea chip of the section being read (aria-current="location"). */
(function () {
  "use strict";

  function setTopbarHeight() {
    var bar = document.querySelector(".topbar");
    if (!bar) return;
    var sticky = window.getComputedStyle(bar).position === "sticky";
    document.documentElement.style.setProperty("--topbar-h", (sticky ? bar.offsetHeight : 0) + "px");
  }

  function initIdeaNav() {
    var nav = document.querySelector(".idea-nav");
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var targets = links.map(function (a) {
      return document.getElementById(a.getAttribute("href").slice(1));
    });

    function mark(i) {
      links.forEach(function (a, j) {
        if (j === i) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
      var a = links[i];
      if (!a) return;
      var left = a.offsetLeft - nav.offsetLeft;
      if (left < nav.scrollLeft || left + a.offsetWidth > nav.scrollLeft + nav.clientWidth) {
        nav.scrollLeft = Math.max(0, left - 16);
      }
    }

    var ticking = false;
    function update() {
      ticking = false;
      var line = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-h")) || 0) + nav.offsetHeight + 24;
      var current = -1;
      targets.forEach(function (el, i) {
        if (el && el.getBoundingClientRect().top - line <= 0) current = i;
      });
      mark(current);
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function start() {
    setTopbarHeight();
    window.addEventListener("resize", setTopbarHeight);
    initIdeaNav();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
