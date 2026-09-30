# Anchor ids

Rules are enforced by `scripts/anchor-lint.mjs` (called from `scripts/ci-check.mjs`).

- `config.json` — `enforce`: `notes/`-relative page or directory prefixes whose answer-bearing blocks (`.check`, `.def`, `.eq`, `.worked`, `figure.fig`, `table.notes`, `section.idea`, `section.lo-quiz`, `.tf-item`, `[data-answer]`) must carry an id. Add a book here once its ids are in place.
- `ids.lock.json` — ids each page has published. A locked id that disappears fails CI unless renamed via `moves.json`. Refresh with `node paper2notes/scripts/anchor-lint.mjs --write-lock` (additive; never drops ids).
- `moves.json` — `{"moves": [{"page": "book5/ch03-nuclear-energy/27-2.html", "from": "old-id", "to": "new-id"}]}`; `to` must exist on the page (chains are followed).

Always on, for every deployed page: ids unique per page, and never positional (`eq-3`, `block7`, `42`) — name the block by what it teaches (`missing-mass-eq-1`).

`paper2db/metadata/pointers/*.json` (when present) are validated against `paper2db.answer-pointer.v1`.
