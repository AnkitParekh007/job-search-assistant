# Clean Installation & First-Time Job-Seeker Acceptance — 2026-11-21

**Verdict: CONDITIONAL PASS** (developer-preview / ad-hoc path). Offline first-time flows work from the packaged ZIP once Gatekeeper’s expected ad-hoc friction is handled. **No P0 product defects** blocked the Alex / Nordlicht acceptance path. Remaining issues are **P1/P2** (listed below).

**Constraints honored:** no Apple Developer enrollment, no publish, no upload, no production download-link changes. Prior ad-hoc SHA-256 + signing evidence preserved.

---

## Artifact integrity (preserved)

| Item | Value |
|------|--------|
| ZIP | `dist-release/AI-Job-Search-0.1.2-beta-macos-arm64.zip` |
| SHA-256 (preserved) | `70748243dcee3b6067ac8c45b440c03c8f409e445da8b60e36fab3e738b016d5` |
| Re-hash match | **PASS** (identical to `SHA256SUMS-0.1.2-beta-adhoc-preserved.txt`) |
| Signing | ad-hoc (`flags=0x2`), identifier `dev.local.aijobsearch`, TeamIdentifier unset |
| Prior signing report | `SIGNING-STATUS-20261121.md` / `ADHOC-SIGN-ACCEPTANCE-20261121.md` — unchanged |

Install source: **packaged ZIP only** (not `target/` / build tree).

---

## Environment

| Control | Result |
|---------|--------|
| Isolated env | Harness `~/Desktop/ajs-clean-accept-20261121/` |
| Prior JSA workspace | None in clean workspace; real `~/Library/Application Support/dev.local.aijobsearch` moved aside to `real-support-backup-071304`, restored after tests |
| Fresh synthetic profile | Alex Morgan / Berlin / confirmed React+TypeScript facts |
| Workspace | `workspace-alex` (canonical tracker + `job_scraper/seen_jobs.json` Nordlicht) |
| Functional app HOME | Process used harness `home/` Application Support (GUI does not honor naive `HOME=` for a true second macOS user; Support-dir isolation used instead) |
| Gatekeeper assessments | **enabled** (`spctl --status`) — security **not** disabled |

Evidence tree: `audit-reports/production-readiness/evidence/clean-accept-20261121/`

---

## Checklist results

| # | Requirement | Result | Notes |
|---|-------------|--------|-------|
| 1 | Preserve SHA-256 + signing evidence | **PASS** | Re-hash identical; signing docs untouched |
| 2 | Fresh / isolated env, no prior workspace | **PASS** | Support backup + clean `workspace-alex` |
| 3 | Install from packaged ZIP only | **PASS** | Quarantined + functional unpacks under harness |
| 4 | Gatekeeper without disabling security | **PASS** | Assessments on; quarantined app `spctl` **rejected** (expected ad-hoc) |
| 5 | Onboarding + synthetic job-seeker | **PASS** | Welcome → workspace connected; Alex profile |
| 6 | Valid local workspace | **PASS** | Settings shows connected path; `CLAUDE.md` present |
| 7 | Discovery / fit / prep / review / track / recovery | **PASS*** | Jobs list Nordlicht; Studio integrity+local match 100%; Pipeline Drafted; kill/relaunch restores Today task. *AI draft/prep blocked by design without provider |
| 8 | Invalid inputs / interrupt / missing provider / safe retry | **PASS** | Manual Add disabled empty; Find jobs disabled; AI CTAs route to sign-in; kill→relaunch OK |
| 9 | Scout without unexpected provider calls | **PASS** | Copy: “Local help — answers from product rules, not an AI provider”; badge `DETERMINISTIC HELP · NO PROVIDER CALLS` |
| 10 | Screenshots / logs / pass-fail evidence | **PASS** | See screenshots 01–10 + `logs/` |
| 11 | Public bundle-id audit vs local data | **PASS** | See `docs/macos-bundle-identifier.md` (expanded) |
| 12 | Prepare new version (no overwrite / no publish) | **PASS** | Plan in `NEXT-VERSION-0.1.3-PREP.md`; `v0.1.2-beta` assets retained |

---

## Flow evidence (Alex / Nordlicht)

1. **Onboarding / Today (clean):** missing-provider banner; Find jobs disabled.  
2. **Jobs:** Nordlicht Senior Frontend Engineer visible from `seen_jobs.json`.  
3. **Studio:** Load Nordlicht sample → Run integrity → “Posting looks clean.” Local extract (Must: TypeScript, React). **Local match 100% · 2 strengths · 0 gaps** citing confirmed facts only.  
4. **Evaluate fit with AI:** routes toward provider setup (Claude Code “Authentication required”) — no silent provider spend.  
5. **Pipeline:** Nordlicht card under **Drafted (1)** with canonical CSV headers.  
6. **Manual add invalid:** empty form keeps **Add application** disabled.  
7. **Scout:** deterministic FAQ answers; no provider calls.  
8. **Interrupt / recovery:** kill pid → relaunch → Today shows “Submit your application to Nordlicht”; journey **1 Drafted / 0 Submitted**.  
9. **Settings:** workspace path + app data under isolated support; Claude Code signed out.

