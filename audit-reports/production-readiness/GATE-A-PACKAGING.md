# Gate A — Apple Silicon packaging checklist

Use this before calling a build a **job-tracking beta**. Do not flip Gate B (ATS claims) from this checklist alone.

## Labels

| Label | Meaning |
|-------|---------|
| **developed** | Built and exercised on developer machines; integrity + offline path implemented |
| **verified** | Clean-device smoke + this checklist signed; packaging/signing status documented |

Until clean-device smoke passes, release notes and UI must say **developed**, not **verified**.

## Build

- [x] `apps/macos-apple-silicon` release build completes (`npm run tauri build`)
- [x] Artifact path recorded → [`evidence/ARTIFACT-PATH.txt`](./evidence/ARTIFACT-PATH.txt)
- [x] Code signing / notarization status: **N/A for internal beta** (adhoc / unsigned — [`evidence/PACKAGING-STATUS.md`](./evidence/PACKAGING-STATUS.md))
- [x] Auto-update: **disabled** (no updater plugin/endpoint in `tauri.conf.json`)

**Artifact (this machine):**

`apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app` (~6.2 MiB, arm64, adhoc)

Build log: [`evidence/tauri-build-20261121b.log`](./evidence/tauri-build-20261121b.log)

## Smoke (clean Mac, Apple Silicon)

Follow [apps/macos-apple-silicon/e2e/smoke.offline.spec.md](../../apps/macos-apple-silicon/e2e/smoke.offline.spec.md).

Agent Computer Use log (2026-11-21): [`evidence/SMOKE-COMPUTER-USE-20261121.md`](./evidence/SMOKE-COMPUTER-USE-20261121.md) — **not a substitute for Ankit signature**.

- [ ] Fresh launch → onboarding → absolute workspace connect — WIP smoke only; re-run after shipping stash
- [ ] Relative path `INVALID` rejected; prior workspace kept — **FAIL on `main`:** no absolute-path guard (fix exists in `stash@{0}` only)
- [ ] Profile form saves without AI — **FAIL on `main`:** Profile is read-only markdown
- [ ] Manual job + “I already applied” with submission confirmation — **FAIL on `main`:** no Add manually UI committed
- [ ] Original application date preserved after status move — **FAIL on `main`:** `update_status` still rewrites `date` when leaving `drafted`
- [ ] Find jobs disabled / blocked when provider signed out — **PARTIAL**
- [ ] Add portal does not finish onboarding — **FAIL on `main`:** `finishOnboarding` still called from Add portal
- [ ] Studio integrity check shows no Python traceback — **PARTIAL**
- [ ] Scout opens without provider calls — HelpAssistant yes; Scout page **missing** on `main`

### Automated proxies (not a substitute for UI smoke)

- [ ] Core vitest + ATS benchmark — **NOT on `main`**: current `@ai-job-search/core` vitest is **9** tests; `runBenchmark` / `packages/core/src/ats/` absent (prior “26/26” claim was against lost WIP). See [RE-AUDIT-20261121.md](./RE-AUDIT-20261121.md)
- [x] Release `.app` bundles successfully on Apple Silicon *(adhoc)*
- [x] Computer Use smoke evidence + screenshots — [`evidence/SMOKE-COMPUTER-USE-20261121.md`](./evidence/SMOKE-COMPUTER-USE-20261121.md) — **caveat:** smoked a local WIP binary, not committed `main` sources

## Honesty

- [x] README / release notes: offline tracking first; AI optional — README Gate A section + [`RELEASE-NOTES-v0.1.1-gate-a.md`](./RELEASE-NOTES-v0.1.1-gate-a.md)
- [x] No universal ATS pass rate, guaranteed interviews, or named-employer ATS compatibility
- [x] ATS features labeled **experimental** in Profile / Studio until Gate B
- [x] Provider copy: installed ≠ authenticated ≠ workflow-capable (Settings + README)
- [x] In-app readiness label: **developed** (sidebar footer + Settings → About)

## Evidence to attach

- [x] Stage 0 docs revision (this folder) — [`evidence/STAGE0-REVISION.txt`](./evidence/STAGE0-REVISION.txt)
- [x] Core vitest + ATS benchmark local log (`runBenchmark().ok`)
- [x] Computer Use smoke log + screenshots (`evidence/smoke-screenshots/`)
- [ ] This checklist signed (name + date) — **Needs Ankit** (blocked until relative-path fix + residual smoke)

**Signer:** _________________ **Date:** _________________

---

## Where Ankit is needed

1. **Bring the built app to the front** (Computer Use could not raise an occluded window; WebView fields often ignored AX set_value/type):

   ```bash
   open "apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app"
   ```

2. **Blocker before verified:** fix absolute-path rejection for workspace switch, then confirm Settings → type `INVALID` → error toast and prior jobs remain.

3. **Optional residual smoke:** sign Claude out → confirm Find jobs disabled; complete one Add-manually submit with confirm checkbox.

4. **Sign this checklist** — reply with your name and today’s date so we can fill **Signer** / **Date**. Only then can the build be labeled **verified**.

5. **Optional later:** Apple Developer ID + notarization for a public Gatekeeper-friendly installer. Until then signing stays **N/A for internal beta**.

6. **Data recovery (urgent):** `audit-reports/job-seeker-journey/*.md` and screenshot evidence appear wiped from disk and were never committed to git. If you have Time Machine / another clone / prior zip, restore that folder. Stage 0 docs have been rewritten in this folder.

Do **not** market ATS optimization (Gate B) from this checklist alone.
