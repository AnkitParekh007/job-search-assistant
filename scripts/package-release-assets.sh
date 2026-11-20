#!/usr/bin/env bash
# Validate already-built native ZIPs; never substitute client source folders.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="${1:?Usage: package-release-assets.sh VERSION}"
OUT="$ROOT/dist-release"
python3 "$ROOT/scripts/verify-release-assets.py" "$OUT" "$VERSION"
(
  cd "$OUT"
  shasum -a 256 "AI-Job-Search-${VERSION}-"*.zip > SHA256SUMS.txt
)
printf "Verified native release assets and wrote checksums in %s\n" "$OUT"
