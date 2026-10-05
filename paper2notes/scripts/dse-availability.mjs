#!/usr/bin/env node
/* Which DSE questions the published snapshot really has.
 *
 * HKDSE numbers the multiple-choice part and the long-question part of a paper
 * separately, so "2012/24" does not say which kind of question it is: 2012
 * Paper 1A Section A is questions 1-36 and every one is multiple choice, while
 * Paper 1B is questions 1-11 and every one is a long question. Nothing in a
 * crop filename says which kind it is, so this module checks that every
 * published DSE question is a real question of the right kind, and that every
 * section whose questions are not fully published is written down.
 *
 * It reads three things and invents none of them:
 *   notes/dse/availability.json           the tracked record of what ships
 *   paper2db/metadata/{mc,lq}/llm_classifications.json   which question belongs to which section
 *   paper2db/tests/reconstructed/lq/<year>/starts.json   the long questions each year's paper holds
 *
 * Run: node paper2notes/scripts/dse-availability.mjs [--json]
 * Also called from scripts/quiz-audit.mjs (per page) and scripts/ci-check.mjs
 * (the snapshot record), so a later run cannot quietly turn a documented
 * absence back into a bug. */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/* The only states a published section may be in. */
export const STATES = ["real-crop", "placeholder", "none-in-source"];

const AVAILABILITY_REL = join("notes", "dse", "availability.json");
const SNAPSHOT_REL = join("notes", "dse");

/* Directories that hold no student page. */
const SKIP = new Set(["_local", "_source", "vendor", "lib", "css", "js", "data", "crops"]);

const push = (map, key, value) => {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
};

/* ---------- the tracked record ---------- */

export function loadAvailability(repoRoot) {
  const file = join(repoRoot, AVAILABILITY_REL);
  const rel = relative(repoRoot, file);
  if (!existsSync(file)) {
    return {
      file,
      manifest: null,
      problems: [
        {
          kind: "dse-manifest-missing",
          detail: `${rel} is missing: every published DSE section must be recorded there as real-crop, placeholder or none-in-source, with a reason`,
        },
      ],
    };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    return {
      file,
      manifest: null,
      problems: [{ kind: "dse-manifest-unparsable", detail: `${rel}: ${err.message}` }],
    };
  }
  return { file, manifest, problems: [] };
}

/* ---------- the source papers, as the tracked pipeline inputs describe them ---------- */

export function loadSource(repoRoot) {
  for (const base of [resolve(repoRoot, "..", "paper2db"), resolve(repoRoot, "paper2db")]) {
    const lqFile = join(base, "metadata", "lq", "llm_classifications.json");
    const mcFile = join(base, "metadata", "mc", "llm_classifications.json");
    const startsDir = join(base, "tests", "reconstructed", "lq");
    if (!existsSync(lqFile) || !existsSync(mcFile) || !existsSync(startsDir)) continue;

    /* "<year>-q<n>" -> the sections that long question belongs to. */
    const lqQuestions = new Map();
    const lqBySection = new Map();
    const classified = JSON.parse(readFileSync(lqFile, "utf8"));
    for (const [key, value] of Object.entries(classified || {})) {
      const sections = (Array.isArray(value?.sections) ? value.sections : []).map(Number).filter(Number.isInteger);
      if (!sections.length) continue;
      lqQuestions.set(key, sections);
      for (const section of sections) push(lqBySection, section, key);
    }

    /* "<year>/<n>" -> the sections that multiple-choice question belongs to.
       Year is a number for a real year, and "pp" or "sap" for a past paper. */
    const mcQuestions = new Map();
    const mcBySection = new Map();
    const mcItems = JSON.parse(readFileSync(mcFile, "utf8"));
    for (const item of Array.isArray(mcItems) ? mcItems : Object.values(mcItems || {})) {
      const year = item?.Year;
      const question = item?.Question;
      if ((!Number.isInteger(year) && typeof year !== "string") || !Number.isInteger(question)) continue;
      const sections = (Array.isArray(item.sections) ? item.sections : []).map(Number).filter(Number.isInteger);
      if (!sections.length) continue;
      const key = `${year}/${question}`;
      mcQuestions.set(key, sections);
      for (const section of sections) push(mcBySection, section, key);
    }

    /* The question numbers each year's long-question paper actually holds. */
    const startsByYear = new Map();
    for (const year of readdirSync(startsDir).sort()) {
      const file = join(startsDir, year, "starts.json");
      if (!existsSync(file)) continue;
      const data = JSON.parse(readFileSync(file, "utf8"));
      const questions = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : [];
      startsByYear.set(
        year,
        questions.map((q) => (typeof q === "object" && q !== null ? q.q : q)).filter((n) => Number.isInteger(n)),
      );
    }

    return { ok: true, base, lqFile, mcFile, startsDir, lqQuestions, lqBySection, mcQuestions, mcBySection, startsByYear, note: "" };
  }
  return {
    ok: false,
    note: "paper2db tracked inputs (metadata/{mc,lq}/llm_classifications.json, tests/reconstructed/lq/<year>/starts.json) are not beside paper2notes, so the cross-checks against the source papers were skipped",
  };
}

