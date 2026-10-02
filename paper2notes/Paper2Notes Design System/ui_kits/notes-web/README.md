# Notes website UI kit
Clickable revamp of paper2notes (`paper2notes/notes/` in yeungsinchun/paper2everything).
- `index.html` — app shell, state (XP, streak, toast), routing; tap stats in the top bar → Achievements.
- `Screens.jsx` — Home (continue card, stats, 4 book cards), Book (chapter list), Achievements.
- `SectionScreen.jsx` — a section page: objectives → figure → trap → figure → formula → quick-check set → "Stuck?".
- `Figures.jsx` — demo SVGs drawn to the figure guideline.
DSE MC/LQ decks are omitted (real scans live in the repo's `notes/dse/`); render them as QuickCheck with the scan as `figure` and A–D options.
