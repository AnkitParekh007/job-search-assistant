#!/usr/bin/env bash
# macOS release validation for ad-hoc and future Developer ID builds.
# Never strips quarantine, never changes Gatekeeper, never suggests disabling system security.
#
# Usage:
#   ./scripts/validate-macos-release.sh [path/to/App.app | path/to.zip]
# Env:
#   EXPECT_VERSION          default: from root package.json
#   EXPECT_BUNDLE_ID        default: from tauri.conf.json (Apple Silicon)
#   EXPECT_ARCH             default: arm64 (also accepts "universal")
#   REQUIRE_NOTARIZED=1     fail unless notarized + stapled
#   REQUIRE_DEVELOPER_ID=1  fail unless Developer ID Application signature
#   FRESH_INSTALL_TEST=1    unzip a copy to a temp dir and re-validate (quarantine preserved)
#   LAUNCH_SMOKE=1          open the .app briefly after checks (local only)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_TARGET="${CARGO_TARGET_DIR_OVERRIDE:-$ROOT/apps/macos-apple-silicon/src-tauri/target}"
INPUT="${1:-$DEFAULT_TARGET/release/bundle/macos/Job Search Assistant.app}"

EXPECT_VERSION="${EXPECT_VERSION:-$(node -p "require('$ROOT/package.json').version")}"
EXPECT_BUNDLE_ID="${EXPECT_BUNDLE_ID:-$(node -p "require('$ROOT/apps/macos-apple-silicon/src-tauri/tauri.conf.json').identifier")}"
EXPECT_ARCH="${EXPECT_ARCH:-arm64}"
REQUIRE_NOTARIZED="${REQUIRE_NOTARIZED:-0}"
REQUIRE_DEVELOPER_ID="${REQUIRE_DEVELOPER_ID:-0}"
FRESH_INSTALL_TEST="${FRESH_INSTALL_TEST:-0}"
LAUNCH_SMOKE="${LAUNCH_SMOKE:-0}"

PASS=0
FAIL=0
WARN=0
WORK=""
CLEANUPS=()

cleanup() {
  local d
  for d in "${CLEANUPS[@]:-}"; do
    [[ -n "$d" && -e "$d" ]] && rm -rf "$d"
  done
}
trap cleanup EXIT

ok() { echo "PASS  $*"; PASS=$((PASS + 1)); }
bad() { echo "FAIL  $*" >&2; FAIL=$((FAIL + 1)); }
warn() { echo "WARN  $*"; WARN=$((WARN + 1)); }

resolve_app_from_zip() {
  local zip="$1"
  local dir
  dir="$(mktemp -d "${TMPDIR:-/tmp}/ajs-validate.XXXXXX")"
  CLEANUPS+=("$dir")
  ditto -x -k "$zip" "$dir"
  local found
  found="$(find "$dir" -name "*.app" -type d | head -1 || true)"
  if [[ -z "$found" ]]; then
    bad "zip has no .app bundle (source-archive / incomplete native artifact): $zip"
    echo "---- summary: $PASS pass / $FAIL fail / $WARN warn ----"
    exit 1
  fi
  # Refuse obvious source-only layouts
  if [[ -f "$dir/macos-arm64/app/package.json" || -f "$dir/app/package.json" ]] && [[ ! -d "$found/Contents/MacOS" ]]; then
    bad "zip looks like a source client archive, not a native .app package"
    exit 1
  fi
  echo "$found"
}

APP=""
ZIP_FOR_HASH=""
if [[ -f "$INPUT" && "$INPUT" == *.zip ]]; then
  ZIP_FOR_HASH="$INPUT"
  APP="$(resolve_app_from_zip "$INPUT")"
elif [[ -d "$INPUT" && "$INPUT" == *.app ]]; then
  APP="$INPUT"
else
  bad "input must be a .app directory or a .zip containing one: $INPUT"
  exit 1
fi

echo "Validating: $APP"
echo "Expect version=$EXPECT_VERSION bundleId=$EXPECT_BUNDLE_ID arch=$EXPECT_ARCH"

