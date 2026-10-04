"""derive_keys.py unanimity logic plus the tracked derived-keys contract."""
from __future__ import annotations

import importlib.machinery
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DERIVED_KEYS = ROOT / "metadata" / "derived_keys.json"


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


derive_keys = load_module("derive_keys", ROOT / "scripts" / "derive_keys.py")


class TestUnanimity(unittest.TestCase):
    def test_mc_unanimous(self) -> None:
        runs = [
            {"option": "B", "reasoning": "x"},
            {"option": "B", "reasoning": "y"},
            {"option": "B", "reasoning": "z"},
        ]
        self.assertEqual(derive_keys.mc_unanimous(runs), "B")

    def test_mc_dissent_withholds(self) -> None:
        runs = [
            {"option": "B", "reasoning": "x"},
            {"option": "C", "reasoning": "y"},
            {"option": "B", "reasoning": "z"},
        ]
        self.assertIsNone(derive_keys.mc_unanimous(runs))

    def test_mc_null_withholds(self) -> None:
        runs = [
            {"option": "B", "reasoning": "x"},
            {"option": None, "reasoning": ""},
            {"option": "B", "reasoning": "z"},
        ]
        self.assertIsNone(derive_keys.mc_unanimous(runs))

    def test_parse_mc_run_json(self) -> None:
        run = derive_keys.parse_mc_run('noise {"option": "c", "reasoning": "r"} tail')
        self.assertEqual(run["option"], "C")

    def test_parse_mc_run_garbage(self) -> None:
        run = derive_keys.parse_mc_run("no json here")
        self.assertIsNone(run["option"])

    def test_lq_unanimous_numeric_tolerance(self) -> None:
        runs = [
            {"subparts": {"a": "2.10 m", "b": "3 A"}, "worked": "w1"},
            {"subparts": {"a": "2.1 m", "b": "3 a"}, "worked": "w2"},
            {"subparts": {"a": "2.100 m", "b": "3 A"}, "worked": "w3"},
        ]
        self.assertEqual(
            derive_keys.lq_unanimous(runs), {"a": "2.10 m", "b": "3 A"}
        )

    def test_lq_unit_mismatch_withholds(self) -> None:
        runs = [
            {"subparts": {"a": "2.1 m"}, "worked": "w1"},
            {"subparts": {"a": "2.1 km"}, "worked": "w2"},
            {"subparts": {"a": "2.1 m"}, "worked": "w3"},
        ]
        self.assertIsNone(derive_keys.lq_unanimous(runs))

    def test_lq_label_set_mismatch_withholds(self) -> None:
        runs = [
            {"subparts": {"a": "1"}, "worked": "w1"},
            {"subparts": {"a": "1", "b": "2"}, "worked": "w2"},
            {"subparts": {"a": "1"}, "worked": "w3"},
        ]
        self.assertIsNone(derive_keys.lq_unanimous(runs))

    def test_split_mc_text_counts(self) -> None:
        full = "\n".join(
            f"{n}. Question {n} stem\nA. a\nB. b\nC. c\nD. d" for n in range(1, 37)
        )
        chunks = derive_keys.split_mc_text(full, 36)
        self.assertEqual(len(chunks), 36)
        self.assertTrue(all(f"Question {n}" in c for n, c in enumerate(chunks, 1)))


