#!/usr/bin/env python3
"""Join DSE crops, classifications, keys, performance and pointers into item records.

Reads (all under the paper2db root):
  metadata/{mc,lq}/llm_classifications.json   tracked section decisions
  tests/reconstructed/mc/<year>/qN.png        MC crops           (mc-split)
  tests/reconstructed/lq/<year>/qN.png        LQ page stacks     (lq-crops)
  tests/reconstructed/lq/<year>/ans/qN.png    LQ answer crops    (lq-answers)
  tests/reconstructed/lq/<year>/starts.json   LQ page ranges
  tests/sections/mc/answer_keys.json          MC keys + correct-% (keys)
  classified/lq/candidate_performance.json   LQ notes          (lq-performance)
  metadata/pointers/dse.json                 answer-pointer store

Writes `paper2db.dse-item.v1` records (schemas/dse-item.v1.json):
  tests/sections/items/<section folder>.json  full records listed under that section
  tests/sections/items/index.json             one summary row per record + counts

A record is in-scope when its primary section belongs to Books 2, 4 or 5. The
run fails when any record is schema-invalid or any in-scope record lacks its
question crop; out-of-scope records with missing crops are flagged in the index.
"""
from __future__ import annotations

import argparse
import json
import re
import struct
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from classify_mc_llm import SECTIONS  # noqa: E402  (shared 27-section taxonomy)
import pointers  # noqa: E402

SCHEMA_ID = "paper2db.dse-item.v1"
SCHEMA_PATH = ROOT / "schemas" / "dse-item.v1.json"
ITEMS_DIR = ROOT / "tests" / "sections" / "items"
RECON = ROOT / "tests" / "reconstructed"
MC_CLASSIFICATIONS = ROOT / "metadata" / "mc" / "llm_classifications.json"
LQ_CLASSIFICATIONS = ROOT / "metadata" / "lq" / "llm_classifications.json"
ANSWER_KEYS = ROOT / "tests" / "sections" / "mc" / "answer_keys.json"
LQ_PERFORMANCE = ROOT / "classified" / "lq" / "candidate_performance.json"
ANSWER_POINTERS = ROOT / "metadata" / "pointers" / "dse.json"

IN_SCOPE_BOOKS = ("02_", "04_", "05_")
SECTION_BY_NUM = {
    num: {"num": num, "book": book, "folder": folder, "title": title}
    for num, book, folder, title in SECTIONS
}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def png_size(path: Path) -> tuple[int, int]:
    """Width and height from a PNG IHDR (no raster decode)."""
    with path.open("rb") as fh:
        if fh.read(8) != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"{path} is not a PNG")
        _length, chunk = struct.unpack(">I4s", fh.read(8))
        if chunk != b"IHDR":
            raise ValueError(f"{path} is missing IHDR")
        width, height = struct.unpack(">II", fh.read(8))
    return int(width), int(height)


