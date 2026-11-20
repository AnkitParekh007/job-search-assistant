#!/usr/bin/env bash
# Disabled: source archives must never be packaged as installable platform apps.
set -euo pipefail
echo "BLOCKED: CI source-folder packaging is disabled." >&2
echo "Run the verified-native release workflow instead." >&2
exit 1
