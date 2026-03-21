#!/usr/bin/env bash
# verify-parity.sh — Fail if index.html and academic/index.html differ.
set -euo pipefail

if ! cmp -s index.html academic/index.html; then
  echo "Error: index.html and academic/index.html are out of sync." >&2
  echo "Run 'npm run sync' to synchronize." >&2
  diff -u index.html academic/index.html || true
  exit 1
fi
echo "Parity check passed."
