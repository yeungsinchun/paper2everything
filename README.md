# paper2everything
Monorepo: paper2notes + paper2db + paper2mock

| Folder | Purpose | Live site |
|--------|---------|-----------|
| `paper2notes/` | Visual HKDSE Physics notes (Books 2,4,5) | https://paper2notes-152505675251.asia-east2.run.app/ |
| `paper2db/` | Classified paper banks (27 sections, MC+LQ) | — |
| `paper2mock/` | F.1 maths mocks (LaTeX) | — |

## Quick preview

```bash
# Notes: open one chapter in a browser (no build)
python3 -m http.server --directory paper2notes/notes 8000
# then visit http://localhost:8000/book2/
# or http://localhost:8000/book5/ch01-radiation-and-radioactivity/

# DSE banks: rebuild from paper/ PDFs
./paper2db/pipeline --yes --force

# QB banks: DOCX -> PDF (LibreOffice headless)
./paper2db/scripts/convert-qb-to-pdf.sh

# Sync DSE crops for local preview
./paper2notes/scripts/sync-dse.sh

# CI
node paper2notes/scripts/ci-check.mjs
```

## Books
- **Book 2 Force and Motion** (syllabus II, ch2.pdf, 10 chapters via QB_201-210) — `paper2notes/notes/book2/`
- **Book 4 Electricity and Magnetism** (syllabus IV, ch4.pdf, 8 chapters) — `paper2notes/notes/book4/`
- **Book 5 Radioactivity and Nuclear Energy** (syllabus V, ch5.pdf, 3 chapters: 25 Radiation & Radioactivity, 26 Rate of Decay, 27 Nuclear Energy) — `paper2notes/notes/book5/`

See `paper2notes/notes/_source/book{2,4,5}-ch*/` for OCR/outline/problems intake per ch501/502 contract, and `paper2db/qb-pdf/` for QB renders.

## Site
- Landing page at `/` lists every book with icons (no redirect); each book's index at `/book2/`, `/book4/`, `/book5/`.
- `paper2notes/deploy/cloudrun/nginx.conf` serves `paper2notes/notes/` (see `paper2notes/deploy/cloudrun/README.md`).

## Architecture

Monorepo data dependencies and design findings are mapped in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (Mermaid diagram) and the visual board at `.lavish/architecture-board/index.html` (`lavish-axi .lavish/architecture-board/index.html`).

## DSE banks — canonical in paper2db, consumed by paper2notes

```bash
# Rebuild classified banks from paper/ PDFs (gitignored outputs)
./paper2db/pipeline --force --yes
# → paper2db/tests/sections/{mc,lq}/<book>/<section>/ (PNGs, PDFs) and
#   paper2db/tests/reconstructed/ (whole papers)
# Legacy branch layout also supports paper2db/classified/ and paper2db/output/

# Sync for local preview (paper2db → paper2notes, gitignored)
./paper2notes/scripts/sync-dse.sh
# → paper2notes/notes/_local/dse/{mc,lq}/<section>/ and
#   paper2notes/notes/book*/_local/dse/ (so ../_local/dse/... from chapter pages resolves)
# HTML references are ../_local/dse/mc/25/2022_q31.png etc; ci-check ignores _local links.
```

Generated crops stay gitignored; run the two steps above after a fresh checkout.
Book 5 DSE decks (e.g. 25.1) are populated after sync — see `.lavish/` screenshots.
