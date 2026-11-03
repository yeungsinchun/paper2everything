# Question coverage, exams, and shared book layout

## User intent and the boundary of this document

The user wants to check every question against the notes.
This includes question-bank questions and DSE paper problem sets.
The first question is whether each question has a corresponding notes section.
The next question is whether that section teaches the concepts needed to answer it.
These are different checks.
A valid section link does not prove that the lesson teaches the answer.

The user later authorized inline question explanations and broader coverage checks.
Separate implementation tasks own that work.
This document does not claim that the existing branches already deliver those features.
The concept checklist is optional downstream support, not proof of exhaustive coverage.

Other recorded requests cover reliable answers, a working mock exam, and consistent book layouts.
This document explains how their existing changes interact.
It separates code already on main from proposed branch code.
It does not authorize a merge, deployment, branch rewrite, or product fix.

Snapshot: 2026-11-03.
Inspected main: `5e525c46dd98a629c211e0f209530037f8bac01e`.
The descriptions and comments linked below provide historical evidence.
Source inspection supports implementation statements, not a claim that every runtime path passed.

## Terms

- **QB** means the question bank. **DSE** means the examination paper collection.
- **MC** means multiple choice. **LQ** means a long question.
- An **item** is one question record with its identity, topic, and available answer evidence.
- An **answer pointer** names the answer location, such as an answer image or PDF page.
- A **section mapping** connects a question to a notes section.
- A **learning objective** states what a student should learn.
- **Conceptual coverage** asks whether the notes teach the ideas needed to answer the question.
- **Staging** holds prepared question records and images before publication.
- A **publication mirror** is the separate copy that the student site reads.
- A **head** identifies the inspected branch commit. A **base** identifies its comparison branch.
- A **compiler** is the script that assembles page sources into complete static HTML.

## Component interactions

The arrows below show data dependencies, not the order in which branches must merge.
The mock exam does not consume concept checklists.
Book layout compilation does not consume mock-exam output.

```text
Official PDFs + reviewed overrides + source question banks
                     |
              paper2db pipeline
       crops / keys / classifications / answer pointers
                     |
           prepared staging records and images
                     |
        separate publication into student-site mirrors
                     |
          +----------+--------------------+
          |                               |
     question-bank UI                proposed /mock/ UI
          |                               |
     student questions               eligible MC records
          |                               |
          |                         selection -> exam -> grade
          |
          +--- question inventory + existing notes routes
                            |
                   existing audit harness
             mappings / bundles / per-item results
                            |
                  report.mjs coverage report
                            |
              proposed brief.mjs page checklist
                 JSON + Markdown -> note author
```

The audit harness reads notes pages without their embedded question decks.
It treats those deck questions as audit items instead.
Its existing verification command checks consistency among results, mappings, and bundles.
That consistency check does not independently establish educational correctness.
A complete coverage claim also needs the full intended inventory and evidence for every included question.

```text
Existing static book pages on main
                 |
     proposed shared source layout
     book.html + books.json + per-route slots
                 |
          build-books.mjs
                 |
     same static book routes and anchors
                 |
       browser / audit / question links
```

The shared template owns document structure, primary navigation, and footer markup.
Page slots retain lessons, head assets, scripts, and trailing comments.
The compiler preserves stable routes for audits and question links.
The deployment script and Docker build compile those sources before nginx serves the static pages.
Neither the browser nor the audit needs a runtime React renderer.

## Already present on inspected main

### Honest pipeline state and answer locations

https://github.com/yeungsinchun/paper2everything/pull/107

**Recorded intent:** make the question-bank pipeline functional and report negative results honestly.
The delivered scope fixes false audit percentages and missing derived answer locations.

Prepared question indexes and adjacent answer images feed `pointers.py`.
Tracked answer records take priority; derived records fill the remaining locations.
`dse_items.py` joins those pointers into question records.
The resolver checks known item identities and target paths.
The committed-data tests compare staging, bank metadata, shipped links, and crop paths.

Separately, `quality_audit.py` reads generated crops and classifications.
An unbuilt corpus reports `not measured`, not an invented failure percentage.
Strict mode fails when nothing was built to audit.

