# Book 6 Ch.4 outline: Starlight, Messengers from the Stars

Textbook order from Active Physics Book 6 Chapter 4 (`book-6.pdf` PDF pp.89-146, printed pp.98-155). HKDSE elective E1 (d), stellar information. Visual first; this file plans the HTML.

Prior knowledge: Ch.1 units, Ch.3 orbits and M = v^2 r / G, waves and the electromagnetic spectrum (Book 3, assumed in words only), logarithms as needed for magnitudes (taught in place).

Constants: c = 3.00x10^8 m/s; sigma = 5.67x10^-8 W m^-2 K^-4; L_Sun = 3.85x10^26 W; R_Sun = 6.96x10^8 m; T_Sun = 5780 K; 1 pc = 206 265 AU = 3.26 ly; Wien constant 2.90x10^-3 m K.

Page shape: `4-1.html`, `4-2.html`, `4-3.html`, `summary.html`, `index.html`.

---

## 4.1 Distance and brightness of stars (printed pp.98-111, Figs 4.1-4.9, Examples 4.1-4.5, Checkpoints 1-2)

### A. Angles in the sky

- **Visual:** static SVG: observer, object of diameter D at distance d subtending theta; second panel: two stars close in the sky but far apart in depth.
- **Definitions:** apparent (angular) distance; apparent (angular) diameter; 1 degree = 60 arcmin = 3600 arcsec; radian.
- **Formula:** theta (rad) = D / d (small angle); degrees to radians multiply by pi/180.
- **Check:** if the Moon's distance doubled, its apparent diameter halves; finger at arm's length ~ 1 degree.
- **Worked example (collapsed):** Moon diameter from 0.52 degrees and 384 000 km -> 3490 km.

### B. Stellar parallax and the parsec

- **Visual:** interactive stage `parallax`: Earth goes round the Sun; a near star shifts against far background stars (sky strip inset shows its position six months apart); slider distance d in pc; readout p = 1/d arcsec.
- **Definitions:** parallax p = half the apparent shift over six months (angle subtended by 1 AU at the star); 1 parsec = distance at which p = 1 arcsec = 206 265 AU = 3.26 ly.
- **Formulas:** p (rad) = 1 AU / d; d (pc) = 1 / p (arcsec).
- **Text:** nearest star Proxima Centauri p = 0.77 arcsec, so every other p is smaller; ground-based blur limits the method; space satellites (Hipparcos, Gaia) reach about 1000 ly.
- **Check:** which star is farthest from mixed units; precision limit (p comparable with uncertainty).
- **Worked example (collapsed):** Proxima 0.769 arcsec -> 1.30 pc = 4.24 ly; Vega 25 ly -> 0.130 arcsec.

### C. Magnitudes: apparent and absolute

- **Visual:** static SVG magnitude number line from -27 to +30: Sun -26.7, full Moon -12.7, Venus -4.6, Sirius -1.5, Polaris 2.0, naked-eye limit 6.5, large telescope limits; brighter to the left.
- **Definitions:** magnitude scale (smaller = brighter; 5 magnitudes = factor 100; 1 magnitude = 100^(1/5) = 2.512); apparent magnitude m (as seen from Earth); absolute magnitude M (as seen from 10 pc).
- **Formula:** brightness ratio = 100^(Delta m / 5) = 2.512^(Delta m); m - M = 5 log10(d / 10 pc) (enrichment-level, used by exam-style questions).
- **Check:** two stars same m: not necessarily same M; star R m = 3 vs S m = 4.
- **Worked example (collapsed):** Sun vs Sirius: in the sky 100^(25.24/5) = 1.25x10^10; in output 100^(3.41/5) = 23.

### D. Brightness falls with the square of distance

- **Visual:** static SVG: star at the centre, spheres at d, 2d, 3d with the same power spread over 1, 4, 9 times the area.
- **Formula:** intensity I = P / (4 pi d^2).
- **Check:** same output, 6 times farther -> 36 times dimmer; solar intensity at Mars 1.5 AU.

---

## 4.2 Classification of stars (printed pp.112-126, Figs 4.10-4.27, Tables 4.2, Examples 4.6-4.8, Checkpoints 3-5)

### A. Stellar spectra and blackbody radiation

- **Visual:** interactive stage `blackbody`: radiation curve (intensity vs wavelength, 0-3000 nm) with the visible band shaded; temperature slider 2500 K to 30 000 K; peak marker moves left as T rises and the whole curve grows; a colour swatch shows the star's colour; readout lambda_max.
- **Definitions:** blackbody (perfect absorber and perfect emitter; spectrum depends only on temperature).
- **Formula:** Wien's displacement law lambda_max T = 2.90x10^-3 m K (Sun: 502 nm).
- **Text:** hotter = more at every wavelength, peak at shorter wavelength, bluer; cooler = redder.
- **Check:** blue vs red star of same size (true-or-false set).

### B. Spectral classes and absorption lines

