"""Behavioral coverage for mandatory MC/LQ metadata replay."""
from __future__ import annotations

import contextlib
import csv
import importlib.machinery
import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import classify_lq_llm as lq
import classify_mc_llm as mc


def load_pipeline():
    loader = importlib.machinery.SourceFileLoader("replay_pipeline", str(ROOT / "pipeline"))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    module = importlib.util.module_from_spec(spec)
    loader.exec_module(module)
    return module


class TestMandatoryReplay(unittest.TestCase):
    def test_removed_override_is_rejected_by_all_entry_points(self) -> None:
        for module in (load_pipeline(), mc, lq):
            with self.subTest(module=module.__name__):
                with mock.patch.object(sys, "argv", ["classify", "--reclassify"]):
                    with contextlib.redirect_stderr(io.StringIO()):
                        with self.assertRaises(SystemExit) as raised:
                            module.parse_args()
                self.assertEqual(raised.exception.code, 2)

    def test_force_and_year_selection_dispatch_replay_classifiers(self) -> None:
        pipe = load_pipeline()
        with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
            root = Path(tmp)
            for kind in ("mc", "lq"):
                dest = root / "tests" / "sections" / kind / "classification.csv"
                dest.parent.mkdir(parents=True)
                dest.write_text("Year,Question\n2024,1\n", encoding="utf-8")
            for years in ([], ["--years", "2024"]):
                for keyed in (False, True):
                    with self.subTest(years=years, keyed=keyed):
                        argv = ["pipeline", "--only", "classify-mc,classify-lq", "--force", "--yes", *years]
                        with mock.patch.object(pipe, "ROOT", root), mock.patch.object(sys, "argv", argv):
                            with mock.patch.dict("os.environ", {"LLM_API_KEY": "test-key"} if keyed else {}, clear=True):
                                with mock.patch.object(pipe, "run_script") as run:
                                    with contextlib.redirect_stdout(io.StringIO()):
                                        pipe.main()
                        self.assertEqual(run.call_args_list, [
                            mock.call("classify_mc_llm.py", *years),
                            mock.call("classify_lq_llm.py", *years),
                        ])

    def test_replay_preserves_decisions_and_only_classifies_missing_years(self) -> None:
        for kind, module in (("mc", mc), ("lq", lq)):
            for missing in (False, True):
                for keyed in (False, True):
                    with self.subTest(kind=kind, missing=missing, keyed=keyed):
                        with tempfile.TemporaryDirectory(dir=ROOT) as tmp, contextlib.ExitStack() as stack:
                            root = Path(tmp)
                            classified = root / "tests" / "sections" / kind
                            output = root / "tests" / "reconstructed" / kind
                            metadata = root / "metadata" / kind
                            classified.mkdir(parents=True)
                            metadata.mkdir(parents=True)
                            years = ["2024", "2025"] if missing else ["2024"]
                            records = []
                            for year in years:
                                relative_png = f"tests/reconstructed/{kind}/{year}/q1.png"
                                png = root / relative_png
                                png.parent.mkdir(parents=True)
                                png.write_bytes(b"fixture crop")
                                records.append({
                                    "Year": year, "Question": 1,
                                    "Statement": "Calculate heat capacity.",
                                    "Question statement": "Calculate heat capacity.",
                                    "PNG": relative_png,
                                    "AnswerPNG": f"tests/reconstructed/{kind}/{year}/ans/q1.png",
                                })
                            tracked = {"sections": [2], "reason": "reviewed decision"}
                            if kind == "mc":
                                tracked = {**tracked, "Year": "2024", "Question": 1, "uncertain": False}
                                payload = [tracked]
                                (classified / "mc_ocr.json").write_text(json.dumps(records), encoding="utf-8")
                                patches = {"ROOT": root, "CLASSIFIED": classified, "OUTPUT": output,
                                           "OCR_CACHE": classified / "ocr_cache", "METADATA_MC": metadata}
                                argv = ["classify", "--skip-ocr", "--sleep", "0"]
                                llm_name = "classify_one_llm"
                                fallback_name = "keyword_fallback_mc"
                                result = {**records[-1], "sections": [3], "reason": "new decision", "uncertain": False}
                            else:
                                payload = {"2024-q1": tracked}
                                patches = {"ROOT": root, "CLASSIFIED_LQ": classified, "OUTPUT_LQ": output,
                                           "OCR_CACHE": classified / "ocr_cache", "METADATA_LQ": metadata}
                                by_year = {r["Year"]: r for r in records}
                                stack.enter_context(mock.patch.object(module, "_ocr_one", side_effect=lambda job: by_year[job[0]]))
                                argv = ["classify", "--sleep", "0"]
                                llm_name = "classify_one"
                                fallback_name = "keyword_fallback_lq"
                                result = {"sections": [3], "reason": "new decision"}
                            path = metadata / "llm_classifications.json"
                            path.write_text(json.dumps(payload), encoding="utf-8")
                            for name, value in patches.items():
                                stack.enter_context(mock.patch.object(module, name, value))
                            stack.enter_context(mock.patch.object(sys, "argv", argv))
                            stack.enter_context(mock.patch.object(module, "llm_config", return_value=("key" if keyed else "", "base", "model")))
                            llm_call = stack.enter_context(mock.patch.object(module, llm_name, return_value=result))
                            fallback_call = stack.enter_context(mock.patch.object(module, fallback_name, return_value=result))
                            with contextlib.redirect_stdout(io.StringIO()):
                                module.main()
                            active_call = llm_call if keyed else fallback_call
                            inactive_call = fallback_call if keyed else llm_call
                            inactive_call.assert_not_called()
                            if missing:
                                active_call.assert_called_once()
                                self.assertEqual(active_call.call_args.args[0]["Year"], "2025")
                            else:
                                active_call.assert_not_called()
                            saved = json.loads(path.read_text(encoding="utf-8"))
                            saved_tracked = saved[0] if kind == "mc" else saved["2024-q1"]
                            self.assertEqual(saved_tracked["sections"], [2])
                            self.assertEqual(saved_tracked["reason"], "reviewed decision")
                            with (classified / "classification.csv").open(encoding="utf-8") as fh:
                                rows = list(csv.DictReader(fh))
                            self.assertEqual([r["Year"] for r in rows], years)
                            self.assertEqual(rows[0]["AllSections"], "2")
                            self.assertEqual(rows[0]["Reason"], "reviewed decision")
                            if missing:
                                self.assertEqual(rows[1]["AllSections"], "3")


if __name__ == "__main__":
    unittest.main()