**Example, historical author output:** an empty generated tree changed from `125/2 (6250.00%)` to `0/0 not measured`.
Recorded coverage reached 1880/1881 in-scope QB items and 122/170 DSE long questions.
These counts are historical, not new measurements on this documentation branch.
The source corpus and generated files remain prerequisites for a real end-to-end corpus rebuild.

### Corrected keys and readable answer images

https://github.com/yeungsinchun/paper2everything/pull/117

**Recorded intent:** correct wrong or unreadable answers against the official marking schemes.
The request required source page references and an honest unresolved result for 2020 Q27.

Official marking schemes and reviewed overrides feed `extract_answer_keys.py`.
The extractor stops before Paper 2 and restricts later key hits to the Section A question range.
`stage_dse_mc.py --verify-only` compares staged content with fresh extraction.
This check compares content, not timestamps.

Answer page maps feed the long-answer cropper.
A four-rotation OCR check reads each image at four orientations.
Decisive sideways readings trigger rotation; unresolved orientation problems fail the stage.
The staging script applies the same check before writing published staging assets.
The Book 2 database refresh updates recorded image dimensions.

**Example, historical source-linked correction:** 2013 Q1 changed from A without a percentage to B (54%).
The author cites `2013ans.pdf`, PDF page 2, printed page 54.
The 2021 Q9 answer changed from pages 10–11 to page 10 alone.
That removed the Paper 2 Astronomy solution from a Paper 1 answer.
The description retains hosted before/after figures.

The final report records nine corrected letters, 17 corrected or filled percentages, ten rotated crops, and one wrong-paper crop.
Those measured counts differ from the initial audit allegations.
The report leaves 2020 Q27 unchanged as B.
The separate Examination Report needed to explain its asterisk was unavailable.
The change does not prove every answer correct or add a universal refusal-to-publish policy.
Downstream mirrors still require their normal separate publication step.

## Proposed branch functionality

These changes exist on the inspected heads below, not on the inspected main.
Their Git dependencies include unrelated features.
A Git dependency is not necessarily a runtime or data dependency.

### Optional page checklists after an audit

https://github.com/yeungsinchun/paper2everything/pull/108

**User goal:** check whether every QB and DSE question has a corresponding notes section.
The original F09 worker brief specifies a page-checklist implementation.
That delegated design does not establish a separate direct user request for checklists.

`brief.mjs --page <page>` reads existing audit inventory and results.
It collects recorded missing concepts across banks for that page's mapped section.
It reads the page's learning-objective block and bullet positions.
An optional model groups concepts; `--no-model` keeps one group per concept.
Unusable model output triggers a declared fallback.
The existing `report.mjs` must-fix rule determines priority.
The model does not replace that rule.
Unmatched objectives remain explicit rather than disappearing.

One computation renders JSON and Markdown.
The protected-content checker examines both files before either is written.
Output uses `BANK#<inventory index>` references instead of protected question identifiers.
The private audit retains the real identifiers.
A note author consumes the checklist and separately decides what to change.

**Example, historical synthetic demonstration:** one temporary audit result named `the vector sum of coplanar forces`.
The output contained one should-fix group for the Forces and Newton I page.
It referenced `QB_203#0` and learning objective `ch--lo-1`, bullet 4.
This was not a completed real-bank audit.
The historical live model call returned HTTP 404, `model_not_found`.
The resulting output declared fallback grouping, not successful live-model grouping.

This generator neither enumerates the full intended corpus nor verifies every question-to-section mapping.
It does not independently test conceptual teaching coverage, repair lessons, or add inline explanation panels.
Missing or stale upstream evidence remains missing or stale downstream.
Successful live-model grouping and fresh exact-head verification remain unverified in this documentation task.

### Multiple-choice mock exams

https://github.com/yeungsinchun/paper2everything/pull/119

**Recorded intent:** let teachers choose topics, question count, and target percentage for an exam students can sit.
The user asked to estimate difficulty from each corresponding real question's recorded percentage correct.

The browser reads `notes/qb/data/dse_mc.json` and its image paths.
`mock-engine.js` accepts MC records with a key, recorded pass rate, and crop.
It rejects deleted items and uncertain classifications.
Teacher choices and the paper code feed deterministic selection.
The selection compares target error before topic and year balance.
The interface presents the paper, collects answers, and shows grades and topic results.

