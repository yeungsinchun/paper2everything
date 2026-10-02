# DSE LQ staging for qb-web-ui

Generated at 2026-09-29T19:14:56.988202Z

- Total LQ questions (crops): 170 (170 expected)
- Crops present: 170 / 170
- Answer crops: 122 / 170 (missing 48)
- Candidate performance notes: 144 / 170 (missing 26 – flagged per item)

## Layout

- `crops/` – whole-page question PNGs (`YYYY-qN.png`) and answer crops (`YYYY-qN-ans.png` where available)
- `sections/` – per-section copies (`sections/NN_Folder/YYYY-qN.png`) for web UI section decks
- `candidate_performance.json` – structured performance data with `missing_ids` and per-question flags
- `manifest.json` / `index.json` – full index with `missing_flags` per item (`crop`, `answer`, `candidate_performance`)
- `raw/` – copies of `classification.csv`, `llm_classifications.json`, original `candidate_performance.json`

## Candidate performance handling

Each item in `manifest.json` has:

- `candidate_performance`: string or `null`
- `has_candidate_performance`: bool
- `missing_flags.candidate_performance`: bool (true when performance note absent)

Missing performance is expected for:
- 2026 (no performance PDF released yet)
- pp (practice paper, no performance data)
- Any question where paper/performance/*.md lacked a Section B note.

`candidate_performance.json` at staging root aggregates all notes with `missing_ids` list for UI to render placeholders.

## Verification

```bash
# should be 170
cat manifest.json | python3 -c "import json; print(len(json.load(open('manifest.json'))['items']))"
# all crops exist
ls crops/*.png | wc -l
# check flags
cat manifest.json | python3 -c "import json; d=json.load(open('manifest.json')); print(d['counts'])"
```

Pipeline stages used: `lq-pages`, `lq-crops`, `lq-answers`, `lq-performance`, `classify-lq`, `section-pdfs`.
