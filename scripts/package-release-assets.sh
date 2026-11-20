#!/usr/bin/env bash
# Package GitHub Release download assets for the marketing download page.
# Usage: ./scripts/package-release-assets.sh [version]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-0.1.1}"
OUT="$ROOT/dist-release"
STAGE="$OUT/stage"

rm -rf "$OUT"
mkdir -p "$STAGE" "$OUT"

note() { printf '%s\n' "$*"; }

write_build_readme() {
  local dest="$1"
  local platform="$2"
  local cmds="$3"
  cat >"$dest" <<EOF
# AI Job Search Assistant ${VERSION} — ${platform}

This archive contains the platform client for AI Job Search Assistant.

## Requirements
- Node.js 20+
- Rust (stable) for desktop clients
- AI provider CLI (Claude Code and/or OpenAI Codex) for multi-provider AI workflows
- A local checkout of https://github.com/ai-job-search-dev/ai-job-search

## Build
${cmds}

## Important
- The app does **not** submit applications to employers.
- Do not push populated job-search workspaces or personal resumes to public remotes.
- Unsigned macOS builds may need right-click → Open the first time.
EOF
}

package_source_client() {
  local id="$1"
  local src="$2"
  local asset="$3"
  local title="$4"
  local cmds="$5"
  local tmp="$STAGE/$id"

  rm -rf "$tmp"
  mkdir -p "$tmp"
  # Copy client without heavy/local artifacts
  rsync -a \
    --exclude node_modules \
    --exclude dist \
    --exclude src-tauri/target \
    --exclude .DS_Store \
    "$src/" "$tmp/app/"
  write_build_readme "$tmp/README.md" "$title" "$cmds"
  printf '%s\n' "$VERSION" >"$tmp/VERSION"
  (
    cd "$STAGE"
    ditto -c -k --sequesterRsrc --keepParent "$id" "$OUT/$asset"
  )
  note "Wrote $asset"
}

# --- macOS Apple Silicon (prefer built .app) ---
AS_APP="$ROOT/apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app"
AS_ASSET="AI-Job-Search-${VERSION}-macos-arm64.zip"
if [[ -d "$AS_APP" ]]; then
  rm -rf "$STAGE/macos-arm64"
  mkdir -p "$STAGE/macos-arm64"
  ditto "$AS_APP" "$STAGE/macos-arm64/AI Job Search.app"
  cat >"$STAGE/macos-arm64/README.md" <<EOF
# AI Job Search Assistant ${VERSION} — macOS Apple Silicon

1. Unzip this archive.
2. Drag **AI Job Search.app** to Applications (or run in place).
3. First launch: right-click the app → **Open** (unsigned personal build).
4. Select your local ai-job-search workspace when prompted.

Multi-provider AI support (Claude Code or Codex) is required for AI workflows. This build does not auto-submit applications.
EOF
  (
    cd "$STAGE/macos-arm64"
    ditto -c -k --sequesterRsrc --keepParent "AI Job Search.app" "$OUT/$AS_ASSET"
    # Also keep README accessible: recreate zip with readme
  )
  # Rebuild zip including README
  rm -f "$OUT/$AS_ASSET"
  (
    cd "$STAGE"
    ditto -c -k --sequesterRsrc --keepParent macos-arm64 "$OUT/$AS_ASSET"
  )
  note "Wrote $AS_ASSET (built .app)"
else
  package_source_client \
    "macos-arm64" \
    "$ROOT/apps/macos-apple-silicon" \
    "$AS_ASSET" \
    "macOS Apple Silicon" \
    "cd app && npm install && npm run tauri build"
fi

# --- macOS Intel ---
INTEL_APP="$ROOT/apps/macos-intel/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/AI Job Search.app"
INTEL_ASSET="AI-Job-Search-${VERSION}-macos-x64.zip"
if [[ -d "$INTEL_APP" ]]; then
  rm -rf "$STAGE/macos-x64"
  mkdir -p "$STAGE/macos-x64"
  ditto "$INTEL_APP" "$STAGE/macos-x64/AI Job Search.app"
  write_build_readme "$STAGE/macos-x64/README.md" "macOS Intel (built .app)" "Open AI Job Search.app (right-click → Open if Gatekeeper prompts)."
  (
    cd "$STAGE"
    ditto -c -k --sequesterRsrc --keepParent macos-x64 "$OUT/$INTEL_ASSET"
  )
  note "Wrote $INTEL_ASSET (built .app)"
else
  package_source_client \
    "macos-x64" \
    "$ROOT/apps/macos-intel" \
    "$INTEL_ASSET" \
    "macOS Intel" \
    "cd app && npm install && npm run build:intel"
fi

# --- Windows ---
WIN_BUNDLE_DIR="$ROOT/apps/windows/src-tauri/target/release/bundle"
WIN_ASSET="AI-Job-Search-${VERSION}-windows-x64.zip"
if compgen -G "$WIN_BUNDLE_DIR/nsis/*.exe" > /dev/null || compgen -G "$WIN_BUNDLE_DIR/msi/*.msi" > /dev/null; then
  rm -rf "$STAGE/windows-x64"
  mkdir -p "$STAGE/windows-x64"
  cp -R "$WIN_BUNDLE_DIR"/nsis/*.exe "$STAGE/windows-x64/" 2>/dev/null || true
  cp -R "$WIN_BUNDLE_DIR"/msi/*.msi "$STAGE/windows-x64/" 2>/dev/null || true
  write_build_readme "$STAGE/windows-x64/README.md" "Windows x64 (installer)" "Run the NSIS/MSI installer, then launch AI Job Search."
  (
    cd "$STAGE"
    ditto -c -k --sequesterRsrc --keepParent windows-x64 "$OUT/$WIN_ASSET"
  )
  note "Wrote $WIN_ASSET (installer)"
else
  package_source_client \
    "windows-x64" \
    "$ROOT/apps/windows" \
    "$WIN_ASSET" \
    "Windows x64" \
    "cd app && npm install && npm run tauri build"
fi

# Checksums
(
  cd "$OUT"
  shasum -a 256 AI-Job-Search-${VERSION}-*.zip > SHA256SUMS.txt
)
note "Wrote SHA256SUMS.txt"
note "Release assets ready in $OUT"
ls -lh "$OUT"
