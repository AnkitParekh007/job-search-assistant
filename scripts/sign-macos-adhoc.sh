#!/usr/bin/env bash
# Ad-hoc sign a macOS .app for local developer-preview use.
# Does not require Apple Developer Program credentials.
# Does NOT strip quarantine, change Gatekeeper, or disable system security.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Prefer the app-local target unless an explicit override is provided (ignore ambient CI sandbox CARGO_TARGET_DIR).
DEFAULT_TARGET="${CARGO_TARGET_DIR_OVERRIDE:-$ROOT/apps/macos-apple-silicon/src-tauri/target}"
APP="${1:-$DEFAULT_TARGET/release/bundle/macos/AI Job Search.app}"

if [[ ! -d "$APP" ]]; then
  echo "error: .app not found: $APP" >&2
  exit 1
fi

# Refuse Developer ID identity confusion — this script is ad-hoc only.
if [[ -n "${APPLE_SIGNING_IDENTITY:-}" && "${APPLE_SIGNING_IDENTITY}" != "-" ]]; then
  echo "error: APPLE_SIGNING_IDENTITY is set. Use scripts/sign-macos-developer-id.sh instead." >&2
  exit 1
fi

echo "Ad-hoc signing: $APP"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict --verbose=2 "$APP"
echo "Ad-hoc signature OK (developer preview — not notarized)."
echo "First launch from Downloads may require right-click → Open. Do not disable Gatekeeper."
