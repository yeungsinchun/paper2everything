# Book 6 Ch.3 outline: Orbital Motions under Gravity

Textbook order from Active Physics Book 6 Chapter 3 (`book-6.pdf` PDF pp.49-88, printed pp.56-95). HKDSE elective E1 (c). Visual first; this file plans the HTML.

Prior knowledge: Book 2 (Newton's laws, uniform circular motion with centripetal force mv^2/r, gravitation F = GMm/r^2, KE and mgh). Constants: G = 6.67x10^-11 N m^2 kg^-2; M_Earth = 5.97x10^24 kg; R_Earth = 6370 km; M_Sun = 1.99x10^30 kg; 1 AU = 1.50x10^11 m.

Page shape: `3-1.html` to `3-4.html`, `summary.html`, `index.html`.

---

## 3.1 Kepler's laws of planetary motion (printed pp.56-63, Figs 3.1-3.9, Table 3.1, Examples 3.1-3.2, Checkpoints 1-2)

### A. First law: ellipses with the Sun at one focus

- **Visual:** interactive stage `ellipse`: ellipse with both foci, Sun at one focus, perihelion and aphelion marked, a and b labelled; slider "eccentricity" 0 to 0.9 (a fixed); live readouts r_p = a(1 - e), r_a = a(1 + e), and a = (r_p + r_a)/2. At e = 0 the foci merge and the ellipse is a circle.
- **Definitions:** ellipse, focus (two foci), semi-major axis a, semi-minor axis b, perihelion, aphelion (perigee and apogee for Earth orbits).
- **Formula:** a = (r_p + r_a) / 2.
- **Check:** Sun is at a focus, not the centre; compute r_p and r_a from 2a = 3.05 AU and focus 0.145 AU from centre (our numbers differ: 2a = 4.00 AU, c = 0.30 AU).

### B. Second law: equal areas in equal times

- **Visual:** animated stage `equal-areas`: planet on an elongated ellipse, speed from Kepler's equation; every fixed time slice the swept sector is shaded in alternating tints; near the Sun sectors are short and fat, far away long and thin, all equal in area. HUD shows the speed rising near perihelion.
- **Definition:** radius vector sweeps equal areas in equal time intervals.
- **Text:** planet fastest at perihelion, slowest at aphelion.
- **Check:** time from X to X' vs area; where is speed greatest.

### C. Third law: T^2 proportional to a^3

- **Visual:** static SVG log-log plot of T^2 against a^3 for the eight planets (and Ceres, Halley), a straight line of slope 1 in AU and years.
- **Formula:** T^2 = k a^3; for two bodies orbiting the same central body (T1/T2)^2 = (a1/a2)^3; around the Sun with T in years and a in AU: T^2 = a^3.
- **Table:** planet, a/AU, T/y, a^3, T^2 (our rounded values from standard data).
- **Check:** Pluto a = 39.5 AU gives T = 39.5^1.5 y; X twice as far as Y: period ratio 2^1.5 = 2.83, not 2.
- **Worked examples (collapsed):** satellite period from the Moon's data; Halley's comet from perihelion and aphelion distances (use 0.59 AU and 35.1 AU -> a = 17.8 AU, T = 75 y).

---

## 3.2 Orbital motion under gravity (printed pp.64-70, Figs 3.10-3.12, Examples 3.3-3.5, Checkpoint 3)

### A. Circular orbits: gravity supplies the centripetal force

- **Visual:** interactive stage `circular-orbit`: planet circling a star with the gravity arrow pointing to the centre and the velocity arrow tangent; slider orbital radius r; readouts v = sqrt(GM/r) and T = 2 pi r / v for the Earth as central body (r from 7000 km to 42 000 km), showing v falls and T rises; marks the geostationary radius.
- **Formulas:** GMm/r^2 = mv^2/r; v = sqrt(GM/r); T^2 = (4 pi^2 / GM) r^3, so k = 4 pi^2 / GM. Elliptical: replace r by a.
- **Conditions:** M much larger than m; M at the focus; SI units with the GM form, AU and years only with T^2 = a^3 for the Sun.
- **Check:** orbital period independent of satellite mass; which variable changes the period.

### B. Satellites and geostationary orbits

- **Visual:** static SVG of Earth with three orbit families: low-Earth (< 2000 km), medium, geostationary (36 000 km altitude) in the equatorial plane, with the note that a geostationary satellite stays over one point on the equator.
- **Worked examples (collapsed):** satellite 300 km up: v = 7.73 km/s, T = 1.51 h; geostationary radius 4.22x10^7 m, v = 3.07 km/s (our working, same physics).
- **Check:** why a geostationary orbit must be equatorial; geosynchronous vs geostationary.

### C. Weighing a central body

- **Formula:** M = 4 pi^2 a^3 / (G T^2).
- **Visual:** static SVG of a moon on its orbit with T and a labelled feeding into M.
- **Worked examples (collapsed):** mass of Jupiter from Io (T = 1.77 d, a = 4.22x10^8 m -> 1.90x10^27 kg); an exoplanet's orbit radius from its period and the star's mass.
- **Check:** ratio problems for two moons of Mars (which relations valid).

---

## 3.3 Energy in orbital motion (printed pp.71-83, Figs 3.13-3.20, Examples 3.6-3.8, Checkpoints 4-6)

### A. Gravitational potential energy U = -GMm/r

- **Visual:** static SVG graph of U against r: negative, rising toward zero as r goes to infinity, starting at r = R (surface); arrow "work done to separate".
- **Definition:** U = work done by an external agent to bring m from infinity to distance r; zero at infinity; always negative.
- **Formula:** U = -GMm/r; Delta U = GMm (1/r1 - 1/r2) for r1 < r2; reduces to mgh near the surface (h << R).
- **Check:** what halves U; sketches of U against r (wrong shapes).

### B. Mechanical energy is conserved along an orbit

- **Visual:** animated stage `orbit-energy`: satellite on an ellipse; three live bars KE (always positive), U (negative) and E (constant, negative); KE peaks at perigee where U is most negative.
- **Formula:** (1/2) m v1^2 - GMm/r1 = (1/2) m v2^2 - GMm/r2.
- **Worked example (collapsed):** Mars speed at perihelion from aphelion speed (21.9 km/s at 1.67 AU -> 26.5 km/s at 1.38 AU).
- **Check:** among positions on an ellipse, largest U, KE, E.

### C. Circular orbits: E = U / 2 and changing orbits

- **Formulas:** v^2 = GM/r gives KE = GMm/(2r), E = -GMm/(2r) = U/2 = -KE.
- **Visual:** animated stage `transfer`: spacecraft in a low circle, fires at perigee into an elliptical transfer orbit, coasts half an orbit, fires at apogee into a higher circle; HUD shows E before and after (less negative). Finite clip, replay.
- **Text:** to go higher you add energy (rocket fuel); air drag removes energy, so a low satellite sinks and speeds up.
- **Worked example (collapsed):** 2000 kg craft from 300 km to 12 000 km altitude: Delta E = +3.80x10^10 J, transfer time 1.94 h.
- **Check:** after a decelerating burn into a smaller circle: E decreases, period decreases, speed increases.

### D. Escape speed

- **Visual:** interactive stage `cannonball`: Newton's mountain; slider launch speed as a fraction of v_esc; shows fall back (v < v_circ), circle (v = sqrt(GM/R)), ellipse (between), escape (v >= sqrt(2GM/R)).
- **Definition:** escape speed = minimum launch speed from the surface for E >= 0.
- **Formula:** v_esc = sqrt(2GM/R) = sqrt(2) x v_circ at the surface; 11.2 km/s for the Earth.
- **Check:** escape speed independent of the object's mass; larger for compact massive bodies; black hole when v_esc >= c.
- **Worked example (collapsed):** Earth: 11.2 km/s vs 7.91 km/s; Moon: 2.37 km/s.

---

## 3.4 Apparent weightlessness (printed pp.84-87, Figs 3.21-3.27, Checkpoint 7)

### A. Same acceleration for everything in the spacecraft

- **Visual:** animated stage `free-fall-orbit`: a spacecraft and the astronaut inside on the same orbit, both with gravity arrows of the same g = GM/r^2; the floor does not push the astronaut, so the astronaut floats relative to the cabin.
- **Formula:** a = GM/r^2, independent of m.
- **Definition:** apparent weightlessness = the feeling of no weight when the support force is zero because you and your support share the same acceleration; gravity is not zero.
- **Check:** "gravity is zero in orbit" false; a at 1000 km altitude.

### B. The free-fall ride on Earth

- **Visual:** static SVG two panels: person on a seat at rest (weight down, normal force up equal) vs seat in free fall (weight down, normal force zero).
- **Text:** a falling lift or a zero-g aircraft arc gives the same feeling; a spacecraft drifting far from all bodies feels weightless for a different reason (no gravity at all).
- **Check:** zero-g aircraft: which part of the flight is weightless (engines throttled to follow a free-fall parabola).

---

## Summary page

- Formula sheet: Kepler 3 forms; v = sqrt(GM/r); T^2 = 4 pi^2 r^3 / GM; M = 4 pi^2 a^3/(G T^2); U = -GMm/r; energy conservation; E = -GMm/2r; v_esc = sqrt(2GM/R); a = GM/r^2.
- Definitions list; comparison of circular orbit quantities as r increases (v down, T up, KE down, U up, E up).
- Traps: Sun at focus not centre; T^2 = a^3 only for the Sun in AU and years; U negative; E = U/2 only for circles; weightless is not gravity-free.
