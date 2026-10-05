// Mock exam page: wires the setup panel, the plan, the exam and the result to
// the engine in mock-engine.js. All the hard logic lives there; this file only
// reads the DOM, so it can stay small enough to read in one sitting.
//
// Data comes from the same two files the question bank page uses:
//   ../qb/data/dse_mc.json        real Paper 1A items, with the recorded
//                                 percentage of candidates per option
//   ../qb/data/dse_sections.json  syllabus section names, grouped by book

import {
  BANDS,
  MAX_QUESTIONS,
  OPTIONS,
  durationSeconds,
  formatClock,
  gradePaper,
  planPaper,
  usableCounts,
} from "./mock-engine.js";

const STORE_KEY = "p2e-mock-paper-v1";
const CROPS = "../qb/crops/dse-mc/";

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const state = {
  items: [],
  sectionStats: [],
  sectionNames: {},
  counts: new Map(),
  topics: new Set(), // empty means every topic
  paper: null,
  answers: {},
  flags: new Set(),
  index: 0,
  result: null,
  seconds: null,
  endsAt: null,
  ticker: null,
};

// ---- data -------------------------------------------------------------------

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

async function load() {
  const [mc, sections] = await Promise.all([
    loadJSON("../qb/data/dse_mc.json"),
    loadJSON("../qb/data/dse_sections.json"),
  ]);
  state.items = mc.items;
  state.sectionStats = sections.stats;
  state.sectionNames = Object.fromEntries(sections.stats.map((s) => [s.number, s.name]));
  state.counts = usableCounts(state.items);
}

// ---- setup panel ------------------------------------------------------------

function renderTopics() {
  const host = $("topics");
  host.innerHTML = "";
  const byBook = new Map();
  for (const s of state.sectionStats) {
    if (!byBook.has(s.bookLabel)) byBook.set(s.bookLabel, []);
    byBook.get(s.bookLabel).push(s);
  }
  for (const [bookLabel, list] of byBook) {
    const block = document.createElement("div");
    block.className = "mk-book";
    const head = document.createElement("div");
    head.className = "mk-book-h";
    const available = list.reduce((n, s) => n + (state.counts.get(s.number) ?? 0), 0);
    head.innerHTML = `<b>${esc(bookLabel)}</b><span>${available} questions ready</span>`;
    block.appendChild(head);

    const chips = document.createElement("div");
    chips.className = "mk-topics";
    for (const s of list) {
      const n = state.counts.get(s.number) ?? 0;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mk-topic";
      b.dataset.section = String(s.number);
      b.dataset.empty = n === 0 ? "true" : "false";
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = `${esc(s.name)} <small>${n}</small>`;
      b.addEventListener("click", () => {
        if (state.topics.has(s.number)) state.topics.delete(s.number);
        else state.topics.add(s.number);
        syncTopics();
      });
      chips.appendChild(b);
    }
    block.appendChild(chips);
    host.appendChild(block);
  }
  syncTopics();
}

function syncTopics() {
  document.querySelectorAll(".mk-topic").forEach((b) => {
    b.setAttribute("aria-pressed", state.topics.has(Number(b.dataset.section)) ? "true" : "false");
  });
  const total = state.sectionStats.length;
  $("topic-summary").textContent = state.topics.size
    ? `${state.topics.size} of ${total} topics`
    : `All ${total} topics`;
}

function setupControls() {
  const count = $("count");
  const target = $("target");
  count.max = String(MAX_QUESTIONS);

  const onCount = () => {
    const n = Number(count.value);
    const expected = (Number(target.value) / 100) * n;
    $("count-val").textContent = `${n} question${n === 1 ? "" : "s"}`;
    $("target-hint").textContent =
      `A real cohort would score about ${target.value}% of ${n} question${n === 1 ? "" : "s"} — ` +
      `about ${Math.round(expected * 10) / 10} right.`;
  };
  const onTarget = () => {
    $("target-val").textContent = `${target.value}%`;
    onCount();
  };
  count.addEventListener("input", onCount);
  target.addEventListener("input", onTarget);
  onTarget();

  $("topics-all").addEventListener("click", () => { state.topics.clear(); syncTopics(); });
  $("new-seed").addEventListener("click", () => {
    $("seed").value = String(1 + Math.floor(Math.random() * 99999));
  });
  $("build").addEventListener("click", build);
}

