# paper2notes Design System

Design system for **paper2notes** — visual HKDSE Physics notes built *backwards* from the question bank and DSE past papers: the notes contain just enough to answer every problem in the bank, and nothing else.

This is a **revamp**, not a recreation. The existing site (flat paper, Palatino serif, teal top bar, text-heavy book cards) is the starting point; this system replaces it with a friendly, figure-first, gamified look that works on phones first and can later become native iOS/Android apps.

## Sources
- GitHub: https://github.com/yeungsinchun/paper2everything (monorepo, `main`) — explore it for real chapter content, figure code and quiz behaviour.
  - `paper2notes/notes/` — the live notes site (Books 2, 4, 5 + QB). Styles: shared `paper2notes/notes/css/notes.css` plus a thin `book*/css/book.css`. Quiz logic: shared `notes/js/checks.js`. Home: `paper2notes/notes/index.html`.
  - `paper2db/` — classified DSE MC/LQ banks + QB items (future source for the "Stuck?" pointer).
- Live site: https://paper2notes-152505675251.asia-east2.run.app/

## Products
- **Notes website** (now) — Home → Book → Chapter/section pages with figures, quick checks, DSE MC/LQ decks, learning objectives.
- **Question bank** (`/qb/`) — DSE + QB selector.
- **Apps** (later) — same tokens/components, native shells.

---

## CONTENT FUNDAMENTALS
**Rule: if a student wouldn't read it, delete it.** Figures carry the explanation; words only label.
- **Length caps.** Headings ≤ 5 words. Figure captions: one line, ≤ 12 words. Quick-check prompt ≤ 12 words. "Why" feedback ≤ 8 words. Button labels 1–2 words.
- **Never on student pages:** hours, syllabus PDF names, `paper2db §05–12`, topic run-on lists, provenance, "Welcome to…", instructions on how to use the site.
- **Voice:** second person, present tense, calm coach. Short fragments are fine: "Start → end, straight line."
- **Wrong answers are nudges:** "Not quite. Try another." Never "Wrong!", never red.
- **Casing:** Sentence case for titles and buttons. UPPERCASE only for tiny `.p2n-label` kickers ("QUICK CHECK", "EXAM TRAP").
- **Symbols over words:** `→`, `×`, `≥`, units in mono. Physics symbols italic serif (KaTeX) and colour-keyed to the figure.
- **No emoji.** Icons come from Lucide.
- Examples — ✗ "Book 2 · 10 chapters · 50 h · Ch.1 Position & displacement → Ch.10 Gravitation · Syllabus II (ch2.pdf)" → ✓ "Force & Motion". ✗ "Correct! The answer is B because…" → ✓ "Back at the start → zero. +10 XP".

