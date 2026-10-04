# Hard-coded bank table in the audit harness

Superseded on 2026-10-03. Recorded 2026-10-04.

## Purpose

Map every question bank in the question-bank corpus to the notes chapter that
teaches it, so the usability audit can send each bank to the right pages.

## What was tried

`paper2notes/scripts/audit/bank-pages.mjs` built the map as a generated array
literal inside the module:

```js
const banks = Object.fromEntries([
  ...Array.from({ length: 10 }, (_, i) => [`QB_${201 + i}`, "book2", `ch${String(i + 1).padStart(2, "0")}`]),
  ...Array.from({ length: 8 },  (_, i) => [`QB_${401 + i}`, "book4", `ch${String(i + 1).padStart(2, "0")}`]),
  ["QB_501", "book5", "ch01"],
  ["QB_502", "book5", "ch02"],
  ["QB_503", "book5", "ch03"],
].map(([bank, book, chapter]) => [bank, { book, chapter }]));
```

Twenty-one banks, derived from a pattern rather than read from data. Adding a
bank meant editing JavaScript.

## Model and runtime used

Model: `meta/muse-spark-1.2-contributor`, hard-coded in the harness at
`paper2notes/scripts/audit/judge.mjs` and `map.mjs`, invoked as
`pi -p --model meta/muse-spark-1.2-contributor`. That model id arrived with
this attempt's own pull request and was unchanged until the replacement.

Runtime: Node.js 20 for the harness, plus headless Chrome over the Chrome
DevTools Protocol for the layout and screenshot steps.

## Data or corpus it consumed

The question-bank corpus, 21 banks in three groups:

- `QB_201` to `QB_210` mapped to Book 2 chapters 1 to 10
- `QB_401` to `QB_408` mapped to Book 4 chapters 1 to 8
- `QB_501`, `QB_502`, `QB_503` mapped to Book 5 chapters 1 to 3

Each bank is a DOCX in `paper2db/qb`, staged as crops and metadata under
`paper2db/qb-web-ui-staging/qb/`.

## Why it was abandoned or superseded

The table encoded a rule as a pattern. It had no place to record how a bank's
pages are laid out, and it could not survive a change in the bank set without a
code edit. The page layout moved in pull request
https://github.com/yeungsinchun/paper2everything/pull/60, when the DSE and QB
shards were stitched into the final `/qb` UI, and by then the harness needed a
data file rather than a literal.

## What replaced it

`paper2notes/scripts/audit/books.json`, added in the same pull request, holds
bank-to-book-to-chapter mapping plus the per-book page layout. `bank-pages.mjs`
now reads it. The same pull request also added `dse.mjs`, `verify.mjs`,
`pointers.mjs` and `paths.mjs`, and taught the harness to resolve Book 2
chapters from `notes/book2/chNN/index.html` while Book 4 and Book 5 resolve from
section pages.

## Link to the replacement PR or issue

https://github.com/yeungsinchun/paper2everything/pull/101

The attempt that introduced the hard-coded table:
https://github.com/yeungsinchun/paper2everything/pull/4