/* "2013-q9.png" / "2012_q24.png" -> { year: "2013", n: 9 }. */
export function parseCropName(file) {
  const hit = file.match(/^([a-z0-9]+)[-_]q(\d+)\.png$/i);
  return hit ? { year: hit[1], n: Number(hit[2]) } : null;
}

function questionKey(kind, year, n) {
  return kind === "lq" ? `${year}-q${n}` : `${year}/${n}`;
}

/* "its long questions run 1 to 11", read back to a reader. */
function rangeText(numbers) {
  if (!numbers.length) return "no long question";
  const sorted = [...numbers].sort((a, b) => a - b);
  return `questions ${sorted[0]} to ${sorted[sorted.length - 1]}`;
}

/* A claim that a section has no question of a kind has to be checkable: it
   names a paper, and it says which questions that paper does have. */
export function namesEvidence(text) {
  if (!/\b(19|20)\d{2}\b/.test(text)) return false;
  return (
    /\bquestions?\s+\d{1,2}\s*(?:to|[-–—])\s*\d{1,2}\b/i.test(text) || /* "questions 1 to 11" */
    /\b\d{4}\/\d{1,2}\b/.test(text) || /* "2013/11" */
    /\b\d{1,2}\s+(?:long\s+)?questions?\b/i.test(text) /* "13 long questions" */
  );
}

/* ---------- the snapshot: every published file against the record ---------- */

