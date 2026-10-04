# Review evidence committed into the repository

Dropped on 2026-09-29. Recorded 2026-10-04.

## Purpose

Keep the before and after screenshots and the lavish review boards that prove a
visual change did what it claimed, inside the repository so they survive and can
be linked from a pull request.

## What was tried

For several rounds the notes work committed its evidence PNGs and its lavish
boards:

- root `.lavish/architecture-board`
- root `.lavish/p2e-book5-ch27-migrate`, including a `before` snapshot of the
  whole notes tree
- `paper2notes/.lavish/**`, including `book5-overhaul-review.html`,
  `dse-publish/*.png` and `evidence/*.png`
- `paper2db/.lavish/pr-evidence/qb-p1/quality-strict.txt`

Forty-two tracked files in total. Branches went one step further and added
screenshots under `docs/screenshots/` and `.lavish/screenshots/` with
`git add -f`, which bypasses the ignore rule.

## Model and runtime used

No model. The runtime was `lavish-axi` for the boards and headless Chrome driven
by `chrome-devtools-axi` for the screenshots, at 1280x800 and 390x844.

## Data or corpus it consumed

The rendered site itself: `paper2notes/notes/book2`, `book4` and `book5` pages
served over `python3 -m http.server`, plus the `paper2db` audit output written
to `quality-strict.txt`.

## Why it was abandoned or superseded

The pull request that stopped it opened with the question that decided it: "Why
is `node_modules` committed? Ignore those. Also `.lavish`." It added `.lavish/`
and `node_modules/` to the root `.gitignore` as repo-wide, removed the
`paper2db/.lavish/*` carve-out after checking that the exception was stale, and
ran `git rm --cached` on all 42 tracked files. Evidence does not belong in the
working tree: it belongs with the change it proves.

## What replaced it

- Screenshots uploaded as pull request attachments with `gh --attach`, which the
  screenshot, video and crop skills require.
- Where a branch still needs to host images that the pull request links, a
  separate throwaway branch: the Book 2 design system pull request links all 17
  of its PNGs from `fm/p2e-design-system-book2-m1-shots`, never from the code
  branch.

## Link to the replacement PR or issue

https://github.com/yeungsinchun/paper2everything/pull/42
(dropped the files and set the ignore rules)

The rules that replaced the practice:
https://github.com/yeungsinchun/paper2everything/pull/54
(ui screenshots),
https://github.com/yeungsinchun/paper2everything/pull/63
(videos),
https://github.com/yeungsinchun/paper2everything/pull/64
(crops), and
https://github.com/yeungsinchun/paper2everything/pull/66
(`gh --attach` as the preferred upload path).

## Note on current state

The practice came back in places after pull request 42. `docs/pr-screenshots/`
and `.lavish/screenshots/` still hold tracked PNGs on `main` as of this record.
Root `.gitignore` line 8 ignores `.lavish/`; the tracked PNGs survive because
they were added with `git add -f`.