# Book layout sources

## Source and output

The compiler uses Node.js built-ins only.
It reads `book.html`, `components/*.html`, `books.json`, and `pages/book*/**/*.html`.
It writes the same routes under `../notes/`.
It does not write `book.html`, component files, or page sources.
The output contains complete HTML and works without JavaScript for navigation and notes.
The compiler never inserts or hides navigation at browser runtime.
The compiler inserts the generated-file notice only into generated pages.

Each page starts with JSON metadata inside a `page` comment.
The metadata names its title and page type.
The remaining comments delimit four raw HTML slots:

- `head`: book accents, optional chapter styles, KaTeX styles, and page-specific styles.
- `content`: the unchanged contents of the main page, including lesson-local subsections and idea links.
- `scripts`: scripts after the main page, in their original order.
- `trailing`: existing comments after the document.

## Editable components

Each editable file starts with `<!-- source: <name>. Edit this file. The compiler does not generate this file. -->`.
`book.html` arranges the document. Edit it to move a component or a page slot.
The compiler requires exactly these six component files and rejects any other file in `components/`.
The arrangement must start with `<!DOCTYPE html>`, and every editable file must end with a newline.
Edit a component file to change that component's markup.
Edit `pages/` to change one page's title, type, or slots.
Edit `books.json` to change a book label or icon.
Do not edit generated pages under `notes/book*/`.

| Component | File | What a contributor edits |
| --- | --- | --- |
| Arrangement | `layout/book.html` | Document order: head, header, main, scripts slot, footer, trailing slot |
| Head | `layout/components/head.html` | Charset, viewport, title element, and the page `head` slot position |
| Header | `layout/components/header.html` | Header landmark and the order of brand and navigation |
| Brand | `layout/components/brand.html` | Book home link, icon, and label markup |
| Navigation | `layout/components/navigation.html` | Primary navigation element. The link list is a resolved value |
| Main | `layout/components/main.html` | Main landmark and the page `content` slot position |
| Footer | `layout/components/footer.html` | Deployment footer markup and its position in the body |

Page files identify themselves with the opening `<!-- page` metadata block.
That block is source metadata, not a generated-file notice.

## Placeholder resolution

The compiler resolves component placeholders before value placeholders.
It walks `{{component:name}}` from left to right, then into each component.
A missing name, a cycle, or a placeholder that is not a lowercase component name is an error.
It then replaces `{{name}}` values in the composed page.
It does not scan lesson text, so braces in a lesson stay literal.

| Placeholder | Resolved value | Edit location |
| --- | --- | --- |
| `{{component:head}}` | `components/head.html` | That component file |
| `{{component:header}}` | `components/header.html` | That component file |
| `{{component:brand}}` | `components/brand.html` | That component file |
| `{{component:navigation}}` | `components/navigation.html` | That component file |
| `{{component:main}}` | `components/main.html` | That component file |
| `{{component:footer}}` | `components/footer.html` | That component file |
| `{{title}}` | Escaped page title | Page metadata in `layout/pages/` |
| `{{head}}` | Page head slot | The same page file. This is not the head component |
| `{{content}}` | Page content slot | The same page file |
| `{{scripts}}` | Page scripts slot | The same page file |
| `{{trailing}}` | Page trailing slot | The same page file |
| `{{book}}` | Book id from the route | The route path |
| `{{label}}` | Escaped book label | `layout/books.json` |
| `{{icon}}` | Escaped book icon name | `layout/books.json` |
| `{{home}}` | Relative link to the book index | Computed from the route |
| `{{root}}` | Relative prefix to the notes root | Computed from the route |
| `{{navigation}}` | Ancestor trail, Books menu, and Question bank access | Compiler derives ancestors from real routes. `books.json` supplies menu labels |
| `{{mainClass}}` | Class for the page type | Page type in page metadata. Class strings live in `scripts/build-books.mjs` |
| `{{deployCommit}}` | Preserved footer commit, or `local` | Deployment footer injection, not lesson sources |
| `{{deploySubject}}` | Preserved footer subject markup, or empty | Deployment footer injection, not lesson sources |

`books.json` supplies book labels and icons.
The compiler calculates relative links from the output route.
The compiler maps page types to the existing classes for overviews, complete chapters, maps, sections, and summaries.
A page cannot supply its own header or secondary chapter row.
No book has a switch for secondary navigation.

