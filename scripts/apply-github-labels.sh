#!/usr/bin/env bash
# Requires: gh auth with repo scope
set -euo pipefail
REPO="${REPO:-AnkitParekh007/job-search-assistant}"

create() {
  local name="$1" color="$2" desc="$3"
  if gh label list -R "$REPO" --json name --jq '.[].name' | grep -Fxq "$name"; then
    echo "exists: $name"
  else
    gh label create "$name" -R "$REPO" --color "$color" --description "$desc"
  fi
}

create "bug" "d73a4a" "Something isn't working"
create "enhancement" "a2eeef" "New feature or request"
create "documentation" "0075ca" "Docs or marketing copy"
create "good first issue" "7057ff" "Good for newcomers"
create "help wanted" "008672" "Extra attention welcome"
create "security" "ee0701" "Security-sensitive"
create "ui-ux" "f9d0c4" "Interface / interaction"
create "macos" "5319e7" "macOS desktop"
create "windows" "0052cc" "Windows desktop"
create "web" "c5def5" "Web demo client"
create "integration" "d4c5f9" "Connectors / portals"
create "testing" "fbca04" "Tests / CI"
create "blocked" "b60205" "Blocked on external dependency"
create "needs reproduction" "e4e669" "Awaiting repro steps"

echo "Done."