def image_ref(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    width, height = png_size(path)
    return {"path": rel(path), "width": width, "height": height}


def year_sort_key(year: str) -> tuple[int, str]:
    order = {"pp": 1, "sap": 2}
    if year.isdigit():
        return (0, year)
    return (order.get(year, 3), year)


def paper_pdf(paper: str, year: str) -> str:
    """Source exam PDF, following the pipeline's year-label convention."""
    suffix = "p1a" if paper == "mc" else "p1b"
    stem = {"pp": "ppp", "sap": "sapp"}.get(year, year)
    return f"paper/{paper}/{stem}{suffix}.pdf"


def answer_pdf(year: str) -> str | None:
    path = ROOT / "paper" / "ans" / f"{year}ans.pdf"
    return rel(path) if path.is_file() else None


def sections_for(nums: list[int]) -> dict[str, Any]:
    unknown = [n for n in nums if n not in SECTION_BY_NUM]
    if unknown:
        raise SystemExit(f"Unknown section number(s) {unknown} in classifications")
    infos = [dict(SECTION_BY_NUM[n]) for n in nums]
    return {"primary": infos[0], "all": infos}


def scope_of(primary: dict[str, Any]) -> str:
    return "in-scope" if primary["book"].startswith(IN_SCOPE_BOOKS) else "out-of-scope"


def load_json(path: Path, label: str, stage: str) -> Any:
    if not path.is_file():
        raise SystemExit(f"Missing {rel(path)} ({label}). Run ./pipeline --only {stage}.")
    return json.loads(path.read_text(encoding="utf-8"))


def load_lq_pages(year: str) -> dict[int, dict[str, int]]:
    path = RECON / "lq" / year / "starts.json"
    if not path.is_file():
        return {}
    questions = json.loads(path.read_text(encoding="utf-8")).get("questions") or []
    return {
        int(q["q"]): {"from": int(q["page_from"]), "to": int(q["page_to"])}
        for q in questions
    }


def mc_answer(key: dict[str, Any] | None) -> tuple[dict[str, Any], list[str]]:
    option = (key or {}).get("Correct Option")
    percentage = (key or {}).get("Correct percentage")
    deleted = bool((key or {}).get("deleted"))
    warnings: list[str] = []
    if deleted:
        status = "deleted"
    elif option:
        status = "present"
    else:
        status = "missing"
        warnings.append("missing_answer")
    if percentage is None and not deleted:
        warnings.append("missing_percentage")
    return (
        {
            "status": status,
            "option": option if option else None,
            "percentage": int(percentage) if percentage is not None else None,
            "deleted": deleted,
        },
        warnings,
    )


def build_mc_records(keys: dict[str, Any], years: list[str] | None) -> list[dict[str, Any]]:
    entries = json.loads(MC_CLASSIFICATIONS.read_text(encoding="utf-8"))
    records: list[dict[str, Any]] = []
    for entry in entries:
        year = str(entry["Year"])
        if years and year not in years:
            continue
        question = int(entry["Question"])
        sections = sections_for([int(n) for n in entry["sections"]])
        image = image_ref(RECON / "mc" / year / f"q{question}.png")
        answer, warnings = mc_answer((keys.get(year) or {}).get(str(question)))
        if image is None:
            warnings.append("missing_crop")
        uncertain = bool(entry.get("uncertain"))
        if uncertain:
            warnings.append("uncertain_classification")
        records.append(
            {
                "schema": SCHEMA_ID,
                "id": f"dse-mc-{year}-{question}",
                "paper": "mc",
                "year": year,
                "question": question,
                "scope": scope_of(sections["primary"]),
                "sections": sections,
                "classification": {
                    "reason": entry.get("reason", ""),
                    "uncertain": uncertain,
                    "source": rel(MC_CLASSIFICATIONS),
                },
                "marks": 1,
                "images": {"question": image, "answer": None},
                "answer": answer,
                "performance": {"status": "not-applicable", "note": None},
                "sources": {
                    "paper_pdf": paper_pdf("mc", year),
                    "answer_pdf": answer_pdf(year),
                    "pages": None,
                },
                "warnings": warnings,
            }
        )
    return records


def build_lq_records(performance: dict[str, Any], years: list[str] | None) -> list[dict[str, Any]]:
    entries = json.loads(LQ_CLASSIFICATIONS.read_text(encoding="utf-8"))
    pages: dict[str, dict[int, dict[str, int]]] = {}
    records: list[dict[str, Any]] = []
    for key, entry in entries.items():
        match = re.fullmatch(r"(\w+)-q(\d+)", key)
        if not match:
            raise SystemExit(f"Unexpected LQ classification key {key!r}")
        year, question = match.group(1), int(match.group(2))
        if years and year not in years:
            continue
        sections = sections_for([int(n) for n in entry["sections"]])
        year_dir = RECON / "lq" / year
        image = image_ref(year_dir / f"q{question}.png")
        answer_image = image_ref(year_dir / "ans" / f"q{question}.png")
        note = (performance.get(year) or {}).get(str(question))
        note = note.strip() if isinstance(note, str) and note.strip() else None
        warnings: list[str] = []
        if image is None:
            warnings.append("missing_crop")
        if answer_image is None:
            warnings.append("missing_answer_crop")
        if note is None:
            warnings.append("missing_performance")
        page_range = pages.setdefault(year, load_lq_pages(year)).get(question)
        records.append(
            {
                "schema": SCHEMA_ID,
                "id": f"dse-lq-{year}-q{question}",
                "paper": "lq",
                "year": year,
                "question": question,
                "scope": scope_of(sections["primary"]),
                "sections": sections,
                "classification": {
                    "reason": entry.get("reason", ""),
                    "uncertain": None,
                    "source": rel(LQ_CLASSIFICATIONS),
                },
                "marks": None,
                "images": {"question": image, "answer": answer_image},
                "answer": {
                    "status": "not-applicable",
                    "option": None,
                    "percentage": None,
                    "deleted": False,
                },
                "performance": {
                    "status": "present" if note else "missing",
                    "note": note,
                },
                "sources": {
                    "paper_pdf": paper_pdf("lq", year),
                    "answer_pdf": answer_pdf(year),
                    "pages": page_range,
                },
                "warnings": warnings,
            }
        )
    return records


# --- stdlib JSON Schema (draft-07 subset used by schemas/dse-item.v1.json) ---


def _type_ok(value: Any, name: str) -> bool:
    if name == "null":
        return value is None
    if name == "boolean":
        return isinstance(value, bool)
    if name == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if name == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if name == "string":
        return isinstance(value, str)
    if name == "array":
        return isinstance(value, list)
    if name == "object":
        return isinstance(value, dict)
    raise ValueError(f"unsupported schema type {name!r}")


def validate(value: Any, schema: dict[str, Any], root: dict[str, Any], path: str = "$") -> list[str]:
    """Return human-readable violations of `schema` (empty list when valid)."""
    if "$ref" in schema:
        ref = schema["$ref"]
        if not ref.startswith("#/"):
            filename, fragment = ref.split("#", 1)
            external = json.loads((SCHEMA_PATH.parent / filename).read_text(encoding="utf-8"))
            return validate(value, {"$ref": f"#{fragment}"}, external, path)
        target: Any = root
        for part in ref[2:].split("/"):
            target = target[part]
        return validate(value, target, root, path)

    errors: list[str] = []
    if "oneOf" in schema:
        matches = sum(1 for sub in schema["oneOf"] if not validate(value, sub, root, path))
        if matches != 1:
            errors.append(f"{path}: matches {matches} of {len(schema['oneOf'])} oneOf branches")
        return errors

    if "type" in schema:
        names = schema["type"] if isinstance(schema["type"], list) else [schema["type"]]
        if not any(_type_ok(value, name) for name in names):
            return [f"{path}: expected {'|'.join(names)}, got {type(value).__name__}"]
    if "const" in schema and value != schema["const"]:
        errors.append(f"{path}: expected {schema['const']!r}, got {value!r}")
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: {value!r} not in {schema['enum']}")
    if isinstance(value, str):
        if "pattern" in schema and not re.search(schema["pattern"], value):
            errors.append(f"{path}: {value!r} does not match {schema['pattern']}")
        if "minLength" in schema and len(value) < schema["minLength"]:
            errors.append(f"{path}: shorter than {schema['minLength']} characters")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: {value} < minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path}: {value} > maximum {schema['maximum']}")
    if isinstance(value, dict):
        for name in schema.get("required", []):
            if name not in value:
                errors.append(f"{path}: missing required property {name!r}")
        props = schema.get("properties", {})
        if schema.get("additionalProperties") is False:
            for name in value:
                if name not in props:
                    errors.append(f"{path}: unexpected property {name!r}")
        for name, sub in props.items():
            if name in value:
                errors.extend(validate(value[name], sub, root, f"{path}.{name}"))
    if isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            errors.append(f"{path}: fewer than {schema['minItems']} items")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            errors.append(f"{path}: more than {schema['maxItems']} items")
        if "items" in schema:
            for index, item in enumerate(value):
                errors.extend(validate(item, schema["items"], root, f"{path}[{index}]"))
    return errors


