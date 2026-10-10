---
name: paper2everything-ui-screenshot
description: Require before/after screenshots for every UI PR in paper2everything. Invoke before launching any PR that changes paper2notes HTML/CSS/JS, visuals, animations, or stage - enforces when to capture, how to capture, where to store, and the verification checklist.
---

# paper2everything UI screenshot

Every PR that changes UI must prove it with before/after screenshots.
This skill is the single owner of that contract for `paper2everything/paper2notes`.

## 1. Purpose

UI changes are visual.
A diff alone does not show what the student sees.
Before/after screenshots make the change reviewable and prevent regressions in layout, typography, three.js stages, animations, and responsive behavior.
This skill makes screenshots mandatory and un-skippable for all UI PRs.

## 2. When to invoke

Load and follow this skill **before** launching any PR that touches UI.
The trigger is any change to `paper2notes` UI - if you edited one of these, you must invoke this skill before `gh-axi pr create`:

- `paper2notes/notes/**/*.html` (chapter pages, landing `notes/index.html`, book indexes `notes/book*/index.html`, summary pages).
- `paper2notes/notes/**/*.css` (shared `notes/css/notes.css`, book sheets `notes/book*/css/book.css`, chapter sheets).
- `paper2notes/notes/**/*.js` (shared `notes/js/checks.js`, `notes/js/math.js`, `notes/js/scene-kit.js`; `notes/book*/js/*` and chapter `js/diagrams3d.js` stage/interactive scripts).
- Visual assets or stage code: three.js scenes, `diagrams3d.js` `stage()`/`placeHud`, canvas sizing, KaTeX rendering, HUD labels, responsive breakpoints.
- Lavish review boards under `.lavish/` that preview notes UI (these need the Lavish variant below).

Do **not** invoke for non-UI PRs: `paper2db/` pipeline, `paper2mock/` LaTeX, `paper2notes/scripts/` tooling without visual output, or pure docs under `docs/` that do not render in the student site.
If unsure, treat it as UI and capture - an extra screenshot never blocks a PR, a missing one does.

Invoke timing: at **pre-PR creation**, after your visual changes are complete but before `gh-axi pr create` or `git push`.
If you already pushed without screenshots, add them before requesting review - the PR must not be marked ready without the checklist passing.

## 3. Required screenshots (per changed visual)

For every distinct visual you changed, capture a **before/after pair per viewport size** (one pair at laptop size and one pair at mobile size):

