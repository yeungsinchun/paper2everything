#!/usr/bin/env python3
"""Join staged DSE (MC + LQ) and QB_201-210 into the Book 2 (Force and Motion) DB.

Reads (all tracked staging, nothing regenerated here):
  qb-web-ui-staging/dse-mc/index.json       DSE Paper 1A items (crop + key + sections)
  qb-web-ui-staging/dse-lq/manifest.json    DSE Paper 1B items (crop + answer crop + sections)
  qb-web-ui-staging/qb/items/QB_2NN.json    QB_201..QB_210 items (chapter 01..10)

Writes qb-web-ui-staging/book2-db/:
  book2.json    every in-scope problem, one record each, MC vs LQ and by topic
  summary.json  counts per topic x kind x source
  audit.json    every integrity check with its failing ids (empty list = pass)

Scope: DSE sections 5-12 (Motion .. Gravitation); QB banks QB_201-210 (all
873 items). QB `sq`/`rq`/`lq` are all written-answer problems, so kind="lq"
with `qb_type` preserving the original subtype; `mc` stays kind="mc".

QB chapters roll up to DSE sections through CHAPTER_SECTION so one topic axis
covers both corpora.
"""
from __future__ import annotations

import json
import struct
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STAGING = ROOT / "qb-web-ui-staging"
OUT = STAGING / "book2-db"

SECTIONS = {
    5: "Motion",
    6: "Force",
    7: "More about Forces",
    8: "Work, Energy and Power",
    9: "Momentum",
    10: "Projectile Motion",
    11: "Uniform Circular Motion",
    12: "Gravitation",
}
# Book 2 textbook chapter -> DSE curriculum section (titles in paper2notes/notes/book2).
CHAPTER_SECTION = {
    1: 5, 2: 5,  # position & displacement; velocity & acceleration
    3: 6, 4: 6,  # forces & Newton I; Newton II & III
    5: 7,        # moment & equilibrium
    6: 8,        # work, energy, power
    7: 9,        # momentum
    8: 10,       # projectile motion
    9: 11,       # circular motion
    10: 12,      # gravitation
}
QB_BANKS = [f"QB_{200 + c}" for c in range(1, 11)]
EXPECTED_QB_ITEMS = 873
OPTIONS = set("ABCD")


def png_size(path: Path):
    """(w, h) of a PNG without decoding it, or None when not a readable PNG."""
    try:
        with path.open("rb") as fh:
            head = fh.read(24)
    except OSError:
        return None
    if len(head) < 24 or head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return struct.unpack(">II", head[16:24])


def bottom_ink(path: Path) -> bool:
    """True when the last two pixel rows carry ink: a sign the crop cut through text."""
    from PIL import Image
    import numpy as np

    with Image.open(path) as im:
        rows = np.asarray(im.convert("L"))[-2:]
    return bool((rows < 120).mean() > 0.0015)


def crop_info(rel: str | None):
    if not rel:
        return None
    size = png_size(STAGING / rel)
    return {"path": rel, "exists": size is not None, "width": size[0] if size else None,
            "height": size[1] if size else None}


def scoped(sections):
    return [s for s in sections if s in SECTIONS]


def dse_mc_records():
    for it in json.loads((STAGING / "dse-mc" / "index.json").read_text()):
        secs = scoped(it["sections"])
        if not secs:
            continue
        ans = it["answer"]
        yield {
            "id": it["id"], "source": "dse", "kind": "mc", "subtype": "mc",
            "year": str(it["year"]), "question": it["question"], "marks": it.get("marks", 1),
            "section": secs[0], "sections": secs, "chapter": None,
            "crop": crop_info(f"dse-mc/{it['image']['png']}"),
            "answer_crop": None,
            "key": ans.get("option"), "key_percentage": ans.get("percentage"),
            "key_deleted": bool(ans.get("deleted")),
            "reason": it.get("reason", ""), "preview": it.get("statementPreview", ""),
            "warnings": list(it.get("warnings", [])),
        }


def dse_lq_records():
    """DSE LQ rows. Sections come from the tracked classification decisions
    (metadata/lq/llm_classifications.json, sections[0] = primary), not from the
    staged manifest, whose section assignment drifted from those decisions."""
    manifest = json.loads((STAGING / "dse-lq" / "manifest.json").read_text())
    decisions = json.loads((ROOT / "metadata" / "lq" / "llm_classifications.json").read_text())
    for it in manifest["items"]:
        secs = scoped(decisions[it["id"]]["sections"])
        if not secs:
            continue
        primary = decisions[it["id"]]["sections"][0]
        if primary not in SECTIONS:
            primary = secs[0]
        it = {**it, "_staged_sections": it["all_sections"]}
        yield {
            "id": f"dse-lq-{it['id']}", "source": "dse", "kind": "lq", "subtype": "lq",
            "year": it["year"], "question": it["question"], "marks": None,
            "section": primary, "sections": secs, "chapter": None,
            "crop": crop_info(f"dse-lq/{it['crop']}"),
            "answer_crop": crop_info(f"dse-lq/{it['answer_crop']}") if it.get("answer_exists") else None,
            "key": None, "key_percentage": None, "key_deleted": False,
            "reason": it.get("reason", ""), "preview": "",
            "warnings": [k for k, v in it.get("missing_flags", {}).items() if v],
            "staged_sections": it["_staged_sections"],
        }