def load_schema() -> dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


def validate_records(records: list[dict[str, Any]]) -> list[str]:
    schema = load_schema()
    errors: list[str] = []
    for record in records:
        errors.extend(f"{record.get('id')}: {msg}" for msg in validate(record, schema, schema))
        pointer = record.get("answer_pointer")
        if pointer is not None:
            errors.extend(pointers.validate_pointer(pointer, f"{record.get('id')}.answer_pointer"))
            if isinstance(pointer, dict) and pointer.get("item_id") != record.get("id"):
                errors.append(f"{record.get('id')}: answer_pointer.item_id does not match record id")
    return errors


def missing_images(records: list[dict[str, Any]]) -> list[str]:
    """Ids of in-scope records whose question crop is absent, plus any recorded path gone from disk."""
    bad: list[str] = []
    for record in records:
        images = record["images"]
        question = images["question"]
        if question is None:
            if record["scope"] == "in-scope":
                bad.append(record["id"])
            continue
        for image in (question, images["answer"]):
            if image is not None and not (ROOT / image["path"]).is_file():
                bad.append(record["id"])
    return bad


def record_sort_key(record: dict[str, Any]) -> tuple[Any, ...]:
    return (record["paper"] != "mc", year_sort_key(record["year"]), record["question"])


def index_row(record: dict[str, Any]) -> dict[str, Any]:
    question = record["images"]["question"]
    return {
        "id": record["id"],
        "paper": record["paper"],
        "year": record["year"],
        "question": record["question"],
        "scope": record["scope"],
        "primary_section": record["sections"]["primary"]["num"],
        "sections": [s["num"] for s in record["sections"]["all"]],
        "image": question["path"] if question else None,
        "warnings": record["warnings"],
    }


