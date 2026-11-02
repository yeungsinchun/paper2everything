# Concept briefs

One brief per audited notes page, written by `node ../scripts/brief.mjs --page <page>`.

- `briefs/<page>.json` — machine-readable, stable field names (`schema: paper2everything.concept-brief.v1`)
- `briefs/<page>.md` — the same brief for a human reader

Both files come from one computation and are written together, so they cannot disagree.

Each brief lists the concepts the page is missing in priority order:

1. **Clusters.** One `pi` call per page groups the audit's `missing_concepts` into named
   clusters (`model.cluster_source` says whether the call answered). A concept the call did
   not name keeps its own cluster, so no gap is dropped.
2. **Learning-objective ids.** Read from the page's own `lo-block`: the block id (or the id
   its `aria-labelledby` names) plus the bullet position. A concept the model or the text
   match cannot tie to an objective says so (`lo_match`, `lo_note`); a page with no
   `lo-block` declares no id and the brief says that.
3. **Must-fix.** `scripts/audit/report.mjs` decides it, unchanged. Clusters sort must-fix
   first, then by the number of page items that miss them.
4. **Leak check.** `../scripts/leak-check.mjs` runs over both files before they are written.
   A finding blocks the write and prints the level and the item. Item references are
   `BANK#<inventory index>`; bank item ids and deck slide ids are protected ids for rule
   L4, so no brief prints them.

Input: the audit results under `.audit/results/` (gitignored, from
`node scripts/audit/run.mjs` and `node scripts/audit/report.mjs`). A brief is only as
current as the audit run behind it, so regenerate the brief after any re-run.

This directory holds only the README; generated briefs appear here after a local audit run.
