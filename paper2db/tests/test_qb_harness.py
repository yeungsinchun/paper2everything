"""End-to-end checks on the tracked question-bank data.

These read only tracked files (`metadata/qb`, `metadata/pointers`,
`qb-web-ui-staging` and the shipped `paper2notes/notes/qb` pages), so they run on
a fresh clone with no pipeline run, no DOCX corpus and no third-party package.
They pin the contract the QB harness promises: the staging index, the bank census
and the shipped pages load the same records, every crop the pages reference exists,
and every answer pointer resolves to a real item and a real answer file.
"""
from __future__ import annotations

import json
import re
import sys
import unittest
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
STAGING = ROOT / "qb-web-ui-staging"
NOTES = REPO / "paper2notes" / "notes" / "qb"
sys.path.insert(0, str(ROOT / "scripts"))

import pointers  # noqa: E402

SHIPPED_DATA = (
    "dse_mc.json",
    "dse_lq.json",
    "dse_sections.json",
    "qb_book5.json",
    "qb_503.json",
    "qb_banks.json",
    "qb_deployed.json",
    "qb_full_index.json",
    "qb_index.json",
    "qb_manifest.json",
)
# Shipped files that must reference at least one crop.
CROPPED_DATA = ("dse_mc.json", "dse_lq.json", "qb_book5.json", "qb_503.json")
# The SAP MC paper is classified and shipped with no crops: `paper/mc/sapp1a.pdf`
# has never been split, so it has no staging entries. Shipped records outside
# staging must stay exactly this year.
STAGED_DSE_YEARS_EXCEPTED = {"sap"}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def strings(node):
    if isinstance(node, dict):
        for value in node.values():
            yield from strings(value)
    elif isinstance(node, list):
        for value in node:
            yield from strings(value)
    elif isinstance(node, str):
        yield node


