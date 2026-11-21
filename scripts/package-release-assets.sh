#!/usr/bin/env bash
# Package native GitHub Release download assets only.
# Refuses source-archive fallbacks and incomplete native artifacts.
#
# Usage: ./scripts/package-release-assets.sh [version]
# Optional: ONLY=macos-arm64,macos-x64,windows-x64
# Env:
#   REQUIRE_NATIVE=1 (default) — fail if a requested platform lacks a native artifact
#   SKIP_VALIDATE=1 — skip validate-macos-release.sh for macOS zips
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:-$(node -p "require('$ROOT/package.json').version")}"
ONLY="${ONLY:-macos-arm64}"
OUT="$ROOT/dist-release"
STAGE="$OUT/stage"
REQUIRE_NATIVE="${REQUIRE_NATIVE:-1}"
SKIP_VALIDATE="${SKIP_VALIDATE:-0}"
APP_BUNDLE_NAME="Job Search Assistant.app"
ASSET_PREFIX="Job-Search-Assistant"

want() {
  [[ "$ONLY" == "all" || ",$ONLY," == *",$1,"* ]]
}

die() { echo "error: $*" >&2; exit 1; }

case "$VERSION" in
  *beta*|*Beta*|*rc*|*RC*|*alpha*|*preview*|*Preview*|*-*)
    die "refusing prerelease version '$VERSION'. Official releases use plain semver, for example 0.1.3."
    ;;
esac
case "$ASSET_PREFIX" in
  *beta*|*Beta*|*preview*|*Preview*)
    die "refusing release artifact prefix '$ASSET_PREFIX'"
    ;;
esac

note() { printf '%s\n' "$*"; }

