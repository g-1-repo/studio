#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Running Biome lint and check on templates and docs..."

pushd "$ROOT_DIR" >/dev/null

# Lint and check TypeScript template sources
bunx biome lint packages/templates/src
bunx biome check packages/templates/src

# Lint Markdown docs in DEV_DOCS (Biome will skip markdown by default; this ensures TS code blocks are fine in TS files)
# If you later add markdown support, include appropriate Biome plugins.

popd >/dev/null

echo "✔ Lint and check completed."

