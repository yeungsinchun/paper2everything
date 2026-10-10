#!/usr/bin/env python3
"""Extract Paper 1A MC keys and correct-% from marking-scheme PDFs."""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import subprocess
from pathlib import Path

import pymupdf as fitz
from PIL import Image, ImageOps

KEY_RE = re.compile(
    r"(?P<n>\d{1,2})\s*[.,;:]?\s*(?P<k>[A-Da-d*＊])\s*(?:[\(（]\s*(?P<p>\d{1,3})\s*[\)）])?",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    root = Path(__file__).resolve().parents[1]
    parser.add_argument(
        "--answers",
        type=Path,
        default=root / "paper" / "ans",
        help="Marking-scheme PDF folder (default: paper/ans)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=root / "tests" / "sections" / "mc" / "answer_keys.json",
        help="Output JSON (default: tests/sections/mc/answer_keys.json)",
    )
    return parser.parse_args()


def ocr_image(image: Image.Image, psm: str = "6") -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    result = subprocess.run(
        ["tesseract", "stdin", "stdout", f"--psm", psm],
        input=buf.getvalue(),
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        check=True,
    )
    return result.stdout.decode("utf-8", errors="ignore")


def render_page(page: fitz.Page, scale: float = 2.5) -> Image.Image:
    # Honour page rotation so sideways scans OCR correctly.
    matrix = fitz.Matrix(scale, scale)
    pixmap = page.get_pixmap(matrix=matrix, alpha=False)
    image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
    if page.rotation in (90, 270):
        # get_pixmap already applies rotation in recent PyMuPDF; keep as-is.
        pass
    return image


def parse_keys(text: str, max_q: int = 36) -> dict[int, dict]:
    keys: dict[int, dict] = {}
    for match in KEY_RE.finditer(text):
        number = int(match.group("n"))
        if not 1 <= number <= max_q:
            continue
        raw = match.group("k")
        if raw in "*＊":
            keys[number] = {"Correct Option": None, "Correct percentage": None, "deleted": True}
            continue
        option = raw.upper()
        if option not in "ABCD":
            continue
        pct = int(match.group("p")) if match.group("p") else None
        if pct is not None and not 0 <= pct <= 100:
            pct = None
        prev = keys.get(number)
        # Prefer entries that include a percentage.
        if prev is None or (pct is not None and prev.get("Correct percentage") is None):
            keys[number] = {"Correct Option": option, "Correct percentage": pct, "deleted": False}
    return keys


def score_keys(keys: dict[int, dict]) -> int:
    return sum(1 for v in keys.values() if v.get("Correct Option") or v.get("deleted"))


SECTION_A_BONUS_RE = re.compile(r"section\s*A|Question\s*No|答案|Key", re.I)
PAPER_2_RE = re.compile(r"paper\s*2\b|DSE-PHY\s*2\b", re.I)
PAPER_2_TOPIC_RE = re.compile(
    r"astronomy\s+and\s+space|atomic\s+world|"
    r"energy\s+and\s+use\s+of\s+energy|medical\s+physics",
    re.I,
)


def section_a_bonus(text: str) -> int:
    """Prefer the page that carries the Paper 1 Section A key table."""
    return 5 if SECTION_A_BONUS_RE.search(text) else 0


def is_paper_2_page_text(text: str) -> bool:
    """True for a Paper 2 page, headed either 'Paper 2' or by topic name only."""
    if not text.strip():
        return False
    if PAPER_2_TOPIC_RE.search(text):
        return True
    return bool(PAPER_2_RE.search(text) and not re.search(r"paper\s*1\b", text, re.I))


def extract_from_pdf(path: Path) -> dict[int, dict]:
    """Read the Paper 1 Section A key table out of one marking scheme.

    Two bounds keep Section B and Paper 2 pages out of the answer key:

    - the page walk stops at the first Paper 2 page, which 2015 and 2021 head by
      topic name ("Astronomy and Space Science") instead of the literal "Paper 2";
    - a key found only on a later page is kept only when its number is one the
      Section A key page itself shows, because the key page states how many items
      the paper has. Without this a solution page could add a phantom Q34 (2015)
      or Q36 (2016).
    """
    document = fitz.open(path)
    best: dict[int, dict] = {}
    best_score = -1
    merged: dict[int, dict] = {}
    key_max = 0
    try:
        for index, page in enumerate(document, start=1):
            embedded = page.get_text("text")
            if is_paper_2_page_text(embedded[:800]):
                print(f"  stop at Paper 2 pdf page {index}/{len(document)}")
                break
            image = render_page(page, scale=2.5)
            # Also try a contrast-boosted copy for faded scans.
            variants = [image, ImageOps.autocontrast(image)]
            page_keys: dict[int, dict] = {}
            page_text = ""
            page_score = -1
            for variant in variants:
                for psm in ("6", "4"):
                    text = ocr_image(variant, psm=psm)
                    keys = parse_keys(text)
                    score = score_keys(keys) + section_a_bonus(text)
                    if score > page_score:
                        page_score, page_keys, page_text = score, keys, text
            if is_paper_2_page_text(page_text):
                print(f"  stop at Paper 2 page {index}/{len(document)} (ocr)")
                break
            if page_score > best_score:
                best_score, best = page_score, page_keys
                key_max = max(page_keys, default=0)
            # Collect additional hits; they are range-checked once key_max is known.
            for variant in variants[:1]:
                for number, payload in parse_keys(ocr_image(variant, psm="6")).items():
                    prev = merged.get(number)
                    if prev is None or (
                        prev.get("Correct percentage") is None
                        and payload.get("Correct percentage") is not None
                    ):
                        merged[number] = payload
    finally:
        document.close()
    for number, payload in merged.items():
        if number in best:
            continue
        if key_max and number > key_max:
            print(f"  drop key Q{number}: beyond the {key_max} items on the key page")
            continue
        best[number] = payload
    return best


MANUAL_KEYS_PATH = Path(__file__).resolve().parent / "answer_key_overrides.json"


def load_manual_keys() -> dict[str, dict[int, dict]]:
    """Hand-verified patches where OCR is unreliable (from marking-scheme page images)."""
    raw = json.loads(MANUAL_KEYS_PATH.read_text(encoding="utf-8"))
    return {
        year: {int(q): payload for q, payload in questions.items()}
        for year, questions in raw.items()
    }


def load_derived_keys() -> dict[str, dict[int, dict]]:
    """Unanimous Muse-derived MC options for years with no ans PDF.

    Returns {year: {question: {"Correct Option": "A", "Correct percentage": None,
    "derived": True}}}. Only 3/3 unanimous entries are returned.
    """
    path = Path(__file__).resolve().parents[1] / "metadata" / "derived_keys.json"
    if not path.is_file():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8")).get("mc", {})
    out: dict[str, dict[int, dict]] = {}
    for year, questions in raw.items():
        for q, entry in questions.items():
            if entry.get("unanimous") and entry.get("option") in ("A", "B", "C", "D"):
                out.setdefault(year, {})[int(q)] = {
                    "Correct Option": entry["option"],
                    "Correct percentage": None,
                    "derived": True,
                }
    return out


def main() -> None:
    args = parse_args()
    answers = args.answers
    result: dict[str, dict[str, dict]] = {}
    manual_keys = load_manual_keys()
    derived_keys = load_derived_keys()

    for pdf in sorted(answers.glob("*ans.pdf")):
        year = pdf.name.replace("ans.pdf", "")
        print(f"Extracting {pdf.name} ...", flush=True)
        keys = extract_from_pdf(pdf)
        # Apply / merge manual patches (manual wins).
        if year in manual_keys:
            keys.update(manual_keys[year])
        # Drop entries that are clearly wrong (option missing and not deleted).
        cleaned = {
            str(n): {
                "Correct Option": payload.get("Correct Option"),
                "Correct percentage": payload.get("Correct percentage"),
                **({"deleted": True} if payload.get("deleted") else {}),
            }
            for n, payload in sorted(keys.items())
            if payload.get("Correct Option") or payload.get("deleted")
        }
        result[year] = cleaned
        print(f"  -> {len(cleaned)} keys", flush=True)

    # Years with no ans PDF get unanimous derived keys (manual still wins).
    for year in sorted(set(derived_keys) - set(result)):
        keys = dict(derived_keys[year])
        if year in manual_keys:
            keys.update(manual_keys[year])
        result[year] = {
            str(n): {
                "Correct Option": payload.get("Correct Option"),
                "Correct percentage": payload.get("Correct percentage"),
                **({"derived": True} if payload.get("derived") else {}),
                **({"deleted": True} if payload.get("deleted") else {}),
            }
            for n, payload in sorted(keys.items())
            if payload.get("Correct Option") or payload.get("deleted")
        }
        print(f"  -> {len(result[year])} derived keys for {year}", flush=True)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
