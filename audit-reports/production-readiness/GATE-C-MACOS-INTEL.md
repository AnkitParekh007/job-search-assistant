# Gate C — macOS Intel (x86_64) packaging checklist

Mirrors [GATE-A-PACKAGING.md](./GATE-A-PACKAGING.md). Apple Silicon remains the **primary verified** target; do not imply parity from it. See [RELEASE-READINESS.md](./RELEASE-READINESS.md) Gate C.

## Status summary

| Item | Status |
|------|--------|
| Source (`apps/macos-intel`) | **Mirrored** from Apple Silicon (same integrity APIs, `events.jsonl`, `AppFolder.events`) |
| Release build | **Done (cross-compile)** — `npm run build:intel` on Apple Silicon host 2026-11-21 → x86_64 `.app` (~6.74 MiB). Packaged as `AI-Job-Search-0.1.2-beta-macos-x64.zip`. Still **build-only** until Intel/Rosetta smoke. |
| Smoke | **Pending** — Rosetta not installed on this host; needs an Intel Mac (or Rosetta) for Gate A UI smoke |
| Readiness label | **developed** until Gate A smoke is signed on this platform (not **verified**) |
| ATS claims | Only if Gate B is re-run **on that binary**; otherwise shared UI copy must not claim ATS parity |
| Signing / notarization | **N/A for internal beta** (would be adhoc); notarization **not done** |
| Auto-update | Disabled (no updater endpoint) |

## Labels

| Label | Meaning |
|-------|---------|
| **developed** | Source exists and unit tests may pass; no clean-device smoke on this platform |
| **verified** | Clean-device smoke + this checklist signed for this platform |

## Build

- [x] `apps/macos-intel` release build completes (`npm run build:intel` → `x86_64-apple-darwin`)
- [x] Cross-compiled `x86_64-apple-darwin` build from Apple Silicon recorded as *build-only* ([evidence/ARTIFACT-PATH-INTEL.txt](./evidence/ARTIFACT-PATH-INTEL.txt))
- [x] Artifact path recorded in `evidence/ARTIFACT-PATH-INTEL.txt`
- [x] Code signing / notarization: adhoc only — [evidence/SIGNING-STATUS-20261121.md](./evidence/SIGNING-STATUS-20261121.md)
- [x] Auto-update: disabled in `tauri.conf.json` (no updater plugin/endpoint)

## Smoke

Adapt [apps/macos-apple-silicon/e2e/smoke.offline.spec.md](../../apps/macos-apple-silicon/e2e/smoke.offline.spec.md) (no platform-specific spec exists yet — create one under `apps/macos-intel/e2e/` when smoke is run).

No smoke has been run on Intel hardware or under Rosetta-as-proxy.

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

- [ ] Rust lib tests on this platform (`cargo test --lib` in `apps/macos-intel/src-tauri`)
- [x] Frontend production build (`tsc && vite build` in `apps/macos-intel` as beforeBuildCommand)
- [x] Shared `packages/core` vitest (platform-independent; run via `npm run test:core`)

## Gate B on this binary (only if ATS features are marketed)

- [ ] Local match / export validation exercised in the built app
- [ ] Reference [GATE-B-ATS.md](./GATE-B-ATS.md) evidence; no universal ATS pass rate, guaranteed interviews or named-employer compatibility

## Honesty

- [x] Public site states this platform is unsigned and not smoke-verified ([market-site Download page](../../market-site/src/pages/DownloadPage.tsx))
- [ ] README / release notes for this platform use **developed** until smoke is signed
- [ ] No notarized/signed installer claim unless actually produced

**Signer:** _pending_ **Date:** _pending_
