The one quick-check format for the whole site: a short prompt, optional figure, big tappable options; wrong answers wobble amber (never red) and you retry; right answers show a one-line why and +XP.

```jsx
<QuickCheck prompt="Which arrow is the displacement?"
  options={[{ label: "A" }, { label: "B" }, { label: "C" }]}
  answer={1} why="Start → end, straight line." xp={10} />
<QuickCheck kind="tf" prompt="Distance can be negative." answer={1} why="Distance is a scalar ≥ 0." />
```

- Prompt ≤ 12 words. Prefer figure options over text.
- XP: 10 first try, −4 per retry, min 2.
- DSE MC decks reuse it: `figure={<img src=scan>}`, options A–D.
