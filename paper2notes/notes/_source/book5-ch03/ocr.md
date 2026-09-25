# OCR transcript: Active Physics Book 5, Chapter 3 — Nuclear Energy

Syllabus chapter 27 - Nuclear Energy.

## Front matter

- **Source PDF:** `active-physics/Book 5.pdf` (112 pages; image-only scan).
- **Pages used:** PDF pages 87–112 (printed pages 90–115). Page 87 = printed p.90 (27.1 opening). Page 112 = printed p.115 (Chapter Exercise end).
- **Printed page ↔ PDF page:** printed = PDF + 3 (as in ch25/ch26).
- **How chapter boundaries were identified:**
  1. PDF p87 header "27 Nuclear fission and fusion" with running header `27 Nuclear Energy`. Figure numbers `Fig. 27.1` etc.
  2. PDF p99 header "27 Mass-energy relation" — same chapter.
  3. PDF p107 header "27 Summary" and p108 "Chapter Exercise".
  4. PDF p80–86 is Chapter 26 summary/exercise, excluded.
- **OCR method:** `pdftoppm -png -r 216` then Tesseract `eng --psm 6`. Two-column layout, heavy math/figures, superscript/subscript often broken. Images clipped separately. Unclear tokens marked `[?]`.
- **QB via LibreOffice:** `qb/QB_503/5_ch03_*.docx` → `soffice --headless --convert-to pdf` → `pdftotext -layout`. Equations in QB are `code/content` blocks with `!`/`"` tokens for symbols; treat as garbled, check PDF image.
- **Conventions:** α → `a`/`@`, β → `B`/`β`, γ → `y`, `²³⁵U` → `U` with garbles, `ΔE=Δmc²` → `E=Amc`. Do not trust garbled superscripts as authoritative.
- **Syllabus:** `ch5.pdf` pp.49–50 section c Nuclear energy — LOs listed below.

## Syllabus LOs mapped (ch5.pdf pp.49–50)

Core section c excerpt:

- *Nuclear fission and fusion:* realise release of energy in nuclear fission and fusion; realise nuclear chain reaction; realise nuclear fusion as source of solar energy.
- *Mass-energy relationship* (Note: underlined = extension in syllabus): state ΔE=Δmc²; use atomic mass unit as unit of energy; determine energy release in nuclear reactions; apply ΔE=Δmc² to solve problems.

Also prerequisite LOs from earlier chapters assumed known: atomic structure A=Z+N, isotopes, α/β/γ nature, half-life, activity.

## Transcript

### PDF p87 / printed p90 - 27.1 Nuclear fission

In Ch.25 we learnt heavy nuclei generally unstable.
When heavy nucleus bombarded by neutron, nucleus may split to lighter nuclei and release energy. This is **nuclear fission**.
*Heavy nucleus splits into lighter nuclei.*

Example U-235: captures slow neutron → Ba-141 + Kr-92 + 3 neutrons (Fig.27.1). Large energy, most as KE of fragments. Fission fragments called. If neutron too fast, cannot be captured.

Equation: ²³⁵₉₂U + ¹₀n → ¹⁴¹₅₆Ba + ⁹²₃₆Kr + 3 ¹₀n + energy — releases ~2.8×10⁻¹¹ J (~200 MeV).
Variants: ²³⁵U + n → ¹³³Xe + ¹⁰¹Sr + 2n etc; ²³⁵U + n → ¹⁴⁸La + ⁸⁵Br + 3n etc.

### PDF p88 / printed p91 - Chain reaction

In U-235 fission 2+ neutrons emitted; may trigger nearby U-235, chain reaction (Fig.27.2). Chain sustains only if huge number of U-235 closely packed → mass & concentration sufficiently high, else neutrons escape and reaction dies.

Try this: Domino chain pyramid — push front domino, increase separation compare.

**Enrichment / Critical mass:** Need at least one fission trigger another on average. Critical mass depends on mass, density, purity. Natural U ~0.7% U-235, must be enriched.

### PDF p89 / printed p92 - Fission bomb & reactor

Fission bomb: uncontrolled chain → explosive energy + radiation. Only when chemical explosives push bullet+target together does reaction exceed critical mass (Little Boy). Concentration >90% U-235; enriched from natural.

Fission reactor: controlled chain for electricity. Fuel ~3% U-235 only → never bomb-like explosion.

### PDF p90 / printed p93 - Example 27.1 & Reactor schematic

Example 27.1: Fission vs α decay differences: fission triggered by neutron bombardment vs decay spontaneous & uncontrollable; fission rate controllable, α decay determined by half-life; fission has different products each reaction, α decay same products.

Reactor: Pressurized water reactor diagram: fuel rods (U-235), control rods (absorb neutrons, insertion slows reaction), pressurized water circuit transfers heat to boiler and acts as moderator to slow neutrons (only slow neutrons initiate U-235 fission), boiler makes steam to turbine.

Snapshot: Daya Bay near Hong Kong, history Fermi/Hahn/Meitner 1934-1938.

### PDF p92 / printed p95 - 27.2 Nuclear fusion

Apart from splitting heavy, energy also released fusing light nuclei to heavier. **Fusion:** light nuclei fuse to heavier.

Example: ²H + ³H → ⁴He + ¹₀n (Fig.27.5) releases 2.82×10⁻¹² J (~17.6 MeV). Electrostatic repulsion between positively charged light nuclei makes fusion difficult (Fig.27.6); need high KE to overcome, achieved at ~10⁷ K.

Solar energy: Sun releases via fusion deep core, millions tonnes hydrogen per second → EM radiation we feel (Fig.27.7).

