# Phase A — No-cost macOS release preparation

**Date:** 2026-11-21  
**Scope:** Developer-preview pipeline only. No Apple Developer Program spend. No GitHub Release asset overwrite.

## Implemented

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Audit Tauri 2 release / signing / packaging | Done — see `docs/release-pipeline.md`, `evidence/SIGNING-STATUS-20261121.md` |
| 2 | Local Apple Silicon ad-hoc builds without Apple credentials | Done — `scripts/build-macos-apple-silicon-preview.sh`, `scripts/sign-macos-adhoc.sh` |
| 3 | Configurable Developer ID / notarization (env only) | Done — `scripts/sign-macos-developer-id.sh`, `scripts/notarize-macos.sh`, `scripts/lib/macos-release.env.example` |
| 4 | Reusable macOS release validation | Done — `scripts/validate-macos-release.sh` |
| 5 | Remove source-archive fallbacks | Done — `package-release-assets.sh` / CI refuse source |
| 6 | Version consistency | Done — all point at `0.1.2-beta` / `v0.1.2-beta` |
| 7 | Developer-preview honesty on site + in-app | Done — Download / FAQ / Settings / App sidebar |
| 8 | No Gatekeeper disable / quarantine strip guidance | Done — scripts + docs policy |
| 9 | Optional DID/notary scripts for later | Done |
| 10 | Do not overwrite `v0.1.2-beta` | Done — publish gated (`RELEASE_PUBLISH_APPROVED` + workflow input) |
| 11 | Bundle id recommendation | Done — `docs/macos-bundle-identifier.md` (change deferred) |
| 12 | Continue production-readiness gates | Open checklist below |

## Verification evidence

See [`evidence/PHASE-A-VERIFY-20261121.md`](./evidence/PHASE-A-VERIFY-20261121.md).

## Acceptance gates still open (continue)

- [ ] First-run onboarding on a **clean** user account with the Phase A zip (quarantine intact; right-click → Open only)
- [ ] Provider validation (Claude Code and/or Codex) from Settings → Dependencies
- [ ] Application tracking: manual add → confirm submit → `user_confirmed_submitted` in `events.jsonl`
- [ ] Workspace recovery: relative path rejected; failed switch preserves prior
- [ ] Intel / Windows Gate A when native hosts available
- [ ] Phase B: Developer ID + notarization (paid account) + bundle id cutover

## Publish policy

Do **not** run:

```bash
RELEASE_PUBLISH_APPROVED=1 ./scripts/publish-release-assets.sh …
```

or workflow_dispatch with `publish_assets=true` until Ankit explicitly approves replacing release assets.
