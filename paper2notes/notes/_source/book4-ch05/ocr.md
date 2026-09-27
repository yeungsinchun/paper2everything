# OCR transcript: Active Physics Book 4, Magnetic Fields and Electromagnets (book4-ch05)

Syllabus chapter 23 Electromagnetism · Magnetic Fields and Electromagnets.

## Front matter

- **Source PDF:** `active-physics/Book 4.pdf` (336 pages; image-only scan, no extractable text).
- **Pages used:** PDF pp.171-213 → printed pp.174-216 of that file.
- **Printed page numbers:** PDF page N shows printed page N+3 (PDF p.1 = printed p.4). This chapter starts mid-book.
- **How chapter boundaries were identified:**
  1. Running headers read `ch05 Magnetic Fields and Electromagnets`. Figure numbers are `Fig. h05.x`.
  2. QB bank `QB_405` (Active Physics) maps to this textbook chapter (publisher's own code).
  3. PDF pages for this chapter contain sections 23 Electromagnetism LOs and examples that match `ch4.pdf` syllabus.
- **OCR method:** `pdftoppm -png -r 150` then Tesseract `eng` `--psm 1`. Two-column layout; equations often garbled. Greek μ, ε, Φ appear as `u`, `e`, `O` in raw OCR; do not treat garbled equations as authoritative.
- **Conventions:** Unclear tokens marked `[?]`. Coulomb's law, E-field, B-field formulae verified against syllabus, not raw OCR.
- **QB DOCX→PDF:** `paper2db/scripts/convert-qb-to-pdf.sh` via LibreOffice headless for `QB_405` → `paper2db/qb-pdf/QB_405/` (7 docx → 14 PDFs with ans variants), then Tesseract `eng --psm 1` on renders for searchable text. Equations are OLE objects; PDF render is authoritative.
- **DSE pipeline:** `paper2db` sections 23 Electromagnetism via `scripts/classify_mc_sections.py` SECTIONS 20-24. Synced to `paper2notes/notes/_local/dse/` (gitignored) for quiz crops.

## Transcript (abridged OCR, with manual corrections from page images)

- LO: realise attraction/repulsion between magnetic poles
- LO: examine field around a magnet
- LO: describe compass behaviour in field
- LO: represent magnetic field with field lines
- LO: realise field from moving charges / currents
- LO: examine patterns: long straight wire, circular coil, long solenoid
- LO: apply B=μ0I/(2πr) and B=μ0NI/l to solve problems
- LO: examine factors affecting electromagnet strength

### Sample pages (representative OCR lines)

> QC: Charge, field, Coulomb example on p.~pp.171: `F = Q1 Q2 / 4πϵ0 r^2` [garbled in raw as `F = Q1 Q2 / 4πε r^2`].
> See page images in `images/` for authoritative figures; this transcript is not the notes.
