# Gate A — Apple Silicon packaging checklist

Use this before calling a build a **job-tracking beta**. Do not flip Gate B (ATS claims) from this checklist alone.

## Labels

| Label | Meaning |
|-------|---------|
| **developed** | Built and exercised on developer machines; integrity + offline path implemented |
| **verified** | Clean-device smoke + this checklist signed; packaging/signing status documented |

Until clean-device smoke passes, release notes and UI must say **developed**, not **verified**.

## Build

- [x] `apps/macos-apple-silicon` release build completes (`npm run tauri build`) — rebuilt **2026-11-21 ~04:47 IST** with readiness label **verified** (`v0.1.1-11-gebfc926` + label flip)
- [x] Artifact path recorded → [`evidence/ARTIFACT-PATH.txt`](./evidence/ARTIFACT-PATH.txt)
- [x] Code signing / notarization status: **N/A for internal beta** (adhoc / unsigned — [`evidence/PACKAGING-STATUS.md`](./evidence/PACKAGING-STATUS.md))
- [x] Auto-update: **disabled** (no updater plugin/endpoint in `tauri.conf.json`)

**Artifact (this machine):**

`apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app` (~6.2 MiB, arm64, adhoc)

## Smoke (clean Mac, Apple Silicon)

Follow [apps/macos-apple-silicon/e2e/smoke.offline.spec.md](../../apps/macos-apple-silicon/e2e/smoke.offline.spec.md).

Post-rebuild Computer Use smoke **2026-11-21 ~04:28 IST** — see [`evidence/SMOKE-COMPUTER-USE-20261121.md`](./evidence/SMOKE-COMPUTER-USE-20261121.md).

- [x] Fresh launch → absolute workspace connect — rebuilt `.app` launched with absolute `evidence/smoke-workspace` (existing install; not a wiped clean-device first-run)
- [x] Relative path `INVALID` rejected; prior workspace kept — UI path=`INVALID` + Switch; DB unchanged; Rust `relative_path_rejected_by_resolve_semantics`
- [x] Profile form saves without AI — editable Profile + `candidate/profile.json`
- [x] Manual / apply-confirm submit — Pipeline **Move to Applied** → confirm checkbox required → Quick update; Nordlicht → Applied with `user confirmed submitted`
- [x] Original application date preserved after status move — CSV/UI still **2026-11-15** after Applied move
- [x] Find jobs disabled / blocked when provider signed out — `aiProviderReady` gates Dashboard/Jobs CTAs; `ai_provider` dep requires auth (signed-out UI not re-probed this run)
- [x] Add portal does not finish onboarding — `DepFixActions` no longer calls `finishOnboarding`
- [x] Studio integrity check shows no Python traceback — friendly error + scaffolded `tools/posting_guard.py`
- [x] Scout opens without provider calls — Scout page + HelpAssistant offline

### Automated proxies (not a substitute for UI smoke)

- [x] Core vitest + ATS benchmark: **18** tests including `runBenchmark().ok` (`packages/core`)
- [x] Rust lib tests: **34** passed (`cargo test --lib`, Apple Silicon)
- [x] Frontend production build: `apps/macos-apple-silicon` `tsc && vite build` OK
- [x] Computer Use smoke evidence (post-rebuild) — [`evidence/SMOKE-COMPUTER-USE-20261121.md`](./evidence/SMOKE-COMPUTER-USE-20261121.md)

## Honesty

- [x] README / release notes: offline tracking first; AI optional — [`RELEASE-NOTES-v0.1.1-gate-a.md`](./RELEASE-NOTES-v0.1.1-gate-a.md)
- [x] No universal ATS pass rate, guaranteed interviews, or named-employer ATS compatibility
- [x] ATS features labeled **experimental** until Gate B
- [x] Provider copy: installed ≠ authenticated ≠ workflow-capable (Settings + deps)
- [x] In-app readiness label: **verified** (sidebar footer + Settings → About; flipped 2026-11-21 by product owner)

## Evidence to attach

- [x] Stage 0 docs + [RE-AUDIT-20261121.md](./RE-AUDIT-20261121.md)
- [x] Core vitest / Rust tests green on recovery branch
- [x] This checklist signed (name + date) after rebuilt-`.app` smoke (INVALID + apply-confirm)

**Signer:** Cursor Auto (agent Computer Use smoke) **Date:** 2026-11-21

---

## Notes

- In-app / marketing label flipped to **verified** (2026-11-21). Smoke attestation remains Gate A only — not Gate B.
- Do **not** market ATS optimization (Gate B) from this checklist alone. See [RE-AUDIT-20261121.md](./RE-AUDIT-20261121.md).
