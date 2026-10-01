# PRD part: README structure, repo map, installation, contribution

Self-contained spec for the root `README.md` and the documents it links to. A consolidation worker merges this part with the other PRD parts; nothing here edits any other file.

Source of truth for facts below: `AGENTS.md`, `CONTRIBUTING.md`, `docs/ARCHITECTURE.md`, `paper2db/README.md`, `paper2notes/README.md`, `paper2notes/deploy/cloudrun/README.md`, `.github/workflows/*.yml`. When the README and those files disagree, the source file wins and the README is fixed.

## 1. Goals

- A newcomer can tell what the repo is, what each subproject does, and how to run each one within one screen of scrolling.
- Every command in the README works from a fresh clone (prerequisites stated), or is explicitly marked as needing local-only inputs.
- Each fact has one owner document; the README summarises and links, never duplicates.
- The contribution path (branch, CI, UI-PR evidence rules) is discoverable from the README in one hop.

Non-goals: rewriting subproject READMEs, changing code, CI or deploy behaviour.

## 2. Audience

| Reader | Needs from the README |
|---|---|
| Student / teacher | Live site link and what the notes cover |
| Contributor to notes | How to preview, where intake lives, CI check, UI PR rules |
| Contributor to banks | How to run `paper2db`, what is tracked versus generated |
| Contributor to mocks | How mocks compile, where they live |
| Agent | Pointers to `AGENTS.md` per subproject |

## 3. Target README skeleton

Order is fixed. Headings are H2 unless noted.

1. **Title and one-line pitch** (H1): `paper2everything`: HKDSE Physics study material from past papers: visual notes, classified question banks, practice mocks.
2. **Live site** link: https://paper2notes-152505675251.asia-east2.run.app/ (the landing page lists every book; no redirect).
3. **What is in this repo**: the subproject table (section 4).
4. **Repository layout**: annotated tree (section 5).
5. **Prerequisites and installation** (section 6).
6. **Quick start per subproject**: preview notes, rebuild banks, compile mocks.
7. **Books covered**: Book 2, 4, 5 with chapter counts and paths. Keep counts in sync with `paper2notes/notes/`.
8. **Data flow in one paragraph**: paper2notes reads paper2db's DSE crops; paper2mock is independent; link to `docs/ARCHITECTURE.md` for the diagram.
9. **Tracked versus generated** (section 7).
10. **CI and deploy** (section 8).
11. **Contributing** (section 9).
12. **Documentation index** (section 10).

Rules: no badges that would go stale; no time or effort estimates; no duplicated long command blocks, so link to the owning README for options beyond the happy path.

## 4. Subproject table (README section 3)

| Folder | Purpose | Stack | Owner doc |
|---|---|---|---|
| `paper2notes/` | Visual HKDSE Physics notes (Books 2, 4, 5), static site | HTML/CSS/JS, vendored three.js and KaTeX, no build | `paper2notes/README.md`, `paper2notes/AGENTS.md` |
| `paper2db/` | Past-paper (MC, LQ) and question-bank (QB) pipeline, classified by syllabus section | Python 3, PyMuPDF, Pillow, tesseract, optional LLM API | `paper2db/README.md`, `paper2db/AGENTS.md` |
| `paper2mock/` | F.1 maths mock papers and marking schemes, 10 sets | LaTeX (LuaLaTeX via latexmk) | `paper2mock/AGENTS.md` |
| `docs/` | Architecture map, board notes, screenshots | Markdown | `docs/ARCHITECTURE.md` |
| `data/` | Working notes such as `p2e-book2-ch01-usability-mistakes.md` | Markdown | none yet; README lists it as notes only |

Add a `Live site` column entry only for `paper2notes/`; the other two have none.

## 5. Repository layout tree (README section 4)

Keep to two levels and one-line comments:

