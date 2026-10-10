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

## Shared assets

Every book links one copy of the shared styles, scripts and vendored libraries. A book holds only its own content and a thin book sheet. `scripts/ci-check.mjs` fails a book that keeps its own copy of any of these files, or links a page to anything other than the shared copy.

| Shared file (under `notes/`) | What it holds |
|---|---|
| `css/notes.css` | Design-system tokens, page frame, top bar and nav, sections, figures and stages, HUD labels, `.def` `.tip` `.eq` `.worked`, `table.notes`, concept checks, DSE quiz decks, chapter cards, traps, formula sheet, learning primitives (`.p2n-defs`, `.p2n-formula`, `.p2n-compare`, readouts, `.fig-frame`, `.scene-toolbar`), print and reduced-motion rules |
| `js/checks.js` | MC, true/false and Show answer checks; DSE decks (Prev/Next, A to D grading, PDF links); Export notes as PDF |
| `js/math.js` | KaTeX auto-render with `\(...\)`, `\[...\]` and `$$...$$` (a single `$` is not maths) |
| `js/scene-kit.js` | `window.P2NScene` three.js helpers: `stage`, `placeHud`, `projectXY`, `wavyArrow`, `ball`, `box`, `axes`, `curveLine` |
| `vendor/katex/`, `vendor/three/three.min.js` | Vendored KaTeX and three.js |

A book `book<N>/` adds only:

- `css/book.css`: the book's identity colour, plus rules only that book needs. Books 2 and 5 set two variables. Book 4 also keeps its figure rules and a "Book 4 look" section where it still differs from the shared sheet.
- `js/quiz-data.js`, if the book has DSE decks: `window.P2N_QUIZ = { paperLos, quizKeys }`. The header of `notes/js/checks.js` gives the format.
- Its own scene scripts (`js/diagrams3d.js` per book or per chapter) and optional chapter sheets (`ch<NN>-<slug>/css/notes.css`) for that chapter's figures only.

A chapter page (`notes/book<N>/ch<NN>-<slug>/<page>.html`) links them in this order:

```html
<link rel="stylesheet" href="../../css/notes.css">
<link rel="stylesheet" href="../css/book.css">
<link rel="stylesheet" href="css/notes.css">            <!-- optional chapter sheet -->
<link rel="stylesheet" href="../../vendor/katex/katex.min.css">
...
<script src="../../vendor/katex/katex.min.js"></script>
<script src="../../vendor/katex/auto-render.min.js"></script>
<script src="../../js/math.js"></script>
<script src="../js/quiz-data.js"></script>              <!-- pages with DSE decks -->
<script src="../../js/checks.js"></script>
<script src="../../vendor/three/three.min.js"></script>  <!-- pages with three.js figures -->
<script src="../../js/scene-kit.js"></script>
<script src="js/diagrams3d.js"></script>
```

The thin book sheet for a new book `N`:

```css
/* Book N sheet: loaded after ../../css/notes.css. */
:root {
  --tone: #2A62A8;        /* or var(--bookN) once the design system defines it */
  --tone-soft: #E6EEF8;
}
```

`--tone` colours the kicker, section numbers and chapter-card numbers. Change a shared rule in `notes/css/notes.css`, for every book at once, rather than overriding it in one book. A DSE deck that has no prebuilt PDFs can carry `data-quiz-scan-export` to get an "Export PDF" button that prints its scans.

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

Pull requests and pushes to `main` run the root `.github/workflows/ci-notes.yml` check. For its scope and local check command, see `../docs/ARCHITECTURE.md` §5.
