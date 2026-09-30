# Pull request

## Summary
<!-- What changed and why -->

## Screenshots (required for every web UI PR — both sizes, before/after per size, same URL/scroll/viewport, attached via `gh --attach` so they render inline)

> Every PR that touches `paper2notes` HTML/CSS/JS, visuals, animations, or stage **must** include before/after screenshots at **BOTH** laptop **1280×800** and mobile **390×844** for each changed visual (one pair per size, same URL/scroll/viewport per pair). Attach via `gh --attach` (or browser drag-drop) so the `https://github.com/user-attachments/assets/...` URLs render inline. A PR with only one viewport size is **incomplete** and fails review. See `.agents/skills/paper2everything-ui-screenshot/SKILL.md` §3/§7.

### Example — `book2/ch01-position-and-displacement/index.html` @ 1280×800 (laptop)
| Before (main) | After (this branch) |
|---|---|
| ![before 1280](https://github.com/user-attachments/assets/<uuid-before-1280>) | ![after 1280](https://github.com/user-attachments/assets/<uuid-after-1280>) |

### Same page @ 390×844 (mobile) — required, same URL/scroll/viewport
| Before (main) | After (this branch) |
|---|---|
| ![before 390](https://github.com/user-attachments/assets/<uuid-before-390>) | ![after 390](https://github.com/user-attachments/assets/<uuid-after-390>) |

<!-- Add more rows per changed visual. Each image must be a `user-attachments` URL on its own. Use:
  gh pr create --body-file /tmp/body.md --attach /tmp/before-1280.png --attach /tmp/after-1280.png --attach /tmp/before-390.png --attach /tmp/after-390.png
or drag-drop in the browser. Local-only files or external links do not count.
Lavish board (if any): `.lavish/<board>.html` — still attach both-size PNGs inline.
-->

## Video (if UI demo/walkthrough — both sizes, attached inline, unless provably invisible at one)

> UI demo/walkthrough video must be recorded at **BOTH** 1280×800 (laptop) and 390×844 (mobile) — one video per size, same interaction, each attached inline via `gh --attach` (bare `user-attachments` URL on its own paragraph). Only exception: change is provably invisible at one size — state why plainly in the PR body. See `.agents/skills/paper2everything-pr-video/SKILL.md` §5.1/§6.

- Laptop 1280×800: <!-- `https://github.com/user-attachments/assets/<uuid-1280>` or "N/A — provably invisible because ..." -->
- Mobile 390×844: <!-- `https://github.com/user-attachments/assets/<uuid-390>` or "N/A — ..." -->

## Crop screenshots (required when the PR adds, removes or changes crops — DSE or QB)

> Load `.agents/skills/paper2everything-crop-screenshot/SKILL.md` before launch. Attach representative PNG grids/samples (before/after where changed, sample where added, readable resolution) via `gh --attach` so they render inline. Checklist: skill §7.

## Checklist

- [ ] Screenshots: before/after at **BOTH** 1280×800 **and** 390×844 for each changed visual, same URL/scroll/viewport per pair, attached inline via `gh --attach` (or browser drag-drop) — one-size-only is incomplete
- [ ] Video (if any): attached inline via `gh --attach` as `user-attachments` URL on its own paragraph; UI demos have BOTH 1280×800 and 390×844 videos or a plain justification that one size is provably invisible
- [ ] Crop PRs: representative PNG screenshots attached inline per `paper2everything-crop-screenshot` (skill §7)
- [ ] `paper2everything-ui-screenshot` checklist (skill §7) and `paper2everything-pr-video` checklist (skill §6) pass where applicable

## Notes for reviewers
<!-- Link to Lavish board, DSE sync, or other context if needed -->
