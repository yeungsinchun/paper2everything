# DSE script resync, first attempt (`fm/p2e-f02-resync-dse-scripts-m1`)

Abandoned on 2026-10-02; superseded by a merged second attempt on 2026-10-03.
Recorded 2026-10-04.

## Purpose

Resync the DSE stages of the `paper2db` pipeline from their source, and make the
MC and LQ classification stages replay the tracked decisions in
`metadata/{mc,lq}/llm_classifications.json` by default instead of calling the
LLM every run.

## What was tried

Branch `fm/p2e-f02-resync-dse-scripts-m1`, based on f0314dc:

1. c6b2de0, 2026-10-02 01:19 — `feat(paper2db): resync DSE scripts from
   80a865a, metadata replay for classify-mc/lq, sap overrides`
2. 85abbb4, 2026-10-02 17:57 — `no-mistakes(review): Remove metadata replay
   bypass and unused LQ helper`

One review round, then the branch stopped. It never became a pull request. Its
tip is preserved locally as `archive/fm-p2e-f02-85abbb4`.

## Model and runtime used

No model is named. The authored commits are by `TYeung`. The review rounds are
`no-mistakes(review)` commits, so the no-mistakes pipeline reviewed the work
rather than a model named in a pull request body.

Runtime: the Python 3 pipeline with PyMuPDF, Pillow and tesseract, per
`paper2db/README.md`.

## Data or corpus it consumed

- `paper2db/metadata/mc/llm_classifications.json`, 573 tracked MC decisions
- `paper2db/metadata/lq/llm_classifications.json`, 170 tracked LQ decisions
- `paper2db/paper/{mc,lq}` source PDFs, 2012 to 2026 plus `pp` and `sap`
- `paper2db/scripts/overrides_sap.json`, added by this branch: 36 anchor
  positions for the school-based practice paper, which the anchors stage cannot
  otherwise locate

The feature commit names commit 80a865a as the source of the resynced scripts.
The record does not say which repository holds that commit.

## Why it was abandoned or superseded

The branch was based on f0314dc, which predates eleven merged pull requests,
including the Book 2 problem database and DSE and QB staging repair
(https://github.com/yeungsinchun/paper2everything/pull/96) and the anchor-id
work for Books 2, 4 and 5
(https://github.com/yeungsinchun/paper2everything/pull/97,
https://github.com/yeungsinchun/paper2everything/pull/93,
https://github.com/yeungsinchun/paper2everything/pull/99).
Pull request 96 rewrote the DSE staging paths that this branch's scripts write
to, and pull request 92 added the leak check that ships the tracked fingerprint
file. The same review round then produced four further fixes that all depended
on the newer base: migrate LQ staging to the canonical roots and remove dead
fallbacks, update pinned tests to the migrated paths, restore the LQ top-level
split, and fix stale pipeline expectations.

So the branch was not wrong; it was stranded on an old base and its review
history was too short to merge.

## What replaced it

Branch `fm/p2e-f02-resync-dse-scripts-m2`, based on 335189d, merged as
https://github.com/yeungsinchun/paper2everything/pull/100 on 2026-10-03. It
replays the same feature and the same review round on the newer base, then adds
four more:

- 68babbb `no-mistakes(review): Update pinned tests to migrated paths; simplify
  write_outputs merge`
- 4c2030f `no-mistakes(review): Migrate LQ staging to canonical roots; remove
  dead fallbacks`
- 99fa086 `no-mistakes(review): Restore LQ top-level split; fix stale pipeline
  expectations`
- 0e610e1 `no-mistakes(document): Document metadata replay defaults; prune dead
  legacy gitignore chains.`
- 1e65291 `no-mistakes(document): Fix stale replay-dispatch and sap overrides
  docs; pre-existing drift noted`

Commit 02b90a6 on m2 has the same patch id as 85abbb4 on m1, so the first
review round was kept, not redone.

## Link to the replacement PR or issue

https://github.com/yeungsinchun/paper2everything/pull/100