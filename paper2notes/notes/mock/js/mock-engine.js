// Mock exam engine: difficulty estimates and paper selection.
//
// Every item is a real HKDSE Physics Paper 1A multiple-choice question. The
// pipeline recorded, for each one, the percentage of candidates in the real
// exam who chose the correct option (`answer.percentage` in dse_mc.json).
// That recorded pass rate is the difficulty estimate: our questions are
// rewritten from those real questions, so the real cohort's pass rate says
// how hard our rewrite is too.
//
// A paper is then built to a target. The teacher says how many questions to
// include and what percentage they expect the student to score. The engine
// picks questions whose estimated pass rates average to that target, while
// spreading them over topics and years so the paper is not one narrow run of
// questions.
//
// This module is pure: no DOM, no fetch. The UI in mock-app.js imports it and
// so does mock-engine.test.mjs.

// The four option letters an HKDSE Physics multiple-choice question uses.
export const OPTIONS = ["A", "B", "C", "D"];

// Difficulty bands, cut on the recorded pass rate. The thresholds sit at the
// quartiles of the real cohort data (about 46%, 58% and 67% for this bank).
export const BANDS = [
  { id: "easy", label: "Easy", from: 70, blurb: "70% or more of candidates got it right" },
  { id: "medium", label: "Medium", from: 45, blurb: "45% to 69% got it right" },
  { id: "hard", label: "Hard", from: 0, blurb: "Under 45% got it right" },
];

export const MAX_QUESTIONS = 60;
export const MIN_TARGET = 10;
export const MAX_TARGET = 90;
const TARGET_TOLERANCE = 2.5; // percentage points
// Weights for the spread terms. The miss from the target is compared first,
// so these only break ties between sets with the same miss; they can never
// drag the paper off target.
const TOPIC_SPREAD = 0.9; // per squared question of topic over-share
const YEAR_SPREAD = 0.35; // per squared repeat of one year
const SEARCH_ROUNDS = 6;
const SEARCH_WINDOW = 140; // candidates examined per position per round

export function clamp(value, low, high) {
  return Math.min(high, Math.max(low, value));
}

/** The band a recorded pass rate falls into. */
export function bandOf(passRate) {
  return BANDS.find((b) => passRate >= b.from) ?? BANDS[BANDS.length - 1];
}

/**
 * Estimate a question's difficulty from the recorded percentage of candidates
 * who chose the correct option on the real exam question. A pass rate of 58%
 * means most of a real cohort got it right, so our rewrite is a medium
 * question worth about 42 difficulty points.
 */
export function estimateDifficulty(passRate) {
  if (typeof passRate !== "number" || !Number.isFinite(passRate)) return null;
  const pct = clamp(Math.round(passRate), 0, 100);
  const band = bandOf(pct);
  return { passRate: pct, difficulty: 100 - pct, band: band.id, bandLabel: band.label };
}

/** An item can sit in a mock paper only if it is answerable and scorable. */
export function isUsable(item) {
  if (!item || item.type !== "mc") return false;
  if (!item.hasCrop || !item.image) return false;
  if (item.uncertain) return false;
  const answer = item.answer || {};
  if (answer.deleted) return false;
  if (!OPTIONS.includes(answer.correctOption)) return false;
  return estimateDifficulty(answer.percentage) !== null;
}

/** Why an item cannot sit in a paper, for the setup panel's tally. */
export function rejectionReason(item) {
  if (!item || item.type !== "mc") return "not multiple choice";
  if (item.answer && item.answer.deleted) return "deleted from the exam";
  if (item.uncertain) return "topic classification uncertain";
  if (!OPTIONS.includes(item.answer?.correctOption)) return "no answer key";
  if (estimateDifficulty(item.answer?.percentage) === null) return "no recorded pass rate";
  if (!item.hasCrop || !item.image) return "no question crop";
  return null;
}

/** Usable-item count per syllabus section, so the picker never over-promises. */
export function usableCounts(items) {
  const counts = new Map();
  for (const item of items) {
    if (!isUsable(item)) continue;
    for (const section of item.sections) {
      counts.set(section, (counts.get(section) ?? 0) + 1);
    }
  }
  return counts;
}

// ---- deterministic randomness ---------------------------------------------

