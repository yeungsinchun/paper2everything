"""Behavioral checks for quality_audit and lavish wiring."""
from __future__ import annotations

import importlib.machinery
import importlib.util
import contextlib
import io
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, path: Path):
    loader = importlib.machinery.SourceFileLoader(name, str(path))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestQualityAudit(unittest.TestCase):
    def test_relative_output_path_exits_zero(self) -> None:
        with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
            rel_out = Path(tmp).name + "/quality_audit.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "scripts" / "quality_audit.py"),
                    "--output",
                    rel_out,
                ],
                cwd=ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            out_file = ROOT / rel_out
            self.assertTrue(out_file.is_file())
            report = json.loads(out_file.read_text(encoding="utf-8"))
            self.assertIn("summary", report)
            self.assertIn(f"Wrote {rel_out}", result.stdout)

    def test_report_counts_overrides_toward_five_percent(self) -> None:
        if not (ROOT / "tests" / "sections" / "mc" / "classification.csv").is_file():
            self.skipTest("tests/sections/ not built (run ./pipeline)")
        result = subprocess.run(
            [
                sys.executable,
                str(ROOT / "scripts" / "quality_audit.py"),
                "--output",
                str(ROOT / "tests" / "sections" / "quality_audit.json"),
            ],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        report = json.loads(
            (ROOT / "tests" / "sections" / "quality_audit.json").read_text(encoding="utf-8")
        )
        summary = report["summary"]
        overrides = summary["overrides_historical"]["total_questions"]
        self.assertGreaterEqual(overrides, 1)
        override_failures = [
            item
            for item in summary["mc"]["failures"]
            if item.get("kind") == "override_tuned"
        ]
        self.assertEqual(len(override_failures), overrides)
        self.assertGreaterEqual(summary["mc"]["failure_count"], overrides)
        expected_mc_rate = summary["mc"]["failure_count"] / summary["mc"]["questions"]
        self.assertAlmostEqual(
            summary["mc"]["manual_tuning_rate"], round(expected_mc_rate, 4)
        )
        self.assertIn("override_tuned", summary["failure_definitions"]["counted"])
        self.assertNotIn(
            "override_baked_in", summary["failure_definitions"]["not_counted"]
        )
        self.assertNotIn(
            "override_tuned", summary["failure_definitions"]["not_counted"]
        )
        override_rate = overrides / summary["mc"]["questions"]
        if override_rate > 0.05:
            self.assertFalse(summary["passes_5pct_bar"])
        self.assertGreater(summary["mc"]["questions"], 100)
        self.assertGreater(summary["lq"]["questions"], 50)

    def test_summarize_counts_override_items(self) -> None:
        audit = load_module("quality_audit", ROOT / "scripts" / "quality_audit.py")
        summary = audit.summarize(
            {
                "failures": [],
                "crop_count": 100,
            },
            {
                "failures": [],
                "crop_count": 50,
            },
            {
                "uncertain": [],
                "missing_crop": [],
                "missing_classified": [],
                "book_order_inversions": [],
                "row_count": 100,
            },
            {
                "missing_crop": [],
                "missing_classified": [],
                "missing_answer_png": [],
                "row_count": 50,
            },
            {
                "total_questions": 10,
                "by_year": {"2099": 10},
                "items": [{"year": "2099", "q": str(i)} for i in range(1, 11)],
            },
        )
        self.assertEqual(summary["mc"]["failure_count"], 10)
        self.assertEqual(summary["mc"]["manual_tuning_rate"], 0.1)
        self.assertFalse(summary["passes_5pct_bar"])
        self.assertTrue(
            all(item["kind"] == "override_tuned" for item in summary["mc"]["failures"])
        )

    def test_tiny_crop_is_counted_as_failure(self) -> None:
        audit = load_module("quality_audit", ROOT / "scripts" / "quality_audit.py")
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            year_dir = tmp_path / "tests" / "reconstructed" / "mc" / "2099"
            year_dir.mkdir(parents=True)
            from PIL import Image

            Image.new("RGB", (40, 40), (255, 255, 255)).save(year_dir / "q1.png")
            # Pad to look like a year folder with q1 only - few_year_crops also fires.
            with mock.patch.object(audit, "ROOT", tmp_path):
                crops = audit.audit_mc_crops()
            kinds = {item["kind"] for item in crops["failures"]}
            self.assertIn("tiny_crop", kinds)
            self.assertIn("few_year_crops", kinds)


class TestNotBuilt(unittest.TestCase):
    """An unbuilt tree has no questions to divide by, so no rate is invented."""

    @contextlib.contextmanager
    def tree(self, audit, root: Path):
        """Point the audit at `root` (module constants are resolved at import)."""
        with mock.patch.multiple(
            audit,
            ROOT=root,
            MC_CSV=root / "tests" / "sections" / "mc" / "classification.csv",
            LQ_CSV=root / "tests" / "sections" / "lq" / "classification.csv",
            OUT_JSON=root / "tests" / "sections" / "quality_audit.json",
        ):
            yield

    def report(self, audit, root: Path) -> dict:
        with self.tree(audit, root):
            return audit.build_report()

    def test_rates_are_null_and_bar_unmeasured(self) -> None:
        audit = load_module("quality_audit", ROOT / "scripts" / "quality_audit.py")
        with tempfile.TemporaryDirectory() as tmp:
            summary = self.report(audit, Path(tmp))["summary"]
        self.assertEqual(summary["built"], {"mc": False, "lq": False, "any": False})
        for paper in ("mc", "lq", "combined"):
            with self.subTest(paper=paper):
                self.assertIsNone(summary[paper]["manual_tuning_rate"])
                self.assertEqual(summary[paper]["questions"], 0)
                self.assertEqual(summary[paper]["failure_count"], 0)
        self.assertIsNone(summary["passes_5pct_bar"])

    def test_one_paper_built_leaves_the_other_unmeasured(self) -> None:
        audit = load_module("quality_audit", ROOT / "scripts" / "quality_audit.py")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            year = root / "tests" / "reconstructed" / "mc" / "2099"
            year.mkdir(parents=True)
            from PIL import Image

            Image.new("RGB", (900, 900), (255, 255, 255)).save(year / "q1.png")
            summary = self.report(audit, root)["summary"]
        self.assertEqual(summary["built"], {"mc": True, "lq": False, "any": True})
        self.assertIsNone(summary["lq"]["manual_tuning_rate"])
        self.assertEqual(summary["combined"]["manual_tuning_rate"], summary["mc"]["manual_tuning_rate"])

    def run_cli(self, audit, root: Path, *args: str) -> tuple[int, str, str]:
        out = root / "quality_audit.json"
        argv = ["quality_audit.py", "--output", str(out), *args]
        stdout, stderr = io.StringIO(), io.StringIO()
        with self.tree(audit, root):
            with mock.patch.object(sys, "argv", argv):
                with mock.patch("sys.stdout", stdout):
                    with mock.patch("sys.stderr", stderr):
                        try:
                            audit.main()
                        except SystemExit as exit_code:
                            return int(exit_code.code or 0), stdout.getvalue(), stderr.getvalue()
        return 0, stdout.getvalue(), stderr.getvalue()

    def test_cli_reports_not_built_and_strict_fails(self) -> None:
        audit = load_module("quality_audit", ROOT / "scripts" / "quality_audit.py")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            code, stdout, stderr = self.run_cli(audit, root)
            self.assertEqual(code, 0, stdout + stderr)
            self.assertIn("Not built", stdout)
            self.assertIn("not measured", stdout)
            self.assertEqual(audit.format_rate(None), "not measured")
            self.assertEqual(audit.format_rate(0.1), "(10.00%)")
            summary = json.loads((root / "quality_audit.json").read_text(encoding="utf-8"))["summary"]
            self.assertIsNone(summary["passes_5pct_bar"])
            code, stdout, stderr = self.run_cli(audit, root, "--strict")
            self.assertEqual(code, 1, stdout + stderr)
            self.assertIn("cannot be verified", stderr)

    def test_review_board_shows_not_measured(self) -> None:
        lavish = load_module(
            "build_pipeline_lavish_review",
            ROOT / "scripts" / "build_pipeline_lavish_review.py",
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            out = tmp_path / ".lavish" / "pipeline-review"
            out.mkdir(parents=True)
            paper = {
                "questions": 0,
                "failure_count": 0,
                "manual_tuning_rate": None,
            }
            audit = {
                "summary": {
                    "built": {"mc": False, "lq": False, "any": False},
                    "mc": paper,
                    "lq": {**paper, "missing_answer_png_count": 0, "missing_answer_by_year": {}},
                    "combined": paper,
                    "overrides_historical": {"total_questions": 109, "by_year": {"2019": 109}},
                    "passes_5pct_bar": None,
                    "failure_definitions": {
                        "counted": ["override_tuned"],
                        "not_counted": ["missing_answer_png"],
                    },
                }
            }
            with mock.patch.object(lavish, "ROOT", tmp_path):
                with mock.patch.object(lavish, "OUT", out):
                    with mock.patch.object(lavish, "IMG", out / "img"):
                        with mock.patch.object(lavish, "AUDIT_JSON", out / "audit.json"):
                            lavish.write_html(
                                audit,
                                {key: [] for key in ("anchors", "mc_crops", "lq_crops", "mc_classified", "lq_classified")},
                            )
            html = (out / "index.html").read_text(encoding="utf-8")
            self.assertIn("NOT MEASURED (run ./pipeline)", html)
            self.assertNotIn("FAIL (above 5%)", html)
            self.assertNotIn("10900.00%", html)


class TestPipelineLavishWiring(unittest.TestCase):
    def test_stage_lavish_runs_quality_and_three_builders(self) -> None:
        pipe = load_module("paper2db_pipeline", ROOT / "pipeline")
        calls: list[str] = []

        def fake_run(script_name: str, *args: str) -> None:
            calls.append(script_name)

        with mock.patch.object(pipe, "ensure_lq_performance"):
            with mock.patch.object(pipe, "run_script", side_effect=fake_run):
                pipe.stage_lavish()
        self.assertEqual(
            calls,
            [
                "quality_audit.py",
                "build_mc_lavish_review.py",
                "build_lq_lavish_review.py",
                "build_pipeline_lavish_review.py",
            ],
        )

    def test_pipeline_review_preserves_img_when_sources_missing(self) -> None:
        lavish = load_module(
            "build_pipeline_lavish_review",
            ROOT / "scripts" / "build_pipeline_lavish_review.py",
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            out = tmp_path / ".lavish" / "pipeline-review"
            img = out / "img"
            img.mkdir(parents=True)
            marker = img / "anchor-2024-page01.png"
            marker.write_bytes(b"kept-anchor")
            audit = {
                "summary": {
                    "mc": {
                        "manual_tuning_rate": 0.1,
                        "failure_count": 10,
                        "questions": 100,
                    },
                    "lq": {
                        "manual_tuning_rate": 0.0,
                        "failure_count": 0,
                        "questions": 50,
                        "missing_answer_png_count": 0,
                    },
                    "combined": {
                        "manual_tuning_rate": 0.0667,
                        "failure_count": 10,
                        "questions": 150,
                    },
                    "overrides_historical": {"total_questions": 10, "by_year": {"2099": 10}},
                    "passes_5pct_bar": False,
                    "failure_definitions": {
                        "counted": ["override_tuned"],
                        "not_counted": ["missing_answer_png"],
                    },
                }
            }
            with mock.patch.object(lavish, "ROOT", tmp_path):
                with mock.patch.object(lavish, "OUT", out):
                    with mock.patch.object(lavish, "IMG", img):
                        with mock.patch.object(
                            lavish, "AUDIT_JSON", tmp_path / "classified" / "quality_audit.json"
                        ):
                            with mock.patch.object(
                                lavish, "ensure_audit", return_value=audit
                            ):
                                lavish.main()
            self.assertTrue(marker.is_file())
            self.assertEqual(marker.read_bytes(), b"kept-anchor")
            html = (out / "index.html").read_text(encoding="utf-8")
            self.assertIn("FAIL (above 5%)", html)
            self.assertIn("img/anchor-2024-page01.png", html)


if __name__ == "__main__":
    unittest.main()
