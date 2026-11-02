/* Concept checks and end-of-section DSE decks, shared by every book.
   Markup contract:
   - .check[data-check="mc"][data-answer="B"] > .choices > button[data-choice] ; .feedback ; .explain[hidden]
   - .check[data-check="tf"] > .tf-item[data-answer="true|false"] > button[data-tf] ; .feedback ; .explain[hidden]
   - .check > button[data-reveal] ; .model[hidden] (or .explain[hidden]) — full reasoning stays
     behind an explicit Show answer toggle, whatever the check type; it can be a
     retryable multiple-choice check and still keep its complete working hidden.
   - [data-notes-export] button: prints the page (Save as PDF in the dialog).
   - section[data-quiz="mc|lq"] > .quiz-slides > article.quiz-slide#dse-mc-YYYY-N ; .quiz-status ;
     [data-quiz-prev] / [data-quiz-next]. Optional deck attributes:
       data-quiz-pdf / data-quiz-section-pdf  link the whole-chapter and this-section PDFs;
       data-quiz-scan-export                  adds "Export PDF", printing the deck's scans.
   After the student answers correctly, the short `.explain` line (when present) is shown so
   every check teaches the reasoning; a wrong pick is an amber nudge and the rest of the
   options stay live until one is right.
   Data: each book's js/quiz-data.js, loaded before this file, sets
     window.P2N_QUIZ = { paperLos: { "<paper id>": [syllabus LO stems] },
                         quizKeys: { "<paper id>": { option: "A-D", pct: <percent correct> } } }
   paperLos orders a deck by learning objective; quizKeys grades DSE MC picks. */
