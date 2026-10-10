# Book 9 Ch.3 outline: Ionizing Medical Imaging

Textbook order from Active Physics Book 9 Chapter 3. Visual first. Wording on student pages is re-expressed; every figure is redrawn; no medical photograph is reproduced.

Pages: `3-1.html` (X-rays and radiographic imaging), `3-2.html` (CT scan), `3-3.html` (Radionuclide imaging), `3-4.html` (Safety precautions), `3-5.html` (Comparison of imaging methods), `summary.html`, chapter map `index.html`.

Source gap: chapter opener (printed pp.94–95) missing from the scan.

---

## 3.1 X-rays and radiographic imaging (PDF pp.89–101, printed pp.96–108)

### A. Ionizing radiation (PDF p.89)

- Ionizing = enough energy to knock an electron out. EM waves above UV (X-rays, γ) are ionizing. Small particles / short wavelength penetrate.
- Enrichment: 13.6 eV to ionize hydrogen; E = hf; threshold ≈ 3 × 10¹⁵ Hz (one line).

### B. X-rays (PDF p.90)

- High-frequency EM waves, 10¹⁶–10¹⁹ Hz, 100 eV–100 keV. Blacken film.
- Produced when fast electrons hit a heavy metal target and decelerate. Rotating anode spreads heat (snapshot).
- **Visual:** tube schematic SVG (cathode, electrons, target, X-rays out).

### C. Attenuation (PDF pp.91–94)

- Causes: ionization (energy loss) + scattering.
- More attenuation when: medium denser; atomic number larger; X-rays lower energy.
- \(I = I_0 e^{-\mu x}\); μ linear attenuation coefficient (cm⁻¹). 1 cm⁻¹ = 100 m⁻¹.
- **Half-value thickness** \(x_{1/2} = \ln 2/\mu\). n HVTs → (1/2)ⁿ. Beam "dies out" after about 10 HVT.
- Table 3.1 values (50 keV / 100 keV): air μ 0.00027/0.00020; fat 0.19/0.16; water 0.22/0.17; soft tissue 0.23/0.16; compact bone 0.57/0.30; lead 88/62 cm⁻¹. Bone ≈ 2.5× soft tissue at 50 keV.
- Example 3.1 idea: HVT 2.5 mm Al, 4 mm and 8 mm filters; doubling x does not halve I.
- Aluminium filter absorbs low-energy X-rays that would only dose the skin (snapshot).
- Mass attenuation coefficient (enrichment, skip).
- **Visual:** interactive: slider of thickness; material buttons (soft tissue / bone / lead); curve I/I₀ vs x with HVT marks; readout I/I₀.
- **Check:** compute from μ; HVT ratio; 5 cm → 1/4 so 25 cm → 1/2¹⁰.

### D. X-ray radiographic imaging (PDF pp.95–100)

- A radiograph is a shadow (projection) of the body: differently attenuated beams reach the film.
- More exposure → darker. Air black, fat dark grey, soft tissue grey, bone white.
- **Contrast:** difference in emerging intensity between neighbouring regions; needs a big μ difference (Example 3.2 idea).
- **Artificial contrast medium** (barium meal, iodine compounds): high μ, swallowed or injected, outlines soft organs.
- Pros: cheap, quick, simple, good for bone. Cons: ionizing, poor soft-tissue contrast, overlapping structures, contrast medium unpleasant / iodine allergy.
- Intensifying screen, fluoroscopy (snapshots, one line).
- **Visual:** animated stage: parallel X-rays through a block containing air pocket and bone in soft tissue; the film darkens strip by strip (finite clip, Replay). Table 3.2 appearance.
- **Check:** T/F on a dental image (fillings attenuate more → whiter); bone fracture shown; contrast medium purpose.

---

## 3.2 Computed tomographic scan (PDF pp.102–108, printed pp.109–115)

### A. CT images (PDF pp.102–106)

- Gantry; X-ray tube rotates round the patient; a ring of detectors opposite measures the fan of attenuated beams.
- Many angles → computer turns intensities into a grid of numbers (each ≈ average μ of a voxel) → grey-scale pixels. A CT image is a **map of attenuation coefficients**. Highly attenuating parts white.
- Resolution rises with pixels; smaller detectors → more data. 1024 × 1024 typical.
- Slices stack into other planes; helical CT (snapshot).
- **Back projection:** one angle gives a strip pattern; smear patterns from many angles back across the image; overlaps rebuild the high-μ spots.
- Enrichment puzzle (4 unknown cells from 6 sums) — make an own-numbers version as a check.
- **Visual:** animated stage: two "bones" in a disc; tube and detector rotate; each angle's profile is smeared back; image sharpens as angles add. Finite, Replay.

### B. Comparison with radiograph (PDF pp.107–108)

- CT: cross-sections, no overlap, good soft-tissue contrast, can locate abnormalities. Cons: much larger dose, longer, costly.
- **Table** radiograph vs CT.
- **Check:** CT image is a map of attenuation; why dose higher.

---

## 3.3 Radionuclide imaging (PDF pp.109–121, printed pp.116–128)

### A. Emission instead of transmission (PDF p.109)

- Tracer (radionuclide + carrier compound) collects in an organ; detect what it emits.

### B. Suitable radionuclides and Tc-99m (PDF pp.110–111)

