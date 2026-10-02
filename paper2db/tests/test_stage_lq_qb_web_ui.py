"""Behavioral check: DSE LQ staging reads the canonical pipeline roots."""
from __future__ import annotations

import importlib.machinery
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"


def load_module(name: str, path: Path):
    loader = importlib.machinery.SourceFileLoader(name, str(path))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestStageLqCanonicalRoots(unittest.TestCase):
    def test_stage_reads_tests_sections_and_tests_reconstructed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            script = root / "scripts" / "stage_lq_qb_web_ui.py"
            script.parent.mkdir(parents=True)
            shutil.copy2(SCRIPTS / "stage_lq_qb_web_ui.py", script)
            stage = load_module("stage_lq_qb_web_ui", script)

            classified_lq = root / "tests" / "sections" / "lq"
            recon_lq = root / "tests" / "reconstructed" / "lq"
            classified_lq.mkdir(parents=True)
            crop = recon_lq / "2012" / "q1.png"
            crop.parent.mkdir(parents=True)
            Image.new("RGB", (30, 40), "white").save(crop)
            (classified_lq / "classification.csv").write_text(
                "Year,Question,Primary,AllSections,Reason,PNG,AnswerPNG\n"
                "2012,1,5,5,canonical,tests/reconstructed/lq/2012/q1.png,"
                "tests/reconstructed/lq/2012/ans/q1.png\n",
                encoding="utf-8",
            )
            (classified_lq / "candidate_performance.json").write_text(
                json.dumps({"2012": {"1": "note"}}), encoding="utf-8"
            )
            (recon_lq / "2012" / "starts.json").write_text(
                json.dumps({"questions": [{"q": 1, "page_from": 0, "page_to": 0}]}),
                encoding="utf-8",
            )

            stage.stage()

            staging = root / "qb-web-ui-staging" / "dse-lq"
            self.assertTrue((staging / "crops" / "2012-q1.png").is_file())
            manifest = json.loads(
                (staging / "manifest.json").read_text(encoding="utf-8")
            )
            self.assertEqual(manifest["counts"]["total_questions"], 1)
            self.assertEqual(manifest["counts"]["crops_exist"], 1)
            self.assertEqual(manifest["items"][0]["page_from"], 0)
            self.assertEqual(
                manifest["items"][0]["png"], "tests/reconstructed/lq/2012/q1.png"
            )


if __name__ == "__main__":
    unittest.main()