```
paper2everything/
├── AGENTS.md, CONTRIBUTING.md   agent map and contribution rules
├── docs/                        ARCHITECTURE.md, screenshots, PRD parts
├── paper2notes/
│   ├── notes/                   the site: landing, book2/, book4/, book5/, dse/ snapshot
│   │   └── _source/<book-ch>/   intake (ocr.md, outline.md, problems.md, images/, INDEX.md)
│   ├── scripts/                 ci-check.mjs, sync-dse.sh, inject-commit-footer.mjs, audit/
│   └── deploy/cloudrun/         Dockerfile, nginx.conf, deploy.sh, provision.sh
├── paper2db/
│   ├── pipeline                 11-stage entry point (`--list-stages`)
│   ├── paper/{mc,lq,ans,performance}/   source PDFs and notes
│   ├── scripts/                 stage scripts, overrides_*.json, QB converters
│   ├── metadata/                reviewed classifications (tracked)
│   ├── schemas/                 JSON schemas
│   ├── qb-web-ui-staging/       staged QB web UI inputs
│   └── tests/                   pipeline output trees (mostly gitignored)
├── paper2mock/f1/test1/<1..10>/{question-paper,marking-scheme}/
└── .github/workflows/           ci-notes, compile-mocks, deploy-notes
```

Verify each path exists before merging the README (`git ls-files` or `ls`); drop any line that no longer matches.

## 6. Prerequisites and installation (README section 5)

Present as a table, then per-subproject steps. Each row states whether the tool is required for a task.

| Tool | Needed for | Notes |
|---|---|---|
| Git | everything | |
| Python 3 and `pip` | paper2db | use a venv: `python3 -m venv .venv && source .venv/bin/activate && pip install -r paper2db/requirements.txt` |
| tesseract (on `PATH`) | paper2db OCR stages | |
| LibreOffice (headless) | `paper2db/scripts/convert-qb-to-pdf.sh` | QB DOCX to PDF only |
| Node.js 20 | `ci-check.mjs`, footer injection | CI uses 20 |
| A static file server (`python3 -m http.server`) | notes preview | no build step |
| TeX Live with LuaLaTeX and latexmk | paper2mock | compile-check |
| Docker, gcloud | Cloud Run deploy | maintainers only; see `paper2notes/deploy/cloudrun/README.md` |
| Optional LLM API key (`LLM_API_KEY` or `OPENAI_API_KEY` or `TOGETHER_API_KEY`) | better MC and LQ classification | keyword classifiers are the fallback |

Steps, each a fenced block in the README:

- **Preview notes** (no install): `python3 -m http.server --directory paper2notes/notes 8000`, then `http://localhost:8000/` (landing), `/book2/`, `/book5/ch01-radiation-and-radioactivity/`.
- **Rebuild DSE banks**: install Python deps, then `./paper2db/pipeline --force --yes`. State that `paper/` PDFs are tracked and outputs are gitignored.
- **Local DSE preview**: after the pipeline, `./paper2notes/scripts/sync-dse.sh` so `../_local/dse/...` resolves. State that production uses the tracked snapshot `paper2notes/notes/dse/` and needs no sync.
- **Convert QB**: `./paper2db/scripts/convert-qb-to-pdf.sh`. Note that `paper2db/qb/` DOCX and `paper2db/qb-pdf/` are gitignored and must exist locally.
- **Compile a mock**: `cd paper2mock/f1/test1/1/question-paper && latexmk -lualatex` (CI sets `latexmk_use_lualatex: true`; confirm the main `.tex` needs no extra flags).

Open item for the consolidation worker: confirm the local `latexmk` invocation matches CI. `paper2db/requirements.txt` exists and is the documented dependency file.

## 7. Tracked versus generated (README section 9)

A short two-column table, derived from `AGENTS.md` and `paper2db/README.md`:

| Tracked (edit and commit) | Generated or local (never `git add`) |
|---|---|
| `paper2db/paper/**` source PDFs | `paper2db/tests/sections/**`, `paper2db/tests/reconstructed/**` (except `lq/*/starts.json`) |
| `paper2db/metadata/*/llm_classifications.json` | `paper2db/output/`, `paper2db/classified/` (legacy) |
| `paper2db/scripts/overrides_*.json`, `answer_key_overrides.json` | `paper2db/qb/`, `paper2db/qb-pdf/` |
| `paper2db/tests/reconstructed/lq/*/starts.json` | `.lavish/` boards |
| `paper2notes/notes/dse/{mc,lq}/<section>/` snapshot (82 files) | `paper2notes/notes/**/_local/` |
| `paper2mock/**` LaTeX sources | compiled mock PDFs (released by CI, never committed) |

Verify the `qb/` and `qb-pdf/` lines against `.gitignore` before publishing: `AGENTS.md` calls them canonical while `.gitignore` ignores them.

## 8. CI and deploy (README section 10)