// ---- plan -------------------------------------------------------------------

function tiles(rows) {
  return rows
    .map(
      (t) =>
        `<div class="mk-tile${t.tone ? ` mk-tile--${t.tone}` : ""}"><b>${esc(t.value)}</b><small>${esc(t.label)}</small></div>`
    )
    .join("");
}

function bandBar(counts, total) {
  if (!total) return "";
  const seg = BANDS.map((b) => {
    const n = counts[b.id] ?? 0;
    return n ? `<span class="${b.id}" style="width:${(n / total) * 100}%" title="${esc(b.label)}: ${n}"></span>` : "";
  }).join("");
  const legend = BANDS.map(
    (b) => `<span><i class="${b.id}"></i>${esc(b.label)} ${counts[b.id] ?? 0}</span>`
  ).join("");
  return `<div class="mk-band">${seg}</div><div class="mk-legend">${legend}</div>`;
}

function notesBlock(notes) {
  if (!notes || !notes.length) return "";
  return `<ul class="mk-notes">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`;
}

function build() {
  const err = $("setup-error");
  err.hidden = true;
  const button = $("build");
  button.disabled = true;
  button.textContent = "Building…";

  // The search takes a moment on a large paper; let the button repaint first.
  setTimeout(() => {
    try {
      const paper = planPaper({
        items: state.items,
        sectionNames: state.sectionNames,
        sections: [...state.topics],
        count: Number($("count").value),
        targetPercent: Number($("target").value),
        seed: $("seed").value || "1",
      });
      if (!paper.questions.length) {
        throw new Error(paper.notes[0] ?? "No questions match those settings.");
      }
      state.paper = paper;
      state.answers = {};
      state.flags = new Set();
      state.index = 0;
      state.result = null;
      state.seconds = durationSeconds(paper.count, $("minutes").value);
      renderPlan();
      show("plan");
      save();
    } catch (e) {
      err.textContent = e.message;
      err.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = "Build paper";
    }
  }, 20);
}

function renderPlan() {
  const p = state.paper;
  $("plan-code").textContent = `Paper ${p.seed}`;
  $("plan-tiles").innerHTML = tiles([
    { value: p.count, label: "questions" },
    { value: `${p.expectedPercent}%`, label: "expected score", tone: p.onTarget ? "ok" : "nudge" },
    { value: p.onTarget ? "on target" : `${p.offset > 0 ? "+" : ""}${p.offset} pts`, label: `you asked for ${p.targetPercent}%` },
    {
      value: state.seconds ? formatClock(state.seconds) : "No limit",
      label: "time limit",
    },
  ]);

  $("plan-notes-wrap").innerHTML = notesBlock(p.notes);
  $("plan-band-wrap").innerHTML = `<h3>How hard</h3>${bandBar(p.bandCounts, p.count)}`;
  const chips = p.sectionSpread
    .map((s) => `<span class="mk-topic" aria-pressed="false">${esc(s.name)} <small>${s.asked}</small></span>`)
    .join("");
  $("plan-topics-wrap").innerHTML = `<h3>Topics in this paper</h3><div class="mk-topics">${chips}</div>`;

  $("plan-list").innerHTML = p.questions
    .map(
      (q) => `<li>
        <span class="n">${q.seq}</span>
        <span class="t"><b>${esc(q.sectionName)}</b><span>${esc(q.label)} · ${esc(q.bandLabel)} · real exam pass rate ${q.passRate}%</span></span>
        <span class="mk-pct">${q.passRate}%<span class="mk-meter"><i style="width:${q.passRate}%"></i></span></span>
      </li>`
    )
    .join("");
}

// ---- exam -------------------------------------------------------------------

function start() {
  state.index = 0;
  state.result = null;
  state.endsAt = state.seconds ? Date.now() + state.seconds * 1000 : null;
  startTicker();
  renderQuestion();
  show("exam");
  save();
}

