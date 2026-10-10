# paper2everything: Product Requirements Document

Status: consolidated from the six PRD parts (PRs #71 to #76), verified against `main`. Items not built yet are marked **(planned)**. Where a requirement and the code disagree, the requirement is the target and the code is the gap to close; gaps are listed in section 12.

Reader: designers, maintainers and agents. This document is self-contained. Deeper design analysis is in [ARCHITECTURE.md](ARCHITECTURE.md); the repo map and commands are in the root [README](../README.md).

## 1. Product summary

paper2everything turns Hong Kong secondary-school source material (HKDSE Physics past papers, question-bank DOCX files, textbook chapters, F.1 maths exam papers) into study artifacts that students and teachers use directly. It is one monorepo with three subprojects. Only one data dependency connects them: `paper2notes` reads `paper2db` output.

| Subproject | What it is | Audience-facing output |
|---|---|---|
| `paper2notes/` | Visual, interactive HKDSE Physics notes (Book 2 Force and Motion, Book 4 Electricity and Magnetism, Book 5 Radioactivity and Nuclear Energy), static HTML with three.js diagrams, KaTeX maths and self-check questions | Public site on Cloud Run: landing `/`, book indexes, chapter notes, DSE question decks, question-bank UI at `/qb` |
| `paper2db/` | Pipeline that splits HKDSE Paper 1A (MC) and 1B (LQ) PDFs into per-question crops, classifies each to a syllabus section, pairs answers and candidate-performance notes, and ingests the QB DOCX banks | Per-section MC and LQ banks, section PDFs, whole-paper reconstructions, QB item data |
| `paper2mock/` | LaTeX F.1 maths mock papers: 10 tests, each with question paper and marking scheme | 20 PDFs, released as two zips on each push to `main` |

Live site: https://paper2notes-152505675251.asia-east2.run.app/

## 2. Goals and non-goals

### Goals

1. **Topic-addressable past-paper practice.** A student revising one syllabus section reaches every relevant DSE question from any year without hunting through whole papers.
2. **Visual, self-checking physics notes.** Motion, fields and decay are shown as interactive or animated diagrams, with checks that give immediate feedback.
3. **Notes tied to exam reality.** Each chapter links the concept to the real DSE and question-bank items that test it. Measurable form: every in-scope question should be solvable from what the notes teach (section 7.4).
4. **Reproducible, auditable pipeline.** Generated artifacts rebuild from tracked source PDFs, hand-tuned overrides and recorded classification decisions.
5. **Static, cheap, dependency-light delivery.** No build step and no backend for the student site; it runs locally with `python3 -m http.server` and in production behind nginx on Cloud Run.
6. **Printable assessment material.** Typeset mock papers with marking schemes.

### Non-goals

- Not an LMS: no accounts, grading, server-side progress or teacher dashboard **(planned, if ever)**.
- Not a replacement for the HKEAA or the textbook publisher. The pipeline derives crops from published papers; the user is responsible for appropriate use of the source material.
- Not a generic PDF-to-anything converter. The pipeline is tuned to HKDSE Physics layouts.
- No native app, no CDN-hosted dependency, no per-chapter visual themes.

## 3. Users and use cases

### 3.1 Users

| User | Situation | Needs |
|---|---|---|
| HKDSE Physics student (S4 to S6) | Learns a chapter, then drills exam questions. Mostly on a phone (390px) between other things, and on a laptop (1280px) at a desk | Visual explanations, self-checks, all past DSE questions for the topic, marking-scheme answers |
| Physics teacher or tutor | Prepares lessons, worksheets, homework | Topic-filtered banks, printable section PDFs, diagrams to project |
| F.1 maths student or teacher | Practises or sets a mock | Complete mocks with marking schemes |
| Content maintainer (internal) | Ingests new papers, QB DOCX or chapters | One pipeline command, review gates for uncertain steps, overrides that survive rebuilds |
| Contributor or agent (internal) | Changes notes UI, visuals or pipeline | CI that validates structure, links and the deployed-commit footer; screenshot-evidence rules for UI PRs |

### 3.2 Value

- **Students:** explanation, interactive diagram and real exam questions for a topic in one place, with no sign-up.
- **Teachers:** topic-indexed banks across years plus printable PDFs, replacing cut-and-paste from scanned papers.
- **Maintainers:** the costly, nondeterministic LLM classification step is tracked (`metadata/*/llm_classifications.json`) and replayable; hand fixes live in tracked override files; every crop is regenerable from `paper/`.

Versus a plain past-paper archive: questions are cut per item, labelled by section and linked from the notes that teach the concept. Versus a plain notes site: diagrams are interactive and chapters end in exam-style practice.

### 3.3 Use cases

| ID | Actor and trigger | Flow | Outcome |
|---|---|---|---|
| UC-1 Learn a chapter visually | Student studying, for example, Book 5 ch. 25 | Open `/book5/`, pick a chapter, step through sections, use the diagrams and inline checks | Understands the concept and sees at once whether answers are right |
| UC-2 Practise DSE questions on one topic | Student who finished a chapter | Open the chapter's DSE deck (for example Book 5 25.1) or `/qb`, filter by topic, work MC and LQ items on real crops, compare with answers | Topic-targeted practice across years |
| UC-3 Build a revision set | Teacher preparing homework | Take the section PDF (`combined.pdf`) from the pipeline, or pick items in `/qb` | Printable single-topic worksheet |
| UC-4 Use a diagram in teaching | Teacher, for example on projectile motion | Open the Book 2 chapter and project the interactive diagram | Manipulable visual instead of a static figure |
| UC-5 Set or sit an F.1 mock | F.1 teacher or student | Download the PDFs from the latest `paper2mock` release | Complete mock with marking scheme |
| UC-6 Ingest a new exam year | Maintainer, new HKDSE paper released | Add PDFs under `paper/{mc,lq,ans}/`, run `./paper2db/pipeline --years <year>`, resolve review gates, commit tracked inputs | Year appears in every section bank and can be published in `notes/dse/` |
| UC-7 Add or revise a chapter | Contributor or agent | Stage intake under `notes/_source/<book-ch>/`, build with the visual-html-notes conventions, run `ci-check.mjs`, open a UI PR with screenshots at both sizes | Chapter ships on the next deploy |
| UC-8 Publish | Maintainer, after merge to `main` | Deploy to Cloud Run, which injects `deploy-commit-footer` in every HTML page | Live site shows its source commit |

### 3.4 Current scope

- Notes: Book 2 (10 chapters), Book 4 (8), Book 5 (3).
- DSE banks: 27 syllabus sections, MC and LQ; tracked published snapshot ships in the image; see [the publication contract](ARCHITECTURE.md#2-dse-crops-paper2db--paper2notes-published-snapshot--local-sync).
- QB: 46 banks, 169 DOCX, 3,847 items (1,881 in scope), surfaced in `/qb` with topic filters and real crops.
- Mocks: F.1 maths, 10 tests.

## 4. Content model (paper2notes)

paper2notes turns source material into static HTML that prioritises visual diagrams, keeps prose minimal and includes concept checks. It is a read-only consumer of `paper2db`. There is no build step.

### 4.1 Hierarchy

```
notes/index.html                      landing: Book 2 / 4 / 5 with inline SVG icons, no redirect
notes/book<N>/index.html              book map: chapter cards and coverage
notes/book<N>/ch<NN>-<slug>/          one chapter
    index.html                        chapter map (Book 2: the whole chapter)
    <sec>.html                        one page per syllabus subsection (Book 4 and 5, e.g. 25-1.html)
    summary.html                      chapter summary (Book 4 and 5)
    css/notes.css, js/                chapter overrides
notes/book<N>/{css,js,vendor}/        shared per-book assets (notes.css, checks.js, diagrams3d.js, math.js, KaTeX)
notes/qb/                             question-bank UI (index.html, crops/, data/)
notes/dse/{mc,lq}/<section>/          published DSE snapshot (tracked, from paper2db)
notes/_source/<book-ch>/              intake; never shown to students, not shipped in the image
```

| Book | Topic | Chapters | Shape |
|---|---|---|---|
| 2 | Force and motion | 10 | One long page per chapter with a collapsible Learning objectives block (`details.lo-block`) |
| 4 | Electricity and Magnetism (§§20 to 24) | 8 | Map, per-subsection pages (`20-1.html`...), `summary.html` |
| 5 | Radioactivity and Nuclear Energy (§§25 to 27) | 3 | Same as Book 4 |

The Book 4 and 5 shape is the target for all books (section 6.8). Book 4 and 5 deliberately omit the syllabus-map block; prior knowledge assumed is force and motion only.

### 4.2 Intake

Each chapter is produced from `notes/_source/<book-ch>/` holding `ocr.md`, `outline.md`, `problems.md`, `images/` and `INDEX.md`, following textbook order. The sources (textbooks, syllabus PDFs, classified DSE banks, QB DOCX) are local and gitignored.

### 4.3 Subsection page anatomy (Book 4 and 5)

1. `header.topbar`: brand (`Book N · Ch.M` and section title) and nav (Map, each subsection, Summary); exactly one `aria-current="page"`.
2. `main`: "Export notes as PDF" button, `.kicker` (section number), `h1`, `.lede`.
3. A sequence of `section.idea` blocks headed `A`, `B`, ... (`.sec-num`), each leading with a visual `figure.fig`, then minimal prose.
4. Concept checks (`js/checks.js`).
5. End-of-section DSE decks: separate MC and LQ quizzes, one item at a time, plus "This section" and "Whole chapter" PDF links. DSE items are not shown as year chips on bullets and not dumped on `summary.html`.
6. `deploy-commit-footer` (injected at deploy, enforced by CI).

### 4.4 Prose building blocks

| Block | Markup | Use |
|---|---|---|
| Definition | `div.def > span.tag "Definition" + p` | Precise term or law, one per idea |
| Tip | `div.tip` | Exam hint or common mistake |
| Worked example | `.worked` | Short numeric example |
| Equation | `.eq` (KaTeX) | Display formulae; `\(...\)` and `\[...\]`, vendored per book, no CDN |
| Table | `table.notes` | Comparisons, for example radiation types |

### 4.5 Student-facing content rules

- Student pages never show intake, OCR, QB numbers, "book cut" or textbook-order ledes. Provenance lives in `_source/` or HTML comments (author scratch text was removed in review passes #31 to #35; do not reintroduce it).
- Every figure has a caption, an `aria-label` on its canvas, and an adjacent check.
- Generated or local content (`notes/**/_local/`) never enters git.

## 5. Product stance

- **Quick digest first.** A student opens a page to recall one idea, not read a chapter. Every subsection must be skimmable top to bottom in one pass: the picture or table says it, the prose only labels it.
- **Visual first, prose last.** Order of preference for an idea: interactive or static figure, then table, then definition block, then short prose.
- **Phone and laptop are both first-class.** Neither is a degraded view.
- **No build, no network dependency.** Vendored KaTeX and local three.js; no runtime fetch that can leave a blank figure.

## 6. UI requirements

Reference implementation: `paper2notes/notes/book5/css/notes.css` (tokens, `.def`, `.stage`, `table.notes`, quiz, breakpoints) and `paper2notes/notes/qb/index.html` (900px breakpoint). The `paper2notes/Paper2Notes Design System/` folder is a separate design-system proposal (friendlier, phone-first revamp); where it differs from this section, treat this section as the contract for the current site and the design system as a direction to reconcile (section 13).

### 6.1 Viewports and layout

Two target viewports are mandatory for every review and every PR: **1280x800 (desktop)** and **390x844 (mobile)**. There is no tablet acceptance target; anything in between must not break.

| Token | Value |
|---|---|
| Page column (`main`) | `max-width: 880px`, centered, padding `1.6rem 1.2rem 4.5rem`; one column, no sidebar |
| Page column, phone (at 620px and below) | padding `1.3rem 0.85rem 3rem`; side gutter never below 0.85rem |
| Prose measure | `.lede` max 44rem; any prose block 45ch to 70ch |
| Figure box | `max-width: 720px`, centered (`figure.fig > .visual`) |
| Breakpoints | 900 (qb grid), 760 (card, flow, pie and TOC grids go single column), 720 (`.pane-pair` single column), 620 (phone chrome). Add no ad-hoc breakpoints per chapter |
| Base type | 16px root on phone; serif body, sans UI (`--serif`, `--sans`, `--mono`) |

Rules:

1. **No page-level horizontal scroll at 390px.** Wide things (tables, long equations, code) scroll inside their own container.
2. Grids and flex rows use `minmax(0, 1fr)` or `min-width: 0` children so one wide child cannot widen the page.
3. Multi-column prose never survives to phone width; two-up panes collapse to one column at 720px.
4. No text below 12px and no body prose below 14px to make something fit. If it does not fit, the box is wrong.
5. Tap targets at least 40x40 CSS px on phone (Prev/Next, Replay, chips, nav links, quiz choices), with at least 8px between adjacent targets.
6. Desktop: sticky `.topbar` with brand and nav on one row. Phone: topbar static, nav a single-row horizontally scrollable strip (`nowrap`, `overflow-x: auto`) so it never wraps into a tall block.
7. Print and PDF: `@media print` hides topbar, Next links, page tools, DSE sections and Replay; `main` is full width; `.idea` does not split across pages. "Export notes as PDF" sits top-right on each subsection and prints the notes themselves; quiz decks link their own PDFs.
8. `prefers-reduced-motion: reduce` disables CSS animation and transitions; three.js loops also honour it by rendering one settled frame.
9. Viewport meta `width=device-width, initial-scale=1` on every page.

### 6.2 Design tokens

Use these; do not invent colours per chapter. Source: `:root` in `notes/book5/css/notes.css`.

| Role | Token | Value |
|---|---|---|
| Page / panel | `--paper` / `--panel` | `#f7f3eb` / `#fffdf8` |
| Ink / muted | `--ink` / `--muted` | `#1b2129` / `#5d6673` |
| Rules | `--rule` / `--rule-soft` | `#d9d2c4` / `#e9e3d6` |
| Accent (teal) | `--accent` / `--accent-deep` / `--accent-soft` | `#0f5c54` / `#0a413c` / `#e4efec` |
| Mark (amber, tips) | `--mark` / `--mark-soft` | `#a8690a` / `#fbf1dc` |
| Right / wrong | `--ok` `--ok-soft` / `--bad` `--bad-soft` | `#1f7a45` `#e6f5ea` / `#a32626` `#fbeaea` |
| Physics semantics | `--alpha --beta --gamma --proton --neutron --electron` | red, blue, gold, red, green, blue |

- Physics colours are semantic and consistent across books (alpha is always red). Never reuse them for decoration.
- Text and UI labels meet WCAG AA (4.5:1). Colour is never the only carrier of meaning: right and wrong also show a mark and a word.
- Figure boxes are plain white, not cream or yellow.
- Shared rules (stage centering, `.hud-label`, `.def`, tables) belong in the book-level sheet, not per-chapter CSS. Today each book carries its own copy of `notes.css` (section 12).

### 6.3 Alignment and centering

This is the area with the most repeated bugs (Book 2 fix series #44 to #53).

**Stages and figures**

- `figure.fig > .visual.play.stage` and `.pane-pair` are capped at 720px and centered (`margin: 0 auto`). A stage must carry the classes `visual play stage` for the rule to apply. A single animation box is framed for roughly 2:1; on a wide page an uncentered or oversized box leaves the apparatus floating in empty canvas.
- Default framing fills the canvas: no tiny apparatus in white space.
- `.pane-pair` is a two-column grid (canvas height 270px) collapsing to one column at 720px.
- Default canvas height 300px (tall 400px).

**HUD labels**

- `.hud-label` is `position: absolute`. A label with no `left`/`top` collapses to the canvas corner and labels stack. This is a blocking bug.
- Every `data-hud` key has its own `left`/`top` (percent of the stage), anchored with `transform: translate(-50%, -50%)` so the coordinates are the label centre, with a card or halo background (white, hairline border) for legibility. Labels are `pointer-events: none` and `white-space: nowrap`.
- Labels stay on their objects during animation (`placeHud`) and never overlap each other at 390px.

**Definition blocks (`.def`)**

- **Left-aligned text, left-anchored block, full reading-column width.** Do not center definition text: centered multi-line prose has a ragged left edge, breaks the reading edge shared with prose, lists and `.tip`, and is hard to scan. Only a single short term line inside a figure-caption context may be centered.
- Look: 1px rule border, 4px accent left border, panel background, `0.7rem 0.9rem` padding, small uppercase `.tag` label. The tag is inline-block and shares a line with the first paragraph (`.def p:first-child` has no top margin; later paragraphs get `0.25rem`).
- The defined term is bold once, at first occurrence. One definition per block; about 4 lines at 880px at most. Longer content becomes a table or list.
- On phone the block stays full column width: no extra side margin beyond the page gutter and no nested narrow column.
- `.def` uses the accent colour and `.tip` uses `--mark`, so they do not carry the same visual weight.

**Equations (`.eq`)**

- Left rule 3px `--rule`, about 1.08rem, KaTeX. Display maths inside blocks and in formula sheets is left-aligned with the block (`.katex-display` and `.katex` forced to `text-align: left`, `0.15rem` margin). A lone key formula may be centered only when it is the sole content of its block.
- Long equations never wrap mid-formula and never widen the page: `.eq` has `overflow-x: auto`. If an equation needs scrolling at 390px, split it into derivation lines.
- Every symbol is defined next to its formula; no formula without units.

**Tip and worked example**

- `.tip`: amber rule, muted fill, one to three lines, for the classic exam mistake only.
- `.worked`: bordered panel, uppercase sans heading, numbered `ol.steps`, one line plus equation per step; the numeric answer and unit are the last, visually distinct line.

**Navigation highlight**

- The topbar highlights exactly one current item (`aria-current="page"`). Book 2 once had a duplicated chapter entry after "Map" that produced two highlights (#44, #45, #47 to #53). A nav lists each entry once and is generated from one list per book.

### 6.4 Line breaks and text flow

1. **Break on meaning, not width.** Keep a quantity with its unit (`5 m/s`, `12 V`) using a non-breaking space or `white-space: nowrap` (`.marks`, short labels).
2. Headings never end a column alone: `break-after: avoid` on h2 and h3; an h3 and its first block stay on one screen at 390px.
3. No `<br>` in prose; use separate blocks or list items. Allowed only in fixed-form items (an equation line, a formula-sheet row).
4. Three or more parallel facts are a list or table, never a comma chain.
5. **Tables:** columns sized to content, the long prose column takes the extra width. On phone `table.notes` is `display: block; overflow-x: auto` with `min-width: 8.5rem` per cell and touch momentum scrolling. No equal-width 100% slabs.
6. Long tokens (URLs, filenames, QB ids) use `overflow-wrap: anywhere` in narrow containers; student pages should rarely contain them.
7. Captions: 0.88rem muted, below the figure, at most two lines on desktop; they say what to look at, not restate the heading.
8. Hyphenation off for headings and labels; `hyphens: auto` only for long prose on phone.

### 6.5 Interactivity

Interactions teach a dependency, not decorate. Test: can the student answer something they could not from a static picture? If not, draw a static SVG.

**Stage (three.js and canvas)**

- Markup: `<div class="visual play stage" data-autoplay data-scene="<name>"><canvas class="scene-canvas" aria-label="..."></canvas>...</div>` inside `figure.fig`. Scenes are shared renderers in `js/diagrams3d.js` with local `js/lib/three.min.js`. Book 4 alone has about 70 visuals.
- **Moving physics animates**: autoplay with a replay control (`.stage-replay`). A static frame is acceptable only when the physics is static. Animation starts when the figure enters the viewport, pauses off screen, and settles to a readable static frame (used for print and reduced motion).
- **Fixed camera by default.** Orbit (drag-rotate) only where depth carries meaning (hand over film, nucleus), declared in `ORBIT_SCENES`; those canvases use `touch-action: none` and a grab cursor. Fixed-camera canvases use `touch-action: pan-y` so they do not trap vertical scroll. No wheel zoom, pinch zoom, dolly, per-box +/- buttons or page-wide scale.
- **Replay** only for finite clips (knockout, ion-pair capture, film blackening), inside the `.stage`, bottom-right, at least 40px tall on phone. Continuous loops get no Replay button, and there is no empty control row.
- **Real controls only**: a slider or step control appears only when it changes the physics being inspected, with a visible label, live numeric readout, keyboard operation (arrow keys), 40px tall on phone.
- WebGL unavailable: fall back to the `aria-label` text and a static figure, never a blank white box.
- Every figure has an `aria-label` and a caption stating the takeaway; scene labels carry text, not colour alone.

**Concept checks (`.check`)**

- Placed after the idea they test, one item at a time: stem, options, answer on demand with a one-line reason per wrong option (each distractor a real mix-up from this section).
- Instant feedback: correct or incorrect state with mark, colour and word. State survives re-render and the feedback space is reserved so the page does not jump.
- Options are full-width tappable rows of at least 40px, keyboard-operable.

**DSE MC and LQ quizzes**

- One item at a time with Prev/Next and progress "n of N". The bar stays within reach on phone.
- The scan scales to column width, never above native resolution; tap opens full size; question image and options are visible without horizontal scroll at 390px.
- Answer and marking scheme reveal on demand; afterwards both the student's choice and the correct one show.
- The header shows the paper id compactly and wraps to its own line at 620px rather than truncating.
- Quizzes are reached only after the notes idea they test.

**Navigation and orientation**

- Every chapter page has prev/next subsection links at the bottom, a way back to the book index, and a stable heading anchor per idea.
- Landing `/` lists the books directly with inline SVG icons; no redirect.
- Progress (last page, quiz choices) may be kept in `localStorage` wrapped in try/catch; the page must work fully without it.

**`/qb` bank UI**

- Filter by book, section and topic as chips; active filters and result count always visible; clear-all is one tap.
- Item cards show the real crop at full column width, topic tags, and year or paper as secondary metadata. Crops are never unreadable thumbnails on phone; tap opens full size.
- Lists page or lazy-load: a 3,000-item bank must not produce a 3,000-node initial DOM.
- At 900px and below the filter panel collapses above the list and the list is one column.

### 6.6 Desktop versus mobile summary

| Concern | Desktop 1280x800 | Mobile 390x844 |
|---|---|---|
| Reading column | `main` 880px, centered | Full width, gutters 0.85rem |
| Top bar | Sticky, brand and nav on one row | Static, nav scrolls horizontally in one row |
| Stages | Single stage 720px centered; `.pane-pair` two columns | Stage fills the column; panes stacked |
| Grids (cards, flow, pie, TOC) | Multi-column | Single column (760px) |
| Tables | Full column | Scroll inside own frame, 8.5rem min cell |
| Equations | Left-aligned in `.eq` | Scroll inside `.eq`, or split into lines |
| Quiz | Inline Prev/Next | Full-width choices, compact reachable Prev/Next |
| Touch | n/a | 3D stages with `data-orbit` use `touch-action: none` |
| Page scroll | n/a | Never horizontal |

### 6.7 Usability lessons (what went wrong, and the rule it produced)

| Lesson | Observed | Rule |
|---|---|---|
| Stage not centered | Figures sat left in a wide column across Book 2 ch1 to 10, fixed per chapter (#44 to #53) | Centering lives in the shared sheet; a new chapter needs zero per-chapter layout CSS |
| HUD labels stacked | Labels collapsed to the canvas corner when the chapter sheet was not linked or a `data-hud` had no rule | Every `data-hud` has an explicit position; chapter pages link the book sheet |
| Duplicate or wrong nav highlight | Two chapters highlighted, or a duplicate chapter entry | One current item; nav generated from one list |
| Definition text centered or boxed narrow | Ragged left edge, hard to scan | Left-aligned, full column width |
| Narrow unreadable prose columns | 20 to 30 characters per line on phone or in review boards | 45ch minimum measure; no fixed 320/360/400px prose boxes (enforced for Lavish boards by `ci-check.mjs`) |
| Equal-width table slabs | Short headers squashed, empty columns stretched | Content-sized columns; scroll inside the table on phone |
| Zoom and orbit on flat diagrams | Dolly and zoom made figures drift and broke framing | Fixed camera; orbit only with depth |
| Replay on looping scenes | Button with nothing to restart | Replay only for finite clips, inside the stage |
| Prose where a picture was possible | Wall-of-text sections | Figure, then table, then definition, then prose |
| Reviewing at one width only | Desktop fine, phone broken | Always both 1280x800 and 390x844 |
| Meta chrome on student pages | OCR and QB references visible | Provenance only in `_source` or comments |

### 6.8 Quick-digest requirements

Each subsection page:

1. A one-screen summary at the top (three to five bullets or a compact table) answering "what must I remember?", visible without scrolling at 1280x800 and within about two phone screens at 390x844.
2. Section anchors (chips or contents) to each idea; the current idea stays identifiable while scrolling.
3. Scan-friendly hierarchy: kicker (amber caps), h2 idea title, then figure. No more than one screen of unbroken text.
4. Key terms and formulas are extractable: each chapter ends with or links to a formula sheet and a definitions list, one line per entry.
5. Progressive disclosure: derivations, worked examples and mark schemes collapsed or on demand; the default view is the digest.
6. Consistent order within an idea across books: Definition, Key formula, Figure, Concept check, Worked example, DSE section.
7. Export as PDF yields a one-to-two page revision sheet per subsection with figures as settled static frames.

### 6.9 Acceptance checklist (per UI change)

Run at **1280x800** and **390x844**, top of page plus the affected section, waiting about 1200ms for stages:

- [ ] No horizontal page scroll at 390; wide content scrolls only inside its own container.
- [ ] Definition blocks left-aligned, full column width; no centered multi-line prose; formulae do not overflow.
- [ ] Figures and `.pane-pair` centered at max 720px; canvases fill their box; no clipped or tiny apparatus.
- [ ] Every HUD label sits on its object, none overlap, none stacked at a corner; each has a distinct `data-hud` position.
- [ ] Tables legible: content-sized columns, phone tables scroll internally.
- [ ] Units attached to values; no orphaned headings; no `<br>` in prose.
- [ ] Tap targets 40px or more; Replay and quiz navigation reachable without precision.
- [ ] Moving scenes animate and replay; controls labelled, keyboard-operable, with a visible physics change.
- [ ] Reduced motion and no-WebGL render a readable static state.
- [ ] Topbar highlights exactly the current chapter, no duplicate chapter link; prev/next links work.
- [ ] Before/after screenshots at both sizes in the PR body; video for motion changes, both sizes unless provably invisible at one.
- [ ] `node paper2notes/scripts/ci-check.mjs` passes, including `deploy-commit-footer` and anchor ids.

## 7. Data products

### 7.1 Classified DSE crops (`paper2db`)

Source PDFs live in `paper/{mc,lq,ans,performance}/`.

- **MC (Paper 1A):** `mc-anchors` (blue dots, human review of `intermediate/mc/<year>/anchor.pdf`), `mc-split` (per-question `qN.png`), `keys` (answer letters and correct-% into `tests/sections/mc/answer_keys.json`: OCR of ans PDFs, patched by `scripts/answer_key_overrides.json`, plus 3/3 unanimous or board-adjudicated keys from `metadata/derived_keys.json` for years with no ans PDF), `classify-mc`.
- **LQ (Paper 1B):** `lq-pages`, `lq-crops` (whole exam-page stack per question, `page_from` to `page_to` from `starts.json`; no within-page crop; trailing data and formula sheets excluded), `lq-answers` (marking-scheme crops, whole marking-scheme pages per question from per-year `tests/reconstructed/lq/<year>/ans_starts.json`), `lq-performance` (candidate-performance notes from `paper/performance/*.md`), `classify-lq`.
- **Both:** `section-pdfs` (per-section A4 `combined.pdf`, plus LQ `answers.pdf` and `performance.pdf`), then `dse-items` (join crops, classifications, MC keys, LQ candidate performance and answer pointers into `paper2db.dse-item.v1` records under `tests/sections/items/`), then `lavish` (quality audit and review HTML).

**Classification.** 27 syllabus sections across Books 1 to 5 (Heat and Gases, Force and Motion, Wave Motion, Ray Optics, Electricity and Magnetism, Radioactivity and Nuclear Energy). Each paper type has an LLM backend (`classify_*_llm.py`, needs `LLM_API_KEY`, `OPENAI_API_KEY` or `TOGETHER_API_KEY`, optional `LLM_BASE_URL`, `LLM_MODEL`) and a keyword fallback (`classify_mc_sections.py`, `classify_lq_keywords.py`). An LQ can belong to several sections; `apply_book5_listings()` lists every Book 5 section a radioactivity LQ tests, and section PDFs include non-primary listings. Decisions are tracked because they are paid and nondeterministic: `metadata/mc/llm_classifications.json` (573 MC items across 2012 to 2026 plus `pp` and `sap`) and `metadata/lq/llm_classifications.json`. `classify-mc` and `classify-lq` replay those decisions by default and call the LLM only for years missing from the metadata; a precomputed JSON can still be applied explicitly with `--from-json`.

**Hand-tuned tracked inputs:** `scripts/overrides_*.json` (MC anchor overrides for 2012, 2015, 2016, 2018, 2019, 2020 and the sample paper `sap`), `scripts/answer_key_overrides.json`, `tests/reconstructed/lq/<year>/ans_starts.json` (per-year hand-verified marking-scheme page map used when OCR orientation or label detection fails), `tests/reconstructed/lq/<year>/starts.json`. Quality bar: at most 5% of questions need manual tuning; `scripts/quality_audit.py --strict` writes `tests/sections/quality_audit.json` counting missing crops, missing classified copies, uncertain flags, tiny crops, incomplete years and override-tuned questions.

**Output.** `section-pdfs` writes `paper2db/tests/sections/{mc,lq}/<NN_Book>/<NN_Section>/` with PNG crops (`YYYY_qN.png` for MC; `YYYY-qN.png` and `YYYY-qN-ans.png` for LQ) and `combined.pdf`, plus CSVs, `answer_keys.json`, `quality_audit.json`. Everything is reproducible from `paper/` with `./pipeline --force --yes`.

### 7.2 Question bank (QB)

169 DOCX files, 46 banks, 3,847 items, of which 1,881 are in scope (Books 2, 4, 5: `QB_201` to `QB_210`, `QB_401` to `QB_408`, `QB_501` to `QB_503`, 21 banks). `metadata/qb/banks.json` is the source of truth for counts.

Four stages (pipeline stages 13 to 16) run when a DOCX tree exists (`$P2DB_QB_ROOT`, else `paper2db/qb/`): `qb-pdf` (LibreOffice, via `qb_manifest.py verify` and `qb_convert.py`), `qb-ocr` (`pdftoppm` and Tesseract), `qb-items` (`qb_items.py` to `qb-pdf/items/<bank>.json` and `crops/`), `qb-audit` (`qb_quality.py` to `qb-pdf/quality.json` and `.lavish/qb-review/index.html`). Run only this track with `./pipeline --only qb-pdf,qb-ocr,qb-items,qb-audit`; `--years` does not apply. Requires `soffice`, `pdftoppm`, `tesseract`.

Tracked inputs: `metadata/qb/banks.json` (census, validated by `scripts/qb_banks.py`) and `metadata/qb/source-manifest.json` (sha256 per DOCX, checked before conversion). DOCX, PDFs, OCR text, crops and review board are never committed.

**Item contract** (`schemas/qb-item.v2.json`, `paper2db.qb-item.v2`; v1 is legacy):

- identity: `id` (for example `PHY15011101`), `bank`, `book`, `chapter`, `seq`;
- classification: `type` (`mc | sq | lq | rq`), `level` (`easy | avg | dif`), `part` (`core | ext`), `marks`, `scope` (`in-scope | out-of-scope`);
- content: `stem` (`text` with Symbol glyphs mapped to Unicode and `[eq:N]` / `[fig:N]` placeholders, `ocr`, `equations`, `has_figure`, `equation_only`), `options` (A to D), `subparts`;
- `answer`: `status` (`present | from-pdf | missing | derived`), `key`, `worked`, `marking[]`, `source`;
- `images.stem[]` and `images.answer[]`;
- provenance: `sources[]` and `source_manifest`;
- `warnings[]` from a closed set: `variant_conflict`, `untagged_source`, `key_missing`, `crop_multi_page`, `zh_gloss`, `from_pdf_key`, `equation_heavy`.

Variants of one item code merge. Answer precedence: `_ans`/`_answer`/`_yes_ans` DOCX, then plain `_e` DOCX with answer blocks, then PDF text layer (`QB_202` MC), then missing.

**Quality gate** (`qb-audit` fails unless all hold): every real DOCX has a PDF (169); 3,847 unique items and 1,881 in scope, matching per-bank counts; every item has a stem crop; per-bank `answer.status == present` counts match the expected key-status table; LibreOffice versus Quartz PDF render check (page count within ±1, every Symbol-font glyph present in the PDF text layer with no Symbol private-use code points left). A local review board samples 5% of crops per bank.

### 7.3 Staging for the web UI

`paper2db/qb-web-ui-staging/` is the tracked, UI-ready snapshot. Only crops and metadata are committed; `.docx` and full PDFs never are (`.gitignore` excludes `*.pdf`).

| Snapshot | Contents | Counts |
|---|---|---|
| `qb/` | `items/<bank>.json`, `items/index.json`, palette-optimised `crops/*.png`, `manifest.json` (per-bank counts and sizes, warnings, tool versions, missing crops) | 3,847 items, 46 banks (generated 2026-09-29) |
| `dse-mc/` (`stage_dse_mc.py`) | `crops/<year>/qNN.png` and `.webp`, `index.json` (year, question, sections, reason, answer option and %, image paths, warnings), `sections.json`, `stats.json`, `manifest.json` | 537 items, 2012 to 2026 plus `pp` (36 for 2012, 2013 and `pp`, 33 otherwise); the classification file covers 573, and only `sap` is not staged |
| `dse-lq/` (`stage_lq_qb_web_ui.py`) | whole-page question PNGs `YYYY-qN.png`, answer crops `YYYY-qN-ans.png`, per-section copies, `candidate_performance.json`, `manifest.json`, `index.json`, `raw/` | 170 questions; 144 with answer crops (26 missing); 144 with performance notes (26 missing) |
| `book2-db/` (`build_book2_db.py`) | `book2.json` (every in-scope problem, one record each, MC vs LQ and by topic), `summary.json` (counts per topic, kind and source), `audit.json` (every integrity check with its failing ids) | 1,068 records: DSE 150 MC + 45 LQ, QB 502 MC + 371 written (`sq` 203, `rq` 13, `lq` 155) |

Missing data is flagged per item (`warnings`, `missing_flags`), never silently dropped. MC warnings: `missing_answer`, `missing_percentage`, `uncertain_classification`, `missing_crop`. Missing performance notes are expected for 2026, `pp`, and any question whose performance markdown has no Section B note.

For the published DSE snapshot and its availability guard, see [the publication contract](ARCHITECTURE.md#2-dse-crops-paper2db--paper2notes-published-snapshot--local-sync).

### 7.4 Answerability harness (`paper2notes/scripts/audit/`)

Question: for each in-scope QB item — and for each in-page DSE deck question, which is audited as an item rather than read as notes — can a student who has read **only** the relevant notes pages, plus a fixed allowlist of Force-and-Motion and maths prior knowledge, reach the marked answer? Output is a per-item verdict, a per-section coverage figure and a list of missing concepts to write into the notes; non-passing results carry `pointer_candidates` (DOM-id anchors where the notes could teach them).

The harness is local-only. Needs Node.js, the `pi` LLM CLI (`PI_BIN` overrides), Google Chrome for figure capture, the chapter pages and `paper2db/qb-pdf/items/<bank>.json`. Banks and book layouts are listed in `scripts/audit/books.json`. Outputs go to gitignored `.audit/` (override the root with `P2E_AUDIT_ROOT`); they contain QB stems and crops and must never be committed or pasted into `notes/` or a PR. Item ids are safe to cite.

Stages:

1. **Bundle** (`bundle.mjs`, `bank-pages.mjs`): extract student-visible content (every idea block, every figure with three frames for animated ones) into `notes.md` plus `fig-*.png` at DPR 2, with anchors such as `[§25-1.B #knockout]`, taken only from real page DOM ids and page-qualified (`[§book2/ch02.A #quiz]`, `[§25-1.lo #lo-heading]`; a figure without a DOM id gets no anchor). The `section-dse` decks are stripped: they are audited as items instead. A bank's "B" bundle is cumulative: all earlier chapters of the same book plus its own.
2. **Map** (`map.mjs`): one call per item maps it to a section id with `confidence` and `secondary` sections, without solving; banks map in parallel under one shared concurrency pool. Confidence below 0.6 falls back to all sections of the chapter. DSE deck items need no model call: the deck page is their section. `--items id,id` and `--page 25-1` restrict which items are (re)mapped; previously mapped items of the bank are kept in the mapping file.
3. **Solve** (`solve.mjs`): a stateless, tool-less process sees only the bundle, the PRIOR allowlist (`P-FM-01` to `18`, `P-MA-01` to `06`, `P-GIVEN`) and the stem image, never the answer. Each step cites exactly one source (`given`, `math:`, `prior:`, or `notes:<anchor>` with a verbatim quote of 25 words or fewer). Missing facts go in `missing[]`; `self_verdict` is `solved | partial | blocked`. Logarithms and exponentials are deliberately not in PRIOR, so Book 5 must teach them.
4. **Judge** (`judge.mjs`): a deterministic quote check (token coverage at least 0.9, prior ids exist); an LLM judge that sees the key and marking scheme and returns per-step `supported | unsupported | prior-leak`, per-point `earned | lost-knowledge | lost-reasoning | lost-arithmetic`, and `cause` in `ok | knowledge-gap | reasoning-error | item-defect | key-defect`; and a leakage check (8-gram and number-tuple overlap between stem and notes).
5. **Orchestrate** (`run.mjs`): two tiers per item, **S** (mapped section plus `summary.html`) and **B** (cumulative bank bundle), K samples per tier (default 3). A tier passes when at least `ceil(2K/3)` samples have `cause == ok`, a passing quote check, all steps supported, and a correct MC answer or all marking points earned. `--dse-section 25.1|all` loads the section's deck questions as `DSE_<section>` items (MC items get marks 1; LQ items carry no marks); an item whose deck image cannot be resolved is skipped with `missing_evidence` and counted as must-fix by coverage.
6. **Report** (`report.mjs`): `.audit/coverage.json` and a local coverage board `.audit/lavish/qb-audit/index.html`. The item shape (`missing_concepts` from the tiers, the must-fix test) is exported so the brief stage reuses it unchanged.

CLI: `node paper2notes/scripts/audit/audit.mjs <run|map|bundle|report|verify>`; `run` takes `[--bank QB_501 | --all | --dse-section 25.1|all] [--fixture <file>] [--items id,id] [--page 25-1] [--concurrency 8] [--k 3] [--regress]`, then `report` (`--coverage-only` skips the board). `--all` covers the 21 in-scope banks; `--items` and `--page` narrow which items are solved after mapping (the mapping file keeps the full inventory). `verify` checks the local artefacts for consistency: result verdicts and sections, mappings against the bank's pages, `pointer_candidates` whose anchors are real DOM ids, and bundles free of DSE decks and of anchors that are not DOM ids. The committed `fixtures/QB_501.json` is a small fixture, not a substitute for the real bank.

7. **Brief** (`paper2notes/scripts/brief.mjs`): one brief per page, from the audit results only. `--page <path relative to paper2notes/notes>` (a section id such as `25.1`, `25-1` or `book2/ch03` also works) selects the page and, through `books.json`, the bank that owns it; every audit item whose `section` is that page's section is the page's evidence. One `pi` call groups the page's `missing_concepts` into named clusters; a concept the call does not name keeps its own cluster. Learning-objective ids are read from the page's own `lo-block` (its id, or the id its `aria-labelledby` names, plus the bullet position), chosen by the model's 1-based indices when they exist and otherwise by word overlap with the bullet; a concept with no matching objective, or a page with no `lo-block`, says so rather than dropping the concept. Clusters sort must-fix first (the rule above, applied to the page's items), then by the number of page items that miss them, then by concept count and label. `briefs/<page>.json` (`paper2everything.concept-brief.v1`) and `briefs/<page>.md` are rendered from one computation, and both are leak-checked with `paper2notes/scripts/leak-check.mjs` before anything is written: a finding prints the level and item and writes nothing. Item references are `BANK#<inventory index>`, because bank item ids and deck slide ids are protected ids for leak-check rule L4; the real ids stay in `.audit/results/<bank>/<id>.json`. `--no-model`, `--dry-run`, `--results`, `--out` and `--timeout` are documented in `--help`.

| Verdict | Condition |
|---|---|
| `pass` | tier S passes, no leakage |
| `pass-leaked` | tier S passes but stem and notes overlap heavily |
| `cross-ref` | only cumulative tier B passes: the knowledge exists but not in the mapped section |
| `gap` | a sample reports `knowledge-gap`; missing concepts are collected |
| `reasoning` | fails without a knowledge gap |
| `defect` | any tier-S sample judged `item-defect` or `key-defect` |
| `error` | execution failure in a tier; never cached |

**Completeness rule.** A bank or section is complete when every inventory item has a result and a `part`, at least 95% of `core` items are `pass`, `pass-leaked` or `cross-ref`, and there is no must-fix failure: any missing-evidence item, any failing item worth 4 or more marks that maps to a known section, any failed DSE long-question item (DSE LQ items carry no marks), or any missing concept cited by two or more failing core items. Overall completeness requires every bank complete.

**Reproducibility.** Results cache under `.audit/cache/` keyed on item, image and bundle sha, mapping, prompt sha, code sha, model, `pi` version and K; reused only if the key matches and the result is not `error`; `--regress` recomputes. The model is pinned in code (`meta/muse-spark-1.2-contributor`; solver thinking high, judge thinking max).

### 7.5 Interfaces

| Producer | Consumer | Contract |
|---|---|---|
| `paper2db` QB stages | harness, `/qb` UI | `paper2db.qb-item.v2`; `qb-pdf/items/<bank>.json`, `qb-web-ui-staging/qb/items/` |
| `paper2db` MC and LQ stages | `/qb` UI, notes DSE decks | `qb-web-ui-staging/dse-{mc,lq}/index.json`, `sections.json`; `paper2notes/notes/dse/` snapshot |
| notes HTML | harness | real DOM-id anchors read by `bundle.mjs`; `section-dse` decks stripped from bundles and parsed as items (`dse.mjs`); page layout per `books.json` — `notes/book2/chNN*/index.html` (chapter-index) or `notes/book*/chNN*/<n>-<n>.html` and `summary.html` — read by `bank-pages.mjs` |
| harness | maintainers | `.audit/coverage.json`, verdict per item id, `briefs/<page>.json` and `briefs/<page>.md` — missing concepts clustered and ranked, with learning-objective ids from the page |

## 8. Pipeline

Entry point `./paper2db/pipeline` (`--list-stages` prints all). Setup: Python venv, `pip install -r paper2db/requirements.txt`, `tesseract` on `PATH`.

Stages in order: past paper `mc-anchors`, `mc-split`, `lq-pages`, `lq-crops`, `lq-answers`, `keys`, `classify-mc`, `lq-performance`, `classify-lq`, `section-pdfs`, `dse-items`, `lavish` (12 stages); QB `qb-pdf`, `qb-ocr`, `qb-items`, `qb-audit` (4 stages, run when a QB DOCX tree exists).

| Flag | Effect |
|---|---|
| `--years 2025` | One past-paper year |
| `--from <stage>` | Resume mid-pipeline |
| `--only a,b` | Run only the named stages |
| `--force` | Rebuild even when outputs exist |
| `--yes` | Print review-gate paths without waiting for Enter |
| `--list-stages` | List stages and exit |

Review gates (MC anchors, optional LQ crops, uncertain classifications) pause for a human unless `--yes`.

**DSE wiring.** `paper2notes` is a read-only consumer of `paper2db`.

- Production: the tracked snapshot `paper2notes/notes/dse/{mc,lq}/<NN>/` is staged to `_local/dse/` (and each `book*/_local/dse/`) by the `Dockerfile`. HTML decks render in production without running the pipeline.
- Local preview: `./paper2db/pipeline --force --yes`, then `./paper2notes/scripts/sync-dse.sh`, then `python3 -m http.server --directory paper2notes/notes`. Pages reference `../_local/dse/...`.

**Tests.** `paper2db/tests/test_*.py` is a `unittest` suite (run `python -m unittest discover -s paper2db/tests`, fixtures only). No workflow runs it.

## 9. Repository structure and tracked versus generated

One repository, three subprojects: paper2notes and paper2db are mutually dependent (paper2notes reads paper2db DSE crops; `paper2db/scripts/leak_fingerprints.py` reads paper2notes' published mirrors and writes its fingerprints), and paper2mock is independent. See [ARCHITECTURE dependency directions](ARCHITECTURE.md#dependency-directions-between-subprojects).

| Path | Purpose | Runtime |
|---|---|---|
| `paper2db/` | Past-paper crops, section banks, QB stages | Python 3 (PyMuPDF, Pillow, Tesseract, optional LLM API) |
| `paper2notes/` | Student site (`notes/`), CI check, deploy scripts, Cloud Run config | Static HTML/CSS/JS (vendored three.js, KaTeX); Node for checks; Docker and nginx for hosting |
| `paper2mock/` | `f1/test1/<1..10>/{question-paper,marking-scheme}/` | LuaLaTeX via latexmk |
| `.github/workflows/` | `ci-notes`, `ci-pointers`, `ci-paper2db`, `compile-mocks`, `deploy-notes` | GitHub Actions |
| `docs/` | `ARCHITECTURE.md`, this PRD, board notes | Markdown |
| `paper2notes/Paper2Notes Design System/` | Design-system proposal: tokens, components, UI kits | HTML, CSS, JS |

| Tracked (edit and commit) | Generated or local (never `git add`) |
|---|---|
| `paper2db/paper/**` source PDFs | `paper2db/intermediate/`, `paper2db/tests/sections/**`, `paper2db/tests/reconstructed/**` (except `lq/*/starts.json` and `lq/*/ans_starts.json`) |
| `paper2db/metadata/*/llm_classifications.json`, `metadata/qb/{banks,source-manifest}.json` | `paper2db/output/`, `paper2db/classified/` (legacy), `.lavish/` boards |
| `paper2db/scripts/overrides_*.json`, `answer_key_overrides.json`, `tests/reconstructed/lq/*/starts.json`, `tests/reconstructed/lq/*/ans_starts.json` | `paper2db/qb/`, `paper2db/qb-pdf/` (local inputs and outputs; the QB DOCX canonical location, but gitignored) |
| `paper2db/qb-web-ui-staging/` (crops and metadata only) | `paper2notes/notes/**/_local/` |
| `paper2notes/notes/` including the `dse/` snapshot and `_source/` | `.audit/` harness output |
| `paper2notes/scripts/leak/` (`fingerprints.v1.json.gz` + `baseline.json`) | |
| `paper2mock/**` LaTeX sources | Compiled mock PDFs (built and released by CI) |

## 10. CI, deploy and mocks

| Workflow | Trigger | What it does |
|---|---|---|
| [`ci-notes`](../.github/workflows/ci-notes.yml) | Triggers and commands belong to the workflow | Notes and DSE availability checks; see [the static check](../paper2notes/scripts/ci-check.mjs) and [anchor rules](../paper2notes/anchors/README.md). |
| `ci-pointers` | PR and push to `main`; path filters in the workflow | `python3 scripts/pointers.py check`, `coverage` and `python3 -m unittest tests.test_pointers` |
| `ci-paper2db` | PR and push to `main` touching `paper2db/**` or itself | `python3 -m unittest tests.test_dse_items tests.test_pointers`: dse-items records and answer-pointer join |
| `compile-mocks` | PR touching `paper2mock/**` or itself; every push to `main` | Matrix LaTeX build of 20 documents; artifacts per PR; release on `main` |
| `deploy-notes` | Push to `main` touching `paper2notes/notes/**`, `paper2notes/deploy/cloudrun/**`, `.dockerignore`, or itself; manual dispatch | Cloud Run deploy |

Only the workflows under `.github/workflows/` run; nested copies under `paper2notes/` and `paper2mock/` never do.

**Static notes checks:** [`ci-check.mjs`](../paper2notes/scripts/ci-check.mjs) owns the check inventory.
Publication and DSE availability rules belong to [Architecture §2](ARCHITECTURE.md#2-dse-crops-paper2db--paper2notes-published-snapshot--local-sync).
Anchor rules belong to the [anchors README](../paper2notes/anchors/README.md).

Not in CI: the Book 5 Puppeteer interactive tests (hard-coded macOS Chrome path), the DSE-quiz test (needs local scans), `sync-dse.sh`, the paper2db pipeline and the rest of its suite (`ci-paper2db` runs only `test_dse_items` and `test_pointers`), the audit harness.

**Deploy.** `deploy-notes.yml` authenticates with Workload Identity Federation (secrets `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOYER_SERVICE_ACCOUNT`; identifiers only, no keys), serialised by the `deploy-cloudrun` concurrency group in the `production` environment, then runs `paper2notes/deploy/cloudrun/deploy.sh`: resolve the 6-char `HEAD`, inject the footer via `scripts/inject-commit-footer.mjs --commit <sha>`, build the Dockerfile with the repo root as context, push to Artifact Registry `asia-east2-docker.pkg.dev/paper2notes-site/paper2notes/site`, `gcloud run deploy` service `paper2notes` in `asia-east2` (project `paper2notes-site`), then check that `/`, `/book2/`, `/book4/`, `/book5/` return 200. The root `.dockerignore` admits only `paper2notes/notes/` and `nginx.conf`, minus `_source/`, `**/_local/`, `*.test.mjs`. nginx serves static files on port 8080. One-time setup is `provision.sh`; access model and rollback are in `paper2notes/deploy/cloudrun/README.md`.

**UI PRs.** A PR that changes paper2notes HTML, CSS, JS, visuals, animations or stage loads `.agents/skills/paper2everything-ui-screenshot/SKILL.md` first and includes before/after screenshots at **both** 1280x800 and 390x844 (one pair per size, same URL, scroll and viewport, attached with `gh --attach` so they render inline; one size only is incomplete). A demo video, if any, is also recorded at both sizes unless provably invisible at one (`.agents/skills/paper2everything-pr-video/SKILL.md` §5.1 and §6).

**Mocks.** `paper2mock/f1/test1/<1..10>/` each hold two independent LaTeX projects, `question-paper/` (`main.tex`, `config.tex`, `style.tex`, `cover.tex`, `content.tex`, `marks-table.tex`, `questions/qN.tex`) and `marking-scheme/` (`main.tex`, `config.tex`, `style.tex`, `content.tex`, `questions/`). `compile-mocks.yml` runs one matrix job per project (20, named `mock<N>-question-paper` and `mock<N>-marking-scheme`) with `xu-cheng/latex-action@v3`, `root_file: main.tex`, `-interaction=nonstopmode -halt-on-error`, `latexmk_use_lualatex: true`, copies `main.pdf` to `<name>.pdf` and uploads an artifact. On push to `main` the `release` job zips `question-papers.zip` and `marking-schemes.zip` into release `build-<sha>` (`ncipollo/release-action`, pinned by SHA, needs `contents: write`); PRs get artifacts only. The `main.tex` headers mention `pdflatex`, but CI uses LuaLaTeX, so a new mock must build under LuaLaTeX. Adding a mock means adding the directory and two hand-listed matrix entries; a mock without an entry is never built.

## 11. Success criteria and acceptance

1. Every DSE question in a covered year is reachable from at least one section bank; unclassified or low-confidence items are surfaced by audit output, not dropped.
2. Every chapter page passes `ci-check.mjs` (structure, relative links, commit footer, leak check, anchor ids).
3. Interactive checks give correct feedback for every authored problem.
4. The pipeline rebuilds all generated artifacts from tracked inputs on a clean checkout.
5. `./paper2db/pipeline --only qb-pdf,qb-ocr,qb-items,qb-audit` passes the section 7.2 gate with counts from `banks.json`; `qb-web-ui-staging/qb/manifest.json` reports 3,847 items and 46 banks and lists every missing crop.
6. DSE staging counts reconcile (537 MC for 2012 to 2026 plus `pp`, 170 LQ) with missing answers, notes and crops flagged per item.
7. A harness run on a bank yields one result per inventory item and `report.mjs` applies the section 7.4 completeness rule.
8. Mock PDFs compile in CI and release on each push to `main`.
9. No QB stem, crop, DOCX, full PDF or `.audit/` output is tracked in git.
10. Every UI change meets the section 6.9 checklist at both sizes.

## 12. Known gaps

- **No automated layout check.** The alignment rules (stage centering, no stacked `.hud-label`, single `aria-current`, left-aligned `.def`, no `<br>` in prose, no fixed narrow prose widths) are written-down forms of existing CSS and the Book 2 fix series. A layout test or `ci-check.mjs` lint would enforce them.
- **Per-book CSS copies.** Book 2, 4 and 5 each have their own `notes.css`; chapter overrides were the source of repeat bugs. Consolidate to one sheet or generate per-book copies from one source.
- **Book 2 shape.** Book 2 is one long page per chapter; the quick-digest and anchor requirements (section 6.8) are the target and apply fully only to Book 4 and 5 style pages.
- **Unchecked DSE contract.** Nothing verifies that notes references exist in the snapshot or agree with paper2db classification; the snapshot is synced by hand. `ci-check.mjs` skips `_local/` links.
- **paper2db mostly untested in CI.** `ci-paper2db` runs only the dse-items and answer-pointer unit tests, and `ci-notes` runs `leak_fingerprints.py --check`; the pipeline itself and the rest of its suite are not run in CI.
- **Interactive test coverage.** Book 5 ch. 1 to 2 have a browser test (needs Google Chrome); Book 4 and Book 5 ch. 3 have none.
- **`compile-mocks` push-path cost.** All 20 LaTeX jobs and a release run on every push to `main`, including notes-only merges; the matrix is hand-written.
- **Dead config.** Nested `paper2notes/.github/workflows/`, `paper2mock/.github/workflows/` and `paper2notes/.dockerignore` are unused; `ci-notes.yml` still path-filters on the nested workflow path.
- **Harness scope.** Bank ids and bank-to-chapter mapping live in `scripts/audit/books.json`; the model id is hard-coded in the scripts; it is not in CI (paid LLM, `pi`, Chrome). The brief stage runs on `paper2notes/scripts/brief.mjs` and is covered by `paper2notes/scripts/brief.test.mjs` in CI (no model call: the tests drive a fake `pi`). DSE deck questions are audited only on the `--dse-section` path, and DSE LQ items have no marking scheme in the harness when no tracked answer crop exists. QB items carry no section classification beyond `bank` and `chapter`, and the harness mapping is not written back to `paper2db`.
- **DSE staging coverage.** `dse-mc` stages 537 of 573 classified MC items (2012 to 2026 plus `pp`); only `sap` is not staged (mc-anchors cannot locate its question labels).
- **`/qb` UI** is described by requirements here but has no tracked automated test.

## 13. Risks and open questions

- **Source-material rights.** Past papers and QB documents are third-party. Publication scope (public versus local-only) needs an owner decision; the repo already keeps generated crops gitignored except the curated snapshot.
- **Classification accuracy.** LLM and keyword classification can mis-tag; review gates and overrides mitigate it but the coverage of manual review is open.
- **Syllabus scope.** Only Books 2, 4, 5 are covered; Books 1 and 3 and other subjects are undecided **(planned)**.
- **Learner state.** Progress and accounts are out of scope; self-checks are stateless.
- **F.1 maths mocks:** keep in this product or present as a separate offering for a different audience?
- **Shared stylesheet:** one `notes/css/notes.css` for all books, or per-book copies generated from one source?
- **Lint:** add mechanical-rule lint to `ci-check.mjs` (every `data-hud` has a position rule, no `<br>` in prose, no fixed narrow prose widths)?
- **Phone quiz navigation:** sticky bottom bar, or inline under the item?
- **Dark mode:** out of scope, or a required token pass?
- **Design system:** how far does the `paper2notes/Paper2Notes Design System/` revamp (friendlier, phone-first, gamified, wrong answers shown as nudges rather than red) replace the tokens and rules in section 6, and which of the two owns the contract?
