---
name: paper2everything-crop-screenshot
description: Require PNG screenshots for every crop PR in paper2everything. Invoke before launching any PR that adds, removes, or changes crop images (question, figure, table, or answer crops, DSE or QB), qb crops, dse crops, or pipeline crop output (paper2notes/notes/qb/crops, paper2notes/notes/dse, paper2db/tests/sections, qb-web-ui-staging) — enforces representative PNG screenshots (before/after grid or sample) at readable resolution uploaded as GitHub attachments so they render inline.
---

# paper2everything crop screenshot

Every PR that adds, changes, or removes crops must prove it with PNG screenshots.
This skill is the single owner of that contract for `paper2everything` crops.

## 1. Purpose

Crops are visual evidence.
A diff of binary WebP/PNG files or a list of file names does not show whether the question text is legible, the figure is complete, or the answer crop is correctly bounded.
Representative PNG screenshots make the change reviewable and prevent regressions in bounding boxes, resolution, or classification.
This skill makes PNG screenshots mandatory and un-skippable for all crop PRs.

Captain waived `https://github.com/yeungsinchun/paper2everything/pull/59` (DSE MC staging) for PNG screenshots; every later crop PR must follow this contract.

## 2. When to invoke

Load and follow this skill **before** launching any PR that adds, removes, or changes crop images — if you edited, generated, or moved one of these, you must invoke this skill before `gh-axi pr create`:

- `paper2notes/notes/qb/crops/**` (`qb/crops/dse-mc/**`, `qb/crops/dse-lq/**`, `qb/crops/qb/**` — WebP/PNG question, figure, table, or answer crops shipped to the `/qb` UI).
- `paper2notes/notes/dse/**` (committed DSE snapshot `dse/{mc,lq}/<NN>/` — 82 files staged to `_local/dse` in the image).
- `paper2db` pipeline crop outputs: `paper2db/tests/sections/{mc,lq}/**` (per-section `YYYY_qN.png` / `YYYY-qN.png` and `combined.pdf`), `paper2db/tests/reconstructed/**`, `paper2db/intermediate/**`, `paper2db/output/**` and `paper2db/classified/**` (legacy), `paper2db/qb-web-ui-staging/**`, `paper2db/qb-pdf/**` crops.
- `paper2db/qb/**` source DOCX that drive crops via `scripts/convert-qb-to-pdf.sh` + `qb_items`/`qb_convert`.

Do **not** invoke for PRs that touch only `paper2notes` HTML/CSS/JS without adding or changing a crop file, `paper2mock` LaTeX, or docs that do not ship a crop image.
If unsure, treat it as a crop PR and capture — an extra grid never blocks a PR, a missing one does.

Invoke timing: at **pre-PR creation**, after your crop generation is complete but before `gh-axi pr create` or `git push`.
If you already pushed without screenshots, add them before requesting review — the PR must not be marked ready without the checklist passing.

## 3. Required screenshots (per changed crop set)

For every PR that touches crops, attach **representative PNG screenshots** at readable resolution:

- **Changed crops** (bounding box, resolution, re-classification, re-render): show a **before/after grid or sample**.
  - Grid: 2–8 representative crops in a CSS grid or `montage` image, labeled with file name, with before = `origin/main` and after = this branch, side-by-side or stacked with labels.
  - Sample: at least one before/after pair for each *kind* of change (e.g. MC question, LQ figure, answer crop, table crop) — not every file when hundreds changed, but every kind.
- **Added crops** (new questions, new banks, new sections): show a **sample of new crops** — at least 4–8 crops or one per new section/bank, arranged as a grid, labeled.
- **Removed crops**: list the removed paths and show a sample of the last main version (one grid from `origin/main`) so the reviewer sees what was dropped.

Minimum per-PR:

- One grid or sample per changed *kind* of crop (e.g. `dse-mc` question vs `dse-lq` answer vs `qb` table → one grid each if all three kinds changed).
- For large sharding PRs (e.g. 400+ MC crops): at least one grid per year or per book/section, or a representative 3×3 sample covering the range — not a thumbnail wall where text is illegible.
- Readable resolution: each crop cell must render at **native or near-native width** (≥ 320 px per crop, text legible at 100% in the PR). Do not downscale to postage-stamp thumbnails or compress to JPEG. PNG is required for crop screenshots even when the source crops are WebP — screenshot the rendered crop at 1×.

Naming in the PR body:

