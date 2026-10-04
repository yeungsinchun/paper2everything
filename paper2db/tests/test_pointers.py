"""Tests for answer-pointer validation, tier merge, item join, coverage and the CI check."""
from __future__ import annotations

import io
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

    def test_rejects_non_string_tiers(self):
        for tier in ([], {}, None, True, 1, 1.5):
            with self.subTest(tier=tier):
                self.assertEqual(
                    pointers.validate_pointer({**ptr("a"), "tier": tier}, "p"),
                    ["p: tier must be one of ['derived', 'inferred', 'verified']"],
                )

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
        winner = ptr("a", "verified", "y.png")
        resolved = pointers.merge([ptr("a", "inferred", "x.png"), winner, ptr("a", "derived", "z.png")])
        self.assertEqual(resolved, {"a": winner})
        self.assertIsNot(resolved["a"], winner)

    def test_same_tier_identical_targets_collapse(self):
        winner = ptr("a", path="x.png")
        resolved = pointers.merge([winner, ptr("a", path="x.png")])
        self.assertEqual(resolved, {"a": winner})
        self.assertIsNot(resolved["a"], winner)

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
        self.assertEqual(joined[0]["answer_pointer"], ptr("q1"))
        self.assertIsNone(joined[1]["answer_pointer"])
        self.assertNotIn("answer_pointer", self.ITEMS[0])

    def test_coverage_counts_in_scope_only(self):
        resolved = pointers.merge([ptr("q1", "verified"), ptr("q3", "inferred"), ptr("q4", "verified")])
        report = pointers.coverage(self.ITEMS, resolved)
        self.assertEqual(report["mc"], {"total": 2, "covered": 1, "missing": 1, "pct": 50.0, "tiers": {"verified": 1, "derived": 0, "inferred": 0}})
        self.assertEqual(report["lq"]["total"], 1)
        self.assertEqual(report["all"]["covered"], 2)
        self.assertEqual(report["all"]["tiers"], {"verified": 1, "derived": 0, "inferred": 1})