### PDF p93 / printed p96 - Fusion bomb & challenges

Man-made fusion: hydrogen bomb uses small fission bomb to provide high T (Fig.27.9). Uncontrollable; 1000× more destructive than fission bomb. Note: 1 kg H-2+H-3 fusion ~5× fission 1 kg U-235.

Tsar Bomba snapshot.

### PDF p94 / printed p97 - Fusion reactor

Ideal for electricity: fuel (hydrogen from sea) cheap unlimited; product helium non-toxic non-radioactive. Challenges: difficult to heat controllably; no container holds extremely hot fuel (magnetic confinement Fig.27.10). No commercial fusion plant yet.

Checkpoint etc.

### PDF p95 / printed p98 - Fission/fusion debate + waste

Countries using nuclear power (I.A.E.A. 2013): France 73.3% etc. Pros: alternative to fossil fuels, no air pollutants/CO₂, cheaper fuel. Cons: accidents widespread, radioactive waste long half-lives difficult disposal, high maintenance/safety/shutdown costs, proliferation risk.

Disposal of spent fuels: hot highly radioactive with long half-lives (I-129 15.7 Myr), cooled in pools 10–20 yrs then underground burial (Figs).

Nuclear weapons snapshots.

### PDF p99 / printed p102 - 27.3 Mass-energy relation

Where does energy come from? Total mass after reaction < before (Fig.27.14). Missing mass converted to energy.

Einstein special relativity: mass and energy equivalent, **E = Δmc²** where Δm is mass defect, c=3×10⁸ m/s. 1 g → 9×10¹³ J huge!

History: Einstein miracle year 1905.

### PDF p100 / printed p103 - Example 27.2 Uranium and coal

In U-235 fission ~0.08% mass converted. (a) 1 kg U-235 complete fission: E=Δmc² = 1×0.0008×(3×10⁸)² = 7.2×10¹³ J (b) Coal 1 kg =2.8×10⁷ J → need 2.57×10⁶ kg coal.

### PDF p101 / printed p104 - eV and u

**Electronvolt:** 1 eV = energy of electron across 1 V = 1.60×10⁻¹⁹ J.

**Atomic mass unit:** 1 u = 1/12 mass C-12 atom = 1.661×10⁻²⁷ kg (from 1 mole C-12 =12 g / N_A 6.02×10²³). Can be unit of energy: 1 u c² = 1.4924×10⁻¹⁰ J = 931 MeV (using 1.661×10⁻²⁷×(2.998×10⁸)² /1.602×10⁻¹⁹). Hence 1 u ↔ 931 MeV.

Table 27.1 masses: electron 0.000549 u, proton 1.007276 u, neutron 1.008665 u, U-235 235.043930 u etc.

### PDF p102 / printed p105 - Example 27.3 Fusion D+T

²H (2.0136 u) + ³H (3.0155 u) → ⁴He (4.0015 u) + n (1.0087 u). Loss =0.0189 u → 17.6 MeV. For 5 g D+T equal numbers: mass per reaction (2.0136+3.0155)×1.661×10⁻²⁷ =8.353×10⁻²⁷ kg → reactions =0.005/8.353×10⁻²⁷≈5.986×10²³ → total ~1.69×10¹¹ J (1.05×10⁵ MeV×1.6×10⁻¹³).

### PDF p103 / printed p106 - Example 27.4 Fission La/Br

²³⁵U (234.9934 u) + n → ¹⁴⁸La (147.9009 u) + ⁸⁵Br (84.8964 u) + 3n +166.37 MeV. Find x=3 via mass numbers, neutron mass 1.0087 u via balancing mass-energy (166.37 MeV=0.1787 u), 5 g U-235/s gives power ~3.4×10⁷ W.

### PDF p104 / printed p107 - Example 27.5 Pu-238 α

²³⁸Pu → ²³⁴U + α. Masses 237.9980 →233.9905+4.0015 loss 0.0060 u →5.586 MeV →8.94×10⁻¹³ J α KE, speed ~1.6×10⁷ m/s, activity for 300 W at 10% conversion ~3.36×10¹⁴ Bq, power drops with activity exponentially.

### PDF p105-106 / printed p108-109 - Binding energy enrichment + checkpoints

Geothermal from decay, binding energy curve: average binding per nucleon vs A, fission for A>58, fusion for A<58 (Fig). Checkpoint questions T/F on mass-energy.

### PDF p107 / printed p110 - Summary

Key ideas: fission splitting heavy, chain reaction needs critical mass/concentration, moderated & controlled in reactor; fusion fusing light, needs high T to overcome Coulomb repulsion; mass-energy E=Δmc², 1u=931MeV, 1eV=1.60×10⁻¹⁹J. Common mistakes: chain needs ≥1 neutron per fission; per-mass fusion releases more than fission though single fission releases more.

### PDF p108-112 / printed p111-115 - Chapter Exercise

MC: fission identification, chain conditions, mass in fission vs fusion, Δm=0.07% etc. SQ: Daya Bay power plant annual fuel consumption (2000 MW, 3% U-235, 0.07% mass to energy, 40% efficiency), Edexcel fusion, Rutherford transmutation, Voyager RTG, etc.

## Gaps / flags

- Split between "fast neutron cannot be captured" vs "moderator slows neutrons" clarified via reactor text.
- Table 27.1 U-235 mass OCR 235.043930 may be 235.0439; check image.
- Branching: critical mass depends on purity/density — image confirms.
- Extension tags in syllabus underlined not captured by OCR; treat mass-energy as extension per p50 note, but keep on student page with tag.