export function checkSnapshot({ repoRoot, availability }) {
  const { file, manifest, problems: manifestProblems } = availability || loadAvailability(repoRoot);
  const source = loadSource(repoRoot);
  const problems = [...manifestProblems];
  const informational = [];
  const rel = relative(repoRoot, file);

  if (manifest) {
    const placeholderFiles = new Set(Array.isArray(manifest.placeholderFiles) ? manifest.placeholderFiles : []);
    const snapshotDir = join(repoRoot, SNAPSHOT_REL);

    /* What the snapshot holds, read from disk. */
    const published = new Map();
    for (const kind of ["mc", "lq"]) {
      const kindDir = join(snapshotDir, kind);
      if (!existsSync(kindDir)) continue;
      for (const section of readdirSync(kindDir).sort()) {
        const secDir = join(kindDir, section);
        if (!statSync(secDir).isDirectory()) continue;
        published.set(
          `${kind}/${section}`,
          readdirSync(secDir).sort().filter((name) => statSync(join(secDir, name)).isFile()),
        );
      }
    }

    /* Every section, from the record and from disk, checked once each. */
    const sections = new Set([...published.keys(), ...Object.entries(manifest.sections || {}).flatMap(([section, kinds]) => ["mc", "lq"].map((kind) => `${kind}/${section}`))]);
    for (const key of [...sections].sort()) {
      const [kind, section] = key.split("/");
      const files = published.get(key);
      const entry = manifest.sections?.[section]?.[kind];
      const where = `notes/dse/${key}`;

      if (!entry) {
        if (files) problems.push({ kind: "dse-availability-undeclared", detail: `${where} is published but ${rel} records nothing for ${key}` });
        continue;
      }
      if (!files) {
        if (entry.state !== "none-in-source") {
          problems.push({
            kind: "dse-availability-missing-files",
            detail: `${rel} declares ${key} as ${entry.state} but ${where}/ holds no files`,
          });
        }
      } else {
        const placeholders = files.filter((name) => placeholderFiles.has(name));
        const real = files.filter((name) => !placeholderFiles.has(name));
        if (entry.state === "real-crop" && !real.length) {
          problems.push({
            kind: "dse-availability-placeholder-declared-real",
            detail: `${where} declares real-crop but every file it publishes is a placeholder (${placeholders.join(", ") || "none"})`,
          });
        }
        if (entry.state === "placeholder" && real.length) {
          problems.push({
            kind: "dse-availability-real-declared-placeholder",
            detail: `${where} declares placeholder but publishes ${real.join(", ")}`,
          });
        }
        if (entry.state === "real-crop" && real.length && placeholders.length) {
          problems.push({
            kind: "dse-availability-real-with-placeholder",
            detail: `${where} declares real-crop but still publishes the placeholder(s) ${placeholders.join(", ")} beside ${real.join(", ")}`,
          });
        }
        if (entry.state === "none-in-source" && files.length) {
          problems.push({
            kind: "dse-availability-none-in-source-with-files",
            detail: `${where} declares none-in-source but publishes ${files.join(", ")}`,
          });
        }
        for (const name of real) {
          const parsed = parseCropName(name);
          if (!parsed || !source.ok) continue;
          const key2 = questionKey(kind, parsed.year, parsed.n);
          const srcSections = kind === "lq" ? source.lqQuestions.get(key2) : source.mcQuestions.get(key2);
          if (!srcSections) {
            problems.push({
              kind: "dse-question-not-in-source",
              detail: `${where}/${name} claims HKDSE ${parsed.year} question ${parsed.n} as a ${kind === "lq" ? "long " : "multiple-choice "}question, and the source has no such question`,
            });
            continue;
          }
          if (!srcSections.includes(Number(section))) {
            problems.push({
              kind: "dse-question-wrong-section",
              detail: `${where}/${name} is filed under section ${section}, but the source files it under ${srcSections.join(", ")}`,
            });
          }
          if (kind === "lq") {
            const numbers = source.startsByYear.get(parsed.year);
            if (numbers && !numbers.includes(parsed.n)) {
              problems.push({
                kind: "dse-lq-outside-paper-range",
                detail: `${where}/${name}: the ${parsed.year} long-question paper holds ${rangeText(numbers)}, so question ${parsed.n} is not in it`,
              });
            }
          }
        }
      }

      if (!STATES.includes(entry.state)) {
        problems.push({
          kind: "dse-availability-bad-state",
          detail: `${where} declares state ${JSON.stringify(entry.state)}; it must be one of ${STATES.join(", ")}`,
        });
        continue;
      }
      if (typeof entry.reason !== "string" || !entry.reason.trim()) {
        problems.push({ kind: "dse-availability-no-reason", detail: `${where} has no reason in ${rel}` });
        continue;
      }

      if (source.ok) {
        const known = kind === "lq" ? source.lqBySection.get(Number(section)) : source.mcBySection.get(Number(section));
        const available = known || [];
        if (entry.state === "none-in-source" && available.length) {
          problems.push({
            kind: "dse-availability-contradicts-source",
            detail: `${where} declares none-in-source, but ${relative(repoRoot, kind === "lq" ? source.lqFile : source.mcFile)} files ${available.length} such question(s) for section ${section} (${available.slice(0, 6).join(", ")})`,
          });
        } else if (entry.state === "none-in-source" && !namesEvidence(entry.reason)) {
          problems.push({
            kind: "dse-availability-no-evidence",
            detail: `${where} declares none-in-source, so its reason must name the paper and the question range that paper does have: "${entry.reason}"`,
          });
        } else if (entry.state === "placeholder" && available.length) {
          informational.push({
            kind: "dse-questions-not-published",
            detail: `${where} publishes only placeholders; the source has ${available.length} real ${kind === "lq" ? "long " : ""}question(s) for it: ${available.join(", ")}`,
          });
        }
      }
    }
  }

  if (!source.ok) informational.push({ kind: "dse-source-unavailable", detail: source.note });
  return { problems, informational, source: { ok: source.ok, base: source.base || null } };
}

