"""dse-items: record joining, schema validation and image gating on a temp tree."""
from __future__ import annotations

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
        (root / "schemas" / "dse-item.v1.json").write_text(dse_items.SCHEMA_PATH.read_text())
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
        (sections / "lq" / "candidate_performance.json").write_text(json.dumps({"2012": {"1": "Good."}}))
        patches = {
            "ROOT": root,
            "SCHEMA_PATH": root / "schemas" / "dse-item.v1.json",
            "RECON": recon,
            "MC_CLASSIFICATIONS": meta / "mc" / "llm_classifications.json",
            "LQ_CLASSIFICATIONS": meta / "lq" / "llm_classifications.json",
            "ANSWER_KEYS": sections / "mc" / "answer_keys.json",
            "LQ_PERFORMANCE": sections / "lq" / "candidate_performance.json",
            "ITEMS_DIR": sections / "items",
        }
        for name, value in patches.items():
            patcher = mock.patch.object(dse_items, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        self.root = root

    def test_records_join_and_validate(self) -> None:
        records = {r["id"]: r for r in dse_items.build_records()}
        self.assertEqual(set(records), {"dse-mc-2012-1", "dse-mc-2012-2", "dse-lq-2012-1"})
        self.assertEqual(dse_items.validate_records(list(records.values())), [])

        mc1 = records["dse-mc-2012-1"]
        self.assertEqual(mc1["scope"], "in-scope")
        self.assertEqual([s["num"] for s in mc1["sections"]["all"]], [5, 6])
        self.assertEqual(mc1["answer"]["option"], "B")
        self.assertEqual(mc1["answer"]["percentage"], 61)
        self.assertEqual(mc1["warnings"], ["uncertain_classification"])
        self.assertEqual(mc1["images"]["question"]["width"], 4)

        mc2 = records["dse-mc-2012-2"]
        self.assertEqual(mc2["scope"], "out-of-scope")
        self.assertEqual(mc2["answer"]["status"], "deleted")

        lq = records["dse-lq-2012-1"]
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
        self.assertEqual(dse_items.main(["--output", str(self.root / "out")]), 1)

    def test_outputs_written_per_section_and_index(self) -> None:
        out = self.root / "out"
        self.assertEqual(dse_items.main(["--output", str(out)]), 0)
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


if __name__ == "__main__":
    unittest.main()
