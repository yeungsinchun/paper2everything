from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANKS_JSON = ROOT / "metadata" / "qb" / "banks.json"


def _validate_banks_data(data: dict, path: Path) -> dict:
    detail = data.get("banks_detail")
    if not isinstance(detail, list) or not detail:
        raise SystemExit(f"{path} missing or invalid banks_detail")
    seen: set[str] = set()
    sum_docx = 0
    sum_items = 0
    sum_in_scope_items = 0
    in_scope: set[str] = set()
    for idx, entry in enumerate(detail):
        if not isinstance(entry, dict):
            raise SystemExit(f"{path} banks_detail[{idx}] not an object")
        bid = entry.get("id")
        if not isinstance(bid, str) or not bid.startswith("QB_"):
            raise SystemExit(f"{path} banks_detail[{idx}] invalid id: {bid!r}")
        if bid in seen:
            raise SystemExit(f"{path} banks_detail[{idx}] duplicate id: {bid!r}")
        seen.add(bid)
        expected_docx = entry.get("expected_docx")
        if not isinstance(expected_docx, int) or expected_docx <= 0:
            raise SystemExit(f"{path} banks_detail[{idx}] {bid} invalid expected_docx: {expected_docx!r}")
        expected_items = entry.get("expected_items")
        if not isinstance(expected_items, int) or expected_items <= 0:
            raise SystemExit(f"{path} banks_detail[{idx}] {bid} invalid expected_items: {expected_items!r}")
        in_scope_flag = entry.get("in_scope")
        if not isinstance(in_scope_flag, bool):
            raise SystemExit(f"{path} banks_detail[{idx}] {bid} invalid in_scope: {in_scope_flag!r}")
        sum_docx += expected_docx
        sum_items += expected_items
        if in_scope_flag:
            sum_in_scope_items += expected_items
            in_scope.add(bid)
    if not in_scope:
        raise SystemExit(f"{path} no in_scope banks")
    total_docx = data.get("total_docx")
    if not isinstance(total_docx, int) or total_docx <= 0:
        raise SystemExit(f"{path} missing or invalid total_docx")
    if total_docx != sum_docx:
        raise SystemExit(f"{path} total_docx {total_docx} != sum expected_docx {sum_docx}")
    banks_count = data.get("banks")
    if not isinstance(banks_count, int) or banks_count <= 0:
        raise SystemExit(f"{path} missing or invalid banks")
    if banks_count != len(detail):
        raise SystemExit(f"{path} banks {banks_count} != len(banks_detail) {len(detail)}")
    total_items = data.get("total_items")
    if not isinstance(total_items, int) or total_items <= 0:
        raise SystemExit(f"{path} missing or invalid total_items")
    if total_items != sum_items:
        raise SystemExit(f"{path} total_items {total_items} != sum expected_items {sum_items}")
    in_scope_items = data.get("in_scope_items")
    if not isinstance(in_scope_items, int) or in_scope_items <= 0:
        raise SystemExit(f"{path} missing or invalid in_scope_items")
    if in_scope_items != sum_in_scope_items:
        raise SystemExit(f"{path} in_scope_items {in_scope_items} != sum in_scope expected_items {sum_in_scope_items}")
    return data


def load_banks(path: Path | None = None) -> dict | None:
    target = path if path is not None else BANKS_JSON
    if not target.is_file():
        return None
    try:
        data = json.loads(target.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise SystemExit(f"{target} invalid JSON: {e}") from e
    if not isinstance(data, dict):
        raise SystemExit(f"{target} invalid: expected object")
    return _validate_banks_data(data, target)


def get_in_scope_banks(path: Path | None = None) -> set[str]:
    data = load_banks(path)
    if data is None:
        return {f"QB_{i}" for i in list(range(201, 211)) + list(range(401, 409)) + list(range(501, 504))}
    detail = data.get("banks_detail")
    assert isinstance(detail, list)
    return {entry["id"] for entry in detail if entry.get("in_scope")}
