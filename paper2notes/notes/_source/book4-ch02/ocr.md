# OCR transcript: Active Physics Book 4, Electric Circuits: Current, Voltage and Resistance (book4-ch02)

Syllabus chapter 21 Circuit and Power · Electric Circuits: Current, Voltage and Resistance.

## Front matter

- **Source PDF:** `active-physics/Book 4.pdf` (336 pages; image-only scan, no extractable text).
- **Pages used:** PDF pp.43-85 → printed pp.46-88 of that file.
- **Printed page numbers:** PDF page N shows printed page N+3 (PDF p.1 = printed p.4). This chapter starts mid-book.
- **How chapter boundaries were identified:**
  1. Running headers read `ch02 Electric Circuits: Current, Voltage and Resistance`. Figure numbers are `Fig. h02.x`.
  2. QB bank `QB_402` (Active Physics) maps to this textbook chapter (publisher's own code).
  3. PDF pages for this chapter contain sections 21 Circuit and Power LOs and examples that match `ch4.pdf` syllabus.
- **OCR method:** `pdftoppm -png -r 150` then Tesseract `eng` `--psm 1`. Two-column layout; equations often garbled. Greek μ, ε, Φ appear as `u`, `e`, `O` in raw OCR; do not treat garbled equations as authoritative.
- **Conventions:** Unclear tokens marked `[?]`. Coulomb's law, E-field, B-field formulae verified against syllabus, not raw OCR.
- **QB DOCX→PDF:** `paper2db/scripts/convert-qb-to-pdf.sh` via LibreOffice headless for `QB_402` → `paper2db/qb-pdf/QB_402/` (7 docx → 14 PDFs with ans variants), then Tesseract `eng --psm 1` on renders for searchable text. Equations are OLE objects; PDF render is authoritative.
- **DSE pipeline:** `paper2db` sections 21 Circuit and Power via `scripts/classify_mc_sections.py` SECTIONS 20-24. Synced to `paper2notes/notes/_local/dse/` (gitignored) for quiz crops.

## Transcript (abridged OCR, with manual corrections from page images)

- LO: define electric current as rate of flow of charge I = ΔQ/Δt
- LO: current direction convention
- LO: describe energy transformations in circuits
- LO: define p.d. as energy per unit charge outside source
- LO: define e.m.f. as energy per unit charge through source
- LO: define R=V/I
- LO: describe I-V for metal, electrolyte, filament, diode
- LO: realise Ohm's law as special case
- LO: determine factors affecting resistance of wire: ρ = R A / l
- LO: effect of temperature on resistance of metals vs semiconductors

### Sample pages (representative OCR lines)

> QC: Charge, field, Coulomb example on p.~pp.43: `F = Q1 Q2 / 4πϵ0 r^2` [garbled in raw as `F = Q1 Q2 / 4πε r^2`].
> See page images in `images/` for authoritative figures; this transcript is not the notes.
