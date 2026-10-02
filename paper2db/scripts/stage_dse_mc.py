#!/usr/bin/env python3
"""Stage DSE MC crops (2012-2026 + pp) to qb-web-ui-staging/dse-mc for /qb UI.

Reads:
  tests/reconstructed/mc/<year>/q*.png        (pipeline output, MC items 2012-2026 + pp)
  metadata/mc/llm_classifications.json        (573 MC classifications)
  tests/sections/mc/answer_keys.json          (MC keys + percentages, with manual overrides)
  scripts/classify_mc_llm.py SECTIONS         (27-section map)

Writes:
  qb-web-ui-staging/dse-mc/
    crops/<year>/qNN.png          (optimized palette PNG, 256 colors)
    crops/<year>/qNN.webp         (WebP quality 85)
    index.json                    (all staged items, full metadata)
    sections.json                 (27 sections)
    stats.json                    (counts per year/section, missing data flags)
    manifest.json                 (file list and counts)
    README.md
    .gitignore                    (ignore *.pdf)

Image optimization:
  - PNG: convert RGB -> P (adaptive 256-color palette) + optimize => ~45% size
  - WebP: quality 85, method 6 => ~20% size of original PNG
  Total staged PNG+WebP ≈ 55-60% of original 82MB.
  If only WebP were committed, ~18% (≈15 MB). Both are committed here.

Full PDFs (paper/mc/*.pdf, tests/reconstructed/mc/combined.pdf,
tests/reconstructed/mc/<year>/combined.pdf) are NOT copied; staging
.gitignore excludes *.pdf so they stay out even if someone tries.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parents[1]
STAGING = ROOT / "qb-web-ui-staging" / "dse-mc"
RECON_MC = ROOT / "tests" / "reconstructed" / "mc"
METADATA_MC = ROOT / "metadata" / "mc" / "llm_classifications.json"
ANSWER_KEYS = ROOT / "tests" / "sections" / "mc" / "answer_keys.json"
# Also fallback to older pipeline path if needed
ALT_ANSWER_KEYS = ROOT / "classified" / "mc" / "answer_keys.json"

# 2012-2026 plus the practice paper "pp". "sap" (sample paper) is not staged: its question
# labels are not detectable by mc-anchors (see README).
YEARS = [str(y) for y in range(2012, 2027)] + ["pp"]
# SECTIONS map from classify_mc_llm.py
try:
    sys.path.insert(0, str(ROOT / "scripts"))
    from classify_mc_llm import SECTIONS
    SECTION_MAP = {num: {"book": book, "section": sec, "title": title} for num, book, sec, title in SECTIONS}
except Exception:
    # fallback manual
    SECTION_MAP = {
        1: {"book": "01_Heat_and_Gases", "section": "01_Temperature_and_Heat_Transfer", "title": "Temperature and Heat Transfer"},
        2: {"book": "01_Heat_and_Gases", "section": "02_Heat_Capacity", "title": "Heat Capacity"},
        3: {"book": "01_Heat_and_Gases", "section": "03_Change_of_State", "title": "Change of State"},
        4: {"book": "01_Heat_and_Gases", "section": "04_Gas_Law_and_Kinetic_Theory", "title": "Gas Law and Kinetic Theory"},
        5: {"book": "02_Force_and_Motion", "section": "05_Motion", "title": "Motion"},
        6: {"book": "02_Force_and_Motion", "section": "06_Force", "title": "Force"},
        7: {"book": "02_Force_and_Motion", "section": "07_More_about_Forces", "title": "More about Forces"},
        8: {"book": "02_Force_and_Motion", "section": "08_Work_Energy_and_Power", "title": "Work, Energy and Power"},
        9: {"book": "02_Force_and_Motion", "section": "09_Momentum", "title": "Momentum"},
        10: {"book": "02_Force_and_Motion", "section": "10_Projectile_Motion", "title": "Projectile Motion"},
        11: {"book": "02_Force_and_Motion", "section": "11_Uniform_Circular_Motion", "title": "Uniform Circular Motion"},
        12: {"book": "02_Force_and_Motion", "section": "12_Gravitation", "title": "Gravitation"},
        13: {"book": "03A_Wave_Motion", "section": "13_Wave_Motion", "title": "Wave Motion"},
        14: {"book": "03A_Wave_Motion", "section": "14_Reflection_Refraction_and_Diffraction", "title": "Reflection, Refraction and Diffraction"},
        15: {"book": "03A_Wave_Motion", "section": "15_Interference_and_Stationary_Wave", "title": "Interference and Stationary Wave"},
        16: {"book": "03A_Wave_Motion", "section": "16_Light_and_Sound", "title": "Light and Sound"},
        17: {"book": "03B_Ray_Optics", "section": "17_Reflection_of_Light", "title": "Reflection of Light"},
        18: {"book": "03B_Ray_Optics", "section": "18_Refraction_of_Light", "title": "Refraction of Light"},
        19: {"book": "03B_Ray_Optics", "section": "19_Lenses", "title": "Lenses"},
        20: {"book": "04_Electricity_and_Magnetism", "section": "20_Electrostatics", "title": "Electrostatics"},
        21: {"book": "04_Electricity_and_Magnetism", "section": "21_Circuit_and_Power", "title": "Circuit and Power"},
        22: {"book": "04_Electricity_and_Magnetism", "section": "22_AC_and_Domestic_Electricity", "title": "AC and Domestic Electricity"},
        23: {"book": "04_Electricity_and_Magnetism", "section": "23_Electromagnetism", "title": "Electromagnetism"},
        24: {"book": "04_Electricity_and_Magnetism", "section": "24_Electromagnetic_Induction", "title": "Electromagnetic Induction"},
        25: {"book": "05_Radioactivity_and_Nuclear_Energy", "section": "25_Radiation_and_Radioactivity", "title": "Radiation and Radioactivity"},
        26: {"book": "05_Radioactivity_and_Nuclear_Energy", "section": "26_Rate_of_Decay_and_Uses_of_Radionuclides", "title": "Rate of Decay and Uses of Radionuclides"},
        27: {"book": "05_Radioactivity_and_Nuclear_Energy", "section": "27_Nuclear_Energy", "title": "Nuclear Energy"},
    }

def load_classifications():
    data = json.loads(METADATA_MC.read_text(encoding="utf-8"))
    # data is list of dicts with Year, Question, sections, reason, uncertain, PNG, StatementPreview
    return data

def load_answer_keys():
    path = ANSWER_KEYS if ANSWER_KEYS.is_file() else ALT_ANSWER_KEYS
    if not path.is_file():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    # raw: {year: {q: {Correct Option, Correct percentage}}}
    out = {}
    for year, qs in raw.items():
        for q_str, payload in qs.items():
            out[(str(year), int(q_str))] = payload
    return out

def optimize_images():
    from PIL import Image
    staged_crops = STAGING / "crops"
    staged_crops.mkdir(parents=True, exist_ok=True)
    total_orig = 0
    total_png = 0
    total_webp = 0
    count = 0
    for year in YEARS:
        src_dir = RECON_MC / year
        if not src_dir.is_dir():
            print(f"WARN: missing reconstructed dir for {year}: {src_dir}")
            continue
        dst_dir = staged_crops / year
        dst_dir.mkdir(parents=True, exist_ok=True)
        # question counts: 36 for 2012-2013, 33 for 2014-2024
        pngs = sorted(src_dir.glob("q*.png"))
        for src in pngs:
            # parse q number
            try:
                qnum = int(src.stem[1:])
            except:
                continue
            dst_png = dst_dir / f"q{qnum:02d}.png"
            dst_webp = dst_dir / f"q{qnum:02d}.webp"
            orig_size = src.stat().st_size
            total_orig += orig_size
            # Open and optimize
            im = Image.open(src)
            # Ensure RGB before palette conversion
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")
            # PNG: adaptive palette 256 colors, optimize
            # For RGB, convert to P
            im_p = im.convert("P", palette=Image.ADAPTIVE, colors=256)
            im_p.save(dst_png, optimize=True)
            total_png += dst_png.stat().st_size
            # WebP
            im.save(dst_webp, "WEBP", quality=85, method=6)
            total_webp += dst_webp.stat().st_size
            count += 1
            im.close()
            im_p.close()
    print(f"Optimized {count} images:")
    print(f"  original PNG total: {total_orig/1024/1024:.1f} MB")
    print(f"  optimized palette PNG total: {total_png/1024/1024:.1f} MB ({total_png/total_orig:.0%} of original)")
    print(f"  WebP total: {total_webp/1024/1024:.1f} MB ({total_webp/total_orig:.0%} of original)")
    print(f"  combined staged: {(total_png+total_webp)/1024/1024:.1f} MB")
    return count, total_orig, total_png, total_webp

def build_metadata(count, total_orig, total_png, total_webp):
    classifications = load_classifications()
    answer_keys = load_answer_keys()
    # filter to YEARS
    filtered = [e for e in classifications if str(e["Year"]) in YEARS]
    # sort by year then question
    filtered.sort(key=lambda e: (str(e["Year"]).zfill(4), int(e["Question"])))
    items = []
    missing_answer = 0
    missing_pct = 0
    uncertain = 0
    section_counts = Counter()
    year_counts = Counter()
    for entry in filtered:
        year = str(entry["Year"])
        q = int(entry["Question"])
        year_counts[year] += 1
        for sec in entry.get("sections", []):
            section_counts[sec] += 1
        if entry.get("uncertain"):
            uncertain += 1
        key = answer_keys.get((year, q))
        if not key or not key.get("Correct Option"):
            missing_answer += 1
        if not key or key.get("Correct percentage") is None:
            # check if deleted -> also missing
            if not key or not key.get("deleted"):
                missing_pct += 1
        # build item
        sections = entry.get("sections", [])
        section_infos = []
        for sec in sections:
            info = SECTION_MAP.get(sec, {"book": "unknown", "section": f"{sec:02d}_Unknown", "title": "Unknown"})
            section_infos.append({"num": sec, **info})
        # image paths
        png_path = f"crops/{year}/q{q:02d}.png"
        webp_path = f"crops/{year}/q{q:02d}.webp"
        # check existence
        png_exists = (STAGING / png_path).is_file()
        webp_exists = (STAGING / webp_path).is_file()
        # get image dimensions if exists
        width = height = None
        if png_exists:
            try:
                from PIL import Image
                with Image.open(STAGING / png_path) as im:
                    width, height = im.size
            except:
                pass
        item = {
            "id": f"dse-mc-{year}-{q}",
            "year": int(year) if year.isdigit() else year,
            "question": q,
            "paper": "1A",
            "type": "mc",
            "marks": 1,
            "sections": sections,
            "sectionDetails": section_infos,
            "reason": entry.get("reason", ""),
            "statementPreview": entry.get("StatementPreview", ""),
            "image": {
                "png": png_path,
                "webp": webp_path,
                "pngExists": png_exists,
                "webpExists": webp_exists,
                "width": width,
                "height": height,
            },
            "answer": {
                "option": key.get("Correct Option") if key else None,
                "percentage": key.get("Correct percentage") if key else None,
                "deleted": bool(key.get("deleted")) if key else False,
                "missing": not bool(key and key.get("Correct Option")),
            },
            "classification": {
                "uncertain": bool(entry.get("uncertain")),
                "source": "metadata/mc/llm_classifications.json",
            },
            "sourcePdf": f"paper/mc/{year}p1a.pdf" if year != "pp" else "paper/mc/ppp1a.pdf",
            "warnings": []
        }
        # warnings
        if not png_exists or not webp_exists:
            item["warnings"].append("missing_crop")
        if not key or not key.get("Correct Option"):
            item["warnings"].append("missing_answer")
        if not key or key.get("Correct percentage") is None and not (key and key.get("deleted")):
            item["warnings"].append("missing_percentage")
        if entry.get("uncertain"):
            item["warnings"].append("uncertain_classification")
        items.append(item)

    # Write index.json
    (STAGING / "index.json").write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {STAGING/'index.json'} with {len(items)} items")

    # sections.json
    sections_list = []
    for num in sorted(SECTION_MAP):
        info = SECTION_MAP[num]
        sections_list.append({"num": num, "book": info["book"], "section": info["section"], "title": info["title"], "count": section_counts.get(num, 0)})
    (STAGING / "sections.json").write_text(json.dumps(sections_list, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # stats.json
    stats = {
        "totalItems": len(items),
        "years": sorted(YEARS),
        "yearCounts": dict(year_counts),
        "sectionCounts": dict(section_counts),
        "missingAnswer": missing_answer,
        "missingPercentage": missing_pct,
        "uncertain": uncertain,
        "imageStats": {
            "count": count,
            "originalMB": round(total_orig/1024/1024, 2),
            "optimizedPngMB": round(total_png/1024/1024, 2),
            "webpMB": round(total_webp/1024/1024, 2),
            "combinedMB": round((total_png+total_webp)/1024/1024, 2),
        },
        "pipeline": {
            "stages": ["mc-anchors", "mc-split", "keys"],
            "source": "paper/mc/*p1a.pdf + paper/ans/*ans.pdf",
            "classifications": "metadata/mc/llm_classifications.json (573 MC total; sap not staged)",
        },
        "warningsSummary": {
            "missingAnswer": missing_answer,
            "missingPercentage": missing_pct,
            "uncertain": uncertain,
        }
    }
    (STAGING / "stats.json").write_text(json.dumps(stats, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # manifest.json
    manifest = {
        "generatedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "years": YEARS,
        "totalItems": len(items),
        "files": {
            "images": {
                "png": len(list((STAGING/"crops").rglob("*.png"))),
                "webp": len(list((STAGING/"crops").rglob("*.webp"))),
            },
            "metadata": ["index.json", "sections.json", "stats.json", "manifest.json", "README.md", ".gitignore"],
            "pdfExcluded": True,
        },
        "imageStats": stats["imageStats"],
        "counts": {
            "perYear": dict(year_counts),
            "perSection": dict(section_counts),
        }
    }
    (STAGING / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote stats and manifest")

    # README
    readme = f"""# DSE MC Staged Crops (2012-2026 + pp)

