#!/usr/bin/env bash
# Sync paper2db classified banks to notes/_local/dse for local preview (paper2db -> paper2notes)
# Supports both monorepo layouts:
#   paper2db/classified  (legacy branch layout with output/ and classified/ at top)
#   paper2db/tests/sections (current main layout: tests/sections/{mc,lq} and tests/reconstructed)
#   paper2db/output, paper2db/metadata
# Generated crops stay gitignored; run ./paper2db/pipeline first to rebuild.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
P2DB="$ROOT/../paper2db"
LOCAL="$ROOT/notes/_local/dse"
mkdir -p "$LOCAL/mc" "$LOCAL/lq"

# Helper: copy section folders flattening "25_Radiation..." -> "25"
sync_sections() {
  local src_root="$1"  # e.g. paper2db/tests/sections/mc or paper2db/classified/mc
  local dst_root="$2"  # e.g. notes/_local/dse/mc
  if [ ! -d "$src_root" ]; then return 0; fi
  # Each section dir is either "25_Radiation..." or "05_Radioactivity.../25_..." nested
  # Find all leaf dirs that contain PNGs and map to numeric prefix.
  find "$src_root" -type f -name "*.png" | while read -r png; do
    # Extract section number from parent folder name (leading digits before '_' or '/')
    rel="${png#$src_root/}"
    # rel is like "25_Radiation_and_Radioactivity/2012_q31.png" or "05_Radioactivity.../25_.../2012-q11.png"
    # Find the innermost section folder that matches "NN_" pattern
    section=""
    # Prefer the leaf folder that contains the png
    leaf="$(basename "$(dirname "$png")")"
    if [[ "$leaf" =~ ^([0-9]{1,2})_ ]]; then
      section="${BASH_REMATCH[1]}"
    else
      # For nested case, check parent of leaf
      parent="$(basename "$(dirname "$(dirname "$png")")")"
      if [[ "$parent" =~ ^([0-9]{1,2})_ ]]; then
        section="${BASH_REMATCH[1]}"
      else
        # Fallback: search rel for "NN_"
        if [[ "$rel" =~ /([0-9]{1,2})_[^/]*\/[^/]*\.png$ ]]; then
          section="${BASH_REMATCH[1]}"
        fi
      fi
    fi
    if [ -z "$section" ]; then
      # Could be flat "25/2022_q31.png" already — use first path component
      first="${rel%%/*}"
      if [[ "$first" =~ ^[0-9]{1,2}$ ]]; then
        section="$first"
      fi
    fi
    if [ -n "$section" ]; then
      mkdir -p "$dst_root/$section"
      cp -n "$png" "$dst_root/$section/" 2>/dev/null || cp "$png" "$dst_root/$section/"
    fi
  done
  # Also copy PDFs per section (combined.pdf, answers.pdf, etc.)
  find "$src_root" -type f \( -name "*.pdf" -o -name "*.json" -o -name "*.csv" \) | while read -r f; do
    rel="${f#$src_root/}"
    section=""
    leaf="$(basename "$(dirname "$f")")"
    if [[ "$leaf" =~ ^([0-9]{1,2})_ ]]; then section="${BASH_REMATCH[1]}";
    elif [[ "$leaf" =~ ^[0-9]{1,2}$ ]]; then section="$leaf"; fi
    if [ -n "$section" ]; then
      mkdir -p "$dst_root/$section"
      cp -n "$f" "$dst_root/$section/" 2>/dev/null || cp "$f" "$dst_root/$section/"
    else
      # Root-level json/csv (answer_keys etc) — copy to dst root
      cp -n "$f" "$dst_root/" 2>/dev/null || true
    fi
  done
}

echo "Sync DSE: paper2db -> $LOCAL"
found=0

# 1) Current main layout: tests/sections
if [ -d "$P2DB/tests/sections/mc" ]; then
  echo "  source: paper2db/tests/sections/mc"
  sync_sections "$P2DB/tests/sections/mc" "$LOCAL/mc"
  found=1
fi
if [ -d "$P2DB/tests/sections/lq" ]; then
  echo "  source: paper2db/tests/sections/lq"
  sync_sections "$P2DB/tests/sections/lq" "$LOCAL/lq"
  found=1
fi
# Reconstructed fallback (whole papers)
if [ -d "$P2DB/tests/reconstructed/mc" ]; then
  # No section flattening needed, but keep for completeness
  echo "  note: reconstructed/mc present (whole papers)"
fi

