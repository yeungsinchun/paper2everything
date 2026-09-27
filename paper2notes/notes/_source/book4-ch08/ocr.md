# OCR transcript: Active Physics Book 4, Alternating Current, Transformers and Power Transmission (book4-ch08)

Syllabus chapter 22 + 24 AC and Domestic Electricity / Induction · Alternating Current, Transformers and Power Transmission.

## Front matter

- **Source PDF:** `active-physics/Book 4.pdf` (336 pages; image-only scan, no extractable text).
- **Pages used:** PDF pp.299-336 → printed pp.302-339 of that file.
- **Printed page numbers:** PDF page N shows printed page N+3 (PDF p.1 = printed p.4). This chapter starts mid-book.
- **How chapter boundaries were identified:**
  1. Running headers read `ch08 Alternating Current, Transformers and Power Transmission`. Figure numbers are `Fig. h08.x`.
  2. QB bank `QB_408` (Active Physics) maps to this textbook chapter (publisher's own code).
  3. PDF pages for this chapter contain sections 22 + 24 AC and Domestic Electricity / Induction LOs and examples that match `ch4.pdf` syllabus.
- **OCR method:** `pdftoppm -png -r 150` then Tesseract `eng` `--psm 1`. Two-column layout; equations often garbled. Greek μ, ε, Φ appear as `u`, `e`, `O` in raw OCR; do not treat garbled equations as authoritative.
- **Conventions:** Unclear tokens marked `[?]`. Coulomb's law, E-field, B-field formulae verified against syllabus, not raw OCR.
- **QB DOCX→PDF:** `paper2db/scripts/convert-qb-to-pdf.sh` via LibreOffice headless for `QB_408` → `paper2db/qb-pdf/QB_408/` (7 docx → 14 PDFs with ans variants), then Tesseract `eng --psm 1` on renders for searchable text. Equations are OLE objects; PDF render is authoritative.
- **DSE pipeline:** `paper2db` sections 22 + 24 AC and Domestic Electricity / Induction via `scripts/classify_mc_sections.py` SECTIONS 20-24. Synced to `paper2notes/notes/_local/dse/` (gitignored) for quiz crops.

## Transcript (abridged OCR, with manual corrections from page images)

- LO: distinguish d.c. and a.c.
- LO: define r.m.s. as steady d.c. equivalent heating
- LO: relate r.m.s. and peak values (Vr.m.s.=V0/√2)
- LO: describe structure of simple transformer and how it works
- LO: relate VP/VS = NP/NS and solve problems
- LO: examine methods for improving transformer efficiency
- LO: discuss advantages of high-voltage a.c. transmission
- LO: describe stages of stepping up/down in grid system

### Sample pages (representative OCR lines)

> QC: Charge, field, Coulomb example on p.~pp.299: `F = Q1 Q2 / 4πϵ0 r^2` [garbled in raw as `F = Q1 Q2 / 4πε r^2`].
> See page images in `images/` for authoritative figures; this transcript is not the notes.