/* ---------- what the shipped pages actually reference ---------- */

/* Every distinct _local/dse path the student pages load, counted from the pages
   themselves rather than written down anywhere. docs/ARCHITECTURE.md quotes
   these numbers, and checkDocumentedReferenceCounts() below refuses the quote
   when it drifts, so the doc cannot hold a hand-copied count. */
export function referenceCounts(root) {
  const notesDir = join(root, "notes");
  const total = new Set();
  const byBook = new Map();
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (SKIP.has(name)) continue;
        walk(full);
      } else if (name.endsWith(".html")) {
        const refs = [...readFileSync(full, "utf8").matchAll(/_local\/dse\/[^'"\s)]+/g)].map((m) => m[0]);
        if (!refs.length) continue;
        const book = relative(notesDir, full).split("/")[0];
        if (!byBook.has(book)) byBook.set(book, new Set());
        for (const ref of refs) {
          total.add(ref);
          byBook.get(book).add(ref);
        }
      }
    }
  };
  if (existsSync(notesDir)) walk(notesDir);
  const split = (set) => {
    const refs = [...set];
    const png = refs.filter((r) => r.endsWith(".png")).length;
    return { total: refs.length, png, pdf: refs.length - png };
  };
  return { total: split(total), books: Object.fromEntries([...byBook].sort().map(([b, s]) => [b, split(s)])) };
}

/* The sentences in docs/ARCHITECTURE.md that quote the counts. Kept loose on
   purpose, and tolerant of the line wrapping a paragraph editor introduces:
   the check is about the numbers agreeing, not about the prose. */
const DOC_TOTAL_RE = /(\d+)\s+distinct\s+`_local(?:\/dse)?`\s+references\s+are/;
const DOC_BOOK_RE = /\bBook\s+([245]):\s*(\d+)\s*=\s*(\d+)\s*PNG\s*\+\s*(\d+)\s*PDFs?/g;

export function checkDocumentedReferenceCounts(docText, counts) {
  const problems = [];
  const total = docText.match(DOC_TOTAL_RE);
  if (total && Number(total[1]) !== counts.total.total) {
    problems.push({
      kind: "dse-doc-reference-total-stale",
      detail: `docs/ARCHITECTURE.md says ${total[1]} distinct _local/dse references; the pages hold ${counts.total.total}`,
    });
  }
  for (const m of docText.matchAll(DOC_BOOK_RE)) {
    const [, book, stated, png, pdf] = m;
    const real = counts.books[`book${book}`];
    if (!real) continue;
    if (Number(stated) !== real.total || Number(png) !== real.png || Number(pdf) !== real.pdf) {
      problems.push({
        kind: "dse-doc-reference-count-stale",
        detail: `docs/ARCHITECTURE.md says Book ${book}: ${stated} = ${png} PNG + ${pdf} PDFs; the pages hold ${real.total} = ${real.png} PNG + ${real.pdf} PDFs`,
      });
    }
  }
  return problems;
}

/* ---------- one page ---------- */

function slideBlocks(html) {
  const opens = [...html.matchAll(/<article\b[^>]*class="[^"]*quiz-slide[^"]*"[^>]*>/g)];
  return opens.map((m, i) => {
    const id = m[0].match(/\bid="([^"]+)"/)?.[1] || "";
    const end = opens[i + 1]?.index ?? html.length;
    return { id, html: html.slice(m.index, end) };
  });
}

/* Every crop a page points at: { kind, section, file }. */
function cropRefs(html) {
  const out = [];
  for (const m of html.matchAll(/_local\/dse\/(mc|lq)\/(\d+)\/([A-Za-z0-9_.-]+)/g)) {
    out.push({ kind: m[1], section: m[2], file: m[3] });
  }
  return out;
}