class CommandTests(unittest.TestCase):
    def setUp(self):
        tmp = self.enterContext(tempfile.TemporaryDirectory())
        directory = Path(tmp)
        self.enterContext(mock.patch.object(pointers, "POINTERS_DIR", directory))
        # These tests cover command plumbing: the staged answer crops of the real
        # tree would add derived pointers to every resolved set.
        self.enterContext(mock.patch.object(pointers, "derived_pointers", return_value=[]))
        self.winner = ptr("q1", "verified", "y.png")
        stores = {
            "qb": [],
            "dse": [ptr("q1", "inferred", "x.png"), self.winner, dict(self.winner)],
        }
        for corpus, records in stores.items():
            (directory / f"{corpus}.json").write_text(
                json.dumps({"schema": pointers.SCHEMA_ID, "corpus": corpus, "pointers": records}),
                encoding="utf-8",
            )

    def test_merge_json_stdout(self):
        expected = {"qb": [], "dse": [self.winner]}
        for corpora in (pointers.CORPORA, ("qb",), ("dse",)):
            with self.subTest(corpora=corpora):
                argv = ["merge"] + (["--corpus", corpora[0]] if len(corpora) == 1 else [])
                with mock.patch("sys.stdout", new_callable=io.StringIO) as stdout:
                    self.assertEqual(pointers.main(argv), 0)
                self.assertEqual(json.loads(stdout.getvalue()), {c: expected[c] for c in corpora})

    def test_coverage_text_report(self):
        items = [{"id": "q1", "type": "mc", "in_scope": True}]
        expected = {
            "qb": "[qb] in-scope items with an answer pointer\n"
                  "  (0 tracked, 0 derived from staged answer crops)\n"
                  "  mc       0/1       0.0%  verified=0 derived=0 inferred=0\n"
                  "  all      0/1       0.0%  verified=0 derived=0 inferred=0\n",
            "dse": "[dse] in-scope items with an answer pointer\n"
                   "  (1 tracked, 0 derived from staged answer crops)\n"
                   "  mc       1/1     100.0%  verified=1 derived=0 inferred=0\n"
                   "  all      1/1     100.0%  verified=1 derived=0 inferred=0\n",
        }
        for corpora in (pointers.CORPORA, ("qb",), ("dse",)):
            with self.subTest(corpora=corpora):
                argv = ["coverage"] + (["--corpus", corpora[0]] if len(corpora) == 1 else [])
                with mock.patch.object(pointers, "load_items", return_value=items) as load_items:
                    with mock.patch("sys.stdout", new_callable=io.StringIO) as stdout:
                        self.assertEqual(pointers.main(argv), 0)
                self.assertEqual(stdout.getvalue(), "".join(expected[c] for c in corpora))
                self.assertEqual(load_items.call_args_list, [mock.call(c) for c in corpora])

    def test_malformed_tiers_fail_cleanly_in_all_commands(self):
        for corpus in pointers.CORPORA:
            for tier in ([], {}):
                store = {"schema": pointers.SCHEMA_ID, "corpus": corpus,
                         "pointers": [{**ptr("q1"), "tier": tier}]}
                pointers.store_path(corpus).write_text(json.dumps(store), encoding="utf-8")
                for command in ("merge", "coverage", "check"):
                    with self.subTest(corpus=corpus, tier=tier, command=command):
                        with mock.patch("sys.stdout", new_callable=io.StringIO) as stdout:
                            with mock.patch("sys.stderr", new_callable=io.StringIO) as stderr:
                                self.assertEqual(pointers.main([command, "--corpus", corpus]), 1)
                        self.assertEqual(stdout.getvalue(), "")
                        self.assertIn(
                            f"{corpus}.json pointers[0]: tier must be one of",
                            stderr.getvalue(),
                        )

    def test_removed_options_are_rejected_before_execution(self):
        for argv in (
            ["merge", "--out", str(pointers.POINTERS_DIR / "merged.json")],
            ["coverage", "--json"],
            ["coverage", "--min-pct", "50"],
        ):
            with self.subTest(argv=argv):
                with mock.patch.object(pointers, "merge_all") as merge_all:
                    with mock.patch("sys.stderr", new_callable=io.StringIO):
                        with self.assertRaises(SystemExit) as raised:
                            pointers.main(argv)
                self.assertEqual(raised.exception.code, 2)
                merge_all.assert_not_called()
        self.assertFalse((pointers.POINTERS_DIR / "merged.json").exists())


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

    def test_derived_pointers_resolve_to_real_items_and_files(self):
        for corpus in pointers.CORPORA:
            with self.subTest(corpus=corpus):
                known = {item["id"] for item in pointers.load_items(corpus)}
                records = pointers.derived_pointers(corpus)
                self.assertTrue(records, "staged answer crops should yield pointers")
                for pointer in records:
                    self.assertEqual(pointers.validate_pointer(pointer, "p"), [])
                    self.assertIn(pointer["item_id"], known)
                    self.assertEqual(pointer["tier"], "derived")
                    self.assertEqual(pointer["kind"], "crop")
                    self.assertTrue((ROOT / pointer["target"]["path"]).is_file())

    def test_staged_answer_crops_cover_the_in_scope_items_they_can(self):
        for corpus in pointers.CORPORA:
            with self.subTest(corpus=corpus):
                items = pointers.load_items(corpus)
                resolved = pointers.resolve_store(corpus)
                report = pointers.coverage(items, resolved)
                expected = sum(1 for item in items if item["in_scope"] and item["id"] in resolved)
                self.assertEqual(report["all"]["covered"], expected)
                self.assertEqual(report["all"]["missing"], report["all"]["total"] - expected)
                self.assertGreater(report["all"]["pct"], 0.0)