def write_outputs(records: list[dict[str, Any]], years: list[str] | None = None) -> None:
    out_dir = ITEMS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    if years:
        retained: dict[str, dict[str, Any]] = {}
        for info in SECTION_BY_NUM.values():
            path = out_dir / f"{info['folder']}.json"
            if path.is_file():
                for record in json.loads(path.read_text(encoding="utf-8")):
                    if record["year"] not in years:
                        retained[record["id"]] = record
        records = list(retained.values()) + records
    records.sort(key=record_sort_key)

    def dump(path: Path, data: Any) -> None:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    by_section: dict[int, list[dict[str, Any]]] = {}
    for record in records:
        for section in record["sections"]["all"]:
            by_section.setdefault(section["num"], []).append(record)

    section_rows = []
    for num in sorted(SECTION_BY_NUM):
        info = SECTION_BY_NUM[num]
        listed = by_section.get(num, [])
        path = out_dir / f"{info['folder']}.json"
        if listed:
            dump(path, listed)
        elif path.is_file():
            path.unlink()
        section_rows.append(
            {
                **info,
                "file": f"{info['folder']}.json" if listed else None,
                "count": len(listed),
                "primary_count": sum(1 for r in listed if r["sections"]["primary"]["num"] == num),
            }
        )

    in_scope = [r for r in records if r["scope"] == "in-scope"]
    counts = {
        "total": len(records),
        "in_scope": len(in_scope),
        "in_scope_mc": sum(1 for r in in_scope if r["paper"] == "mc"),
        "in_scope_lq": sum(1 for r in in_scope if r["paper"] == "lq"),
        "warnings": {
            name: sum(1 for r in records if name in r["warnings"])
            for name in sorted({w for r in records for w in r["warnings"]})
        },
    }
    dump(
        out_dir / "index.json",
        {
            "schema": SCHEMA_ID,
            "counts": counts,
            "sections": section_rows,
            "items": [index_row(r) for r in records],
        },
    )


def build_records(years: list[str] | None = None) -> list[dict[str, Any]]:
    keys = load_json(ANSWER_KEYS, "MC answer keys", "keys")
    performance = load_json(LQ_PERFORMANCE, "LQ candidate performance", "lq-performance")
    records = build_mc_records(keys, years) + build_lq_records(performance, years)
    resolved = pointers.merge(pointers.load_store("dse", ANSWER_POINTERS))
    records = pointers.join_items(records, resolved)
    records.sort(key=record_sort_key)
    return records


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--years", nargs="+", help="Update only these year labels, preserving other years")
    args = parser.parse_args(argv)

    try:
        records = build_records(args.years)
    except pointers.PointerError as exc:
        print(f"Invalid answer pointers: {exc}", file=sys.stderr)
        return 1
    errors = validate_records(records)
    if errors:
        print("Schema violations:", file=sys.stderr)
        for line in errors[:50]:
            print(f"  {line}", file=sys.stderr)
        return 1
    bad_images = missing_images(records)
    if bad_images:
        print(f"In-scope records without crops ({len(bad_images)}):", file=sys.stderr)
        for record_id in bad_images[:50]:
            print(f"  {record_id}", file=sys.stderr)
        return 1

    write_outputs(records, args.years)
    in_scope = sum(1 for r in records if r["scope"] == "in-scope")
    print(f"dse-items: {len(records)} records ({in_scope} in-scope) -> {ITEMS_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
