"""Tests for answer-pointer validation, tier merge, item join, coverage and the CI check."""
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from scripts import pointers

ROOT = Path(__file__).resolve().parents[1]


def ptr(item_id: str, tier: str = "derived", path: str = "qb-web-ui-staging/qb/README.md", **target) -> dict:
    return {
        "item_id": item_id,
        "tier": tier,
        "kind": "crop",
        "target": {"path": path, **target},
        "source": "unit-test",
    }


class ValidateTests(unittest.TestCase):
    def test_valid_pointer(self):
        self.assertEqual(pointers.validate_pointer(ptr("a", page=2, bbox=[0, 0.1, 1, 0.5]), "p"), [])

    def test_rejects_bad_fields(self):
        bad = [
            {**ptr("a"), "tier": "gold"},
            {**ptr("a"), "kind": "video"},
            {**ptr("a"), "extra": 1},
            ptr("a", path="../secret.png"),
            ptr("a", path="/abs.png"),
            ptr("a", page=0),
            ptr("a", bbox=[0, 0, 1]),
            ptr("a", bbox=[0.5, 0, 0.2, 1]),
            ptr("a", bbox=[0, 0, 2, 1]),
            {**ptr("a"), "source": ""},
        ]
        for pointer in bad:
            with self.subTest(pointer=pointer):
                self.assertTrue(pointers.validate_pointer(pointer, "p"))

    def test_store_corpus_mismatch(self):
        store = {"schema": pointers.SCHEMA_ID, "corpus": "dse", "pointers": []}
        self.assertTrue(pointers.validate_store(store, "qb", "qb.json"))

    def test_schema_file_agrees_on_enums(self):
        schema = json.loads((ROOT / "schemas" / "answer-pointer.v1.json").read_text(encoding="utf-8"))
        props = schema["definitions"]["pointer"]["properties"]
        self.assertEqual(set(props["tier"]["enum"]), set(pointers.TIERS))
        self.assertEqual(set(props["kind"]["enum"]), set(pointers.KINDS))
        self.assertEqual(set(props), pointers.POINTER_KEYS)
        self.assertEqual(set(props["target"]["properties"]), pointers.TARGET_KEYS)


class MergeTests(unittest.TestCase):
    def test_highest_tier_wins(self):
        resolved = pointers.merge([ptr("a", "inferred", "x.png"), ptr("a", "verified", "y.png"), ptr("a", "derived", "z.png")])
        self.assertEqual(resolved["a"]["tier"], "verified")
        self.assertEqual(resolved["a"]["target"]["path"], "y.png")
        self.assertEqual(resolved["a"]["alternates"], 2)

    def test_same_tier_identical_targets_collapse(self):
        resolved = pointers.merge([ptr("a", path="x.png"), ptr("a", path="x.png")])
        self.assertEqual(resolved["a"]["alternates"], 1)

    def test_same_tier_conflict_raises(self):
        with self.assertRaises(pointers.PointerError):
            pointers.merge([ptr("a", path="x.png"), ptr("a", path="y.png")])

    def test_lower_tier_conflict_is_ignored(self):
        resolved = pointers.merge([ptr("a", "verified", "x.png"), ptr("a", "inferred", "y.png"), ptr("a", "inferred", "z.png")])
        self.assertEqual(resolved["a"]["target"]["path"], "x.png")

    def test_empty(self):
        self.assertEqual(pointers.merge([]), {})


class JoinCoverageTests(unittest.TestCase):
    ITEMS = [
        {"id": "q1", "type": "mc", "in_scope": True},
        {"id": "q2", "type": "mc", "in_scope": True},
        {"id": "q3", "type": "lq", "in_scope": True},
        {"id": "q4", "type": "lq", "in_scope": False},
    ]

    def test_join(self):
        resolved = pointers.merge([ptr("q1")])
        joined = pointers.join_items(self.ITEMS, resolved)
        self.assertEqual(joined[0]["answer_pointer"]["item_id"], "q1")
        self.assertIsNone(joined[1]["answer_pointer"])
        self.assertNotIn("answer_pointer", self.ITEMS[0])

    def test_coverage_counts_in_scope_only(self):
        resolved = pointers.merge([ptr("q1", "verified"), ptr("q3", "inferred"), ptr("q4", "verified")])
        report = pointers.coverage(self.ITEMS, resolved)
        self.assertEqual(report["mc"], {"total": 2, "covered": 1, "missing": 1, "pct": 50.0, "tiers": {"verified": 1, "derived": 0, "inferred": 0}})
        self.assertEqual(report["lq"]["total"], 1)
        self.assertEqual(report["all"]["covered"], 2)
        self.assertEqual(report["all"]["tiers"], {"verified": 1, "derived": 0, "inferred": 1})


class StagedStoreTests(unittest.TestCase):
    def test_tracked_stores_are_valid_and_resolve(self):
        self.assertEqual(pointers.check(), [])

    def test_item_universe_ids(self):
        qb = pointers.load_items("qb")
        self.assertEqual(len(qb), 3847)
        self.assertEqual(sum(1 for i in qb if i["in_scope"]), 1881)
        dse = {i["id"] for i in pointers.load_items("dse")}
        self.assertIn("dse-mc-2012-1", dse)
        self.assertIn("dse-lq-2012-q1", dse)


class CheckTests(unittest.TestCase):
    def run_check(self, corpus: str, plist: list[dict]) -> list[str]:
        with tempfile.TemporaryDirectory() as tmp:
            store = Path(tmp) / f"{corpus}.json"
            store.write_text(json.dumps({"schema": pointers.SCHEMA_ID, "corpus": corpus, "pointers": plist}), encoding="utf-8")
            with mock.patch.object(pointers, "POINTERS_DIR", Path(tmp)):
                return pointers.check((corpus,))

    def test_unknown_item_and_missing_target(self):
        problems = self.run_check("dse", [ptr("dse-mc-1999-1", path="qb-web-ui-staging/nope.png")])
        self.assertTrue(any("not in dse staging index" in p for p in problems))
        self.assertTrue(any("does not exist" in p for p in problems))

    def test_generated_root_target_not_required_on_disk(self):
        self.assertEqual(self.run_check("dse", [ptr("dse-mc-2012-1", path="tests/sections/mc/x.png")]), [])

    def test_valid_pointer_passes(self):
        self.assertEqual(self.run_check("dse", [ptr("dse-mc-2012-1", "verified", "qb-web-ui-staging/dse-mc/crops/2012/q01.png")]), [])

    def test_conflict_reported(self):
        plist = [ptr("dse-mc-2012-1", path="tests/a.png"), ptr("dse-mc-2012-1", path="tests/b.png")]
        self.assertTrue(any("conflicting" in p for p in self.run_check("dse", plist)))


if __name__ == "__main__":
    unittest.main()