| Workflow | Trigger | What it does |
|---|---|---|
| `ci-notes` | PR and push to `main` touching `paper2notes/notes/**`, `paper2notes/scripts/**`, the workflow | `node paper2notes/scripts/ci-check.mjs`: structure, relative links, lavish boards, `deploy-commit-footer` on every deployed HTML |
| `compile-mocks` | PR touching `paper2mock/**` or the workflow; push to `main` | latexmk each question paper and marking scheme; `main` pushes release two zips |
| `deploy-notes` | push to `main` touching `paper2notes/notes/`, `paper2notes/deploy/cloudrun/`, `.dockerignore`, the workflow; manual | `paper2notes/deploy/cloudrun/deploy.sh` to Cloud Run (`asia-east2`) via Workload Identity Federation |

The README links to `paper2notes/deploy/cloudrun/README.md` for the access model and rollback, and does not restate them.

## 9. Contribution section (README section 11)

Content, in order:

1. **Branch and PR**: branch from `main`, open a PR; never push to `main`.
2. **Run the relevant check locally before pushing**: `node paper2notes/scripts/ci-check.mjs` for notes changes; a local `latexmk` build for mocks.
3. **UI PRs** (paper2notes HTML, CSS, JS, visuals, animations, stage): load `.agents/skills/paper2everything-ui-screenshot/SKILL.md` first; before and after screenshots at both 1280x800 and 390x844 are required in the PR body (checklist in skill section 7); use the PR-video skill at `.agents/skills/paper2everything-pr-video/SKILL.md` for motion changes.
4. **Keep generated files out of git**: `_local/`, pipeline outputs, `.lavish/`, compiled PDFs (section 7).
5. **Deployed HTML footer**: do not hand-edit `deploy-commit-footer`; `inject-commit-footer.mjs` owns it.
6. **Where to ask**: issues on `yeungsinchun/paper2everything`.

`CONTRIBUTING.md` stays the canonical detailed file; the README section is a summary that links to it. If the README adds a rule, `CONTRIBUTING.md` gets it in the same PR.

Open item: the 1280x800 plus 390x844 rule comes from PR #67, not yet on `main`. Consolidation should include it only after #67 merges, otherwise state the current `main` rule.

## 10. Cross-link map (README section 12)

| From | To | Purpose |
|---|---|---|
| README | `docs/ARCHITECTURE.md` | diagram, data flows, design findings |
| README | `CONTRIBUTING.md` | full contribution rules |
| README | `AGENTS.md` | agent-facing map |
| README | `paper2notes/README.md` | audit harness, sources, hosting pointer |
| README | `paper2db/README.md` | pipeline stages, tracked inputs, QB census |
| README | `paper2notes/deploy/cloudrun/README.md` | hosting, access model, rollback |
| README | `paper2mock/AGENTS.md` | mock layout |
| `CONTRIBUTING.md` | README | back-link to install and layout |
| Subproject READMEs | root README | one-line "part of paper2everything" back-link (separate PR, not this part) |

All links are relative paths so they work on GitHub and in a local checkout. A link check (every relative link resolves) is part of acceptance.

## 11. Known staleness to fix while rewriting

Found by comparing the current root `README.md` with the files above:

- The current README's DSE section repeats the same pipeline and sync commands twice (Quick preview and "DSE banks"). Collapse to one.
- The "Books" list carries chapter and figure counts (for example "~100 figures") with no owner; keep only counts that `paper2notes/notes/` can verify.
- `paper2db` is described as "27 sections" in the table; confirm against `paper2db/metadata/` and `paper2db/README.md`, and add QB (46 banks, 3847 items) if kept.
- The README says QB DOCX canonical is `paper2db/qb/` while `.gitignore` ignores that path; state clearly that it is a local input.
- `paper2mock` is missing a run or compile command in the current README.

## 12. Acceptance criteria

1. README headings match section 3 in order.
2. Every relative link resolves; every path in the layout tree exists.
3. Every command block either runs from a fresh clone given section 6 prerequisites, or is labelled as needing local-only inputs.
4. No fact duplicated from an owner document beyond a one-line summary plus link.
5. `node paper2notes/scripts/ci-check.mjs` still passes (the README is outside its scope, but confirm no regression).
6. `CONTRIBUTING.md` and README contribution rules agree.
7. No time, duration or effort estimates appear in any changed file.
