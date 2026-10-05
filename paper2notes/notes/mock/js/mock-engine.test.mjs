// Tests for the mock exam engine. Pure logic, so plain `node --test` covers it.
//   node --test paper2notes/notes/mock/js/mock-engine.test.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BANDS,
  MAX_QUESTIONS,
  bandOf,
  durationSeconds,
  estimateDifficulty,
  formatClock,
  gradePaper,
  isUsable,
  planPaper,
  rejectionReason,
  usableCounts,
} from "./mock-engine.js";

const here = dirname(fileURLToPath(import.meta.url));
const notesDir = resolve(here, "../..");
const bank = JSON.parse(readFileSync(resolve(notesDir, "qb/data/dse_mc.json"), "utf8"));

/** Build a synthetic item with sensible defaults. */
function item(id, pct, over = {}) {
  return {
    id,
    year: "2018",
    question: 1,
    paper: "1A",
    type: "mc",
    sections: [5],
    sectionNames: ["Motion"],
    reason: "reason",
    uncertain: false,
    statementPreview: "",
    answer: { correctOption: "A", percentage: pct, deleted: false },
    image: `crops/dse-mc/${id}.webp`,
    hasCrop: true,
    warnings: [],
    marks: 1,
    ...over,
  };
}

describe("estimateDifficulty", () => {
  test("turns the recorded pass rate into a difficulty and a band", () => {
    assert.deepEqual(estimateDifficulty(58), { passRate: 58, difficulty: 42, band: "medium", bandLabel: "Medium" });
  });

  test("puts the band boundaries where the labels say", () => {
    assert.equal(bandOf(70).id, "easy");
    assert.equal(bandOf(69).id, "medium");
    assert.equal(bandOf(45).id, "medium");
    assert.equal(bandOf(44).id, "hard");
  });

  test("returns null when no pass rate was recorded", () => {
    assert.equal(estimateDifficulty(null), null);
    assert.equal(estimateDifficulty(undefined), null);
    assert.equal(estimateDifficulty(NaN), null);
  });
});

describe("isUsable", () => {
  test("accepts a real bank item with a crop, a key and a pass rate", () => {
    assert.equal(isUsable(item("t1", 50)), true);
  });

  test("rejects an item the student could not be scored on", () => {
    assert.equal(isUsable(item("t2", 50, { hasCrop: false })), false);
    assert.equal(isUsable(item("t3", 50, { answer: { correctOption: null, percentage: 50, deleted: false } })), false);
    assert.equal(isUsable(item("t4", 50, { answer: { correctOption: "A", percentage: null, deleted: false } })), false);
    assert.equal(isUsable(item("t5", 50, { answer: { correctOption: "A", percentage: 50, deleted: true } })), false);
    assert.equal(isUsable(item("t6", 50, { uncertain: true })), false);
    assert.equal(isUsable(item("t7", 50, { type: "lq" })), false);
  });

  test("names the reason for every rejection it makes", () => {
    assert.equal(rejectionReason(item("t", 50, { hasCrop: false })), "no question crop");
    assert.equal(rejectionReason(item("t", 50, { uncertain: true })), "topic classification uncertain");
    assert.equal(rejectionReason(item("t", 50, { answer: { correctOption: null, percentage: 5, deleted: false } })), "no answer key");
    assert.equal(rejectionReason(item("t", null)), "no recorded pass rate");
    assert.equal(rejectionReason(item("t", 50)), null);
  });
});

describe("usableCounts", () => {
  test("counts only usable items, once per section they belong to", () => {
    const counts = usableCounts([
      item("a", 50, { sections: [5, 6] }),
      item("b", 40, { sections: [6] }),
      item("c", 30, { sections: [7], hasCrop: false }),
    ]);
    assert.equal(counts.get(5), 1);
    assert.equal(counts.get(6), 2);
    assert.equal(counts.get(7), undefined);
  });
});

