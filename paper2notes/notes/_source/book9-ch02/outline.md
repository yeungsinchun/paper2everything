# Book 9 Ch.2 outline: Non-ionizing Medical Imaging

Textbook order from Active Physics Book 9 Chapter 2. Visual first. Wording on student pages is re-expressed; every figure is redrawn.

Pages: `2-1.html` (Medical imaging), `2-2.html` (Ultrasound scans), `2-3.html` (Endoscopy), `summary.html`, chapter map `index.html`.

Source gap: chapter opener (printed pp.50–51) missing from the scan.

---

## 2.1 Medical imaging (PDF pp.47–48, printed pp.52–53)

### A. Waves that image the body

- Medical imaging = building a picture of the inside of the body from waves.
- Ionizing: X-rays (radiograph, CT), γ rays (radionuclide imaging). Non-ionizing: ultrasound, visible light (endoscope); infrared thermography appears in the checkpoint.
- **Visual:** SVG map: five methods sorted into non-ionizing and ionizing columns, each with the wave it uses.

### B. What limits an image, and invasive vs non-invasive

- Image quality limited by wavelength (diffraction), detector fineness, and image-building technique. Same ideas as resolving power of the eye.
- Other factors: purpose, cost, time, effect on the patient.
- **Invasive:** something is put into the body (tracer, endoscope). Non-invasive methods can still harm (X-rays ionize).
- **Check:** T/F (only visible light images? no; non-invasive still can harm; only invasive harms? no). Wave phenomenon limiting resolution: diffraction.

---

## 2.2 Ultrasound scans (PDF pp.49–69, printed pp.54–74)

### A. Ultrasound and the piezoelectric transducer (PDF pp.49–52)

- Ultrasound: sound above 20 kHz. Medical imaging uses 1–20 MHz. Echolocation (bats) is the same idea.
- **Piezoelectric effect:** squeeze or stretch the crystal → voltage across it (detects ultrasound). **Converse:** apply voltage → crystal changes shape; a changing (ac) voltage makes it vibrate and emit ultrasound. Voltage, not current, distorts it.
- Transducer: crystal (PZT) with electrodes, backing material (damps the pulse short), acoustic window (matching layer). One crystal both sends and receives, but not at the same time: about 10 μs pulse, then about 1 ms listening.
- Enrichment: crystal thickness half a wavelength (skip).
- **Visual:** canvas: crystal squeezed → voltmeter deflects; voltage pulse → crystal rings → wave leaves. Pulse train timeline: short burst, long listen.
- **Check:** voltage when compressed OR stretched; transducer both emits and receives; pulse train shape.

### B. Acoustic impedance and reflection (PDF pp.53–56)

- Speed similar in soft tissues (~1500–1600 m/s), fastest in bone.
- **Acoustic impedance** \(Z = \rho c\), unit kg m⁻² s⁻¹ (rayl). Table values (×10⁶): air 0.000410, fat 1.38, water 1.48, soft tissue 1.63, liver 1.64, blood 1.67, bone 3.8–7.4, PZT 30.0.
- **Intensity reflection coefficient** \(\alpha = I_r/I_0 = (Z_2 - Z_1)^2/(Z_2 + Z_1)^2\). Transmitted fraction 1 − α (no loss). Same α from either side.
- Air–skin α ≈ 0.999 → **coupling gel** fills air gaps and has Z close to skin.
- **Attenuation:** absorption (to heat) + scattering. Measured in dB per cm. Bone > soft tissue > blood; rises with frequency.
- **Visual:** interactive: pick two media (buttons); bar shows reflected vs transmitted fraction, α readout. Includes the air–skin and gel–skin cases.
- **Worked (own numbers):** tissue–bone α; with given incident intensity.
- **Check:** gel purpose (reflection, not attenuation); Z not a measure of attenuation; α = 0 for equal Z; α ≤ 1.

### C. Pulse-echo and A-scan / B-scan (PDF pp.57–65)