## VISUAL FOUNDATIONS
- **Colour.** Brand teal (`--teal-600 #137568`, kept from the original `#0f5c54`, brightened). Warm paper page `--paper #FAF7F0`, white cards. Sun yellow = XP/reward, flame orange = streak. Feedback: green `--ok`, amber `--nudge` (red is reserved for force vectors). One hue per book (`--book2` blue, `--book4` violet, `--book5` rose) used only on its icon + progress ring.
- **Figure palette = meaning.** `--fig-force` red, `--fig-velocity` blue, `--fig-accel` orange, `--fig-displacement` violet, `--fig-distance` cyan (dashed), `--fig-energy` gold, `--fig-field` teal, particles α/β/γ, p/n/e (from the original Book 5 tokens). The same quantity is the same colour on every chapter, in formulas and in legends.
- **Type.** Fredoka (display: headings, buttons, card titles), Nunito (body), JetBrains Mono (numbers, XP, codes). KaTeX for maths. All Google Fonts — see caveats.
- **Figure guideline.** 480-wide SVG viewBox. Strokes: hair 1.5 (guides/axes, `--fig-guide`), main 2.5 (objects, `--fig-ink`), bold 4 (vectors). Filled arrowhead 10, dots r6, round caps. Labels are symbols (italic serif, quantity colour) or one word in Nunito 700 14px. White background, no gradients, no drop shadows inside figures. 3D (three.js) stages follow the same palette.
- **Animation.** Figures: one scene ≈ `--fig-anim` 1.4s, steps of 0.4s (draw object → grow vector → label), ease-out, play once then show Replay (never loop). UI: `--dur-fast` 120ms hover/press, `--dur` 240ms open/close, `--dur-slow` 600ms spring pops (XP, toasts). `prefers-reduced-motion` zeroes durations.
- **Surfaces & cards.** White card, 2px `--line` border, radius 20 (`--radius-lg`); no left-border accent bars. Pressable things carry a flat 3px bottom "edge" (`--edge`, `--edge-brand`) and sink 3px on press. Floating things (bubble, toast) use `--shadow-pop`.
- **States.** Hover: border tints teal-300 + teal-50 fill. Press: translateY(3px), edge removed. Focus: 3px teal-300 outline, 2px offset. Disabled: 45% opacity. Wrong option: amber fill + wobble. Right: green fill + green edge.
- **Radii.** 8 / 14 / 20 / 28 / pill. Everything soft; no sharp corners.
- **Layout.** Single column, `--content-w` 720px, 16px gutters on mobile. Sticky translucent top bar (paper @92% + 10px blur) — the only blur. "Stuck?" button fixed bottom-right; toasts bottom-centre. Hit targets ≥ 44px.
- **Imagery.** Diagrams, not photos. DSE scans shown flat on white inside a FigureFrame.

## ICONOGRAPHY
- **Lucide** (`lucide-static@0.468.0` via unpkg), 2px stroke, round joins — rendered by `Icon` as a CSS mask so it takes `currentColor`. Substitution: the original site used hand-drawn inline SVGs on the home page only; they are replaced by Lucide glyphs.
- Book/chapter glyph map: `assets/icon-map.json` (Book 2 `rocket`, Book 4 `zap`, Book 5 `radiation`, QB `library`, plus one per chapter). Shown on a soft book-tone tile or inside a ProgressRing.
- UI glyphs: quick check `zap`, objectives `target`, stuck `circle-help`, trap `triangle-alert`, replay `rotate-ccw`, streak `flame`, XP `zap`, level `star`.
- No emoji. Unicode only for maths/arrows in copy (`→ × ≥ √`).
- **No logo exists** in the source. The wordmark is type-only: "paper**2**notes" in Fredoka 700, the "2" in teal (or sun on teal).

## Components
Namespace: `window.Paper2NotesDesignSystem_ff940d`.
- core: **Button**, **Icon**, **ProgressRing**
- learning: **QuickCheck**, **LearningObjectives**, **FigureFrame**, **Formula**, **Trap**, **HelpBubble**
- game: **StatPill**, **XPBar**, **AchievementBadge**, **AchievementToast**
- nav: **ChapterCard**, **TopBar**

Mapping from the original site: `.check` + `.quiz-slides` → QuickCheck (DSE decks = QuickCheck with scan figure + A–D options); `.lo-block` → LearningObjectives; `figure.fig`/`.stage` → FigureFrame; `.eq` → Formula; `.tip`/`.trap` → Trap; `.chapter-cards`/`.book-cards` → ChapterCard; `.topbar` → TopBar.

### Intentional additions
Not in the source; added for the brief: StatPill, XPBar, AchievementBadge, AchievementToast (gamification), HelpBubble ("Stuck?" pointer to notes locations), ProgressRing (mastery on cards), Icon (Lucide wrapper).

## Index
- `styles.css` — entry (imports only) → `tokens/colors.css`, `tokens/typography.css`, `tokens/spacing.css`, `components/components.css`
- `components/{core,game,learning,nav}/` — JSX + `.d.ts` + `.prompt.md` + one card each
- `guidelines/*.card.html` — colour, type, spacing, figure and brand specimen cards
- `assets/icon-map.json` — book/chapter/UI glyph map
- `ui_kits/notes-web/` — clickable website: Home, Book, Section (figures + quick checks + XP + Stuck?), Achievements
- `SKILL.md`, `github.md`, `thumbnail.html`