describe("planPaper", () => {
  const pool = [
    item("easy-1", 90, { sections: [1] }),
    item("easy-2", 80, { sections: [1] }),
    item("mid-1", 60, { sections: [2] }),
    item("mid-2", 55, { sections: [2] }),
    item("hard-1", 30, { sections: [3] }),
    item("hard-2", 20, { sections: [3] }),
  ];

  test("honours the question count", () => {
    const paper = planPaper({ items: pool, count: 4, targetPercent: 60, seed: "a" });
    assert.equal(paper.count, 4);
    assert.equal(paper.questions.length, 4);
  });

  test("lands on the target expected score", () => {
    const paper = planPaper({ items: pool, count: 4, targetPercent: 60, seed: "a" });
    assert.equal(paper.onTarget, true);
    assert.ok(Math.abs(paper.expectedPercent - 60) <= 2.5, `expected ${paper.expectedPercent}`);
  });

  test("builds a harder paper when the teacher asks for a lower score", () => {
    const paper = planPaper({ items: pool, count: 4, targetPercent: 30, seed: "a" });
    // 20+30+55+60 is the lowest mean this pool can reach, so that is the
    // hardest 4-question paper available.
    assert.equal(paper.expectedPercent, 41.3);
    assert.equal(paper.questions.every((q) => q.passRate <= 60), true);
  });

  test("builds an easier paper when the teacher asks for a higher score", () => {
    const paper = planPaper({ items: pool, count: 4, targetPercent: 85, seed: "a" });
    // 90+80+60+55 is the highest mean this pool can reach.
    assert.equal(paper.expectedPercent, 71.3);
    assert.equal(paper.questions.every((q) => q.passRate >= 55), true);
  });

  test("tracks a target that moves across the pool", () => {
    const easy = planPaper({ items: pool, count: 4, targetPercent: 70, seed: "a" });
    const mid = planPaper({ items: pool, count: 4, targetPercent: 50, seed: "a" });
    const hard = planPaper({ items: pool, count: 4, targetPercent: 30, seed: "a" });
    assert.ok(easy.expectedPercent > mid.expectedPercent);
    assert.ok(mid.expectedPercent > hard.expectedPercent);
  });

  test("spreads questions over topics instead of draining one", () => {
    const paper = planPaper({ items: pool, count: 6, targetPercent: 50, seed: "a" });
    const sections = new Set(paper.questions.flatMap((q) => q.sections));
    assert.equal(sections.size, 3);
  });

  test("never picks the same question twice", () => {
    const paper = planPaper({ items: pool, count: 6, targetPercent: 50, seed: "a" });
    assert.equal(new Set(paper.questions.map((q) => q.id)).size, paper.count);
  });

  test("gives the same paper for the same seed", () => {
    const wide = [...pool, item("easy-3", 85, { sections: [4] }), item("hard-3", 25, { sections: [4] })];
    const a = planPaper({ items: wide, count: 6, targetPercent: 55, seed: "seed-1" });
    const b = planPaper({ items: wide, count: 6, targetPercent: 55, seed: "seed-1" });
    assert.deepEqual(a.questions.map((q) => q.id), b.questions.map((q) => q.id));
  });

  test("a different seed gives a different paper from a large bank", () => {
    const a = planPaper({ items: bank.items, count: 15, targetPercent: 55, seed: "seed-1" });
    const b = planPaper({ items: bank.items, count: 15, targetPercent: 55, seed: "seed-2" });
    assert.notDeepEqual(a.questions.map((q) => q.id), b.questions.map((q) => q.id));
  });

  test("keeps the pool to the chosen topics", () => {
    const paper = planPaper({ items: pool, sections: [3], count: 2, targetPercent: 25, seed: "a" });
    assert.equal(paper.count, 2);
    assert.ok(paper.questions.every((q) => q.sections.includes(3)));
  });

  test("reports a shortfall instead of padding with unscorable questions", () => {
    const paper = planPaper({ items: pool, sections: [3], count: 9, targetPercent: 25, seed: "a" });
    assert.equal(paper.requested, 9);
    assert.equal(paper.count, 2);
    assert.match(paper.notes.join(" "), /2-question paper/);
  });

  test("says so when the pool cannot reach the target", () => {
    const easyOnly = [item("e1", 88, { sections: [1] }), item("e2", 84, { sections: [1] })];
    const paper = planPaper({ items: easyOnly, sections: [1], count: 2, targetPercent: 20, seed: "a" });
    assert.ok(paper.expectedPercent >= 84);
    assert.match(paper.notes.join(" "), /out of reach/);
  });

  test("returns an empty paper with a note when nothing matches", () => {
    const paper = planPaper({ items: pool, sections: [27], count: 5, targetPercent: 60, seed: "a" });
    assert.equal(paper.count, 0);
    assert.equal(paper.questions.length, 0);
    assert.equal(paper.expectedPercent, null);
    assert.ok(paper.notes.length > 0);
  });

  test("clamps the count and the target into the allowed range", () => {
    const paper = planPaper({ items: pool, count: 999, targetPercent: 5, seed: "a" });
    assert.ok(paper.requested <= MAX_QUESTIONS);
    assert.ok(paper.targetPercent >= 10);
  });

  test("numbers the questions in exam order and reports the spread", () => {
    const paper = planPaper({ items: pool, count: 6, targetPercent: 50, seed: "a" });
    paper.questions.forEach((q, i) => assert.equal(q.seq, i + 1));
    // Coverage view: a question tagged with two topics counts under both.
    const covered = paper.sectionSpread.reduce((n, s) => n + s.asked, 0);
    assert.ok(covered >= paper.count);
    const bands = Object.values(paper.bandCounts).reduce((a, b) => a + b, 0);
    assert.equal(bands, paper.count);
  });

  test("reports a question under every topic it belongs to", () => {
    const shared = [item("s1", 60, { sections: [1, 2] }), item("s2", 50, { sections: [1] })];
    const paper = planPaper({ items: shared, count: 2, targetPercent: 55, seed: "a" });
    const spread = Object.fromEntries(paper.sectionSpread.map((s) => [s.number, s.asked]));
    assert.equal(spread[1], 2);
    assert.equal(spread[2], 1);
  });
});

