# Book 9 Ch.1 outline: Vision and Hearing

Textbook order from Active Physics Book 9 (Medical Physics elective) Chapter 1. Visual first: each idea lists **visual**, **short text** and **check**. Wording on student pages is re-expressed, never copied; every figure is redrawn (SVG or canvas), never cropped from the scan.

Pages: `1-1.html` (Vision), `1-2.html` (Hearing), `summary.html`, chapter map `index.html`.

Source gap: the scan starts at printed p.4 (1.1 banner). The chapter opener (printed pp.1–3) is missing.

---

## 1.1 Vision (PDF pp.1–22, printed pp.4–25)

### A. The eye as an optical system (PDF pp.1–4)

- **Facts:** eye ≈ convex lens + screen; real image on the retina. Visible light 400–750 nm only. Light path: cornea → pupil (aperture in the iris) → lens → retina → optic nerve. Fluids: aqueous humour (front), vitreous humour (main body). Ciliary muscle changes lens shape.
- **Refractive indices** (textbook Fig. 1.2): air 1.00, cornea 1.38, aqueous 1.34, lens 1.40, vitreous 1.34. Largest index step is air → cornea, so the cornea does most of the bending; the lens only fine-tunes.
- Image on retina: real, inverted, diminished.
- Iris: pupil 2–7.5 mm; constricts in bright light, dilates in dim light (enrichment).
- Retina: rods (very sensitive to intensity, dim-light vision, no colour) and cones (bright light, colour; fewer than rods, concentrated at the yellow spot). Blind spot = where the optic nerve leaves; no receptors.
- Persistence of vision 0.02–0.2 s (enrichment, not examinable).
- **Visual:** labelled SVG cross-section of the eye (own drawing) with a light path; a strip of refractive indices under it with the biggest step highlighted.
- **Check:** where is light refracted most (air–cornea); image is real/inverted/diminished; which cells give colour; blind spot.

### B. Lens power and the eye as one lens (PDF pp.5–6)

- **Power** \(P = 1/f\), f in metres; unit dioptre D = m⁻¹. Real-is-positive: convex +, concave −.
- Thin lenses close together: powers add (+4 D and −2 D → +2 D).
- Lens formula in power form: \(P = 1/f = 1/u + 1/v\). Simplified eye: cornea + lens = one lens; v ≈ eyeball depth (about 1.7–2 cm), fixed.
- Example 1.1 idea: cornea ≈ +41 D, relaxed lens ≈ +18 D → eye ≈ +59 D, f ≈ 1.7 cm. To focus nearer, 1/u grows, so P must grow.
- **Visual:** interactive: slider for object distance u; fixed v; readout of required P. Rays drawn into an eyeball.
- **Worked (own numbers):** eye 2.0 cm deep; P for object at infinity and at 25 cm.

### C. Accommodation, near point and far point (PDF pp.7–9)

- Eye changes lens shape (not lens–retina distance) to focus: **accommodation**.
- Near object: ciliary muscle **contracts**, lens **thicker**, power up. Distant object: ciliary muscle **relaxes**, lens pulled **thinner**, power down.
- **Near point** = closest point seen clearly (normal 25 cm). **Far point** = farthest (normal: infinity).
- Power of accommodation = change in power between far point and near point (Example 1.2 idea: 70 D at 25 cm vs 66 D at infinity → 4 D).
- Age table (enrichment): accommodation falls from about 13 D at 12 to about 1 D at 60.
- Fish focus by moving the lens (snapshot, skip). Depth of field (enrichment, skip).
- **Visual:** the interactive in B doubles as the accommodation figure: the lens drawn thicker as u shrinks, ciliary state label switches contract/relax, near point stop at 25 cm.
- **Check:** muscle and lens state for a far object; meaning of near/far point.

### D. Resolving power (PDF pp.10–13)