- `before.png` - how the page/visual looked on `origin/main` (or before your branch's first UI commit).
- `after.png` - how it looks on your branch after the change.

Minimum per-PR:

- One pair per changed chapter/page (e.g. `book2/ch01-position-and-displacement/index.html` changed → one pair showing that page).
- One pair per changed reusable visual (e.g. topbar, stage canvas, `notes.css` tweak → one pair per representative page that shows the effect).
- **BOTH laptop 1280×800 and mobile 390×844 are required for every web UI PR - for each changed visual, capture a before/after pair at 1280×800 and a separate before/after pair at 390×844, at the same URL, scroll position, and viewport per pair. A PR that touches web UI with screenshots at only one size (desktop-only or phone-only) is incomplete and fails review (see §5.1 and §7).**
- Screenshots must be attached via `gh --attach` (or browser drag-drop attachment) so they render inline in the PR body - plain external links or local-only files do not count.
- For multi-page refactors (e.g. whole Book 2): at least the landing, one representative chapter, and any page with a custom stage - not every page, but every *kind* of change.

Naming in the PR body (and in local `.lavish/` if you keep copies):

- `before - book2/ch01-position-and-displacement/index.html @ 1280×800 (main)`
- `after - book2/ch01-position-and-displacement/index.html @ 1280×800 (this branch)`
- `before - book2/ch01-position-and-displacement/index.html @ 390×844 (main)`
- `after - book2/ch01-position-and-displacement/index.html @ 390×844 (this branch)`

If a Lavish board covers the change, the board's side-by-side iframes satisfy the before/after pair for that page - see §5.2, but you must still export screenshots at both 1280×800 and 390×844 and attach them via `gh --attach` so they render inline in the PR body.

## 4. When to capture (before vs after)

Capture in this order so `before` is not polluted by your changes:

1. **Before** - check out or snapshot `origin/main` *before* your UI edits, start a local server, and screenshot.
   Alternative without switching branches: `git stash` your changes, serve, capture, then `git stash pop`.
   For Lavish boards, archive the main version under `.lavish/snapshots/main/` so the board's left pane can point at it.
2. **After** - restore your branch (`git stash pop` or re-checkout), rebuild/sync if needed (`./paper2notes/scripts/sync-dse.sh` for `_local/dse`), restart the server, and screenshot the same viewport/URL.
3. **Compare** - the two images must share identical viewport, URL fragment, and scroll position (top-of-page unless the change is below the fold - then capture both top and the affected section) - and this comparison must be done separately at 1280×800 and at 390×844.

Never capture `before` after you have already modified the file - it defeats the check.
If you did, reset to `main` for that file and re-capture.

## 5. How to capture

### 5.1 chrome-devtools-axi (primary)

Serve the notes locally (no build):

```bash
python3 -m http.server --directory paper2notes/notes 8000
# visit http://localhost:8000/book2/ch01-position-and-displacement/
```

Then capture with chrome-devtools-axi:

```bash
# open the before URL (main)
chrome-devtools-axi open http://localhost:8000/book2/ch01-position-and-displacement/
chrome-devtools-axi screenshot before.png
# repeat after switching to your branch for after.png

# viewports - BOTH required for every web UI PR (one pair per size)
chrome-devtools-axi resize 1280 800
chrome-devtools-axi screenshot before-1280.png
chrome-devtools-axi resize 390 844
chrome-devtools-axi screenshot before-390.png

# for three.js stages, wait for the stage to settle
chrome-devtools-axi wait 1200
chrome-devtools-axi screenshot before-stage.png
```

Required flags for correctness:

- **Always capture at both `1280×800` (laptop) and `390×844` (mobile) - every web UI PR requires both sizes, even if the change looks desktop-only or mobile-only. Same URL, scroll position, and viewport per pair. Do not ship a one-size-only PR: it is incomplete.**
- For GPU-heavy stages (`three.min.js`, `diagrams3d.js`), run headed if headless misses WebGL: `CHROME_DEVTOOLS_AXI_HEADED=1 chrome-devtools-axi screenshot ...`.
- Use the same `wait` delay for before and after (stage animations are time-sensitive).
- Do not use full-page stitching to hide a broken fold - capture the viewport that a student lands on, plus a second shot scrolled to the affected section if needed.

### 5.2 lavish-axi (for Lavish boards)

When the PR's visual proof is a Lavish before/after board (e.g. under `.lavish/`), the board itself must satisfy `.agents/skills/paper2everything-lavish-board/SKILL.md` and this skill simultaneously:

```bash
lavish-axi .lavish/<board>.html
# verify left = before/main, right = after/branch, both at 1280 and 390 via iframes
```

Build the board with the template in `paper2everything-lavish-board` §1 (grid `minmax(0,1fr) minmax(0,1fr)`, marker `notes-refactor`, two widths labeled).
Then still add a PR-body summary that embeds exported PNGs from the board or the board URL - reviewers must not have to run Lavish locally to see the comparison.
Preferred: `lavish-axi export .lavish/<board>.html --out .lavish/<board>.export.html` and screenshot the export at both widths, or `lavish-axi share` and link the `ht-ml.app` URL in the PR body alongside the embedded PNGs. Both exported screenshots must be attached via `gh --attach` so they render inline.

## 6. Where to store (PR description)

Screenshots live in the **PR body**, not as untracked local files.
PR attachments via GitHub's image upload (attached via `gh --attach` or browser drag-drop, which rewrites to a `https://github.com/user-attachments/assets/...` URL) are the source of truth - the PR must be reviewable from the forge without checking out the branch, and only attached images render inline. A PR that touches web UI must have before/after pairs at **both** 1280×800 and 390×844 attached this way; one-size-only is incomplete.

Template to paste into `gh-axi pr create --body` (or `gh pr create --attach`):

```markdown
## Screenshots

### book2/ch01-position-and-displacement/index.html - trench stage (1280×800 laptop)
| Before (main) | After (this branch) |
|---|---|
| ![before desktop](https://github.com/user-attachments/assets/<uuid-1280-before>) | ![after desktop](https://github.com/user-attachments/assets/<uuid-1280-after>) |

### Same page - 390×844 mobile (required - same URL/scroll/viewport pair)
| Before | After |
|---|---|
| ![before phone](https://github.com/user-attachments/assets/<uuid-390-before>) | ![after phone](https://github.com/user-attachments/assets/<uuid-390-after>) |

### book2/ch01 - scrolled to §A Distance vs displacement (if change is below fold) - both sizes
| Before | After |
|---|---|
| ![before scrolled](https://github.com/user-attachments/assets/...) | ![after scrolled](https://github.com/user-attachments/assets/...) |

_Lavish board (if any): .lavish/<board>.html - before = origin/main, after = this branch - or share URL: https://..._

Attach via: `gh pr create --body-file /tmp/body.md --attach /tmp/before-1280.png --attach /tmp/after-1280.png --attach /tmp/before-390.png --attach /tmp/after-390.png` (or drag-drop in browser). Each local `![](/tmp/...png)` placeholder on its own paragraph is rewritten to a `user-attachments` URL that renders inline; verify with `gh pr view --json body`.
```

For each changed visual, state: file path, viewport, and which branch the image came from.
Do not collapse multiple distinct visuals into one generic "before/after" pair.
Reviewer must be able to map each image to a concrete file and viewport without guessing. Each pair must be at both sizes.

Local copies are optional but useful for the author:

- Keep them under `.lavish/screenshots/<pr-slug>/before-*.png` / `after-*.png` (gitignored) or commit a board under `paper2notes/.lavish/` if the team wants a durable record.
- Never store screenshots only locally without uploading to the PR body via `gh --attach`.

## 7. Verification checklist

Paste this checklist into the PR body and check every box before marking the PR ready.

```markdown
## UI screenshot checklist

- [ ] Before/after pair captured for every changed page/visual at BOTH 1280×800 (laptop) and 390×844 (mobile) - one pair per size, same URL/scroll/viewport per pair (one-size-only PR is incomplete)
- [ ] Before = origin/main (or pre-change stash), After = this branch - same viewport, same URL, same scroll per pair
- [ ] Images attached via `gh --attach` (or browser drag-drop) so they render inline as `https://github.com/user-attachments/assets/...` URLs, not only local files, with labeled before/after per file + viewport for both sizes
- [ ] chrome-devtools-axi used (headed when WebGL required) - or Lavish board with before/after iframes at 1280 + 390 and board URL/PNGs in PR body (both sizes attached inline)
- [ ] Stages/interactives waited to settle (`wait` ~1200 ms) before capture - before and after use same delay at each size
```

A PR that changes `paper2notes` HTML/CSS/JS, visuals, animations, or stage **fails review** if any box is unchecked, and a web UI PR with screenshots at only one viewport size (1280×800-only or 390×844-only) is incomplete - even if layout or stage appears unaffected at the missing size.
The checklist is the gate - reviewers should request changes until all images are present, correctly labeled, and attached inline at both sizes.

## 8. Dry-run validation (Book 2 ch01)

To prove this skill would have caught missing screenshots, run a dry-run on `book2/ch01-position-and-displacement` before merging the skill:

```bash
# simulate a UI PR without screenshots
git diff --name-only origin/main | grep -E "paper2notes/notes/(book2/ch01|book2/css|book2/js|css/|js/|notes\.css)"
# if any output exists and PR body checklist/image URLs are absent at EITHER size → skill would block (both 1280 and 390 required)

# positive dry-run - capture as §5.1 and attach via gh --attach at both sizes
python3 -m http.server --directory paper2notes/notes 8000 &
chrome-devtools-axi open http://localhost:8000/book2/ch01-position-and-displacement/
chrome-devtools-axi resize 1280 800 && chrome-devtools-axi screenshot /tmp/before-ch01-1280.png
chrome-devtools-axi resize 390 844 && chrome-devtools-axi screenshot /tmp/before-ch01-390.png
# (repeat for after on the branch, then attach all four via gh --attach)
```

Expected gate: a PR touching `paper2notes/notes/book2/ch01-position-and-displacement/index.html` but with no `## Screenshots` section and no checklist in the body **must** be returned with "missing before/after screenshots - see `.agents/skills/paper2everything-ui-screenshot/SKILL.md` §7". The same gate applies if the PR has only desktop (1280) screenshots or only phone (390) screenshots - both sizes are required.

This skill stays isolated: it adds no dismissals, no CI mutations, and no code changes - only the screenshot contract and its discovery pointer.

## 9. Discoverability and relation to other skills

- This skill is discoverable via `.agents/skills/paper2everything-ui-screenshot/SKILL.md` and via the one-line pointer in `AGENTS.md` / `CONTRIBUTING.md`.
- `paper2notes/.cursor/skills/visual-html-notes/SKILL.md` governs how to author visuals; this skill governs how to *prove* visual changes.
- `.agents/skills/paper2everything-lavish-board/SKILL.md` governs review-board layout; this skill reuses it for Lavish capture (§5.2).
- `docs/ARCHITECTURE.md` maps the data edge; this skill does not change architecture.
