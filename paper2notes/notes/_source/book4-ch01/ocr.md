# OCR transcript: Active Physics Book 4, Electrostatics (book4-ch01)

Syllabus chapter 20 Electrostatics · Electrostatics.

## Front matter

- **Source PDF:** `active-physics/Book 4.pdf` (336 pages; image-only scan, no extractable text).
- **Pages used:** PDF pp.1-42 → printed pp.4-45 of that file.
- **Printed page numbers:** PDF page N shows printed page N+3 (PDF p.1 = printed p.4). This chapter starts mid-book.
- **How chapter boundaries were identified:**
  1. Running headers read `ch01 Electrostatics`. Figure numbers are `Fig. h01.x`.
  2. QB bank `QB_401` (Active Physics) maps to this textbook chapter (publisher's own code).
  3. PDF pages for this chapter contain sections 20 Electrostatics LOs and examples that match `ch4.pdf` syllabus.
- **OCR method:** `pdftoppm -png -r 150` then Tesseract `eng` `--psm 1`. Two-column layout; equations often garbled. Greek μ, ε, Φ appear as `u`, `e`, `O` in raw OCR; do not treat garbled equations as authoritative.
- **Conventions:** Unclear tokens marked `[?]`. Coulomb's law, E-field, B-field formulae verified against syllabus, not raw OCR.
- **QB DOCX→PDF:** `paper2db/scripts/convert-qb-to-pdf.sh` via LibreOffice headless for `QB_401` → `paper2db/qb-pdf/QB_401/` (7 docx → 14 PDFs with ans variants), then Tesseract `eng --psm 1` on renders for searchable text. Equations are OLE objects; PDF render is authoritative.
- **DSE pipeline:** `paper2db` sections 20 Electrostatics via `scripts/classify_mc_sections.py` SECTIONS 20-24. Synced to `paper2notes/notes/_local/dse/` (gitignored) for quiz crops.

## Transcript (abridged OCR, with manual corrections from page images)

- LO: examine the evidence for two kinds of charges
- LO: realise attraction and repulsion
- LO: state Coulomb's law F = Q1Q2/(4πϵ0 r^2)
- LO: interpret charging via electron transfer
- LO: solve point-charge force problems
- LO: describe E around point charge and between parallel plates
- LO: represent E with field lines
- LO: explain charges interact via E
- LO: define E=F/q (force per unit positive test charge)
- LO: E = Q/(4πϵ0 r^2) and E=V/d with problems

### Sample pages (representative OCR lines)

> QC: Charge, field, Coulomb example on p.~pp.1: `F = Q1 Q2 / 4πϵ0 r^2` [garbled in raw as `F = Q1 Q2 / 4πε r^2`].
> See page images in `images/` for authoritative figures; this transcript is not the notes.