Screenshots:

| File | Subject |
|------|---------|
| `01-onboarding-welcome.webp` | First-run welcome |
| `02-today-clean-missing-provider.webp` | Today + provider gate |
| `03-jobs-nordlicht.webp` | Discovery list |
| `04-pipeline-orphan-status-before-fix.webp` | P1 repro: human CSV headers → empty columns |
| `05-scout-deterministic-no-provider.webp` | Scout offline |
| `06-pipeline-nordlicht-drafted.webp` | Tracking after canonical CSV |
| `07-pipeline-manual-add-invalid-disabled.webp` | Invalid input gate |
| `08-studio-local-match-100.webp` | Fit evaluation (local) |
| `09-settings-missing-provider.webp` | Provider auth required |
| `10-today-recovery-after-kill.webp` | Recovery |

Logs: `clean-accept-20261121/logs/` including `gatekeeper-reverify.txt`, `isolation.env`.

---

## Failures (classified)

### P0 — none

No defect prevented a first-time seeker from installing the ZIP (with documented Gatekeeper UX), connecting a workspace, discovering a job, running local integrity/match, tracking a drafted application, using Scout offline, or recovering after interrupt — without disabling macOS security or calling a paid Apple program.

### P1

| ID | Failure | Impact | Evidence |
|----|---------|--------|----------|
| CA-P1-01 | Tracker CSV using **human-readable headers** (`Date Added`, `Status`, …) loads as a row count but **does not map** into `fields.status` / kanban columns; empty status is counted toward **Submitted** funnel | Honesty / tracking: “1 application” with Drafted=0; Today showed inflated Submitted before CSV rewrite | `04-pipeline-orphan-status-before-fix.webp`; `workspace.rs` uses header strings as field keys; canonical header fix restored Drafted=1 |
| CA-P1-02 | Quarantined ZIP install is **Gatekeeper-rejected** for ad-hoc signature; double-click/`open` does not launch without **right-click → Open** (or a second unpack without re-quarantine for lab automation) | First-time friction; expected for unpaid ad-hoc, but still a distribution blocker for “download and open” | `spctl` rejected; Settings copy already warns; `gatekeeper-reverify.txt` |

### P2

| ID | Failure | Impact | Evidence |
|----|---------|--------|----------|
| CA-P2-01 | Settings **Workspace version** shows `?` for the synthetic workspace | Minor clarity | Settings AX / screenshot 09 |
| CA-P2-02 | Naive `HOME=` override is unsuitable for GUI isolation; Support-directory swap is the workable pattern | Test-harness risk if restore forgotten | Restored from `real-support-backup-071304` |
| CA-P2-03 | Hand-seeded workspace lacked `tools/posting_guard.py` until scaffolded; integrity fails with “tool missing” until `ensure_workspace` / scaffold | First-time seekers who never go through `set_workspace` path can hit this; Switch path scaffolds | Studio before scaffold vs after |
| CA-P2-04 | “Evaluate fit with AI” stays enabled with posting loaded while Claude is signed out (routes to Settings) vs Find jobs disabled | Mild CTA inconsistency | Studio + Settings |

---

## Bundle identifier (summary)

Recommended public id: **`app.jobzuu.aijobsearch`**. Changing off `dev.local.aijobsearch` **orphans** `~/Library/Application Support/dev.local.aijobsearch`, Keychain items, and TCC grants. Migration must ship with the **0.1.3** (or first notarized) cut — see expanded `docs/macos-bundle-identifier.md`. **Not applied** in this milestone.

---

## New version prep (no overwrite)

- Keep `AI-Job-Search-0.1.2-beta-macos-arm64.zip` + preserved SHA256sums as-is.  
- Next cut: **`0.1.3-beta`** (or `0.1.3-beta-adhoc`) with new ZIP name + new SHA256SUMS file under `dist-release/` — **do not** replace 0.1.2 assets.  
- Publish remains blocked unless `RELEASE_PUBLISH_APPROVED=1`.  
- Details: `audit-reports/production-readiness/evidence/NEXT-VERSION-0.1.3-PREP.md`.

---

## Post-test hygiene

- Functional app process terminated.  
- Real Application Support restored from `real-support-backup-071304`.  
- Harness left on Desktop for reproducibility; not published.

---

## Recommendation

Ship **developer-preview acceptance** as closed for this milestone. Before a wider ZIP share or any notarized build:

1. Fix **CA-P1-01** (header aliases or reject unknown headers with a clear toast).  
2. Keep Gatekeeper honesty (CA-P1-02) — do not strip quarantine in docs; plan Developer ID for public download.  
3. Cut **0.1.3** with new artifact names + optional bundle-id migration plan — only publish after explicit approval.