- Two point objects are resolved only if their angular separation θ is large enough. Physical limit set by **diffraction** at the pupil (circular aperture → blurred disc).
- \(\theta_{\min} \approx 1.22\lambda / D\) (radians), λ wavelength, D pupil diameter. Smaller θ_min = better resolving power. Larger pupil or shorter λ → better. Other limits: cone spacing, aberrations.
- Small-angle: separation ℓ ≈ rθ at distance r.
- Example 1.3 idea: D = 3.5 mm, λ = 500 nm → θ_min ≈ 1.74 × 10⁻⁴ rad; 2 mm strips → r ≈ 11.5 m.
- Watch-out: in dim light pupil wider (smaller diffraction limit) but aberrations grow; we still see better in bright light. θ_min is the absolute physical limit.
- **Visual:** interactive: two point sources; slider for separation angle; two blurred discs on a "retina" strip that merge into one when θ < θ_min; readout of θ vs θ_min; pupil slider.
- **Worked (own numbers).**
- **Check:** which change improves resolving power (larger pupil); calculation.

### E. Spectral response (PDF pp.13–14)

- One type of rod, three types of cone. Receptor absorption curves: rods peak ≈ 510 nm (blue–green), cones combined peak ≈ 555 nm; "blue", "green", "red" cones each cover a band of wavelengths.
- Eye most sensitive to green → green looks brightest for equal intensity (exit signs).
- Different wavelengths stimulate the three cones in different ratios → colour. Any colour can be mimicked by mixing three lights (RGB screens, snapshot).
- Dim light: only rods work → no colour, shades of grey.
- Flow: light from object → refracted by cornea and lens → image on retina → rods/cones convert to electrical signals → optic nerve → brain interprets → brain adjusts lens if needed.
- **Visual:** SVG receptor curves (own redraw, schematic) with a wavelength slider marking the response of each cone type.
- **Check:** which cones respond most at 500 nm; why no colour at night.

### F. Defects of vision and correction (PDF pp.15–22)

- Causes: eye too powerful or too weak; eyeball too long or too short.
- **Short sight (myopia):** sees near clearly; far object focuses **in front of** retina. Cause: eye too powerful or eyeball too long. Correct with **concave** (negative power) lens. Lens forms a virtual image of an object at infinity at the uncorrected far point, so f = −(far point distance). Side effect: near point moves slightly farther.
- **Long sight (hypermetropia):** sees far clearly; near object focuses **behind** retina; near point far away. Cause: eye too weak or eyeball too short. Correct with **convex** (positive power) lens: object at 25 cm imaged (virtual) at the uncorrected near point.
- **Old sight (presbyopia):** lens loses elasticity, accommodation shrinks with age. Bifocal or progressive lenses: concave upper part for far, convex lower part for near.
- **Astigmatism** (enrichment): irregular cornea curvature, one plane in focus; corrected with special cylindrical lens or surgery.
- Ortho-K and Lasik reshape the cornea (snapshot, not examinable).
- Hong Kong myopia rates (snapshot, skip numbers).
- Example 1.4 idea: far point 4 m → f = −4 m, P = −0.25 D; near point moves out a little. Example 1.5 idea: near point 2 m, want 25 cm → P = 1/0.25 + 1/(−2) = +3.5 D.
- Sign convention: u positive (real object), v negative for virtual image.
- **Visual:** interactive with three buttons (normal / short / long) and a "lens on" toggle; rays focus in front of, on, or behind the retina; with the right lens the focus moves to the retina.
- **Worked (own numbers):** short sight far point 2.5 m; long sight near point 1.0 m.
- **Check:** defect → lens type; calculation; old sight cause.

---

## 1.2 Hearing (PDF pp.23–37, printed pp.26–40)

### A. Parts of the ear (PDF p.23)

- Audible range 20 Hz – 20 kHz.
- **Outer ear** (ear flap, ear canal) collects sound, guides it to the eardrum.
- **Middle ear** (eardrum, three ear bones, oval window) turns sound into mechanical vibration and amplifies the pressure.
- **Inner ear** (cochlea) turns vibration into electrical signals; **auditory nerve** carries them to the brain.
- Eustachian tube equalises middle-ear pressure (snapshot: colds, aircraft).
- **Visual:** schematic SVG of outer/middle/inner ear, drawn as a left-to-right signal chain.
- **Check:** match part to function.

### B. Pressure amplification in the middle ear (PDF pp.24–25)

- Eardrum vibrates at the sound frequency; ear bones carry it to the oval window.
- Two gains: lever action of the ear bones ×1.3 (force); eardrum area ≈ 17 × oval window area.
- Pressure on oval window = (1.3 F) / (A/17) ≈ 22 × pressure on eardrum.
- **Visual:** SVG lever + two areas, with numbers multiplying.
- **Check:** which two factors; eardrum larger than oval window.