**Example, historical browser demonstration:** five questions targeting 40% produced a 40.2% mean recorded pass rate.
Requesting 60 questions from a four-question topic produced four questions and a shortfall explanation.
The recorded pass rate estimates difficulty; it does not guarantee an individual student's score.
Printing, long questions, and generating rewritten question text remain outside this implementation.
The brief generator is an inherited Git dependency, not an exam-selection input.

### Shared assets for Books 6 and 9

https://github.com/yeungsinchun/paper2everything/pull/135

**Recorded intent:** remove private copies of common assets without changing lesson wording.
Book pages link shared notes CSS, maths rendering, checks, and three.js libraries.
Thin book stylesheets retain accents, digest columns, and idea links.
Book-specific scene scripts remain separate.

**Example from the inspected diff:** Book 6 chapter 1 section 1 changes `../css/notes.css` to `../../css/notes.css`.
Its checks script similarly moves from `../js/checks.js` to `../../js/checks.js`.
Those paths resolve from the chapter directory to the shared notes root.
The original author measured the section main at 880px before and after.
That does not support claiming a visible 720px-to-880px expansion.
Later integration evidence still records Book 6/9 asset-path findings.
The source-layout migration preserves those links rather than silently repairing them.

### Book 3 chapter maps and maths styles

https://github.com/yeungsinchun/paper2everything/pull/138

**Recorded intent:** match chapters 2–7 to the established chapter-map pattern.
Map classes select the existing shared grid rules.
Shared KaTeX CSS supplies maths presentation on maps and summaries.

**Example from the inspected diff:** chapter 2 changes `p2n-page-frame--chapter` to `p2n-page-frame--chapter-map`.
Its direct `.toc` children then match the responsive grid selector.
The historical desktop comparison shows one column becoming the standard two-column map.
The map and summary also add `../../vendor/katex/katex.min.css`.
The change preserves titles, descriptions, and lesson routes.
It does not add a new Book 3 stylesheet or restore secondary chapter navigation.

### Print controls, examples, and digest visibility

https://github.com/yeungsinchun/paper2everything/pull/137

**Recorded intent:** standardize print controls and worked examples, after checking the contradictory digest claim.
`data-notes-export` controls use shared `checks.js` to open the browser print dialog.
Native `details.worked` elements expose existing example content on demand.
The digest hide rule becomes `.p2n-book-index .quick-digest`.

**Example from the inspected diff:** Book 4 section 20-1 gains `Export notes as PDF`.
Book 1 section 3-3 changes its melting-ice example from `div.worked` to collapsed `details.worked`.
The calculation stays inside the disclosure body.
The historical probe found digests hidden on overviews but visible on section pages.
Those section pages did not load the hiding stylesheet.
The change does not invent missing lesson summaries or prove PDF pagination.

### Consistent overview cards

https://github.com/yeungsinchun/paper2everything/pull/136

**Recorded intent:** use Book 1's cards in Books 4, 7, 8, and 9 without inventing educational copy.
Later recorded requests remove Book 9's lone Book map bar and remaining secondary overview rows.
Existing titles, topics, and routes fill the common card structure.
`book-layout.css` owns the wider overview rule without changing `p2n-shell.css`.

**Example from the inspected diff:** Book 9 gains the common label, icon, title, topics, and chevron structure.
Its lone Book map bar disappears.
`main.p2n-book-index` uses the 1040px desktop overview limit and responsive mobile rules.
The final head removes the remaining Book 4/8 secondary rows.
The description identifies replacement images tied to that exact head.
This change does not provide the all-book source template.

### One authoritative layout for every book route

https://github.com/yeungsinchun/paper2everything/pull/139

**Recorded intent:** edit one layout source instead of copying document headers into every book page.
The template removes the secondary chapter row without a per-book switch.
Primary site navigation, chapter cards, and lesson-local idea links remain.

`layout/book.html` owns the document frame.
`layout/books.json` supplies labels and icons.
`layout/pages/` supplies four explicit slots per route: head assets, content, scripts, and trailing comments.
`build-books.mjs` validates slots and computes relative links.
It writes 195 static routes covering nine overviews, ten complete chapters, 36 maps, 104 sections, and 36 summaries.
Book 2 keeps its existing complete chapters.
The compiler rejects stale output and public routes without sources.

