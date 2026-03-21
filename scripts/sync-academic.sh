#!/usr/bin/env bash
# sync-academic.sh — Copy canonical index.html → academic/index.html
# Run this before any deploy or PR merge involving the UI.
set -euo pipefail

SRC="index.html"
DST="academic/index.html"

if [ ! -f "$SRC" ]; then
  echo "Error: $SRC not found in $(pwd)" >&2
  exit 1
fi

cp "$SRC" "$DST"
echo "Synced $SRC → $DST ($(wc -l < "$SRC") lines)"