class QbStagingTests(unittest.TestCase):
    """`qb-web-ui-staging/qb` is the item universe the pointer store resolves against."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.index = load(STAGING / "qb" / "items" / "index.json")
        cls.rows = cls.index["items"]
        cls.banks = load(ROOT / "metadata" / "qb" / "banks.json")["banks_detail"]

    def test_index_total_matches_its_rows(self) -> None:
        self.assertEqual(self.index["total"], len(self.rows))
        self.assertEqual(len({row["id"] for row in self.rows}), len(self.rows))

    def test_bank_census_agrees_with_the_staged_index(self) -> None:
        counts = Counter(row["bank"] for row in self.rows)
        for bank in self.banks:
            with self.subTest(bank=bank["id"]):
                self.assertEqual(counts[bank["id"]], bank["expected_items"])
        self.assertEqual(sum(counts.values()), load(ROOT / "metadata" / "qb" / "banks.json")["total_items"])

    def test_per_bank_records_are_the_index_rows(self) -> None:
        by_bank: dict[str, set[str]] = {}
        for path in sorted((STAGING / "qb" / "items").glob("QB_*.json")):
            payload = load(path)
            by_bank[path.stem] = {item["id"] for item in payload["items"]}
            self.assertEqual(payload["count"], len(payload["items"]))
        indexed: dict[str, set[str]] = {}
        for row in self.rows:
            indexed.setdefault(row["bank"], set()).add(row["id"])
        self.assertEqual(by_bank, indexed)

    def test_has_crop_flag_matches_the_staged_crops(self) -> None:
        crops = STAGING / "qb" / "crops"
        for row in self.rows:
            with self.subTest(item=row["id"]):
                self.assertEqual(row["has_crop"], (crops / f"{row['id']}.png").is_file())

    def test_answer_crops_sit_beside_their_question_crop(self) -> None:
        crops = STAGING / "qb" / "crops"
        for path in crops.glob("*.ans.png"):
            with self.subTest(item=path.name[: -len(".ans.png")]):
                self.assertTrue((crops / path.name[: -len(".ans.png")]).with_suffix(".png").is_file())


class AnswerPointerTests(unittest.TestCase):
    """Every resolved pointer names a real item and a real answer artifact."""

    def test_check_passes_on_the_tracked_stores(self) -> None:
        self.assertEqual(pointers.check(), [])

    def test_resolved_pointers_resolve_to_existing_answer_files(self) -> None:
        for corpus in pointers.CORPORA:
            resolved = pointers.resolve_store(corpus)
            with self.subTest(corpus=corpus):
                self.assertTrue(resolved)
                for item_id, pointer in resolved.items():
                    target = pointer["target"]["path"]
                    if target.startswith(pointers.GENERATED_ROOTS):
                        continue
                    with self.subTest(item=item_id):
                        self.assertTrue((ROOT / target).is_file())
                        self.assertEqual(pointers.validate_pointer(pointer, "p"), [])

    def test_every_staged_answer_crop_becomes_a_pointer(self) -> None:
        for corpus in pointers.CORPORA:
            with self.subTest(corpus=corpus):
                resolved = pointers.resolve_store(corpus)
                derived = {pointer["item_id"] for pointer in pointers.derived_pointers(corpus)}
                for item_id in derived:
                    self.assertIn(item_id, resolved)
                self.assertGreater(len(derived), 0)

    def test_coverage_reports_the_staged_items(self) -> None:
        for corpus in pointers.CORPORA:
            with self.subTest(corpus=corpus):
                items = pointers.load_items(corpus)
                report = pointers.coverage(items, pointers.resolve_store(corpus))
                self.assertEqual(report["all"]["total"], sum(1 for item in items if item["in_scope"]))
                self.assertGreater(report["all"]["covered"], 0)


class ShippedPageTests(unittest.TestCase):
    """The shipped QB pages load the same records with no missing file."""

    def test_index_fetches_resolve(self) -> None:
        html = (NOTES / "index.html").read_text(encoding="utf-8")
        markup = re.sub(r"<script\b[\s\S]*?</script>", "", html)
        targets = set(re.findall(r'fetchJSON\("([^"]+)"\)', markup))
        targets |= set(re.findall(r'(?:href|src)="([^"#:]+)"', markup))
        self.assertTrue(targets)
        for target in sorted(targets):
            if target.startswith(("http", "//", "data:")):
                continue
            with self.subTest(target=target):
                self.assertTrue((NOTES / target).exists(), f"{target} 404s from notes/qb/index.html")

    def test_every_shipped_crop_reference_exists(self) -> None:
        for name in SHIPPED_DATA:
            path = NOTES / "data" / name
            with self.subTest(data=name):
                refs = [value for value in strings(load(path)) if value.endswith((".png", ".webp", ".jpg", ".svg"))]
                if name in CROPPED_DATA:
                    self.assertTrue(refs, f"{name} references no crops")
                for ref in refs:
                    if not (NOTES / ref).is_file():
                        self.fail(f"{name} references {ref}, which is not on disk")

    def test_shipped_qb_index_matches_the_staged_index(self) -> None:
        shipped = load(NOTES / "data" / "qb_full_index.json")
        staged = load(STAGING / "qb" / "items" / "index.json")
        self.assertEqual(shipped["total"], staged["total"])
        fields = ("id", "bank", "book", "chapter", "type", "level", "part", "marks", "status", "has_crop")
        self.assertEqual(
            [{key: row[key] for key in fields} for row in shipped["items"]],
            [{key: row[key] for key in fields} for row in staged["items"]],
        )

    def test_shipped_book5_items_match_the_staged_banks(self) -> None:
        shipped = load(NOTES / "data" / "qb_book5.json")["items"]
        staged = {
            row["id"]
            for row in load(STAGING / "qb" / "items" / "index.json")["items"]
            if str(row["book"]) == "5"
        }
        self.assertEqual({item["id"] for item in shipped}, staged)
        counts = Counter(item["bank"] for item in shipped)
        for bank in load(NOTES / "data" / "qb_banks.json")["banks"]:
            if str(bank["book"]) != "5":
                continue
            with self.subTest(bank=bank["bank"]):
                self.assertEqual(counts[bank["bank"]], bank["expectedItems"])

    def test_shipped_dse_records_match_the_staged_indexes(self) -> None:
        # The shipped page stores the raw id ("2012-1"); the harness item space
        # prefixes it with the paper ("dse-mc-2012-1"), as pointers.load_items does.
        staged = {item["id"] for item in pointers.load_items("dse")}
        pairs = (
            ("dse-mc-", load(NOTES / "data" / "dse_mc.json")["items"]),
            ("dse-lq-", load(NOTES / "data" / "dse_lq.json")["items"]),
        )
        for prefix, shipped in pairs:
            ids = {f"{prefix}{item['id']}" for item in shipped}
            staged_paper = {item_id for item_id in staged if item_id.startswith(prefix)}
            with self.subTest(records=len(shipped)):
                unstaged = ids - staged
                self.assertTrue(
                    all(item_id.rsplit("-", 2)[1] in STAGED_DSE_YEARS_EXCEPTED for item_id in unstaged),
                    f"shipped DSE records with no staging entry: {sorted(unstaged)}",
                )
                shipped_with_crop = {f"{prefix}{item['id']}" for item in shipped if item["hasCrop"]}
                self.assertEqual(
                    shipped_with_crop,
                    staged_paper,
                    "staged DSE records missing from the shipped page",
                )

    def test_shipped_records_without_crops_have_no_image(self) -> None:
        for name in ("dse_mc.json", "dse_lq.json"):
            for item in load(NOTES / "data" / name)["items"]:
                with self.subTest(item=item["id"]):
                    self.assertEqual(bool(item.get("image")), bool(item["hasCrop"]))


if __name__ == "__main__":
    unittest.main()