export function checkPage(html, { page, availability, source }) {
  const problems = [];
  const informational = [];
  const manifest = availability?.manifest || null;
  const manifestRel = availability?.repoRoot ? relative(availability.repoRoot, availability.file) : availability?.file || "notes/dse/availability.json";
  const entryFor = (kind, section) => manifest?.sections?.[section]?.[kind] || null;

  for (const ref of cropRefs(html)) {
    const where = `${ref.kind}/${ref.section}/${ref.file}`;
    const entry = entryFor(ref.kind, ref.section);
    if (!entry) {
      problems.push({
        kind: "dse-availability-undeclared",
        detail: `slide image ${where} is shown, but ${manifestRel} records nothing for ${ref.kind}/${ref.section}`,
      });
      continue;
    }
    if (typeof entry.reason !== "string" || !entry.reason.trim()) {
      problems.push({ kind: "dse-availability-no-reason", detail: `${where} is shown, but ${ref.kind}/${ref.section} has no reason in ${manifestRel}` });
    }
    const isPlaceholder = new Set(manifest.placeholderFiles || []).has(ref.file);
    if (isPlaceholder && entry.state !== "placeholder") {
      problems.push({
        kind: `dse-${ref.kind}-placeholder-undeclared`,
        detail: `${where} is a hand-written placeholder, but ${ref.kind}/${ref.section} is recorded as ${entry.state} in ${manifestRel}`,
      });
    }
    if (!isPlaceholder && entry.state === "none-in-source") {
      problems.push({
        kind: "dse-availability-none-in-source-with-files",
        detail: `${where} is a real crop, but ${ref.kind}/${ref.section} is recorded as none-in-source in ${manifestRel}`,
      });
    }
  }

  for (const slide of slideBlocks(html)) {
    if (!slide.id.startsWith("dse-lq-")) continue;
    const question = slide.id.slice("dse-lq-".length).match(/^([a-z0-9]+)-(\d+)$/);
    const crop = cropRefs(slide.html)[0] || null;
    const section = crop?.section || slide.id.slice("dse-lq-".length).match(/^(\d+)-/)?.[1] || null;

    if (question) {
      const { year, n } = { year: question[1], n: Number(question[2]) };
      const parsedCrop = crop ? parseCropName(crop.file) : null;
      if (crop && (!parsedCrop || parsedCrop.year !== year || parsedCrop.n !== n)) {
        problems.push({
          kind: "dse-lq-slide-crop-mismatch",
          detail: `slide ${slide.id} names ${year} question ${n}, but shows ${crop.kind}/${crop.section}/${crop.file}`,
        });
      }
      if (source.ok) {
        const key = `${year}-q${n}`;
        const sections = source.lqQuestions.get(key);
        if (!sections) {
          const numbers = source.startsByYear.get(year);
          problems.push({
            kind: "dse-lq-not-in-source",
            detail: `slide ${slide.id} shows HKDSE ${year} question ${n} as a long question${
              numbers ? `, but the ${year} long-question paper holds ${rangeText(numbers)}` : ""
            }`,
          });
        } else {
          if (section && !sections.includes(Number(section))) {
            problems.push({
              kind: "dse-lq-wrong-section",
              detail: `slide ${slide.id} is shown under section ${section}, but the source files it under ${sections.join(", ")}`,
            });
          }
          const numbers = source.startsByYear.get(year);
          if (numbers && !numbers.includes(n)) {
            problems.push({
              kind: "dse-lq-outside-paper-range",
              detail: `slide ${slide.id}: the ${year} long-question paper holds ${rangeText(numbers)}, so question ${n} is not in it`,
            });
          }
        }
      }
      continue;
    }

    /* A slide that names no paper question is a placeholder slide. It is only
       allowed where the record says the section publishes placeholders. */
    const entry = section ? entryFor("lq", section) : null;
    if (!section) {
      problems.push({ kind: "dse-lq-slide-unreadable", detail: `slide ${slide.id} names no section, so ${manifestRel} cannot be checked against it` });
    } else if (!entry) {
      problems.push({
        kind: "dse-lq-placeholder-undeclared",
        detail: `slide ${slide.id} shows no paper question, but ${manifestRel} records nothing for lq/${section}`,
      });
    } else if (entry.state !== "placeholder") {
      problems.push({
        kind: "dse-lq-placeholder-undeclared",
        detail: `slide ${slide.id} shows no paper question, but lq/${section} is recorded as ${entry.state} in ${manifestRel}`,
      });
    } else if (typeof entry.reason !== "string" || !entry.reason.trim()) {
      problems.push({ kind: "dse-availability-no-reason", detail: `lq/${section} has no reason in ${manifestRel}, so slide ${slide.id} is unexplained` });
    }
  }

  /* A panel that states in words that a section has no long question. The
     record must agree, and the words must name the paper and its range so the
     statement can be checked later. */
  for (const m of html.matchAll(/<([a-z]+)\b[^>]*\bdata-lq-none="([^"]+)"[^>]*>/gi)) {
    const tag = m[1];
    const section = m[2].trim();
    const close = html.slice(m.index + m[0].length).search(new RegExp(`</${tag}\\b`, "i"));
    const inner = close === -1 ? html.slice(m.index + m[0].length) : html.slice(m.index + m[0].length, m.index + m[0].length + close);
    const text = inner.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const entry = entryFor("lq", section);
    if (!entry) {
      problems.push({
        kind: "dse-lq-none-undeclared",
        detail: `the page states that lq/${section} has no long question, but ${manifestRel} records nothing for lq/${section}`,
      });
      continue;
    }
    if (entry.state === "real-crop") {
      problems.push({
        kind: "dse-lq-none-contradicts-record",
        detail: `the page states that lq/${section} has no long question, but ${manifestRel} records ${entry.state} for it`,
      });
    }
    if (typeof entry.reason !== "string" || !entry.reason.trim()) {
      problems.push({ kind: "dse-availability-no-reason", detail: `the page states that lq/${section} has no long question, but ${manifestRel} gives no reason` });
    }
    if (!namesEvidence(text)) {
      problems.push({
        kind: "dse-lq-none-no-evidence",
        detail: `the note on lq/${section} must name the paper and the questions it does have, so a reader can check it: "${text}"`,
      });
    }
    informational.push({
      kind: "dse-lq-none-stated",
      detail: `lq/${section} is stated as absent on the page; ${manifestRel} records it as ${entry.state}: ${entry.reason || "(no reason)"}`,
    });
  }

  return { page, problems, informational };
}

