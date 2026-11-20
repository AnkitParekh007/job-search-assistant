#!/usr/bin/env bash
# Linux-friendly packager used by .github/workflows/release.yml
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${VERSION:-0.1.1}"
OUT="$ROOT/dist-release"

rm -rf "$OUT"
mkdir -p "$OUT/stage"

pack_client() {
  local id="$1"
  local src="$2"
  local asset="$3"
  local title="$4"
  local cmds="$5"
  local tmp="$OUT/stage/$id"

  rm -rf "$tmp"
  mkdir -p "$tmp/app"
  rsync -a \
    --exclude node_modules \
    --exclude dist \
    --exclude src-tauri/target \
    --exclude .DS_Store \
    "$src/" "$tmp/app/"

  cat >"$tmp/README.md" <<EOF
# AI Job Search Assistant ${VERSION} — ${title}

## Build
${cmds}

Multi-provider AI support (Claude Code or Codex) is required for AI workflows. This package does not auto-submit applications.
EOF
  echo "$VERSION" >"$tmp/VERSION"
  (cd "$OUT/stage" && zip -r -q "../$asset" "$id")
  echo "Wrote $asset"
}

pack_client macos-arm64 "$ROOT/apps/macos-apple-silicon" \
  "AI-Job-Search-${VERSION}-macos-arm64.zip" "macOS Apple Silicon" \
  "cd app && npm install && npm run tauri build"

pack_client macos-x64 "$ROOT/apps/macos-intel" \
  "AI-Job-Search-${VERSION}-macos-x64.zip" "macOS Intel" \
  "cd app && npm install && npm run build:intel"

pack_client windows-x64 "$ROOT/apps/windows" \
  "AI-Job-Search-${VERSION}-windows-x64.zip" "Windows x64" \
  "cd app && npm install && npm run tauri build"

(cd "$OUT" && sha256sum AI-Job-Search-${VERSION}-*.zip > SHA256SUMS.txt)
ls -lh "$OUT"
