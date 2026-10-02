#!/usr/bin/env python3
"""Stage regenerated LQ answer crops into qb-web-ui-staging/dse-lq without a full restage.

For each --years entry, copies tests/reconstructed/lq/<year>/ans/qN.png to
crops/<year>-qN-ans.png (and each section folder the question lives in), then
updates manifest.json: item.answer_crop / answer_exists / missing_flags,
counts.answers_exist/answers_missing and missing.answers.

Usage: python3 scripts/stage_lq_answer_patch.py --years 2025
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RECON_LQ = ROOT / "tests" / "reconstructed" / "lq"
STAGING = ROOT / "qb-web-ui-staging" / "dse-lq"


def save_optimized(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im.convert("RGB").convert("P", palette=Image.ADAPTIVE, colors=256).save(dest, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--years", nargs="+", required=True)
    args = parser.parse_args()

    manifest_path = STAGING / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    sections_by_num = {s["section"]: s for s in manifest["sections"]}
    patched = 0
    for item in manifest["items"]:
        if item["year"] not in args.years:
            continue
        src = RECON_LQ / item["year"] / "ans" / f"q{item['question']}.png"
        if not src.is_file():
            continue
        name = f"{item['year']}-q{item['question']}-ans.png"
        save_optimized(src, STAGING / "crops" / name)
        for num in item["all_sections"]:
            folder = sections_by_num.get(num, {}).get("staging_dir")
            if folder and (STAGING / folder).is_dir():
                save_optimized(src, STAGING / folder / name)
        item["answer_crop"] = f"crops/{name}"
        item["answer_exists"] = True
        item["missing_flags"]["answer"] = False
        item["has_missing"] = any(item["missing_flags"].values())
        item["answer_png"] = f"tests/reconstructed/lq/{item['year']}/ans/q{item['question']}.png"
        patched += 1

    items = manifest["items"]
    counts = manifest["counts"]
    counts["answers_exist"] = sum(1 for i in items if i["answer_exists"])
    counts["answers_missing"] = len(items) - counts["answers_exist"]
    manifest["missing"]["answers"] = sorted(i["id"] for i in items if not i["answer_exists"])
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"patched {patched} items; answers_exist={counts['answers_exist']} missing={counts['answers_missing']}")


if __name__ == "__main__":
    main()
