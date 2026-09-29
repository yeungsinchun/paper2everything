# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Notes

HTML notes live under `notes/`. Open a chapter `index.html` in a browser (no build). Book entries are `notes/book2/index.html` (10 ch), `notes/book4/index.html` (8 ch, §§20-24) and `notes/book5/index.html` (3 ch, §§25-27); see chapter cards for coverage. Intake for each chapter is `notes/_source/<book-ch>/` (e.g. `book4-ch01`). Pedagogy: `.cursor/skills/visual-html-notes/SKILL.md` (rule `.cursor/rules/visual-html-notes.mdc` points there). Local textbooks, banks, and syllabus PDFs (`active-physics/`, `dse-classified/`, `QB_501/`, `QB_502/`, `QB_503/`, `ch1.pdf`-`ch5.pdf`) are gitignored. Student pages must not show intake/OCR/QB provenance; keep that in `_source` or HTML comments.

Book coverage is listed in each `notes/book*/index.html`. Figures use local three.js (`js/lib/three.min.js` / `js/diagrams3d.js`, no build) — Book 4 has ~70 visuals incl. 3D field/circuit/motor stages. Maths uses vendored KaTeX at `notes/<book>/vendor/katex/` (one copy per book, no CDN) with `\(...\)`/`\[...\]` delimiters. Book 2 chapter pages retain a Learning objectives block ("Students should be able to" from syllabus); Book 4 (Electricity and Magnetism, ch4.pdf §§20-24) and Book 5 (Radioactivity, ch5.pdf §§25-27) are minimal concise notes without syllabus-map lo-block per #37-#38 (no "How this book maps..." block, prose kept to tables/def/checks, prior assumes only force & motion; LaTeX delimiters kept for KaTeX). Classified DSE papers live in each subsection as separate MC and LQ end-of-section quizzes (one item at a time, Prev/Next), not as year chips on those bullets and not as a dump on `summary.html`. Each subsection page has an Export notes as PDF button at the top-right that prints the notes themselves, and each MC/LQ quiz deck links This section / Whole chapter PDFs for that deck. Scans and PDFs come from gitignored `notes/_local/dse/` mirrored to `notes/book*/_local/dse/` (e.g. `mc/25/25.1.pdf`, `mc/20/combined.pdf`; production snapshot `notes/dse/` staged to `_local` in Dockerfile). Browser interactives for Book 5 Ch.1–2 are covered by `js/notes.interactives.test.mjs` (needs Google Chrome; the DSE-quiz test also needs those local scans, so it fails in a checkout without `_local/dse/`). Book 4 has no harness; Book 5 Ch.3 has no interactive test harness.

Hosting: `notes/` is served by nginx on Cloud Run — see `deploy/cloudrun/README.md` and `../docs/ARCHITECTURE.md` §6 (in the `paper2everything` monorepo the deploy is `.github/workflows/deploy-notes.yml` at the repo root; `deploy/cloudrun/provision.sh` remains the source of truth for cloud resources and the root `.dockerignore` keeps `notes/_source/`, `_local/`, and tests out of the image).

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

## Monorepo

Part of paper2everything monorepo — see root README.md. Canonical QB is paper2db/qb/.
