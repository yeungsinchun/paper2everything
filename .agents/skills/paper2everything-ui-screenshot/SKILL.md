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
- `paper2notes/notes/**/*.css` (`notes/book*/css/notes.css`, shared `notes/css/`).
- `paper2notes/notes/**/*.js` (`notes/book*/js/*`, `notes/js/diagrams3d.js`, `notes/js/checks.js`, `notes/js/lib/three.min.js` wrappers, stage/interactive scripts).
- Visual assets or stage code: three.js scenes, `diagrams3d.js` `stage()`/`placeHud`, canvas sizing, KaTeX rendering, HUD labels, responsive breakpoints.
- Lavish review boards under `.lavish/` that preview notes UI (these need the Lavish variant below).

Do **not** invoke for non-UI PRs: `paper2db/` pipeline, `paper2mock/` LaTeX, `paper2notes/scripts/` tooling without visual output, or pure docs under `docs/` that do not render in the student site.
If unsure, treat it as UI and capture - an extra screenshot never blocks a PR, a missing one does.

Invoke timing: at **pre-PR creation**, after your visual changes are complete but before `gh-axi pr create` or `git push`.
If you already pushed without screenshots, add them before requesting review - the PR must not be marked ready without the checklist passing.

## 3. Required screenshots (per changed visual)

For every distinct visual you changed, capture a **pair**:

