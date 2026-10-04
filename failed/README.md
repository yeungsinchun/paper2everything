# failed/

Abandoned and superseded attempts in `paper2everything`, written 2026-10-04.

Each file records one attempt: what it was for, what was tried, the model and
runtime behind it, the data or corpus it consumed, why it was dropped, and what
replaced it, with a link to the replacement pull request.

An attempt belongs here only when the repository record shows it was dropped or
replaced: a closed or abandoned branch, a deleted set of files, a config path
that nothing reads, or a record retired in place. Live inputs do not belong
here, however old they look.

| File | Abandoned or superseded | Replaced by |
|---|---|---|
| [`2026-09-27-nested-ci-and-docker-config-from-standalone-repos.md`](2026-09-27-nested-ci-and-docker-config-from-standalone-repos.md) | Nested `paper2notes/.github/workflows/` and `paper2mock/.github/workflows/` copies, and `paper2notes/.dockerignore`, carried in by the monorepo plain copy | Namespaced workflows at the repository root, same pull request |
| [`2026-09-27-retired-2018-q1-answer-key.md`](2026-09-27-retired-2018-q1-answer-key.md) | OCR answer key for 2018 Q1, which the marking-scheme image does not support | Nothing; the question is recorded with no answer |
| [`2026-09-29-review-evidence-committed-into-git.md`](2026-09-29-review-evidence-committed-into-git.md) | Committing 42 lavish boards and evidence PNGs into the working tree | Pull request attachments via `gh --attach`, or a throwaway screenshot branch |
| [`2026-10-01-prd-written-as-six-part-files.md`](2026-10-01-prd-written-as-six-part-files.md) | PRD split across six files under `docs/prd-parts/` (PRs 71 to 76) | One `docs/PRD.md` plus a rewritten root `README.md` |
| [`2026-10-02-dse-resync-attempt-m1.md`](2026-10-02-dse-resync-attempt-m1.md) | `fm/p2e-f02-resync-dse-scripts-m1`, stranded on a stale base after one review round | `fm/p2e-f02-resync-dse-scripts-m2` |
| [`2026-10-03-audit-hardcoded-bank-table.md`](2026-10-03-audit-hardcoded-bank-table.md) | Bank-to-chapter map written as a generated array literal in `bank-pages.mjs` | `paper2notes/scripts/audit/books.json` |

## How these were checked

Built from the record only: `git log` on `main` and on the `fm/*` branches, the
100 merged pull requests on
https://github.com/yeungsinchun/paper2everything, the 62 branch names on the
forge, `paper2notes/anchors/moves.json`, `paper2db/scripts/answer_key_overrides.json`
and `paper2db/scripts/overrides_*.json`. Nothing here is inferred from a guess;
where the record names no model, the file says so.

## Sources that contributed nothing

- `paper2notes/anchors/moves.json` exists only on the open anchor-lint pull
  request (https://github.com/yeungsinchun/paper2everything/pull/94) and its
  `moves` list is empty, so no content move has been recorded yet.
- `paper2db/scripts/overrides_*.json` are live inputs, not retired records.
  `paper2db/segment.py` finds them by year label and passes them to
  `paper2db/scripts/preprocess_mc.py`, which applies each one only where OCR
  failed to find a question number. All seven files are read today.