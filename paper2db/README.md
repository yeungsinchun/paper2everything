# paper2db

Turn HKDSE Physics past papers into per-question crops and curriculum-section banks.

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# tesseract must be on PATH (OCR)

./pipeline
```

That command builds the past-paper banks from `paper/`, then runs the QB question-bank stages when a QB DOCX source tree is available. Generated artifacts are gitignored; the tracked inputs are listed below. The past-paper stages pause at review gates (MC anchors, optional LQ crops, uncertain classifications). Pass `--yes` to print the same paths without waiting for Enter.

```bash
./pipeline --years 2025          # one year
./pipeline --from classify-mc    # resume mid-pipeline
./pipeline --only keys,section-pdfs
./pipeline --force --yes         # rebuild all available stages, no prompts
./pipeline --list-stages
```

MC and LQ classification **replays the tracked decisions** in `metadata/{mc,lq}/llm_classifications.json` by default (free and deterministic) and only calls the LLM for years missing from that metadata. Set an API key to classify those missing years:

```bash
export LLM_API_KEY=...           # or OPENAI_API_KEY / TOGETHER_API_KEY
export LLM_BASE_URL=https://api.together.xyz/v1   # optional
export LLM_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
./pipeline --from classify-mc --force
```

When no API key is set, missing years fall back to the keyword classifiers (`scripts/classify_mc_sections.py`, `scripts/classify_lq_keywords.py`); HTTP 403 and other LLM errors also fall back instead of aborting.

## Regenerating `tests/reconstructed/` and `tests/sections/`

Generated crops, section PDFs and `.lavish/` HTML are **not committed** (see `.gitignore`). Rebuild them from `paper/` with:

```bash
./pipeline --force --yes      # all years and available stages, no review prompts
./pipeline --years 2025 --force --yes   # one past-paper year; QB stages still process the QB corpus
```

`tests/sections/` is the generated curriculum-section bank (PNG copies, CSVs, section PDFs, `quality_audit.json`, OCR caches, `items/`) - named alongside `tests/reconstructed/` since both are pipeline output trees under `tests/`, not fixtures. The only files under `tests/reconstructed/` that git tracks are durable inputs: `tests/reconstructed/lq/<year>/starts.json` (LQ page ranges, preserved by normal `lq-pages` runs) and `tests/reconstructed/lq/<year>/ans_starts.json` (marking-scheme page maps, read by `lq-answers`). Everything under `tests/sections/` is reproducible from `paper/` with `./pipeline`, so never `git add` crops, section PDFs or `.lavish/` HTML.

`metadata/{mc,lq}/llm_classifications.json` holds the classification decisions themselves (which section(s) each question belongs to, and why) - the one output that costs paid, nondeterministic LLM calls to reproduce, so it stays tracked and is replayed by default (or applied explicitly with `--from-json`) even when nothing else in `tests/sections/` is rebuilt.

`metadata/qb/banks.json` (46 banks, 169 DOCX → 3847 items, 1881 in-scope) and `metadata/qb/source-manifest.json` (sha256 per DOCX) are the tracked QB census and manifest, validated before conversion by `scripts/qb_banks.py` and `scripts/qb_manifest.py verify`.

## Layout

| Path | Role |
|------|------|
| `paper/mc/` | Paper 1A PDFs (`2012p1a.pdf`, `ppp1a.pdf`, ...) |
| `paper/lq/` | Paper 1B PDFs |
| `paper/ans/` | Marking schemes (`2012ans.pdf`, ...) |
| `paper/performance/` | Candidate-performance notes (markdown; source for `candidate_performance.json`) |
| `intermediate/mc/<year>/` | MC anchor review PDF (`anchor.pdf`), OCR meta and preview PNGs, ahead of the split |
| `tests/reconstructed/mc/` | `combined.pdf` (every year's MC paper) + `<year>/` MC question PNGs with a per-year `combined.pdf` |
| `tests/reconstructed/lq/` | `combined.pdf` (every year's LQ questions) + `<year>/` LQ pages, `qN.png`, `ans/qN.png`, per-year `combined.pdf` |
| `tests/sections/mc/` | Section folders, CSVs, `answer_keys.json`, section PDFs (generated) |
| `tests/sections/lq/` | Same for long questions (generated) |
| `tests/sections/items/` | `paper2db.dse-item.v1` records: `<section>.json` + `index.json` (`dse-items` stage, generated) |
| `qb/` | Local QB DOCX source tree, if supplied (gitignored; working manifest at `qb/source-manifest.json` if built) |
| `qb-pdf/` | Converted QB PDFs, OCR, item JSON, crops, conversion log and quality report (generated, gitignored) |
| `schemas/qb-item.v1.json` | `paper2db.qb-item.v1` item contract (legacy) |
| `schemas/dse-item.v1.json` | `paper2db.dse-item.v1` DSE past-paper item contract (`dse-items` stage) |
| `schemas/qb-item.v2.json` | `paper2db.qb-item.v2` item contract (corpus-agnostic, with `scope` and `source_manifest`) |
| `schemas/answer-pointer.v1.json` | `paper2db.answer-pointer.v1` store contract for answer pointers |
| `metadata/pointers/{qb,dse}.json` | Tracked answer-pointer stores (empty until pointers are added) |
| `metadata/mc/llm_classifications.json` | Tracked MC classification decisions (LLM or keyword backend) |
| `metadata/lq/llm_classifications.json` | Tracked LQ classification decisions |
| `metadata/qb/banks.json` | Tracked QB census per bank (46 banks, 169 DOCX → 3847 items, 1881 in-scope) — source of truth for counts |
| `metadata/qb/source-manifest.json` | Tracked QB source manifest (sha256 per DOCX) — verified by `scripts/qb_manifest.py verify` |
| `scripts/` | Stage implementations (called by `./pipeline`) plus standalone tools (`pointers.py`, `leak_fingerprints.py`) |
| `scripts/answer_key_overrides.json` | Hand-verified MC answer-key patches where OCR is unreliable |
| `tests/reconstructed/lq/<year>/ans_starts.json` | Per-year marking-scheme page map for LQ answer crops (whole 1-based PDF pages per question; replaces OCR label detection) |
| `scripts/build_ans_starts.py` | Generate `ans_starts.json` candidates from an ans PDF (human-verified before tracking) |
| `scripts/derive_keys.py` | 3/3 unanimous Muse key-maker deriving keys for years with no ans PDF → tracked `metadata/derived_keys.json`; LQ subparts that the three runs do not all agree on numerically stay withheld for hand adjudication on the Lavish board |
| `metadata/derived_keys.json` | Tracked derived MC options + LQ worked solutions for 2026/pp/sap (3/3 unanimous or hand-adjudicated on the Lavish board; replayed by `keys`) |
| `scripts/build_derived_keys_review.py` | Lavish review board for derived keys (`.lavish/derived-keys-review/`); records the three key-maker runs, the per-subpart fact (always "not comparable" - the parser cannot read explanation prose, so the board verifies nothing about the answers), and the human adjudication (settled finals or the withheld reason) |
| `segment.py` | Low-level single-PDF tool (prefer `./pipeline`) |
| `.lavish/pipeline-review/` | Step-by-step HTML evidence for captain review |
| `.lavish/classified-review/` | MC section bank HTML |
| `.lavish/lq-classified-review/` | LQ section bank HTML |
| `.lavish/qb-review/` | Local QB crop review board (generated) |
| `tests/sections/quality_audit.json` | Measured crop/classification failure rates (generated) |

## Stages

1. **mc-anchors** - blue dots on each MC paper; **you must review** `intermediate/mc/<year>/anchor.pdf`
2. **mc-split** - crop clean `qN.png` into `tests/reconstructed/mc/<year>/` + A4 `combined.pdf`; then joins every year into `tests/reconstructed/mc/combined.pdf`
3. **lq-pages** - export LQ pages + `starts.json`
4. **lq-crops** - whole exam page stack per question (`page_from`..`page_to`); A4 `combined.pdf` of those stacks from the source paper (no cover, no within-page crop; trailing data/formulae sheets excluded); then joins every year into `tests/reconstructed/lq/combined.pdf`. Before a crop is copied into the published snapshot (`paper2notes/notes/dse/lq/<section>/`), run `scripts/check_lq_crop_orientation.py` on it: it reuses the upright/rotated test from `scripts/preprocess_lq_answers.py`, adds a legibility floor, and exits non-zero on a sideways or unreadable page (`--fix` rotates and re-checks)
5. **lq-answers** - marking-scheme answer crops under `ans/` (whole pages per `tests/reconstructed/lq/<year>/ans_starts.json`; fails loudly on coverage mismatch instead of writing partial crops)
6. **keys** - MC keys + correct-% → `tests/sections/mc/answer_keys.json` (OCR of ans PDFs, `answer_key_overrides.json` patches, unanimous or board-adjudicated `metadata/derived_keys.json` entries for years without ans PDFs; `derive_keys.py verify` fails when a target has no recorded attempt)
7. **classify-mc** - 27 syllabus sections; replays `metadata/mc/llm_classifications.json`, calls the LLM only for years missing from it, keyword fallback on error
8. **lq-performance** - candidate-performance notes → `tests/sections/lq/candidate_performance.json` (free, local, deterministic; `scripts/extract_lq_performance.py`)
9. **classify-lq** - same sections for LQ; same metadata replay / LLM-only-for-missing-years / keyword-fallback behavior as classify-mc. Either backend then lists every Book 5 section a radioactivity LQ tests (e.g. 2014 Q10: ch26 activity + ch25 alpha handling; 2012 Q11 keeps 25+26+27), primary = latest section. Both backends OCR the whole page stack (cache keyed by PNG size under `tests/sections/lq/ocr_cache/`)
10. **section-pdfs** - per-section A4 `combined.pdf` (+ LQ `answers.pdf` / `performance.pdf`); an LQ appears in every section it is listed under, not only its primary
11. **dse-items** - join crops, tracked classifications, MC keys, LQ candidate performance and tier-resolved answer pointers from `metadata/pointers/dse.json` into `paper2db.dse-item.v1` records (`schemas/dse-item.v1.json`): `tests/sections/items/<section>.json` per section (a question appears under every section it is listed under) plus `index.json`. A record is in-scope when its primary section is in Books 2, 4 or 5 (366 MC + 104 LQ = 470); the stage fails if any record is schema-invalid or an in-scope question crop is missing. Without `--years`, rebuilds the whole corpus. With `--years`, processes and validates only selected years, replaces their section records and index entries, and preserves other years without requiring their crops
12. **lavish** - quality audit + HTML reviews under `.lavish/` (pipeline walkthrough, MC banks, LQ banks, derived-keys board when `metadata/derived_keys.json` exists)
13. **qb-pdf** - verify `metadata/qb/source-manifest.json` (sha256 per DOCX, plus `banks.json` agreement) then convert QB DOCX files to PDF with LibreOffice; copy PDF-only sources
14. **qb-ocr** - OCR QB PDFs with `pdftoppm` and Tesseract
15. **qb-items** - extract `paper2db.qb-item.v2` JSON (`scope` from `banks.json`, `source_manifest` provenance) and per-item PNG crops
16. **qb-audit** - strict QB quality gate (counts from `metadata/qb/banks.json`: 169 PDFs / 46 banks → 3847 items, 1881 in-scope) and local crop review board

The QB stages skip when no QB DOCX source tree is found. They use `$P2DB_QB_ROOT` if set, otherwise `qb/` in this repository (`qb/` itself stays gitignored; the tracked census is `metadata/qb/banks.json` and the tracked manifest is `metadata/qb/source-manifest.json`). `qb-pdf` first runs `scripts/qb_manifest.py verify` (sha256 per DOCX plus `banks.json` agreement) before conversion. The QB source files and all generated QB outputs stay untracked. LibreOffice (`soffice`), `pdftoppm` and Tesseract must be on `PATH` to run these stages. Run only the QB track with `./pipeline --only qb-pdf,qb-ocr,qb-items,qb-audit`; `--years` applies to past papers, not QB. `qb-items` emits `paper2db.qb-item.v2` (`schemas/qb-item.v2.json`, with `scope` from `banks.json` and `source_manifest` provenance; `v1` is legacy). The QB audit writes `qb-pdf/quality.json` and `.lavish/qb-review/index.html`; it checks the exact PDF and item counts from `metadata/qb/banks.json` (169 PDFs / 46 banks → 3847 items, 1881 in-scope), crops, key statuses, and conversion rendering. See `scripts/qb_quality.py` and `scripts/qb_manifest.py` for the gate definitions.

## Answer pointers

`metadata/pointers/{qb,dse}.json` (`schemas/answer-pointer.v1.json`) say where each item's worked answer or marking scheme lives. An item may have several pointers; `scripts/pointers.py` merges them to one by tier (`verified` > `derived` > `inferred`), and two different targets at the same top tier are a conflict. Items are joined by `item_id` against the staged indexes in `qb-web-ui-staging/` (qb ids as-is, `dse-mc-<year>-<q>`, `dse-lq-<year>-q<n>`). Target paths are relative to `paper2db/`.

```bash
python3 scripts/pointers.py coverage             # in-scope items with a pointer, by type and tier
python3 scripts/pointers.py merge --corpus dse   # resolved pointers as JSON on stdout
python3 scripts/pointers.py check                # CI resolver (target exceptions below)
```

All three commands default to both corpora; `--corpus qb` or `--corpus dse` selects one. The Python API `join_items(load_items(corpus), merge(load_store(corpus)))` returns item copies with `answer_pointer` set to the resolved pointer or `None`; it does not rewrite the staged indexes.

`check` runs in [ci-pointers](../.github/workflows/ci-pointers.yml); it needs only the standard library. It validates records, known item IDs and merge conflicts, and checks that targets exist unless their paths fall under `GENERATED_ROOTS` in `scripts/pointers.py`. Those roots include local/generated artifacts and source papers; target existence is deliberately not checked there.

## Leak fingerprints

`scripts/leak_fingerprints.py` writes the tracked `paper2notes/scripts/leak/fingerprints.v1.json.gz` (salted 8-grams and numsets for the protected QB/DSE corpus, read from `qb-web-ui-staging/` and `paper2notes/notes/qb/data/`); `paper2notes/scripts/leak-check.mjs` consumes it and runs from `ci-check.mjs`. `python3 scripts/leak_fingerprints.py --check` fails when the committed file is stale, and the normalisation mirrors `leak-check.mjs`.

## Tests

```bash
.venv/bin/python -m unittest discover -s tests   # seconds; needs no build
```

The suite runs against fixtures (`tests/fixtures/lq_ocr/`, temp trees) and covers the Book 5 listing rule, the reconstructed layout joiner, the upright section-PDF packing and QB extraction. Tests that inspect generated banks (`tests/sections/`, `tests/reconstructed/`) skip until `./pipeline` has built them. A full rebuild, especially QB conversion and OCR, can take much longer than the fixture suite. For past-paper evidence, build one track - e.g. `./pipeline --only lq-pages,lq-crops,lq-answers,classify-lq,keys,section-pdfs --yes` for the LQ banks (`section-pdfs` needs `keys`) - or one year with `--years`.

## Quality bar

Target: **≤5%** of questions need human manual tuning, including every entry in `scripts/overrides_*.json`.

```bash
./pipeline --only lavish
# or:
python scripts/quality_audit.py --strict
```

`tests/sections/quality_audit.json` counts as failures: missing crop, missing classified copy, uncertain flag, tiny crop, incomplete year folder, and override-tuned questions. It does **not** count missing LQ answer PNGs when no ans PDF exists, or tall LQ crops.

Captain review surface: `.lavish/pipeline-review/index.html` (step-by-step intermediates + finals). Full banks: `.lavish/classified-review/` (MC) and `.lavish/lq-classified-review/` (LQ).

## Quality checklist (minimal human work)

1. **Anchors** - every blue dot beside the question number with a clear gap (not on options or diagrams). Wrong anchors poison every later step. Use `scripts/overrides_*.json` for hard pages (each counts toward the 5% budget).
2. **Uncertain MC** - skim `tests/sections/mc/uncertain.csv` and spot-check a few section folders.
3. **LQ pages** - skim `tests/reconstructed/lq/<year>/combined.pdf` if a question's page range looks wrong (`starts.json`). The last question should stop before any trailing data/formulae sheet or blank "do not write" insert.
4. Trust the section review PDFs under `tests/sections/*/.../combined.pdf` rather than browsing PNG lists. Those PDFs are portrait A4 with year and question labels.
5. Skim `.lavish/pipeline-review/` for the measured rates before accepting a new year.

## Low-level tools

`./segment.py` and `scripts/*.py` remain available for single-paper debugging. Day-to-day use should be `./pipeline` only.