class ResolveStoreTests(unittest.TestCase):
    def write_store(self, directory: Path, corpus: str, records: list[dict]) -> Path:
        store = directory / f"{corpus}.json"
        store.write_text(
            json.dumps({"schema": pointers.SCHEMA_ID, "corpus": corpus, "pointers": records}),
            encoding="utf-8",
        )
        return store

    def test_tracked_record_wins_over_derived(self):
        tracked = ptr("PHY11011101", "derived", "qb-web-ui-staging/qb/crops/other.png")
        with tempfile.TemporaryDirectory() as tmp:
            store = self.write_store(Path(tmp), "qb", [tracked])
            records = pointers.pointer_records("qb", store)
            resolved = pointers.resolve_store("qb", store)
        self.assertEqual(resolved["PHY11011101"]["target"]["path"], "qb-web-ui-staging/qb/crops/other.png")
        self.assertEqual(sum(1 for r in records if r["item_id"] == "PHY11011101"), 1)

    def test_verified_record_wins_by_tier(self):
        winner = ptr("PHY11011101", "verified", "paper/ans/2012ans.pdf", page=3)
        with tempfile.TemporaryDirectory() as tmp:
            store = self.write_store(Path(tmp), "qb", [winner])
            resolved = pointers.resolve_store("qb", store)
        self.assertEqual(resolved["PHY11011101"], winner)

    def test_unknown_corpus_has_no_derived_pointers(self):
        with self.assertRaises(pointers.PointerError):
            pointers.derived_pointers("mc")


class CheckTests(unittest.TestCase):
    def run_check(self, corpus: str, plist: list[dict]) -> list[str]:
        with tempfile.TemporaryDirectory() as tmp:
            store = Path(tmp) / f"{corpus}.json"
            store.write_text(json.dumps({"schema": pointers.SCHEMA_ID, "corpus": corpus, "pointers": plist}), encoding="utf-8")
            with mock.patch.object(pointers, "POINTERS_DIR", Path(tmp)):
                return pointers.check((corpus,))

    def test_malformed_tiers_do_not_abort_other_records_or_corpora(self):
        stores = {
            "qb": [{**ptr("a"), "tier": []}, {**ptr("b"), "tier": {}, "kind": "video"}],
            "dse": [ptr("dse-mc-1999-1", path="tests/a.png")],
        }
        with tempfile.TemporaryDirectory() as tmp:
            for corpus, records in stores.items():
                (Path(tmp) / f"{corpus}.json").write_text(
                    json.dumps({"schema": pointers.SCHEMA_ID, "corpus": corpus, "pointers": records}),
                    encoding="utf-8",
                )
            with mock.patch.object(pointers, "POINTERS_DIR", Path(tmp)):
                problems = pointers.check()
        self.assertEqual(problems, [
            "qb.json pointers[0]: tier must be one of ['derived', 'inferred', 'verified']",
            "qb.json pointers[1]: tier must be one of ['derived', 'inferred', 'verified']",
            "qb.json pointers[1]: kind must be one of ['crop', 'page', 'pdf']",
            "dse.json pointers[0] (dse-mc-1999-1): item_id not in dse staging index",
        ])

    def test_unknown_item_and_missing_target(self):
        problems = self.run_check("dse", [ptr("dse-mc-1999-1", path="qb-web-ui-staging/nope.png")])
        self.assertTrue(any("not in dse staging index" in p for p in problems))
        self.assertTrue(any("does not exist" in p for p in problems))

    def test_generated_root_target_not_required_on_disk(self):
        self.assertEqual(self.run_check("dse", [ptr("dse-mc-2012-1", path="tests/sections/mc/x.png")]), [])

    def test_valid_pointer_passes(self):
        self.assertEqual(self.run_check("dse", [ptr("dse-mc-2012-1", "verified", "qb-web-ui-staging/dse-mc/crops/2012/q01.png")]), [])

    def test_derived_missing_answer_crop_is_reported(self):
        # A derived pointer is built from the staging tree, so its target exists by
        # construction; losing the crop file must not go unnoticed.
        with tempfile.TemporaryDirectory() as tmp:
            store = Path(tmp) / "qb.json"
            store.write_text(
                json.dumps({"schema": pointers.SCHEMA_ID, "corpus": "qb", "pointers": []}),
                encoding="utf-8",
            )
            missing = pointers.derived_pointers("qb")[0]
            with mock.patch.object(pointers, "derived_pointers", return_value=[missing]):
                with mock.patch.object(pointers, "ROOT", Path(tmp)):
                    problems = pointers.check(("qb",))
        self.assertIn(f"derived pointers[0] ({missing['item_id']}): target {missing['target']['path']} does not exist", problems)

    def test_conflict_reported(self):
        plist = [ptr("dse-mc-2012-1", path="tests/a.png"), ptr("dse-mc-2012-1", path="tests/b.png")]
        self.assertTrue(any("conflicting" in p for p in self.run_check("dse", plist)))


if __name__ == "__main__":
    unittest.main()