- **Visual:** static SVG spectral class strip O B A F G K M with temperature ranges and colours (blue to red); absorption spectrum strip with dark lines on a rainbow and its intensity graph with dips.
- **Definitions:** Harvard classes OBAFGKM (O hottest, M coolest; Sun is G2 at 5780 K); absorption lines = dark lines where cooler outer gas absorbs specific wavelengths; fingerprints of elements.
- **Table:** class, temperature range, colour.
- **Check:** rank A, F, G, O by temperature; what absorption lines tell (composition, temperature, motion).

### C. Luminosity and the Stefan-Boltzmann law

- **Visual:** interactive stage `luminosity`: two stars side by side drawn to relative size and colour; sliders R (in R_Sun) and T; readout L / L_Sun = (R/R_Sun)^2 (T/T_Sun)^4.
- **Definitions:** luminosity L = total power emitted (all wavelengths, W).
- **Formulas:** L = 4 pi R^2 sigma T^4; I = L / (4 pi d^2).
- **Check:** radius halved and temperature doubled -> L x 4; hotter star not necessarily more luminous.
- **Worked examples (collapsed):** solar constant 1360 W/m^2; Sun's L from R and T; large cool star vs small hot star ratio.

### D. The Hertzsprung-Russell diagram

- **Visual:** static SVG H-R diagram: temperature axis decreasing to the right (30 000 K to 2500 K, classes O to M on top), luminosity log axis 10^-4 to 10^6 L_Sun; main sequence band, red giants, supergiants, white dwarfs; Sun marked; dashed lines of constant radius (0.01, 1, 100 R_Sun).
- **Text:** main sequence 90 percent of stars (hot = large and luminous); giants and supergiants upper right (cool but luminous so huge); white dwarfs lower left (hot but dim so tiny, Earth-sized).
- **Check:** locate four stars; class K giant cooler than the Sun; class B star not necessarily bigger.
- **Worked example (collapsed):** Betelgeuse ~1x10^5 L_Sun; Sirius B ~0.026 L_Sun.

---

## 4.3 Doppler effect and its applications (printed pp.127-145, Figs 4.28-4.41, Table 4.3, Examples 4.9-4.13, Checkpoints 6-8)

### A. The Doppler effect for light

- **Visual:** animated stage `doppler`: a source moving right emits circular wavefronts; crests bunch in front and spread behind; observer markers ahead (blue shift) and behind (red shift). Slider source speed. Continuous.
- **Visual 2:** static SVG spectrum strip: lab lines vs approaching star (lines shifted to blue) vs receding star (to red).
- **Definitions:** Doppler effect; blue shift, red shift; radial velocity (component along the line of sight; positive = receding).
- **Formula:** Delta lambda / lambda = v_r / c (v_r << c).
- **Check:** wave speed unchanged; transverse motion gives no shift.
- **Worked examples (collapsed):** galaxy line 434.0 nm observed 435.9 nm -> recession 1.3x10^6 m/s (our numbers); star at 30 degrees to line of sight.

### B. Binary stars and exoplanets

- **Visual:** animated stage `binary`: a light star circles a massive star; observer at the bottom; synchronized radial velocity curve (sine) with a moving marker and a spectral line that swings red and blue.
- **Formulas:** v = 2 pi r / T, r = vT / (2 pi), M = v^2 r / G.
- **Text:** spectroscopic binaries; exoplanets found from the parent star's wobble (first in 1995); black holes inferred from an unseen massive companion plus X-rays.
- **Check:** at which orbit position shift is zero/max red/max blue.
- **Worked example (collapsed):** max Delta lambda/lambda = 7.73x10^-4, T = 12 d -> v = 2.32x10^5 m/s, r = 3.83x10^10 m, M = 15.5 M_Sun.

### C. Rotation curves and dark matter

- **Visual:** static SVG rotation curve: predicted v proportional to 1/sqrt(r) beyond the bright core vs observed flat curve.
- **Text:** flat curve means unseen mass extending beyond the visible disc; dark matter about 5 times normal matter; also galaxy cluster motions, colliding galaxies, gravitational lensing.
- **Check:** dark matter does not emit or reflect light; is detected only by gravity.

### D. Hubble's law and the expanding universe

- **Visual:** static SVG v vs d plot (straight line through origin, slope H0 about 70 km/s per Mpc) beside a balloon analogy (marks 1 cm and 2 cm become 2 cm and 4 cm).
- **Formula:** v = H0 d.
- **Text:** distant galaxies all red-shifted; farther = faster; uniform expansion, no centre; nearby Local Group members (Andromeda) do not follow it.
- **Check:** all distant galaxies blue-shifted (false); same recession speed (false).
- **Worked example (collapsed):** galaxy at 210 Mpc recedes at about 1.5x10^4 km/s.

---

## Summary page

- Formula sheet: theta = D/d; d = 1/p; 1 pc = 206 265 AU = 3.26 ly; brightness ratio 2.512^(Delta m); m - M = 5 log10(d/10); I = L/(4 pi d^2); L = 4 pi R^2 sigma T^4; lambda_max T = const; Delta lambda/lambda = v_r/c; v = 2 pi r/T; M = v^2 r/G; v = H0 d.
- Definitions list; star type table (main sequence, red giant, supergiant, white dwarf).
- Traps: smaller magnitude = brighter; parallax is half the shift; H-R temperature axis reversed; luminosity is all wavelengths; Doppler gives only radial velocity.
