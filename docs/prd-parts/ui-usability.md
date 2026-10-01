# PRD part: UI requirements and usability lessons

Scope: the student-facing surfaces of `paper2notes` (landing, book and chapter pages, subsection pages, interactive figures, concept checks, DSE MC/LQ quizzes, the `/qb` bank UI). This part is self-contained; the consolidation worker merges it into the PRD. It states requirements, records the usability lessons that produced them, and gives design-ready specifics (tokens, breakpoints, rules, acceptance checks).

Reference implementation: `paper2notes/notes/book5/css/notes.css` (tokens, `.def`, `.stage`, `table.notes`, quiz, 620/720/760px breakpoints) and `paper2notes/notes/qb/index.html` (900px breakpoint). Where this part and the code disagree, this part is the target and the code is the gap to close.

## 1. Product stance

- **Audience and context.** HK DSE physics students, mostly revising on a phone (390px wide) between other things, and on a laptop (1280px wide) at a desk. Both are first-class. Neither is "degraded".
- **Quick-digest first.** A student opens a page to recall one idea, not to read a chapter. Every subsection must be skimmable top to bottom in one pass: the picture or table says it, the prose only labels it.
- **Visual-first, prose-last.** Order of preference for any idea: interactive or static figure, then table, then definition block, then short prose. A paragraph is the fallback, not the default (see `.cursor/skills/visual-html-notes/SKILL.md`).
- **No meta chrome.** Student pages never show intake, OCR, QB numbers, "book cut" or textbook-order ledes. Provenance lives in `notes/_source/` or HTML comments.
- **No build, no network dependency.** Pages run from static files: vendored KaTeX, local three.js. No CDN, no runtime fetch that can leave a blank figure.

## 2. Viewports and layout

Two target viewports are mandatory for every review and every PR: **1280x800** and **390x844**. There is no third "tablet" acceptance target; anything between must simply not break.

| Token | Value | Notes |
| --- | --- | --- |
| Page column (`main`) | `max-width: 880px`, centered, padding `1.6rem 1.2rem 4.5rem` | Desktop. One column; do not add a sidebar. |
| Page column, phone | padding `1.3rem 0.85rem 3rem` | At `max-width: 620px`. Side gutter never below 0.85rem (~14px). |
| Prose measure | `max-width: 44rem` on `.lede`; any prose block 45ch to 70ch | Never under 45ch on desktop, never wider than the page column. |
| Figure box | `max-width: 720px`, centered | `figure.fig > .visual` (see 5.1). |
| Breakpoints | 900 (qb grid), 760 (card and flow grids go single column), 720 (`.pane-pair` goes single column), 620 (phone chrome) | Keep this set; do not add ad-hoc breakpoints per chapter. |
| Base type | 16px root on phone; body serif, UI sans | Tokens `--serif`, `--sans`, `--mono` in `notes.css`. |

Rules:

1. **No page-level horizontal scroll at 390px**, ever. Wide things (tables, long equations, code) scroll inside their own container, not the page.
2. **Grids and flex rows use `minmax(0, 1fr)` or `min-width: 0` children** so one wide child cannot push the page wider.
3. **Multi-column prose never survives to phone width.** Two-up panes collapse to one full-width column at 720px.
4. **No text below 12px**, and no body prose below 14px, to fit a box. If it does not fit, the box is wrong, not the font size.
5. **Tap targets at least 40x40 CSS px** for Prev/Next, Replay, chips, nav links and quiz choices on phone. Spacing between adjacent targets at least 8px.
6. **Sticky top bar** on desktop; on phone it becomes static and its `nav` scrolls horizontally (`nowrap`, `overflow-x: auto`) so it never wraps into a tall block that eats the first screen.
7. **Print and PDF**: hide topbar, Next, page tools, DSE section, Replay; main full width; `.idea` does not split across pages (`break-inside: avoid`). Each subsection has an "Export notes as PDF" button top-right.
8. **Reduced motion**: `prefers-reduced-motion: reduce` disables CSS animation and transitions. Three.js loops must also honor it (render one settled frame).

## 3. Design tokens (canonical)

Use these, do not invent new colours per chapter. Source: `:root` in `notes/book5/css/notes.css`.

