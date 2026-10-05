# DSE MC Staged Crops (2012-2026 + pp)

Generated from `paper2db` pipeline stages `mc-anchors` + `mc-split` + `keys`.

- **Years:** 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, pp + pp — 537 MC items (36 for 2012-2013 and pp, 33 otherwise)
- **Full MC corpus:** 573 items (2012-2026+pp+sap) in `metadata/mc/llm_classifications.json`; staged slice excludes `sap` (mc-anchors cannot locate its question labels)
- **Images:** `crops/<year>/qNN.png` (optimized palette PNG, 256 colors, ~45% of original) + `qNN.webp` (WebP q85, ~20%)
  - Original pipeline PNG total: 53.1 MB
  - Optimized palette PNG: 23.8 MB
  - WebP: 13.0 MB
  - Combined staged: 36.8 MB (both formats kept; WebP alone is ~13.0 MB)
- **Metadata:** `index.json` per-question (year, question, paper 1A, type MC, marks 1, sections + reason, statementPreview, answer option + percentage, image paths, warnings)
- **Sections:** `sections.json` 27 sections with counts; see `stats.json` for per-year/section breakdown
- **Answer keys:** from `tests/sections/mc/answer_keys.json` (OCR + manual overrides); missing keys flagged as `warnings: ["missing_answer"]` and `missing_percentage`
- **PDFs excluded:** Full DSE PDFs (`paper/mc/*.pdf`, `tests/reconstructed/mc/combined.pdf`, per-year `combined.pdf`) are NOT staged; `.gitignore` keeps `*.pdf` out

## File types and counts

- PNG: 537 files (optimized)
- WebP: 537 files
- JSON metadata: 4 files (`index.json`, `sections.json`, `stats.json`, `manifest.json`)
- Total items: 537

## Usage for /qb UI

- Load `index.json` — each item's `image.webp` (preferred) or `image.png` is the cropped question image (real crop, not placeholder)
- Filter by `sections` (topic) using `sections.json` titles; `stats.json` gives item counts per topic for UI badges
- Show `answer.option` + `answer.percentage` where present; surface `warnings` (missing_answer, missing_percentage, uncertain_classification, missing_crop) visibly for verification

## Reproduce

```bash
./pipeline --only mc-anchors,mc-split --years 2012 2013 ... 2026 pp --yes --force
./pipeline --only keys --force --yes
python3 scripts/stage_dse_mc.py
```

Intermediate anchors: `intermediate/mc/<year>/anchor.pdf` (blue dots, not staged)