- γ emitter: penetrates out of the body, least ionizing. Not α (stopped in body, very ionizing).
- Half-life not too long (dose) nor too short (time to image). Decays to stable product. Chemically suitable, cheap.
- **Tc-99m:** γ only (\({}^{99m}_{43}\mathrm{Tc} \to {}^{99}_{43}\mathrm{Tc} + \gamma\)), half-life 6 h, stable-enough daughter, non-toxic, easy to tag, cheap, made on site from Mo-99 generator (Mo-99 half-life 2.8 d → replace weekly). Others: Ga-67, Tl-201, I-123, Xe-133.

### C. Effective half-life (PDF pp.112–113)

- Physical half-life (decay) and biological half-life (removal by body processes).
- \(1/T_{e} = 1/T_{p} + 1/T_{b}\); effective is shorter than both. \(A = A_0 e^{-kt}\), \(k = \ln 2/T_e\).
- Example 3.3 idea: 6 h and 3 h → 2 h; after 3 h A/A₀ ≈ 0.354.
- **Visual:** interactive: sliders for T_p and T_b; three curves (decay, removal, effective) with T_e readout.
- **Check:** compute T_e; T_e shorter than either; α not used.

### D. Imaging process and the gamma camera (PDF pp.114–115)

- Tracer in by injection, swallowing or breathing. I-123 collects in thyroid naturally; Xe-133 gas for lungs.
- Gamma camera: **collimator** (lead holes: only perpendicular γ get through → position), **scintillator** (γ → light flash), **photomultiplier tubes** (flash → electrical pulse), **positioning logic** (where the flash was → dot on screen). Counts over 30–120 s.
- **Visual:** animated stage: γ rays from an organ, slanted ones stopped by collimator septa, straight ones flash in the crystal, PMTs fire, dots accumulate on the screen.

### E. Radionuclide images (PDF pp.116–118)

- Image = accumulated dots (100 000–500 000); more dots → better resolution.
- Darker = more tracer. **Hot spot** (more uptake: e.g. tumour, infection), **cold spot** (less uptake: e.g. blood clot in lung).
- Dynamic imaging: a series over time shows organ function (kidney uptake curve).
- Pros: organ function, early detection, efficient search (bone tumours). Cons: poor resolution, tracer dose, costly, non-specific (cold spot: tumour or cyst).

### F. Comparison with X-ray images (PDF p.119)

- Emission vs transmission; invasive (tracer) vs not; function vs structure; time 0.5–2 min vs 1 s (CT 10–60 s); resolution poor vs good. Combined CT + RNI (snapshot).
- **Table.**

---

## 3.4 Safety precautions for ionizing radiation (PDF pp.122–126, printed pp.129–133)

### A. Effective dose

- Overall biological effect depends on absorbed dose, radiation type (weighting: α 20, β 1, γ 1, X 1) and tissue (weighting e.g. gonads 0.20, stomach 0.12, colon 0.12, liver 0.05, oesophagus 0.05, skin 0.01).
- Effective dose (sievert, Sv) = absorbed dose × radiation weighting factor × tissue weighting factor.

### B. Biological effects

- Acute (> about 1 Sv: nausea, vomiting, tiredness, hair loss) vs latent (months to years: cancer, genetic effects, cataract).
- Deterministic (threshold, severity grows with dose: skin damage, cataract at 5 Sv) vs stochastic (chance grows with dose, severity independent: cancer about 4% per Sv, genetic).
- LD50 ≈ 4 Sv (enrichment).
- Typical doses (Table 3.4 idea, re-expressed as an interactive bar list): chest X-ray ~20 μSv, skull X-ray ~100 μSv, abdomen X-ray ~700 μSv, head CT ~2000 μSv, chest CT ~7000 μSv, abdomen CT ~8000 μSv, bone RNI ~6300 μSv, lung RNI ~2000 μSv; annual background 2400 μSv.
- Dose is larger for a larger exposed area and longer exposure.
- **Visual:** log bar chart of doses with background line.

### C. Safety precautions

- Principles: **justification** (benefit > risk), **optimization** (ALARA), **dose limitation** (occupational 20 mSv per year).
- Minimize dose: **time, distance, shielding** (lead, concrete, lead glass).
- **Check:** unit Sv; which effect has a threshold; JOD.

---

## 3.5 Comparison of imaging methods (PDF p.127, printed p.134)

- Table 3.5 re-expressed: ultrasound / endoscopy / radiograph / CT / RNI × invasive, wave, ionizing, source, principle, strength, limitation, dose, time, real-time, cost.
- Interactive chooser: pick a clinical need (foetus, broken bone, brain bleed, thyroid function, stomach lining) → highlights the best method with one-line reason.
- **Check:** match needs to methods.

---

## Summary page

- Formula sheet: I = I₀e^(−μx); x½ = ln2/μ; I = I₀(1/2)ⁿ, n = x/x½; 1/Tₑ = 1/Tₚ + 1/T_b; A = A₀e^(−kt), k = ln2/Tₑ; effective dose = absorbed × w_R × w_T.
- Definitions; comparison tables; traps (HVT halving, doubling x ≠ halving I; CT image is μ map; hot spot = more tracer; Tₑ shorter than both; deterministic has threshold); last checks.