export function hashString(text) {
  let h = 2166136261 >>> 0;
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: small, fast, and the same seed always gives the same paper. */
export function makeRng(seed) {
  let a = hashString(seed);
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- paper planning ---------------------------------------------------------

function primarySection(item) {
  return item.sections.length ? item.sections[0] : 0;
}

/** Best achievable expected score for a pool, as a percentage. */
export function achievableRange(pool) {
  if (!pool.length) return { lowest: 0, highest: 0 };
  const rates = pool.map((it) => it.answer.percentage);
  return { lowest: Math.min(...rates), highest: Math.max(...rates) };
}

/**
 * Score of a candidate set, in two parts. `miss` is how far its mean recorded
 * pass rate sits from the target; `spread` penalises piling onto few topics or
 * few years. Compare with `isBetter`: the miss is checked first, so the spread
 * only separates sets that tie on the target.
 */
function scoreSet(set, target, idealTopics) {
  let sum = 0;
  const topics = new Map();
  const years = new Map();
  for (const item of set) {
    sum += item.answer.percentage;
    const section = primarySection(item);
    topics.set(section, (topics.get(section) ?? 0) + 1);
    years.set(item.year, (years.get(item.year) ?? 0) + 1);
  }
  let topicCost = 0;
  for (const [section, want] of idealTopics) {
    const got = topics.get(section) ?? 0;
    topicCost += (got - want) ** 2;
  }
  let yearCost = 0;
  for (const count of years.values()) yearCost += count * count;
  return {
    miss: Math.abs(sum / set.length - target),
    spread: TOPIC_SPREAD * topicCost + YEAR_SPREAD * yearCost,
    sum,
  };
}

/** True when set `a` beats set `b`: the target miss dominates the spread. */
function isBetter(a, b) {
  if (a.miss < b.miss - 1e-9) return true;
  if (a.miss > b.miss + 1e-9) return false;
  return a.spread < b.spread - 1e-9;
}

function ring(list, start, len) {
  const out = [];
  for (let i = 0; i < len && i < list.length; i++) out.push(list[(start + i) % list.length]);
  return out;
}

/**
 * Build a paper.
 *
 * Picks `count` questions whose recorded pass rates average to `targetPercent`.
 * It starts from a seeded shuffle of the pool and then hill-climbs: it swaps
 * one question at a time, keeping the swap that most reduces the paper's cost
 * (see scoreSet). Scoring the whole set each time, instead of each new pick in
 * turn, is what holds the paper on target to the end. Every round sweeps a
 * different slice of the pool, and a final sweep looks at all of it, so the
 * search is not blind to a question the seed happened to bury.
 *
 * The same seed always returns the same paper, so a teacher can hand the same
 * link to a class.
 *
 * Returns the questions plus the numbers the teacher needs to judge the paper:
 * the expected score, how far it landed from the target, the band and topic
 * spread, and what it had to leave out.
 */
export function planPaper({
  items,
  sectionNames = {},
  sections = [],
  count = 10,
  targetPercent = 60,
  seed = "p2e",
}) {
  const wanted = clamp(Math.round(count) || 0, 0, MAX_QUESTIONS);
  const target = clamp(Math.round(targetPercent), MIN_TARGET, MAX_TARGET);
  const picked = new Set((sections ?? []).map(Number).filter((n) => Number.isInteger(n)));

  const pool = [];
  for (const item of items) {
    if (rejectionReason(item)) continue;
    if (picked.size && !item.sections.some((s) => picked.has(Number(s)))) continue;
    pool.push(item);
  }

  const size = Math.min(wanted, pool.length);
  const range = achievableRange(pool);
  const notes = [];

  if (wanted > 0 && pool.length === 0) {
    return {
      seed, targetPercent: target, requested: wanted, count: 0,
      expectedPercent: null, expectedCorrect: 0, onTarget: false, offset: null,
      questions: [], bandCounts: { easy: 0, medium: 0, hard: 0 }, sectionSpread: [],
      poolSize: 0, achievable: range,
      notes: ["No question matches those topics with a recorded pass rate and a crop."],
    };
  }
  if (size < wanted) {
    notes.push(`${pool.length} question${pool.length === 1 ? "" : "s"} match those topics with a recorded pass rate. I built a ${size}-question paper.`);
  }

  let expectedPercent = null;
  let onTarget = false;
  let offset = null;
  let unreachable = null;
  if (size > 0) {
    expectedPercent = clamp(Math.round(targetPercent), MIN_TARGET, MAX_TARGET);
    if (target > range.highest && size === pool.length) unreachable = "high";
    else if (target < range.lowest && size === pool.length) unreachable = "low";
  }

  // An even share per topic the teacher can reach. Topics with no usable
  // questions are left out of the ideal so they cannot skew the cost.
  const poolTopics = new Set(pool.map(primarySection));
  const idealTopics = new Map();
  if (poolTopics.size) {
    const share = size / poolTopics.size;
    for (const section of poolTopics) idealTopics.set(section, share);
  }

  const rng = makeRng(seed);
  const jitter = new Map(pool.map((item) => [item.id, rng()]));
  const ordered = pool
    .slice()
    .sort((a, b) => jitter.get(a.id) - jitter.get(b.id) || a.id.localeCompare(b.id));

  const chosen = ordered.slice(0, size);
  const ids = new Set(chosen.map((item) => item.id));
  let best = scoreSet(chosen, expectedPercent, idealTopics);

  const sweep = (start, len) => {
    for (let i = 0; i < chosen.length; i++) {
      const outgoing = chosen[i];
      let swapIn = null;
      let swapScore = best;
      for (const candidate of ring(ordered, start, len)) {
        if (candidate !== outgoing && ids.has(candidate.id)) continue;
        chosen[i] = candidate;
        const scored = scoreSet(chosen, expectedPercent, idealTopics);
        if (isBetter(scored, swapScore)) {
          swapScore = scored;
          swapIn = candidate;
        }
      }
      chosen[i] = swapIn ?? outgoing;
      if (swapIn) {
        ids.delete(outgoing.id);
        ids.add(swapIn.id);
        best = swapScore;
      }
    }
  };

  for (let round = 0; round < SEARCH_ROUNDS; round++) {
    const before = best;
    sweep((round * SEARCH_WINDOW) % ordered.length, SEARCH_WINDOW);
    if (!isBetter(best, before)) break;
  }
  sweep(0, ordered.length); // final look at the whole pool
  const sum = best.sum;

  // Exam order: syllabus section, then easiest first inside the section, so
  // the paper reads like a real paper and a teacher can see the shape of it.
  chosen.sort((a, b) => {
    const sa = primarySection(a);
    const sb = primarySection(b);
    if (sa !== sb) return sa - sb;
    return b.answer.percentage - a.answer.percentage || a.id.localeCompare(b.id);
  });

  const questions = chosen.map((item, index) => {
    const d = estimateDifficulty(item.answer.percentage);
    return {
      id: item.id,
      seq: index + 1,
      year: item.year,
      number: item.question,
      label: `${String(item.year).toUpperCase()} Q${item.question}`,
      option: item.answer.correctOption,
      image: item.image,
      sections: item.sections.slice(),
      sectionName: sectionNames[item.sections[0]] ?? item.sectionNames?.[0] ?? `§${item.sections[0] ?? "?"}`,
      reason: item.reason ?? "",
      passRate: d.passRate,
      difficulty: d.difficulty,
      band: d.band,
      bandLabel: d.bandLabel,
    };
  });

  const bandCounts = { easy: 0, medium: 0, hard: 0 };
  // Coverage, not a partition: one question can sit under two topics, so it is
  // counted under each. The result screen splits by primary topic instead, so
  // the scores there still add up to the paper.
  const spread = new Map();
  for (const q of questions) {
    bandCounts[q.band]++;
    for (const section of q.sections.length ? q.sections : [0]) {
      spread.set(section, (spread.get(section) ?? 0) + 1);
    }
  }

  const realised = size ? sum / size : null;
  onTarget = realised !== null && Math.abs(realised - expectedPercent) <= TARGET_TOLERANCE;

  if (realised !== null && unreachable === "high") {
    notes.push(`Every question left scores at most ${range.highest}% in the real exam, so ${expectedPercent}% is out of reach for this pool. This paper expects ${Math.round(realised)}%.`);
  } else if (realised !== null && unreachable === "low") {
    notes.push(`Every question left scores at least ${range.lowest}% in the real exam, so ${expectedPercent}% is out of reach for this pool. This paper expects ${Math.round(realised)}%.`);
  } else if (realised !== null && !onTarget) {
    notes.push(`The pool cannot hit ${expectedPercent}% exactly. This paper expects ${Math.round(realised)}%.`);
  }

  return {
    seed,
    targetPercent: expectedPercent,
    requested: wanted,
    count: questions.length,
    expectedPercent: realised === null ? null : Math.round(realised * 10) / 10,
    expectedCorrect: Math.round(sum) / 100,
    onTarget,
    offset: realised === null ? null : Math.round((realised - expectedPercent) * 10) / 10,
    questions,
    bandCounts,
    sectionSpread: [...spread.entries()]
      .map(([number, asked]) => ({ number, asked, name: sectionNames[number] ?? `§${number}` }))
      .sort((a, b) => a.number - b.number),
    poolSize: pool.length,
    achievable: range,
    notes,
  };
}

// ---- marking ----------------------------------------------------------------

/**
 * Mark a finished paper. `answers` maps a question id to the option the
 * student chose. The paper also reports what a real cohort scored on the same
 * questions, so the student sees whether they beat the real exam.
 */
export function gradePaper(paper, answers = {}) {
  const detail = paper.questions.map((q) => {
    const given = answers[q.id] ?? null;
    const correct = given === q.option;
    return { ...q, given, correct, skipped: given === null };
  });

  const correct = detail.filter((d) => d.correct).length;
  const answered = detail.filter((d) => !d.skipped).length;
  const byBand = {};
  for (const band of BANDS) byBand[band.id] = { label: band.label, asked: 0, correct: 0 };
  const byTopic = new Map();
  for (const row of detail) {
    byBand[row.band].asked++;
    if (row.correct) byBand[row.band].correct++;
    const key = row.sections[0] ?? 0;
    if (!byTopic.has(key)) byTopic.set(key, { number: key, name: row.sectionName, asked: 0, correct: 0 });
    const topic = byTopic.get(key);
    topic.asked++;
    if (row.correct) topic.correct++;
  }

  const total = detail.length;
  return {
    total,
    answered,
    correct,
    skipped: total - answered,
    percent: total ? Math.round((correct / total) * 100) : 0,
    expectedPercent: paper.expectedPercent,
    beatRealCohort: correct > (paper.expectedCorrect ?? 0),
    byBand,
    byTopic: [...byTopic.values()].sort((a, b) => a.number - b.number),
    detail,
  };
}

/** A countdown in whole seconds, or null when the paper is untimed. */
export function durationSeconds(count, minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return null;
  return Math.round(m * 60);
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}