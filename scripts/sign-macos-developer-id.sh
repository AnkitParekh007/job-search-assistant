#!/usr/bin/env bash
# Optional Developer ID Application signing (requires paid Apple Developer Program).
# Activate later when APPLE_SIGNING_IDENTITY is available. No credentials are hardcoded.
#
# Usage:
#   export APPLE_SIGNING_IDENTITY="Developer ID Application: Name (TEAMID)"
#   ./scripts/sign-macos-developer-id.sh [path/to/App.app]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_TARGET="${CARGO_TARGET_DIR_OVERRIDE:-$ROOT/apps/macos-apple-silicon/src-tauri/target}"
APP="${1:-$DEFAULT_TARGET/release/bundle/macos/Job Search Assistant.app}"

if [[ ! -d "$APP" ]]; then
  echo "error: .app not found: $APP" >&2
  exit 1
fi

IDENTITY="${APPLE_SIGNING_IDENTITY:-}"
if [[ -z "$IDENTITY" || "$IDENTITY" == "-" ]]; then
  echo "error: set APPLE_SIGNING_IDENTITY to a Developer ID Application identity." >&2
  echo "  security find-identity -v -p codesigning" >&2
  echo "This script is intentionally inactive until a paid Apple account cert exists." >&2
  exit 2
fi

if ! security find-identity -v -p codesigning | grep -F "$IDENTITY" >/dev/null; then
  echo "error: identity not found in keychain: $IDENTITY" >&2
  exit 1
fi

echo "Developer ID signing with: $IDENTITY"
# Hardened runtime is required for notarization.
codesign --force --deep --options runtime --sign "$IDENTITY" "$APP"
codesign --verify --deep --strict --verbose=2 "$APP"
echo "Developer ID signature OK. Next: ./scripts/notarize-macos.sh \"$APP\""
