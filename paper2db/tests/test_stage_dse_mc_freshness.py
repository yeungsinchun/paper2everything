"""The committed dse-mc staging must match a fresh keys run."""
from __future__ import annotations

import importlib.machinery
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]


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


stage = load_module("stage_dse_mc", ROOT / "scripts" / "stage_dse_mc.py")


def item(item_id: str, year: int, question: int, answer: dict) -> dict:
    return {"id": item_id, "year": year, "question": question, "answer": answer}


class TestStagedAnswersFreshness(unittest.TestCase):
    def test_expected_answers_let_overrides_win(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            overrides = Path(tmp) / "overrides.json"
            overrides.write_text(
                json.dumps({"2018": {"1": {"Correct Option": None, "Correct percentage": None, "deleted": True}}}),
                encoding="utf-8",
            )
            keys = Path(tmp) / "answer_keys.json"
            keys.write_text(
                json.dumps(
                    {
                        "2018": {"1": {"Correct Option": None, "Correct percentage": None, "deleted": True}},
                        "2013": {"5": {"Correct Option": "C", "Correct percentage": None}},
                    }
                ),
                encoding="utf-8",
            )
            with (
                mock.patch.object(stage, "ANSWER_OVERRIDES", overrides),
                mock.patch.object(stage, "ANSWER_KEYS", keys),
                mock.patch.object(stage, "ALT_ANSWER_KEYS", Path(tmp) / "missing.json"),
            ):
                merged = stage.expected_answers()
        self.assertTrue(merged[("2018", 1)]["deleted"])
        # An item only OCR can answer still comes from the keys file.
        self.assertEqual(merged[("2013", 5)]["Correct Option"], "C")

    def test_drift_is_reported(self) -> None:
        staged = [
            item(
                "dse-mc-2018-1",
                2018,
                1,
                {"option": None, "percentage": None, "deleted": False, "missing": True},
            )
        ]
        with tempfile.TemporaryDirectory() as tmp:
            staging = Path(tmp)
            (staging / "index.json").write_text(json.dumps(staged), encoding="utf-8")
            keys = Path(tmp) / "answer_keys.json"
            keys.write_text(
                json.dumps(
                    {"2018": {"1": {"Correct Option": None, "Correct percentage": None, "deleted": True}}}
                ),
                encoding="utf-8",
            )
            overrides = Path(tmp) / "overrides.json"
            overrides.write_text("{}", encoding="utf-8")
            with (
                mock.patch.object(stage, "STAGING", staging),
                mock.patch.object(stage, "ANSWER_OVERRIDES", overrides),
                mock.patch.object(stage, "ANSWER_KEYS", keys),
                mock.patch.object(stage, "ALT_ANSWER_KEYS", Path(tmp) / "missing.json"),
            ):
                self.assertFalse(stage.verify_staged_answers_current())

    def test_current_staging_has_no_drift(self) -> None:
        keys = stage.ANSWER_KEYS
        index = stage.STAGING / "index.json"
        if not (keys.is_file() or stage.ALT_ANSWER_KEYS.is_file()) or not index.is_file():
            self.skipTest("generated bank not built; run ./pipeline --only keys first")
        self.assertTrue(
            stage.verify_staged_answers_current(),
            "staged dse-mc answers differ from a fresh keys run",
        )


if __name__ == "__main__":
    unittest.main()