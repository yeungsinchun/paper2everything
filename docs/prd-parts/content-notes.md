# PRD part: Content model and notes (paper2notes)

Self-contained part for the PRD/README consolidation. Scope: the physics notes
content model, chapter structure, visual-first HTML notes, definition-block and
stage alignment/centering lessons, and mobile/desktop requirements. Everything
below is derived from the tracked `paper2notes/` tree; file paths are relative
to the repo root.

## 1. Purpose

paper2notes turns HKDSE Physics source material into static HTML notes that
prioritise interactive and non-interactive visual diagrams, keep prose minimal,
and include concept checks. It is a read-only consumer of `paper2db` (DSE
question data) and is served as static files (nginx on Cloud Run). No build
step: open an `index.html` in a browser.

## 2. Content model

### 2.1 Hierarchy

```
notes/index.html                      landing: lists Book 2 / 4 / 5 (inline SVG icons, no redirect)
notes/book<N>/index.html              book map: chapter cards + coverage
notes/book<N>/ch<NN>-<slug>/          one chapter
    index.html                        chapter map
    <sec>.html                        one page per syllabus subsection (Book 4/5, e.g. 25-1.html)
    summary.html                      chapter summary (Book 4/5)
    css/notes.css, js/                chapter overrides
notes/book<N>/{css,js,vendor}/        shared per-book assets (notes.css, checks.js, diagrams3d.js, math.js, KaTeX)
notes/_source/<book-ch>/              intake, never shown to students, not shipped in the image
notes/dse/{mc,lq}/<section>/          published DSE scan snapshot (tracked, read from paper2db)
```

| Book | Topic | Chapters | Shape |
|------|-------|----------|-------|
| Book 2 | Force & motion | 10 (position and displacement through gravitation) | One long page per chapter (`index.html`) with a Learning objectives block |
| Book 4 | Electricity and Magnetism (ch4.pdf §§20-24) | 8 | Map + per-subsection pages (`20-1.html`...) + `summary.html` |
| Book 5 | Radioactivity (ch5.pdf §§25-27) | 3 | Same as Book 4 |

### 2.2 Intake

Each chapter is produced from `notes/_source/<book-ch>/` containing `ocr.md`,
`outline.md`, `problems.md`, `images/` and `INDEX.md`. Textbook order is
followed. Sources (Active Physics textbooks, syllabus PDFs `ch1-5.pdf`,
classified DSE banks, QB_50x) are local and gitignored.

### 2.3 Page anatomy (Book 4/5 subsection page)

1. `header.topbar`: brand (`Book N · Ch.M` + section title) and nav
   (Map, each subsection, Summary); the current page carries a single
   `aria-current="page"`.
2. `main`: "Export notes as PDF" button (prints the notes themselves),
   `.kicker` (section number), `h1`, `.lede`.
3. A sequence of `section.idea` blocks, each headed `A`, `B`, ... (`.sec-num`),
   leading with a visual `figure.fig`, followed by minimal prose blocks.
4. Concept checks (`js/checks.js`).
5. End-of-section DSE decks: separate MC and LQ quizzes, one item at a time
   with Prev/Next, plus "This section / Whole chapter" PDF links. DSE items are
   not shown as year chips on bullets and not dumped on `summary.html`.
6. `deploy-commit-footer` (injected at deploy; enforced by CI).