- Echo returns after out-and-back time t: depth \(s = ct/2\).
- Echo strength: large Z difference → strong echo; deeper → later (and weaker; time-gain compensation amplifies later echoes, enrichment).
- **A-scan** (amplitude vs time, 1-D): eye lens thickness, eyeball length.
- **B-scan** (brightness dots): fan or linear beam → 2-D image. Foetus, liver, kidney, cysts. Dark region = little reflected (uniform Z), not "absorbed more".
- M-scan (enrichment, skip).
- Examples 2.3/2.4 ideas: time between echoes from layer thickness and speed; layer thickness from spot separation.
- **Visual:** animated stage: transducer, two tissue layers; a pulse travels, partly reflects at each boundary; the A-scan trace (amplitude vs time) builds in sync below; toggle "gel on/off" shows the air–skin echo swallowing everything. Finite clip with Replay.
- **Check:** what an A-scan gives (thickness); B = brightness; dark cyst means uniform; thickness from 50 μs and 1600 m/s.

### D. Resolution vs penetration (PDF p.66)

- Axial resolution: along the beam; shorter pulse better.
- Lateral resolution: across the beam; higher frequency (less diffraction) and narrower beam better.
- Higher frequency → more attenuation → less penetration. Shallow (thyroid, breast): 7–10 MHz. Deep (liver, kidney): 3.5–5 MHz.
- **Visual:** slider of frequency 1–15 MHz: beam spread narrows while the reachable depth shrinks; labels for organ depths.
- **Check:** choose frequency for breast/kidney/liver/thyroid; T/F longer wavelength improves lateral resolution (false).

### E. Advantages and limitations (PDF p.67)

- Pros: non-ionizing (foetus), soft-tissue contrast, real-time motion, 3-D, cheap and available.
- Limits: cannot image through bone or gas (strong reflection); heating; cavitation bubbles. Monitor power and pressure.
- Other uses (snapshot): physiotherapy heating, lithotripsy (skip detail).
- **Table** pros vs limits.
- **Check:** why not for the brain (skull).

---

## 2.3 Endoscopy (PDF pp.70–78, printed pp.75–83)

### A. Total internal reflection (PDF p.70)

- Snell's law \(n_1\sin\theta_1 = n_2\sin\theta_2\). Critical angle \(\sin c = n_2/n_1\) (for \(n_1 > n_2\)).
- TIR when light goes toward the less dense medium and angle of incidence > c.
- **Visual:** interactive: angle slider at a glass–cladding boundary; refracted ray grazes at c, then vanishes; readout of c.

### B. Optical fibre (PDF pp.71–72)

- Glass core of higher n, cladding of slightly lower n. Ray hits core–cladding boundary above c → guided, even round a bend.
- **Maximum entrance angle:** refraction angle at the end = 90° − c; \(\sin\theta_{max} = n_1 \sin(90° - c)\) for entry from air.
- Example 2.6 idea: 1.49/1.47 → c ≈ 80.6°, θmax ≈ 14.1°. In water θmax decreases.
- **Visual:** animated stage: ray zig-zags through a curved fibre.
- **Worked (own numbers):** core 1.52, cladding 1.48.
- **Check:** two conditions for TIR; ray below c partly reflects (not all leaks).

### C. Endoscope (PDF pp.73–77)

- Bundle of fibres. **Coherent** bundle (fibres keep the same order at both ends) carries the image; **incoherent** bundle carries light in (cheaper). Extra channels: tools (forceps), air/water. Flexible tip steered.
- Image: objective lens focuses the scene on the coherent bundle end; each fibre carries one dot of brightness → mosaic.
- **Resolution:** finer, more closely packed fibres → higher resolution; finer fibres also bend more. Typical bundle 0.5–3 mm, 5000–40 000 fibres.
- Uses: stomach, colon (natural openings); keyhole surgery.
- Pros: inspect inner surfaces, no ionizing radiation, keyhole surgery (fast recovery), biopsy samples.
- Limits: anaesthesia, fasting, narrow field of view, only hollow organs, minimally invasive, rare bleeding/allergy.
- Rigid endoscope, capsule endoscopy (snapshots, one line each).
- **Visual:** interactive: a letter imaged through a bundle; buttons coherent/incoherent and a fibre-density slider (coarse → fine) redraw the far-end mosaic.
- **Check:** which bundle carries the image; which density gives the highest resolution; not suitable organ (eye).

---

## Summary page

- Formula sheet: Z = ρc; α = (Z₂ − Z₁)²/(Z₂ + Z₁)²; transmitted 1 − α; s = ct/2; sin c = n₂/n₁; n₁ sin θ₁ = n₂ sin θ₂; sin θmax = n_core cos c.
- Definitions list; comparison table ultrasound vs endoscopy; traps (dark area ≠ absorbs more; gel reduces reflection not attenuation; higher f better resolution but less depth; incoherent cheaper, not lower loss); last checks.