# 2) Legacy branch layout: classified/ and output/
if [ -d "$P2DB/classified/mc" ]; then
  echo "  source: paper2db/classified/mc"
  sync_sections "$P2DB/classified/mc" "$LOCAL/mc"
  found=1
fi
if [ -d "$P2DB/classified/lq" ]; then
  echo "  source: paper2db/classified/lq"
  sync_sections "$P2DB/classified/lq" "$LOCAL/lq"
  found=1
fi
if [ -d "$P2DB/output" ]; then
  # output may contain per-year PNGs, not sections — skip
  echo "  note: paper2db/output present"
fi

# 3) Legacy snapshot in paper2notes (gitignored, present only on some disks)
if [ "$found" -eq 0 ] && [ -d "$ROOT/dse-classified" ]; then
  echo "  fallback: paper2notes/dse-classified snapshot"
  if [ -d "$ROOT/dse-classified/mc" ]; then sync_sections "$ROOT/dse-classified/mc" "$LOCAL/mc"; fi
  if [ -d "$ROOT/dse-classified/lq" ]; then sync_sections "$ROOT/dse-classified/lq" "$LOCAL/lq"; fi
  found=1
fi

# 4) If still nothing (fresh checkout without pipeline run), create placeholder
#    PNGs for Book 5 sections so the DSE deck renders without broken images.
#    Real crops appear after running ./paper2db/pipeline --force --yes
if [ "$found" -eq 0 ] || [ -z "$(find "$LOCAL" -type f -name "*.png" 2>/dev/null | head -1)" ]; then
  echo "  no generated crops found — creating placeholder DSE images for Book 5 (run ./paper2db/pipeline for real crops)"
  mkdir -p "$LOCAL/mc/25" "$LOCAL/mc/26" "$LOCAL/lq/26" "$LOCAL/lq/25"
  # Create 1x1 transparent PNG placeholders via base64 if needed, or use Python to generate labeled PNGs
  if command -v python3 >/dev/null 2>&1; then
    python3 - << 'PY'
import base64, pathlib, os
# Minimal 1x1 PNG placeholder
png_b64 = b"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
data = base64.b64decode(png_b64)
for path in [
  "paper2notes/notes/_local/dse/mc/25/2022_q31.png",
  "paper2notes/notes/_local/dse/mc/25/2015_q31.png",
  "paper2notes/notes/_local/dse/lq/26/2017-q10.png",
  "paper2notes/notes/_local/dse/lq/26/2014-q10.png",
  "paper2notes/notes/_local/dse/mc/26/2020_q32.png",
  "paper2notes/notes/_local/dse/mc/26/2012_q35.png",
]:
    p = pathlib.Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists():
        p.write_bytes(data)
PY
  fi
fi

# Also ensure per-section combined.pdf placeholders exist (empty PDF not needed, just ensure links don't 404 in CI which ignores _local)
for sec in 25 26 27 20 21 22 23 24; do
  for kind in mc lq; do
    if [ ! -e "$LOCAL/$kind/$sec/combined.pdf" ]; then
      mkdir -p "$LOCAL/$kind/$sec"
      # Create empty placeholder PDF (1 page) via Python if reportlab not available, just touch
      : > "$LOCAL/$kind/$sec/combined.pdf" 2>/dev/null || true
    fi
  done
done

echo "Local DSE ready at $LOCAL"
find "$LOCAL" -type f | head -40
ls -R "$LOCAL" 2>&1 | head -80

# Mirror to per-book _local so "../_local/dse/..." from chapter pages resolves.
# Chapter pages live at notes/bookX/chYY/.../NN-N.html and use "../_local/dse/..."
# which resolves to notes/bookX/_local/dse. The canonical location is
# notes/_local/dse (also served at /_local/dse when notes/ is the site root).
# Mirror so both work.
for book in book2 book4 book5; do
  if [ -d "$ROOT/notes/$book" ]; then
    book_local="$ROOT/notes/$book/_local/dse"
    mkdir -p "$book_local"
    # Use rsync if available, else cp -R
    if command -v rsync >/dev/null 2>&1; then
      rsync -a "$LOCAL/" "$book_local/" 2>/dev/null || true
    else
      cp -R "$LOCAL/." "$book_local/" 2>/dev/null || true
    fi
    echo "  mirrored to $book_local"
  fi
done
# Also ensure notes/_local stays populated (already) and list per-book
for book in book2 book4 book5; do
  if [ -d "$ROOT/notes/$book/_local/dse" ]; then
    echo "  $book _local: $(find "$ROOT/notes/$book/_local/dse" -type f | wc -l) files"
  fi
done