| Role | Token | Value |
| --- | --- | --- |
| Page / panel | `--paper` / `--panel` | `#f7f3eb` / `#fffdf8` |
| Ink / muted | `--ink` / `--muted` | `#1b2129` / `#5d6673` |
| Rules | `--rule` / `--rule-soft` | `#d9d2c4` / `#e9e3d6` |
| Accent (teal) | `--accent` / `--accent-deep` / `--accent-soft` | `#0f5c54` / `#0a413c` / `#e4efec` |
| Mark (amber, tips) | `--mark` / `--mark-soft` | `#a8690a` / `#fbf1dc` |
| Right / wrong | `--ok` `--ok-soft` / `--bad` `--bad-soft` | `#1f7a45` `#e6f5ea` / `#a32626` `#fbeaea` |
| Physics semantics | `--alpha --beta --gamma --proton --neutron --electron` | red, blue, gold, red, green, blue |

- Physics colours are **semantic and consistent across books** (alpha is always red). Never reuse a semantic colour for decoration.
- Contrast: body text and UI labels meet WCAG AA (4.5:1). Colour is never the only carrier of meaning: right/wrong also show a mark and a word.
- Figure boxes are **plain white**, not cream or yellow.
- A single shared stylesheet is the target. Today each book carries its own copy of `notes.css`, and chapter-level overrides have been the source of repeat bugs (see 7). Shared rules (stage centering, `.hud-label`, `.def`, tables) belong in the book-level sheet, not in per-chapter CSS.

## 4. Text blocks: definitions, equations, tips

### 4.1 Definition block (`.def`)

Lesson: definition blocks are the most-read element and the one most often mis-aligned. Requirements:

- **Left-aligned text, left-anchored block, full column width.** The 4px accent left rule is the only emphasis. Do **not** center-align definition text: centered multi-line prose has a ragged left edge and is hard to scan. Only a single short term line (for example the term itself in a header) may be centered, and only inside a figure caption context.
- Structure: a `.tag` label ("Definition") then the statement. The defined term is bold once, at its first occurrence in the block.
- Padding `0.7rem 0.9rem` desktop; on phone the block stays full width of the column (no side margin beyond the page gutter, no nested narrow column).
- One definition per block. A block never exceeds about 4 lines at 880px; longer content becomes a table or a list.
- Equations inside a definition sit on their own line, left-aligned with the text (see 4.2), not centered in the middle of the block, so the eye does not jump.

### 4.2 Equation block (`.eq`)

- Left rule 3px `--rule`, font about 1.08rem, KaTeX with `\(...\)` and `\[...\]` delimiters, vendored per book.
- **Long equations never wrap mid-formula and never overflow the page.** They scroll horizontally inside `.eq` (`overflow-x: auto`). If an equation needs scrolling at 390px, split it into derivation lines instead.
- Display equations in formula sheets are left-aligned; in flow, a lone key formula may be centered **only** when it is the sole content of its block.
- Every symbol in a formula is defined adjacent to it (a one-line symbol table or `where` line). No formula appears without units.

### 4.3 Tip and worked example

- `.tip`: amber rule, muted fill, one to three lines, used for the classic exam mistake. Not for general prose.
- `.worked`: bordered panel, uppercase sans heading, numbered `ol.steps`, each step one line plus its equation. The numeric answer and unit are the last line and visually distinct.

## 5. Line breaks and text flow

Lessons from repeat bug-fixing: labels stacking at the stage corner, headings orphaning from content, table headers crushed, long words blowing out phone layouts.

1. **Break on meaning, not width.** Keep a quantity with its unit and a symbol with its value together (`white-space: nowrap` on `.marks`, unit pairs, short labels), using a non-breaking space. Never let "5 m/s" or "12 V" split across lines.
2. **Headings never end a column alone**: `break-after: avoid` on h2/h3; h3 to its first block stays on one screen at 390.
3. **Hard line breaks (`<br>`) are banned in prose.** Use separate blocks or list items. A break is allowed only in a fixed-form item such as an equation line or a formula-sheet row.
4. **Lists over run-on sentences.** Three or more parallel facts are a list or a table, never a comma chain.
5. **Tables: columns sized to content**; pair tables give the long prose column the extra width. On phone, `table.notes` becomes `display:block; overflow-x:auto`, with `min-width: 8.5rem` per cell, so columns keep readable widths and the table scrolls inside its own frame. Do not use equal-width 100% slabs.
6. **Long tokens** (URLs, filenames, QB ids) use `overflow-wrap: anywhere` inside narrow containers. Student pages should rarely contain them at all.
7. **Captions** are 0.88rem muted, below the figure, at most two lines on desktop; they explain what to look at, not restate the heading.
8. **Hyphenation off** for headings and labels; allowed (`hyphens: auto`) only for long prose paragraphs on phone.

## 6. Interactivity