- `Before — dse-mc 2015_q12.webp (main) | After — same file (this branch) — bounding-box tightening`
- `New crops — qb/crops/qb/QB_014/ — 6-sample grid (this branch)`
- State: file path pattern, kind of change, and which branch the image came from.

If a Lavish board already shows the crops, the board does **not** replace PNG attachments — still embed exported PNG grids in the PR body. A board may supplement but not satisfy §7.

## 4. When to capture (before vs after)

Capture in this order so `before` is not polluted by your changes:

1. **Before** — check out or snapshot `origin/main` *before* your crop edits, collect the same file names, and render them into a grid.
   Alternative without switching branches: `git stash` your crop changes, or `git show main:<path>` to temp, then render.
   Keep the before grid's source labeled `main` so the reviewer can reproduce it.
2. **After** — restore your branch (`git stash pop` or re-checkout), rebuild the crops if needed (`./paper2db/pipeline --force --yes` then staged dir or `paper2notes/notes/qb/crops`), and render the same crop names into an after grid at the same cell size.
3. **Compare** — the two grids must share identical cell size, ordering, and labels so the change is obvious (e.g. tighter box, sharper text, moved classification).

Never capture `before` after you have already overwritten the crop — it defeats the check.
If you did, reset to `main` for that path and re-capture.

## 5. How to capture

### 5.1 Option A — direct file grid (fastest for pipeline output)

When crops live as files (e.g. `paper2db/tests/sections/mc/01_Mechanics/01_.../2020_q5.png` or `paper2db/qb-web-ui-staging/dse-mc/2020_q13.webp`):

Create a small HTML grid that displays the crops at native width, then screenshot it with `chrome-devtools-axi` or export via `montage`/`convert` (ImageMagick):

```html
<!-- /tmp/crop-grid.html -->
<style>
  .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; max-width: 1160px; margin: 0 auto; }
  .grid figure { margin: 0; border: 1px solid #ddd; padding: 6px; background: #fff; min-width: 0; }
  .grid figcaption { font: 11px/1.3 monospace; word-break: break-all; margin-bottom: 4px; }
  .grid img { display: block; width: 100%; height: auto; image-rendering: auto; }
</style>
<div class="grid">
  <figure><figcaption>2015_q12.webp — main</figcaption><img src="file:///path/to/main/2015_q12.webp"></figure>
  <figure><figcaption>2015_q12.webp — this branch</figcaption><img src="file:///path/to/branch/2015_q12.webp"></figure>
  <!-- repeat for each representative crop -->
</div>
```

Then capture:

```bash
python3 -m http.server --directory /tmp 8001 &
chrome-devtools-axi open http://localhost:8001/crop-grid.html
chrome-devtools-axi resize 1280 900
chrome-devtools-axi screenshot /tmp/crop-before-after-grid.png
# repeat with before-only and after-only grids as needed
```

ImageMagick alternative (no browser):

```bash
montage /tmp/before/*.png /tmp/after/*.png -tile 3x2 -geometry +6+6 -label '%f' /tmp/crop-grid.png
# montage reads PNG/WebP and writes a PNG grid at readable resolution
```

Keep each cell ≥ 320 px wide and the output PNG ≤ 10 MB (GitHub attachment limit on this free-plan repo; see pr-video skill). 1200–2000 px wide grids are ideal — they scale down in the PR but remain legible when clicked.

### 5.2 Option B — via the /qb UI (for shipped crops)

When crops are already staged to `paper2notes/notes/qb/crops/**` and visible at `/qb`:

```bash
python3 -m http.server --directory paper2notes/notes 8000 &
chrome-devtools-axi open http://localhost:8000/qb/?filter=dse-mc
chrome-devtools-axi resize 1280 900
chrome-devtools-axi wait 800
chrome-devtools-axi screenshot /tmp/qb-crops-grid.png
# capture the grid view that shows multiple crop cards, or open one item and capture its crop
```

Use the same viewport for before and after (1280×900). For `/qb` the stage is the crop card grid, not a three.js canvas, so a short wait is enough.

### 5.3 Resolution and format

- Screenshot the grid, not a single thumbnail. Each crop inside the grid must be legible (question stem, options, figure labels readable without zoom).
- Save as **PNG** (`*.png`) — do not use JPEG for text/diagram crops; WebP source crops are fine but the PR screenshot must be PNG so GitHub does not re-compress.
- Do not downscale the grid to < 800 px wide or set `width: 120px` cells — that hides bounding-box errors. The UI screenshot skill's §5.1 headed flag is not needed for crops unless the crop is rendered inside a WebGL stage; ordinary PNG crops need no `wait`.