Generated from `paper2db` pipeline stages `mc-anchors` + `mc-split` + `keys`.

- **Years:** {', '.join(YEARS)} + pp — {len(items)} MC items (36 for 2012-2013 and pp, 33 otherwise)
- **Full MC corpus:** 573 items (2012-2026+pp+sap) in `metadata/mc/llm_classifications.json`; staged slice excludes `sap` (mc-anchors cannot locate its question labels)
- **Images:** `crops/<year>/qNN.png` (optimized palette PNG, 256 colors, ~45% of original) + `qNN.webp` (WebP q85, ~20%)
  - Original pipeline PNG total: {total_orig/1024/1024:.1f} MB
  - Optimized palette PNG: {total_png/1024/1024:.1f} MB
  - WebP: {total_webp/1024/1024:.1f} MB
  - Combined staged: {(total_png+total_webp)/1024/1024:.1f} MB (both formats kept; WebP alone is ~{total_webp/1024/1024:.1f} MB)
- **Metadata:** `index.json` per-question (year, question, paper 1A, type MC, marks 1, sections + reason, statementPreview, answer option + percentage, image paths, warnings)
- **Sections:** `sections.json` 27 sections with counts; see `stats.json` for per-year/section breakdown
- **Answer keys:** from `tests/sections/mc/answer_keys.json` (OCR + manual overrides); missing keys flagged as `warnings: ["missing_answer"]` and `missing_percentage`
- **PDFs excluded:** Full DSE PDFs (`paper/mc/*.pdf`, `tests/reconstructed/mc/combined.pdf`, per-year `combined.pdf`) are NOT staged; `.gitignore` keeps `*.pdf` out

