"""Book 2 DB join: invariants over the tracked staging data (no pipeline run needed)."""
from __future__ import annotations

import unittest

from scripts import build_book2_db as db

STAGED = db.STAGING / "dse-mc" / "index.json"


@unittest.skipUnless(STAGED.is_file(), "staging data not present")
class Book2DbTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = [*db.dse_mc_records(), *db.dse_lq_records(), *db.qb_records()]
        cls.checks = db.audit(cls.records)

    def test_qb_corpus_complete(self):
        qb = [r for r in self.records if r["source"] == "qb"]
        self.assertEqual(len(qb), db.EXPECTED_QB_ITEMS)
        self.assertEqual({r["chapter"] for r in qb}, set(range(1, 11)))

    def test_every_record_has_a_topic_and_crop(self):
        for name in ("topic_outside_book2", "crop_missing_or_not_png", "duplicate_ids"):
            self.assertEqual(self.checks[name], [], name)

    def test_chapter_to_section_is_total_and_in_scope(self):
        self.assertEqual(set(db.CHAPTER_SECTION), set(range(1, 11)))
        self.assertTrue(set(db.CHAPTER_SECTION.values()) <= set(db.SECTIONS))

    def test_no_keys_missing_where_a_marking_scheme_exists(self):
        self.assertEqual(self.checks["mc_key_missing"], [])
        self.assertEqual(self.checks["mc_key_not_abcd"], [])

    def test_mc_years_cover_lq_years(self):
        self.assertEqual(self.checks["dse_mc_year_gap"], [])

    def test_qb_written_types_are_lq_kind(self):
        for r in self.records:
            if r["source"] == "qb":
                self.assertEqual(r["kind"], "mc" if r["subtype"] == "mc" else "lq")


if __name__ == "__main__":
    unittest.main()
