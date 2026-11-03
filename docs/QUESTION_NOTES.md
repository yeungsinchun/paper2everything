# Inline explanations from notes

## Intent and actual behavior

Readers open corresponding notes without leaving the question screen.
Each rendered QB card and DSE card has an **Explain with notes** button.
The shared chapter runtime adds the same button to each DSE slide.
The panel shows checked passages and highlights only recorded sentence ranges.
Each passage links to its original, unique notes anchor in a new tab.
A question can reference up to eight passages across different pages or sections.

Desktop QB cards expand across the grid when readers open their panel.
The question and its notes appear beside each other at widths of 900 pixels or more.
Smaller screens keep the notes below the question.
Close and Escape close the panel and restore focus to its button.
The panel exposes its expanded state, region name, and loading status to assistive software.
Print styles hide the interaction and restore the normal QB card layout.
Existing question exports omit these panels.

**This change does not provide explanations for every question.**
The canonical store contains two reviewed question references and three passages.
Every other supported question currently shows an explicit missing state.
An existing anchor alone does not establish conceptual correspondence.
The separate coverage task consumes this producer and owns broader enumeration and audit reports.
This interface does not generate notes, infer mappings, or call a model.

## Sources and inventory

The deployed `/qb/` reads these tracked serving inputs:

- `paper2notes/notes/qb/data/dse_mc.json`: 573 records.
- `paper2notes/notes/qb/data/dse_lq.json`: 170 records.
- `paper2notes/notes/qb/data/qb_book5.json`: 246 records.

The page limits each filtered render to 400 DSE cards and 300 QB cards.
Its initial render contains 646 cards, not the complete source inventory.
These counts describe serving inputs, not verified explanation coverage.
The static chapter decks also consume the shared `notes/js/checks.js` runtime.

The live check used `https://paper2notes-152505675251.asia-east2.run.app/qb/` through `chrome-devtools-axi`.
Its deployed footer reported commit `5e525c`; it had no explanation buttons.
The proposed branch serves locally and has not been deployed.
Local HTML footers retain older source metadata; they do not identify a new deployment.

## One canonical store and one producer

Authored teaching references live only in `paper2db/metadata/pointers/notes.json`.
Their schema is `paper2db/schemas/notes-pointer.v1.json`, identified as `paper2db.notes-pointer.v1`.
The existing answer-pointer schema and its QB/DSE stores remain unchanged.
Answer locations and suggested audit locations do not establish teaching references.

Each question record contains `corpus`, `item_id`, and `passages`.
QB identifiers retain their canonical `PHY...` value.
DSE identifiers use `dse-mc-<year>-<number>` or `dse-lq-<year>-q<number>`.
The UI normalizes older chapter LQ identifiers without the `q`.
Sample years `pp` and `sap` remain supported identities.
Placeholder identifiers receive an explicit unsupported-identity state.

Each passage contains these fields:

- `page`: a relative book HTML path under `paper2notes/notes/`.
- `anchor`: an existing, unique DOM identifier inside `main`.
- `text_sha256`: SHA-256 of normalized plain text encoded as UTF-8.
- `highlights`: ordered, nonoverlapping sentence ranges with exact `quote` values.
- `source`: traceable evidence for conceptual correspondence.
- `tier`: `verified`, `derived`, or `inferred`.

Offsets use zero-based UTF-16 code units with exclusive ends.
Passages have at most 12,000 UTF-16 code units.
Each passage has one to 32 highlights.
The conservative sentence policy accepts complete sentences ending in `.`, `!`, or `?`.
It rejects ambiguous mathematical or quoted boundaries rather than guessing.

`paper2notes/scripts/publish-notes-passages.py` owns extraction and validation.
The coverage task must import this file through Python `importlib`.
The hyphenated filename cannot use a normal Python import statement.

Public producer functions:

- `extract(html: str, anchor: str) -> tuple[str, str]`: normalized text and page title.
- `text_hash(text: str) -> str`: lowercase SHA-256 of UTF-8 text.
- `utf16_slice(text: str, start: int, end: int) -> str`: strict UTF-16 slicing.
- `check_ranges(text: str, highlights: list[dict]) -> None`: validate sentence ranges.
- `validate_store(store: dict) -> None`: validate canonical structure and identities.
- `publish(store: dict, notes_root: pathlib.Path) -> dict`: build the serving projection.

The producer raises `ValueError` for malformed canonical structure.
It converts invalid passage targets into explicit rejected records during publication.
Rejected records retain identity and provenance but omit text and highlight quotes.
Only available, verified passages contain excerpt text.

The existing anchor validator calls the same producer with `--check` for `notes.json`.
It continues to validate other pointer files against the answer-pointer contract.
`--check` writes no projection and rejects stale, missing, or unsafe targets.
It permits structurally valid unverified references without treating them as available explanations.
No second normalizer or authored mapping store exists.

## Extraction and browser checks

Extraction inserts spaces around block elements and collapses ECMAScript whitespace.
It excludes scripts, styles, templates, controls, canvases, SVG, navigation, summaries, and explicitly hidden content.
It also excludes question decks, concept checks, visual labels, and definition tags.
An anchor inside an excluded ancestor cannot supply a passage.
The browser mirrors these rules against an inert parsed document.

The browser fetches the projection and current source with cache bypass and bounded requests.
It checks paths, anchor uniqueness, current text, hashes, provenance, tier, and sentence ranges before rendering.
It renders text nodes and `mark` elements, never source HTML.
An outdated request cannot reopen or replace a closed panel.

