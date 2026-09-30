/**
 * pointers.mjs — pointer_candidates for non-passing results: where in the
 * notes a missing concept could be taught. Anchors come only from DOM ids
 * (`<section class="idea" id="...">`) of real pages, never from headings.
 */
import fs from "node:fs";
import path from "node:path";
import { sectionIdForPage } from "./bank-pages.mjs";

const STOP = new Set("the a an of and or to in is are for on with by as at from that this it be can how what which when why use using".split(" "));
const tokens = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter(t => t.length > 2 && !STOP.has(t));
const plain = s => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export function ideaAnchors(html) {
  const out = [];
  const re = /<section\s+class="idea"[^>]*?\bid="([^"]+)"[^>]*>([\s\S]*?)<\/section>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const heading = (m[2].match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1];
    out.push({ anchor: m[1], heading: heading ? plain(heading) : m[1], text: plain(m[2]).slice(0, 6000) });
  }
  return out;
}

/** All DOM ids of a page (for verifying anchors). */
export function domIds(html) {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
}

/**
 * @param {object} p
 * @param {string} p.bank @param {string[]} p.sectionPages pages of the bank's chapter
 * @param {object|null} p.mapped mapping entry {section, secondary, confidence}
 * @param {string[]} p.concepts missing-concept sentences from solver/judge
 */
export function pointerCandidates({ repoRoot, bank, sectionPages, mapped, concepts, limit = 5 }) {
  const primary = mapped?.section;
  const secondary = new Set(mapped?.secondary || []);
  const conceptTokens = new Set(concepts.flatMap(tokens));
  const cands = [];
  for (const page of sectionPages) {
    const section = sectionIdForPage(bank, page);
    const rank = section === primary ? "primary" : secondary.has(section) ? "secondary" : "chapter";
    const rel = path.relative(repoRoot, page);
    for (const idea of ideaAnchors(fs.readFileSync(page, "utf8"))) {
      const headTokens = new Set(tokens(idea.heading));
      const bodyTokens = new Set(tokens(idea.text));
      let score = 0;
      for (const t of conceptTokens) score += (headTokens.has(t) ? 2 : 0) + (bodyTokens.has(t) ? 1 : 0);
      cands.push({ page: rel, section, anchor: idea.anchor, heading: idea.heading, rank, score });
    }
  }
  const rankWeight = { primary: 2, secondary: 1, chapter: 0 };
  cands.sort((a, b) => (b.score + rankWeight[b.rank]) - (a.score + rankWeight[a.rank]) || rankWeight[b.rank] - rankWeight[a.rank]);
  return cands.filter(c => c.score > 0 || c.rank !== "chapter").slice(0, limit);
}
