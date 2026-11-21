# Gate C — Windows (x64) packaging checklist

Mirrors [GATE-A-PACKAGING.md](./GATE-A-PACKAGING.md). Apple Silicon remains the **primary verified** target; do not imply parity from it. See [RELEASE-READINESS.md](./RELEASE-READINESS.md) Gate C.

## Status summary

| Item | Status |
|------|--------|
| Source (`apps/windows`) | **Mirrored** from Apple Silicon (same integrity APIs, `events.jsonl`, `AppFolder.events`) |
| Release build | **Source zip only** — `AI-Job-Search-0.1.2-beta-windows-x64.zip` packages `apps/windows` for build on Windows; no NSIS/MSI from this host |
| Smoke | **N/A on this macOS host (needs Windows 10/11 x64)** |
| Readiness label | **developed** until Gate A smoke is signed on this platform (not **verified**) |
| ATS claims | Only if Gate B is re-run **on that binary**; otherwise shared UI copy must not claim ATS parity |
| Signing / notarization | **Not done** — no Authenticode signing; SmartScreen warnings expected |
| Auto-update | Disabled (no updater endpoint) |

## Labels

| Label | Meaning |
|-------|---------|
| **developed** | Source exists and unit tests may pass; no clean-device smoke on this platform |
| **verified** | Clean-device smoke + this checklist signed for this platform |

## Build

- [ ] `apps/windows` release build completes (`npm run tauri build`; bundle targets: `nsis`, `msi`)
- [ ] NSIS and MSI artifacts produced on a Windows host and recorded
- [ ] Path handling verified for Windows absolute paths (`C:\\...`) and relative-path rejection
- [ ] Artifact path recorded in `evidence/` (new file; do not reuse Apple Silicon `ARTIFACT-PATH.txt`)
- [ ] Code signing / notarization status documented for this platform
- [x] Auto-update: disabled in `tauri.conf.json` (no updater plugin/endpoint)

## Smoke

Adapt [apps/macos-apple-silicon/e2e/smoke.offline.spec.md](../../apps/macos-apple-silicon/e2e/smoke.offline.spec.md) (no platform-specific spec exists yet — create one under `apps/windows/e2e/` when smoke is run).

Smoke cannot be executed on the macOS host; a Windows run is required.

- [ ] Fresh launch → absolute workspace connect
- [ ] Relative path `INVALID` rejected; prior workspace kept
- [ ] Profile form saves without AI
- [ ] Manual / apply-confirm submit (confirm checkbox required; `user_confirmed_submitted` in `events.jsonl`)
- [ ] Original application date preserved after status move
- [ ] Find jobs disabled / blocked when provider signed out
- [ ] Add portal does not finish onboarding
- [ ] Studio integrity check shows no Python traceback
- [ ] Scout opens without provider calls

### Automated proxies (not a substitute for UI smoke)

- [ ] Rust lib tests on this platform (`cargo test --lib` in `apps/windows/src-tauri`)
- [ ] Frontend production build (`tsc && vite build` in `apps/windows`)
- [x] Shared `packages/core` vitest (platform-independent; run via `npm run test:core`)

## Gate B on this binary (only if ATS features are marketed)

- [ ] Local match / export validation exercised in the built app
- [ ] Reference [GATE-B-ATS.md](./GATE-B-ATS.md) evidence; no universal ATS pass rate, guaranteed interviews or named-employer compatibility

## Honesty

- [x] Public site states this platform is unsigned and not smoke-verified ([market-site Download page](../../market-site/src/pages/DownloadPage.tsx))
- [ ] README / release notes for this platform use **developed** until smoke is signed
- [ ] No notarized/signed installer claim unless actually produced

**Signer:** _pending_ **Date:** _pending_
