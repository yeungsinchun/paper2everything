"""Tracked ans_starts.json maps must cover their year's full LQ inventory."""
from __future__ import annotations

import json
import unittest
from pathlib import Path

import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[1]
RECON_LQ = ROOT / "tests" / "reconstructed" / "lq"
ANS_DIR = ROOT / "paper" / "ans"
LQ_CLASSIFICATIONS = ROOT / "metadata" / "lq" / "llm_classifications.json"


def expected_questions(year: str) -> list[int]:
    data = json.loads(LQ_CLASSIFICATIONS.read_text(encoding="utf-8"))
    return sorted(int(k.split("-q", 1)[1]) for k in data if k.startswith(f"{year}-q"))


class TestLqAnsStarts(unittest.TestCase):
    def test_maps_cover_full_inventory(self) -> None:
        maps = sorted(RECON_LQ.glob("*/ans_starts.json"))
        self.assertTrue(maps, "no ans_starts.json files found")
        for path in maps:
            year = path.parent.name
            with self.subTest(year=year):
                payload = json.loads(path.read_text(encoding="utf-8"))
                source = ANS_DIR / payload["source_pdf"]
                self.assertTrue(source.is_file(), f"missing {source}")
                with fitz.open(source) as doc:
                    self.assertEqual(payload["pdf_pages"], len(doc))
                section_b = payload["section_b_pdf_pages"]
                self.assertTrue(section_b, "empty section_b_pdf_pages")
                self.assertEqual(section_b, sorted(section_b), "section_b pages unsorted")
                questions = {
                    int(q): [int(p) for p in pages]
                    for q, pages in payload["questions"].items()
                }
                self.assertEqual(sorted(questions), expected_questions(year))
                owned: set[int] = set()
                for qn, pages in questions.items():
                    self.assertTrue(pages, f"Q{qn} has no pages")
                    self.assertEqual(pages, sorted(pages), f"Q{qn} pages unsorted")
                    for p in pages:
                        self.assertIn(
                            p, section_b, f"Q{qn} page {p} outside Section B"
                        )
                    owned.update(pages)
                self.assertEqual(
                    sorted(owned),
                    section_b,
                    "Section B pages without an owning question",
                )

    def test_no_map_without_source_pdf(self) -> None:
        pdfs = {p.name[: -len("ans.pdf")] for p in ANS_DIR.glob("*ans.pdf")}
        for path in sorted(RECON_LQ.glob("*/ans_starts.json")):
            with self.subTest(year=path.parent.name):
                self.assertIn(path.parent.name, pdfs)


if __name__ == "__main__":
    unittest.main()
