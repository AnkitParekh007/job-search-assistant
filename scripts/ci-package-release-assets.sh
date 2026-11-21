#!/usr/bin/env bash
# CI helper — native artifacts only. Source-archive packaging has been removed.
# Prefer scripts/package-release-assets.sh on a runner that produced the .app/installer.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${VERSION:-$(node -p "require('$ROOT/package.json').version")}"
ONLY="${ONLY:-macos-arm64}"

echo "ci-package-release-assets: native-only packaging (source fallbacks removed)"
echo "VERSION=$VERSION ONLY=$ONLY"

# Refuse legacy "pack source clients on Ubuntu" usage.
if [[ "${ALLOW_SOURCE_ARCHIVES:-}" == "1" ]]; then
  echo "error: ALLOW_SOURCE_ARCHIVES is no longer supported. Ship native installers only." >&2
  exit 1
fi

export REQUIRE_NATIVE=1
exec bash "$ROOT/scripts/package-release-assets.sh" "$VERSION"
