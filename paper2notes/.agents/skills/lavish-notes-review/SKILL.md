---
name: lavish-notes-review
description: Enforce before/after side-by-side lavish boards for every notes HTML refactor, with readable prose and no narrow text boxes. Use when creating or reviewing any lavish board that presents notes changes, chapter refactors, or visual HTML comparisons.
---

# Lavish notes review boards

Every lavish board that reviews a notes HTML change (chapter refactor, section rewrite, template migration, or visual comparison) **must** follow this contract. The contract is enforced by `node paper2notes/scripts/ci-check.mjs` and by review checklist — a board that violates it fails CI.

## 1. Before / after side-by-side is mandatory

- **Left = before/main, right = after/branch.** Label the two panes explicitly (`Before — origin/main` / `After — this branch`) so a reviewer never guesses which is which.
- **Use iframes, not screenshots alone.** Each pane is a live iframe that loads the notes HTML file via relative path (so the board is reviewable from `file://` or `lavish-axi` without a network). Screenshots may supplement but never replace the iframes.
- **Show both viewports for every page under review.** For each notes page (e.g. `book5/ch03-nuclear-energy/index.html`, `27-1.html`, `27-2.html`, `summary.html` for ch27) render **two rows per pane**:
  - **Desktop — 1280 px** (iframe `width="1280"` or CSS `width:1280px`, wrapped in a scroll container)
  - **Phone — 390 px** (iframe `width="390"` or CSS `width:390px`)
  - The phone row may be a second iframe or the same src with a `data-viewport="phone"` wrapper; both panes must have both widths labeled.
- **Structure:** a grid `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)` (or `1fr 1fr` with `min-width:0` children) that collapses to one column only on small viewports (`@media (max-width:900px)`). Do **not** use three narrow columns, equal thirds, or a single stacked column at desktop.
- **Mark the board:** include `<meta name="lavish-board-kind" content="notes-refactor">` in `<head>` and `class="notes-refactor-board"` on `<body>` or the main wrapper. CI only enforces boards that carry this marker, so legacy boards without it are exempt.

### Template (copy for new boards)

```html
<meta name="lavish-board-kind" content="notes-refactor">
<section class="before-after" aria-label="Chapter map — before vs after">
  <div class="before-after-grid">
    <article class="pane before">
      <h3>Before — origin/main</h3>
      <p class="pane-note">File: <code>notes/book5/ch03-nuclear-energy/index.html</code> at main. Desktop 1280 then phone 390.</p>
      <figure class="frame">
        <figcaption>Desktop 1280</figcaption>
        <div class="iframe-wrap desktop"><iframe src="../paper2notes/notes/book5/ch03-nuclear-energy/index.html" width="1280" height="800" loading="lazy" title="Before — map desktop"></iframe></div>
      </figure>
      <figure class="frame">
        <figcaption>Phone 390</figcaption>
        <div class="iframe-wrap phone"><iframe src="../paper2notes/notes/book5/ch03-nuclear-energy/index.html" width="390" height="844" loading="lazy" title="Before — map phone"></iframe></div>
      </figure>
    </article>
    <article class="pane after">
      <h3>After — this branch</h3>
      <p class="pane-note">Same file after migration. Desktop 1280 then phone 390.</p>
      <figure class="frame"><figcaption>Desktop 1280</figcaption><div class="iframe-wrap desktop"><iframe src="../paper2notes/notes/book5/ch03-nuclear-energy/index.html" width="1280" height="800" loading="lazy" title="After — map desktop"></iframe></div></figure>
      <figure class="frame"><figcaption>Phone 390</figcaption><div class="iframe-wrap phone"><iframe src="../paper2notes/notes/book5/ch03-nuclear-energy/index.html" width="390" height="844" loading="lazy" title="After — map phone"></iframe></div></figure>
    </article>
  </div>
</section>
```

Repeat the block for each page (map, 27.1, 27.2, summary). Keep the before src pointing at the committed main version or a stored snapshot if the branch has overwritten the file — include an HTML comment `<!-- before src is archived at .lavish/snapshots/main/... if main file moved -->` when needed.

## 2. No narrow unreadable text boxes

Lavish boards are read on laptops and phones simultaneously. A narrow column that forces 20–30 characters per line is unreadable and fails review.

**Required layout rules for any board carrying `notes-refactor`:**