Malformed HTML can produce different trees in Python and the browser.
The browser rejects a reference when its extracted text differs from the published text.
Tests cover this conservative rejection, rather than assuming parser equivalence for malformed HTML.

The panel distinguishes missing mappings, unavailable services, stale passages, unsafe references, and unverified references.
A partly valid record can show valid passages alongside warnings for rejected passages.
These states do not assert that the corresponding concept is absent from the notes.

## Serving and local preview

The generated projection is `paper2notes/notes/question-notes/passages.json`.
Its schema identifier is `paper2notes.question-notes.v1`.
Git ignores this output; it is not another authored store.

Generate it before starting a local preview:

```sh
python3 paper2notes/scripts/publish-notes-passages.py
python3 -m http.server --directory paper2notes/notes 8000
```

Validate references without writing serving data:

```sh
python3 paper2notes/scripts/publish-notes-passages.py --check
```

The publisher also accepts `--store`, `--notes-root`, and `--out`.
Use those options for isolated fixtures instead of modifying the canonical store.
Chapter previews also require the existing local DSE crop setup described in project guidance.

The Cloud Run Dockerfile runs the producer in a Python build stage.
The restricted root Docker context admits only the canonical store and producer alongside the existing site inputs.
The final nginx image receives the generated JSON, not the canonical store or Python tooling.
It serves `.mjs` files with an explicit JavaScript MIME type.
Build from the monorepo root:

```sh
docker build -f paper2notes/deploy/cloudrun/Dockerfile .
```

## Reviewed references

These are agent visual reviews of existing published question crops, not human sign-offs or full-question solutions.
The canonical `source` fields record the exact crop SHA-256 values.
The notes hashes independently detect changes to the referenced teaching passages.

### QB PHY15033101

The crop shows a plutonium nucleus producing krypton and xenon nuclei.
Part (a)(ii) asks whether the reaction is fission or fusion.
`book5/ch03-nuclear-energy/27-1.html#fission-def-1` defines fission as a heavy nucleus splitting into lighter nuclei.
The highlighted definition supports that distinction directly.
The surrounding neutron-bombardment sentence supplies relevant context.
This passage does not solve conservation calculations, mass comparison, or power-generation advantages and disadvantages.

Reviewed crop: `paper2notes/notes/qb/crops/qb/PHY15033101.webp`.
SHA-256: `1015506329aa0bbf94a76d2d04c1e3b3c8accbf89d01d353d121efb39efa2c83`.

### DSE MC 2018 Q31

The crop asks which listed nuclear reactions can support a chain reaction.
It contrasts a fusion reaction with neutron-induced uranium and plutonium fission reactions.
`fission-def-1` supplies the fission distinction.
`chain-def-1` explains how neutrons emitted by one fission trigger subsequent fissions.
Both anchors exist in the same 27.1 page, in different teaching sections.
The two highlighted sentences explain the relevant mechanism without importing an answer crop.
They do not claim to replace the complete question or official marking scheme.

Reviewed crop: `paper2notes/notes/qb/crops/dse-mc/2018_q31.webp`.
SHA-256: `87c179ddabbac237febd2a0483cd7fc99b1bb6b19fd9f12eb3c0aa0ac2f5725c`.

## Behavioral tests and limitations

Run producer, browser-independent consumer, and validator integration tests:

```sh
python3 -m unittest discover -s paper2notes/scripts -p 'test_publish_notes_passages.py' -v
node --test paper2notes/scripts/question-notes.test.mjs paper2notes/scripts/question-notes-lint.test.mjs
```

Serve the repository root to run the browser tests through `chrome-devtools-axi`:

```sh
python3 paper2notes/scripts/publish-notes-passages.py
python3 -m http.server 8768 --bind 127.0.0.1
chrome-devtools-axi open http://127.0.0.1:8768/paper2notes/notes/qb/
chrome-devtools-axi eval 'async () => (await import("/paper2notes/scripts/question-notes.browser.mjs")).run()'
chrome-devtools-axi open http://127.0.0.1:8768/paper2notes/notes/book5/ch03-nuclear-energy/27-1.html
chrome-devtools-axi eval 'async () => (await import("/paper2notes/scripts/question-notes-chapter.browser.mjs")).run()'
```

The QB browser test uses the real serving projection for positive cases.
It substitutes page-local fetch responses only for negative and injection tests.
The chapter test checks grading, navigation, focus, export behavior, and print-rule parsing.
These tests are not a full-corpus correspondence audit or a screen-reader certification.
They do not verify physical printer output.

The task captured before/after evidence at 1280×800 and 390×844 through `chrome-devtools-axi`.
The disposable review board and captures remain under `.lavish/question-notes/`.
Attach captures to the pull request; do not commit them or link local paths in its body.

The local Docker command could not connect to `unix:///Users/sinchunyeung/.docker/run/docker.sock`.
The task did not start or change the shared Docker service.
The dedicated `question-notes` workflow builds the actual image and checks its generated JSON and module MIME type.
An added workflow is not evidence that its remote run passed.

Repository-wide checks preserve unrelated baseline failures from main commit `5e525c46`.
`ci-check.mjs` reports 254 existing findings about shared assets and other content.
`quiz-audit.mjs` reports two existing answer-key disagreements in Book 1.
Both outputs match the corrected baseline snapshot byte for byte.
The baseline snapshot uses main's original pointer files, not a link to this branch's teaching-reference store.
