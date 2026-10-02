"""dse-items: record joining, schema validation and image gating on a temp tree."""
from __future__ import annotations

import importlib.machinery
import importlib.util
import json
import struct
import sys
import tempfile
import unittest
import zlib
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

import dse_items  # noqa: E402


def write_png(path: Path, width: int = 4, height: int = 3) -> None:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    raw = b"".join(b"\x00" + b"\x00" * width for _ in range(height))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


class TestDseItems(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name).resolve()
        (root / "schemas").mkdir()
        for name in ("dse-item.v1.json", "answer-pointer.v1.json"):
            (root / "schemas" / name).write_text((ROOT / "schemas" / name).read_text())
        recon = root / "tests" / "reconstructed"
        write_png(recon / "mc" / "2012" / "q1.png")  # section 5 -> Book 2, in-scope
        write_png(recon / "mc" / "2012" / "q2.png")  # section 2 -> Book 1, out-of-scope
        write_png(recon / "lq" / "2012" / "q1.png")
        write_png(recon / "lq" / "2012" / "ans" / "q1.png")
        (recon / "lq" / "2012" / "starts.json").write_text(
            json.dumps({"questions": [{"q": 1, "page_from": 0, "page_to": 1, "y": 1.0}]})
        )
        meta = root / "metadata"
        (meta / "mc").mkdir(parents=True)
        (meta / "lq").mkdir()
        (meta / "mc" / "llm_classifications.json").write_text(
            json.dumps(
                [
                    {"Year": 2012, "Question": 1, "sections": [5, 6], "reason": "r", "uncertain": True},
                    {"Year": 2012, "Question": 2, "sections": [2], "reason": "r", "uncertain": False},
                ]
            )
        )
        (meta / "lq" / "llm_classifications.json").write_text(
            json.dumps({"2012-q1": {"sections": [25], "reason": "r"}})
        )
        sections = root / "tests" / "sections"
        (sections / "mc").mkdir(parents=True)
        (sections / "lq").mkdir()
        (sections / "mc" / "answer_keys.json").write_text(
            json.dumps({"2012": {"1": {"Correct Option": "B", "Correct percentage": 61}, "2": {"deleted": True}}})
        )
        performance = root / "classified" / "lq" / "candidate_performance.json"
        performance.parent.mkdir(parents=True)
        performance.write_text(json.dumps({"2012": {"1": "Good."}}))
        (sections / "lq" / "candidate_performance.json").write_text(json.dumps({"2012": {"1": "Stale."}}))
        pointer_path = meta / "pointers" / "dse.json"
        pointer_path.parent.mkdir()
        self.winner = {
            "item_id": "dse-lq-2012-q1",
            "tier": "verified",
            "kind": "crop",
            "target": {"path": "tests/reconstructed/lq/2012/ans/q1.png"},
            "source": "fixture",
        }
        self.mc_pointer = {
            "item_id": "dse-mc-2012-1",
            "tier": "derived",
            "kind": "pdf",
            "target": {"path": "paper/ans/2012ans.pdf", "page": 2, "bbox": [0, 0, 1, 1]},
            "source": "fixture",
        }
        pointer_path.write_text(json.dumps({
            "schema": "paper2db.answer-pointer.v1",
            "corpus": "dse",
            "pointers": [
                {**self.winner, "tier": "inferred", "target": {"path": "paper/ans/2012ans.pdf"}},
                self.winner,
                self.mc_pointer,
            ],
        }))
        patches = {
            "ROOT": root,
            "SCHEMA_PATH": root / "schemas" / "dse-item.v1.json",
            "RECON": recon,
            "MC_CLASSIFICATIONS": meta / "mc" / "llm_classifications.json",
            "LQ_CLASSIFICATIONS": meta / "lq" / "llm_classifications.json",
            "ANSWER_KEYS": sections / "mc" / "answer_keys.json",
            "LQ_PERFORMANCE": performance,
            "ANSWER_POINTERS": pointer_path,
            "ITEMS_DIR": sections / "items",
        }
        for name, value in patches.items():
            patcher = mock.patch.object(dse_items, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        self.root = root

    def test_records_join_and_validate(self) -> None:
        records = {r["id"]: r for r in dse_items.build_records()}
        self.assertEqual(set(records), {"dse-mc-2012-1", "dse-mc-2012-2", "dse-lq-2012-q1"})
        self.assertEqual(dse_items.validate_records(list(records.values())), [])

        mc1 = records["dse-mc-2012-1"]
        self.assertEqual(mc1["scope"], "in-scope")
        self.assertEqual([s["num"] for s in mc1["sections"]["all"]], [5, 6])
        self.assertEqual(mc1["answer"]["option"], "B")
        self.assertEqual(mc1["answer"]["percentage"], 61)
        self.assertEqual(mc1["warnings"], ["uncertain_classification"])
        self.assertEqual(mc1["images"]["question"]["width"], 4)
        self.assertEqual(mc1["answer_pointer"], self.mc_pointer)

        mc2 = records["dse-mc-2012-2"]
        self.assertEqual(mc2["scope"], "out-of-scope")
        self.assertEqual(mc2["answer"]["status"], "deleted")
        self.assertIsNone(mc2["answer_pointer"])

        lq = records["dse-lq-2012-q1"]
        self.assertEqual(lq["answer_pointer"], self.winner)
        self.assertEqual(lq["scope"], "in-scope")
        self.assertEqual(lq["sources"]["pages"], {"from": 0, "to": 1})
        self.assertEqual(lq["performance"], {"status": "present", "note": "Good."})
        self.assertIsNotNone(lq["images"]["answer"])
        self.assertEqual(dse_items.missing_images(list(records.values())), [])

    def test_schema_rejects_bad_record(self) -> None:
        record = dse_items.build_records()[0]
        record["scope"] = "maybe"
        record["extra"] = 1
        del record["marks"]
        errors = dse_items.validate_records([record])
        joined = "\n".join(errors)
        self.assertIn("scope", joined)
        self.assertIn("unexpected property 'extra'", joined)
        self.assertIn("missing required property 'marks'", joined)

    def test_missing_in_scope_crop_fails_run(self) -> None:
        (self.root / "tests" / "reconstructed" / "mc" / "2012" / "q1.png").unlink()
        self.assertEqual(dse_items.missing_images(dse_items.build_records()), ["dse-mc-2012-1"])
        self.assertEqual(dse_items.main([]), 1)
        self.assertFalse(dse_items.ITEMS_DIR.exists())

    def test_outputs_written_per_section_and_index(self) -> None:
        out = dse_items.ITEMS_DIR
        self.assertEqual(dse_items.main([]), 0)
        self.assertEqual(
            sorted(p.name for p in out.glob("*.json")),
            ["02_Heat_Capacity.json", "05_Motion.json", "06_Force.json", "25_Radiation_and_Radioactivity.json", "index.json"],
        )
        index = json.loads((out / "index.json").read_text())
        self.assertEqual(index["counts"]["total"], 3)
        self.assertEqual(index["counts"]["in_scope"], 2)
        self.assertEqual(len(index["items"]), 3)
        force = json.loads((out / "06_Force.json").read_text())
        self.assertEqual([r["id"] for r in force], ["dse-mc-2012-1"])
        radiation = json.loads((out / "25_Radiation_and_Radioactivity.json").read_text())
        self.assertEqual(radiation[0]["answer_pointer"], self.winner)
        self.assertIn("dse-lq-2012-q1", {row["id"] for row in index["items"]})

    def add_year(self, year: str) -> None:
        mc = json.loads(dse_items.MC_CLASSIFICATIONS.read_text())
        mc.append({"Year": year, "Question": 1, "sections": [5, 6], "reason": "new"})
        dse_items.MC_CLASSIFICATIONS.write_text(json.dumps(mc))
        lq = json.loads(dse_items.LQ_CLASSIFICATIONS.read_text())
        lq[f"{year}-q1"] = {"sections": [25], "reason": "new"}
        dse_items.LQ_CLASSIFICATIONS.write_text(json.dumps(lq))
        write_png(dse_items.RECON / "mc" / year / "q1.png")
        write_png(dse_items.RECON / "lq" / year / "q1.png")

    def test_partial_run_skips_unselected_missing_crops_without_existing_output(self) -> None:
        self.add_year("2025")
        for image in (dse_items.RECON / "mc" / "2012").glob("*.png"):
            image.unlink()
        (dse_items.RECON / "lq" / "2012" / "q1.png").unlink()
        self.assertEqual({r["year"] for r in dse_items.build_records(["2025"])}, {"2025"})
        self.assertEqual(dse_items.main(["--years", "2025"]), 0)
        index = json.loads((dse_items.ITEMS_DIR / "index.json").read_text())
        self.assertEqual(index["counts"]["total"], 2)
        self.assertEqual({row["year"] for row in index["items"]}, {"2025"})
        before = (dse_items.ITEMS_DIR / "index.json").read_bytes()
        self.assertEqual(dse_items.main([]), 1)
        self.assertEqual((dse_items.ITEMS_DIR / "index.json").read_bytes(), before)

    def test_multiple_special_year_labels_are_selected(self) -> None:
        self.add_year("pp")
        self.add_year("sap")
        (dse_items.RECON / "mc" / "2012" / "q1.png").unlink()
        self.assertEqual(dse_items.main(["--years", "pp", "sap"]), 0)
        index = json.loads((dse_items.ITEMS_DIR / "index.json").read_text())
        self.assertEqual(index["counts"]["total"], 4)
        self.assertEqual({row["id"] for row in index["items"]}, {
            "dse-mc-pp-1", "dse-mc-sap-1", "dse-lq-pp-q1", "dse-lq-sap-q1",
        })

    def test_partial_run_preserves_other_years_and_removes_stale_memberships(self) -> None:
        self.add_year("2025")
        self.assertEqual(dse_items.main([]), 0)
        out = dse_items.ITEMS_DIR
        old_radiation = json.loads((out / "25_Radiation_and_Radioactivity.json").read_text())[0]
        (dse_items.RECON / "lq" / "2012" / "q1.png").unlink()
        (dse_items.RECON / "mc" / "2012" / "q1.png").unlink()
        mc = json.loads(dse_items.MC_CLASSIFICATIONS.read_text())
        mc[-1]["sections"] = [7]
        dse_items.MC_CLASSIFICATIONS.write_text(json.dumps(mc))
        lq = json.loads(dse_items.LQ_CLASSIFICATIONS.read_text())
        del lq["2025-q1"]
        dse_items.LQ_CLASSIFICATIONS.write_text(json.dumps(lq))
        self.assertEqual(dse_items.main(["--years", "2025"]), 0)
        self.assertEqual(dse_items.main(["--years", "2025"]), 0)
        index = json.loads((out / "index.json").read_text())
        self.assertEqual(index["counts"]["total"], 4)
        self.assertEqual(index["counts"]["in_scope"], 3)
        self.assertEqual(index["counts"]["in_scope_mc"], 2)
        self.assertEqual(index["counts"]["in_scope_lq"], 1)
        self.assertEqual(len({row["id"] for row in index["items"]}), 4)
        self.assertNotIn("dse-lq-2025-q1", {row["id"] for row in index["items"]})
        for folder in ("05_Motion", "06_Force"):
            records = json.loads((out / f"{folder}.json").read_text())
            self.assertEqual([r["id"] for r in records], ["dse-mc-2012-1"])
        radiation = json.loads((out / "25_Radiation_and_Radioactivity.json").read_text())
        self.assertEqual(radiation, [old_radiation])
        (dse_items.RECON / "mc" / "2025" / "q1.png").unlink()
        before = (out / "index.json").read_bytes()
        self.assertEqual(dse_items.main(["--years", "2025"]), 1)
        self.assertEqual((out / "index.json").read_bytes(), before)

    def test_full_rebuild_removes_stale_section_files_and_records(self) -> None:
        self.assertEqual(dse_items.main([]), 0)
        dse_items.LQ_CLASSIFICATIONS.write_text("{}")
        self.assertEqual(dse_items.main([]), 0)
        self.assertFalse((dse_items.ITEMS_DIR / "25_Radiation_and_Radioactivity.json").exists())
        index = json.loads((dse_items.ITEMS_DIR / "index.json").read_text())
        self.assertEqual(index["counts"]["total"], 2)

    def test_output_option_is_rejected(self) -> None:
        with self.assertRaises(SystemExit) as raised:
            dse_items.main(["--output", str(self.root / "out")])
        self.assertEqual(raised.exception.code, 2)
        self.assertFalse((self.root / "out").exists())

    def test_performance_requires_producer_output(self) -> None:
        dse_items.LQ_PERFORMANCE.unlink()
        with self.assertRaises(SystemExit) as raised:
            dse_items.build_records()
        self.assertIn("classified/lq/candidate_performance.json", str(raised.exception))

    def test_pointer_conflicts_fail_without_writing_outputs(self) -> None:
        data = json.loads(dse_items.ANSWER_POINTERS.read_text())
        data["pointers"].append({**self.winner, "target": {"path": "other.png"}})
        dse_items.ANSWER_POINTERS.write_text(json.dumps(data))
        self.assertEqual(dse_items.main([]), 1)
        self.assertFalse(dse_items.ITEMS_DIR.exists())

    def test_schema_rejects_invalid_answer_pointer(self) -> None:
        for change in ({"tier": "gold"}, {"target": {"path": "x", "bbox": [0, 0, 1]}}, {"item_id": "other"}):
            with self.subTest(change=change):
                record = dse_items.build_records()[0]
                record["answer_pointer"].update(change)
                self.assertTrue(dse_items.validate_records([record]))

    def test_pipeline_dispatches_selected_years_into_build(self) -> None:
        loader = importlib.machinery.SourceFileLoader("dse_test_pipeline", str(ROOT / "pipeline"))
        spec = importlib.util.spec_from_loader(loader.name, loader)
        pipe = importlib.util.module_from_spec(spec)
        loader.exec_module(pipe)
        self.add_year("2025")
        (dse_items.RECON / "mc" / "2012" / "q1.png").unlink()

        def run(script: str, *args: str) -> None:
            self.assertEqual(script, "dse_items.py")
            self.assertEqual(dse_items.main(list(args)), 0)

        with mock.patch.object(pipe, "run_script", side_effect=run), mock.patch.object(
            sys, "argv", ["pipeline", "--only", "dse-items", "--years", "2025", "--yes"]
        ):
            pipe.main()
        index = json.loads((dse_items.ITEMS_DIR / "index.json").read_text())
        self.assertEqual({row["year"] for row in index["items"]}, {"2025"})
        write_png(dse_items.RECON / "mc" / "2012" / "q1.png")
        with mock.patch.object(pipe, "run_script", side_effect=run), mock.patch.object(
            sys, "argv", ["pipeline", "--only", "dse-items", "--yes"]
        ):
            pipe.main()
        index = json.loads((dse_items.ITEMS_DIR / "index.json").read_text())
        self.assertEqual(index["counts"]["total"], 5)


if __name__ == "__main__":
    unittest.main()
