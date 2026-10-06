# paper2notes

Convert HKDSE Physics source material into HTML notes that prioritize interactive and non-interactive visual diagrams, keep prose minimal, and include concept checks.

## Sources (local, not committed)

| Path | Role |
|------|------|
| `active-physics/` | Active Physics textbooks (PDF) |
| `ch1.pdf`-`ch5.pdf` | HKDSE Physics Compulsory Part syllabus PDFs |
| `dse-classified/` | Classified HKDSE MC/LQ banks by syllabus section |
| `QB_501/` | Active Physics Book 5 Chapter 1 question bank |
| `QB_502/` | Active Physics Book 5 Chapter 2 question bank |
| `QB_503/` | Active Physics Book 5 Chapter 3 question bank |

## Notes

HTML notes live under `notes/`. Follow textbook order; prefer visual animation over text.

## Question-bank usability audit

The local audit harness in `scripts/audit/` checks question-bank items against the notes pages. The in-page DSE decks are stripped from the notes bundle and audited as items instead (`--dse-section`). Banks and book layouts are listed in `scripts/audit/books.json`. It needs Node.js, `pi`, Google Chrome for figure capture, chapter pages under `notes/book2/`, `notes/book4/`, or `notes/book5/`, and item JSON at `../paper2db/qb-pdf/items/QB_*.json` (monorepo; also accepts `paper2db/qb-pdf/items/` for the standalone layout). Item images referenced by the JSON must be available at their paths. The repository contains a small `QB_501` fixture for a local harness run; it is not a substitute for the real bank.

```sh
node scripts/audit/run.mjs --bank QB_501 --fixture scripts/audit/fixtures/QB_501.json
node scripts/audit/report.mjs
```

Use `--bank QB_501` with the real item file, or `--all` when every bank's pages and item files are present. Narrow a run with `--items id,id`, `--page 25-1`, or `--dse-section 25.1|all`; `node scripts/audit/audit.mjs verify` checks results, mappings and bundles for consistency (non-passing results carry `pointer_candidates`, anchors that are real DOM ids). Results, bundles, mappings, and the HTML coverage board are written under gitignored `.audit/` (override the root with `P2E_AUDIT_ROOT`). Keep those local: they can contain question-bank material and cropped images.

## Hosting

See `deploy/cloudrun/README.md` for Cloud Run hosting and `../docs/ARCHITECTURE.md` (repo root) for the monorepo deploy path — the monorepo workflow is `.github/workflows/deploy-notes.yml` at the repo root (see `../docs/ARCHITECTURE.md` §6). Live site: https://paper2notes-152505675251.asia-east2.run.app/.

## CI

Pull requests and pushes to `main` run the root `.github/workflows/notes-checks.yml` check. For its scope and local check command, see `../docs/ARCHITECTURE.md` §5.
