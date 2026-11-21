#!/usr/bin/env bash
# Optional notarization + stapling (requires Developer ID signature + notary credentials).
# Credentials come only from env / keychain profile — never hardcoded.
#
# Usage:
#   export APPLE_NOTARY_PROFILE=ai-job-search-notary
#   ./scripts/notarize-macos.sh [path/to/App.app]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_TARGET="${CARGO_TARGET_DIR_OVERRIDE:-$ROOT/apps/macos-apple-silicon/src-tauri/target}"
APP="${1:-$DEFAULT_TARGET/release/bundle/macos/Job Search Assistant.app}"

if [[ ! -d "$APP" ]]; then
  echo "error: .app not found: $APP" >&2
  exit 1
fi

SIGN_META="$(codesign -dv --verbose=4 "$APP" 2>&1 || true)"
if ! echo "$SIGN_META" | grep -q 'Authority=Developer ID Application'; then
  echo "error: app is not Developer ID signed. Run sign-macos-developer-id.sh first." >&2
  echo "$SIGN_META" | head -20 >&2
  exit 1
fi
if echo "$SIGN_META" | grep -q 'Signature=adhoc'; then
  echo "error: ad-hoc signature cannot be notarized." >&2
  exit 1
fi

ZIP="$(mktemp -t ai-job-search-notarize).zip"
cleanup() { rm -f "$ZIP"; }
trap cleanup EXIT

echo "Packaging for notarytool: $ZIP"
ditto -c -k --keepParent "$APP" "$ZIP"

NOTARY_ARGS=()
if [[ -n "${APPLE_API_KEY_PATH:-}" && -n "${APPLE_API_KEY_ID:-}" && -n "${APPLE_API_ISSUER:-}" ]]; then
  NOTARY_ARGS+=(--key "$APPLE_API_KEY_PATH" --key-id "$APPLE_API_KEY_ID" --issuer "$APPLE_API_ISSUER")
elif [[ -n "${APPLE_NOTARY_PROFILE:-}" ]]; then
  NOTARY_ARGS+=(--keychain-profile "$APPLE_NOTARY_PROFILE")
else
  echo "error: set APPLE_NOTARY_PROFILE or APPLE_API_KEY_PATH + APPLE_API_KEY_ID + APPLE_API_ISSUER." >&2
  echo "See scripts/lib/macos-release.env.example" >&2
  exit 2
fi

echo "Submitting to Apple notary service…"
xcrun notarytool submit "$ZIP" "${NOTARY_ARGS[@]}" --wait
echo "Stapling ticket…"
xcrun stapler staple "$APP"
xcrun stapler validate "$APP"
echo "Notarization + staple OK."
echo "Assess with: spctl --assess --type execute -vv \"$APP\""
