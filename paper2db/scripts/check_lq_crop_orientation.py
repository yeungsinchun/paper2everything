#!/usr/bin/env python3
"""Refuse to ship a long-question crop that is rotated or too small to read.

The marking-scheme cropper in preprocess_lq_answers.py already knows how to
tell an upright page from a sideways one: it OCRs the top band of the page in
three rotations and keeps the one whose English text wins by a clear margin.
That test fixes the failure mode where a sideways booklet scan is published as
a question scan and a reader cannot read it.

The question crops built by crop_lq_from_pages.py come out of the same scans, so
they need the same test before they are copied into the published snapshot
(paper2notes/notes/dse/lq/<section>/). This script reuses that test unchanged:
it imports the scoring and the rotation chooser rather than restating them, so
one rule governs both kinds of crop.

Two things are checked per file:
  orientation  the best rotation is 0; a crop whose best rotation is 90 or 270
               is rotated or sideways, and fails
  legibility   the width is at least MIN_WIDTH px and the page holds a normal
               amount of ink, so a blank or hairline fragment cannot ship

Run:
    python3 paper2db/scripts/check_lq_crop_orientation.py FILE_OR_DIR [FILE_OR_DIR...]
    python3 paper2db/scripts/check_lq_crop_orientation.py --fix FILE_OR_DIR
    python3 paper2db/scripts/check_lq_crop_orientation.py --json FILE_OR_DIR

Exit code 0 when every crop passes, 1 when any crop fails, 2 on bad input.
--fix rewrites each crop the way the gate scores it, then re-checks the
rewritten file, so a fix never hides a failure it did not solve.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))

from preprocess_lq_answers import (  # noqa: E402
    _ascii_alpha_score,
    apply_rotation,
    ocr_text,
)

# The smallest published crop that still holds readable body text. A4 at 200 dpi
# is about 1650 px; every HKDSE Paper 1B question page in this repository is far
# wider, so anything under this is a fragment rather than a question page.
MIN_WIDTH = 1200

# A page of a real question is mostly white. Below this the file is an empty
# or nearly empty render; above 0.97 it is a solid block and unreadable either way.
MIN_INK = 0.004
MAX_INK = 0.97

# The page must be tall enough to hold the sampled bands.
MIN_HEIGHT = 400

# How many horizontal bands of the page to read, top to bottom. One band is the
# header; four also read the body, which is what decides a question page.
BANDS = 4

# Upright must beat the best sideways rotation by this much before the gate
# calls the page readable. An unclear page fails rather than passes.
MARGIN = 0.35

# OCR a band at about this width. Wider only costs time: the scoring rule counts
# English letters, not their size.
OCR_WIDTH = 1100


def band_text(image: Image.Image, index: int, count: int = BANDS) -> str:
    """OCR one horizontal band of the page, downscaled for speed."""
    top = int(image.height * index / count)
    bottom = int(image.height * (index + 1) / count)
    band = image.crop((0, top, image.width, max(top + 1, bottom)))
    if band.width > OCR_WIDTH:
        ratio = OCR_WIDTH / band.width
        band = band.resize(
            (int(band.width * ratio), max(1, int(band.height * ratio))),
            Image.Resampling.LANCZOS,
        )
    return ocr_text(band)


def orientation_scores(image: Image.Image) -> dict[int, float]:
    """Score the page in each candidate rotation, using the answers gate's own rule.

    preprocess_lq_answers.py reads only the top band, because a marking-scheme
    page identifies itself by its column headers. A question page does not: its
    top band is a short stem above a figure, so a sideways scan of one loses
    there while its sideways margin line ("written in the margins will not be
    marked") reads as clean English and wins. Reading bands across the whole page
    settles it on the body text, which is long in both directions of the real
    question and gibberish in neither.
    """
    scores: dict[int, float] = {}
    for rot in (0, 90, 270):
        candidate = image if rot == 0 else apply_rotation(image, rot)
        scores[rot] = sum(
            _ascii_alpha_score(band_text(candidate, index)) for index in range(BANDS)
        )
    return scores


def ink_fraction(image: Image.Image) -> float:
    """Share of pixels darker than paper white."""
    gray = np.asarray(image.convert("L"))
    return float((gray < 225).mean())


def check_image(image: Image.Image) -> dict:
    """Gate one crop. Returns a result row; readable is False when it fails."""
    width, height = image.size
    scores = orientation_scores(image)
    best = max(scores, key=scores.get)
    sideways_best = max(score for rot, score in scores.items() if rot != 0)
    ink = ink_fraction(image)
    reasons: list[str] = []

    if best != 0:
        reasons.append(
            f"sideways: its English text wins at {best}° ({scores[best]:.2f}), "
            f"not upright ({scores[0]:.2f})"
        )
    elif scores[0] - sideways_best < MARGIN:
        reasons.append(
            f"orientation unclear: upright {scores[0]:.2f} against sideways {sideways_best:.2f}, "
            f"under the {MARGIN} margin the gate needs"
        )
    if width < MIN_WIDTH:
        reasons.append(f"too narrow to read: {width}px wide, under {MIN_WIDTH}px")
    if height < MIN_HEIGHT:
        reasons.append(f"too short to be a question page: {height}px tall")
    if not MIN_INK <= ink <= MAX_INK:
        reasons.append(f"no readable content: {ink:.1%} of the page is inked")

    return {
        "size": [width, height],
        "scores": {str(k): round(v, 3) for k, v in scores.items()},
        "ink": round(ink, 4),
        "rotation": best,
        "margin": round(scores[0] - sideways_best, 3),
        "readable": not reasons,
        "problems": reasons,
    }


def collect(paths: list[str]) -> list[Path]:
    out: list[Path] = []
    for raw in paths:
        path = Path(raw)
        if not path.exists():
            raise SystemExit(f"check_lq_crop_orientation: {raw} does not exist")
        if path.is_dir():
            out.extend(sorted(path.glob("*.png")))
        else:
            out.append(path)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("paths", nargs="+", metavar="FILE_OR_DIR", help="crop PNG, or a directory of them")
    parser.add_argument("--fix", action="store_true", help="rotate each failing crop the way the gate scores it, then re-check")
    parser.add_argument("--json", action="store_true", dest="as_json", help="print the result rows as JSON")
    args = parser.parse_args()

    files = collect(args.paths)
    if not files:
        raise SystemExit("check_lq_crop_orientation: no PNG crops found")

    rows: list[dict] = []
    for file in files:
        with Image.open(file) as handle:
            handle.load()
            image = handle.convert("RGB")
        row = check_image(image)
        row["file"] = str(file)
        # Only a sideways page is worth rotating. A crop that failed on width,
        # height, ink or an unclear orientation is left alone: rotating it
        # changes nothing and would rewrite a file for no reason.
        if args.fix and row["rotation"] in (90, 270):
            fixed = apply_rotation(image, row["rotation"])
            fixed.save(file, format="PNG")
            with Image.open(file) as handle:
                handle.load()
                recheck = check_image(handle.convert("RGB"))
            row["fixed"] = True
            row["recheck"] = recheck
            row["readable"] = recheck["readable"]
            row["problems"] = recheck["problems"]
            row["size"] = recheck["size"]
            row["scores"] = recheck["scores"]
            row["rotation"] = recheck["rotation"]
            row["margin"] = recheck["margin"]
        rows.append(row)

    failed = [r for r in rows if not r["readable"]]
    if args.as_json:
        print(json.dumps({"checked": len(rows), "failed": len(failed), "crops": rows}, indent=2))
    else:
        def w(value: object, width: int) -> str:
            return str(value).ljust(width)

        print(f"{w('crop', 46)}{w('size', 14)}{w('upright', 9)}{w('margin', 8)}ink    result")
        for row in rows:
            sizes = f"{row['size'][0]}x{row['size'][1]}"
            upright = "yes" if row["rotation"] == 0 else f"no ({row['rotation']}°)"
            verdict = "readable" if row["readable"] else "FAILED"
            if row.get("fixed"):
                verdict = "readable (rotated, re-checked)" if row["readable"] else "FAILED (after rotating)"
            print(f"{w(row['file'], 46)}{w(sizes, 14)}{w(upright, 9)}{w(row['margin'], 8)}{row['ink']:<7.3f}{verdict}")
            for problem in row["problems"]:
                print(f"    - {problem}")
        print(f"\nchecked {len(rows)} crop(s) | failed {len(failed)}")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()