**Example:** the Book 1 section 1-1 lesson moves into a content slot under `layout/pages/`.
The compiler writes its original public address with the shared primary header and no secondary chapter row.
Its lesson anchors, questions, and scripts remain in the supplied slots.
The recorded propagation test edits one template copy and rebuilds every route without changing page sources.

Both deployment paths compile before serving static output.
The deployment footer injector still owns commit values.
The landing page, question-bank application, mock application, and question data are outside this book-layout contract.
The delivered branch is not a missing implementation blocker.
Its publication still depends on review and the existing branch sequence.
The migration does not repair inherited asset paths or accepted question data.

## Exact heads, bases, and inherited scope

The following records come from live forge metadata and local Git comparisons.
The full identifiers make the snapshot reproducible after branch tips move.
The file counts use each recorded base's common ancestor with its head.
They do not by themselves identify new feature ownership.

| Change | Head | Recorded base | Base commit | Files |
| --- | --- | --- | --- | ---: |
| Honest pipeline state | `4edf109b83ef0454df68dc25b63cf674080b4a7d` | `main` | `34cdfdae3a570107b5eba78b4e8945cddb0e6484` | 8 |
| Answer corrections | `e4d90fd21322cd453650477bfae1fefe85f541a9` | `main` | `fe70ec67ad2d5b377870c4c6810eefe6bba8d0be` | 44 |
| Page checklists | `8f3de4616355dd4223e045834d331100570f343c` | `main` | `5e525c46dd98a629c211e0f209530037f8bac01e` | 52 |
| Mock exams | `4f6ba32ecad1659dae43178299f8e4af104b1f19` | `fm/p2e-f09-concept-brief-m1` | `8f3de4616355dd4223e045834d331100570f343c` | 10 |
| Shared Book 6/9 assets | `49f4bf529cf3156c7c139e1a922e579b48bb7145` | `fm/p2e-mock-exam-system` | `4f6ba32ecad1659dae43178299f8e4af104b1f19` | 176 |
| Book 3 maps | `6097d8c6caecdb5af26822a568ecd62a84f4a3e3` | `fm/p2e-layout-l11-book69-assets` | `49f4bf529cf3156c7c139e1a922e579b48bb7145` | 12 |
| Section controls | `cdbed235b0039ba500b091e4fbe8e51fdb345068` | `fm/p2e-layout-l05-book3-maps` | `6097d8c6caecdb5af26822a568ecd62a84f4a3e3` | 113 |
| Overview cards | `36d17fac871b3478c134ed553222f29877482ad7` | `fm/p2e-layout-section-chrome` | `cdbed235b0039ba500b091e4fbe8e51fdb345068` | 11 |
| Shared source layout | `8ba58e5cbcfc3c94b28995d04b71c15bd9272dcb` | `fm/p2e-layout-l01-overview-cards` | `36d17fac871b3478c134ed553222f29877482ad7` | 404 |

The answer-correction comparison includes the earlier eight-file harness change.
Comparing its head directly with `4edf109b83ef0454df68dc25b63cf674080b4a7d` yields 36 files.
That comparison also contains an inherited Book 1 `checks.js` copy from a main integration commit.
That copy is not an answer correction.
The earlier DSE answer work supplied whole-page maps and derived keys.
The correction branch preserves those decisions rather than claiming them as new repairs.

### Why the checklist comparison reports 52 files but only eight remain

The answer corrections reached main through squash commit `5e525c46dd98a629c211e0f209530037f8bac01e`.
A squash creates a different commit identity for the combined change.
The checklist branch retains the original correction commits.
GitHub therefore compares from the older common ancestor, `34cdfdae3a570107b5eba78b4e8945cddb0e6484`.

```bash
# Common-ancestor comparison: 52 files, including inherited corrections.
git diff --stat origin/main...origin/fm/p2e-f09-concept-brief-m1

# Direct content comparison: eight files remain different.
git diff --stat origin/main origin/fm/p2e-f09-concept-brief-m1

# Former predecessor comparison: the same eight feature files.
git diff --stat origin/fm/p2db-answer-corrections...origin/fm/p2e-f09-concept-brief-m1
```

