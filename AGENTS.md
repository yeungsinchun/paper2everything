# AGENTS
- `paper2notes/notes/` -> visual-html-notes skill (three.js via js/diagrams3d.js, checks via js/checks.js, KaTeX). Open chapter `index.html` in browser, no build. Intake is `notes/_source/<book-ch>/` (ocr.md/outline.md/problems.md/images/INDEX.md).
- `paper2db/` -> pipeline (./pipeline). Source PDFs in `paper/{mc,lq,ans}/`, output in `classified/` and `output/`.
- `paper2mock/` -> LaTeX mocks `f1/test1/<1..10>/`.

Keep `notes/_local/` and `paper2db/{qb,q b-pdf,output,classified,.lavish}` out of git. CI is `node paper2notes/scripts/ci-check.mjs` (extended for book2). Deploy is `paper2notes/deploy/cloudrun`.
