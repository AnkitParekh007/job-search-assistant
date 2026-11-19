#!/usr/bin/env bash
# Linux-friendly packager used by .github/workflows/release.yml
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${VERSION:-0.1.0}"
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

WEB_ASSET="AI-Job-Search-${VERSION}-web.zip"
mkdir -p "$OUT/stage/web"
if [[ -d "$ROOT/apps/web/dist" ]]; then
  mkdir -p "$OUT/stage/web/site"
  rsync -a "$ROOT/apps/web/dist/" "$OUT/stage/web/site/"
  cat >"$OUT/stage/web/README.md" <<EOF
# AI Job Search Assistant ${VERSION} — Web demo

Static UI demo with sample data. It does not connect to Claude Code.

  npx serve site
EOF
else
  rsync -a \
    --exclude node_modules \
    --exclude dist \
    --exclude .DS_Store \
    "$ROOT/apps/web/" "$OUT/stage/web/app/"
  cat >"$OUT/stage/web/README.md" <<EOF
# AI Job Search Assistant ${VERSION} — Web demo

  cd app && npm install && npx vite build && npx serve dist
EOF
fi
echo "$VERSION" >"$OUT/stage/web/VERSION"
(cd "$OUT/stage" && zip -r -q "../$WEB_ASSET" web)
echo "Wrote $WEB_ASSET"

(cd "$OUT" && sha256sum AI-Job-Search-${VERSION}-*.zip > SHA256SUMS.txt)
ls -lh "$OUT"
