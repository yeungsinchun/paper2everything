# PRD part: Product, users, value, use cases

Self-contained section for the consolidated PRD/README. Facts are taken from the repository as of `origin/main` (8c293bf). Where something is intended rather than built, it is marked **(planned)**.

## 1. Product summary

paper2everything turns Hong Kong secondary-school source material (HKDSE Physics past papers, question-bank DOCX files, textbook chapters, and F.1 maths exam papers) into study artifacts that students and teachers can use directly. It is one monorepo with three subprojects that share a single data dependency (paper2notes reads paper2db output):

| Subproject | What it is | Audience-facing output |
|---|---|---|
| `paper2notes/` | Visual, interactive HKDSE Physics notes (Book 2 Force and Motion, Book 4 Electricity and Magnetism, Book 5 Radioactivity and Nuclear Energy) built as static HTML with three.js diagrams, KaTeX maths and self-check questions | A public site on Cloud Run: landing `/`, per-book indexes, per-chapter notes, DSE question decks, and a question-bank UI at `/qb` |
| `paper2db/` | A pipeline that splits HKDSE Paper 1A (MC) and 1B (LQ) PDFs into per-question crops, classifies each question to a syllabus section, pairs answers and candidate-performance notes, and ingests the QB DOCX banks | Per-section question banks (MC and LQ), section PDFs, whole-paper reconstructions, QB metadata |
| `paper2mock/` | LaTeX F.1 maths mock papers: 10 tests, each with a question paper and marking scheme | 20 PDFs, released as two zips on each push to `main` |

## 2. Goals

1. **Make past-paper practice topic-addressable.** A student revising one syllabus section should reach every relevant DSE question from any year without hunting through whole papers.
2. **Make physics notes visual and self-checking.** Concepts that static PDFs explain poorly (motion, fields, decay) are shown as interactive 3D or animated diagrams, with checks that give immediate feedback.
3. **Tie notes to exam reality.** Each chapter links the concept being taught to the real DSE and question-bank items that test it.
4. **Keep the pipeline reproducible and auditable.** Generated artifacts are rebuilt from tracked source PDFs, hand-tuned overrides and recorded classification decisions, so the bank can be regenerated and reviewed rather than trusted blindly.
5. **Ship as static, cheap, dependency-light content.** The student site needs no build step and no backend, so it runs locally with `python -m http.server` and in production behind nginx on Cloud Run.
6. **Provide ready-to-print assessment material.** Produce mock papers with marking schemes as typeset PDFs.

### Non-goals

- Not a general LMS: no accounts, grading, progress storage or teacher dashboard exist today **(planned, if ever)**.
- Not an authoritative replacement for the HKEAA or the textbook publisher. The pipeline derives crops from published papers; the user is responsible for appropriate use of the source material.
- Not a generic PDF-to-anything converter. The pipeline is tuned to HKDSE Physics paper layouts.

## 3. Users

### 3.1 Primary users

| User | Situation | What they need |
|---|---|---|
| **HKDSE Physics student (S4-S6)** | Learning a chapter, then drilling exam questions on it | Visual explanations, self-check questions, all past DSE questions for the topic, marking-scheme answers |
| **Physics teacher / tutor** | Preparing lessons, worksheets and homework | Topic-filtered question banks, printable section PDFs, diagrams to project in class |
| **F.1 maths student / teacher** | Practising or setting a mock exam | Complete mock papers with marking schemes |

### 3.2 Operators (internal users)

| User | What they do | What they need |
|---|---|---|
| **Content maintainer** | Ingests a new year's papers, new QB DOCX, or a new book chapter | A single pipeline command, review gates for uncertain splits and classifications, overrides that persist across rebuilds |
| **Contributor / agent** | Changes notes UI, visuals or pipeline code | CI that validates structure, links and the deployed-commit footer; screenshot evidence requirements for UI PRs |

## 4. Value proposition

- **For students:** one place where the explanation, the interactive diagram, and the real exam questions for a topic sit together, rather than three separate resources.
- **For teachers:** topic-indexed banks drawn from multiple years, plus printable PDFs, replacing manual cut-and-paste from scanned papers.
- **For maintainers:** classification decisions (the costly, nondeterministic LLM step) are tracked in `metadata/*/llm_classifications.json` and replayable with `--from-json`; hand fixes live in tracked override files; all crops are regenerable from `paper/`.
- **For everyone:** the student site is static and fast, with no sign-up.

What differentiates it from a plain past-paper archive: questions are cut per item, labelled by syllabus section, and linked from the notes that teach the underlying concept. What differentiates it from a plain notes site: the diagrams are interactive and the chapters end in exam-style practice.