## 6. Where to store (PR description)

Screenshots live in the **PR body**, not as untracked local files or committed images.
PR attachments via GitHub's image upload are the source of truth — the PR must be reviewable from the forge without checking out the branch.

Upload as a GitHub file attachment so it renders inline. Two verified flows (same as `paper2everything-pr-video` but for PNG):
**Preferred is CLI via `gh --attach`** (scriptable, verified on `gh 2.100.0` with `gh --help` showing `--attach` on `gh pr edit`, `gh pr comment`, `gh issue comment`; `gh pr edit <n> --attach image.png`, `gh pr edit <n> -R <owner/repo> --attach image.png`, `gh pr comment <n> --attach <file>`, `gh issue comment <n> --attach <file>`, up to 50 files per command by repeating `--attach`; if the body already references the local path the URL is rewritten in place, otherwise it is appended; for images use `--attach 'path#alt text'` for alt text, for video no `#alt text` — `gh` errors `cannot set alt text on video`). **Fallback is browser drag-drop/paperclip** when CLI is unavailable.

- **Preferred — CLI via `gh --attach`** — rewrites a local path reference on its own line to a `user-attachments` URL (if the body references the local path the URL is rewritten, otherwise appended; verified in `paper2everything-pr-video` §3.2; `gh pr edit --help` confirms `--attach` and video alt-text rule):
- **Fallback — Browser** — drag-drop the PNG onto the PR description or comment box, or click the paperclip icon. GitHub shows `Uploading...` then inserts `![image](https://github.com/user-attachments/assets/<uuid>)`. Use when CLI is unavailable.

```bash
cat > /tmp/crop-body.md <<'EOF'
## Screenshots — crops

### dse-mc — changed (before/after sample, 2015_q12 and 2020_q13)

| Before (main) | After (this branch) |
|---|---|
| ![before 2015_q12](URL-before) | ![after 2015_q12](URL-after) |

Grid of 6 changed dse-mc crops (main → branch) — bounding-box fix:

![crop grid before/after](https://github.com/user-attachments/assets/...-grid.png)

### Added — qb/crops/qb/QB_014 — 8-sample grid (this branch)

![new QB_014 crops](https://github.com/user-attachments/assets/...-new.png)

EOF

# Preferred: attach via gh --attach (up to 50 files, alt text via # for images; video has no alt text)
# attach on PR creation
gh pr create --title "feat(paper2db): ..." --body-file /tmp/crop-body.md --attach /tmp/crop-grid.png /tmp/qb-new.png
# attach on PR edit (verified with -R on sots PR — appends URL if body does not reference file)
gh pr edit 123 -R yeungsinchun/paper2everything --attach /tmp/crop-grid.png
# or comment
gh pr comment 123 --body-file /tmp/crop-body.md --attach /tmp/crop-grid.png
# issue comment also works
gh issue comment 123 --body-file /tmp/crop-body.md --attach /tmp/crop-grid.png
```

Template to paste into `gh-axi pr create --body`:

```markdown
## Screenshots — crops

### Changed — dse-mc 2012–2024 (sample, this branch tightens bounding box)
| Before (main) | After (this branch) |
|---|---|
| ![before 2015_q12](https://github.com/user-attachments/assets/...-before.png) | ![after 2015_q12](https://github.com/user-attachments/assets/...-after.png) |

Grid — 6 representative changed crops (main on left half, branch on right, 1280-wide PNG, text legible):

![crop grid — before/after 6-sample](https://github.com/user-attachments/assets/...-grid.png)

### Added — qb/crops/qb/QB_014 (8 new crops) — sample grid (this branch)

![new crops — QB_014 8-sample](https://github.com/user-attachments/assets/...-qb014.png)

### Removed — dse-mc/2013_q1.webp (last main sample)

![removed — 2013_q1 main](https://github.com/user-attachments/assets/...-removed.png)

```

For each grid, state: path pattern, kind of crop (question/figure/table/answer), change type, and which branch the image came from.
Do not collapse multiple distinct kinds into one unlabeled image.

Local copies are optional but useful for the author:

- Keep them under `.lavish/screenshots/<pr-slug>/crop-*.png` (gitignored) or commit a Lavish board under `paper2notes/.lavish/` if the team wants a durable record.
- Never store screenshots only locally without uploading to the PR body.

## 7. Verification checklist

Paste this checklist into the PR body and check every box before marking the PR ready.

