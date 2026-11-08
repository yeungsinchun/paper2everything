# PR dependency separation

This document records how the stacked pull requests for the question-bank
features were separated into independent changes. It is the dependency record
for the separation task; the intent and component-interaction document lives in
[`sequence-architecture.md`](sequence-architecture.md) (owned by the
documentation worker).

Snapshot: 2026-11-08. Inspected `main`: `ec524094`
(`refactor(paper2notes): group scripts by purpose and rename design system`).
All base/head identities were read from the forge live via the GitHub API.

## The old stack

Nine pull requests carried one change each, but each was opened with the
previous pull request's head branch as its base. The forge recorded several as
"merged" even though their content never reached `main`, because the merge
target was a stacked branch.

| PR | Base branch | Head branch | Change | Forge state |
|---|---|---|---|---|
| https://github.com/yeungsinchun/paper2everything/pull/107 | `main` | `fm/p2e-qb-harness-functional-m1` | honest QB audit + pointer coverage | merged (`fe70ec67`, on `main`) |
| https://github.com/yeungsinchun/paper2everything/pull/117 | `main` | `fm/p2db-answer-corrections` | MC answer corrections | merged (`5e525c46`, on `main`) |
| https://github.com/yeungsinchun/paper2everything/pull/108 | `main` | `fm/p2e-f09-concept-brief-m1` | page checklists for audit gaps | open (owned by MAIN worker) |
| https://github.com/yeungsinchun/paper2everything/pull/119 | `fm/p2e-f09-concept-brief-m1` | `fm/p2e-mock-exam-system` | mock-exam builder | merged `09d69dbe` (stacked, not on `main`) |
| https://github.com/yeungsinchun/paper2everything/pull/135 | `fm/p2e-mock-exam-system` | `fm/p2e-layout-l11-book69-assets` | shared assets in Books 6/9 | merged (stacked) |
| https://github.com/yeungsinchun/paper2everything/pull/138 | `fm/p2e-layout-l11-book69-assets` | `fm/p2e-layout-l05-book3-maps` | Book 3 chapter maps | merged (stacked) |
| https://github.com/yeungsinchun/paper2everything/pull/137 | `fm/p2e-layout-l05-book3-maps` | `fm/p2e-layout-section-chrome` | print bars / example disclosure | merged (stacked) |
| https://github.com/yeungsinchun/paper2everything/pull/136 | `fm/p2e-layout-section-chrome` | `fm/p2e-layout-l01-overview-cards` | overview cards | merged (stacked) |
| https://github.com/yeungsinchun/paper2everything/pull/139 | `fm/p2e-layout-l01-overview-cards` | `fm/p2e-layout-shared-template` | shared layout for every book page | merged (stacked) |

The linear chain was `main ← 108 ← 119 ← 135 ← 138 ← 137 ← 136 ← 139`.
Chronology is not dependency: only the layout group is a real functional chain.

## Genuinely dependent groups

Only changes that solve one problem in stages belong in a stack.

1. **Layout group** — PRs 135, 138, 137, 136, 139 solve one problem (consistent
   book layout) and build on one another. This is a genuine functional chain.
   Its content landed on `main` through the layout PRs
   https://github.com/yeungsinchun/paper2everything/pull/139 (squashed into
   `1ca32549`) and https://github.com/yeungsinchun/paper2everything/pull/142
   (`dc66fb0c`). No re-extraction is needed.
2. **Mock exam** — PR 119 is independent: the mock engine reads the published
   bank and does not consume the page checklists from PR 108, nor the layout
   group. It must target `main` directly.
3. **Concept checklists** — PR 108 is independent and remains owned by the MAIN
   worker (`p2e-pr108-verify-rewrite-c1`). This task does not touch it.

## The five extracted changes and their verdicts

Five bounded changes were extracted from the stack onto `main` and checked
against live `main`.

| Extraction commit | Change | Verdict |
|---|---|---|
| `d5d9a68f` | mock-exam builder | **still necessary** — not on `main`; extracted to `fm/p2e-independent-mock-i1` and opened as its own PR |
| `524e4ea1` | shared assets in Books 6/9 | **superseded** — the layout rebuild deliberately keeps Books 6/9 on their own design sheets (layout test "Book 6 and Book 9 lesson pages rebuild with their own design sheets") |
| `dd02f3ec` | Book 3 chapter maps | **already on `main`** via the layout group |
| `444f2ce9` | print bars / example disclosure | **already on `main`** via the layout group |
| `5b5b43b0` | overview cards | **already on `main`** via the layout group |

## Replacement relationships

Old → new, without closing or rewriting any existing PR or branch.

| Old PR | New branch | New PR | Basis |
|---|---|---|---|
| https://github.com/yeungsinchun/paper2everything/pull/119 | `fm/p2e-independent-mock-i1` | https://github.com/yeungsinchun/paper2everything/pull/147 | `main` at `ec524094` |
| PRs 135–139 (layout) | none | already on `main` | layout PRs 139/142 |
| https://github.com/yeungsinchun/paper2everything/pull/108 | unchanged | owned by MAIN worker | `main` |

PR 108's old predecessor base (`fm/p2e-f09-concept-brief-m1`) is not restored;
the mock replacement branches from current `main` and nothing else.

## Validation

Run on the mock replacement branch against current `main`:

- `node --test paper2notes/notes/mock/js/mock-engine.test.mjs` → 39/39 pass.
- `node --test paper2notes/scripts/build-books.test.mjs` → 8/8 pass.
- `node paper2notes/scripts/checks/ci-check.mjs` → 41 pre-existing shared-asset
  problems (Books 1/6/9 asset copies); zero findings for the mock route,
  landing page, or QB page. None are introduced by the mock change.

The mock replacement diff is bounded to exactly 10 files: 6 new files under
`paper2notes/notes/mock/`, 2 link edits (landing + QB), and 3 one-line doc
updates.

## Remaining blockers and follow-ups

- PR https://github.com/yeungsinchun/paper2everything/pull/108 (concept
  checklists) remains open and owned by the MAIN worker.
- The 41 `ci-check` shared-asset findings (Books 1/6/9) pre-date this work and
  belong to the layout/assets owner.
- New UI work (inline question explanations, PRs 144/145) and the coverage
  check are separate implementation tasks on their own branches and are not
  part of this separation.
