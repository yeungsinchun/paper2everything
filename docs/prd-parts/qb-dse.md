# PRD part: Question bank, classified DSE crops, and the answerability harness

Status: describes `main` at 8c293bf. Everything below is verified against the code, `paper2db/metadata/`, `paper2db/qb-web-ui-staging/` and `paper2notes/scripts/audit/`. Where a capability is not implemented on `main` it is listed under [Gaps and non-goals](#gaps-and-non-goals) rather than described as present.

## 1. Purpose

Give Hong Kong S5 students practice material that is tied to the notes they study, and give the maintainers a measurable answer to one question: **can every in-scope question be solved using only what the paper2notes pages teach?**

Three assets feed that goal:

1. **Question bank (QB)**: 169 DOCX source files, 46 banks, 3,847 items, of which 1,881 are in scope (Books 2, 4, 5: banks `QB_201`-`QB_210`, `QB_401`-`QB_408`, `QB_501`-`QB_503`, 21 banks). `paper2db/metadata/qb/banks.json` is the source of truth for these counts.
2. **Classified HKDSE past-paper crops**: MC (Paper 1A) and LQ (Paper 1B) questions cropped per question and assigned to 27 curriculum sections.
3. **Answerability harness**: a local, LLM-driven audit in `paper2notes/scripts/audit/` that tries to solve each QB item using only the notes, then reports coverage gaps.

Ownership: `paper2db` produces and stages data; `paper2notes` is a read-only consumer of it (see `AGENTS.md`).

## 2. Question bank pipeline (`paper2db`)

Four stages, run by `./paper2db/pipeline` (stages 12-15 of `--list-stages`). They skip when no DOCX tree is found; the tree is `$P2DB_QB_ROOT` if set, otherwise `paper2db/qb/`.

| Stage | Script | Input | Output (all gitignored under `qb-pdf/`) |
|---|---|---|---|
| `qb-pdf` | `qb_manifest.py verify`, `qb_convert.py` | DOCX tree | `qb-pdf/<bank>/<stem>.pdf` (LibreOffice; PDF-only sources copied) |
| `qb-ocr` | `qb_ocr.py` | PDFs | `<stem>.pdf.txt` via `pdftoppm` + Tesseract |
| `qb-items` | `qb_items.py` | DOCX XML + PDFs + OCR | `qb-pdf/items/<bank>.json`, `items/index.json`, `crops/<id>.png`, `crops/<id>.ans.png` |
| `qb-audit` | `qb_quality.py` | all of the above | `qb-pdf/quality.json`, `.lavish/qb-review/index.html` |

Requirements: LibreOffice (`soffice`), `pdftoppm`, Tesseract on `PATH`. Run only this track with `./pipeline --only qb-pdf,qb-ocr,qb-items,qb-audit`; `--years` does not apply.

### 2.1 Tracked inputs

- `metadata/qb/banks.json`: census (per-bank expected DOCX count, expected item count, `in_scope`). Validated by `scripts/qb_banks.py`.
- `metadata/qb/source-manifest.json`: sha256 per DOCX. Checked by `scripts/qb_manifest.py verify` before conversion; every item records the manifest path and hash in `source_manifest`.

The DOCX sources, PDFs, OCR text, crops and review board are never committed.

### 2.2 Item contract

`schemas/qb-item.v2.json` (`paper2db.qb-item.v2`; `v1` is legacy). Each item carries:

- identity: `id` (e.g. `PHY15011101`), `bank`, `book`, `chapter`, `seq`;
- classification: `type` (`mc | sq | lq | rq`), `level` (`easy | avg | dif`), `part` (`core | ext`), `marks`, `scope` (`in-scope | out-of-scope`);
- content: `stem` (`text` from DOCX with Symbol glyphs mapped to Unicode and `[eq:N]` / `[fig:N]` placeholders, `ocr`, `equations`, `has_figure`, `equation_only`), `options` (A-D), `subparts`;
- `answer`: `status` (`present | from-pdf | missing | derived`), `key`, `worked`, `marking[]` (`part`, `point`, `code`), `source`;
- `images.stem[]` / `images.answer[]` crop paths;
- provenance: `sources[]` (file, sha256, pdf, pages, `bbox_pt`, `origin`) and `source_manifest`;
- `warnings[]` from a closed set: `variant_conflict`, `untagged_source`, `key_missing`, `crop_multi_page`, `zh_gloss`, `from_pdf_key`, `equation_heavy`.

Variants of the same item code are merged. Answer precedence: `_ans` / `_answer` / `_yes_ans` DOCX, then plain `_e` DOCX with answer blocks, then PDF text layer (`QB_202` MC), then missing.

### 2.3 Quality gate (`qb-audit`)

`qb_quality.py` fails the run unless all of the following hold (counts read from `banks.json`):

- every real DOCX has a PDF (169);
- 3,847 unique items, 1,881 in scope, matching per-bank counts;
- every item has a stem crop;
- per-bank `answer.status == present` counts match the expected key-status table;
- converter render check: LibreOffice vs the Quartz PDFs that have DOCX twins (page count within ±1), and every Symbol-font glyph of a DOCX appears in its PDF text layer with no Symbol private-use code points left.

The local review board samples 5% of crops per bank for human inspection.

### 2.4 Staging for the web UI

`paper2db/qb-web-ui-staging/qb/` is the tracked, UI-ready snapshot: `items/<bank>.json` and `items/index.json`, palette-optimised `crops/*.png`, and `manifest.json` (per-bank counts and sizes, warnings summary, tool versions, list of missing crops). Only crops and metadata are committed; `.docx` and full PDFs never are. Generated 2026-09-29: 3,847 items, 46 banks.

## 3. Classified DSE crops (`paper2db`)

### 3.1 Flow

Stages 1-11 of the pipeline. Source PDFs live in `paper/{mc,lq,ans,performance}/`.

- **MC**: `mc-anchors` (blue dots, human review of `intermediate/mc/<year>/anchor.pdf`) → `mc-split` (per-question `qN.png`) → `keys` (answer letters and correct-% into `tests/sections/mc/answer_keys.json`, patched by `scripts/answer_key_overrides.json`) → `classify-mc`.
- **LQ**: `lq-pages` → `lq-crops` (whole exam-page stack per question, `page_from`..`page_to` from `starts.json`; no within-page crop; trailing data/formula sheets excluded) → `lq-answers` (marking-scheme crops under `ans/`) → `lq-performance` (candidate-performance notes from `paper/performance/*.md`) → `classify-lq`.
- **Both**: `section-pdfs` (per-section A4 `combined.pdf`, plus LQ `answers.pdf` / `performance.pdf`) → `lavish` (quality audit and review HTML).

### 3.2 Classification

27 syllabus sections across Books 1-5 (Heat and Gases, Force and Motion, Wave Motion, Ray Optics, Electricity and Magnetism, Radioactivity and Nuclear Energy). Two backends per paper type: an LLM backend (`classify_mc_llm.py`, `classify_lq_llm.py`; needs `LLM_API_KEY`, `OPENAI_API_KEY` or `TOGETHER_API_KEY`) and a keyword fallback (`classify_mc_sections.py`, `classify_lq_keywords.py`). An LQ may belong to several sections; `apply_book5_listings()` lists every Book 5 section a radioactivity LQ tests, and the section PDFs include non-primary listings.

Decisions are tracked because they cost paid, nondeterministic calls: `metadata/mc/llm_classifications.json` (573 MC items across 2012-2026 plus `pp` and `sap`) and `metadata/lq/llm_classifications.json`. They are replayable with `--from-json`.

### 3.3 Hand-tuned tracked inputs

`scripts/overrides_<year>.json` (MC anchor overrides; 2012, 2015, 2016, 2018, 2019, 2020), `scripts/answer_key_overrides.json`, and `tests/reconstructed/lq/<year>/starts.json`. Quality bar: at most 5% of questions need manual tuning; `scripts/quality_audit.py --strict` writes `tests/sections/quality_audit.json` counting missing crops, missing classified copies, uncertain flags, tiny crops, incomplete years and override-tuned questions.

### 3.4 Staging for the web UI

| Snapshot | Contents | Counts |
|---|---|---|
| `qb-web-ui-staging/dse-mc/` (`stage_dse_mc.py`) | `crops/<year>/qNN.png` + `.webp`, `index.json` (year, question, sections, reason, answer option and %, image paths, warnings), `sections.json`, `stats.json`, `manifest.json` | 435 items, 2012-2024 (36 for 2012-2013, 33 for 2014-2024); the classification file covers 573 |
| `qb-web-ui-staging/dse-lq/` (`stage_lq_qb_web_ui.py`) | whole-page question PNGs `YYYY-qN.png`, answer crops `YYYY-qN-ans.png`, per-section copies, `candidate_performance.json`, `manifest.json`, `index.json`, `raw/` | 170 questions; 112 with answer crops (58 missing); 144 with candidate-performance notes (26 missing) |

Missing data is flagged per item (`warnings`, `missing_flags`), never silently dropped. MC warnings: `missing_answer`, `missing_percentage`, `uncertain_classification`, `missing_crop`. Missing performance notes are expected for 2026, `pp`, and any question whose performance markdown has no Section B note. Full DSE PDFs are never staged (`.gitignore` excludes `*.pdf`).

Separately, `paper2notes/notes/dse/{mc,lq}/<section>/` (82 files) is the published snapshot that ships to Cloud Run and renders the in-page DSE decks; see `AGENTS.md` for the local sync procedure.

## 4. Answerability harness (`paper2notes/scripts/audit/`)

### 4.1 Question it answers

For each in-scope QB item, can a student who has read **only** the relevant notes pages, plus a fixed allowlist of Force-and-Motion and maths prior knowledge, reach the marked answer? The result is a per-item verdict, a per-section coverage figure, and a list of missing concepts to write into the notes.

The harness is local-only. It needs Node.js, the `pi` LLM CLI (`PI_BIN` overrides the binary), Google Chrome for figure capture, the chapter pages under `notes/book{2,4,5}/`, and item JSON at `paper2db/qb-pdf/items/<bank>.json`. Outputs go to gitignored `.audit/`; they contain QB stems and crops and must never be committed or pasted into `notes/` or a PR. Item ids are safe to cite.

### 4.2 Stages

1. **Bundle** (`bundle.mjs`, `bank-pages.mjs`). Extract student-visible content from the notes HTML (every idea block, every figure with three frames for animated ones, and the in-page DSE past-paper decks, `section.section-dse`) into `notes.md` plus `fig-*.png` screenshots taken over CDP at DPR 2. Blocks carry anchors such as `[§25-1.B #knockout]`. Where a deck's images live in gitignored `_local/dse/`, the bundle includes what is present and records the rest in `manifest.json`. A bank's "B" bundle is cumulative: all earlier chapters of the same book plus its own.
2. **Map** (`map.mjs`, `prompts/map.system.md`). One call per item maps it to a section id with `confidence` and `secondary` sections, using section titles, learning-objective bullets and idea headings, without solving. Confidence below 0.6 falls back to all sections of the chapter.
3. **Solve** (`solve.mjs`, `prompts/solver.*.md`, `prompts/prior.md`). A stateless, tool-less process in an empty working directory sees only the bundle, the PRIOR allowlist (`P-FM-01`..`18`, `P-MA-01`..`06`, `P-GIVEN`) and the item stem image. It never sees the answer. Every step cites exactly one source (`given`, `math:`, `prior:`, or `notes:<anchor>` with a verbatim quote of 25 words or fewer). Needed facts outside those sources go in `missing[]`, and `self_verdict` is `solved | partial | blocked`. Logarithms and exponentials are deliberately not in PRIOR, so Book 5 must teach them.
4. **Judge** (`judge.mjs`, `prompts/judge.system.md`). Three checks per sample: a deterministic quote check (every quote must match the cited block at token coverage of at least 0.9, and every prior id must exist); a separate LLM judge that does receive the key, marking scheme and answer crop and returns per-step `supported | unsupported | prior-leak`, per-point `earned | lost-knowledge | lost-reasoning | lost-arithmetic` (with the missing concept and syllabus LO id), and `cause` in `ok | knowledge-gap | reasoning-error | item-defect | key-defect`; and a leakage check (8-gram and number-tuple overlap between stem and notes blocks).
5. **Orchestrate** (`run.mjs`). Runs two tiers per item: **S** (mapped section plus `summary.html`) and **B** (cumulative bank bundle). K samples per tier (default 3, `--k`). A tier passes when at least `ceil(2K/3)` samples have `cause == ok`, a passing quote check, all steps supported, and a correct MC answer or all marking points earned.
6. **Report** (`report.mjs`). Writes `.audit/coverage.json` and a local coverage board `.audit/lavish/qb-audit/index.html`.

CLI: `node paper2notes/scripts/audit/run.mjs [--bank QB_501 | --all] [--fixture <file>] [--concurrency 8] [--k 3] [--regress]`, then `report.mjs` (`--coverage-only` skips the board). `--all` covers the 21 in-scope banks; the default bank is `QB_501`, for which a small fixture `scripts/audit/fixtures/QB_501.json` is committed (not a substitute for the real bank).

### 4.3 Verdicts

| Verdict | Condition |
|---|---|
| `pass` | tier S passes, no leakage |
| `pass-leaked` | tier S passes but stem and notes overlap heavily |
| `cross-ref` | only the cumulative tier B passes: the knowledge exists in the notes but not in the mapped section |
| `gap` | a sample reports `knowledge-gap`; missing concepts are collected |
| `reasoning` | fails without a knowledge gap |
| `defect` | any tier-S sample judged `item-defect` or `key-defect` |
| `error` | execution failure in a tier; never cached |

### 4.4 Completeness rule

A bank or section is **complete** when every inventory item has a result and a `part`, at least 95% of `core` items are `pass`, `pass-leaked` or `cross-ref`, and there is no must-fix failure. Must-fix: a failing item worth 4 or more marks that maps to a known section, or any missing concept cited by two or more failing core items. Overall completeness requires every bank to be complete.

### 4.5 Reproducibility

Results are cached under `.audit/cache/` by a key over item sha, image sha, bundle sha (both tiers), mapping, prompt sha (all five prompt files), code sha (six scripts), model, `pi` version and K. A result is reused only when its key matches and it is not an `error`; `--regress` forces recomputation. The model is pinned in code (`meta/muse-spark-1.2-contributor`; solver thinking high, judge thinking max).

## 5. Interfaces and contracts

| Producer | Consumer | Contract |
|---|---|---|
| `paper2db` QB stages | harness, `/qb` UI | `paper2db.qb-item.v2`; `qb-pdf/items/<bank>.json` and `qb-web-ui-staging/qb/items/` |
| `paper2db` MC/LQ stages | `/qb` UI, notes DSE decks | `qb-web-ui-staging/dse-{mc,lq}/index.json`, `sections.json`; `paper2notes/notes/dse/` snapshot |
| notes HTML | harness | anchors and `section-dse` markup read by `bundle.mjs`; page layout `notes/book*/chNN*/<n>-<n>.html` and `summary.html` read by `bank-pages.mjs` |
| harness | maintainers | `.audit/coverage.json`, verdict per item id, missing concepts with LO ids |

## 6. Acceptance criteria

1. `./paper2db/pipeline --only qb-pdf,qb-ocr,qb-items,qb-audit` passes the gate in section 2.3 with counts from `banks.json`.
2. `python -m unittest discover -s paper2db/tests` passes without a build (fixtures only).
3. `qb-web-ui-staging/qb/manifest.json` reports 3,847 items, 46 banks, and lists every missing crop.
4. DSE staging counts reconcile: 435 MC (2012-2024) and 170 LQ, with missing answers, performance notes and crops flagged per item.
5. A harness run on a bank yields one result file per inventory item, and `report.mjs` produces coverage with the section 4.4 completeness rule.
6. No QB stem, crop, DOCX, full PDF or `.audit/` output is tracked in git.

## Gaps and non-goals

- The harness audits **QB items only**. The DSE decks are part of the notes bundle (what the solver may read), but DSE MC/LQ questions themselves are not yet audited as items; there is no DSE item-record format and no per-DSE-question answerability verdict on `main`.
- `bank-pages.mjs` and `run.mjs --all` hard-code the 21 in-scope bank ids; they are not derived from `banks.json`. Bank-to-chapter mapping is hard-coded; the harness is tied to the Books 2, 4 and 5 layout.
- Comments in the harness cite a planning document ("plan §4.x", decisions D3/D4) that is not in the repository; the behaviour above is taken from the code.
- The model id is hard-coded in `map.mjs`, `run.mjs`, `solve.mjs` and `judge.mjs` rather than configured.
- No CI workflow (`ci-notes`, `compile-mocks`, `deploy-notes`) runs the harness. It depends on a paid or rate-limited LLM, `pi` and Chrome, so it is run by hand. CI (`paper2notes/scripts/ci-check.mjs`) does not verify the `paper2db` to `paper2notes` data contract.
- `qb-web-ui-staging/dse-mc/` stages 435 of 573 classified MC items (2012-2024 only); 2025, 2026, `pp` and `sap` are not staged.
- QB items carry no section classification beyond `bank`/`chapter`; DSE items use the 27-section taxonomy. The harness maps QB items to notes sections itself (`map.mjs`) and does not write that mapping back into `paper2db`.
- Out of scope here: the `/qb` UI itself, the notes site, and `paper2mock`.
