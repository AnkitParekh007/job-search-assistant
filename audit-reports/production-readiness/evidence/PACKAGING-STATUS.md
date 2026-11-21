# Packaging status — Phase A developer preview (`0.1.2`)

| Item | Status |
|------|--------|
| App version | `0.1.2` (package.json · tauri · Cargo · UI · market-site aligned) |
| Channel | **Developer preview** |
| Gate A | Verified job-tracking (Apple Silicon smoke) |
| Gate B | Local ATS helpers evidence-backed (synthetic only — not a universal pass rate) |
| Code signing | Ad-hoc via `scripts/sign-macos-adhoc.sh` — **0** Developer ID identities required |
| Notarization | Not done — optional scripts ready for Phase B |
| Auto-update | Disabled |
| Native packaging | Source-archive fallbacks **removed**; incomplete artifacts refused |
| GitHub asset publish | **Live** — sole release [`v0.1.2`](https://github.com/AnkitParekh007/job-search-assistant/releases/tag/v0.1.2) (`AI-Job-Search-0.1.2-macos-arm64.zip` + `SHA256SUMS.txt`) |
| Artifact (local) | `dist-release/AI-Job-Search-0.1.2-macos-arm64.zip` · SHA-256 `13750dc82ef9a6799cb675d3ca4c2fed80033bff6d7b95744f4294abac04e15e` |

## Claims allowed

- Developer-preview Apple Silicon `.app`
- Ad-hoc signed; Gatekeeper may require right-click → Open
- Gate A / Gate B evidence as documented

## Claims forbidden

- Notarized / Developer ID–signed / Mac App Store
- Source zip described as a native installer
- Universal ATS pass rates / guaranteed interviews / named-employer ATS compatibility
