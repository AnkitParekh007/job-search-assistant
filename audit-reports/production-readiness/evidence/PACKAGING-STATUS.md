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
| GitHub asset publish | **Gated** — will not overwrite `v0.1.2` without approval |
| Artifact (local) | `apps/macos-apple-silicon/.../AI Job Search.app` after preview build |

## Claims allowed

- Developer-preview Apple Silicon `.app`
- Ad-hoc signed; Gatekeeper may require right-click → Open
- Gate A / Gate B evidence as documented

## Claims forbidden

- Notarized / Developer ID–signed / Mac App Store
- Source zip described as a native installer
- Universal ATS pass rates / guaranteed interviews / named-employer ATS compatibility
