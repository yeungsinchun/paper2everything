# Contributing

## UI pull requests

Any PR that changes `paper2notes` UI (HTML/CSS/JS, visuals, animations, stage) must load `.agents/skills/paper2everything-ui-screenshot/SKILL.md` before launch.
Before/after screenshots at **BOTH** laptop **1280×800** and mobile **390×844** for each changed visual (one before/after pair per size, same URL/scroll position/viewport per pair) are required in the PR body, attached via `gh --attach` (or browser drag-drop) so they render inline as `https://github.com/user-attachments/assets/...` URLs - one-size-only is incomplete and fails review (see the skill §3/§7). UI demo/walkthrough video, if any, must also be recorded at both sizes and attached inline via `gh --attach` unless the change is provably invisible at one size (see `.agents/skills/paper2everything-pr-video/SKILL.md` §5.1/§6). Use `chrome-devtools-axi` (or `lavish-axi` for Lavish boards) at both viewports.

## Dev preview

```bash
python3 -m http.server --directory paper2notes/notes 8000
# then http://localhost:8000/book2/ch01-position-and-displacement/
```

See `AGENTS.md` for the `paper2notes` / `paper2db` / `paper2mock` map and `paper2notes/README.md` for the audit harness.

## CI

```bash
node paper2notes/scripts/ci-check.mjs
```