class TestAdjudicationContract(unittest.TestCase):
    """Every LQ target is either settled (3/3 + adjudication record whose
    compared values name the three runs, whose same_value facts match what
    the parser derives from those values, and whose final is one of them) or
    explicitly unsettled with a reason; the board HTML shows both shapes."""

    def setUp(self) -> None:
        self.build = load_module(
            "build_derived_keys_review",
            ROOT / "scripts" / "build_derived_keys_review.py",
        )

    def test_lq_targets_have_adjudication_record(self) -> None:
        store = json.loads(DERIVED_KEYS.read_text(encoding="utf-8"))
        lq = store.get("lq", {})
        self.assertTrue(lq, "store must carry LQ targets")
        for year, questions in lq.items():
            for q, entry in questions.items():
                with self.subTest(year=year, q=q):
                    adj = entry.get("adjudication")
                    self.assertIsNotNone(adj, "every LQ target has an adjudication record")
                    self.assertEqual(adj["board"], ".lavish/derived-keys-review")
                    self.assertTrue(adj["adjudicator"])
                    self.assertRegex(adj["at"], r"^\d{4}-\d{2}-\d{2}$")
                    compared = adj.get("runs_compared")
                    self.assertTrue(compared, "record names the three compared values")
                    facts = adj.get("same_value")
                    self.assertTrue(facts, "record carries a per-subpart same_value fact")
                    runs = entry["runs"]
                    self.assertEqual(len(runs), 3)

                    def normalized(key: str) -> str:
                        return key.replace("(", "").replace(")", "")

                    for label, values in compared.items():
                        self.assertEqual(len(values), 3)
                        for i, run in enumerate(runs):
                            subparts = run.get("subparts") or {}
                            matches = [
                                v
                                for k, v in subparts.items()
                                if normalized(k) == normalized(label)
                            ]
                            self.assertEqual(values[i], matches[0] if matches else "", f"{label} run {i + 1}")
                        self.assertEqual(
                            facts[label],
                            self.build.same_value_of(values),
                            f"same_value {label} must match the parsed claim",
                        )
                    if entry.get("unanimous"):
                        finals = entry.get("final_answers") or {}
                        self.assertTrue(finals)
                        self.assertTrue(adj.get("basis"))
                        self.assertFalse(
                            "formatting-only" in adj["basis"].lower(),
                            "basis must not claim a formatting-only agreement",
                        )
                        for label, final in finals.items():
                            self.assertIn(final, compared[label], f"final {label}")
                        self.assertTrue(
                            all(facts.values()),
                            "a settled target has no differing numeric subpart",
                        )
                    else:
                        self.assertIs(adj.get("settled"), False)
                        self.assertTrue(adj.get("reason"))
                        self.assertIn(
                            "do not agree on the value",
                            adj["reason"],
                            "unsettled reason names the disagreement",
                        )
                        self.assertTrue(
                            any(not v for v in facts.values()) or any(
                                str(v).strip() == ""
                                for label in compared
                                for v in compared[label]
                            ),
                            "unsettled target has a disagreeing or missing run",
                        )

    def test_board_html_shows_adjudication_records(self) -> None:
        store = json.loads(DERIVED_KEYS.read_text(encoding="utf-8"))
        lq = store["lq"]
        settled = next(
            e for year in lq for e in lq[year].values() if e.get("unanimous")
        )
        unsettled = next(
            e for year in lq for e in lq[year].values() if not e.get("unanimous")
        )
        self.assertTrue(settled["unanimous"])
        self.assertIs(unsettled["adjudication"]["settled"], False)
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            self.build.OUT = out
            self.build.IMG = out / "img"
            self.build.IMG.mkdir(parents=True, exist_ok=True)
            cards, summary = self.build.build_cards()
            self.build.write_html(cards, summary)
            html = (out / "index.html").read_text(encoding="utf-8")
        label, values = next(iter(settled["adjudication"]["runs_compared"].items()))
        for v in values:
            self.assertIn(
                self.build.esc(v), html, f"board shows compared run value {v!r}"
            )
        self.assertIn(self.build.esc(settled["final_answers"][label]), html)
        self.assertIn(self.build.esc(settled["adjudication"]["basis"]), html)
        self.assertIn(self.build.esc(unsettled["adjudication"]["reason"]), html)
        self.assertIn(self.build.esc(unsettled["adjudication"]["board"]), html)
        self.assertIn("same value", html)


class TestDerivedKeysContract(unittest.TestCase):
    def test_every_target_recorded(self) -> None:
        self.assertTrue(DERIVED_KEYS.is_file(), "run derive_keys.py derive first")
        store = json.loads(DERIVED_KEYS.read_text(encoding="utf-8"))
        maker = store.get("key_maker", {})
        self.assertEqual(maker.get("runs"), 3)
        for paper in ("mc", "lq"):
            for year in derive_keys.target_years(paper):
                questions = (
                    derive_keys.mc_questions(year)
                    if paper == "mc"
                    else derive_keys.lq_questions(year)
                )
                recorded = store.get(paper, {}).get(year, {})
                with self.subTest(paper=paper, year=year):
                    self.assertEqual(sorted(int(q) for q in recorded), questions)
                    for q in questions:
                        entry = recorded[str(q)]
                        self.assertEqual(len(entry.get("runs", [])), 3)
                        if entry.get("unanimous"):
                            if paper == "mc":
                                self.assertIn(entry.get("option"), ("A", "B", "C", "D"))
                            else:
                                self.assertTrue(entry.get("final_answers"))

    def test_derived_merge_keeps_flag(self) -> None:
        extract = load_module(
            "extract_answer_keys", ROOT / "scripts" / "extract_answer_keys.py"
        )
        merged = extract.load_derived_keys()
        store = json.loads(DERIVED_KEYS.read_text(encoding="utf-8"))
        for year, questions in store.get("mc", {}).items():
            for q, entry in questions.items():
                with self.subTest(year=year, q=q):
                    if entry.get("unanimous") and entry.get("option"):
                        self.assertEqual(
                            merged[year][int(q)]["Correct Option"], entry["option"]
                        )
                        self.assertTrue(merged[year][int(q)]["derived"])
                    else:
                        self.assertNotIn(
                            int(q), merged.get(year, {}), "non-unanimous leaked"
                        )


if __name__ == "__main__":
    unittest.main()
