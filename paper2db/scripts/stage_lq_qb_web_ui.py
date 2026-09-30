#!/usr/bin/env python3
"""Stage DSE LQ crops for qb-web-ui.

Generates paper2db/qb-web-ui-staging/dse-lq/ with:
  - crops/ : 170 whole-page LQ PNGs (plus answer crops where available)
  - candidate_performance.json with missing flags
  - manifest.json / index.json with per-question metadata and missing flags
  - sections/ per-section indexes (optional, for parity with classified)
  - README.md

Source of truth:
  - output/lq/<year>/qN.png (whole-page stacks) and ans/qN.png
  - classified/lq/classification.csv (170 rows, primary/all sections)
  - classified/lq/candidate_performance.json (144 notes)
  - metadata/lq/llm_classifications.json (reason, fallback)
  - tests/reconstructed/lq/<year>/starts.json (page_from/page_to)

Missing data is flagged explicitly, not silently omitted.
"""
from __future__ import annotations

import csv
import json
import shutil
import datetime
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_LQ = ROOT / "output" / "lq"
CLASSIFIED_LQ = ROOT / "classified" / "lq"
METADATA_LQ = ROOT / "metadata" / "lq" / "llm_classifications.json"
RECON_LQ = ROOT / "tests" / "reconstructed" / "lq"
STAGING = ROOT / "qb-web-ui-staging" / "dse-lq"

# Same taxonomy as classify_mc_llm
SECTIONS = [
    (1, "01_Heat_and_Gases", "01_Temperature_and_Heat_Transfer", "Temperature and Heat Transfer"),
    (2, "01_Heat_and_Gases", "02_Heat_Capacity", "Heat Capacity"),
    (3, "01_Heat_and_Gases", "03_Change_of_State", "Change of State"),
    (4, "01_Heat_and_Gases", "04_Gas_Law_and_Kinetic_Theory", "Gas Law and Kinetic Theory"),
    (5, "02_Force_and_Motion", "05_Motion", "Motion"),
    (6, "02_Force_and_Motion", "06_Force", "Force"),
    (7, "02_Force_and_Motion", "07_More_about_Forces", "More about Forces"),
    (8, "02_Force_and_Motion", "08_Work_Energy_and_Power", "Work, Energy and Power"),
    (9, "02_Force_and_Motion", "09_Momentum", "Momentum"),
    (10, "02_Force_and_Motion", "10_Projectile_Motion", "Projectile Motion"),
    (11, "02_Force_and_Motion", "11_Uniform_Circular_Motion", "Uniform Circular Motion"),
    (12, "02_Force_and_Motion", "12_Gravitation", "Gravitation"),
    (13, "03A_Wave_Motion", "13_Wave_Motion", "Wave Motion"),
    (14, "03A_Wave_Motion", "14_Reflection_Refraction_and_Diffraction", "Reflection, Refraction and Diffraction"),
    (15, "03A_Wave_Motion", "15_Interference_and_Stationary_Wave", "Interference and Stationary Wave"),
    (16, "03A_Wave_Motion", "16_Light_and_Sound", "Light and Sound"),
    (17, "03B_Ray_Optics", "17_Reflection_of_Light", "Reflection of Light"),
    (18, "03B_Ray_Optics", "18_Refraction_of_Light", "Refraction of Light"),
    (19, "03B_Ray_Optics", "19_Lenses", "Lenses"),
    (20, "04_Electricity_and_Magnetism", "20_Electrostatics", "Electrostatics"),
    (21, "04_Electricity_and_Magnetism", "21_Circuit_and_Power", "Circuit and Power"),
    (22, "04_Electricity_and_Magnetism", "22_AC_and_Domestic_Electricity", "AC and Domestic Electricity"),
    (23, "04_Electricity_and_Magnetism", "23_Electromagnetism", "Electromagnetism"),
    (24, "04_Electricity_and_Magnetism", "24_Electromagnetic_Induction", "Electromagnetic Induction"),
    (25, "05_Radioactivity_and_Nuclear_Energy", "25_Radiation_and_Radioactivity", "Radiation and Radioactivity"),
    (26, "05_Radioactivity_and_Nuclear_Energy", "26_Rate_of_Decay_and_Uses_of_Radionuclides", "Rate of Decay and Uses of Radionuclides"),
    (27, "05_Radioactivity_and_Nuclear_Energy", "27_Nuclear_Energy", "Nuclear Energy"),
]
SECTION_BY_NUM = {n: (book, folder, name) for n, book, folder, name in SECTIONS}

def year_key(name: str):
    order = ["2012","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025","2026","pp","sap"]
    if name in order:
        return (0, order.index(name))
    return (1, name)