function startTicker() {
  stopTicker();
  if (!state.endsAt) return;
  const tick = () => {
    const left = Math.round((state.endsAt - Date.now()) / 1000);
    const el = $("timer");
    el.hidden = false;
    el.textContent = formatClock(left);
    el.dataset.low = left <= 60 ? "true" : "false";
    if (left <= 0) {
      stopTicker();
      el.textContent = "Time up";
      finish(true);
    }
  };
  tick(); // show the clock now, not one second from now
  state.ticker = setInterval(tick, 1000);
}

function stopTicker() {
  if (state.ticker) clearInterval(state.ticker);
  state.ticker = null;
}

function renderQuestion() {
  const p = state.paper;
  const q = p.questions[state.index];
  $("bar-q").textContent = `Question ${q.seq} of ${p.count}`;
  $("exam-h").textContent = `Question ${q.seq}`;
  $("q-img").src = `${CROPS}${q.image.split("/").pop()}`;
  $("q-img").alt = `Question ${q.seq}, ${q.year} Paper 1A question ${q.number}`;
  $("q-cap").textContent = `${q.year.toUpperCase()} Paper 1A question ${q.number} · ${q.sectionName}`;

  $("options").innerHTML = OPTIONS.map(
    (letter) =>
      `<button type="button" class="mk-opt" data-letter="${letter}" aria-pressed="${state.answers[q.id] === letter}">${letter}<small>Pick</small></button>`
  ).join("");
  $("options").querySelectorAll(".mk-opt").forEach((b) =>
    b.addEventListener("click", () => {
      state.answers[q.id] = b.dataset.letter;
      renderQuestion();
      save();
    })
  );

  $("answered-count").textContent = `${Object.keys(state.answers).length} of ${p.count} answered`;
  const pctDone = Math.round((Object.keys(state.answers).length / p.count) * 100);
  const bar = $("progress");
  bar.firstElementChild.style.width = `${pctDone}%`;
  bar.setAttribute("aria-valuenow", String(pctDone));
  $("flag").textContent = state.flags.has(q.id) ? "Flagged" : "Flag";
  $("flag").setAttribute("aria-pressed", state.flags.has(q.id) ? "true" : "false");
  $("prev").disabled = state.index === 0;
  $("next").textContent = state.index === p.count - 1 ? "Last question" : "Next";
  $("q-img").scrollIntoView({ block: "nearest" });
}

// ---- result -----------------------------------------------------------------

function finish(timedOut = false) {
  if (!state.paper) return;
  stopTicker();
  $("timer").hidden = true;
  state.result = gradePaper(state.paper, state.answers);
  renderResult(timedOut);
  show("result");
  save();
  window.scrollTo({ top: 0 });
}

function renderResult(timedOut) {
  const r = state.result;
  const p = state.paper;
  $("result-code").textContent = `Paper ${p.seed}`;
  const verdict = r.percent >= p.targetPercent ? "ok" : "nudge";
  $("result-tiles").innerHTML = tiles([
    { value: `${r.correct} / ${r.total}`, label: "correct", tone: verdict },
    { value: `${r.percent}%`, label: `you asked for ${p.targetPercent}%`, tone: verdict },
    { value: `${r.expectedPercent}%`, label: "real cohort on these questions" },
    { value: r.skipped ? `${r.skipped} left blank` : "none left blank", label: timedOut ? "time ran out" : "answers" },
  ]);

  $("result-band-wrap").innerHTML = `<h3>By difficulty</h3>${bandBar(countsOf(r.detail), r.total)}`;
  $("result-topic-wrap").innerHTML = `<h3>By topic</h3>${tableOf(r.byTopic)}`;

  $("review").innerHTML = r.detail
    .map((d) => {
      const pick = d.skipped ? "left blank" : `${d.given}`;
      const right = d.skipped ? "" : `Correct answer ${d.option}.`;
      return `<article class="mk-rv" data-right="${d.correct}">
        <div class="mk-rv-head">
          <span class="n p2n-num">${d.seq}</span>
          <b>${esc(d.sectionName)}</b>
          <span class="mk-verdict">${d.correct ? "Correct" : d.skipped ? "Skipped" : "Wrong"}</span>
          <span class="mk-bar-spacer"></span>
          <span class="mk-pct">You: ${esc(pick)}</span>
        </div>
        <div class="mk-rv-img"><img loading="lazy" src="${CROPS}${d.image.split("/").pop()}" alt="Question ${d.seq}"></div>
        <p class="mk-rv-meta">${esc(right)} ${esc(d.passRate)}% of candidates in the real exam got this one right, so it is ${esc(d.bandLabel.toLowerCase())}. ${esc(d.reason)}</p>
      </article>`;
    })
    .join("");
}