## File types and counts

- PNG: {len(list((STAGING/'crops').rglob('*.png')))} files (optimized)
- WebP: {len(list((STAGING/'crops').rglob('*.webp')))} files
- JSON metadata: 4 files (`index.json`, `sections.json`, `stats.json`, `manifest.json`)
- Total items: {len(items)}

## Usage for /qb UI

- Load `index.json` — each item's `image.webp` (preferred) or `image.png` is the cropped question image (real crop, not placeholder)
- Filter by `sections` (topic) using `sections.json` titles; `stats.json` gives item counts per topic for UI badges
- Show `answer.option` + `answer.percentage` where present; surface `warnings` (missing_answer, missing_percentage, uncertain_classification, missing_crop) visibly for verification

## Reproduce

```bash
./pipeline --only mc-anchors,mc-split --years 2012 2013 ... 2026 pp --yes --force
./pipeline --only keys --force --yes
python3 scripts/stage_dse_mc.py
```

Intermediate anchors: `intermediate/mc/<year>/anchor.pdf` (blue dots, not staged)
"""
    (STAGING / "README.md").write_text(readme, encoding="utf-8")

    # .gitignore
    (STAGING / ".gitignore").write_text("# Never commit full PDFs, only crops\n*.pdf\n*.PDF\n# Keep staging metadata and crops\n!*.json\n!*.png\n!*.webp\n!*.md\n!crops/\n", encoding="utf-8")

def main():
    STAGING.mkdir(parents=True, exist_ok=True)
    count, total_orig, total_png, total_webp = optimize_images()
    build_metadata(count, total_orig, total_png, total_webp)
    print(f"Done staging to {STAGING}")

if __name__ == "__main__":
    main()