def load_classification():
    csv_path = CLASSIFIED_LQ / "classification.csv"
    if not csv_path.is_file():
        raise SystemExit(f"Missing {csv_path} – run classify-lq")
    rows = list(csv.DictReader(csv_path.open(encoding="utf-8")))
    # Sort by year then question
    rows.sort(key=lambda r: (year_key(str(r["Year"])), int(r["Question"])))
    return rows

def load_llm_meta():
    if METADATA_LQ.is_file():
        return json.loads(METADATA_LQ.read_text(encoding="utf-8"))
    return {}

def load_candidate_performance():
    p = CLASSIFIED_LQ / "candidate_performance.json"
    if p.is_file():
        return json.loads(p.read_text(encoding="utf-8"))
    # fallback tests/sections
    p2 = ROOT / "tests" / "sections" / "lq" / "candidate_performance.json"
    if p2.is_file():
        return json.loads(p2.read_text(encoding="utf-8"))
    return {}

def load_starts(year: str):
    for base in [RECON_LQ, OUTPUT_LQ]:
        sp = base / year / "starts.json"
        if sp.is_file():
            try:
                data = json.loads(sp.read_text(encoding="utf-8"))
                # build map q -> page range
                m = {}
                for q in data.get("questions", []):
                    m[int(q["q"])] = {"page_from": int(q["page_from"]), "page_to": int(q["page_to"]), "y": q.get("y")}
                return m
            except Exception:
                continue
    return {}

def ensure_dirs():
    STAGING.mkdir(parents=True, exist_ok=True)
    (STAGING / "crops").mkdir(parents=True, exist_ok=True)
    (STAGING / "sections").mkdir(parents=True, exist_ok=True)
    (STAGING / "raw").mkdir(parents=True, exist_ok=True)

