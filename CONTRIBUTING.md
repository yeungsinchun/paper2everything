# Contributing

## UI pull requests

Any PR that changes `paper2notes` UI (HTML/CSS/JS, visuals, animations, stage) must load `.agents/skills/paper2everything-ui-screenshot/SKILL.md` before launch.
Before/after screenshots (before.png/after.png per changed visual) via `chrome-devtools-axi` (or `lavish-axi` for Lavish boards) are required in the PR body - see the skill's checklist (section 7).

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
