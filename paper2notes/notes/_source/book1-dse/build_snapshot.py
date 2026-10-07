#!/usr/bin/env python3
"""Build the published Book 1 DSE snapshot from tracked paper2db staging data.

Inputs (all tracked):
  paper2db/qb-web-ui-staging/dse-mc/index.json + crops/<year>/qNN.png   (MC crops, keys)
  paper2db/qb-web-ui-staging/dse-lq/index.json + sections/NN_*/YYYY-qN.png (LQ pages)
  paper2notes/notes/_source/book1-dse/decks.json  (which item sits on which page, and the
                                                  syllabus outcomes it tests)

Outputs:
  paper2notes/notes/dse/mc/0N/<year>_q<N>.png, combined.pdf, N.k.pdf    (sections 1-4)
  paper2notes/notes/dse/lq/0N/<year>-q<N>.png, combined.pdf, N.k.pdf
  the QUIZ_KEYS and PAPER_LOS lines of paper2notes/notes/book1/js/checks.js

combined.pdf holds every item classified to the section (the whole-chapter bank);
N.k.pdf holds the items shown on page N.k. LQ pages are scaled to 1400 px wide and
palette-compressed so the snapshot stays small; they remain readable at A4.

Run from anywhere:  python3 -I paper2notes/notes/_source/book1-dse/build_snapshot.py
Needs Pillow and PyMuPDF (both in paper2db/requirements.txt).
"""
import io
import json
import re
import sys
from pathlib import Path

import pymupdf
from PIL import Image

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
STAGING = REPO / "paper2db" / "qb-web-ui-staging"
NOTES = REPO / "paper2notes" / "notes"
DSE = NOTES / "dse"
CHECKS = NOTES / "book1" / "js" / "checks.js"
SECTIONS = {1: "Temperature and Heat Transfer", 2: "Heat Capacity", 3: "Change of State", 4: "Gas Law and Kinetic Theory"}
LQ_WIDTH = 1400
A4 = pymupdf.paper_rect("a4")
MARGIN = 40


def year_key(year):
    return (0, year) if year.isdigit() else (1, year)


def mc_name(year, q):
    return f"{year}_q{q}.png"


def lq_name(year, q):
    return f"{year}-q{q}.png"


def load():
    decks = json.loads((HERE / "decks.json").read_text())
    mc = {f"{it['year']}-{it['question']}": it for it in json.loads((STAGING / "dse-mc" / "index.json").read_text())}
    lq_rows = json.loads((STAGING / "dse-lq" / "index.json").read_text())
    lq_rows = lq_rows["items"] if isinstance(lq_rows, dict) else lq_rows
    lq = {it["id"].replace("-q", "-"): it for it in lq_rows}
    return decks, mc, lq


def lq_source(item):
    sec = item["primary_section"]
    folder = next((STAGING / "dse-lq" / "sections").glob(f"{sec:02d}_*"))
    path = folder / f"{item['year']}-q{item['question']}.png"
    if not path.exists():
        path = STAGING / "dse-lq" / "crops" / f"{item['year']}-q{item['question']}.png"
    return path


def compress_lq(src, dst):
    im = Image.open(src).convert("RGB")
    if im.width > LQ_WIDTH:
        im = im.resize((LQ_WIDTH, round(im.height * LQ_WIDTH / im.width)), Image.LANCZOS)
    im = im.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, optimize=True)


def pdf_from_images(title, entries, out):
    """entries: [(label, PIL image)] stacked down A4 pages; tall images are sliced."""
    doc = pymupdf.open()
    page = None
    y = 0
    width = A4.width - 2 * MARGIN

    def new_page():
        nonlocal page, y
        page = doc.new_page(width=A4.width, height=A4.height)
        page.insert_text((MARGIN, MARGIN), title, fontsize=11, fontname="helv")
        y = MARGIN + 16

    new_page()
    for label, im in entries:
        im = im.convert("L")  # past-paper scans are black and white
        slice_h = round(im.width * 1.36)
        top = 0
        part = 0
        while top < im.height:
            piece = im.crop((0, top, im.width, min(im.height, top + slice_h)))
            h = piece.height * width / piece.width
            if y + 14 + h > A4.height - MARGIN:
                if y > MARGIN + 16:
                    new_page()
                if h > A4.height - MARGIN - y - 14:
                    h = A4.height - MARGIN - y - 14
            page.insert_text((MARGIN, y + 10), label + (f" (page {part + 1})" if im.height > slice_h else ""), fontsize=9, fontname="helv")
            buf = io.BytesIO()
            piece.save(buf, format="JPEG", quality=72)
            w = h * piece.width / piece.height
            page.insert_image(pymupdf.Rect(MARGIN, y + 14, MARGIN + w, y + 14 + h), stream=buf.getvalue())
            y += 14 + h + 12
            top += slice_h
            part += 1
    out.parent.mkdir(parents=True, exist_ok=True)
    doc.save(out, garbage=4, deflate=True)


