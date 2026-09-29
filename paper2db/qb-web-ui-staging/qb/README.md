# QB staging for /qb UI

Generated from QB DOCX corpus via qb_convert + qb_items.

Source: $P2DB_QB_ROOT=/Users/sinchunyeung/github/paper2everything/new_qb (169 DOCX, 46 banks, 3847 items) — falls back to paper2db/qb if env not set (see paper2db/scripts/qb_items.py:find_qb_root).

Outputs staged here:
- items/<bank>.json — per-bank items with stem text, options, subparts, answer (status/key/worked/marking), images paths, warnings (data-problem flags), sources
- items/index.json — flat index id->bank/type/level/marks/status/has_crop
- crops/*.png — per-item stem and answer crops (optimized PNG palette, 256 colors, ~50% smaller than raw 2x PNG; each bank ~7-8MB as in QB_503 reference)
- manifest.json — per-bank file counts and MB, warnings summary, tool versions

Data-problem flags (surface visibly in UI):
- warnings array: variant_conflict, equation_heavy, crop_multi_page, anchor not found, etc.
- images.stem empty => has_crop false
- answer.status: present | from-pdf | missing

Never commit .docx or full PDFs — only crops and metadata. Verified via git diff file types.

Size: see manifest.json per-bank MB. Each bank ~5-12 MB optimized (QB_503 3-4 MB for stem+ans after palette vs 7.48 raw; total staged ~200-250 MB vs 560 MB raw).
