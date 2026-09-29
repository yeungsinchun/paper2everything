# Book 2 chapter 1 usability mistakes and replication plan

This audit covers `paper2notes/notes/book2/ch01-position-and-displacement/`. Apply the same checks to chapters 2–4, but keep each chapter's physics and controls specific to what the figure teaches.

## Mistakes found in chapter 1

1. **The top navigation listed chapter 1 twice.** Two adjacent links had the same URL and label, while only one had `aria-current="page"`. Remove the duplicate and retain one current-page link.
2. **The chapter override stylesheet existed but was not loaded.** The page linked only the shared Book 2 stylesheet, leaving no safe place for chapter-specific layout. Load `css/notes.css` after `../css/notes.css`.
3. **Every HUD label had absolute positioning but no coordinates.** The shared `.hud-label` rule set `position: absolute` without `top` or `left`, so labels occupied the same bottom-left/static origin. Give fixed metric HUDs explicit offsets and project object labels from scene coordinates after initial render and every resize.
4. **HUD labels were not bound to the objects they described.** A resize or responsive column change could separate labels from arrows and points. Use a `placeHud(label, canvas, camera, point)` projection helper for object labels; reserve CSS offsets for fixed readouts only.
5. **The distance-versus-displacement stage used a generic static vector sketch.** It did not show a mouse travelling A→B→C, path length accumulating, or displacement changing. Build a chapter-specific scene with a recognisable moving marker, a progressively drawn path, and a live start-to-current displacement arrow.
6. **The displayed values contradicted the animation state.** The original labels showed the final 1000 m distance even before any movement. Derive distance, east/north components, displacement magnitude, and direction from one normalized progress value, then update geometry and text together.
7. **The main figure was not visually centred.** A full-width stage made a compact diagram float inside excess canvas. Cap the stage width and use auto inline margins while retaining full width on small screens.
8. **Figures had no student-controlled timing.** Students could not pause, replay, or inspect an intermediate state. Put a play/pause/replay button and range scrubber inside every animated stage, with keyboard-operable native controls.
9. **Off-screen animations could finish before students reached them.** Starting every scene at page load made later figures effectively static. Start each scene when at least part of it first enters the viewport; keep reduced-motion mode paused for manual use.
10. **Figures exposed no values on inspection.** Hovering a graph or moving object yielded no explanatory feedback. Add an in-stage pointer tooltip reporting the current values or conceptual step; keep the scrubber and live labels as the non-pointer equivalent.
11. **Vector construction appeared fully formed.** Showing component and resultant arrows at once hid the tip-to-tail reasoning. Animate component 1, component 2, then the resultant in distinct phases controlled by the same scrubber.
12. **The graph did not connect slope to a changing numerical state.** A static curve plus a detached “slope = velocity” label required interpretation. Move a point along the curve, draw its local tangent, and report time, displacement, and velocity together.
13. **The O→P→O example did not reveal the zero-displacement ending.** Two static arcs did not show the journey order. Move the traveller along the outward and return arcs and state the current displacement relationship in the hover readout.
14. **The worked 3–4–5 example skipped its construction.** Animate 3 m east, 4 m north, then the 5 m resultant so the numerical relationship and vector rule arrive in order.
15. **The opening hierarchy was slow to scan.** The lede only repeated topic nouns, while the long learning-objective panel delayed the first concept. Add a three-part “In 20 seconds” summary and make the objectives expandable while preserving all syllabus text.
16. **The quick-summary math initially broke onto separate lines.** A broad descendant selector targeted every KaTeX-generated `span`. Style only direct summary children (`p > span`) so component spans retain KaTeX layout.
17. **Figure numbers were duplicated.** The vector pair and graph were both “Fig. 2.2”. Renumber figures in reading order after inserting or moving any visual.
18. **The shared renderer was too generic for chapter-specific teaching.** One branch drew the same arrows for trench, vector addition, and resolution. Use a chapter-local renderer when scene state, labels, or interactions encode chapter-specific reasoning; do not complicate the shared renderer for a single chapter.
19. **Animation controls lacked motion-preference behavior.** Autoplay ignored students who request reduced motion. Detect `prefers-reduced-motion: reduce`, leave scenes paused, and make manual scrub/play available.
20. **Scrubber progress was not originally described accessibly.** A raw 0–1000 range has little meaning. Give each slider an explicit label and update `aria-valuetext` with animation percentage.

## Reproducible plan for chapters 2–4

1. Open each chapter at desktop and narrow viewport widths. Record the bounding boxes of every `.hud-label`; fail the check if two unrelated labels overlap or if any label falls outside its `.stage`.
2. Inspect the top bar for duplicate URLs/labels and ensure exactly one chapter link has `aria-current="page"`.
3. Inventory every `[data-scene]` and write the single physics relationship it must reveal. Remove animation that is decorative or does not change the student's understanding.
4. Give each finite or staged scene one normalized progress value. Derive all geometry, labels, units, and tooltip text from that value so they cannot drift out of sync.
5. Add native play/pause/replay and range controls inside the stage. Confirm Space/Enter operates the button and arrow keys operate the range.
6. Start animations on first meaningful viewport entry, not at document load. Under reduced motion, render the initial state and wait for manual input.
7. Project labels attached to moving geometry with the active camera after render and resize. Give fixed readouts explicit chapter-scoped `top`/`left` rules keyed by `data-hud`.
8. Add concise hover/touch inspection text with a keyboard-accessible equivalent in live labels or the scrubber readout. Include values and units where the visual is quantitative.
9. Cap and centre a single compact stage; let paired comparisons use the full two-column figure area and stack them at the existing mobile breakpoint.
10. Add an opening three-item digest: definitions or relationships a student should retain after one scan. Keep its selectors away from KaTeX internals.
11. Collapse secondary syllabus/meta material when it pushes the first explanation down, but preserve the content and keyboard interaction.
12. Read all figure numbers and captions in order. Captions must say what changes and why it matters, not merely name visible objects.
13. Run `node paper2notes/scripts/ci-check.mjs`, load the chapter through a local HTTP server, check browser console errors, exercise every button/range, and capture desktop plus narrow screenshots.

## Chapter-specific targets

- **Chapter 2:** scrub displacement-time and velocity-time motion together; show slope and area values at the same instant; make acceleration changes visibly affect both graphs.
- **Chapter 3:** stage free-body diagrams force by force; let students reveal/hide the resultant; hover an arrow for force name, magnitude, and direction.
- **Chapter 4:** animate paired Newton III forces simultaneously and keep them on different bodies; for Newton II, scrub force/mass and update acceleration with units without using decorative 3D motion.
