# PRD written as six separate part files

Superseded on 2026-10-01. Recorded 2026-10-04.

## Purpose

Write the product requirements document for `paper2everything` so that each
area was reviewed and merged on its own, instead of one large pull request that
nobody could read end to end.

## What was tried

Six pull requests, one per area, each adding one file under `docs/prd-parts/`:

| Pull request | File | Lines |
|---|---|---|
| https://github.com/yeungsinchun/paper2everything/pull/71 | `docs/prd-parts/readme-structure.md` | 184 |
| https://github.com/yeungsinchun/paper2everything/pull/72 | `docs/prd-parts/product-users.md` | 109 |
| https://github.com/yeungsinchun/paper2everything/pull/73 | `docs/prd-parts/pipeline-ci.md` | 138 |
| https://github.com/yeungsinchun/paper2everything/pull/74 | `docs/prd-parts/ui-usability.md` | 193 |
| https://github.com/yeungsinchun/paper2everything/pull/75 | `docs/prd-parts/content-notes.md` | 216 |
| https://github.com/yeungsinchun/paper2everything/pull/76 | `docs/prd-parts/qb-dse.md` | 164 |

Total 1004 lines across six files.

## Model and runtime used

No model is named in any of the six pull request bodies, and none of the six
commits carries a co-author trailer. Docs-only authoring, no build step.

## Data or corpus it consumed

No data. The input was the repository tree itself: the notes, pipeline and mock
folders as they stood after the monorepo build, plus the three standalone
repositories' own READMEs, which pull request 71 was asked to reconcile.

## Why it was abandoned or superseded

The parts overlapped. Each file restated rules that another file also owned, so
the document had four different statements of the definition-block rule, the
breakpoint set, the tracked-versus-generated table and the CI description. That
is the failure mode the split was meant to prevent.

The consolidating pull request names the overlap as the reason and removes the
directory: "Removed `docs/prd-parts/` (superseded; still in git history)."

## What replaced it

One self-contained `docs/PRD.md` (goals, users, content model, UI requirements,
data products, pipeline, repo structure, CI and deploy, known gaps, open
questions), plus a root `README.md` rewritten to the structure that pull request
71 proposed. The overlapping rules were resolved to one statement each.

## Link to the replacement PR or issue

https://github.com/yeungsinchun/paper2everything/pull/82

## Note on current state

`docs/prd-parts/` is gone from `main`; the six files remain in git history at
commits ca5ea3c, 2c22714, 449221b, 22ec19a, e7bc253 and b95a5e8, removed by
commit 6ebbf8d.