describe("planPaper against the real bank", () => {
  test("builds a 20-question paper at 60% from the real DSE bank", () => {
    const paper = planPaper({ items: bank.items, count: 20, targetPercent: 60, seed: "real" });
    assert.equal(paper.count, 20);
    assert.ok(paper.onTarget, `expected ${paper.expectedPercent}`);
    assert.equal(paper.poolSize, 438);
  });

  test("every question it picks carries a key, a pass rate and a crop", () => {
    const paper = planPaper({ items: bank.items, count: 30, targetPercent: 55, seed: "real" });
    for (const q of paper.questions) {
      assert.ok(["A", "B", "C", "D"].includes(q.option), `bad key on ${q.id}`);
      assert.ok(typeof q.passRate === "number" && q.passRate > 0, `no pass rate on ${q.id}`);
      assert.ok(q.image.endsWith(".webp"), `no crop on ${q.id}`);
    }
  });

  test("keeps a topic filter honest against the real bank", () => {
    const counts = usableCounts(bank.items);
    const section = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const paper = planPaper({ items: bank.items, sections: [section], count: 5, targetPercent: 60, seed: "real" });
    assert.equal(paper.count, 5);
    assert.ok(paper.questions.every((q) => q.sections.includes(section)));
  });

  test("hits a 40% target when a spread-heavy cost would miss it", () => {
    const paper = planPaper({ items: bank.items, sections: [2, 26], count: 5, targetPercent: 40, seed: "p2e" });
    assert.equal(paper.count, 5);
    assert.equal(paper.onTarget, true, `expected ${paper.expectedPercent}`);
    assert.ok(Math.abs(paper.expectedPercent - 40) <= 2.5, `expected ${paper.expectedPercent}`);
  });

  test("takes the lowest scores when the target is below the pool", () => {
    const paper = planPaper({ items: bank.items, count: 60, targetPercent: 20, seed: "p2e" });
    assert.equal(paper.count, 60);
    assert.ok(paper.expectedPercent <= 32, `expected ${paper.expectedPercent}`);
  });

  test("keeps the requested target when the whole pool cannot reach it", () => {
    const paper = planPaper({ items: bank.items, sections: [4], count: 60, targetPercent: 90, seed: "p2e" });
    assert.equal(paper.count, 16);
    assert.equal(paper.targetPercent, 90);
    assert.ok(paper.expectedPercent < 90);
    const notes = paper.notes.join(" ");
    assert.match(notes, /out of reach/);
    assert.doesNotMatch(notes, /paper targets/i);
  });
});

describe("gradePaper", () => {
  const paper = planPaper({ items: bank.items, count: 8, targetPercent: 60, seed: "mark" });
  const allRight = Object.fromEntries(paper.questions.map((q) => [q.id, q.option]));
  const allWrong = Object.fromEntries(paper.questions.map((q) => [q.id, q.option === "A" ? "B" : "A"]));

  test("marks a full set of correct answers", () => {
    const result = gradePaper(paper, allRight);
    assert.equal(result.correct, 8);
    assert.equal(result.percent, 100);
    assert.equal(result.skipped, 0);
    assert.ok(result.detail.every((d) => d.correct));
  });

  test("marks a full set of wrong answers", () => {
    const result = gradePaper(paper, allWrong);
    assert.equal(result.correct, 0);
    assert.equal(result.percent, 0);
  });

  test("counts a skipped question as not answered and not correct", () => {
    const answers = { ...allRight };
    delete answers[paper.questions[0].id];
    const result = gradePaper(paper, answers);
    assert.equal(result.answered, 7);
    assert.equal(result.skipped, 1);
    assert.equal(result.correct, 7);
    assert.equal(result.detail[0].skipped, true);
  });

  test("breakdowns add up to the paper", () => {
    const result = gradePaper(paper, allRight);
    const bands = Object.values(result.byBand).reduce((n, b) => n + b.asked, 0);
    const topics = result.byTopic.reduce((n, t) => n + t.asked, 0);
    assert.equal(bands, paper.count);
    assert.equal(topics, paper.count);
  });

  test("compares the student against what a real cohort scored", () => {
    const result = gradePaper(paper, allWrong);
    assert.equal(result.beatRealCohort, false);
    assert.equal(gradePaper(paper, allRight).beatRealCohort, true);
  });

  test("ignores an answer for a question that is not on the paper", () => {
    const result = gradePaper(paper, { ...allRight, "not-on-this-paper": "A" });
    assert.equal(result.total, paper.count);
  });
});

describe("time", () => {
  test("turns minutes into seconds and treats no minutes as untimed", () => {
    assert.equal(durationSeconds(10, 30), 1800);
    assert.equal(durationSeconds(10, null), null);
    assert.equal(durationSeconds(10, 0), null);
    assert.equal(durationSeconds(10, ""), null);
  });

  test("formats a clock and never shows a negative one", () => {
    assert.equal(formatClock(0), "00:00");
    assert.equal(formatClock(75), "01:15");
    assert.equal(formatClock(-5), "00:00");
  });
});

describe("bands", () => {
  test("cover the whole pass-rate range with no gaps", () => {
    assert.equal(bandOf(100).id, "easy");
    assert.equal(bandOf(0).id, "hard");
    assert.equal(BANDS.length, 3);
  });
});