Book 2 chapter pages keep a collapsible "Learning objectives" block
(`details.lo-block`, "Students should be able to" from the syllabus). Book 4/5
deliberately omit the syllabus-map block and any "How this book maps..."
block (#37/#38): prose is limited to tables, definition blocks and checks, and
prior knowledge assumed is force and motion only.

### 2.4 Prose building blocks

| Block | Markup | Use |
|-------|--------|-----|
| Definition | `div.def > span.tag "Definition" + p` | Precise term or law, one per idea |
| Tip | `div.tip` | Exam hint or common-mistake note |
| Worked example | `.worked` | Short numeric example |
| Equation | `.eq` (KaTeX) | Display formulae; `\(...\)` / `\[...\]` delimiters, vendored KaTeX per book, no CDN |
| Table | `table.notes` | Comparisons (e.g. radiation types) |

### 2.5 Student-facing content rules

- Student pages must not show intake, OCR or QB provenance. Keep provenance in
  `_source/` or HTML comments. Author scratch text was removed in the
  adversarial review passes (#31-#35); do not reintroduce it.
- Every figure has a caption, an `aria-label` on its canvas, and an adjacent
  check.
- Generated/local content (`notes/**/_local/`) never enters git. The tracked
  DSE snapshot is `notes/dse/`; local preview needs
  `paper2notes/scripts/sync-dse.sh` (see root `AGENTS.md`).

## 3. Visual-first requirements

1. Each idea opens with a visual, not prose. Prefer animation over text;
   prose stays minimal.
2. Figures are local three.js scenes (`js/lib/three.min.js`, `js/diagrams3d.js`,
   no build), declared in markup as
   `<div class="visual play stage" data-autoplay data-scene="<name>"><canvas class="scene-canvas" aria-label="..."></canvas>...</div>`.
   Scenes are shared renderers consolidated in `diagrams3d.js` (#6); Book 4 has
   about 70 visuals including 3D field, circuit and motor stages.
3. Every visual that represents motion must animate (autoplay, with a replay
   control `.stage-replay`); a static frame is only acceptable when the physics
   is static. Only real simulation controls are shown.
4. Labels over a canvas use `.hud-label` with `data-hud="<key>"`; each key must
   have an explicit position (see 4.1).
5. `prefers-reduced-motion` is honoured in CSS.
6. Checks (`js/checks.js`) give immediate feedback per concept; DSE decks are
   one item at a time.

## 4. Alignment and centering lessons (definition blocks, stages, labels)

These rules come from the Book 2 fix series (#44-#53) and the Book 5 baseline
they were brought up to.

### 4.1 Stage and HUD labels

- **Stage centering.** A single animation box is framed for a 2:1 view; on a
  wide page the apparatus floats in empty canvas. Rule:
  `figure.fig > .visual.play.stage { max-width: 720px; margin: 0 auto; }`.
  Book 2 chapters had to get this per-chapter override (`ch*/css/notes.css`)
  because they lacked the Book 5 behaviour. A stage must also carry the classes
  `visual play stage` for the rule to apply.
- **HUD label stacking.** `.hud-label` is `position: absolute`. A label with no
  `left`/`top` collapses to the canvas corner and labels stack on top of each
  other. Every label needs its own `left`/`top` per `data-hud` (percentages of
  the stage), anchored with `transform: translate(-50%, -50%)` so the coordinates
  mean the label centre, and a card/halo background so it stays legible over the
  scene. Labels are `pointer-events: none` and `white-space: nowrap`.
- **Side-by-side panes.** `.pane-pair` is a two-column grid (canvas height
  270px); it collapses to one column at `max-width: 720px`.

### 4.2 Definition blocks and equations

- A definition block is a **left-aligned** callout: 1px rule border, 4px
  accent left border, panel background, `0.7rem 0.9rem` padding, a small
  uppercase `.tag` label, and paragraph text flowing left. It is a full-width
  block in the reading column (not floated and not centered text): centering
  the body text of a definition breaks the reading edge shared with prose,
  lists and `.tip`.
- Keep the tag and first paragraph on the same line (`.tag` is inline-block;
  `.def p:first-child` has no top margin); subsequent paragraphs get
  `0.25rem` top margin.
- Display maths inside blocks is left-aligned with the block, not centered:
  `.formula-sheet .eq .katex-display` and its `.katex` are forced to
  `text-align: left` with tight `0.15rem` margin. `.eq` itself carries a 3px
  left rule and `overflow-x: auto` so a long formula scrolls inside the block
  instead of widening the page on mobile.
- Do not use the same visual weight for `.def` and `.tip`: definitions use the
  accent colour, tips use the `--mark` colour.

### 4.3 Header highlighting

The topbar must show exactly one `aria-current="page"` link. Book 2 chapters had
a duplicated chapter entry after "Map" that caused two highlighted items (#44,
#45, #47-#53); a chapter nav lists each entry once.

### 4.4 Checklist for any notes page change

- One highlighted nav item; no duplicate chapter link.
- Every stage centered, max 720px wide (single) or two panes (pair).
- No stacked `.hud-label`; all labelled with distinct `data-hud` positions.
- Definition/tip/eq blocks left-aligned with the prose edge; formulae do not
  overflow the viewport.
- Moving scenes animate and replay.

## 5. Mobile and desktop requirements

Both **1280x800 (desktop)** and **390x844 (mobile)** must be verified for any
UI change (see `.agents/skills/paper2everything-ui-screenshot/SKILL.md`; UI PRs
require before/after screenshots at both sizes, and video for both unless
provably invisible).

Desktop:

- Reading column `main` max-width 880px; lede max-width 44rem.
- Sticky `.topbar` with brand + nav on one row.
- Single stages centered at <=720px; `.pane-pair` two columns.
- Wide tables and quiz layouts use the full column.

Mobile (breakpoints 760px and 620px, plus 720px for panes):

- Viewport meta `width=device-width, initial-scale=1` on every page.
- `.flow` / `.pie` / TOC grids collapse to one column at <=760px; `.pane-pair`
  at <=720px.
- At <=620px: base font 16px; topbar becomes static and nav is a single-row
  horizontally scrollable strip (`white-space: nowrap`); `main` padding shrinks
  to `1.3rem 0.85rem`; quiz toolbar wraps; `.quiz-choices` go full width; Prev/
  Next buttons compact.
- `table.notes` becomes a horizontally scrollable block (`min-width: 8.5rem`
  per cell) with touch momentum scrolling.
- No page-level horizontal scroll; wide content (formulae, tables) scrolls in
  its own container.
- HUD labels stay legible and inside the stage at 390px (verify each).
- Touch: 3D stages with `data-orbit` use `touch-action: none` on the canvas.

Print: `@media print` hides topbar, next links, page tools, DSE sections and
replay buttons; `main` is full width. The "Export notes as PDF" button prints
the notes themselves, and quiz decks link their own PDFs.

## 6. Quality gates

- CI: `node paper2notes/scripts/ci-check.mjs`; it validates the
  `deploy-commit-footer` on every deployed HTML page (skipping `_source` and
  `_local`, via `isKnownLocalOnly`).
- Book 5 Ch.1-2 have a browser interactives test
  (`js/notes.interactives.test.mjs`, needs Google Chrome; the DSE-quiz test
  also needs local scans). Book 4 and Book 5 Ch.3 have no harness.
- The audit harness `paper2notes/scripts/audit/` (local only, outputs under
  gitignored `.audit/`) checks question-bank items against notes pages.
- UI PRs include before/after screenshots at 1280x800 and 390x844.

## 7. Open points for the consolidated PRD

- The alignment rules for definition blocks above are a written-down form of
  existing CSS and the Book 2 fix series; the repo has no dedicated
  automated check for them. A layout test (stage centering, no stacked
  `.hud-label`, single `aria-current`) would enforce them.
- Book 2 and Book 4 share the layout CSS by copy (one `notes.css` per book);
  consolidating it is a candidate for a later change.
