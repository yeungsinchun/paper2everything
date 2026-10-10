# Lavish notes boards — index

This is a short index so the board contract is discoverable from `docs/`. The authoritative contract lives in `.agents/skills/paper2everything-lavish-board/SKILL.md` — read that file before creating or reviewing a Lavish board.

## Contract (summary)

Every Lavish board that reviews a notes HTML change (chapter refactor, section rewrite, template migration, visual comparison) must:

1. **Render before/after side-by-side (left = before/main, right = after/branch) using iframes at both desktop 1280 and phone 390 widths.**
   - Grid: `grid-template-columns: minmax(0,1fr) minmax(0,1fr)` with `min-width:0` children, collapsing to `1fr` at `max-width:900px`.
   - Each pane has two iframes: `width="1280"` (desktop) and `width="390"` (phone), wrapped in `overflow-x:auto`.
   - Label panes `Before — origin/main` / `After — this branch`.
   - Mark the board with `<meta name="lavish-board-kind" content="notes-refactor">` and `class="notes-refactor-board"` so CI knows to enforce it.

2. **Keep prose readable.**
   - The board container uses `max-width:1160px; margin:0 auto; padding:1.2rem` and prose uses `max-width:65ch` (or `48rem`) with `min-width:45ch` (or `600px`).
   - Grids/flex use `minmax(0,1fr)` and `min-width:0` so they don't overflow, and wrap to full-width `1fr` on small viewports.
   - Long prose never lives in a `max-width:360px` or `width:320px` box at desktop, and never in a `repeat(3,1fr)` layout without a phone fallback.

3. **Pass the CI checklist.** `node paper2notes/scripts/ci-check.mjs` fails the change if the board lacks the marker, the side-by-side grid, the 1280+390 iframes, the Before/After labels, the readable measures, the `minmax(0,1fr)` safeguard, or the responsive wrap. It also fails on narrow-box anti-patterns (`max-width <400px` on `.frame/.pane/.card`, `width:320px` prose boxes). The skill gives the exact regexes used in `checkLavishBoards()`.

## Template

Copy the `<section class="before-after">` blocks and `.before-after-grid` CSS from the template in `.agents/skills/paper2everything-lavish-board/SKILL.md` §1. It is the canonical structure and already passes CI.

## Where a board lives

Build the board under `.lavish/`, which is gitignored. Do not commit a board, its before/after snapshots, or a capture taken from one. In a pull request body, link the shared board URL or attach the exported captures with `gh --attach`; never link the board's repository path.

## Arming

```
lavish-axi .lavish/<board>.html
/Users/sinchunyeung/github/firstmate/bin/fm-procevent-lavish.sh arm .lavish/<board>.html --for <task-id>
```

## Relation to other docs

- `.agents/skills/paper2everything-lavish-board/SKILL.md` — the authoritative board contract.
- `.agents/skills/paper2everything-ui-screenshot/SKILL.md` — the captures a request body must carry.
- `paper2notes/.cursor/skills/visual-html-notes/SKILL.md` — the notes pages themselves.
- `docs/ARCHITECTURE.md` — the monorepo data edge (notes → paper2db).