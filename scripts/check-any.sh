#!/usr/bin/env bash
set -euo pipefail

# Scanner for explicit `any` type usage in TypeScript files only.
# Targets type contexts like `: any`, `as any`, `Array<any>`, `Record<..., any>`.
# Scans templates, DEV_DOCS, and monitoring demo. Excludes web-framework per request.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

SCAN_PATHS=(
  "$ROOT_DIR/packages/templates/src"
  "$ROOT_DIR/DEV_DOCS"
  "$ROOT_DIR/test-package/test-project/monitoring-demo"
)

echo "Scanning for explicit 'any' type usage in TypeScript..."

FOUND=0
for path in "${SCAN_PATHS[@]}"; do
  if [ -d "$path" ]; then
    # Find explicit 'any' type usage in TypeScript files (avoid plain word matches)
    MATCHES=$(grep -RnE "(:|as)\s*any\b|\bArray<\s*any\s*>|\bRecord<[^>]*,\s*any\s*>|\bany\s*\[\]" --include='*.ts' "$path" || true)
    if [ -n "$MATCHES" ]; then
      echo "\nFound occurrences in: $path"
      echo "$MATCHES"
      FOUND=1
    fi
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo "\n✖ Explicit 'any' found. Please replace with 'unknown' or specific types."
  exit 1
else
  echo "\n✔ No explicit 'any' found in scanned paths."
fi
