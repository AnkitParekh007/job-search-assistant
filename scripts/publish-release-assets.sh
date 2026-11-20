#!/usr/bin/env bash
# Replace GitHub Release assets for $TAG with the zips in <incoming-dir>.
# Assets that were not rebuilt stay on the release. The Apple Silicon,
# Intel, and Windows zips must all be present afterwards.
#
# Env:
#   TAG, VERSION, RELEASE_SHA
#   ARM64_REBUILT=true|false
#   SOURCE_REBUILT=true|false
#   GH_TOKEN or GITHUB_TOKEN (gh auth)
set -euo pipefail

INCOMING="${1:-incoming}"
TAG="${TAG:?TAG is required}"
VERSION="${VERSION:?VERSION is required}"
SHA="${RELEASE_SHA:?RELEASE_SHA is required}"
ARM64_REBUILT="${ARM64_REBUILT:-false}"
SOURCE_REBUILT="${SOURCE_REBUILT:-false}"
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

require_zip "AI-Job-Search-${VERSION}-macos-arm64.zip"
require_zip "AI-Job-Search-${VERSION}-macos-x64.zip"
require_zip "AI-Job-Search-${VERSION}-windows-x64.zip"

(
  cd "$COMBINED"
  sha256sum "AI-Job-Search-${VERSION}-"*.zip > SHA256SUMS.txt
)

short="${SHA:0:7}"
day="$(date -u +%Y-%m-%d)"
if [[ "$ARM64_REBUILT" == "true" ]]; then
  arm_line="macOS Apple Silicon app was rebuilt."
else
  arm_line="macOS Apple Silicon app was left as previously published because that build did not succeed."
fi
if [[ "$SOURCE_REBUILT" == "true" ]]; then
  src_line="macOS Intel and Windows packages were rebuilt."
else
  src_line="macOS Intel and Windows packages were left as previously published because that build did not succeed."
fi

STAMP="$(cat <<EOF
<!-- assets-stamp -->
Downloadable assets on this release were refreshed from \`${short}\` on ${day}.
${arm_line}
${src_line}
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

- **macOS Apple Silicon** — unsigned \`.app\` when the macOS build succeeded (right-click → Open the first time).
- **macOS Intel / Windows** — platform client packages (unzip and follow the README to build).
- The app does **not** submit applications automatically.
- Multi-provider AI support (Claude Code or Codex) is required for AI workflows.

Download page: https://job-search-assistant.rebound-ops.org/download

${STAMP}
EOF
  gh release create "$TAG" "${new_zips[@]}" "$COMBINED/SHA256SUMS.txt" \
    --target "$SHA" \
    --title "$TITLE" \
    --notes-file "$notes"
  rm -f "$notes"
fi

echo "Published ${#new_zips[@]} zip(s) to ${TAG}"
