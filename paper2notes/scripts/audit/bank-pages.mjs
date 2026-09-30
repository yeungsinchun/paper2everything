import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "books.json"), "utf8"));
const banks = config.banks;
const books = config.books;

export function allBanks() { return Object.keys(banks); }
export function bankSpec(bank) {
  const spec = banks[bank];
  if (!spec) throw new Error(`Unknown bank ${bank}`);
  return spec;
}

function chapterDirFor(repoRoot, bank) {
  const spec = bankSpec(bank);
  const root = path.join(repoRoot, "notes", spec.book);
  if (!fs.existsSync(root)) throw new Error(`Missing notes root for ${bank}: ${root}`);
  const chapterDir = fs.readdirSync(root).find(name => name.startsWith(spec.chapter) && fs.statSync(path.join(root, name)).isDirectory());
  if (!chapterDir) throw new Error(`Missing notes chapter for ${bank}: ${spec.book}/${spec.chapter}`);
  return path.join(root, chapterDir);
}

/** Pages of a bank's chapter: section pages (+summary) for sectioned books, the chapter index.html for chapter-index books. */
export function pagesForBank(repoRoot, bank) {
  const spec = bankSpec(bank);
  const dir = chapterDirFor(repoRoot, bank);
  if (books[spec.book]?.layout === "chapter-index") {
    const index = path.join(dir, "index.html");
    if (!fs.existsSync(index)) throw new Error(`Missing chapter page for ${bank}: ${index}`);
    return [index];
  }
  const pages = fs.readdirSync(dir).filter(name => /^(?:\d+-\d+|summary)\.html$/.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(name => path.join(dir, name));
  if (!pages.some(p => path.basename(p) !== "summary.html")) throw new Error(`Missing section pages for ${bank}`);
  return pages;
}

/** Pages an item can be mapped to (no summary). */
export function sectionPagesForBank(repoRoot, bank) {
  return pagesForBank(repoRoot, bank).filter(p => path.basename(p) !== "summary.html");
}

/** Section id used in mappings/results: `25-1` for section pages, `book2/ch02` for chapter-index pages. */
export function sectionIdForPage(bank, page) {
  const spec = bankSpec(bank);
  if (books[spec.book]?.layout === "chapter-index") return `${spec.book}/${spec.chapter}`;
  return path.basename(page, ".html");
}

export function cumulativePagesForBank(repoRoot, bank) {
  const spec = bankSpec(bank);
  const peers = Object.entries(banks).filter(([, value]) => value.book === spec.book && value.chapter <= spec.chapter).sort((a, b) => a[1].chapter.localeCompare(b[1].chapter));
  return peers.flatMap(([peer]) => pagesForBank(repoRoot, peer));
}

/** Match a --page argument (path, `25-1`, `25.1`, `book2/ch02`) against a bank's section pages. */
export function pageMatches(repoRoot, bank, page, arg) {
  const id = sectionIdForPage(bank, page);
  const norm = String(arg).replace(/\.html$/, "");
  if (norm === id || norm.replace(".", "-") === id) return true;
  const abs = path.resolve(arg);
  return abs === page || abs === path.dirname(page);
}

/** Find the bank whose chapter holds the page named for a section (`25.1` or `25-1`). */
export function bankForSection(repoRoot, section) {
  const id = String(section).replace(".", "-");
  for (const bank of allBanks()) {
    let pages;
    try { pages = sectionPagesForBank(repoRoot, bank); } catch { continue; }
    const page = pages.find(p => sectionIdForPage(bank, p) === id);
    if (page) return { bank, page };
  }
  return null;
}
