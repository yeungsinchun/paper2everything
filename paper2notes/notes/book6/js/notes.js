/* Book 6 page behaviour shared by every chapter page.
   Stages and their controls live in diagrams3d.js; concept checks and the PDF
   button live in checks.js. This file only makes print show the whole notes:
   collapsed worked examples and figure details open for the PDF and close again after. */
(function () {
  "use strict";

  var opened = [];

  window.addEventListener("beforeprint", function () {
    opened = Array.prototype.filter.call(document.querySelectorAll("details.worked-more, details.fig-more"), function (d) {
      return !d.open;
    });
    opened.forEach(function (d) { d.open = true; });
  });

  window.addEventListener("afterprint", function () {
    opened.forEach(function (d) { d.open = false; });
    opened = [];
  });
})();
