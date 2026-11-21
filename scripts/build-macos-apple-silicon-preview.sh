#!/usr/bin/env bash
# No-cost developer-preview pipeline: Tauri build → ad-hoc sign → validate.
# Does not publish GitHub Release assets and does not require Apple Developer credentials.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$ROOT/apps/macos-apple-silicon"
# Keep artifacts under the app tree so sign/validate/package scripts agree
# (ignore sandbox/CI CARGO_TARGET_DIR redirects that would leave a stale .app behind).
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR_OVERRIDE:-$APP_DIR/src-tauri/target}"
APP="$CARGO_TARGET_DIR/release/bundle/macos/AI Job Search.app"
VERSION="$(node -p "require('$ROOT/package.json').version")"

echo "== Phase A preview build (v${VERSION}) =="
echo "Working directory: $APP_DIR"
echo "CARGO_TARGET_DIR=$CARGO_TARGET_DIR"

cd "$APP_DIR"
npm run tauri build

# Prefer ad-hoc when no Developer ID identity is configured.
if [[ -n "${APPLE_SIGNING_IDENTITY:-}" && "${APPLE_SIGNING_IDENTITY}" != "-" ]]; then
  echo "APPLE_SIGNING_IDENTITY set — using Developer ID signer"
  "$ROOT/scripts/sign-macos-developer-id.sh" "$APP"
else
  "$ROOT/scripts/sign-macos-adhoc.sh" "$APP"
fi

EXPECT_VERSION="$VERSION" EXPECT_ARCH=arm64 FRESH_INSTALL_TEST=1 \
  "$ROOT/scripts/validate-macos-release.sh" "$APP"

echo
echo "Preview build ready: $APP"
echo "Package locally (no upload): REQUIRE_NATIVE=1 ./scripts/package-release-assets.sh ${VERSION}"
echo "Do not upload to GitHub Releases without explicit approval."