def stage():
    ensure_dirs()
    rows = load_classification()
    llm_meta = load_llm_meta()
    perf = load_candidate_performance()
    # build starts cache per year
    starts_cache = {}
    for year in set(str(r["Year"]) for r in rows):
        starts_cache[year] = load_starts(year)

    # stats
    total = len(rows)
    crops_exist = 0
    ans_exist = 0
    perf_exist = 0
    missing_perf_list = []
    missing_crop_list = []
    missing_ans_list = []

    items = []
    # also per-section inventory
    section_counts = {n: 0 for n,_,_,_ in SECTIONS}

    for r in rows:
        year = str(r["Year"])
        q = int(r["Question"])
        qid = f"{year}-q{q}"
        primary = int(r["Primary"])
        all_secs = [int(x) for x in r["AllSections"].split(";") if x.strip().isdigit()]
        if primary not in section_counts:
            section_counts[primary] = 0
        section_counts[primary] += 1

        # resolve crop
        src_candidates = [
            OUTPUT_LQ / year / f"q{q}.png",
            RECON_LQ / year / f"q{q}.png",
            CLASSIFIED_LQ / SECTION_BY_NUM[primary][0] / SECTION_BY_NUM[primary][1] / f"{year}-q{q}.png",
        ]
        src_crop = next((p for p in src_candidates if p.is_file()), None)
        crop_exists = src_crop is not None and src_crop.is_file()
        dest_crop_rel = f"crops/{year}-q{q}.png"
        dest_crop = STAGING / dest_crop_rel
        missing_crop = not crop_exists
        if crop_exists:
            crops_exist += 1
            dest_crop.parent.mkdir(parents=True, exist_ok=True)
            try:
                shutil.copy2(src_crop, dest_crop)
            except Exception as e:
                print(f"warn copy {src_crop} -> {dest_crop}: {e}")
                missing_crop = True
                crop_exists = False
        else:
            missing_crop_list.append(qid)

        # answer crop
        ans_candidates = [
            OUTPUT_LQ / year / "ans" / f"q{q}.png",
            RECON_LQ / year / "ans" / f"q{q}.png",
            CLASSIFIED_LQ / SECTION_BY_NUM[primary][0] / SECTION_BY_NUM[primary][1] / f"{year}-q{q}-ans.png",
        ]
        src_ans = next((p for p in ans_candidates if p.is_file()), None)
        ans_exists_flag = src_ans is not None and src_ans.is_file()
        dest_ans_rel = f"crops/{year}-q{q}-ans.png"
        dest_ans = STAGING / dest_ans_rel
        if ans_exists_flag:
            ans_exist += 1
            try:
                shutil.copy2(src_ans, dest_ans)
            except Exception as e:
                print(f"warn copy ans {src_ans}: {e}")
                ans_exists_flag = False
        else:
            missing_ans_list.append(qid)

        # candidate performance
        note = (perf.get(year) or {}).get(str(q))
        has_perf = note is not None and str(note).strip() != ""
        if has_perf:
            perf_exist += 1
        else:
            missing_perf_list.append(qid)
            note = None  # explicit null

        # llm reason fallback
        meta_key = f"{year}-q{q}"
        llm_entry = llm_meta.get(meta_key) or {}
        reason = r.get("Reason") or llm_entry.get("reason") or ""
        # sections names
        all_names = [SECTION_BY_NUM[s][2] for s in all_secs if s in SECTION_BY_NUM]
        primary_name = SECTION_BY_NUM[primary][2] if primary in SECTION_BY_NUM else ""
        book, folder, _ = SECTION_BY_NUM.get(primary, ("unknown","unknown","unknown"))

        # page range
        pr = starts_cache.get(year, {}).get(q, {})
        page_from = pr.get("page_from")
        page_to = pr.get("page_to")

        # flags
        missing_flags = {
            "crop": not crop_exists,
            "answer": not ans_exists_flag,
            "candidate_performance": not has_perf,
        }
        # overall missing?
        has_missing = any(missing_flags.values())

        item = {
            "id": qid,
            "year": year,
            "question": q,
            "primary_section": primary,
            "primary_name": primary_name,
            "primary_book": book,
            "primary_folder": folder,
            "all_sections": all_secs,
            "all_section_names": all_names,
            "crop": dest_crop_rel if crop_exists else None,
            "crop_exists": crop_exists,
            "answer_crop": dest_ans_rel if ans_exists_flag else None,
            "answer_exists": ans_exists_flag,
            "candidate_performance": note,
            "has_candidate_performance": has_perf,
            "missing_flags": missing_flags,
            "has_missing": has_missing,
            "reason": reason,
            "page_from": page_from,
            "page_to": page_to,
            "png": r.get("PNG") or f"output/lq/{year}/q{q}.png",
            "answer_png": r.get("AnswerPNG") or f"output/lq/{year}/ans/q{q}.png",
        }
        items.append(item)

    # sort items by year, question already
    # Build section summary
    sections = []
    for n, book, folder, name in SECTIONS:
        count = section_counts.get(n, 0)
        if count == 0 and n not in [s for s in section_counts if section_counts[s]>0]:
            # still include for completeness with zero?
            pass
        sections.append({
            "section": n,
            "book": book,
            "folder": folder,
            "name": name,
            "count": count,
            "staging_dir": f"sections/{n:02d}_{folder}" if count>0 else None,
        })
    # Keep only sections with count>0 for staging dir creation, but include all in manifest for completeness
    # Also copy per-section crops to staging/sections for parity (optional)
    for r in rows:
        year = str(r["Year"])
        q = int(r["Question"])
        primary = int(r["Primary"])
        all_secs = [int(x) for x in r["AllSections"].split(";") if x.strip().isdigit()]
        # copy to every section listed (not only primary)
        for sec in all_secs:
            book, folder, name = SECTION_BY_NUM.get(sec, ("unknown","unknown","unknown"))
            sec_dir = STAGING / "sections" / f"{sec:02d}_{folder}"
            sec_dir.mkdir(parents=True, exist_ok=True)
            src = STAGING / "crops" / f"{year}-q{q}.png"
            if src.is_file():
                dest = sec_dir / f"{year}-q{q}.png"
                if not dest.is_file():
                    try:
                        shutil.copy2(src, dest)
                    except:
                        pass
            src_ans = STAGING / "crops" / f"{year}-q{q}-ans.png"
            if src_ans.is_file():
                dest_ans = sec_dir / f"{year}-q{q}-ans.png"
                if not dest_ans.is_file():
                    try:
                        shutil.copy2(src_ans, dest_ans)
                    except:
                        pass

    # Write per-section index.json
    for sec_info in sections:
        n = sec_info["section"]
        if sec_info["count"] == 0:
            continue
        book, folder, name = SECTION_BY_NUM[n]
        sec_dir = STAGING / "sections" / f"{n:02d}_{folder}"
        sec_items = [it for it in items if n in it["all_sections"]]
        sec_index = {
            "section": n,
            "name": name,
            "book": book,
            "folder": folder,
            "count": len(sec_items),
            "items": sec_items,
        }
        (sec_dir / "index.json").write_text(json.dumps(sec_index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Build candidate_performance.json for staging with explicit missing handling
    # Structure: { "years": { "2012": {"1": "text", ...}, ...}, "missing": [...], "stats": {...} }
    cp_staging = {
        "source": "paper/performance/*.md via extract_lq_performance.py",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "total_questions": total,
        "with_performance": perf_exist,
        "without_performance": total - perf_exist,
        "missing_ids": sorted(missing_perf_list),
        "data": perf,
        "by_question": {it["id"]: it["candidate_performance"] for it in items},
        "flags": {it["id"]: not it["has_candidate_performance"] for it in items},
    }
    (STAGING / "candidate_performance.json").write_text(json.dumps(cp_staging, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    # Also write raw copy of original candidate_performance.json for reference
    orig_perf_path = CLASSIFIED_LQ / "candidate_performance.json"
    if orig_perf_path.is_file():
        shutil.copy2(orig_perf_path, STAGING / "raw" / "candidate_performance.json")
        # ensure raw dir
        (STAGING / "raw").mkdir(parents=True, exist_ok=True)

    # Also copy classification csv/json raw
    for fname in ["classification.csv", "llm_classifications.json", "classification.json"]:
        src = CLASSIFIED_LQ / fname
        if src.is_file():
            shutil.copy2(src, STAGING / "raw" / fname)
        # also metadata copy
    if METADATA_LQ.is_file():
        shutil.copy2(METADATA_LQ, STAGING / "raw" / "llm_classifications.json")

    # Manifest
    manifest = {
        "name": "qb-web-ui DSE LQ staging",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "source": {
            "pipeline": "paper2db/pipeline lq-pages -> lq-crops -> lq-answers -> lq-performance -> classify-lq -> section-pdfs",
            "output_lq": "output/lq/<year>/qN.png (whole-page stacks)",
            "classified_lq": "classified/lq/<book>/<section>/",
            "reconstructed": "tests/reconstructed/lq/<year>/",
        },
        "counts": {
            "total_questions": total,
            "crops_exist": crops_exist,
            "crops_missing": len(missing_crop_list),
            "answers_exist": ans_exist,
            "answers_missing": len(missing_ans_list),
            "candidate_performance_exist": perf_exist,
            "candidate_performance_missing": len(missing_perf_list),
            "sections_used": len([s for s in sections if s["count"]>0]),
        },
        "missing": {
            "crops": sorted(missing_crop_list),
            "answers": sorted(missing_ans_list),
            "candidate_performance": sorted(missing_perf_list),
        },
        "sections": sections,
        "items": items,
    }
    (STAGING / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (STAGING / "index.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Summary README
    readme = f"""# DSE LQ staging for qb-web-ui

Generated at {manifest['generated_at']}

- Total LQ questions (crops): {total} (170 expected)
- Crops present: {crops_exist} / {total}
- Answer crops: {ans_exist} / {total} (missing {len(missing_ans_list)})
- Candidate performance notes: {perf_exist} / {total} (missing {len(missing_perf_list)} – flagged per item)

## Layout

- `crops/` – whole-page question PNGs (`YYYY-qN.png`) and answer crops (`YYYY-qN-ans.png` where available)
- `sections/` – per-section copies (`sections/NN_Folder/YYYY-qN.png`) for web UI section decks
- `candidate_performance.json` – structured performance data with `missing_ids` and per-question flags
- `manifest.json` / `index.json` – full index with `missing_flags` per item (`crop`, `answer`, `candidate_performance`)
- `raw/` – copies of `classification.csv`, `llm_classifications.json`, original `candidate_performance.json`

## Candidate performance handling

Each item in `manifest.json` has:

- `candidate_performance`: string or `null`
- `has_candidate_performance`: bool
- `missing_flags.candidate_performance`: bool (true when performance note absent)

Missing performance is expected for:
- 2026 (no performance PDF released yet)
- pp (practice paper, no performance data)
- Any question where paper/performance/*.md lacked a Section B note.

`candidate_performance.json` at staging root aggregates all notes with `missing_ids` list for UI to render placeholders.

## Verification

```bash
# should be 170
cat manifest.json | python3 -c "import json; print(len(json.load(open('manifest.json'))['items']))"
# all crops exist
ls crops/*.png | wc -l
# check flags
cat manifest.json | python3 -c "import json; d=json.load(open('manifest.json')); print(d['counts'])"
```

Pipeline stages used: `lq-pages`, `lq-crops`, `lq-answers`, `lq-performance`, `classify-lq`, `section-pdfs`.
"""
    (STAGING / "README.md").write_text(readme, encoding="utf-8")

    print(f"Staged {crops_exist}/{total} LQ crops to {STAGING}")
    print(f"  answers: {ans_exist}/{total}, performance: {perf_exist}/{total}")
    print(f"  manifest: {STAGING / 'manifest.json'}")
    print(f"  sections: {len([s for s in sections if s['count']>0])} with copies")
    if missing_crop_list:
        print(f"  missing crops: {missing_crop_list[:5]} ...")
    if missing_perf_list:
        print(f"  missing performance: {missing_perf_list[:5]} ... ({len(missing_perf_list)} total)")

if __name__ == "__main__":
    stage()
