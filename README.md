# paper2everything

HKDSE Physics study material from past papers: visual notes, classified question banks, practice mocks.

**Live site:** https://paper2notes-152505675251.asia-east2.run.app/ (the landing page lists every book; no redirect).

Goals, users, UI rules and data contracts are in the [PRD](docs/PRD.md).

## What is in this repo

| Folder | Purpose | Stack | Owner doc |
|---|---|---|---|
| `paper2notes/` | Visual HKDSE Physics notes (Books 2, 4, 5), static site, `/qb` question-bank UI | HTML/CSS/JS, vendored three.js and KaTeX, no build | [`paper2notes/README.md`](paper2notes/README.md), [`paper2notes/AGENTS.md`](paper2notes/AGENTS.md) |
| `paper2db/` | Past-paper (MC, LQ) and question-bank (QB) pipeline, classified by syllabus section | Python 3, PyMuPDF, Pillow, tesseract, optional LLM API | [`paper2db/README.md`](paper2db/README.md), [`paper2db/AGENTS.md`](paper2db/AGENTS.md) |
| `paper2mock/` | F.1 maths mock papers and marking schemes, 10 sets | LaTeX (LuaLaTeX via latexmk) | [`paper2mock/AGENTS.md`](paper2mock/AGENTS.md) |
| `docs/` | PRD, architecture map, board notes, screenshots | Markdown | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| `paper2notes/Paper2Notes Design System/` | Design-system proposal: tokens, components, UI kits | HTML/CSS/JS | its own `readme.md` |
| `data/` | Working notes only (`p2e-book2-ch01-usability-mistakes.md`) | Markdown | none |

## Repository layout

```
paper2everything/
├── AGENTS.md, CONTRIBUTING.md   agent map and contribution rules
├── docs/                        PRD.md, ARCHITECTURE.md, screenshots
├── paper2notes/
│   ├── notes/                   the site: landing, book2/, book4/, book5/, qb/, dse/ snapshot
│   │   └── _source/<book-ch>/   intake (ocr.md, outline.md, problems.md, images/, INDEX.md)
│   ├── scripts/                 ci-check.mjs, leak-check.mjs, leak/, sync-dse.sh, inject-commit-footer.mjs, audit/
│   └── deploy/cloudrun/         Dockerfile, nginx.conf, deploy.sh, provision.sh
├── paper2db/
│   ├── pipeline                 entry point: 11 past-paper stages + 4 QB stages (`--list-stages`)
│   ├── paper/{mc,lq,ans,performance}/   source PDFs and notes
│   ├── scripts/                 stage scripts, overrides_*.json, QB converters
│   ├── metadata/                reviewed pipeline inputs (see paper2db/README.md)
│   ├── schemas/                 JSON schemas
│   ├── qb-web-ui-staging/       staged crops and metadata for the /qb UI
│   └── tests/                   unittest suite; pipeline output trees (mostly gitignored)
├── paper2mock/f1/test1/<1..10>/{question-paper,marking-scheme}/
└── .github/workflows/           see CI and deploy below
```

## Prerequisites

| Tool | Needed for | Notes |
|---|---|---|
| Git | everything | |
| Python 3 and `pip` | paper2db | use a venv |
| tesseract (on `PATH`) | paper2db OCR stages | |
| LibreOffice (headless `soffice`), `pdftoppm` | QB stages | QB DOCX to PDF only |
| Node.js 20 | `ci-check.mjs`, footer injection, audit harness | CI uses 20 |
| `python3 -m http.server` | notes preview | no build step |
| TeX Live with LuaLaTeX and latexmk | paper2mock | compile check |
| Docker, gcloud | Cloud Run deploy | maintainers only |
| LLM API key (`LLM_API_KEY`, `OPENAI_API_KEY` or `TOGETHER_API_KEY`) | better MC and LQ classification | optional; keyword classifiers are the fallback |

## Quick start

**Preview the notes** (no install):

```bash
python3 -m http.server --directory paper2notes/notes 8000
# http://localhost:8000/                                       landing
# http://localhost:8000/book2/
# http://localhost:8000/book5/ch01-radiation-and-radioactivity/
```