```markdown
## Crop screenshot checklist

- [ ] Representative PNG screenshots attached for every changed/added/removed crop kind (one grid or sample per kind, not one global file name)
- [ ] For changed crops: before (origin/main) and after (this branch) shown as labeled grid or side-by-side pair at same cell size — change is obvious
- [ ] For added crops: sample grid of new crops shown, labeled with file names or section/bank, at readable resolution
- [ ] Each PNG is readable (each crop cell ≥ 320 px wide, text/figure legible at 100%, 800–2000 px wide grid) and is a PNG (not JPEG)
- [ ] Images uploaded as GitHub file attachments via `gh --attach` (preferred) or browser drag-drop/paperclip (fallback) and visible inline in PR description (not only local files) — URLs are `https://github.com/user-attachments/assets/...` and images render, not just links
- [ ] Each image labeled with kind (question/figure/table/answer, DSE/QB), path pattern, and branch (main vs this branch)
```

A PR that adds, removes, or changes crops **fails review** if any box is unchecked.
The checklist is the gate — reviewers should request changes until all images are present, labeled, and visibly render inline.

## 8. Dry-run validation

To prove this skill would have caught missing screenshots, run a dry-run on a staged crop set before merging the skill:

```bash
# simulate a crop PR without screenshots — list changed crops vs main
# for qb crops
 git diff --name-only origin/main | grep -E "paper2notes/notes/qb/crops/|paper2notes/notes/dse/|paper2db/tests/sections/"
# if any output exists and PR body has no "## Screenshots — crops" section and no checklist → skill would block

# positive dry-run — generate a grid and upload
# 1. create /tmp/crop-grid.html as in §5.1 with 4–6 representative crops from your branch
python3 -m http.server --directory /tmp 8001 &
chrome-devtools-axi open http://localhost:8001/crop-grid.html
chrome-devtools-axi resize 1280 900 && chrome-devtools-axi screenshot /tmp/crop-grid.png
# 2. attach to PR
cat > /tmp/crop-body.md <<'EOF'
## Screenshots — crops
Grid of 4 representative crops (this branch):
![](/tmp/crop-grid.png)
EOF
# Preferred: gh --attach (scriptable); fallback is browser drag-drop
gh pr create --title "feat(crops): ..." --body-file /tmp/crop-body.md --attach /tmp/crop-grid.png
# subsequent captures prefer: gh pr comment, gh pr edit -R, gh issue comment (up to 50 files, #alt for images, no #alt for video)
# 3. verify
 gh api /repos/yeungsinchun/paper2everything/pulls/<n> --jq .body | grep -q "user-attachments" && echo "render OK" || echo "missing attachment"
# open PR URL in browser and confirm PNG renders inline (not a link)
```

Expected gate: a PR touching `paper2notes/notes/qb/crops/dse-mc/2015_q12.webp` or `paper2db/tests/sections/mc/.../2020_q5.png` but with no `## Screenshots — crops` section and no checklist in the body **must** be returned with "missing crop screenshots — see `.agents/skills/paper2everything-crop-screenshot/SKILL.md` §7".

This skill stays isolated: it adds no CI mutations, no PR dismissals, and no code changes — only the screenshot contract and its discovery pointer.

## 9. Discoverability and relation to other skills

- This skill is discoverable via `.agents/skills/paper2everything-crop-screenshot/SKILL.md` and via the one-line pointers in `AGENTS.md` / `CONTRIBUTING.md` and the PR template `.github/pull_request_template.md`.
- `paper2everything-ui-screenshot` governs screenshot proof for `paper2notes` HTML/CSS/JS visuals; this skill governs proof for **crop images** (binary PNG/WebP). A PR may need both (crop generation + UI rendering of crops on `/qb` or DSE decks) — the two checklists are independent and must both pass when both artefacts are present.
- `paper2everything-pr-video` governs inline video via attachment (preferred: `gh --attach`, fallback: browser drag-drop); crop screenshots use the same attachment host (`user-attachments`) but as PNG images (`![alt](URL)`) rather than bare video URLs. Both require upload as attachments so they render inline — see pr-video §3 for `gh pr edit`, `gh pr comment`, `gh issue comment`, `--attach`, 50-file and alt-text rules.
- `docs/ARCHITECTURE.md` maps the data edge `paper2db → paper2notes` (pipeline → `tests/sections` → `sync-dse.sh` → `notes/qb/crops` / `notes/dse` → `_local`); this skill does not change architecture.