The remaining files contain the generator, tests, prompt, shared report rules, brief check, and documentation.
The live base is correctly main.
The latest Firstmate comment explains the inherited comparison:
https://github.com/yeungsinchun/paper2everything/pull/108#issuecomment-6574219202

Do not restore the old answer-correction base.
Do not interpret the 52-file comparison as 44 additional unmerged answer-correction changes.
A future branch-separation task can publish isolated changes while preserving existing heads and old descriptions.
That task requires its own implementation, comparison checks, and review evidence.
This documentation task changes no history, bases, or lower branches.
Replacement authors own replacement descriptions.

## Evidence and remaining limits

| Change | Preserved evidence | Limit at the recorded head |
| --- | --- | --- |
| Honest pipeline state | Historical suite: 167 passed, 15 skipped; pointer checks and before/after output | No fresh exact-head rerun; missing source corpus prevents full rebuild |
| Answer corrections | Source page references, crop figures, recorded correction counts | Full-suite log contains four failures and nine skipped tests; baseline equivalence is author-reported |
| Page checklists | Historical synthetic output, 12 brief tests, 15 leak tests, 14 audit tests, earlier clean site check | Live model returned 404; current-head verification report unavailable; no exhaustive corpus coverage |
| Mock exams | Historical 39 engine tests and browser scenarios at both widths | Pipeline record names `701da635965dfbff08e2201a3ce2dc339dfb4a63`, not the integration head |
| Shared assets | Hosted Book 6/9 section comparisons at both widths | Earlier clean-check claim does not establish the current integration state |
| Book 3 maps | Hosted map and summary comparisons at both widths | Capture descriptions do not bind every image to an exact commit |
| Section controls | Hosted print-control and example comparisons at both widths | No current-head automated test log in the original body; no complete PDF-pagination proof |
| Overview cards | Final Book 4/8 images explicitly name `36d17fac` | Other figures are representative historical evidence; no complete current-head automated log |
| Shared source layout | Author reports eight compiler tests, 195-route checks, and 34 representative routes at both widths | Reports 69 site findings, 38 asset findings, two answer disagreements, existing mobile autoscaling, and no Docker build |

GitHub reported no configured checks for these open changes when inspected.
No configured check is not a passing validation result.
The separate checklist-verification worker is paused on model access.
Its named evidence directory contained a brief and launch brief, but no report or fresh verification logs when inspected.
This documentation task does not duplicate that worker's tests or model calls.

The shared-layout figures sample existing book/page-type pairs.
They do not prove complete interaction, assistive-technology, or print-pagination coverage.
The source-layout branch preserves existing asset exceptions rather than repairing them.
The documentation change must report its own site and quiz command results separately.

## Validation of this documentation change

I ran the required commands on the main-based documentation tree.
The change touches only this file and the link in `ARCHITECTURE.md`.
It changes no product files.

```text
node paper2notes/scripts/ci-check.mjs
ci-check: 254 problem(s) found:
exit 1

node paper2notes/scripts/quiz-audit.mjs
pages 197 | graded MC 341 | TF 101 | short answer 37 | DSE MC slides 273 | DSE LQ slides 232
problems 0 on 0 pages
store cross-check: DSE slides 505 | graded keys 240 in 6 key store(s)
store problems 2
exit 1
```

The site findings comprise 138 copied shared assets and 116 nonshared asset references.
The quiz disagreements both concern Book 1's published key file.
It grades `dse-mc-2013-1` as A while the answer store says B.
It grades `dse-mc-2021-3` as A while the answer store says C.
These results show why corrected pipeline data and published consumers require separate checks.
They do not constitute the requested exhaustive question-to-notes audit.
I did not repair these product findings in this documentation change.

The historical shared-template figures of 69 site findings and 38 asset findings describe that branch, not this main-based tree.
The documentation pull request records whitespace, link, and snapshot checks separately.

## Maintenance contract

Update this document when a base, head, publication mirror, or component boundary changes.
Keep the user's goal before the implementation explanation.
Keep every example tied to its source and evidence type.
Separate a proposed branch feature from functionality already present on main.
Preserve hosted figures and source references when editing descriptions.
Do not turn synthetic fixtures, failed model calls, or historical checks into new success claims.