function countsOf(detail) {
  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const d of detail) counts[d.band]++;
  return counts;
}

function tableOf(rows) {
  return `<table class="mk-table">
    <thead><tr><th>Topic</th><th>Asked</th><th>Correct</th><th>Score</th></tr></thead>
    <tbody>${rows
      .map(
        (t) =>
          `<tr><td>${esc(t.name)}</td><td>${t.asked}</td><td>${t.correct}</td><td>${Math.round((t.correct / t.asked) * 100)}%</td></tr>`
      )
      .join("")}</tbody></table>`;
}

// ---- shell ------------------------------------------------------------------

function show(view) {
  for (const id of ["setup", "plan", "exam", "result"]) $(id).hidden = id !== view;
  if (view !== "exam") stopTicker();
}

function save() {
  if (!state.paper) return;
  try {
    sessionStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        paper: state.paper,
        answers: state.answers,
        flags: [...state.flags],
        index: state.index,
        seconds: state.seconds,
        endsAt: state.endsAt,
        settings: {
          count: $("count").value,
          target: $("target").value,
          minutes: $("minutes").value,
          seed: $("seed").value,
          topics: [...state.topics],
        },
      })
    );
  } catch {
    /* a full or blocked store must not break the paper */
  }
}

function restore() {
  let saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "null");
  } catch {
    return false;
  }
  if (!saved?.paper?.questions?.length) return false;
  state.paper = saved.paper;
  state.answers = saved.answers ?? {};
  state.flags = new Set(saved.flags ?? []);
  state.index = saved.index ?? 0;
  state.seconds = saved.seconds ?? null;
  state.endsAt = saved.endsAt ?? null;
  const s = saved.settings ?? {};
  if (s.count) $("count").value = s.count;
  if (s.target) $("target").value = s.target;
  if (s.seed) $("seed").value = s.seed;
  if (s.minutes != null) $("minutes").value = s.minutes;
  state.topics = new Set(s.topics ?? []);
  $("count").dispatchEvent(new Event("input"));
  $("target").dispatchEvent(new Event("input"));
  syncTopics();
  return true;
}

function wire() {
  $("start").addEventListener("click", start);
  $("submit").addEventListener("click", () => finish(false));
  $("plan-back").addEventListener("click", () => show("setup"));
  $("prev").addEventListener("click", () => {
    state.index = Math.max(0, state.index - 1);
    renderQuestion();
    save();
  });
  $("next").addEventListener("click", () => {
    state.index = Math.min(state.paper.count - 1, state.index + 1);
    renderQuestion();
    save();
  });
  $("flag").addEventListener("click", () => {
    const id = state.paper.questions[state.index].id;
    if (state.flags.has(id)) state.flags.delete(id);
    else state.flags.add(id);
    renderQuestion();
    save();
  });
  $("again").addEventListener("click", () => show("setup"));
  $("retry").addEventListener("click", () => {
    state.answers = {};
    state.flags = new Set();
    start();
  });
  document.addEventListener("keydown", (e) => {
    if ($("exam").hidden) return;
    if (e.target.matches("input, textarea")) return;
    const i = "1234".indexOf(e.key);
    if (i >= 0) {
      const b = $("options").querySelector(`[data-letter="${OPTIONS[i]}"]`);
      if (b) b.click();
      return;
    }
    if (e.key === "ArrowRight") $("next").click();
    if (e.key === "ArrowLeft") $("prev").click();
  });
}

async function init() {
  renderTopics();
  setupControls();
  wire();
  try {
    await load();
  } catch (e) {
    const err = $("setup-error");
    err.textContent = `Could not load the question bank. Serve this page over http (python3 -m http.server) and reload. ${e.message}`;
    err.hidden = false;
    $("build").disabled = true;
    return;
  }
  renderTopics(); // counts only exist once the bank has loaded
  if (restore()) {
    renderPlan();
    show("plan");
  }
}

init();