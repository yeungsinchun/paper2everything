# Problem shortlist: book9-ch01 — Vision and Hearing (Medical Physics elective)

Ordered to match the textbook flow. Sources: the textbook's own checkpoints, examples and chapter exercise (page images in the local scan), and the publisher bank `QB_E401` (staged at `paper2db/qb-web-ui-staging/qb/items/QB_E401.json`).

**Role:** `concept-check` = an in-flow check written fresh for the notes page (same idea, new wording and numbers); `worked-example` = a guided solution with new numbers; `skip` = not used.

**Protected text:** student pages never reproduce textbook, QB or DSE stems or answers. Every check below is re-authored. The leak check (`scripts/leak-check.mjs`) runs in CI.

**DSE section:** none for this chapter. `paper2db` classifies only Paper 1 (compulsory part). This elective is examined in Paper 2, which the repo does not hold, so there is no classified DSE item to show. The chapter exercise reprints some HKDSE Paper 2 items (PDF pp.42–43, 46: 2012, 2013, 2014); they are not classified or cropped by `paper2db` and are not shown.

---

## 1.1 Vision

| Source | Idea | Role | Used on |
|---|---|---|---|
| Checkpoint 1 Q3 | Where light bends most (air–cornea) | concept-check | 1-1 A |
| Checkpoint 1 Q2 | Retina image: real, inverted, diminished | concept-check | 1-1 A |
| Checkpoint 1 Q4 | Cornea fixed shape; image on retina; two cell types; cells do not guide light | concept-check (T/F) | 1-1 A |
| Example 1.1 | Cornea + lens powers add; power rises for a near object | worked-example (new numbers) | 1-1 B |
| Checkpoint 2 Q1–2 | Power of convex/concave; two thin lenses add | concept-check | 1-1 B |
| Example 1.2 | Image distance from eye power; power of accommodation | worked-example (new numbers) | 1-1 C |
| Checkpoint 2 Q4 | Ciliary muscle and lens shape when looking far | concept-check | 1-1 C |
| Exercise Q3 | Muscle relax + lens flatten for far object | concept-check | 1-1 C |
| Example 1.3 | θ_min from pupil and wavelength; strip spacing → distance | worked-example (new numbers) | 1-1 D |
| Exercise Q4 | What raises resolving power (larger pupil) | concept-check | 1-1 D |
| Exercise Q8 | Pixel separation that cannot be resolved | sa (write it) | 1-1 D |
| Checkpoint 3 Q3 | Which cones respond at a given wavelength | concept-check | 1-1 E |
| Exercise Q5 | Peak response green | concept-check | 1-1 E |
| Example 1.4 | Short sight: concave, f = −far point; near point shift | worked-example (new numbers) | 1-1 F |
| Example 1.5 | Long sight: convex power for 25 cm reading | worked-example (new numbers) | 1-1 F |
| Checkpoint 4 Q3–4 | Lens type and cause per defect | concept-check | 1-1 F |
| Exercise Q6–7 | +0.5 D lens properties; correcting a far point that drifts | concept-check | 1-1 F |
| Exercise Q9–14 | Camera sensor resolution; compound corrections | skip (beyond the notes' scope or duplicate) | — |

## 1.2 Hearing

| Source | Idea | Role | Used on |
|---|---|---|---|
| Checkpoint 5 Q2 | Match ear part to function | concept-check | 1-2 A |
| Exercise Q1–2 | Eardrum larger than oval window; two gain factors | concept-check | 1-2 B |
| Exercise Q3 | Vibrations enter the cochlea at the oval window | concept-check | 1-2 C |
| Example 1.6 | dB from intensity; doubling power → +3 dB | worked-example (new numbers) | 1-2 D |
| Checkpoint 6 Q1–2 | Halving → −3 dB; +10 dB → ×10 | concept-check | 1-2 D |
| Exercise Q4–5, Q9–10 | Level change from intensity ratio; adding equal sources | concept-check / sa | 1-2 D |
| Example 1.7 | Read phons from equal-loudness curves; 20 dB ↔ ×100 | worked-example (new numbers) | 1-2 E |
| Checkpoint 7 Q1, Q4 | Reference 1000 Hz; equal loudness ≠ equal intensity | concept-check | 1-2 E |
| Exercise Q6–7 | Phon at 1000 Hz equals dB; curves flatten for loud sounds | concept-check | 1-2 E |
| Checkpoint 7 Q3 | Hearing loss statements | concept-check | 1-2 F |
| Exercise Q11 | Threshold curves for age and noise | concept-check | 1-2 F |

## QB_E401 coverage (for the answerability audit, not for copying)

`QB_E401` items test: eye structure and labelling; refraction at cornea vs lens; power, lens formula and accommodation; near/far point and corrective lenses; resolving power with 1.22λ/D; spectral response; ear structure and pressure amplification; cochlea resonance; dB arithmetic; equal-loudness curves and phons; hearing loss; plus some optical-fibre and endoscope items that the notes cover in Chapter 2 (2-3). Every concept those items need is taught on 1-1, 1-2 or 2-3.
