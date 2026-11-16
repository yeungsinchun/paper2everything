# Anchor ids

Rules are enforced by `scripts/checks/anchor-lint.mjs` (called from `scripts/checks/ci-check.mjs`).

- `ids.lock.json` — ids each page has published. A locked id that disappears fails CI unless renamed via `moves.json`. Refresh with `node paper2notes/scripts/checks/anchor-lint.mjs --write-lock` (additive; never drops ids).
- `moves.json` — `{"moves": [{"page": "book5/ch03-nuclear-energy/27-2.html", "from": "old-id", "to": "new-id"}]}`; `to` must exist on the page (chains are followed).

Always on, for every deployed page: answer-bearing blocks (`.check`, `.def`, `.eq`, `.worked`, `figure.fig`, `table.notes`, `section.idea`, `section.lo-quiz`, `.tf-item`, `[data-answer]`) must carry an id; ids must be unique per page and never positional (`eq-3`, `block7`, `42`) — name the block by what it teaches (`missing-mass-eq-1`).

`paper2db/metadata/pointers/*.json` (when present) are validated as pointer stores, independently of filenames and other files' corpora. Answer pointers use `paper2db.answer-pointer.v1`. `notes.json` uses `paper2db.notes-pointer.v1`, whose format, extraction and target checks are owned by `scripts/publish-notes-passages.py` (see `docs/QUESTION_NOTES.md`).
