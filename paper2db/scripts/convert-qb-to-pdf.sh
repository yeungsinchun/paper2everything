#!/usr/bin/env bash
# Convert QB DOCX to PDF via LibreOffice headless, then OCR pull via Tesseract where needed.
# Mirrors paper2notes ch501/502 contract: DOCX -> PDF -> pdftoppm+Tesseract --psm 1 for equations/OLE.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
QB="$ROOT/qb"
OUT="$ROOT/qb-pdf"
mkdir -p "$OUT"
if ! command -v soffice >/dev/null 2>&1 && ! command -v libreoffice >/dev/null 2>&1; then
  echo "convert-qb-to-pdf: LibreOffice not found (soffice/libreoffice). Skipping DOCX->PDF, using existing PDFs where present." >&2
  echo "To enable: brew install --cask libreoffice (macOS) or apt install libreoffice (linux)" >&2
  # Fallback: copy existing PDFs from qb/ if any (e.g. _blank.pdf variants already rendered)
  find "$QB" -name "*.pdf" -print -exec cp -n {} "$OUT/" \; 2>/dev/null || true
  echo "convert-qb-to-pdf: fallback copied $(find "$OUT" -name "*.pdf" | wc -l) PDFs"
  exit 0
fi
LOFFICE="$(command -v soffice || command -v libreoffice)"
echo "Using $LOFFICE"
find "$QB" -name "*.docx" -print0 | while IFS= read -r -d '' doc; do
  rel="${doc#$QB/}"
  outdir="$OUT/$(dirname "$rel")"
  mkdir -p "$outdir"
  echo "Converting $rel"
  "$LOFFICE" --headless --convert-to pdf --outdir "$outdir" "$doc" >/dev/null 2>&1 || echo "Failed $rel" >&2
done
echo "Done. PDFs in $OUT: $(find "$OUT" -name "*.pdf" | wc -l)"
