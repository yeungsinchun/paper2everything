# Book layout sources

## Source and output

The compiler uses Node.js built-ins only.
It reads `book.html`, `books.json`, and `pages/book*/**/*.html`.
It writes the same routes under `../notes/`.
The output contains complete HTML and works without JavaScript for navigation and notes.
The compiler never inserts or hides navigation at browser runtime.

Each page starts with JSON metadata inside a `page` comment.
The metadata names its title and page type.
The remaining comments delimit four raw HTML slots:

- `head`: book accents, optional chapter styles, KaTeX styles, and page-specific styles.
- `content`: the unchanged contents of the main page, including lesson-local subsections and idea links.
- `scripts`: scripts after the main page, in their original order.
- `trailing`: existing comments after the document.

The shared template supplies the document structure and primary navigation.
`books.json` supplies book labels and icons.
The compiler calculates relative links from the output route.
The compiler maps page types to the existing classes for overviews, complete chapters, maps, sections, and summaries.
A page cannot supply its own header or secondary chapter row.
No book has a switch for secondary navigation.

Book 6 and Book 9 keep their own `notes.css` and `p2n.css` design sheets, which their `head` slots load.
Every other book loads the shared `notes/css/notes.css` and its own `book.css`.
The compiler preserves the existing deployment footer value when rebuilding a generated file.
The shared template owns its markup and position outside the main page.

## Inventory of generation and publication paths

| Path | Existing role | Integration |
| --- | --- | --- |
| `notes/book*/**/*.html` | Static student pages, previously authored with copied shells | Generated output for every published book route |
| `scripts/build-books.mjs` | New authoritative compiler | Reads one layout and explicit page slots |
| `scripts/ci-check.mjs` | Links, shared assets, anchors, protected text, publication checks | Adds output freshness and layout regression tests |
| `deploy/cloudrun/deploy.sh` | Footer injection, Docker build, Cloud Run publication | Compiles book sources before footer injection |
| `deploy/cloudrun/Dockerfile` | Static nginx image with footer fallback and DSE aliases | Compiles sources in a Node stage, then copies static output |
| `.github/workflows/deploy-notes.yml` | Main-branch publication | Also triggers for layout sources and compiler changes |
| `scripts/inject-commit-footer.mjs` | Deployment metadata | Keeps ownership of footer values after compilation |
| `scripts/sync-dse.sh` | Mirrors question assets into local-only paths | Does not generate book HTML; unchanged |
| `paper2db/pipeline` and staging scripts | Questions, crops, keys, and section data | Do not generate book HTML; unchanged |
| `scripts/brief.mjs` and `scripts/audit/` | Read notes and generate separate audit artifacts | Continue reading generated routes; unchanged |
| `notes/_source/` | Ignored intake material | Not a source for the public document shell |
| `notes/_source/book1-dse/build_snapshot.py` | Generates question crops, PDFs, and legacy Book 1 key data | Does not generate book HTML; unchanged and not run |
| `notes/index.html`, `notes/qb/`, `notes/mock/`, `notes/dse/` | Non-book landing pages and question applications | Outside the book layout contract; unchanged |

The tracked intake script produces question assets and legacy key data, not document shells.
No tracked script generated the old book document shells.
The compiler therefore replaces the hand-authored source layer rather than adding a browser-time workaround.
The nginx deployment still serves static files at unchanged addresses.

## Coverage

| Book | Overview | Complete chapter | Chapter map | Section | Summary | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1 | 0 | 4 | 14 | 4 | 23 |
| 2 | 1 | 10 | 0 | 0 | 0 | 11 |
| 3 | 1 | 0 | 7 | 26 | 7 | 41 |
| 4 | 1 | 0 | 8 | 15 | 8 | 32 |
| 5 | 1 | 0 | 3 | 8 | 3 | 15 |
| 6 | 1 | 0 | 4 | 12 | 4 | 21 |
| 7 | 1 | 0 | 3 | 9 | 3 | 16 |
| 8 | 1 | 0 | 4 | 10 | 4 | 19 |
| 9 | 1 | 0 | 3 | 10 | 3 | 17 |
| **Total** | **9** | **10** | **36** | **104** | **36** | **195** |

The regression tests resolve every stylesheet and script in the generated routes, so a page that points at a missing asset fails.
They also check that every page with an export button loads the shared `js/checks.js`.
They rebuild Book 6 and Book 9 lesson pages with their own design sheets and check every stylesheet resolves.
They verify source/output parity and one template edit reaching every route.
They compare lesson bytes, script bytes, anchor IDs, and lesson links against the migration contract.
The byte comparisons ignore only empty-line whitespace and whitespace at slot boundaries.
Book 2 keeps its existing complete chapter structure.
Lesson-local subsections remain inside the `content` slot; they are not separate routes.

Browser review uses one representative for every existing book/page-type pair.
That means 34 representative routes, each captured before and after at 1280×800 and 390×844.
This visual sample does not prove complete visual or interaction coverage.
The route-level tests cover all 195 published book routes.

## Existing validation exceptions

The merged stack deleted the Book 6 and Book 9 copies of shared assets but left 13 pages pointing at them.
This migration repoints those pages at `../../js/checks.js`, `../../js/math.js`, and `../../vendor/katex/…`.
Only the `head` and `scripts` slots change; lesson content is untouched.
These 13 routes therefore differ from the merged stack output, and the migration contract records their new script hashes, links, and stylesheets.
The merged stack also deleted the Book 6 and Book 9 design sheets whose figure and stage rules those pages used.
This migration restores `notes/book6/css/{notes,p2n}.css` and `notes/book9/css/{notes,p2n}.css` and points those pages at them.
Those pages load `p2n-shell.css`, the book `notes.css`, the book `p2n.css`, and the shared KaTeX where the page has maths.
The four sheets are a deliberate exception to the shared-asset rule; `ci-check.mjs` allows them by exact path.
The Book 6 and Book 9 `book.css` files are gone because those pages no longer load them.
The site check reports one problem: the copied `js/checks.js` that Book 1 keeps and `notes/_source/book1-dse/build_snapshot.py` reads.
The quiz audit reports no page problems and two disagreements between Book 1 quiz keys and the answer store.
The pull request records the exact validation results and browser coverage separately.
Browser comparison also finds existing mobile autoscaling on Book 5's first chapter summary.
Its layout viewport becomes 442×957 CSS pixels on the 390×844 device viewport, before and after this change.
The PNG captures still contain exactly 390×844 pixels.
The browser checks compare behavior at both widths and find no changed behavior.
The browser checks also fetch and parse all 195 routes without navigation or anchor failures.
Export checks intercept the print call and apply existing print CSS rules.
They do not test PDF pagination or every assistive-technology workflow.
Do not describe the existing site and quiz checks as passing.