(function () {
  "use strict";

  var QUIZ_DATA = window.P2N_QUIZ || {};
  var PAPER_LOS = QUIZ_DATA.paperLos || {};
  var QUIZ_KEYS = QUIZ_DATA.quizKeys || {};

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function setFeedback(el, ok, text) {
    if (!el) return;
    el.textContent = text;
    el.className = "feedback " + (ok ? "ok" : "no");
  }

  function reveal(box) {
    $all(".explain[hidden]", box).forEach(function (ex) {
      if (ex.closest(".tf-item") && ex.closest(".tf-item") !== box) return;
      ex.hidden = false;
    });
  }

  function initMc() {
    $all("[data-check='mc']").forEach(function (box) {
      var answer = box.getAttribute("data-answer");
      var out = $(".feedback", box);
      $all("button[data-choice]", box).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var pick = btn.getAttribute("data-choice");
          if (pick === answer) {
            $all("button[data-choice]", box).forEach(function (b) {
              b.classList.remove("wrong");
              b.disabled = true;
            });
            btn.classList.add("correct");
            setFeedback(out, true, "Right.");
          } else {
            /* wrong answers are a nudge: wobble, dim this option, keep the rest live */
            btn.classList.remove("wrong");
            void btn.offsetWidth;
            btn.classList.add("wrong");
            btn.disabled = true;
            setFeedback(out, false, "Not quite. Try another.");
            return;
          }
          var ex = $(":scope > .explain", box);
          if (ex) ex.hidden = false;
        });
      });
    });
  }

  function initTf() {
    $all("[data-check='tf']").forEach(function (box) {
      $all(".tf-item", box).forEach(function (item) {
        var answer = item.getAttribute("data-answer") === "true";
        var out = $(".feedback", item);
        $all("button[data-tf]", item).forEach(function (btn) {
          btn.addEventListener("click", function () {
            var pick = btn.getAttribute("data-tf") === "true";
            if (pick === answer) {
              $all("button[data-tf]", item).forEach(function (b) {
                b.disabled = true;
              });
              btn.classList.add("correct");
              setFeedback(out, true, "Right.");
            } else {
              btn.classList.add("wrong");
              btn.disabled = true;
              setFeedback(out, false, "Not quite. Try the other.");
              return;
            }
            reveal(item);
          });
        });
      });
    });
  }

  function initReveals() {
    $all(".check").forEach(function (box) {
      var btn = $("button[data-reveal]", box);
      var target = $(".model, .explain", box);
      if (!btn || !target || btn.getAttribute("data-reveal-wired")) return;
      btn.setAttribute("data-reveal-wired", "true");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", target.id || (target.id = "reveal-" + Math.random().toString(36).slice(2, 8)));
      btn.setAttribute("data-label-show", btn.textContent.trim() || "Show answer");
      btn.addEventListener("click", function () {
        var open = target.hidden;
        target.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "Hide answer" : btn.getAttribute("data-label-show");
      });
    });
  }

  function numberChecks() {
    var n = 0;
    $all(".check").forEach(function (box) {
      var h = $("h3", box);
      if (!h || h.getAttribute("data-numbered")) return;
      n += 1;
      var label = box.getAttribute("data-check") === "sa" ? "Write it" : "Quick check";
      h.textContent = label + " " + n;
      h.removeAttribute("data-src");
      h.setAttribute("data-numbered", "true");
    });
  }


  function normalizeLo(text) {
    return (text || "").replace(/extension/gi, " ").replace(/\s+/g, " ").trim();
  }

  function loNumbersFor(paperId, loTexts) {
    var stems = PAPER_LOS[paperId] || [];
    var nums = [];
    var i, j, lo, stem;
    for (i = 0; i < loTexts.length; i += 1) {
      lo = normalizeLo(loTexts[i]);
      for (j = 0; j < stems.length; j += 1) {
        stem = normalizeLo(stems[j]);
        if (stem && (lo.indexOf(stem) !== -1 || stem.indexOf(lo) !== -1)) {
          nums.push(i + 1);
          break;
        }
      }
    }
    if (!nums.length && loTexts.length) nums.push(loTexts.length);
    return nums;
  }

  /* Export notes as PDF: the browser's own print of this page (Save as PDF in
     the dialog). Print styles drop the top bar, page tools and quiz decks, so
     the PDF is the notes themselves. */
  function initNotesExport() {
    $all("[data-notes-export]").forEach(function (btn) {
      if (btn.getAttribute("data-notes-export-ready")) return;
      btn.setAttribute("data-notes-export-ready", "true");
      btn.addEventListener("click", function () { window.print(); });
    });
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  /* Every classified paper on this page (MC deck first, then LQ), one per printed
     page, as a stand-alone document the browser's print dialog saves as a PDF.
     Nothing is fetched beyond the scans already on the page. Used by decks marked
     data-quiz-scan-export, which have no prebuilt section PDF to link. */
  function sectionPapersHtml() {
    var title = (document.title || "").trim();
    var pages = [];
    $all("[data-quiz]").forEach(function (deck) {
      var kind = deck.getAttribute("data-quiz") === "lq" ? "Long question" : "Multiple choice";
      $all(".quiz-slide", deck).forEach(function (slide) {
        var img = $("img", slide);
        if (!img) return;
        var cap = $("figcaption", slide);
        var src = new URL(img.getAttribute("src"), location.href).href;
        pages.push(
          '<section class="paper"><h2>' + escapeHtml(kind) + " · " +
          escapeHtml(cap ? cap.textContent.trim() : "") + "</h2>" +
          '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(img.getAttribute("alt") || "") + '"></section>'
        );
      });
    });
    return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
      "<title>" + escapeHtml(title) + " – classified papers</title>" +
      "<style>" +
      "body{margin:0;font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1b2129;background:#fff}" +
      "h1{font-size:20px;margin:24px 24px 4px}" +
      ".lead{margin:0 24px 16px;color:#5d6673}" +
      ".paper{page-break-after:always;break-after:page;padding:16px 24px}" +
      ".paper:last-child{page-break-after:auto;break-after:auto}" +
      ".paper h2{font-size:15px;margin:0 0 10px;color:#5d6673}" +
      ".paper img{display:block;max-width:100%;height:auto}" +
      "@media print{h1,.lead{margin-top:0}.paper img{max-height:calc(100vh - 70px)}}" +
      "</style></head><body>" +
      "<h1>" + escapeHtml(title) + "</h1>" +
      '<p class="lead">' + pages.length + " classified paper" + (pages.length === 1 ? "" : "s") +
      " for this section. Use Save as PDF in the print dialog.</p>" +
      pages.join("") + "</body></html>";
  }

  function exportSectionPapers() {
    var html = sectionPapersHtml();
    var win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    var imgs = Array.prototype.slice.call(win.document.images);
    var pending = 0;
    var subscribed = false;
    var printed = false;
    function go() {
      if (!subscribed || pending !== 0 || printed) return;
      printed = true;
      win.focus();
      win.print();
    }
    imgs.forEach(function (img) {
      if (img.complete) return;
      pending += 1;
      var settled = false;
      function done() {
        if (settled) return;
        settled = true;
        pending -= 1;
        go();
      }
      img.addEventListener("load", done);
      img.addEventListener("error", done);
      if (img.complete) done();
    });
    subscribed = true;
    go();
  }

  /* Section quiz: one DSE paper at a time in a single card.
     Card: LO line (which objective this paper tests, paper id), the scan,
     A-D tiles for MC, verdict. Prev / Next and "n of N" with dots under it.
     Papers are ordered by their last-matching LO so the LO line changes as the student moves on. */
  function initQuizDecks() {
    $all("[data-quiz]").forEach(function (deck) {
      if (deck.getAttribute("data-quiz-ready")) return;
      deck.setAttribute("data-quiz-ready", "true");
      var slides = $all(".quiz-slide", deck);
      if (!slides.length) return;
      var status = $(".quiz-status", deck);
      var loTexts = $all(".lo-list li").map(function (li) {
        var p = $("p", li);
        return ((p ? p.textContent : li.textContent) || "").replace(/\s+/g, " ").trim();
      }).filter(Boolean);
      var playlist = slides.map(function (slide) {
        var nums = loNumbersFor(slide.id, loTexts);
        return { slide: slide, primary: nums.length ? nums[nums.length - 1] : 0 };
      }).sort(function (a, b) { return a.primary - b.primary; });
      var index = 0;
      var isLq = deck.getAttribute("data-quiz") === "lq";
      var slidesBox = $(".quiz-slides", deck) || deck;

      slides.forEach(function (slide) {
        $all(".quiz-lo, .quiz-lq, .quiz-also", slide).forEach(function (el) { el.parentNode.removeChild(el); });
        if (slide.id.indexOf("dse-lq-") === 0) return;
        if ($(".quiz-choices", slide)) return;
        var row = document.createElement("div");
        row.className = "quiz-choices";
        row.setAttribute("role", "group");
        row.setAttribute("aria-label", "Your answer: A, B, C or D");
        ["A", "B", "C", "D"].forEach(function (letter) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "quiz-letter";
          b.setAttribute("data-quiz-choice", letter);
          b.textContent = letter;
          row.appendChild(b);
        });
        slide.appendChild(row);
        var pct = document.createElement("p");
        pct.className = "quiz-pct";
        pct.setAttribute("aria-live", "polite");
        pct.hidden = true;
        slide.appendChild(pct);
      });

      var chapterPdf = deck.getAttribute("data-quiz-pdf");
      var sectionPdf = deck.getAttribute("data-quiz-section-pdf");
      if ((chapterPdf || sectionPdf) && !$("[data-quiz-export]", deck)) {
        var group = document.createElement("div");
        group.className = "quiz-export-group";
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", isLq ? "Export LQ PDF" : "Export MC PDF");
        if (sectionPdf) {
          var sec = document.createElement("a");
          sec.className = "quiz-export";
          sec.setAttribute("data-quiz-export", isLq ? "lq" : "mc");
          sec.setAttribute("data-quiz-scope", "section");
          sec.href = sectionPdf;
          sec.target = "_blank";
          sec.rel = "noopener";
          sec.textContent = "This section";
          group.appendChild(sec);
        }
        if (chapterPdf && sectionPdf) group.appendChild(document.createTextNode(" \u00b7 "));
        if (chapterPdf) {
          var chap = document.createElement("a");
          chap.className = "quiz-export";
          chap.setAttribute("data-quiz-export", isLq ? "lq" : "mc");
          chap.setAttribute("data-quiz-scope", "chapter");
          chap.href = chapterPdf;
          chap.target = "_blank";
          chap.rel = "noopener";
          chap.textContent = "Whole chapter";
          group.appendChild(chap);
        }
        var head = $("header", deck);
        if (head) head.appendChild(group);
        else deck.insertBefore(group, deck.firstChild);
      } else if (deck.hasAttribute("data-quiz-scan-export") && !$("[data-quiz-export]", deck)) {
        var exp = document.createElement("button");
        exp.type = "button";
        exp.className = "quiz-export";
        exp.setAttribute("data-quiz-export", "true");
        exp.textContent = "Export PDF";
        exp.addEventListener("click", exportSectionPapers);
        var expHead = $("header", deck);
        if (expHead) expHead.appendChild(exp);
        else deck.insertBefore(exp, deck.firstChild);
      }

      var loLabel = $(".quiz-lo", deck);
      if (!loLabel) {
        loLabel = document.createElement("p");
        loLabel.className = "quiz-lo";
        slidesBox.insertBefore(loLabel, slidesBox.firstChild);
      }
      var loNum = document.createElement("b");
      loNum.className = "quiz-lo-num";
      var loText = document.createElement("span");
      loText.className = "quiz-lo-text";
      var paperId = document.createElement("span");
      paperId.className = "quiz-paper-id";
      paperId.setAttribute("aria-hidden", "true");
      loLabel.textContent = "";
      loLabel.appendChild(loNum);
      loLabel.appendChild(document.createTextNode(" "));
      loLabel.appendChild(loText);
      loLabel.appendChild(paperId);

      var dots = null;
      if (status && status.parentNode) {
        var wrap = document.createElement("div");
        wrap.className = "quiz-progress";
        status.parentNode.insertBefore(wrap, status);
        wrap.appendChild(status);
        dots = document.createElement("div");
        dots.className = "quiz-dots";
        dots.setAttribute("aria-hidden", "true");
        wrap.appendChild(dots);
      }

      function paintDots(current) {
        if (!dots) return;
        dots.textContent = "";
        dots.hidden = playlist.length < 2;
        playlist.forEach(function (item) {
          var dot = document.createElement("span");
          var result = item.slide.getAttribute("data-quiz-result");
          dot.className = "quiz-dot" +
            (item === current ? " is-current" : "") +
            (result ? " is-" + result : "");
          dots.appendChild(dot);
        });
      }

      function show() {
        if (!playlist.length) return;
        if (index < 0) index = playlist.length - 1;
        if (index >= playlist.length) index = 0;
        var current = playlist[index];
        slides.forEach(function (slide) {
          var on = slide === current.slide;
          slide.hidden = !on;
          if (on) slide.classList.add("is-current");
          else slide.classList.remove("is-current");
        });
        var desc = loTexts[current.primary - 1] || "";
        loNum.textContent = "LO " + current.primary;
        loText.textContent = desc;
        var cap = $("figcaption", current.slide);
        paperId.textContent = cap ? cap.textContent.trim() : "";
        if (status) status.textContent = (index + 1) + " of " + playlist.length;
        paintDots(current);
      }

      function markChoice(letterBtn) {
        var slide = letterBtn.closest(".quiz-slide");
        if (!slide || slide.getAttribute("data-quiz-marked")) return;
        var key = QUIZ_KEYS[slide.id];
        if (!key || !key.option) {
          /* No key for this paper, so the pick cannot be graded. Keep the
             student's letter and say so, rather than leaving a dead tile. */
          $all("[data-quiz-choice]", slide).forEach(function (b) {
            b.classList.toggle("is-picked", b === letterBtn);
          });
          var un = $(".quiz-pct", slide);
          if (un) {
            un.hidden = false;
            un.className = "quiz-pct is-unkeyed";
            un.textContent = "Answer key not available for this paper.";
          }
          return;
        }
        slide.setAttribute("data-quiz-marked", "true");
        var right = letterBtn.getAttribute("data-quiz-choice") === key.option;
        slide.setAttribute("data-quiz-result", right ? "right" : "wrong");
        $all("[data-quiz-choice]", slide).forEach(function (b) {
          var choice = b.getAttribute("data-quiz-choice");
          b.disabled = true;
          b.classList.remove("is-picked", "correct", "wrong");
          if (choice === key.option) b.classList.add("correct");
          else if (b === letterBtn) b.classList.add("wrong");
        });
        var out = $(".quiz-pct", slide);
        if (out) {
          out.hidden = false;
          out.className = "quiz-pct " + (right ? "is-right" : "is-wrong");
          out.textContent = "";
          var verdict = document.createElement("b");
          verdict.className = "quiz-verdict";
          verdict.textContent = right ? "Right." : ("Not quite. It is " + key.option + ".");
          out.appendChild(verdict);
          if (key.pct != null) {
            out.appendChild(document.createTextNode(" "));
            var stat = document.createElement("span");
            stat.className = "quiz-stat";
            stat.textContent = key.pct + "% got it";
            out.appendChild(stat);
          }
        }
        paintDots(playlist[index]);
      }

      deck.addEventListener("click", function (ev) {
        var prev = ev.target.closest("[data-quiz-prev]");
        var next = ev.target.closest("[data-quiz-next]");
        var letter = ev.target.closest("[data-quiz-choice]");
        if (prev) {
          ev.preventDefault();
          index -= 1;
          show();
          return;
        }
        if (next) {
          ev.preventDefault();
          index += 1;
          show();
          return;
        }
        if (letter && deck.contains(letter)) markChoice(letter);
      });
      show();
    });
  }

  function bootChecks() {
    numberChecks();
    initMc();
    initTf();
    initReveals();
    initQuizDecks();
    initNotesExport();
  }

  window.NotesQuiz = { sectionPapersHtml: sectionPapersHtml };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootChecks);
  } else {
    bootChecks();
  }
})();
