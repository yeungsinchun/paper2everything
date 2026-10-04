#!/usr/bin/env python3
"""Answer-pointer store: merge by tier, join to qb/dse items, coverage and CI check.

Pointers live in tracked `metadata/pointers/{qb,dse}.json` (`schemas/answer-pointer.v1.json`).
Several pointers may exist per item; `merge` keeps the highest tier
(verified > derived > inferred). Two different targets at the same top tier are a conflict.

Pointers that need no hand editing are derived from the tracked staging tree: every
staged question crop with an answer crop beside it gets a `derived` `crop` pointer at
that file. A tracked record for the same item wins, so the store stays the place for
reviewed pointers and `derive` shows what the staging tree alone gives.

Item universes come from the tracked staging indexes under `qb-web-ui-staging/`:
  qb   qb/items/index.json   (id as-is; in-scope banks from metadata/qb/banks.json)
  dse  dse-mc/index.json     (id as-is, e.g. dse-mc-2012-1)
       dse-lq/index.json     (id prefixed, e.g. dse-lq-2012-q1)

Commands:
  pointers.py merge [--corpus qb|dse]      resolved pointer per item as JSON
  pointers.py derive [--corpus qb|dse]     pointers computed from the staged answer crops
  pointers.py coverage [--corpus qb|dse]   per corpus/type counts by tier
  pointers.py check [--corpus qb|dse]      CI resolver; exit 1 on any problem
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from qb_banks import get_in_scope_banks  # noqa: E402

SCHEMA_ID = "paper2db.answer-pointer.v1"
POINTERS_DIR = ROOT / "metadata" / "pointers"
STAGING = ROOT / "qb-web-ui-staging"
STAGING_REL = STAGING.relative_to(ROOT).as_posix()
CORPORA = ("qb", "dse")
# Higher rank wins on merge.
TIERS = {"verified": 3, "derived": 2, "inferred": 1}
KINDS = ("crop", "page", "pdf")
DERIVED_SOURCE = "scripts/pointers.py derive (staged answer crop)"
# Where each corpus stages an answer crop next to its question crop. dse-mc has
# none: an MC item's answer is the correct option in the generated answer-key file.
DERIVED_CROPS = {
    "qb": {
        "index": STAGING / "qb" / "items" / "index.json",
        "crops": f"{STAGING_REL}/qb/crops",
        "suffix": ".ans.png",
        "prefix": "",
    },
    "dse": {
        "index": STAGING / "dse-lq" / "index.json",
        "crops": f"{STAGING_REL}/dse-lq/crops",
        "suffix": "-ans.png",
        "prefix": "dse-lq-",
    },
}
# Skip target existence checks for local/generated artifacts and source-paper roots;
# CI must resolve stores without requiring those artifacts on disk.
GENERATED_ROOTS = ("tests/", "intermediate/", "qb-pdf/", "qb/", "paper/")
POINTER_KEYS = {"item_id", "tier", "kind", "target", "source", "note"}
TARGET_KEYS = {"path", "page", "bbox"}


class PointerError(ValueError):
    """Invalid pointer store or conflicting pointers."""


def store_path(corpus: str) -> Path:
    return POINTERS_DIR / f"{corpus}.json"


def _is_number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def validate_pointer(pointer: object, where: str) -> list[str]:
    """Return problems for one pointer record (mirrors schemas/answer-pointer.v1.json)."""
    if not isinstance(pointer, dict):
        return [f"{where}: not an object"]
    problems: list[str] = []
    for key in sorted(set(pointer) - POINTER_KEYS):
        problems.append(f"{where}: unknown key {key!r}")
    for key in ("item_id", "source"):
        if not isinstance(pointer.get(key), str) or not pointer[key]:
            problems.append(f"{where}: {key} must be a non-empty string")
    if not isinstance(pointer.get("tier"), str) or pointer["tier"] not in TIERS:
        problems.append(f"{where}: tier must be one of {sorted(TIERS)}")
    if pointer.get("kind") not in KINDS:
        problems.append(f"{where}: kind must be one of {list(KINDS)}")
    if "note" in pointer and not isinstance(pointer["note"], str):
        problems.append(f"{where}: note must be a string")
    target = pointer.get("target")
    if not isinstance(target, dict):
        problems.append(f"{where}: target must be an object")
        return problems
    for key in sorted(set(target) - TARGET_KEYS):
        problems.append(f"{where}: unknown target key {key!r}")
    path = target.get("path")
    if not isinstance(path, str) or not path:
        problems.append(f"{where}: target.path must be a non-empty string")
    elif path.startswith("/") or "\\" in path or ".." in path.split("/"):
        problems.append(f"{where}: target.path must be relative to paper2db/ with forward slashes and no '..'")
    page = target.get("page")
    if "page" in target and (not isinstance(page, int) or isinstance(page, bool) or page < 1):
        problems.append(f"{where}: target.page must be an integer >= 1")
    if "bbox" in target:
        bbox = target["bbox"]
        if (
            not isinstance(bbox, list)
            or len(bbox) != 4
            or not all(_is_number(v) and 0 <= v <= 1 for v in bbox)
        ):
            problems.append(f"{where}: target.bbox must be 4 numbers in [0, 1]")
        elif not (bbox[0] < bbox[2] and bbox[1] < bbox[3]):
            problems.append(f"{where}: target.bbox must satisfy x0<x1 and y0<y1")
    return problems


def validate_store(data: object, corpus: str, label: str) -> list[str]:
    if not isinstance(data, dict):
        return [f"{label}: not an object"]
    problems: list[str] = []
    for key in sorted(set(data) - {"schema", "corpus", "pointers"}):
        problems.append(f"{label}: unknown key {key!r}")
    if data.get("schema") != SCHEMA_ID:
        problems.append(f"{label}: schema must be {SCHEMA_ID!r}")
    if data.get("corpus") != corpus:
        problems.append(f"{label}: corpus must be {corpus!r}, got {data.get('corpus')!r}")
    pointers = data.get("pointers")
    if not isinstance(pointers, list):
        problems.append(f"{label}: pointers must be an array")
        return problems
    for idx, pointer in enumerate(pointers):
        problems.extend(validate_pointer(pointer, f"{label} pointers[{idx}]"))
    return problems


def load_store(corpus: str, path: Path | None = None) -> list[dict]:
    target = path if path is not None else store_path(corpus)
    try:
        data = json.loads(target.read_text(encoding="utf-8"))
    except FileNotFoundError as e:
        raise PointerError(f"{target} missing") from e
    except json.JSONDecodeError as e:
        raise PointerError(f"{target} invalid JSON: {e}") from e
    problems = validate_store(data, corpus, target.name)
    if problems:
        raise PointerError("\n".join(problems))
    return data["pointers"]


def _target_key(pointer: dict) -> tuple:
    target = pointer["target"]
    bbox = target.get("bbox")
    return (pointer["kind"], target["path"], target.get("page"), tuple(bbox) if bbox else None)


def merge(pointers: list[dict]) -> dict[str, dict]:
    """Resolve to one pointer per item_id: highest tier wins.

    Identical targets at the top tier collapse; different targets there raise PointerError.
    The resolved pointer is a copy of the winning pointer.
    """
    by_item: dict[str, list[dict]] = {}
    for pointer in pointers:
        by_item.setdefault(pointer["item_id"], []).append(pointer)
    resolved: dict[str, dict] = {}
    for item_id in sorted(by_item):
        candidates = by_item[item_id]
        top = max(TIERS[p["tier"]] for p in candidates)
        winners = [p for p in candidates if TIERS[p["tier"]] == top]
        if len({_target_key(p) for p in winners}) > 1:
            tier = winners[0]["tier"]
            raise PointerError(f"{item_id}: {len(winners)} conflicting {tier} pointers with different targets")
        resolved[item_id] = dict(winners[0])
    return resolved


def merge_all(corpora: tuple[str, ...] = CORPORA) -> dict[str, dict[str, dict]]:
    return {corpus: resolve_store(corpus) for corpus in corpora}


def derived_pointers(corpus: str) -> list[dict]:
    """Pointers to the answer crop staged beside each question crop.

    These are computed, not authored: every item in the staged index whose answer
    crop exists gets one `derived` record, so resolution never depends on hand
    editing. Items whose corpus stages no answer crop get nothing.
    """
    spec = DERIVED_CROPS.get(corpus)
    if spec is None:
        raise PointerError(f"no staged answer crops for corpus {corpus!r}")
    suffix = spec["suffix"]
    crop_dir = ROOT / spec["crops"]
    names = {path.name[: -len(suffix)] for path in crop_dir.glob(f"*{suffix}")}
    index = _load_json(spec["index"])
    rows = index["items"] if isinstance(index, dict) else index
    return [
        {
            "item_id": f"{spec['prefix']}{row['id']}",
            "tier": "derived",
            "kind": "crop",
            "target": {"path": f"{spec['crops']}/{row['id']}{suffix}"},
            "source": DERIVED_SOURCE,
        }
        for row in rows
        if row["id"] in names
    ]


def resolve_store(corpus: str, path: Path | None = None) -> dict[str, dict]:
    """One pointer per item_id: tracked records win, staged answer crops fill the rest."""
    return merge(pointer_records(corpus, path))


def pointer_records(corpus: str, path: Path | None = None) -> list[dict]:
    """Tracked records plus the derived ones no tracked record covers."""
    records = load_store(corpus, path)
    tracked = {record["item_id"] for record in records}
    return records + [
        pointer for pointer in derived_pointers(corpus) if pointer["item_id"] not in tracked
    ]


def _load_json(path: Path) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as e:
        raise PointerError(f"{path} missing (item universe)") from e
    except json.JSONDecodeError as e:
        raise PointerError(f"{path} invalid JSON: {e}") from e


def load_items(corpus: str) -> list[dict]:
    """Staged items for a corpus, with normalized `id`, `type` and `in_scope`."""
    items: list[dict] = []
    if corpus == "qb":
        data = _load_json(STAGING / "qb" / "items" / "index.json")
        in_scope = get_in_scope_banks()
        for raw in data["items"]:
            items.append({**raw, "in_scope": raw["bank"] in in_scope})
    elif corpus == "dse":
        for raw in _load_json(STAGING / "dse-mc" / "index.json"):
            items.append({**raw, "in_scope": True})
        for raw in _load_json(STAGING / "dse-lq" / "index.json")["items"]:
            items.append({**raw, "id": f"dse-lq-{raw['id']}", "type": "lq", "in_scope": True})
    else:
        raise PointerError(f"unknown corpus {corpus!r}")
    return items


def join_items(items: list[dict], resolved: dict[str, dict]) -> list[dict]:
    """Copy items with `answer_pointer` set to the resolved pointer or None."""
    return [{**item, "answer_pointer": resolved.get(item["id"])} for item in items]


def coverage(items: list[dict], resolved: dict[str, dict]) -> dict:
    """Counts of in-scope items per type with and without a resolved pointer."""
    by_type: dict[str, dict] = {}
    for item in items:
        if not item["in_scope"]:
            continue
        row = by_type.setdefault(item["type"], {"total": 0, "covered": 0, "tiers": Counter()})
        row["total"] += 1
        pointer = resolved.get(item["id"])
        if pointer:
            row["covered"] += 1
            row["tiers"][pointer["tier"]] += 1
    out = {}
    for typ, row in sorted(by_type.items()):
        out[typ] = {
            "total": row["total"],
            "covered": row["covered"],
            "missing": row["total"] - row["covered"],
            "pct": round(100 * row["covered"] / row["total"], 1),
            "tiers": {tier: row["tiers"].get(tier, 0) for tier in TIERS},
        }
    rows = list(out.values())
    total = sum(r["total"] for r in rows)
    covered = sum(r["covered"] for r in rows)
    out["all"] = {
        "total": total,
        "covered": covered,
        "missing": total - covered,
        "pct": round(100 * covered / total, 1) if total else 0.0,
        "tiers": {tier: sum(r["tiers"][tier] for r in rows) for tier in TIERS},
    }
    return out


def check(corpora: tuple[str, ...] = CORPORA) -> list[str]:
    """Validate records, item IDs and merge conflicts; check targets outside GENERATED_ROOTS."""
    problems: list[str] = []
    for corpus in corpora:
        try:
            tracked = load_store(corpus)
            records = pointer_records(corpus)
        except PointerError as e:
            problems.extend(str(e).splitlines())
            continue
        try:
            known = {item["id"] for item in load_items(corpus)}
        except PointerError as e:
            problems.append(str(e))
            continue
        # Tracked records are validated by load_store; derived ones are built here,
        # so validate_pointer is the only check they have been through.
        for idx, pointer in enumerate(records):
            derived = idx >= len(tracked)
            label = "derived" if derived else f"{corpus}.json"
            where = f"{label} pointers[{idx}] ({pointer['item_id']})"
            if derived:
                problems.extend(validate_pointer(pointer, where))
            if pointer["item_id"] not in known:
                problems.append(f"{where}: item_id not in {corpus} staging index")
            path = pointer["target"]["path"]
            if not path.startswith(GENERATED_ROOTS) and not (ROOT / path).is_file():
                problems.append(f"{where}: target {path} does not exist")
        try:
            merge(records)
        except PointerError as e:
            problems.append(f"{corpus}.json: {e}")
    return problems


def _selected(corpus: str | None) -> tuple[str, ...]:
    return (corpus,) if corpus else CORPORA


def cmd_merge(args: argparse.Namespace) -> int:
    out = {corpus: list(resolved.values()) for corpus, resolved in merge_all(_selected(args.corpus)).items()}
    text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
    sys.stdout.write(text)
    return 0


def cmd_derive(args: argparse.Namespace) -> int:
    out = {corpus: derived_pointers(corpus) for corpus in _selected(args.corpus)}
    sys.stdout.write(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    return 0


def cmd_coverage(args: argparse.Namespace) -> int:
    report: dict[str, dict] = {}
    provenance: dict[str, tuple[int, int]] = {}
    for corpus, resolved in merge_all(_selected(args.corpus)).items():
        report[corpus] = coverage(load_items(corpus), resolved)
        tracked = {record["item_id"] for record in load_store(corpus)}
        provenance[corpus] = (
            len(tracked),
            sum(1 for item_id in resolved if item_id not in tracked),
        )
    for corpus, rows in report.items():
        tracked, derived = provenance[corpus]
        print(f"[{corpus}] in-scope items with an answer pointer")
        print(f"  ({tracked} tracked, {derived} derived from staged answer crops)")
        for typ, row in rows.items():
            tiers = " ".join(f"{t}={n}" for t, n in row["tiers"].items())
            print(f"  {typ:<4} {row['covered']:>5}/{row['total']:<5} {row['pct']:>5}%  {tiers}")
    return 0


def cmd_check(args: argparse.Namespace) -> int:
    problems = check(_selected(args.corpus))
    for problem in problems:
        print(f"FAIL {problem}", file=sys.stderr)
    if problems:
        return 1
    counts = {corpus: len(resolve_store(corpus)) for corpus in _selected(args.corpus)}
    detail = ", ".join(f"{corpus}={count}" for corpus, count in counts.items())
    print(f"pointers ok ({detail} items resolved)")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    for name, fn, helptext in (
        ("merge", cmd_merge, "print merged pointers per item"),
        ("derive", cmd_derive, "print pointers computed from the staged answer crops"),
        ("coverage", cmd_coverage, "report pointer coverage of in-scope items"),
        ("check", cmd_check, "validate stores against staged items (CI)"),
    ):
        p = sub.add_parser(name, help=helptext)
        p.add_argument("--corpus", choices=CORPORA, default=None)
        p.set_defaults(fn=fn)
    args = parser.parse_args(argv)
    try:
        return args.fn(args)
    except PointerError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
