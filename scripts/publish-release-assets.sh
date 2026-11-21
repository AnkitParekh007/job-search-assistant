#!/usr/bin/env bash
# Replace GitHub Release assets for $TAG with native zips in <incoming-dir>.
#
# SAFETY: refuses to run unless RELEASE_PUBLISH_APPROVED=1.
# Phase A default is local packaging only — do not upload without explicit approval.
#
# Env:
#   TAG, VERSION, RELEASE_SHA
#   RELEASE_PUBLISH_APPROVED=1   required
#   REQUIRE_PLATFORMS=macos-arm64[,macos-x64][,windows-x64]  default: macos-arm64
#   GH_TOKEN or GITHUB_TOKEN
set -euo pipefail

if [[ "${RELEASE_PUBLISH_APPROVED:-}" != "1" ]]; then
  echo "error: publish blocked. Set RELEASE_PUBLISH_APPROVED=1 only after explicit human approval." >&2
  echo "Phase A does not upload or overwrite GitHub Release assets by default." >&2
  exit 3
fi

INCOMING="${1:-incoming}"
TAG="${TAG:?TAG is required}"
VERSION="${VERSION:?VERSION is required}"
SHA="${RELEASE_SHA:?RELEASE_SHA is required}"
REQUIRE_PLATFORMS="${REQUIRE_PLATFORMS:-macos-arm64}"
TITLE="AI Job Search Assistant ${TAG}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMBINED="$(mktemp -d)"
trap 'rm -rf "$COMBINED"' EXIT
mkdir -p "$INCOMING"

if gh release view "$TAG" >/dev/null 2>&1; then
  gh release download "$TAG" --dir "$COMBINED" --clobber
  rm -f "$COMBINED/SHA256SUMS.txt"
  EXISTS=1
else
  EXISTS=0
fi

new_zips=()
while IFS= read -r zip; do
  new_zips+=("$zip")
done < <(find "$INCOMING" -type f -name '*.zip' | sort)
if [[ ${#new_zips[@]} -eq 0 ]]; then
  echo "No new zip assets to publish." >&2
  exit 1
fi
cp "${new_zips[@]}" "$COMBINED/"

require_zip() {
  local name="$1"
  if [[ ! -f "$COMBINED/$name" ]]; then
    echo "Missing $name. Not publishing an incomplete release." >&2
    exit 1
  fi
}

assert_native_macos_zip() {
  local zip="$1"
  local listing
  listing="$(unzip -Z1 "$zip" 2>/dev/null || unzip -l "$zip")"
  printf '%s\n' "$listing" | grep -F '.app/Contents/MacOS/' >/dev/null \
    || { echo "Refusing source/incomplete macOS zip: $zip" >&2; exit 1; }
  if printf '%s\n' "$listing" | grep -E '(^|/)app/package\.json|(^|/)src-tauri/Cargo\.toml' >/dev/null; then
    echo "Refusing source-archive zip: $zip" >&2
    exit 1
  fi
}

assert_native_windows_zip() {
  local zip="$1"
  unzip -l "$zip" | grep -qiE '\.(exe|msi)$' \
    || { echo "Refusing source/incomplete Windows zip: $zip" >&2; exit 1; }
}

IFS=',' read -r -a PLATFORMS <<<"$REQUIRE_PLATFORMS"
for p in "${PLATFORMS[@]}"; do
  case "$p" in
    macos-arm64)
      require_zip "AI-Job-Search-${VERSION}-macos-arm64.zip"
      assert_native_macos_zip "$COMBINED/AI-Job-Search-${VERSION}-macos-arm64.zip"
      ;;
    macos-x64)
      require_zip "AI-Job-Search-${VERSION}-macos-x64.zip"
      assert_native_macos_zip "$COMBINED/AI-Job-Search-${VERSION}-macos-x64.zip"
      ;;
    windows-x64)
      require_zip "AI-Job-Search-${VERSION}-windows-x64.zip"
      assert_native_windows_zip "$COMBINED/AI-Job-Search-${VERSION}-windows-x64.zip"
      ;;
    *)
      echo "Unknown platform in REQUIRE_PLATFORMS: $p" >&2
      exit 1
      ;;
  esac
done

(
  cd "$COMBINED"
  shasum -a 256 AI-Job-Search-${VERSION}-*.zip > SHA256SUMS.txt 2>/dev/null \
    || sha256sum AI-Job-Search-${VERSION}-*.zip > SHA256SUMS.txt
)

short="${SHA:0:7}"
day="$(date -u +%Y-%m-%d)"
STAMP="$(cat <<EOF
<!-- assets-stamp -->
Downloadable **native** assets on this release were refreshed from \`${short}\` on ${day}.
Platforms required for this publish: ${REQUIRE_PLATFORMS}.
Channel: developer preview until notarized.
<!-- /assets-stamp -->
EOF
)"

apply_stamp() {
  local current updated notes
  current="$(gh release view "$TAG" --json body --jq .body)"
  updated="$(RELEASE_BODY="$current" RELEASE_STAMP="$STAMP" python3 - <<'PY'
import os, re
body = os.environ.get("RELEASE_BODY", "")
stamp = os.environ["RELEASE_STAMP"]
pattern = r"<!-- assets-stamp -->.*?<!-- /assets-stamp -->"
if re.search(pattern, body, flags=re.S):
    body = re.sub(pattern, stamp, body, count=1, flags=re.S)
else:
    body = body.rstrip() + "\n\n" + stamp + "\n"
print(body, end="")
PY
)"
  notes="$(mktemp)"
  printf '%s\n' "$updated" >"$notes"
  gh release edit "$TAG" --notes-file "$notes"
  rm -f "$notes"
}

if [[ "$EXISTS" == "1" ]]; then
  gh release upload "$TAG" "${new_zips[@]}" "$COMBINED/SHA256SUMS.txt" --clobber
  apply_stamp
else
  notes="$(mktemp)"
  cat >"$notes" <<EOF
Desktop packages for **AI Job Search Assistant** \`${TAG}\`.

- **macOS Apple Silicon** — developer-preview \`.app\` (ad-hoc signed unless notarized).
- First launch may need **right-click → Open**. Do not disable Gatekeeper.
- The app does **not** submit applications automatically.
- Multi-provider AI support (Claude Code or Codex) is required for AI workflows.

${STAMP}
EOF
  gh release create "$TAG" "${new_zips[@]}" "$COMBINED/SHA256SUMS.txt" \
    --target "$SHA" \
    --title "$TITLE" \
    --notes-file "$notes"
  rm -f "$notes"
fi

echo "Published ${#new_zips[@]} zip(s) to ${TAG}"