## 5. Use cases

Each use case lists actor, trigger, flow and outcome.

**UC-1. Learn a chapter visually.**
Actor: student. Trigger: studying, for example, Book 5 ch. 25 Radiation and Radioactivity. Flow: open `/book5/`, choose a chapter, step through sections, interact with the 3D/animated diagrams and answer inline checks. Outcome: the student understands the concept and sees immediately whether their answers are right.

**UC-2. Practise DSE questions on one topic.**
Actor: student. Trigger: finished a chapter, wants exam practice. Flow: open the chapter's DSE deck (for example Book 5 25.1) or the `/qb` question-bank UI, filter by topic, work through MC and LQ items with real crops, compare with answers. Outcome: topic-targeted practice across years.

**UC-3. Build a revision set for a class.**
Actor: teacher. Trigger: preparing homework on a syllabus section. Flow: take the section PDF (`combined.pdf`) produced by the pipeline, or pick items from the QB UI. Outcome: a printable, single-topic worksheet.

**UC-4. Use a diagram in teaching.**
Actor: teacher. Trigger: lesson on, for example, projectile or circular motion. Flow: open the relevant Book 2 chapter and project the interactive diagram. Outcome: a manipulable visual in place of a static textbook figure.

**UC-5. Set or sit an F.1 maths mock.**
Actor: F.1 teacher or student. Trigger: mid-term preparation. Flow: download the question-paper and marking-scheme PDFs from the latest release of `paper2mock`. Outcome: a complete mock with marking scheme.

**UC-6. Ingest a new exam year.**
Actor: maintainer. Trigger: a new HKDSE paper is released. Flow: add PDFs under `paper/{mc,lq,ans}/`, run `./paper2db/pipeline --years <year>`, resolve review gates (MC anchors, LQ crops, uncertain classifications), commit the tracked inputs (overrides, `starts.json`, classification JSON). Outcome: the new year appears in every section bank and can be published in the `notes/dse/` snapshot.

**UC-7. Add or revise a chapter.**
Actor: contributor or agent. Trigger: a new book chapter or an improvement to an existing one. Flow: stage intake under `notes/_source/<book-ch>/` (OCR, outline, problems, images), build the chapter with the visual-html-notes conventions, run `node paper2notes/scripts/ci-check.mjs`, open a UI PR with before/after screenshots. Outcome: the chapter ships on the next Cloud Run deploy.

**UC-8. Publish.**
Actor: maintainer. Trigger: changes merged to `main`. Flow: run the Cloud Run deploy, which injects the `deploy-commit-footer` into every HTML page. Outcome: the live site shows which commit it was built from.

## 6. Current scope and coverage

- Notes: Book 2 (10 chapters), Book 4 (8 chapters), Book 5 (3 chapters).
- DSE banks: 27 syllabus sections, MC and LQ; a tracked published snapshot of 82 files ships in the image.
- QB: 46 banks, 169 DOCX, 3847 items (1881 in scope), surfaced in the `/qb` UI with topic filters and real crops.
- Mocks: F.1 maths, 10 tests.
- Live site: https://paper2notes-152505675251.asia-east2.run.app/

## 7. Success criteria

Product-level measures suitable for the consolidated PRD (targets are for the consolidation worker and owner to set):

- Every DSE question in a covered year is reachable from exactly one or more syllabus-section banks, with unclassified or low-confidence items surfaced by the audit output rather than silently dropped.
- Every chapter page passes `ci-check.mjs` (structure, relative links, commit footer).
- Interactive checks give correct feedback for every authored problem.
- The pipeline rebuilds all generated artifacts from tracked inputs on a clean checkout.
- Mock PDFs compile in CI and are released on each push to `main`.

## 8. Assumptions, risks and open questions

- **Source-material rights.** Past papers and QB documents are third-party. Publication scope (what is public versus local-only) needs an explicit owner decision. The repo already keeps generated crops gitignored except the curated snapshot.
- **Classification accuracy.** LLM or keyword classification can mis-tag questions; review gates and overrides mitigate this but coverage of manual review is an open quality question.
- **Single-edge coupling.** paper2notes depends on paper2db's output layout through an unchecked filesystem contract (see `docs/ARCHITECTURE.md`).
- **Syllabus scope.** Only Books 2, 4 and 5 are covered; Books 1 and 3 and other subjects are open **(planned / undecided)**.
- **Learner state.** Progress tracking and accounts are out of scope today; the self-checks are stateless.
- **Open question:** should the F.1 maths mocks remain in this product or be presented as a separate offering for a different audience?