**Rebuild the DSE banks** (source PDFs in `paper2db/paper/` are tracked; outputs are gitignored):

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r paper2db/requirements.txt
./paper2db/pipeline --force --yes
```

Options (`--years`, `--from`, `--only`) are in [`paper2db/README.md`](paper2db/README.md).

**Preview DSE decks locally** (production uses the tracked snapshot `paper2notes/notes/dse/` and needs no sync). Run after the pipeline:

```bash
./paper2notes/scripts/sync-dse.sh
```

**Convert the question bank** (needs local-only inputs: the QB DOCX tree in `paper2db/qb/`, which is gitignored):

```bash
./paper2db/scripts/convert-qb-to-pdf.sh
# or the full QB track: ./paper2db/pipeline --only qb-pdf,qb-ocr,qb-items,qb-audit
```

**Compile a mock** (CI builds with LuaLaTeX; the `main.tex` header comments saying `pdflatex` are stale):

```bash
cd paper2mock/f1/test1/1/question-paper && latexmk -lualatex -interaction=nonstopmode -halt-on-error main.tex
```

**Run the CI check locally:**

```bash
node paper2notes/scripts/ci-check.mjs
```

## Books covered

- **Book 2 Force and Motion**: 10 chapters, `paper2notes/notes/book2/`
- **Book 4 Electricity and Magnetism**: 8 chapters, `paper2notes/notes/book4/`
- **Book 5 Radioactivity and Nuclear Energy**: 3 chapters (25 Radiation and Radioactivity, 26 Rate of Decay, 27 Nuclear Energy), `paper2notes/notes/book5/`

DSE banks cover 27 syllabus sections (MC and LQ). The question bank holds 46 banks and 3,847 items (1,881 in scope).

## Data flow

`paper2notes` is a read-only consumer of `paper2db`: pipeline output is published as the tracked snapshot `paper2notes/notes/dse/`, which ships in the Docker image. `paper2mock` is independent. Diagram and design findings: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tracked versus generated

| Tracked (edit and commit) | Generated or local (never `git add`) |
|---|---|
| `paper2db/paper/**` source PDFs | `paper2db/tests/sections/**`, `paper2db/tests/reconstructed/**` (except `lq/*/starts.json`) |
| `paper2db/metadata/` inputs (see [authoritative inventory](paper2db/README.md#layout)) | `paper2db/output/`, `paper2db/classified/` (legacy), `.lavish/` boards |
| `paper2db/scripts/overrides_*.json`, `answer_key_overrides.json` | `paper2db/qb/`, `paper2db/qb-pdf/` |
| `paper2db/tests/reconstructed/lq/*/starts.json` | `paper2notes/notes/**/_local/` |
| `paper2db/qb-web-ui-staging/` (crops and metadata only) | `.audit/` harness output |
| `paper2notes/notes/dse/{mc,lq}/<section>/` snapshot (82 files) | compiled mock PDFs (built and released by CI) |
| `paper2notes/scripts/leak/` (`fingerprints.v1.json.gz` + `baseline.json`) | |
| `paper2mock/**` LaTeX sources | |

## CI and deploy

| Workflow | Trigger | What it does |
|---|---|---|
| `ci-notes` | PR and push to `main` touching `paper2notes/notes/**`, `paper2notes/scripts/**`, the leak generator, or its staging inputs | Notes and leak checks (`ci-check.mjs`, `leak-check.test.mjs`, `leak_fingerprints.py --check`); scope in [`docs/ARCHITECTURE.md` §5](docs/ARCHITECTURE.md#5-ci) |
| [`ci-pointers`](.github/workflows/ci-pointers.yml) | PR and push to `main`; path filters in the workflow | Answer-pointer checks; see [paper2db usage](paper2db/README.md#answer-pointers) |
| `compile-mocks` | PR touching `paper2mock/**`; every push to `main` | LaTeX build of all 20 mock documents; `main` pushes release two zips |
| `deploy-notes` | push to `main` touching `paper2notes/notes/` or `paper2notes/deploy/cloudrun/`; manual | `paper2notes/deploy/cloudrun/deploy.sh` to Cloud Run (`asia-east2`) via Workload Identity Federation |

Access model and rollback: [`paper2notes/deploy/cloudrun/README.md`](paper2notes/deploy/cloudrun/README.md).

## Contributing

Full rules: [`CONTRIBUTING.md`](CONTRIBUTING.md).

1. Branch from `main` and open a PR; never push to `main`.
2. Run the relevant check before pushing: `node paper2notes/scripts/ci-check.mjs` for notes, a local `latexmk` build for mocks.
3. UI PRs (paper2notes HTML, CSS, JS, visuals, animations, stage): load `.agents/skills/paper2everything-ui-screenshot/SKILL.md` first. Before/after screenshots at both 1280×800 and 390×844 are required in the PR body, attached with `gh --attach`. Motion changes also need video at both sizes unless provably invisible at one (`.agents/skills/paper2everything-pr-video/SKILL.md`). The UI checklist is [PRD §6.9](docs/PRD.md#69-acceptance-checklist-per-ui-change).
4. Keep generated files out of git: `_local/`, pipeline outputs, `.lavish/`, compiled PDFs.
5. Do not hand-edit `deploy-commit-footer`; `scripts/inject-commit-footer.mjs` owns it.
6. Questions: issues on `yeungsinchun/paper2everything`.

## Documentation index

| Document | Contents |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Goals, users, content model, UI requirements, pipeline, usability lessons |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Diagram, data flows, design findings |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution rules |
| [`AGENTS.md`](AGENTS.md) | Agent-facing map |
| [`paper2notes/README.md`](paper2notes/README.md) | Audit harness, sources, hosting pointer |
| [`paper2db/README.md`](paper2db/README.md) | Pipeline stages, tracked inputs, QB census |
| [`paper2notes/deploy/cloudrun/README.md`](paper2notes/deploy/cloudrun/README.md) | Hosting, access model, rollback |
| [`paper2mock/AGENTS.md`](paper2mock/AGENTS.md) | Mock layout |