write_install_readme() {
  local dest="$1"
  local platform="$2"
  cat >"$dest" <<EOF
# Job Search Assistant ${VERSION} — ${platform}

**Signing:** ad-hoc signed, not notarized. This is a regular release version, not a prerelease tag.

## Install
1. Unzip this archive.
2. Drag **Job Search Assistant.app** to Applications (or run in place).
3. First launch may require **right-click → Open** (Gatekeeper).
4. Select your local workspace when prompted.

## Security policy
- Do **not** disable Gatekeeper or run \`spctl --master-disable\`.
- Do **not** strip quarantine attributes (\`xattr -d com.apple.quarantine\`) as a workaround.
- This package is not Apple notarized.

## Notes
- The published desktop platform for this project is macOS Apple Silicon unless this archive is an explicitly built native installer for another platform.
- The app does **not** submit applications to employers and does not guarantee interviews or job outcomes.
- AI workflows need a provider you configure. Offline tracking does not.
- Local resume checks are not a universal ATS pass rate.
- Do not push populated workspaces or personal resumes to public remotes.
EOF
}

assert_macos_app() {
  local app="$1"
  local label="$2"
  [[ -d "$app" ]] || die "$label missing native .app at: $app (source archives are not packaged)"
  local exec_name
  exec_name="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$app/Contents/Info.plist" 2>/dev/null || true)"
  [[ -n "$exec_name" && -f "$app/Contents/MacOS/$exec_name" ]] \
    || die "$label .app has no executable under Contents/MacOS (incomplete native artifact)"
}

assert_zip_is_native_macos() {
  local zip="$1"
  local listing
  listing="$(unzip -Z1 "$zip" 2>/dev/null || unzip -l "$zip")"
  printf '%s\n' "$listing" | grep -F '.app/Contents/MacOS/' >/dev/null \
    || die "refusing non-native macOS zip (no .app/Contents/MacOS): $zip"
  if printf '%s\n' "$listing" | grep -E '(^|/)app/package\.json|(^|/)src-tauri/Cargo\.toml' >/dev/null; then
    die "refusing source-archive zip: $zip"
  fi
}

# Never delete dist-release wholesale. Historical zips and checksums stay.
rm -rf "$STAGE"
mkdir -p "$STAGE" "$OUT"

PACKAGED=0

# --- macOS Apple Silicon ---
if want macos-arm64; then
  AS_TARGET="${CARGO_TARGET_DIR_OVERRIDE:-$ROOT/apps/macos-apple-silicon/src-tauri/target}"
  AS_APP="$AS_TARGET/release/bundle/macos/$APP_BUNDLE_NAME"
  AS_ASSET="${ASSET_PREFIX}-${VERSION}-macos-arm64.zip"
  if [[ ! -d "$AS_APP" ]]; then
    if [[ "$REQUIRE_NATIVE" == "1" ]]; then
      die "macos-arm64: no built .app (REQUIRE_NATIVE=1). Build first: ./scripts/build-macos-apple-silicon-preview.sh"
    else
      die "macos-arm64: no built .app — source fallback removed"
    fi
  fi
  assert_macos_app "$AS_APP" "macos-arm64"
  rm -rf "$STAGE/macos-arm64"
  mkdir -p "$STAGE/macos-arm64"
  rm -f "$OUT/$AS_ASSET"
  ditto "$AS_APP" "$STAGE/macos-arm64/$APP_BUNDLE_NAME"
  write_install_readme "$STAGE/macos-arm64/README.md" "macOS Apple Silicon"
  # Do not use --sequesterRsrc: AppleDouble/__MACOSX breaks codesign resources on extract.
  (
    cd "$STAGE"
    ditto -c -k --keepParent macos-arm64 "$OUT/$AS_ASSET"
  )
  assert_zip_is_native_macos "$OUT/$AS_ASSET"
  if [[ "$SKIP_VALIDATE" != "1" ]]; then
    EXPECT_VERSION="$VERSION" EXPECT_ARCH=arm64 FRESH_INSTALL_TEST=1 \
      "$ROOT/scripts/validate-macos-release.sh" "$OUT/$AS_ASSET"
  fi
  note "Wrote $AS_ASSET (native .app)"
  PACKAGED=$((PACKAGED + 1))
fi

# --- macOS Intel ---
if want macos-x64; then
  INTEL_APP="$ROOT/apps/macos-intel/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/$APP_BUNDLE_NAME"
  # Also accept default release bundle path when building on Intel hardware
  if [[ ! -d "$INTEL_APP" ]]; then
    INTEL_APP="$ROOT/apps/macos-intel/src-tauri/target/release/bundle/macos/$APP_BUNDLE_NAME"
  fi
  INTEL_ASSET="${ASSET_PREFIX}-${VERSION}-macos-x64.zip"
  if [[ ! -d "$INTEL_APP" ]]; then
    die "macos-x64: no built .app — source fallback removed. Cross-build or build on Intel first."
  fi
  assert_macos_app "$INTEL_APP" "macos-x64"
  rm -rf "$STAGE/macos-x64"
  mkdir -p "$STAGE/macos-x64"
  rm -f "$OUT/$INTEL_ASSET"
  ditto "$INTEL_APP" "$STAGE/macos-x64/$APP_BUNDLE_NAME"
  write_install_readme "$STAGE/macos-x64/README.md" "macOS Intel"
  (
    cd "$STAGE"
    ditto -c -k --keepParent macos-x64 "$OUT/$INTEL_ASSET"
  )
  assert_zip_is_native_macos "$OUT/$INTEL_ASSET"
  if [[ "$SKIP_VALIDATE" != "1" ]]; then
    EXPECT_VERSION="$VERSION" EXPECT_ARCH=x86_64 FRESH_INSTALL_TEST=1 \
      EXPECT_BUNDLE_ID="$(node -p "require('$ROOT/apps/macos-intel/src-tauri/tauri.conf.json').identifier")" \
      "$ROOT/scripts/validate-macos-release.sh" "$OUT/$INTEL_ASSET"
  fi
  note "Wrote $INTEL_ASSET (native .app)"
  PACKAGED=$((PACKAGED + 1))
fi

# --- Windows (NSIS/MSI only) ---
if want windows-x64; then
  WIN_BUNDLE_DIR="$ROOT/apps/windows/src-tauri/target/release/bundle"
  WIN_ASSET="${ASSET_PREFIX}-${VERSION}-windows-x64.zip"
  rm -f "$OUT/$WIN_ASSET"
  shopt -s nullglob
  WIN_EXES=("$WIN_BUNDLE_DIR"/nsis/*.exe)
  WIN_MSIS=("$WIN_BUNDLE_DIR"/msi/*.msi)
  shopt -u nullglob
  if [[ ${#WIN_EXES[@]} -eq 0 && ${#WIN_MSIS[@]} -eq 0 ]]; then
    die "windows-x64: no NSIS/MSI installer — source fallback removed. Build on Windows first."
  fi
  rm -rf "$STAGE/windows-x64"
  mkdir -p "$STAGE/windows-x64"
  [[ ${#WIN_EXES[@]} -gt 0 ]] && cp "${WIN_EXES[@]}" "$STAGE/windows-x64/"
  [[ ${#WIN_MSIS[@]} -gt 0 ]] && cp "${WIN_MSIS[@]}" "$STAGE/windows-x64/"
  cat >"$STAGE/windows-x64/README.md" <<EOF
# Job Search Assistant ${VERSION} — Windows x64

Native installer package (NSIS and/or MSI). Not a source archive.
This file is produced only from a Windows build. It is not offered as a published download until that build exists.

Run the installer, then launch Job Search Assistant.
EOF
  (
    cd "$STAGE"
    ditto -c -k --keepParent windows-x64 "$OUT/$WIN_ASSET"
  )
  note "Wrote $WIN_ASSET (native installer)"
  PACKAGED=$((PACKAGED + 1))
fi

if [[ "$PACKAGED" -eq 0 ]]; then
  die "no platforms selected/packaged (ONLY=$ONLY)"
fi

(
  cd "$OUT"
  shasum -a 256 ${ASSET_PREFIX}-${VERSION}-*.zip > "SHA256SUMS-${VERSION}.txt"
)
note "Wrote SHA256SUMS-${VERSION}.txt (left older checksum files in place)"
note "Release assets ready in $OUT (local only — not uploaded)"
ls -lh "$OUT"
