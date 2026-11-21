# Packaging status — Gate A verified (v0.1.1) / Gate B local ATS

| Item | Value |
|------|--------|
| App version | `0.1.1` |
| Readiness label | **verified** (Gate A — [GATE-A-PACKAGING.md](../GATE-A-PACKAGING.md)) |
| Gate B | Local ATS helpers **evidence-backed** (synthetic regression only — [GATE-B-ATS.md](../GATE-B-ATS.md), `GATE-B-BENCHMARK-20261121.json`). Not a universal ATS pass rate. |
| Target | macOS Apple Silicon (arm64) |
| Bundle targets | `app` only |
| Code signing | **N/A for wider beta** — adhoc signature only; Developer ID signing not done |
| Notarization | **Not done** (Gatekeeper requires right-click → Open) |
| Auto-update | **Disabled** (no updater plugin/endpoint in `tauri.conf.json`) |
| Artifact | Gate B rebuild — see [`ARTIFACT-PATH.txt`](./ARTIFACT-PATH.txt) (`apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app`) |
| Other platforms | Intel / Windows: source mirrored, no build or smoke evidence on this host — [GATE-C-MACOS-INTEL.md](../GATE-C-MACOS-INTEL.md), [GATE-C-WINDOWS.md](../GATE-C-WINDOWS.md) |

## Build result (Gate B rebuild, Apple Silicon)

- **Status:** success (see `ARTIFACT-PATH.txt` for timestamp and git state)
- **Artifact:** `apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app`
- **Size:** ~6.2 MiB
- **Signing:** adhoc — internal builds only; **not** suitable for wide distribution without Developer ID signing + notarization

## Honesty

- Do not describe this build as "signed" or "notarized".
- Do not imply Intel/Windows parity from Apple Silicon.
