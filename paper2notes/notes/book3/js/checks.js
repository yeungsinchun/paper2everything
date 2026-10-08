/* Concept checks shared by every Book 3 page (copied from Book 5; only the key tables differ).
   Markup contract:
   - .check[data-check="mc"][data-answer="B"] > .choices > button[data-choice] ; .feedback ; .explain[hidden]
   - .check[data-check="tf"] > .tf-item[data-answer="true|false"] > button[data-tf] ; .feedback ; .explain[hidden]
   - .check[data-check="sa"] > button[data-reveal] ; .model[hidden]
   After the student answers, the explanation is shown so every check teaches the reasoning. */
(function () {
  "use strict";

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

  function initSa() {
    $all("[data-check='sa']").forEach(function (box) {
      var btn = $("button[data-reveal]", box);
      var model = $(".model", box);
      if (!btn || !model) return;
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        var open = model.hidden;
        model.hidden = !open;
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "Hide answer" : "Show answer";
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

  var PAPER_LOS = {"dse-mc-2018-14": ["realise waves as transmitting energy without transferring matter"], "dse-mc-2021-10": ["realise waves as transmitting energy without transferring matter"], "dse-mc-2021-12": ["distinguish between transverse and longitudinal waves"], "dse-mc-2023-15": ["distinguish between transverse and longitudinal waves"], "dse-mc-2016-16": ["apply \( f = \frac{1}{T} \) and \( v = f\lambda \) to solve problems"], "dse-mc-2023-14": ["apply \( f = \frac{1}{T} \) and \( v = f\lambda \) to solve problems"], "dse-mc-2020-16": ["determine factors affecting the speed of propagation of waves along stretched strings or springs"], "dse-mc-2019-18": ["determine factors affecting the speed of propagation of waves along stretched strings or springs"], "dse-mc-2022-16": ["determine factors affecting the speed of propagation of waves along stretched strings or springs"], "dse-mc-2014-14": ["describe wave motion in terms of waveform, crest, trough, compression, rarefaction, wavefront, phase, displacement, amplitude, period, frequency, wavelength and wave speed"], "dse-mc-2016-15": ["describe wave motion in terms of waveform, crest, trough, compression, rarefaction, wavefront, phase, displacement, amplitude, period, frequency, wavelength and wave speed"], "dse-mc-2013-16": ["apply \( f = \frac{1}{T} \) and \( v = f\lambda \) to solve problems"], "dse-mc-2012-15": ["describe wave motion in terms of waveform, crest, trough, compression, rarefaction, wavefront, phase, displacement, amplitude, period, frequency, wavelength and wave speed"], "dse-mc-2015-12": ["apply \( f = \frac{1}{T} \) and \( v = f\lambda \) to solve problems"], "dse-mc-2013-17": ["describe wave motion in terms of waveform, crest, trough, compression, rarefaction, wavefront, phase, displacement, amplitude, period, frequency, wavelength and wave speed"], "dse-mc-2017-14": ["describe wave motion in terms of waveform, crest, trough, compression, rarefaction, wavefront, phase, displacement, amplitude, period, frequency, wavelength and wave speed"], "dse-mc-2019-14": ["present information on displacement-time and displacement-distance graphs for travelling waves"], "dse-mc-2020-11": ["apply \( f = \frac{1}{T} \) and \( v = f\lambda \) to solve problems"], "dse-mc-pp-17": ["describe wave motion in terms of waveform, crest, trough, compression, rarefaction, wavefront, phase, displacement, amplitude, period, frequency, wavelength and wave speed"], "dse-mc-2026-15": ["describe wave motion in terms of waveform, crest, trough, compression, rarefaction, wavefront, phase, displacement, amplitude, period, frequency, wavelength and wave speed"], "dse-mc-2021-11": ["present information on displacement-time and displacement-distance graphs for travelling waves"], "dse-mc-2018-15": ["present information on displacement-time and displacement-distance graphs for travelling waves"], "dse-mc-2020-12": ["present information on displacement-time and displacement-distance graphs for travelling waves"], "dse-mc-2022-15": ["apply \( f = \frac{1}{T} \) and \( v = f\lambda \) to solve problems"], "dse-mc-2024-16": ["apply \( f = \frac{1}{T} \) and \( v = f\lambda \) to solve problems"], "dse-mc-2025-15": ["present information on displacement-time and displacement-distance graphs for travelling waves"], "dse-lq-2017-6": ["present information on displacement-time and displacement-distance graphs for travelling waves"]};
  var QUIZ_KEYS = {
  "dse-mc-2018-14": {
    "option": "D",
    "pct": 72
  },
  "dse-mc-2021-10": {
    "option": "C",
    "pct": 75
  },
  "dse-mc-2021-12": {
    "option": "C",
    "pct": 68
  },
  "dse-mc-2023-15": {
    "option": "D",
    "pct": 50
  },
  "dse-mc-2016-16": {
    "option": "C",
    "pct": 74
  },
  "dse-mc-2023-14": {
    "option": "C",
    "pct": 88
  },
  "dse-mc-2020-16": {
    "option": "A",
    "pct": 45
  },
  "dse-mc-2019-18": {
    "option": "A",
    "pct": 68
  },
  "dse-mc-2022-16": {
    "option": "C",
    "pct": 71
  },
  "dse-mc-2014-14": {
    "option": "A",
    "pct": 80
  },
  "dse-mc-2016-15": {
    "option": "B",
    "pct": 79
  },
  "dse-mc-2013-16": {
    "option": "B",
    "pct": 71
  },
  "dse-mc-2012-15": {
    "option": "B",
    "pct": 73
  },
  "dse-mc-2015-12": {
    "option": "A",
    "pct": 61
  },
  "dse-mc-2013-17": {
    "option": "A",
    "pct": 63
  },
  "dse-mc-2017-14": {
    "option": "A",
    "pct": 54
  },
  "dse-mc-2019-14": {
    "option": "C",
    "pct": 35
  },
  "dse-mc-2020-11": {
    "option": "D",
    "pct": 59
  },
  "dse-mc-2026-15": {
    "option": "C"
  },
  "dse-mc-2021-11": {
    "option": "B",
    "pct": 85
  },
  "dse-mc-2018-15": {
    "option": "C",
    "pct": 32
  },
  "dse-mc-2020-12": {
    "option": "C",
    "pct": 45
  },
  "dse-mc-2022-15": {
    "option": "B",
    "pct": 70
  },
  "dse-mc-2024-16": {
    "option": "D",
    "pct": 52
  },
  "dse-mc-2025-15": {
    "option": "B",
    "pct": 58
  },
  "dse-mc-2012-16": {
    "option": "D",
    "pct": 77
  },
  "dse-mc-2012-17": {
    "option": "B",
    "pct": 78
  },
  "dse-mc-2012-18": {
    "option": "D",
    "pct": 62
  },
  "dse-mc-2012-19": {
    "option": "A",
    "pct": 76
  },
  "dse-mc-2012-20": {
    "option": "A",
    "pct": 65
  },
  "dse-mc-2012-21": {
    "option": "A",
    "pct": 40
  },
  "dse-mc-2012-22": {
    "option": "D",
    "pct": 54
  },
  "dse-mc-2012-23": {
    "option": "C",
    "pct": 61
  },
  "dse-mc-2013-18": {
    "option": "D",
    "pct": 52
  },
  "dse-mc-2013-19": {
    "option": "C",
    "pct": 53
  },
  "dse-mc-2013-20": {
    "option": "C",
    "pct": 64
  },
  "dse-mc-2013-21": {
    "option": "A",
    "pct": 56
  },
  "dse-mc-2013-22": {
    "option": "C",
    "pct": 40
  },
  "dse-mc-2013-23": {
    "option": "A",
    "pct": 46
  },
  "dse-mc-2014-13": {
    "option": "B",
    "pct": 74
  },
  "dse-mc-2014-15": {
    "option": "C",
    "pct": 78
  },
  "dse-mc-2014-16": {
    "option": "A",
    "pct": 76
  },
  "dse-mc-2014-17": {
    "option": "B",
    "pct": 53
  },
  "dse-mc-2014-18": {
    "option": "C",
    "pct": 41
  },
  "dse-mc-2014-19": {
    "option": "A",
    "pct": 76
  },
  "dse-mc-2015-13": {
    "option": "A",
    "pct": 66
  },
  "dse-mc-2015-14": {
    "option": "D",
    "pct": 41
  },
  "dse-mc-2015-15": {
    "option": "B",
    "pct": 58
  },
  "dse-mc-2015-16": {
    "option": "D",
    "pct": 50
  },
  "dse-mc-2015-17": {
    "option": "A",
    "pct": 45
  },
  "dse-mc-2015-18": {
    "option": "D",
    "pct": 61
  },
  "dse-mc-2015-19": {
    "option": "C",
    "pct": 54
  },
  "dse-mc-2015-20": {
    "option": "A",
    "pct": 39
  },
  "dse-mc-2016-17": {
    "option": "B",
    "pct": 48
  },
  "dse-mc-2016-18": {
    "option": "D",
    "pct": 49
  },
  "dse-mc-2016-19": {
    "option": "D",
    "pct": 62
  },
  "dse-mc-2016-20": {
    "option": "D",
    "pct": 59
  },
  "dse-mc-2016-21": {
    "option": "A",
    "pct": 45
  },
  "dse-mc-2016-22": {
    "option": "C",
    "pct": 41
  },
  "dse-mc-2016-23": {
    "option": "C"
  },
  "dse-mc-2017-15": {
    "option": "D",
    "pct": 61
  },
  "dse-mc-2017-16": {
    "option": "C",
    "pct": 77
  },
  "dse-mc-2017-17": {
    "option": "B",
    "pct": 42
  },
  "dse-mc-2017-18": {
    "option": "D",
    "pct": 73
  },
  "dse-mc-2017-19": {
    "option": "D",
    "pct": 51
  },
  "dse-mc-2017-20": {
    "option": "B",
    "pct": 63
  },
  "dse-mc-2017-21": {
    "option": "C",
    "pct": 66
  },
  "dse-mc-2018-16": {
    "option": "B",
    "pct": 51
  },
  "dse-mc-2018-17": {
    "option": "D",
    "pct": 81
  },
  "dse-mc-2018-18": {
    "option": "C",
    "pct": 73
  },
  "dse-mc-2018-19": {
    "option": "B",
    "pct": 62
  },
  "dse-mc-2018-20": {
    "option": "D",
    "pct": 87
  },
  "dse-mc-2018-21": {
    "option": "C",
    "pct": 39
  },
  "dse-mc-2019-15": {
    "option": "A",
    "pct": 76
  },
  "dse-mc-2019-16": {
    "option": "C",
    "pct": 56
  },
  "dse-mc-2019-17": {
    "option": "B",
    "pct": 50
  },
  "dse-mc-2019-19": {
    "option": "D",
    "pct": 54
  },
  "dse-mc-2019-20": {
    "option": "A",
    "pct": 65
  },
  "dse-mc-2019-21": {
    "option": "D",
    "pct": 68
  },
  "dse-mc-2019-22": {
    "option": "A",
    "pct": 70
  },
  "dse-mc-2020-13": {
    "option": "C",
    "pct": 67
  },
  "dse-mc-2020-14": {
    "option": "A",
    "pct": 70
  },
  "dse-mc-2020-15": {
    "option": "C",
    "pct": 52
  },
  "dse-mc-2020-17": {
    "option": "D",
    "pct": 41
  },
  "dse-mc-2020-18": {
    "option": "A",
    "pct": 45
  },
  "dse-mc-2020-19": {
    "option": "B",
    "pct": 49
  },
  "dse-mc-2020-20": {
    "option": "B",
    "pct": 31
  },
  "dse-mc-2020-21": {
    "option": "A",
    "pct": 75
  },
  "dse-mc-2021-13": {
    "option": "B",
    "pct": 63
  },
  "dse-mc-2021-14": {
    "option": "D",
    "pct": 47
  },
  "dse-mc-2021-15": {
    "option": "B",
    "pct": 61
  },
  "dse-mc-2021-16": {
    "option": "B",
    "pct": 63
  },
  "dse-mc-2021-17": {
    "option": "D"
  },
  "dse-mc-2021-18": {
    "option": "C",
    "pct": 56
  },
  "dse-mc-2021-19": {
    "option": "A",
    "pct": 56
  },
  "dse-mc-2021-20": {
    "option": "C",
    "pct": 33
  },
  "dse-mc-2022-17": {
    "option": "D",
    "pct": 67
  },
  "dse-mc-2022-18": {
    "option": "B",
    "pct": 63
  },
  "dse-mc-2022-19": {
    "option": "C",
    "pct": 55
  },
  "dse-mc-2022-20": {
    "option": "A",
    "pct": 72
  },
  "dse-mc-2022-21": {
    "option": "C",
    "pct": 44
  },
  "dse-mc-2022-22": {
    "option": "D",
    "pct": 64
  },
  "dse-mc-2023-16": {
    "option": "B",
    "pct": 61
  },
  "dse-mc-2023-17": {
    "option": "A",
    "pct": 71
  },
  "dse-mc-2023-18": {
    "option": "B",
    "pct": 64
  },
  "dse-mc-2023-19": {
    "option": "A",
    "pct": 67
  },
  "dse-mc-2023-20": {
    "option": "A",
    "pct": 79
  },
  "dse-mc-2023-21": {
    "option": "A",
    "pct": 65
  },
  "dse-mc-2023-22": {
    "option": "D",
    "pct": 60
  },
  "dse-mc-2024-14": {
    "option": "A",
    "pct": 44
  },
  "dse-mc-2024-15": {
    "option": "D",
    "pct": 58
  },
  "dse-mc-2024-17": {
    "option": "C",
    "pct": 55
  },
  "dse-mc-2024-18": {
    "option": "D",
    "pct": 63
  },
  "dse-mc-2024-19": {
    "option": "A",
    "pct": 45
  },
  "dse-mc-2024-20": {
    "option": "D",
    "pct": 53
  },
  "dse-mc-2024-21": {
    "option": "B",
    "pct": 90
  },
  "dse-mc-2024-22": {
    "option": "B"
  },
  "dse-mc-2025-13": {
    "option": "B",
    "pct": 25
  },
  "dse-mc-2025-14": {
    "option": "D",
    "pct": 50
  },
  "dse-mc-2025-16": {
    "option": "B",
    "pct": 66
  },
  "dse-mc-2025-17": {
    "option": "A",
    "pct": 64
  },
  "dse-mc-2025-18": {
    "option": "D",
    "pct": 37
  },
  "dse-mc-2025-19": {
    "option": "C",
    "pct": 67
  },
  "dse-mc-2025-20": {
    "option": "D",
    "pct": 46
  },
  "dse-mc-2025-21": {
    "option": "C",
    "pct": 62
  },
  "dse-mc-2026-13": {
    "option": "A"
  },
  "dse-mc-2026-14": {
    "option": "C"
  },
  "dse-mc-2026-16": {
    "option": "B"
  },
  "dse-mc-2026-18": {
    "option": "A"
  },
  "dse-mc-2026-19": {
    "option": "D"
  },
  "dse-mc-2026-20": {
    "option": "A"
  },
  "dse-mc-pp-16": {
    "option": "D"
  },
  "dse-mc-pp-18": {
    "option": "C"
  },
  "dse-mc-pp-19": {
    "option": "B"
  },
  "dse-mc-pp-20": {
    "option": "D"
  },
  "dse-mc-pp-21": {
    "option": "D"
  },
  "dse-mc-pp-22": {
    "option": "C"
  },
  "dse-mc-pp-23": {
    "option": "B"
  }
};

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
    initSa();
    initQuizDecks();
    initNotesExport();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootChecks);
  } else {
    bootChecks();
  }
})();