# --- Real executable ---
EXEC=""
if [[ -f "$APP/Contents/Info.plist" ]]; then
  EXEC_NAME="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "$APP/Contents/Info.plist" 2>/dev/null || true)"
  if [[ -n "$EXEC_NAME" && -f "$APP/Contents/MacOS/$EXEC_NAME" ]]; then
    EXEC="$APP/Contents/MacOS/$EXEC_NAME"
    ok "executable present: Contents/MacOS/$EXEC_NAME"
  else
    bad "CFBundleExecutable missing or binary absent"
  fi
else
  bad "Info.plist missing"
fi

# --- Bundle id + version ---
if [[ -f "$APP/Contents/Info.plist" ]]; then
  BID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Contents/Info.plist" 2>/dev/null || true)"
  SHORT="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP/Contents/Info.plist" 2>/dev/null || true)"
  if [[ "$BID" == "$EXPECT_BUNDLE_ID" ]]; then
    ok "bundle id: $BID"
  else
    bad "bundle id got '$BID' want '$EXPECT_BUNDLE_ID'"
  fi
  if [[ "$SHORT" == "$EXPECT_VERSION" ]]; then
    ok "CFBundleShortVersionString: $SHORT"
  else
    bad "version got '$SHORT' want '$EXPECT_VERSION'"
  fi
fi

# --- Architecture ---
if [[ -n "$EXEC" ]]; then
  FILE_OUT="$(file -b "$EXEC" 2>/dev/null || true)"
  echo "  file: $FILE_OUT"
  case "$EXPECT_ARCH" in
    arm64)
      if echo "$FILE_OUT" | grep -q 'arm64'; then ok "architecture arm64"
      else bad "expected arm64 binary, got: $FILE_OUT"
      fi
      ;;
    x86_64|amd64)
      if echo "$FILE_OUT" | grep -Eq 'x86_64|i386'; then ok "architecture x86_64"
      else bad "expected x86_64 binary, got: $FILE_OUT"
      fi
      ;;
    universal)
      if echo "$FILE_OUT" | grep -qi 'universal'; then ok "architecture universal"
      else bad "expected universal binary, got: $FILE_OUT"
      fi
      ;;
    *)
      warn "unknown EXPECT_ARCH=$EXPECT_ARCH — skipped arch assert"
      ;;
  esac
fi

# --- Code signature integrity ---
if codesign --verify --deep --strict "$APP" 2>/dev/null; then
  ok "codesign --verify --deep --strict"
else
  bad "codesign verify failed"
fi

SIGN_META="$(codesign -dv --verbose=4 "$APP" 2>&1 || true)"
echo "$SIGN_META" | grep -E '^(Authority|Identifier|Format|Signature|TeamIdentifier)=' | sed 's/^/  /' || true

IS_ADHOC=0
IS_DID=0
if echo "$SIGN_META" | grep -q 'Signature=adhoc'; then
  IS_ADHOC=1
elif echo "$SIGN_META" | grep -q 'Authority=Developer ID Application'; then
  IS_DID=1
elif ! echo "$SIGN_META" | grep -q 'Authority='; then
  # Unsigned often still "fails" verify; already counted
  IS_ADHOC=1
fi

if [[ "$REQUIRE_DEVELOPER_ID" == "1" ]]; then
  if [[ "$IS_DID" == "1" ]]; then ok "Developer ID Application required and present"
  else bad "REQUIRE_DEVELOPER_ID=1 but app is not Developer ID signed"
  fi
elif [[ "$IS_ADHOC" == "1" ]]; then
  ok "ad-hoc signature (not notarized)"
elif [[ "$IS_DID" == "1" ]]; then
  ok "Developer ID Application signature present"
else
  warn "signature type unclear — inspect codesign -dv output above"
fi

# --- Notarization / stapling (where applicable) ---
STAPLE_OUT="$(xcrun stapler validate "$APP" 2>&1 || true)"
if echo "$STAPLE_OUT" | grep -qi 'The validate action worked\|explicitly stapled'; then
  ok "stapler validate"
elif [[ "$REQUIRE_NOTARIZED" == "1" ]]; then
  bad "REQUIRE_NOTARIZED=1 but stapler validate failed: $STAPLE_OUT"
