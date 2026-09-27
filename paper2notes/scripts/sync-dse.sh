#!/usr/bin/env bash
# Sync paper2db classified banks to notes/_local/dse for local preview (paper2db -> paper2notes)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
P2DB="$ROOT/../paper2db"
LOCAL="$ROOT/notes/_local/dse"
mkdir -p "$LOCAL/mc" "$LOCAL/lq"
# From paper2db classified (if built) or from legacy dse-classified snapshot
if [ -d "$P2DB/classified/lq/02_Force_and_Motion" ] && ls "$P2DB/classified/lq/02_Force_and_Motion"/*.png >/dev/null 2>&1; then
  echo "Sync from paper2db/classified"
  rsync -a --include="*/" --include="*.png" --include="*.pdf" --include="*.json" --exclude="*" "$P2DB/classified/mc/" "$LOCAL/mc/" || true
  rsync -a --include="*/" --include="*.png" --include="*.pdf" --include="*.json" --exclude="*" "$P2DB/classified/lq/" "$LOCAL/lq/" || true
else
  echo "Sync from paper2notes/dse-classified snapshot (paper2db not yet built)"
  if [ -d "$ROOT/dse-classified/lq" ]; then
    rsync -a "$ROOT/dse-classified/lq/" "$LOCAL/lq/" || true
    echo "Synced LQ $LOCAL/lq"
  fi
  if [ -d "$ROOT/dse-classified/mc" ]; then
    rsync -a "$ROOT/dse-classified/mc/" "$LOCAL/mc/" 2>/dev/null || true
  fi
fi
echo "Local DSE ready at $LOCAL"
ls -R "$LOCAL" | head -40