- `before.png` - how the page/visual looked on `origin/main` (or before your branch's first UI commit).
- `after.png` - how it looks on your branch after the change.

Minimum per-PR:

- One pair per changed chapter/page (e.g. `book2/ch01-position-and-displacement/index.html` changed → one pair showing that page).
- One pair per changed reusable visual (e.g. topbar, stage canvas, `notes.css` tweak → one pair per representative page that shows the effect).
- Desktop **and** phone widths for each pair when layout or stage is affected (see §5.1).
- For multi-page refactors (e.g. whole Book 2): at least the landing, one representative chapter, and any page with a custom stage - not every page, but every *kind* of change.

Naming in the PR body (and in local `.lavish/` if you keep copies):

- `before - book2/ch01-position-and-displacement/index.html @ 1280px (main)`
- `after - book2/ch01-position-and-displacement/index.html @ 1280px (this branch)`
- Same for `390px` when responsive is in scope.

If a Lavish board covers the change, the board's side-by-side iframes satisfy the before/after pair for that page - see §5.2.

## 4. When to capture (before vs after)

Capture in this order so `before` is not polluted by your changes:

1. **Before** - check out or snapshot `origin/main` *before* your UI edits, start a local server, and screenshot.
   Alternative without switching branches: `git stash` your changes, serve, capture, then `git stash pop`.
   For Lavish boards, archive the main version under `.lavish/snapshots/main/` so the board's left pane can point at it.
2. **After** - restore your branch (`git stash pop` or re-checkout), rebuild/sync if needed (`./paper2notes/scripts/sync-dse.sh` for `_local/dse`), restart the server, and screenshot the same viewport/URL.
3. **Compare** - the two images must share identical viewport, URL fragment, and scroll position (top-of-page unless the change is below the fold - then capture both top and the affected section).

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

# viewports - do both when layout/typography/stage changed
chrome-devtools-axi resize 1280 800
chrome-devtools-axi screenshot before-1280.png
chrome-devtools-axi resize 390 844
chrome-devtools-axi screenshot before-390.png

# for three.js stages, wait for the stage to settle
chrome-devtools-axi wait 1200
chrome-devtools-axi screenshot before-stage.png
```

Required flags for correctness:

- Capture at `1280×800` (desktop) and `390×844` (phone) when CSS, layout, or stage sizing changed.
- For GPU-heavy stages (`three.min.js`, `diagrams3d.js`), run headed if headless misses WebGL: `CHROME_DEVTOOLS_AXI_HEADED=1 chrome-devtools-axi screenshot ...`.
- Use the same `wait` delay for before and after (stage animations are time-sensitive).
- Do not use full-page stitching to hide a broken fold - capture the viewport that a student lands on, plus a second shot scrolled to the affected section if needed.

### 5.2 lavish-axi (for Lavish boards)

When the PR's visual proof is a Lavish before/after board (e.g. under `.lavish/`), the board itself must satisfy `paper2notes/.agents/skills/lavish-notes-review/SKILL.md` and this skill simultaneously:

```bash
lavish-axi .lavish/<board>.html
# verify left = before/main, right = after/branch, both at 1280 and 390 via iframes
```

Build the board with the template in `lavish-notes-review` §1 (grid `minmax(0,1fr) minmax(0,1fr)`, marker `notes-refactor`, two widths labeled).
Then still add a PR-body summary that embeds exported PNGs from the board or the board URL - reviewers must not have to run Lavish locally to see the comparison.
Preferred: `lavish-axi export .lavish/<board>.html --out .lavish/<board>.export.html` and screenshot the export at both widths, or `lavish-axi share` and link the `ht-ml.app` URL in the PR body alongside the embedded PNGs.

## 6. Where to store (PR description)

Screenshots live in the **PR body**, not as untracked local files.
PR attachments via GitHub's image upload are the source of truth - the PR must be reviewable from the forge without checking out the branch.

Template to paste into `gh-axi pr create --body`:

```markdown
## Screenshots

### book2/ch01-position-and-displacement/index.html - trench stage (1280 desktop)
| Before (main) | After (this branch) |
|---|---|
| ![before desktop](URL-to-before-1280.png) | ![after desktop](URL-to-after-1280.png) |

### Same page - 390 phone
| Before | After |
|---|---|
| ![before phone](URL-to-before-390.png) | ![after phone](URL-to-after-390.png) |

### book2/ch01 - scrolled to §A Distance vs displacement (if change is below fold)
| Before | After |
|---|---|
| ![before scrolled](URL) | ![after scrolled](URL) |

_Lavish board (if any): .lavish/<board>.html - before = origin/main, after = this branch - or share URL: https://..._

```

For each changed visual, state: file path, viewport, and which branch the image came from.
Do not collapse multiple distinct visuals into one generic "before/after" pair.
Reviewer must be able to map each image to a concrete file and viewport without guessing.

Local copies are optional but useful for the author:

- Keep them under `.lavish/screenshots/<pr-slug>/before-*.png` / `after-*.png` (gitignored) or commit a board under `paper2notes/.lavish/` if the team wants a durable record.
- Never store screenshots only locally without uploading to the PR body.

## 7. Verification checklist

Paste this checklist into the PR body and check every box before marking the PR ready.

```markdown
## UI screenshot checklist

- [ ] Before/after pair captured for every changed page/visual (one pair per kind of change, not one global pair)
- [ ] Before = origin/main (or pre-change stash), After = this branch - same viewport, same URL, same scroll
- [ ] Desktop 1280 px captured for each pair (and phone 390 px when layout/stage/CSS changed)
- [ ] chrome-devtools-axi used (headed when WebGL required) - or Lavish board with before/after iframes at 1280 + 390 and board URL/PNGs in PR body
- [ ] Images uploaded and visible in PR description (not only local files) with labeled before/after per file + viewport
- [ ] Stages/interactives waited to settle (`wait` ~1200 ms) before capture - before and after use same delay
```

A PR that changes `paper2notes` HTML/CSS/JS, visuals, animations, or stage **fails review** if any box is unchecked.
The checklist is the gate - reviewers should request changes until all images are present and correctly labeled.

## 8. Dry-run validation (Book 2 ch01)

To prove this skill would have caught missing screenshots, run a dry-run on `book2/ch01-position-and-displacement` before merging the skill:

```bash
# simulate a UI PR without screenshots
git diff --name-only origin/main | grep -E "paper2notes/notes/(book2/ch01|book2/css|book2/js|notes\.css)"
# if any output exists and PR body checklist/image URLs are absent → skill would block

# positive dry-run - capture as §5.1 and paste into PR body
python3 -m http.server --directory paper2notes/notes 8000 &
chrome-devtools-axi open http://localhost:8000/book2/ch01-position-and-displacement/
chrome-devtools-axi resize 1280 800 && chrome-devtools-axi screenshot /tmp/before-ch01-1280.png
chrome-devtools-axi resize 390 844 && chrome-devtools-axi screenshot /tmp/before-ch01-390.png
# (repeat for after on the branch)
```

Expected gate: a PR touching `paper2notes/notes/book2/ch01-position-and-displacement/index.html` but with no `## Screenshots` section and no checklist in the body **must** be returned with "missing before/after screenshots - see `.agents/skills/paper2everything-ui-screenshot/SKILL.md` §7".

This skill stays isolated: it adds no dismissals, no CI mutations, and no code changes - only the screenshot contract and its discovery pointer.

## 9. Discoverability and relation to other skills

- This skill is discoverable via `.agents/skills/paper2everything-ui-screenshot/SKILL.md` and via the one-line pointer in `AGENTS.md` / `CONTRIBUTING.md`.
- `paper2notes/.cursor/skills/visual-html-notes/SKILL.md` governs how to author visuals; this skill governs how to *prove* visual changes.
- `paper2notes/.agents/skills/lavish-notes-review/SKILL.md` governs review-board layout; this skill reuses it for Lavish capture (§5.2).
- `docs/ARCHITECTURE.md` maps the data edge; this skill does not change architecture.

```

