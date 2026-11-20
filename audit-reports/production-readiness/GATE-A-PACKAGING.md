# Gate A — Apple Silicon packaging checklist

Use this before calling a build a **job-tracking beta**. Do not flip Gate B (ATS claims) from this checklist alone.

## Labels

| Label | Meaning |
|-------|---------|
| **developed** | Built and exercised on developer machines; integrity + offline path implemented |
| **verified** | Clean-device smoke + this checklist signed; packaging/signing status documented |

Until clean-device smoke passes, release notes and UI must say **developed**, not **verified**.

## Build

- [x] `apps/macos-apple-silicon` release build completes (`npm run tauri build`) — prior adhoc artifact; frontend rebuild verified 2026-11-21 on `feat/gate-a-production-readiness`
- [x] Artifact path recorded → [`evidence/ARTIFACT-PATH.txt`](./evidence/ARTIFACT-PATH.txt)
- [x] Code signing / notarization status: **N/A for internal beta** (adhoc / unsigned — [`evidence/PACKAGING-STATUS.md`](./evidence/PACKAGING-STATUS.md))
- [x] Auto-update: **disabled** (no updater plugin/endpoint in `tauri.conf.json`)

**Artifact (this machine):**

`apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app` (~6.2 MiB, arm64, adhoc)

## Smoke (clean Mac, Apple Silicon)

Follow [apps/macos-apple-silicon/e2e/smoke.offline.spec.md](../../apps/macos-apple-silicon/e2e/smoke.offline.spec.md).

Code status after 2026-11-21 recovery (stash + rebuilt ATS/Scout/candidate): **developed / implementation complete for Gate A tracking path**. Re-smoke the rebuilt `.app` before signing.

- [ ] Fresh launch → onboarding → absolute workspace connect — **Needs Ankit** on rebuilt app
- [x] Relative path `INVALID` rejected; prior workspace kept — **code**: `resolve_workspace_path` + Rust `relative_path_rejected_by_resolve_semantics`
- [x] Profile form saves without AI — **code**: editable Profile + `candidate/profile.json`
- [x] Manual job + “I already applied” with submission confirmation — **code**: Pipeline Add manually + confirm checkbox
- [x] Original application date preserved after status move — **code** + Rust `status_update_round_trips_and_preserves_columns`
- [x] Find jobs disabled / blocked when provider signed out — **code**: `aiProviderReady` gates Dashboard/Jobs CTAs; `ai_provider` dep requires auth
- [x] Add portal does not finish onboarding — **code**: `DepFixActions` no longer calls `finishOnboarding`
- [x] Studio integrity check shows no Python traceback — **code**: friendly error + scaffolded `tools/posting_guard.py`
- [x] Scout opens without provider calls — **code**: Scout page + HelpAssistant offline

### Automated proxies (not a substitute for UI smoke)

- [x] Core vitest + ATS benchmark: **18** tests including `runBenchmark().ok` (`packages/core`)
- [x] Rust lib tests: **34** passed (`cargo test --lib`, Apple Silicon)
- [x] Frontend production build: `apps/macos-apple-silicon` `tsc && vite build` OK
- [x] Computer Use smoke evidence (WIP-era) — [`evidence/SMOKE-COMPUTER-USE-20261121.md`](./evidence/SMOKE-COMPUTER-USE-20261121.md) — re-run after rebuild

## Honesty

- [x] README / release notes: offline tracking first; AI optional — [`RELEASE-NOTES-v0.1.1-gate-a.md`](./RELEASE-NOTES-v0.1.1-gate-a.md)
- [x] No universal ATS pass rate, guaranteed interviews, or named-employer ATS compatibility
- [x] ATS features labeled **experimental** until Gate B
- [x] Provider copy: installed ≠ authenticated ≠ workflow-capable (Settings + deps)
- [x] In-app readiness label: **developed** (sidebar footer + Settings → About)

## Evidence to attach

- [x] Stage 0 docs + [RE-AUDIT-20261121.md](./RE-AUDIT-20261121.md)
- [x] Core vitest / Rust tests green on recovery branch
- [ ] This checklist signed (name + date) — **Needs Ankit** after clean-device smoke on rebuilt `.app`

**Signer:** _________________ **Date:** _________________

---

## Where Ankit is needed

1. Rebuild the release `.app` from this branch and open it:

   ```bash
   cd apps/macos-apple-silicon && npm run tauri build
   open "src-tauri/target/release/bundle/macos/AI Job Search.app"
   ```

2. Run the nine smoke checkboxes above (especially relative `INVALID`, apply-confirm submit, signed-out Find jobs).

3. Sign this checklist — reply with name + date → then flip label to **verified**.

Do **not** market ATS optimization (Gate B) from this checklist alone. See [RE-AUDIT-20261121.md](./RE-AUDIT-20261121.md).
