# Part: Repo structure, pipeline, CI and mocks

Self-contained section of the paper2everything PRD/README. It describes the repository as implemented on `main` at `8c293bf`. Deeper design analysis lives in `docs/ARCHITECTURE.md`.

## 1. Repository structure

One git repository, three subprojects. Only one code-level dependency connects them: paper2notes reads paper2db's DSE crops. paper2mock is fully independent. The graph has no cycle.

| Path | Purpose | Runtime |
|---|---|---|
| `paper2db/` | Turns HKDSE Physics past papers into per-question crops and syllabus-section banks, plus the QB question-bank stages | Python 3 (PyMuPDF, Pillow, Tesseract OCR, optional LLM API) |
| `paper2notes/` | Student-facing static site (`paper2notes/notes/`) plus CI check, deploy scripts and Cloud Run config | Static HTML/CSS/JS (vendored three.js, KaTeX); Node for checks; Docker + nginx for hosting |
| `paper2mock/` | LaTeX mock exams: `paper2mock/f1/test1/<1..10>/{question-paper,marking-scheme}/` | LuaLaTeX via latexmk (CI) |
| `.github/workflows/` | The three workflows that actually run (`ci-notes`, `compile-mocks`, `deploy-notes`) | GitHub Actions |
| `docs/` | `ARCHITECTURE.md`, Lavish board docs, screenshots, PRD parts | Markdown |

### Tracked versus generated

- **Tracked inputs:** source PDFs in `paper2db/paper/{mc,lq,ans,performance}/`; paid LLM decisions in `paper2db/metadata/{mc,lq}/llm_classifications.json`; hand-tuned `paper2db/scripts/overrides_*.json`, `answer_key_overrides.json` and `paper2db/tests/reconstructed/lq/*/starts.json`; QB census `paper2db/metadata/qb/{banks,source-manifest}.json`; all `paper2mock/**/*.tex`; the whole `paper2notes/notes/` tree, including the published DSE snapshot `paper2notes/notes/dse/{mc,lq}/<NN>/` (82 files) and intake `notes/_source/`.
- **Generated, gitignored:** `paper2db/intermediate/`, the rest of `paper2db/tests/reconstructed/`, `paper2db/tests/sections/`, `paper2db/.lavish/`, legacy `paper2db/{output,classified}/`, QB `paper2db/{qb,qb-pdf}/`, and every `paper2notes/notes/**/_local/` directory.
- **Never committed:** mock PDFs. CI builds them.

Rule of thumb: keep generated output and `_local/` out of git. `paper2db/README.md` lists the reviewed JSON inputs that stay tracked.

## 2. paper2db pipeline

Entry point: `./paper2db/pipeline` (`--list-stages` prints the stages). Setup: Python venv, `pip install -r paper2db/requirements.txt`, `tesseract` on `PATH`.

### Stages, in order

Past-paper stages: `mc-anchors`, `mc-split`, `lq-pages`, `lq-crops`, `lq-answers`, `keys`, `classify-mc`, `lq-performance`, `classify-lq`, `section-pdfs`, `lavish`.
QB stages (run when a QB DOCX tree exists): `qb-pdf`, `qb-ocr`, `qb-items`, `qb-audit`.

### Flags

| Flag | Effect |
|---|---|
| `--years 2025` | One past-paper year |
| `--from <stage>` | Resume mid-pipeline |
| `--only a,b` | Run only the named stages |
| `--force` | Rebuild even when outputs exist |
| `--yes` | Print review-gate paths without waiting for Enter |
| `--list-stages` | List stages and exit |

Review gates (MC anchors, optional LQ crops, uncertain classifications) pause for a human unless `--yes` is passed.

### Classification

`classify-mc` and `classify-lq` use an LLM when `LLM_API_KEY` (or `OPENAI_API_KEY` / `TOGETHER_API_KEY`) is set, with optional `LLM_BASE_URL` and `LLM_MODEL`. With no key they fall back to keyword classifiers. Decisions are written to the tracked `metadata/{mc,lq}/llm_classifications.json` and replayable with `--from-json`, so rebuilding does not re-bill or re-randomise them.

### Outputs

`section-pdfs` writes the product paper2notes consumes: `paper2db/tests/sections/{mc,lq}/<NN_Book>/<NN_Section>/`, holding PNG crops (`YYYY_qN.png` for MC, `YYYY-qN.png` and `YYYY-qN-ans.png` for LQ) and a `combined.pdf`. It also writes CSVs, `answer_keys.json`, `quality_audit.json` and `candidate_performance.json`. Everything is reproducible from `paper/` with `./pipeline --force --yes`.

### Tests and CI coverage

`paper2db/tests/test_*.py` is a `unittest` suite (pipeline, QB pipeline and items, combine, A4 page size, quality audit, LQ page and section behaviour). **No workflow runs it.** The paper2db pipeline itself is also not run in CI.

### DSE wiring to paper2notes

paper2notes is a read-only consumer of paper2db.

- **Production:** the tracked snapshot `paper2notes/notes/dse/{mc,lq}/<NN>/` is staged to `_local/dse/` (and each `book*/_local/dse/`) by the `Dockerfile` at image build. HTML decks therefore render in production without running the pipeline.
- **Local preview:** run `./paper2db/pipeline --force --yes`, then `./paper2notes/scripts/sync-dse.sh`, then `python -m http.server --directory paper2notes/notes`. Pages reference `../_local/dse/...`, which resolves to `notes/book*/_local/dse/`.
- **Gap:** the snapshot must be kept in sync with HTML references and with paper2db reclassification by hand. No check covers this (`ci-check.mjs` skips links that go through `_local/`).

## 3. CI workflows