else
  warn "not stapled / not notarized (expected for ad-hoc builds): $STAPLE_OUT"
fi

SPCTL_OUT="$(spctl --assess --type execute -vv "$APP" 2>&1 || true)"
if echo "$SPCTL_OUT" | grep -qi 'accepted'; then
  ok "spctl assess accepted"
elif [[ "$REQUIRE_NOTARIZED" == "1" ]]; then
  bad "REQUIRE_NOTARIZED=1 but spctl rejected: $SPCTL_OUT"
else
  warn "spctl assess not accepted (expected for ad-hoc). First launch: right-click → Open."
  warn "Do not run spctl --master-disable or strip quarantine to bypass Gatekeeper."
fi

# --- SHA-256 ---
if [[ -n "$ZIP_FOR_HASH" ]]; then
  HASH="$(shasum -a 256 "$ZIP_FOR_HASH" | awk '{print $1}')"
  ok "zip sha256: $HASH"
  echo "  file: $ZIP_FOR_HASH"
else
  # Hash the main executable for evidence
  if [[ -n "$EXEC" ]]; then
    HASH="$(shasum -a 256 "$EXEC" | awk '{print $1}')"
    ok "executable sha256: $HASH"
  fi
fi

# --- Fresh-download install test (quarantine preserved) ---
if [[ "$FRESH_INSTALL_TEST" == "1" ]]; then
  if [[ -z "$ZIP_FOR_HASH" ]]; then
    # Create a zip from the app to simulate a download package
    WORK="$(mktemp -d "${TMPDIR:-/tmp}/ajs-fresh.XXXXXX")"
    CLEANUPS+=("$WORK")
    STAGE="$WORK/stage"
    mkdir -p "$STAGE"
    APP_BASENAME="$(basename "$APP")"
    ditto "$APP" "$STAGE/$APP_BASENAME"
    ditto -c -k --sequesterRsrc --keepParent "$STAGE/$APP_BASENAME" "$WORK/download.zip"
    ZIP_FOR_HASH="$WORK/download.zip"
  fi
  FRESH="$(mktemp -d "${TMPDIR:-/tmp}/ajs-fresh-install.XXXXXX")"
  CLEANUPS+=("$FRESH")
  # Simulate browser download quarantine without disabling security
  ditto -x -k "$ZIP_FOR_HASH" "$FRESH"
  FRESH_APP="$(find "$FRESH" -name "*.app" -type d | head -1)"
  if [[ -z "$FRESH_APP" ]]; then
    bad "fresh install: no .app after unzip"
  else
    ok "fresh install: unzipped .app at $FRESH_APP"
    # Apply quarantine as Gatekeeper would for internet downloads (test realism)
    xattr -w com.apple.quarantine "0081;$(printf '%x' "$(date +%s)");Preview;PhaseA" "$FRESH_APP" 2>/dev/null || true
    Q="$(xattr -p com.apple.quarantine "$FRESH_APP" 2>/dev/null || true)"
    if [[ -n "$Q" ]]; then
      ok "fresh install: quarantine attribute present (not stripped)"
    else
      warn "fresh install: could not set/read quarantine attribute"
    fi
    if codesign --verify --deep --strict "$FRESH_APP" 2>/dev/null; then
      ok "fresh install: codesign still verifies under quarantine"
    else
      bad "fresh install: codesign failed after unzip"
    fi
    # Explicitly do NOT clear quarantine
    if xattr -l "$FRESH_APP" 2>/dev/null | grep -q 'com.apple.quarantine'; then
      ok "policy: quarantine left intact (no xattr clear / no Gatekeeper disable)"
    fi
  fi
fi

# --- Optional launch smoke ---
if [[ "$LAUNCH_SMOKE" == "1" ]]; then
  echo "Launching briefly (LAUNCH_SMOKE=1)…"
  open "$APP"
  sleep 3
  ok "open invoked (manual UI confirmation still required for Gate A checklist)"
fi

echo "---- summary: $PASS pass / $FAIL fail / $WARN warn ----"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
exit 0
