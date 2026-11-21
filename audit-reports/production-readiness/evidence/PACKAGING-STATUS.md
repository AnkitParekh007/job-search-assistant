# Packaging status — Gate A verified (v0.1.1) / Gate B local ATS

| Item | Value |
|------|--------|
| App version | `0.1.1` |
| Readiness label | **verified** (Gate A — [GATE-A-PACKAGING.md](../GATE-A-PACKAGING.md)) |
| Gate B | Local ATS helpers **evidence-backed** (synthetic regression only — [GATE-B-ATS.md](../GATE-B-ATS.md), `GATE-B-BENCHMARK-20261121.json`). Not a universal ATS pass rate. |
| Target | macOS Apple Silicon (arm64) |
| Bundle targets | `app` only |
| Code signing | **N/A for wider beta** — adhoc only; **0** Developer ID identities — [SIGNING-STATUS-20261121.md](./SIGNING-STATUS-20261121.md) |
| Notarization | **Not done** (Gatekeeper requires right-click → Open) |
| Auto-update | **Disabled** (no updater plugin/endpoint in `tauri.conf.json`) |
| Artifact | Apple Silicon Gate B rebuild — [`ARTIFACT-PATH.txt`](./ARTIFACT-PATH.txt); release zips under `dist-release/` for tag **v0.1.2-beta** ([`SHA256SUMS-0.1.2-beta.txt`](./SHA256SUMS-0.1.2-beta.txt)) |
| Other platforms | Intel: cross-built `.app` ([`ARTIFACT-PATH-INTEL.txt`](./ARTIFACT-PATH-INTEL.txt)); Windows: source zip only — [GATE-C-MACOS-INTEL.md](../GATE-C-MACOS-INTEL.md), [GATE-C-WINDOWS.md](../GATE-C-WINDOWS.md) |

## Build result (Gate B rebuild, Apple Silicon)

- **Status:** success (see `ARTIFACT-PATH.txt` for timestamp and git state)
- **Artifact:** `apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app`
- **Size:** ~6.2 MiB
- **Signing:** adhoc — internal builds only; **not** suitable for wide distribution without Developer ID signing + notarization

## Honesty

- Do not describe this build as "signed" or "notarized".
- Do not imply Intel/Windows parity from Apple Silicon.