The top bar shows an inline chevron trail in place of the flat book links.
The current page is bold text, not a link.
Ancestors link to the landing page, book index, and chapter index as applicable.
Complete chapters, including Book 2 chapters, end at the chapter level.
Sections and summaries are leaves.
The Books menu keeps every book and Question bank reachable.
Question bank also has a direct link above 760px.
At 560px and below, the trail shows its first and last segments.
A native ellipsis disclosure keeps the hidden ancestors reachable without JavaScript.

Book 5 Chapter 1 keeps its book-local section numbers, 1.1–1.3, in kickers, map cards, and chain links.
The trail leaf repeats the section number each page's kicker displays, so it matches the section card a reader clicked.
Route filenames stay unchanged.

Book 6 and Book 9 keep their own `notes.css` and `p2n.css` design sheets, which their `head` slots load.
Every other book loads the shared `notes/css/notes.css`; every one of them except Book 3 also loads its own `book.css`.
The compiler preserves the existing deployment footer value when rebuilding a generated file.
The arrangement and component files own shared markup outside the main page.

## Inventory of generation and publication paths

| Path | Existing role | Integration |
| --- | --- | --- |
| `notes/book*/**/*.html` | Static student pages, previously authored with copied shells | Generated output for every published book route |
| `scripts/build-books.mjs` | New authoritative compiler | Reads the arrangement, shared components, and explicit page slots |
| `scripts/checks/ci-check.mjs` | Links, shared assets, anchors, protected text, publication checks | Adds output freshness and layout regression tests |
| `deploy/cloudrun/deploy.sh` | Footer injection, Docker build, Cloud Run publication | Compiles book sources before footer injection |
| `deploy/cloudrun/Dockerfile` | Static nginx image with footer fallback and DSE aliases | Compiles sources in a Node stage, then copies static output |
| `.github/workflows/deploy-notes.yml` | Main-branch publication | Also triggers for layout sources and compiler changes |
| `scripts/build/inject-commit-footer.mjs` | Deployment metadata | Keeps ownership of footer values after compilation |
| `scripts/build/sync-dse.sh` | Mirrors question assets into local-only paths | Does not generate book HTML; unchanged |
| `paper2db/pipeline` and staging scripts | Questions, crops, keys, and section data | Do not generate book HTML; unchanged |
| `scripts/audit/` | Reads notes and generates separate audit artifacts | Continues reading generated routes; unchanged |
| `notes/_source/` | Ignored intake material | Not a source for the public document shell |
| `notes/_source/book1-dse/build_snapshot.py` | Generates question crops, PDFs, and legacy Book 1 key data | Does not generate book HTML; unchanged and not run |
| `notes/index.html`, `notes/qb/`, `notes/dse/` | Non-book landing pages and question applications | Outside the book layout contract; unchanged |

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
They enumerate actual routes rather than relying on this table.
They verify source/output parity and one component edit reaching every route.
They compare lesson bytes, script bytes, anchor IDs, and lesson links against the migration contract.
The byte comparisons ignore only empty-line whitespace and whitespace at slot boundaries.
Book 2 keeps its existing complete chapter structure.
Lesson-local subsections remain inside the `content` slot; they are not separate routes.

Browser review uses one representative for every existing book/page-type pair.
That means 34 representative routes, each captured before and after at 1280×800 and 390×844.
This visual sample does not prove complete visual or interaction coverage.
The route-level tests cover all 195 published book routes.

## Work this branch leaves out

This branch changes the book layout only, so five pieces of related work stay out:

- Audit-gap brief work. It produces audit artifacts, so it is not layout work.
- Mock exams. They are separate content, not layout work.
- Answer corrections. They change question data, not the page layout.
- Question-bank harness changes. The question bank sits outside the book layout, so this branch leaves it alone.
- Generated question crops. They are pipeline output that the layout does not read.

That work lives on the separate open pull request https://github.com/yeungsinchun/paper2everything/pull/108.
This branch does not import it and does not change that pull request.

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
The two book `p2n.css` sheets also carry the shared `details.worked` summary and `worked-body` rules, because the migrated lesson markup uses that disclosure.
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
