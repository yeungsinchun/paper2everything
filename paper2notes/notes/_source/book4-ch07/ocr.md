# OCR transcript: Active Physics Book 4, Electromagnetic Induction (book4-ch07)

Syllabus chapter 24 Electromagnetic Induction · Electromagnetic Induction.

## Front matter

- **Source PDF:** `active-physics/Book 4.pdf` (336 pages; image-only scan, no extractable text).
- **Pages used:** PDF pp.256-298 → printed pp.259-301 of that file.
- **Printed page numbers:** PDF page N shows printed page N+3 (PDF p.1 = printed p.4). This chapter starts mid-book.
- **How chapter boundaries were identified:**
  1. Running headers read `ch07 Electromagnetic Induction`. Figure numbers are `Fig. h07.x`.
  2. QB bank `QB_407` (Active Physics) maps to this textbook chapter (publisher's own code).
  3. PDF pages for this chapter contain sections 24 Electromagnetic Induction LOs and examples that match `ch4.pdf` syllabus.
- **OCR method:** `pdftoppm -png -r 150` then Tesseract `eng` `--psm 1`. Two-column layout; equations often garbled. Greek μ, ε, Φ appear as `u`, `e`, `O` in raw OCR; do not treat garbled equations as authoritative.
- **Conventions:** Unclear tokens marked `[?]`. Coulomb's law, E-field, B-field formulae verified against syllabus, not raw OCR.
- **QB DOCX→PDF:** `paper2db/scripts/convert-qb-to-pdf.sh` via LibreOffice headless for `QB_407` → `paper2db/qb-pdf/QB_407/` (7 docx → 14 PDFs with ans variants), then Tesseract `eng --psm 1` on renders for searchable text. Equations are OLE objects; PDF render is authoritative.
- **DSE pipeline:** `paper2db` sections 24 Electromagnetic Induction via `scripts/classify_mc_sections.py` SECTIONS 20-24. Synced to `paper2notes/notes/_local/dse/` (gitignored) for quiz crops.

## Transcript (abridged OCR, with manual corrections from page images)

- LO: examine induced e.m.f. from moving conductor in steady B or stationary conductor in changing B
- LO: apply Lenz's law to determine direction of induced e.m.f./current
- LO: define magnetic flux Φ= B A cosθ and weber Wb
- LO: interpret B as flux density
- LO: state Faraday's Law ε = -ΔΦ/Δt and apply to average induced e.m.f.
- LO: examine magnetic fields using search coil
- LO: describe structures of simple d.c. and a.c. generators and how they work
- LO: discuss occurrence and practical uses of eddy currents

### Sample pages (representative OCR lines)

> QC: Charge, field, Coulomb example on p.~pp.256: `F = Q1 Q2 / 4πϵ0 r^2` [garbled in raw as `F = Q1 Q2 / 4πε r^2`].
> See page images in `images/` for authoritative figures; this transcript is not the notes.