def main():
    decks, mc, lq = load()
    keys = {}
    los = {}
    for sec in range(1, 5):
        for kind in ("mc", "lq"):
            d = DSE / kind / f"{sec:02d}"
            if d.exists():
                for f in d.iterdir():
                    f.unlink()

    # Whole-section banks: every item classified to the section.
    for sec in range(1, 5):
        mc_items = sorted((it for it in mc.values() if sec in it["sections"] and not it["answer"].get("deleted")),
                          key=lambda it: (year_key(str(it["year"])), it["question"]))
        entries = []
        for it in mc_items:
            src = STAGING / "dse-mc" / it["image"]["png"]
            dst = DSE / "mc" / f"{it['sections'][0]:02d}" / mc_name(it["year"], it["question"])
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(src.read_bytes())
            entries.append((f"{str(it['year']).upper()} Q{it['question']}", Image.open(src)))
        pdf_from_images(f"Book 1 section {sec} {SECTIONS[sec]}: DSE multiple choice", entries, DSE / "mc" / f"{sec:02d}" / "combined.pdf")

        lq_items = sorted((it for it in lq.values() if sec in it["all_sections"]),
                          key=lambda it: (year_key(str(it["year"])), it["question"]))
        entries = []
        for it in lq_items:
            dst = DSE / "lq" / f"{it['primary_section']:02d}" / lq_name(it["year"], it["question"])
            if not dst.exists():
                compress_lq(lq_source(it), dst)
            entries.append((f"{str(it['year']).upper()} Q{it['question']}", Image.open(dst)))
        if entries:
            pdf_from_images(f"Book 1 section {sec} {SECTIONS[sec]}: DSE long questions", entries, DSE / "lq" / f"{sec:02d}" / "combined.pdf")

    # Per-page decks, keys and outcome labels.
    for page, deck in decks["pages"].items():
        sec = int(page.split(".")[0])
        for kind in ("mc", "lq"):
            entries = []
            for ref in deck.get(kind, []):
                pid = ref["id"]
                slide = f"dse-{kind}-{pid}"
                los[slide] = ref["los"]
                if kind == "mc":
                    it = mc[pid]
                    if it["answer"].get("option"):
                        keys[slide] = {"option": it["answer"]["option"]}
                        if it["answer"].get("percentage") is not None:
                            keys[slide]["pct"] = it["answer"]["percentage"]
                    path = DSE / "mc" / f"{it['sections'][0]:02d}" / mc_name(it["year"], it["question"])
                else:
                    it = lq[pid]
                    path = DSE / "lq" / f"{it['primary_section']:02d}" / lq_name(it["year"], it["question"])
                if not path.exists():
                    sys.exit(f"missing crop for {slide}: {path}")
                entries.append((f"{str(it['year']).upper()} Q{it['question']}", Image.open(path)))
            if entries:
                pdf_from_images(f"Book 1 section {page}: DSE {'multiple choice' if kind == 'mc' else 'long questions'}",
                                entries, DSE / kind / f"{sec:02d}" / f"{page}.pdf")

    js = CHECKS.read_text()
    js, n1 = re.subn(r"^  var PAPER_LOS = .*;$", "  var PAPER_LOS = " + json.dumps(los, ensure_ascii=False, separators=(",", ":")) + ";", js, flags=re.M)
    js, n2 = re.subn(r"^  var QUIZ_KEYS = .*;$", "  var QUIZ_KEYS = " + json.dumps(keys, separators=(",", ":")) + ";", js, flags=re.M)
    if n1 != 1 or n2 != 1:
        sys.exit("checks.js: PAPER_LOS / QUIZ_KEYS lines not found exactly once")
    CHECKS.write_text(js)
    print(f"slides: {len(los)}  keyed MC: {len(keys)}")


if __name__ == "__main__":
    main()