### C. Cochlea and frequency analysis (PDF pp.25–26)

- Cochlea: coiled liquid-filled tube with three channels; vibration enters at the oval window, travels along the upper channel to the apex, back along the lower channel and leaves at the round window.
- **Basilar membrane** between channels is non-uniform: different parts resonate at different frequencies. Base (near oval window): high frequency. Apex: low frequency.
- Hair cells on the membrane fire auditory nerves.
- Ear can tell apart frequencies 2–3 Hz apart in the 60–1000 Hz range.
- **Visual:** interactive uncoiled cochlea; frequency slider (20 Hz–20 kHz, log); the bump on the basilar membrane slides from apex (low) to base (high).
- **Check:** where high frequencies resonate; resonance.

### D. Intensity and sound intensity level (PDF pp.27–30)

- **Intensity** I = power per unit area (W m⁻²). Point source: inverse square, I ∝ 1/r².
- Range 10⁻¹² to 10² W m⁻² → logarithmic scale.
- **Sound intensity level** \(L = 10 \log_{10}(I/I_0)\) dB, \(I_0 = 10^{-12}\) W m⁻² (threshold of hearing at about 1 kHz).
- Doubling I → +3 dB; ×10 → +10 dB; ×100 → +20 dB. Halving → −3 dB.
- Typical levels (Table 1.1 idea, re-express): whisper ≈ 20 dB, conversation ≈ 60–65 dB, busy street ≈ 85 dB (damage after long exposure), loud music ≈ 120 dB (pain), jet ≈ 140 dB.
- Example 1.6 idea: 10⁻⁸ W m⁻² → 40 dB; doubling power → +3.01 dB.
- Adding sources: add intensities, not decibels.
- **Visual:** interactive slider of intensity (log) with dB readout and a ladder of everyday sounds.
- **Check:** +3 dB, +10 dB, adding two equal sources.

### E. Hearing range, loudness and the phon (PDF pp.31–34)

- **Threshold of hearing** curve varies with frequency; lowest (most sensitive) near 2–4 kHz. Threshold of discomfort ≈ 120 dB, threshold of pain ≈ 140 dB. Region between = audible range.
- **Curves of equal loudness**: each curve joins sounds judged equally loud. Higher at low and high frequencies: the ear is less sensitive there.
- **Phon**: loudness of a sound = dB level of an equally loud 1000 Hz pure tone. At 1 kHz, phons = dB. 0 phon curve = threshold of hearing.
- dB(A) weighting follows roughly the 40-phon curve (snapshot).
- Example 1.7 idea: read loudness at a frequency from the curves; a 20 dB difference in level ↔ intensity ratio 100.
- **Visual:** SVG equal-loudness curves (schematic, own redraw) with a draggable/slider point reading off phons.
- **Check:** reference frequency 1000 Hz; same phon ≠ same intensity.

### F. Noise and hearing loss (PDF pp.34–35)

- Loss from damage to the middle ear, or to the cochlea and nerves. Noise: 85 dB for 8 h or more can cause loss; louder = faster.
- Age-related loss: threshold curve shifts up, worse at high frequencies.
- Noise-induced loss: threshold up with a peak ("notch") over a band of frequencies (typically near 4 kHz).
- Hearing aid amplifies chosen frequency bands; cochlear implant bypasses a damaged cochlea and stimulates the auditory nerve directly (snapshot).
- **Visual:** SVG three threshold curves (normal, age, noise) on the same axes.
- **Check:** describe the change for each type.

---

## Summary page

- Formula sheet: P = 1/f; P = 1/u + 1/v; powers add; θ_min ≈ 1.22λ/D; ℓ ≈ rθ; pressure gain ≈ 1.3 × 17 ≈ 22; I = P/A, I ∝ 1/r²; L = 10 log(I/I₀); ΔL = 10 log(I₂/I₁).
- Definitions list (one line each): accommodation, near point, far point, dioptre, resolving power, spectral response, short/long/old sight, intensity, sound intensity level, decibel, threshold of hearing, curve of equal loudness, phon, basilar membrane.
- Comparison table: short sight vs long sight vs old sight.
- Traps: ciliary contracts for near; concave for short; add intensities not dB; phon only equals dB at 1 kHz; cornea not lens does most bending; base = high frequency.
- Last checks.