Three workflows run, all in `.github/workflows/`. Nested copies under `paper2notes/.github/workflows/` and `paper2mock/.github/workflows/` are never run by GitHub.

| Workflow | Trigger | What it does |
|---|---|---|
| `ci-notes.yml` | PR and push to `main` touching `paper2notes/notes/**`, `paper2notes/scripts/**`, `paper2notes/.github/workflows/**` or itself | Node 20, `node paper2notes/scripts/ci-check.mjs` |
| `compile-mocks.yml` | PR touching `paper2mock/**` or itself; every push to `main` (no path filter on push) | Matrix LaTeX build of 20 documents, artifacts per PR, release on `main` |
| `deploy-notes.yml` | Push to `main` touching `paper2notes/notes/**`, `paper2notes/deploy/cloudrun/**`, `.dockerignore` or itself; manual `workflow_dispatch` | Cloud Run deploy |

### ci-check.mjs

`paper2notes/scripts/ci-check.mjs` is a no-op skip when `notes/` does not exist. Otherwise it checks:

1. Book 5, Book 2 and Book 4 structure (chapter directories and non-empty indexes).
2. Relative `href`/`src` links resolve on disk (links through `_local/` are skipped via `isKnownLocalOnly`).
3. Site region consistency.
4. Lavish notes-refactor boards: before/after side-by-side at 1280 and 390 widths and the readable-measure contract. Only boards carrying the notes-refactor marker are enforced.
5. `deploy-commit-footer`: every deployed `paper2notes/notes/**/*.html` (excluding `_source` and `_local`) must carry `<footer class="deploy-commit-footer" data-commit="<6-char>">deployed commit: <code>…</code></footer>` with a well-formed `data-commit`.

Not in CI: the Book 5 Puppeteer interactive tests (`notes.interactives.test.mjs`, hardcoded macOS Chrome path) and `sync-dse.sh`.

### Deploy

`deploy-notes.yml` authenticates with Workload Identity Federation (secrets `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_DEPLOYER_SERVICE_ACCOUNT`, identifiers only, no keys), then runs `paper2notes/deploy/cloudrun/deploy.sh`. Runs are serialised by the `deploy-cloudrun` concurrency group and use the `production` environment.

`deploy.sh`:

1. Resolves the 6-char `HEAD` (or `local`).
2. Injects or updates the footer in every notes HTML via `paper2notes/scripts/inject-commit-footer.mjs --commit <sha>`.
3. Builds `paper2notes/deploy/cloudrun/Dockerfile` with the repo root as context and `--build-arg GIT_COMMIT=<sha>`.
4. Pushes to Artifact Registry `asia-east2-docker.pkg.dev/paper2notes-site/paper2notes/site`.
5. Runs `gcloud run deploy` for service `paper2notes` in `asia-east2` (project `paper2notes-site`).
6. Checks that `/`, `/book2/`, `/book4/` and `/book5/` return 200.

The root `.dockerignore` admits only `paper2notes/notes/` and `nginx.conf`, minus `_source/`, `**/_local/` and `*.test.mjs`. nginx serves static files on port 8080. The public URL is `https://paper2notes-152505675251.asia-east2.run.app/`. One-time GCP setup is `provision.sh`; details are in `paper2notes/deploy/cloudrun/README.md`.

### UI PRs

PRs that change paper2notes HTML/CSS/JS, visuals, animations or stage must include before/after screenshots in the PR body, per `.agents/skills/paper2everything-ui-screenshot/SKILL.md`.

## 4. compile-mocks and paper2mock

### Layout

`paper2mock/f1/test1/<1..10>/` holds 10 mocks. Each has two independent LaTeX projects, `question-paper/` and `marking-scheme/`, each with a `main.tex` driver. The question paper splits into `config.tex`, `style.tex`, `cover.tex`, `content.tex`, `marks-table.tex` and `questions/qN.tex`. The marking scheme has `config.tex`, `style.tex`, `content.tex` and `questions/`.

### Build

`compile-mocks.yml` runs one matrix job per project (20 total), named `mock<N>-question-paper` and `mock<N>-marking-scheme`:

1. `xu-cheng/latex-action@v3` with `working_directory` set to the project, `root_file: main.tex`, `-interaction=nonstopmode -halt-on-error` and `latexmk_use_lualatex: true`.
2. Copy `main.pdf` to `<name>.pdf`.
3. Upload it as a per-document artifact.

The `main.tex` header comments mention `pdflatex`, but CI compiles with LuaLaTeX. A new mock must build under LuaLaTeX.

### Release

On push to `main`, the `release` job downloads all artifacts, builds `question-papers.zip` and `marking-schemes.zip`, and publishes both to release `build-<sha>` using `ncipollo/release-action` (pinned by commit SHA, `allowUpdates` and `replacesArtifacts` on). It needs `contents: write`. PRs get artifacts only and no release.

### Adding a mock

Add `paper2mock/f1/test1/<N>/{question-paper,marking-scheme}/` and add two matrix entries to `compile-mocks.yml`. The matrix is hand-listed, so a mock without an entry is never built.

## 5. Known gaps and follow-ups

- **Matrix maintenance:** the `compile-mocks` matrix is hand-written. Generating it from the directory tree would remove that step.
- **Push-path cost:** `compile-mocks` runs all 20 LaTeX jobs and a release on every push to `main`, including notes-only merges. PRs are path-filtered; pushes are not.
- **paper2db untested in CI:** no workflow runs its `unittest` suite.
- **Unchecked DSE contract:** nothing verifies that notes references exist in the snapshot or agree with paper2db classification.
- **Dead config:** nested `paper2notes/.github/workflows/`, `paper2mock/.github/workflows/` and `paper2notes/.dockerignore` are never used, and `ci-notes.yml` still path-filters on `paper2notes/.github/workflows/**`.