- **Editor container:** `.frame` or `.lavish-frame` that wraps all prose must have `max-width: 1160px; margin: 0 auto; padding: 1.2rem;` and **must not** constrain prose to `< 600px`. Specifically, no prose container may have `max-width < 600px` or `width < 600px` at desktop. Use `min-width: 0` on grid/flex children so they don't overflow, but the container itself stays `>= 600px` for readable lines.
- **Grids that wrap:** any `display: grid` or `display: flex` that holds cards, panes, or prose must use `minmax(0, 1fr)` tracks or `flex: 1 1 280px` with `min-width: 0` and must wrap to a **single column that is full-width** on small viewports (`@media (max-width: 900px) { grid-template-columns: 1fr; }`). Prose columns must never stay in a two- or three-column layout at phone width.
- **Readable measure:** long prose paragraphs (`<p>`, `<li>`) must have `max-width` that yields `>= 45ch` at desktop. Achieve this with `max-width: 48rem` or `max-width: 65ch` on `.lede`, `.callout p`, `.note`, etc., and `min-width: 600px` or `min-width: 45ch` on containers that would otherwise collapse. Do **not** set `columns: 3` or `column-width: 14rem` for prose.
- **Iframe wrappers:** `.iframe-wrap` must allow horizontal scroll (`overflow-x: auto`) so a 1280-px iframe does not force the page to overflow the viewport; the wrapper itself is full-width, the iframe is the fixed-width content inside it.
- **Banned patterns:** `width: 320px` prose cards at desktop, `grid-template-columns: repeat(3, 1fr)` with text in each third, `max-width: 360px` on any container that holds more than a caption, or `font-size: 0.72rem` on body prose to fit a narrow box.

### Minimal CSS that passes

```css
.frame { max-width: 1160px; margin: 0 auto; padding: 1.2rem; min-width: 0; }
.prose { max-width: 65ch; min-width: min(100%, 45ch); line-height: 1.55; }
.before-after-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}
@media (max-width: 900px) {
  .before-after-grid { grid-template-columns: 1fr; }
  .frame { padding: 0.9rem; }
}
.iframe-wrap { overflow-x: auto; border: 1px solid var(--rule); background: #fff; }
.iframe-wrap iframe { display: block; border: 0; }
.before-after-grid > * { min-width: 0; }
```

## 3. CI / review checklist (fails the PR if violated)

`node paper2notes/scripts/ci-check.mjs` enforces this skill on any lavish board that carries the marker:

- **Fails if:** the file does not contain at least one `class="before-after-grid"` (or `class="compare-grid"`/`before-after`) **and** at least two `<iframe` elements whose `src` points into `paper2notes/notes/` (one labeled before, one after). The error message names the missing pane.
- **Fails if:** the board has no `width="1280"` and `width="390"` (or `data-viewport` equivalents) — i.e. desktop and phone are not both shown. The check is case-insensitive and accepts `width='1280'` or CSS `width: 1280px` in a style block as an alternative.
- **Fails if:** the marker `<meta name="lavish-board-kind" content="notes-refactor">` or `class="notes-refactor-board"` is missing on a board that claims to be a notes refactor (heuristic: filename contains `p2e-` or `migrate` or `notes` and contains `<iframe`).
- **Fails if:** the CSS contains a narrow-box anti-pattern: any rule `max-width: 360px` / `max-width: 320px` / `max-width: 400px` on a selector that matches `.frame`, `.card`, `.pane`, `.prose`, or `width: 280px` without a corresponding `min-width: 600px` or `min-width: 45ch` or `minmax(0, 1fr)`, or a `grid-template-columns: repeat(3` without a phone fallback.
- **Fails if:** the prose container has an inline style or CSS `max-width` that yields `< 45ch` (`< 30rem`, `< 500px`) without a `min-width` safeguard.

When adapting this skill for a board that legitimately needs a narrower layout (e.g. a pure diagram board), remove the marker — then the board is exempt but must not claim to be a notes refactor.

## 4. How to arm

After creating `.lavish/<board>.html`:

```bash
lavish-axi .lavish/<board>.html
# and for fleet review:
bin/fm-procevent-lavish.sh arm .lavish/<board>.html --for <task-id>
# or with firstmate home:
 /Users/sinchunyeung/github/firstmate/bin/fm-procevent-lavish.sh arm .lavish/<board>.html --for <task-id>
```

The board doubles as the template for future notes refactoring boards — copy its `<section class="before-after">` blocks and its `.before-after-grid` CSS.

## 5. Relation to other skills

- `paper2notes/.cursor/skills/visual-html-notes` governs the notes pages themselves (three.js, checks, KaTeX). This skill governs the **review surface** that compares two versions of those pages.
- `docs/ARCHITECTURE.md` maps the data edge; this board review does not change architecture.
