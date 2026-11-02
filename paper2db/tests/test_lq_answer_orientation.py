"""Answer crops must read upright, and Paper 2 pages must be recognised."""
from __future__ import annotations

import importlib.machinery
import importlib.util
import sys
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]

WORDS = [
    "Solution",
    "The force is not the work done against",
    "the resistance of the vehicle in the",
    "time given. Total energy of the mass and",
    "the speed of the object are also correct.",
]

# Scores shaped like the real staged crops: the 2018 scheme reads 55-71 at 270
# against 1-7 upright, while an upright crop reads far better than any rotation.
SIDEWAYS = {0: 2, 90: 22, 180: 7, 270: 71}
UPRIGHT = {0: 34, 90: 6, 180: 4, 270: 5}


def load_module(name: str, path: Path):
    scripts = str(ROOT / "scripts")
    if scripts not in sys.path:
        sys.path.insert(0, scripts)
    loader = importlib.machinery.SourceFileLoader(name, str(path))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


pla = load_module("preprocess_lq_answers", ROOT / "scripts" / "preprocess_lq_answers.py")


def text_page(lines: list[str], width: int = 1100, height: int = 700) -> Image.Image:
    image = Image.new("RGB", (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    for i, line in enumerate(lines):
        draw.text((40, 40 + i * 46), line, fill=(0, 0, 0))
    return image


def scores_in_order(*tables: dict[int, int]):
    """Hand out one score table per call, then repeat the last one."""
    remaining = list(tables)

    def fake(image, max_dim: int = 1400) -> dict[int, int]:
        return remaining.pop(0) if len(remaining) > 1 else remaining[0]

    return fake


class TestAnswerCropOrientation(unittest.TestCase):
    def test_reading_score_counts_plain_english(self) -> None:
        self.assertGreater(pla.reading_score(" ".join(WORDS)), 25)
        self.assertEqual(pla.reading_score("| 3. @ CG (@ ~@ peccay"), 0)

    def test_reading_score_runs_the_ocr(self) -> None:
        page = text_page(WORDS)
        scores = pla.rotation_reading_scores(page)
        self.assertEqual(max(scores, key=lambda r: scores[r]), 0, scores)

    def test_upright_crop_is_left_alone(self) -> None:
        page = text_page(WORDS)
        with mock.patch.object(pla, "rotation_reading_scores", scores_in_order(UPRIGHT)):
            self.assertIs(pla.upright_answer_crop(page, "test/q1.png"), page)

    def test_sideways_crop_is_turned_upright(self) -> None:
        page = text_page(WORDS)
        with mock.patch.object(
            pla, "rotation_reading_scores", scores_in_order(SIDEWAYS, UPRIGHT)
        ):
            fixed = pla.upright_answer_crop(page, "test/q1.png")
        self.assertEqual(fixed.size, page.rotate(270, expand=True).size)
        self.assertEqual(list(fixed.getdata()), list(page.rotate(270, expand=True).getdata()))

    def test_scan_noise_does_not_rotate_an_upright_crop(self) -> None:
        # 2021-q6 reads 12 at 180 against 4 upright but is plainly upright; the
        # gate must leave it alone rather than turn it upside down.
        noisy = {0: 4, 90: 6, 180: 12, 270: 6}
        page = text_page(WORDS)
        with mock.patch.object(pla, "rotation_reading_scores", scores_in_order(noisy)):
            self.assertIs(pla.upright_answer_crop(page, "test/q1.png"), page)

    def test_unreadable_crop_is_rejected(self) -> None:
        blank = Image.new("RGB", (700, 500), (255, 255, 255))
        nothing = {0: 0, 90: 0, 180: 0, 270: 0}
        with mock.patch.object(pla, "rotation_reading_scores", scores_in_order(nothing, nothing)):
            # Nothing to gain by rotating, so it is shipped as scanned.
            self.assertEqual(
                pla.upright_answer_crop(blank, "test/q1.png").size, blank.size
            )
        still_sideways = {0: 3, 90: 40, 180: 5, 270: 10}
        with mock.patch.object(
            pla, "rotation_reading_scores", scores_in_order(SIDEWAYS, still_sideways)
        ):
            with self.assertRaises(SystemExit):
                pla.upright_answer_crop(blank, "test/q1.png")


class TestPaper2Guard(unittest.TestCase):
    def test_topic_heading_counts_as_paper_2(self) -> None:
        page = mock.Mock()
        page.get_text.return_value = "• Astronomy and Space Science\nsection B\n1. B (54%)"
        self.assertTrue(pla.is_paper_2_pdf_text(page))

    def test_paper_1b_page_is_not_paper_2(self) -> None:
        page = mock.Mock()
        page.get_text.return_value = (
            "Remarks\n9.\n(a)\nSolution\nalpha decay / beta decay OR"
        )
        self.assertFalse(pla.is_paper_2_pdf_text(page))

    def test_sideways_topic_heading_is_found(self) -> None:
        # A topic-only heading must stop the run whether or not the scan is upright.
        page = text_page(["Astronomy and Space Science", "Solution", "Marks", "Remarks"])
        self.assertTrue(pla.is_paper_2_page(page))
        self.assertTrue(pla.is_paper_2_page(page.rotate(90, expand=True)))

    def test_paper_1b_solution_page_is_not_paper_2(self) -> None:
        page = text_page(["Paper 1 Section B", "Solution", "Marks", "Remarks"])
        self.assertFalse(pla.is_paper_2_page(page))


if __name__ == "__main__":
    unittest.main()