Interactions exist to teach a dependency, not to decorate. Every interactive must pass: *can the student answer a question they could not answer from a static picture?* If not, draw a static SVG instead.

### 6.1 Stage (three.js and canvas)

- **Structure:** `figure.fig > .visual.stage > canvas.scene-canvas` plus `.hud-label` children. One `stage()` and one `placeHud` per pane. Default canvas height 300px (tall 400px, pane-pair 270px); width 100%, max 720px, **centered**.
- **Centering:** `figure.fig > .visual.stage` and `.pane-pair` are capped at 720px and centered (auto side margins, or flex column with `align-items: center`). Regression history: this was fixed one chapter at a time in Book 2 (PRs #44 to #53); the rule belongs in the shared sheet so it cannot recur.
- **HUD labels must be placed explicitly**, absolutely positioned per `data-hud`, `transform` centered on the anchor, with a readable card (white, hairline border) when overlapping the scene. An unplaced label collapses to (0,0) and stacks in the corner; that is a blocking bug. Labels stay on their objects during animation via `placeHud`, never overlap each other at 390px.
- **Fixed camera by default.** Orbit (drag-rotate) only where the third dimension carries meaning (for example hand over film, nucleus), declared in `ORBIT_SCENES`; such canvases set `touch-action: none` and show a grab cursor. **No wheel zoom, pinch zoom, dolly, per-box +/- buttons, or page-wide scale.** On a touch device, a fixed-camera canvas must not trap vertical scroll (`touch-action: pan-y`).
- **Default framing fills the canvas.** No tiny apparatus floating in white space.
- **Replay** only for finite clips (knockout, ion-pair capture, film blackening). It lives inside the `.stage`, bottom-right, at least 40px tall on phone. Continuous loops (EM wave, X-ray tube) get no Replay button. No empty control row.
- **Real controls only.** A slider or step control appears only when it changes the physics the student is inspecting, with a visible label and live numeric readout, keyboard-operable (arrow keys), 40px tall on phone.
- **Animation:** starts when the figure enters the viewport, pauses when off screen, settles to a readable static frame (used for print and reduced motion). WebGL unavailable: fall back to the `aria-label` text and a static figure; never a blank white box.
- **Accessibility:** every figure has an `aria-label` and a caption stating the takeaway; every label in the scene has text, not colour alone.

### 6.2 Concept checks (`.check`)

- Placed after the idea they test, one item at a time, stem then options, answer revealed on demand with a one-line reason per wrong option (each distractor is a real mix-up from this section).
- Instant feedback on selection: correct/incorrect state with mark + colour + word; state survives re-render and does not shift page layout (reserve the feedback space so the page does not jump).
- Options are full-width tappable rows (at least 40px), not small radio circles; selection is also keyboard-operable.

### 6.3 DSE MC / LQ quizzes

- **One item at a time** with Prev/Next; progress shown as "n of N". Next/Prev sit in a bar that stays in reach without scrolling past the question on phone.
- Scan image scales to column width, never upscaled beyond native resolution; tap to open full size; on phone the question image and its options are visible without horizontal scroll.
- Answer and the marks scheme reveal on demand; the student's choice and the correct one are both shown afterwards.
- Decks link "This section" and "Whole chapter" PDFs; the header shows the paper id compactly (wraps to its own line at 620px rather than truncating).
- Quiz content is reached only after the notes idea it tests, never dumped on `summary.html`.

### 6.4 Navigation and orientation

- Current chapter is highlighted in the top bar exactly once (no duplicate chapter entries; Book 2 had duplicate-Ch. bugs fixed in #44 and #45).
- Every chapter page has: prev/next subsection links at the bottom, a way back to the book index, and a stable heading anchor per idea so a student can return to "25.3".
- The landing page (`/`) lists the books directly with inline SVG icons; no redirect.
- Student progress (for example last page, quiz choices) may be remembered in `localStorage`, wrapped in try/catch, and the page must work fully without it.

### 6.5 `/qb` bank UI

- Filter by book/section/topic as chips; the active filters and result count are always visible; clearing all filters is one tap.
- Item cards show the real crop at full column width, the topic tags and the year/paper as secondary metadata. Crops never render as unreadable thumbnails on phone; tapping opens the full-size crop.
- Result lists page or lazy-load; a 3,000-item bank must not produce a 3,000-node initial DOM.
- At 900px and below, the filter panel collapses above the list and the list is one column.

## 7. Usability lessons (what went wrong, and the rule it produced)

| Lesson | Observed | Rule |
| --- | --- | --- |
| Stage not centered | Figures sat left in a wide column across Book 2 ch1-10; fixed per chapter (#44 to #53) | Centering lives in the shared sheet (4/6.1); a new chapter needs zero per-chapter CSS for layout |
| HUD labels stacked | Labels collapsed to the canvas corner when the chapter stylesheet was not linked or a `data-hud` had no rule | Every `data-hud` has an explicit position; CI/lint checks each hud id has a rule; chapter pages link the book sheet |
| Duplicate/incorrect nav highlight | Two chapters highlighted, or a duplicate chapter entry | One current item; nav generated from one list per book |
| Definition text centered or boxed narrow | Hard to scan, ragged left edge | Left aligned, full column width (4.1) |
| Narrow unreadable prose columns | 20 to 30 characters per line on phone or in review boards | 45ch minimum measure; no fixed 320/360/400px prose boxes (enforced for Lavish boards by `ci-check.mjs`) |
| Equal-width table slabs | Short headers squashed, empty columns stretched | Content-sized columns; scroll inside the table on phone (5.5) |
| Zoom and orbit on flat diagrams | Dolly/zoom made figures drift, broke framing | Fixed camera; orbit only with depth (6.1) |
| Replay on looping scenes | Button with nothing to restart | Replay only for finite clips, inside the stage |
| Prose where a picture was possible | Wall-of-text sections | Figure, then table, then definition, then prose (section 1) |
| Reviewing only at one width | Desktop looked fine, phone broke | Always both 1280x800 and 390x844 (section 9) |
| Meta chrome on student pages | OCR/QB/source references visible | Provenance only in `_source` or comments |

## 8. Quick-digest requirements

Each subsection page must satisfy:

1. **One-screen summary at the top** (three to five bullets or a compact table) answering "what must I remember?", visible without scrolling at 1280x800 and within about two phone screens at 390x844.
2. **Section anchors** (chips or contents) jumping to each idea; the current idea stays identifiable while scrolling.
3. **Scan-friendly hierarchy**: kicker (amber caps), h2 idea title, then figure. No more than one screen of unbroken text anywhere.
4. **Key terms and formulas are extractable**: each chapter ends with (or links to) a formula sheet and a definitions list, each entry one line.
5. **Progressive disclosure**: derivations, worked examples and mark schemes are collapsed or revealed on demand; the default view is the digest.
6. **Consistent vocabulary and order** across books: Definition, Key formula, Figure, Concept check, Worked example, DSE section, in that order within an idea.
7. **Printable digest**: Export as PDF yields a one-to-two page revision sheet per subsection with figures as their settled static frames.

## 9. Acceptance checklist (per UI change)

Run at **1280x800** and **390x844**, top-of-page plus the affected section, with the same wait for stages (about 1200ms):

- [ ] No horizontal page scroll at 390; wide content scrolls only inside its own container.
- [ ] Definition blocks left-aligned, full column width; no centered multi-line prose.
- [ ] Figures and `.pane-pair` centered at max 720px; canvases fill their box; no clipped or tiny apparatus.
- [ ] Every HUD label is on its object and none overlap each other; none stacked at a corner.
- [ ] Tables legible: content-sized columns, phone tables scroll internally.
- [ ] Units stay attached to values; no orphaned headings; no `<br>` in prose.
- [ ] Tap targets 40px or more; Replay and quiz navigation reachable without precision.
- [ ] Interactive controls labelled, keyboard-operable, and produce a visible physics change.
- [ ] Reduced motion and no-WebGL render a readable static state.
- [ ] Top bar highlights exactly the current chapter; prev/next links work.
- [ ] Before/after screenshots at both widths in the PR body (`.agents/skills/paper2everything-ui-screenshot/SKILL.md`); video for motion changes (`paper2everything-pr-video`); Lavish board where used.
- [ ] `node paper2notes/scripts/ci-check.mjs` passes, including `deploy-commit-footer`.

## 10. Non-goals and open questions

Non-goals: a login or account system, a native app, per-student server-side progress, a CDN-hosted dependency, per-chapter visual themes.

Open questions for design and the consolidation pass:

1. Shared stylesheet: move all three books to one `notes/css/notes.css` (today each book has its own copy), or keep per-book copies generated from one source?
2. Do we add a lint in `ci-check.mjs` for the mechanical rules (every `data-hud` has a position rule, no `<br>` in prose, no fixed narrow prose widths)?
3. Should phone quiz navigation be a sticky bottom bar, or stay inline under the item?
4. Dark mode: out of scope for now, or a required token pass?
