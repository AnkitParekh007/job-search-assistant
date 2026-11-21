# Gate C — macOS Intel (x86_64) packaging checklist

Mirrors [GATE-A-PACKAGING.md](./GATE-A-PACKAGING.md). Apple Silicon remains the **primary verified** target; do not imply parity from it. See [RELEASE-READINESS.md](./RELEASE-READINESS.md) Gate C.

## Status summary

| Item | Status |
|------|--------|
| Source (`apps/macos-intel`) | **Mirrored** from Apple Silicon (same integrity APIs, `events.jsonl`, `AppFolder.events`) |
| Release build | **Pending** — this host is Apple Silicon; native x86_64 build and smoke need an Intel Mac (or CI runner). Optional cross-compile: `rustup target add x86_64-apple-darwin` then `npm run tauri build -- --target x86_64-apple-darwin` — a cross-built artifact still has **no smoke evidence** |
| Smoke | **Pending (needs an Intel Mac)** |
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

- [ ] `apps/macos-intel` release build completes (`npm run tauri build`; bundle targets: `app`)
- [ ] (Optional) Cross-compiled `x86_64-apple-darwin` build from Apple Silicon recorded as *build-only*, not smoke evidence
- [ ] Artifact path recorded in `evidence/` (new file; do not reuse Apple Silicon `ARTIFACT-PATH.txt`)
- [ ] Code signing / notarization status documented for this platform
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
- [ ] Frontend production build (`tsc && vite build` in `apps/macos-intel`)
- [x] Shared `packages/core` vitest (platform-independent; run via `npm run test:core`)

## Gate B on this binary (only if ATS features are marketed)

- [ ] Local match / export validation exercised in the built app
- [ ] Reference [GATE-B-ATS.md](./GATE-B-ATS.md) evidence; no universal ATS pass rate, guaranteed interviews or named-employer compatibility

## Honesty

- [x] Public site states this platform is unsigned and not smoke-verified ([market-site Download page](../../market-site/src/pages/DownloadPage.tsx))
- [ ] README / release notes for this platform use **developed** until smoke is signed
- [ ] No notarized/signed installer claim unless actually produced

**Signer:** _pending_ **Date:** _pending_
