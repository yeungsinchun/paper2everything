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
- **Book 2 Force and Motion** (syllabus II, ch2.pdf, 10 chapters via QB_201-210, ~100 figures) — `paper2notes/notes/book2/`
- **Book 4 Electricity and Magnetism** (8 chapters) — `paper2notes/notes/book4/` (stub for now)
- **Book 5 Radioactivity and Nuclear Energy** (syllabus V, ch5.pdf, Ch.25-27, 2 chapters done) — `paper2notes/notes/book5/`

See `paper2notes/notes/_source/book2-ch01..10/` for OCR/outline/problems intake per ch501/502 contract, and `paper2db/qb-pdf/` for QB renders.