/* ---------- standalone run ---------- */

function pages(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) pages(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

function main() {
  const repoRoot = resolve(fileURLToPath(import.meta.url), "..", "..");
  const availability = { ...loadAvailability(repoRoot), repoRoot };
  const snapshot = checkSnapshot({ repoRoot, availability });
  const source = loadSource(repoRoot);

  const rows = pages(join(repoRoot, "notes")).map((file) => {
    const page = relative(repoRoot, file);
    const html = readFileSync(file, "utf8");
    const row = checkPage(html, { page, availability, source });
    const missing = cropRefs(html).filter((ref) => !existsSync(join(repoRoot, SNAPSHOT_REL, ref.kind, ref.section, ref.file)));
    if (missing.length) {
      const names = [...new Set(missing.map((ref) => `${ref.kind}/${ref.section}/${ref.file}`))];
      row.informational.push({
        kind: "dse-crop-not-published",
        detail: `${names.length} crop(s) this page shows are not in notes/dse/: ${names.join(", ")}`,
      });
    }
    return row;
  });

  const problems = [...snapshot.problems, ...rows.flatMap((r) => r.problems.map((p) => ({ ...p, page: r.page })))];
  const informational = [...snapshot.informational, ...rows.flatMap((r) => r.informational.map((i) => ({ ...i, page: r.page })))];

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ snapshot, pages: rows, problems, informational }, null, 2));
  } else {
    const w = (s, n) => String(s).padEnd(n);
    console.log(`${w("where", 46)}${w("kind", 40)}detail`);
    for (const p of problems) console.log(`  - [${p.kind}] ${p.page ? `${p.page}: ` : ""}${p.detail}`);
    for (const i of informational) console.log(`  ~ [${i.kind}] ${i.page ? `${i.page}: ` : ""}${i.detail}`);
    const counts = referenceCounts(repoRoot);
    console.log(`\nDistinct _local/dse references the pages load: ${counts.total.total} = ${counts.total.png} PNG + ${counts.total.pdf} PDFs`);
    for (const [book, c] of Object.entries(counts.books)) {
      console.log(`  ${book}: ${c.total} = ${c.png} PNG + ${c.pdf} PDFs`);
    }
    console.log(`\nsections checked | pages checked ${rows.length} | problems ${problems.length} | notes ${informational.length}`);
  }
  process.exit(problems.length ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main();