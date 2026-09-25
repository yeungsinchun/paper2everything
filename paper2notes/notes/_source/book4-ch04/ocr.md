# OCR transcript: Active Physics Book 4, Power, Heating and Domestic Electricity (book4-ch04)

Syllabus chapter 22 AC and Domestic Electricity · Power, Heating and Domestic Electricity.

## Front matter

- **Source PDF:** `active-physics/Book 4.pdf` (336 pages; image-only scan, no extractable text).
- **Pages used:** PDF pp.129-170 → printed pp.132-173 of that file.
- **Printed page numbers:** PDF page N shows printed page N+3 (PDF p.1 = printed p.4). This chapter starts mid-book.
- **How chapter boundaries were identified:**
  1. Running headers read `ch04 Power, Heating and Domestic Electricity`. Figure numbers are `Fig. h04.x`.
  2. QB bank `QB_404` (Active Physics) maps to this textbook chapter (publisher's own code).
  3. PDF pages for this chapter contain sections 22 AC and Domestic Electricity LOs and examples that match `ch4.pdf` syllabus.
- **OCR method:** `pdftoppm -png -r 150` then Tesseract `eng` `--psm 1`. Two-column layout; equations often garbled. Greek μ, ε, Φ appear as `u`, `e`, `O` in raw OCR; do not treat garbled equations as authoritative.
- **Conventions:** Unclear tokens marked `[?]`. Coulomb's law, E-field, B-field formulae verified against syllabus, not raw OCR.
- **QB DOCX→PDF:** `paper2db/scripts/convert-qb-to-pdf.sh` via LibreOffice headless for `QB_404` → `paper2db/qb-pdf/QB_404/` (7 docx → 14 PDFs with ans variants), then Tesseract `eng --psm 1` on renders for searchable text. Equations are OLE objects; PDF render is authoritative.
- **DSE pipeline:** `paper2db` sections 22 AC and Domestic Electricity via `scripts/classify_mc_sections.py` SECTIONS 20-24. Synced to `paper2notes/notes/_local/dse/` (gitignored) for quiz crops.

## Transcript (abridged OCR, with manual corrections from page images)

- LO: examine heating effect P=I^2R
- LO: apply P=VI to problems
- LO: determine power rating of appliances
- LO: use kWh as energy unit
- LO: calculate running costs
- LO: understand household wiring and discuss safety
- LO: determine operating current
- LO: discuss choice of cables and fuses based on power rating

### Sample pages (representative OCR lines)

> QC: Charge, field, Coulomb example on p.~pp.129: `F = Q1 Q2 / 4πϵ0 r^2` [garbled in raw as `F = Q1 Q2 / 4πε r^2`].
> See page images in `images/` for authoritative figures; this transcript is not the notes.