def qb_records():
    for bank in QB_BANKS:
        data = json.loads((STAGING / "qb" / "items" / f"{bank}.json").read_text())
        for it in data["items"]:
            chapter = int(it["chapter"])
            stem = it["images"]["stem"]
            ans = it["answer"]
            yield {
                "id": it["id"], "source": "qb", "kind": "mc" if it["type"] == "mc" else "lq",
                "subtype": it["type"], "year": None, "question": it["seq"], "marks": it.get("marks"),
                "section": CHAPTER_SECTION.get(chapter), "sections": [CHAPTER_SECTION[chapter]] if chapter in CHAPTER_SECTION else [],
                "chapter": chapter, "bank": it["bank"], "level": it.get("level"), "part": it.get("part"),
                "crop": crop_info(f"qb/{stem[0]}") if stem else None,
                "answer_crop": crop_info(f"qb/{it['images']['answer'][0]}") if it["images"].get("answer") else None,
                "key": ans.get("key"), "key_percentage": None, "key_deleted": False,
                "answer_status": ans.get("status"),
                "reason": "", "preview": (it["stem"].get("text") or "")[:160],
                "warnings": list(it.get("warnings", [])),
            }


def audit(records):
    checks = {}

    def check(name, failing):
        checks[name] = sorted(failing)

    ids = Counter(r["id"] for r in records)
    check("duplicate_ids", [i for i, n in ids.items() if n > 1])
    check("crop_missing_or_not_png", [r["id"] for r in records if not (r["crop"] and r["crop"]["exists"])])
    check("crop_degenerate_size", [r["id"] for r in records
                                   if r["crop"] and r["crop"]["exists"] and (r["crop"]["width"] < 200 or r["crop"]["height"] < 40)])
    check("answer_crop_path_missing", [r["id"] for r in records
                                       if r["answer_crop"] and not r["answer_crop"]["exists"]])
    check("topic_outside_book2", [r["id"] for r in records if r["section"] not in SECTIONS])
    mcs = [r for r in records if r["kind"] == "mc"]
    schemes = {pdf.name[: -len("ans.pdf")] for pdf in (ROOT / "paper" / "ans").glob("*ans.pdf")}
    keyless = [r for r in mcs if not r["key"] and not r["key_deleted"]]
    # A missing key is a pipeline defect only when the year's marking scheme exists.
    check("mc_key_missing", [r["id"] for r in keyless if r["source"] == "qb" or r["year"] in schemes])
    check("mc_key_no_marking_scheme", [r["id"] for r in keyless if r["source"] == "dse" and r["year"] not in schemes])
    check("mc_key_not_abcd", [r["id"] for r in mcs if r["key"] and r["key"] not in OPTIONS])
    qb = [r for r in records if r["source"] == "qb"]
    check("qb_count_not_873", [] if len(qb) == EXPECTED_QB_ITEMS else [f"got {len(qb)}"])
    check("qb_bank_chapter_mismatch", [r["id"] for r in qb if r["bank"] != f"QB_{200 + r['chapter']}"])
    check("qb_id_chapter_mismatch", [r["id"] for r in qb if r["id"][5:7] != f"{r['chapter']:02d}"])
    check("qb_lq_without_answer_crop", [r["id"] for r in qb if r["kind"] == "lq" and not r["answer_crop"]])
    dse = [r for r in records if r["source"] == "dse"]
    dse_mc = [r for r in dse if r["kind"] == "mc"]
    check("dse_mc_crop_bottom_clipped", [r["id"] for r in dse_mc if r["crop"] and r["crop"]["exists"]
                                         and bottom_ink(STAGING / r["crop"]["path"])])
    check("dse_mc_year_gap", [f"{y}" for y in sorted({r["year"] for r in dse if r["kind"] == "lq"}
                                                    - {r["year"] for r in dse if r["kind"] == "mc"})])
    check("dse_lq_staged_sections_drift", [r["id"] for r in dse if r["kind"] == "lq"
                                           and sorted(scoped(r["staged_sections"])) != sorted(r["sections"])])
    lq_gaps = [r for r in dse if r["kind"] == "lq" and not r["answer_crop"]]
    check("dse_lq_answer_missing", [r["id"] for r in lq_gaps if r["year"] in schemes])
    check("dse_lq_no_marking_scheme", [r["id"] for r in lq_gaps if r["year"] not in schemes])
    return checks


def main():
    records = [*dse_mc_records(), *dse_lq_records(), *qb_records()]
    records.sort(key=lambda r: (r["source"], r["kind"], r["section"] or 0, str(r["year"] or ""), r["question"], r["id"]))

    counts = defaultdict(lambda: defaultdict(int))
    for r in records:
        for sec in r["sections"] if r["source"] == "dse" else [r["section"]]:
            counts[sec][f"{r['source']}_{r['kind']}"] += 1
    summary = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(records),
        "by_source_kind": dict(Counter(f"{r['source']}_{r['kind']}" for r in records)),
        "qb_subtypes": dict(Counter(r["subtype"] for r in records if r["source"] == "qb")),
        "sections": {str(s): {"title": SECTIONS[s], **dict(counts[s])} for s in SECTIONS},
        "note": "dse counts list a question under every in-scope section it is classified in; "
                "sum(sections) can exceed the unique total",
    }
    checks = audit(records)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "book2.json").write_text(json.dumps(records, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    (OUT / "audit.json").write_text(json.dumps(checks, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary["by_source_kind"]), "total", len(records))
    failing = {k: len(v) for k, v in checks.items() if v}
    print("audit failures:", failing or "none")
    return 0


if __name__ == "__main__":
    sys.exit(main())
