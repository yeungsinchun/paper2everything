# Book 6 Ch.2 outline: Modelling the Universe

Textbook order from Active Physics Book 6 Chapter 2 (`book-6.pdf` PDF pp.19-48, printed pp.24-53). HKDSE elective E1 (b), astronomy through history. Visual first; this file plans the HTML.

Prior knowledge: Ch.1 (planets orbit the Sun, stars are far away), uniform circular motion in words.

Page shape: `2-1.html`, `2-2.html`, `2-3.html`, `summary.html`, `index.html`.

Source gaps: portraits, historical woodcuts (Copernicus' diagram, Galileo's notebooks, the "Sphaera" figure) and photos (star trails, Venus phases photo) are not reproduced; each is replaced by a redrawn schematic. The history boxes (Church, Galileo's trial) shrink to one line of context each.

---

## 2.1 Apparent motion of celestial bodies (printed pp.24-29, Figs 2.1-2.8, Checkpoint 1)

### A. Daily motion

- **Visual:** animated stage `daily-motion`: a celestial dome over an observer; stars turn about the celestial pole once a day and draw circular trails; the Sun rises in the east and sets in the west on the same turn. Fixed camera (the dome is drawn in perspective, no drag).
- **Definition:** daily motion = apparent east-to-west turning of the whole sky once a day, caused by the Earth spinning west to east once every 24 h.
- **Check:** cause of star trails (Earth's rotation, not the stars moving).
- Enrichment line: celestial sphere model (Earth at rest, sky sphere turning) is a useful description, not reality.

### B. Yearly motion of the Sun and the ecliptic

- **Visual:** animated stage `ecliptic`: top view; Earth orbits the Sun; the line from Earth through the Sun points at a ring of 12 zodiac constellations; HUD names the constellation the Sun appears in front of. The constellation on the opposite side is the one visible at midnight.
- **Definitions:** yearly motion = the Sun drifts eastward against the background stars by about 1 degree a day, one lap per year. Ecliptic = its yearly path on the sky (projection of Earth's orbit). It passes through 12 zodiac constellations (13 strictly; 88 constellations in total).
- **Check:** in late December the Sun is in front of Sagittarius; can you see Sagittarius at night then? (No: it is up in the daytime.)

### C. Planets: retrograde loops and the morning and evening stars

- **Visual:** animated stage `retro-sky`: what we see (sky view only): Mars drifts east against the stars, slows, moves west for a few weeks (retrograde), then east again, tracing a loop. Explanation is held back to 2.3.
- **Visual 2:** static SVG of the eastern sky before sunrise and western sky after sunset with Venus and Mercury close to the Sun's position below the horizon.
- **Definitions:** retrograde motion = a planet's temporary westward (backward) motion against the background stars. Morning or evening "star" = Mercury or Venus seen near the horizon just before sunrise or just after sunset; never far from the Sun (Venus at most 47 degrees, Mercury about 28 degrees).
- **Text:** all planets stay close to the ecliptic because their orbits lie nearly in one plane.
- **Check:** name the motion (Moon rises and sets = daily; Sun shifts against stars = yearly; Mars reverses = retrograde); can Venus be seen at midnight?

---

## 2.2 Astronomy of ancient Greeks (printed pp.30-33, Figs 2.9-2.15, Checkpoint 2)

### A. Early geocentric models

- **Visual:** static SVG of nested spheres (Eudoxus): Earth at the centre, Moon, Sun and planets on transparent spheres turning at different rates about different axes, fixed stars on the outermost sphere.
- **Definitions:** geocentric = Earth at the centre of the universe. Greek starting beliefs: the universe can be understood by reason (Thales); heavenly bodies are perfect, so they move on spheres and circles (Plato).
- **Check:** which of these did the Greeks believe (circles are perfect; Earth at centre; Sun at centre).

### B. Epicycles and deferents

- **Visual:** animated stage `epicycle`: planet on a small circle (epicycle) whose centre rides a large circle (deferent) about the Earth; the planet's path is traced and shows loops; when the planet is on the inner side of its epicycle it moves backward as seen from Earth and is closer, hence brighter. Control: epicycle size (small, medium, large) changes whether loops appear. Continuous loop, no replay.
- **Definitions:** epicycle, deferent.
- **Text:** explains retrograde motion and brightening. Ptolemy (AD 140) tuned radii and rates and moved Earth slightly off the deferent centre; model lasted about 1500 years.
- **Visual 2:** static SVG, Ptolemaic system: Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn, stars; Mercury and Venus epicycle centres pinned on the Earth-Sun line (so they never stray far from the Sun).
- **Check:** in Ptolemy's model, is Venus ever farther than the Sun? (No.) Why were the epicycle centres of Mercury and Venus pinned?
- **Worked example (collapsed):** none numeric; a short "explain both puzzles with the model" model answer.

---

## 2.3 Copernican revolution (printed pp.34-48, Figs 2.16-2.30, Table 2.1, Checkpoints 3-4)

### A. The heliocentric model of Copernicus

- **Visual:** animated stage `retro-orbit`: top view; Earth (inner, faster) overtakes Mars (outer, slower); sight lines from Earth through Mars meet a background star strip, and Mars's apparent position on the strip moves east, backs west, then goes east. Numbers 1-7 on matching positions. Continuous loop.
- **Definitions:** heliocentric = Sun at the centre; Earth is one of the planets; daily motion from Earth's spin.
- **Text:** retrograde = Earth overtaking an outer planet (or an inner planet overtaking Earth); morning and evening stars = inner orbits, so the angle from the Sun is limited (sin of max elongation = r / 1 AU, Venus 0.72 AU gives 46 to 47 degrees).
- **Formula:** max angular separation of inner planet: sin(theta) = r_planet / r_Earth.
- **Check:** Copernicus still used circles, so his predictions were no better than Ptolemy's; true or false items.
- **Worked example (collapsed):** Mercury 0.39 AU gives about 23 degrees.

### B. Galileo's telescope discoveries

- **Visual:** animated stage `venus-phases`: top view of Sun, Venus orbit, Earth; inset shows Venus as seen from Earth (lit fraction and apparent size). Toggle: Copernican (full set of phases, small when full, large when crescent) vs Ptolemaic (Venus stays between Earth and Sun: only crescents). Continuous loop with model toggle.
- **Table:** discovery -> what it shows: Moon craters and sunspots (heavens not perfect); four moons of Jupiter (not everything orbits Earth; a moving body keeps its moons); full cycle of Venus phases (Venus orbits the Sun); Milky Way resolves into faint stars.
- **Visual 2:** small animated stage `jupiter-moons`? Not needed; a static SVG of four dots shifting nightly beside Jupiter is enough.
- **Check:** which discovery rules out Ptolemy's Venus; why can't the Moon's phases be used the same way (Moon is opposite the Sun at full; Venus never is).

### C. Tycho and Kepler complete the model

- **Visual:** static SVG timeline 600 BC to AD 1700: Thales, Plato, Eudoxus, Ptolemy, Copernicus, Tycho, Galileo, Kepler, Newton, each with one-line contribution.
- **Text:** Tycho's 20 years of precise naked-eye positions; Kepler fitted Mars with an ellipse and found three laws (details in Ch.3); Newton explained why.
- **Table:** heliocentric vs geocentric judged as scientific models: fewer assumptions, explains new observations, better predictions (only after Kepler).
- **Check:** which statement about Kepler's elliptical orbit for Mars is correct (better predictions; it does not explain retrograde motion by itself).

---

## Summary page

- Comparison table: Eudoxus spheres, Ptolemy, Copernicus, Kepler (centre, orbit shape, explains retrograde how, explains morning star how, Venus phases).
- Definitions list: daily motion, yearly motion, ecliptic, retrograde motion, morning/evening star, geocentric, heliocentric, epicycle, deferent.
- Formula: max elongation sin(theta) = r/1 AU.
- Traps: Copernicus kept circles; Venus phases cannot be produced by Ptolemy; retrograde is apparent, not real; morning star is a planet.
