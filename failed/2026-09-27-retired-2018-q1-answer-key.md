# OCR answer key for 2018 Q1, retired

Retired before the monorepo build; the tombstone arrived in this repository with
commit 66cff06 on 2026-09-27. Recorded 2026-10-04.

## Purpose

Read the Paper 1A multiple-choice answer key and the correct-choice percentage
for every year from the official marking-scheme PDFs, so `/qb` can show the
answer and the share of candidates who chose it.

## What was tried

`paper2db/scripts/extract_answer_keys.py` OCR-read
`paper2db/paper/ans/2018ans.pdf` and produced a key for 2018 Q1. The result was
wrong: the matching page image carries no readable option letter for that
question, so the extractor had nothing to record.

Instead of leaving a guessed letter in place, the entry was retired with a
tombstone in `paper2db/scripts/answer_key_overrides.json`:

```json
"2018": {
  "1": {
    "Correct Option": null,
    "Correct percentage": null,
    "deleted": true
  }
}
```

It is the only tombstone in the file. The other 235 entries across 2012 to 2025
are live hand-verified patches.

## Model and runtime used

No model. The key came from OCR, not from a language model.

Runtime: Python 3 with PyMuPDF, Pillow and tesseract on `PATH`
(`paper2db/README.md` prerequisites; the extractor shells out to tesseract).

## Data or corpus it consumed

- `paper2db/paper/ans/2018ans.pdf`, the 2018 marking scheme
- `paper2db/scripts/answer_key_overrides.json`, 236 hand-verified entries, one of
  them this tombstone

## Why it was abandoned or superseded

The OCR result for that one question was not verifiable against the marking
scheme image, so it was dropped rather than trusted. `extract_answer_keys.py`
keeps the tombstone on purpose: it merges manual patches over the OCR output and
then cleans entries whose option is missing, adding `deleted: true` back so a
later run does not resurrect the same bad key.

## What replaced it

Nothing. 2018 Q1 is recorded with no answer and no percentage. The pipeline
reports it as a missing answer rather than inventing one, which is what
`docs/PRD.md` section 6 requires of item warnings.

## Link to the replacement PR or issue

No replacement exists for this question. The mechanism that carries the
retirement landed with the monorepo build:
https://github.com/yeungsinchun/paper2everything/pull/1

Later work widened the same override file with more years, and left the tombstone
alone: https://github.com/yeungsinchun/paper2everything/pull/96