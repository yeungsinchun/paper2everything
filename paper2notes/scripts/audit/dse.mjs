/**
 * dse.mjs — DSE loader. Turns the in-page past-paper decks (section.section-dse)
 * of a notes page into audit items. The decks are stripped from the notes
 * bundle (bundle.mjs), so the audit asks whether the section's teaching alone
 * solves each deck question.
 *
 * Images resolve next to the page (`../_local/dse/...`), falling back to the
 * tracked production snapshot `notes/dse/...`.
 */
import fs from "node:fs";
import path from "node:path";
import { bankForSection, sectionPagesForBank, sectionIdForPage, allBanks } from "./bank-pages.mjs";

const DECK_RE = /<section\s+class="section-dse[^"]*"([^>]*)>([\s\S]*?)<\/section>/gi;

export function dseBankName(sectionId) { return `DSE_${sectionId}`; }
export function isDseBank(bank) { return /^DSE_/.test(bank); }

function resolveDseImage(repoRoot, pageDir, src) {
  const direct = path.resolve(pageDir, src);
  if (fs.existsSync(direct)) return direct;
  const m = src.match(/_local\/dse\/(.+)$/);
  if (m) {
    const snap = path.join(repoRoot, "notes/dse", m[1]);
    if (fs.existsSync(snap)) return snap;
  }
  return null;
}

/** Parse the decks of one page. Returns { items, missing }. */
export function dseItemsForPage(repoRoot, bank, page) {
  const html = fs.readFileSync(page, "utf8");
  const section = sectionIdForPage(bank, page);
  const dseBank = dseBankName(section);
  const items = [];
  const missing = [];
  let deck;
  DECK_RE.lastIndex = 0;
  while ((deck = DECK_RE.exec(html)) !== null) {
    const kind = (deck[1].match(/data-quiz="([^"]+)"/) || [])[1] || "mc";
    const slideRe = /<article\s+class="quiz-slide[^"]*"[^>]*?id="([^"]+)"[^>]*>([\s\S]*?)<\/article>/gi;
    let s;
    while ((s = slideRe.exec(deck[2])) !== null) {
      const slide = s[1];
      const src = (s[2].match(/<img[^>]*src="([^"]+)"/i) || [])[1];
      const caption = ((s[2].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i) || [])[1] || "").replace(/<[^>]+>/g, "").trim();
      const image = src ? resolveDseImage(repoRoot, path.dirname(page), src) : null;
      if (!image) { missing.push({ slide, src: src || null }); continue; }
      items.push({
        id: `${dseBank}:${slide.replace(/^dse-/, "")}`,
        bank: dseBank,
        parent_bank: bank,
        type: kind === "lq" ? "lq" : "mc",
        marks: kind === "lq" ? null : 1,
        part: "core",
        stem: { text: "" },
        images: { stem: [image], answer: [] },
        dse: { section, kind, slide, caption, page: path.relative(repoRoot, page) },
      });
    }
  }
  return { items, missing };
}

/** Load the DSE deck items for a section (`25.1`), or every section with `all`. */
export function loadDseSection(repoRoot, section) {
  const targets = [];
  if (section === "all") {
    for (const bank of allBanks()) {
      let pages;
      try { pages = sectionPagesForBank(repoRoot, bank); } catch { continue; }
      for (const page of pages) targets.push({ bank, page });
    }
  } else {
    const hit = bankForSection(repoRoot, section);
    if (!hit) throw new Error(`No notes page for DSE section ${section}`);
    targets.push(hit);
  }
  const out = [];
  for (const { bank, page } of targets) {
    const { items, missing } = dseItemsForPage(repoRoot, bank, page);
    if (!items.length && !missing.length) continue;
    out.push({ bank: dseBankName(sectionIdForPage(bank, page)), parent_bank: bank, page, items, missing });
  }
  return out;
}
