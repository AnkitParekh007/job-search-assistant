# VERIFIED-AUDIT

Source: [job-seeker-journey](../job-seeker-journey/) (Alex Morgan persona, 20 Nov 2026) + code inspection of `packages/core`, `packages/ui`, `apps/macos-apple-silicon/src-tauri`. Priority overrides from Ankit (Production Readiness Master Plan).

> **Restoration note (21 Nov 2026):** Rewritten after accidental wipe of Stage 0 markdown. Journey audit markdown under `audit-reports/job-seeker-journey/*.md` is also missing from disk (never git-tracked). Findings below remain **verified** from the prior Alex Morgan audit (20 Nov 2026) plus contemporaneous code inspection recorded in that session.

**Audit verdict:** NOT YET READY · **3.1 / 10**

**Verification legend**

| Status | Meaning |
|--------|---------|
| verified | Reproduced in audit evidence and confirmed in code |
| hypothesis | Strong code evidence; not fully re-run in this Stage 0 pass |
| not-reproduced | Claimed in docs/UI but not confirmed as a defect |

---

## Priority overrides (Ankit)

| ID | Audit severity | Override | Rationale |
|----|----------------|----------|-----------|
| BUG-01 | P0 | **P0** | Keep. False readiness blocks trust |
| BUG-02 | P1 | **P0** | Ejects onboarding; Profile/Search never reached |
| BUG-03 | P1 | P1 | Still required for Studio honesty |
| BUG-04 | P1 | **P0** | False “submitted” + date rewrite corrupts lifecycle truth |
| BUG-05 | P0 | **P0** | Keep. Destructive workspace UX |
| BUG-06 | P3 | P3 | Grammar |
| UX-02 | P1 | **P0** | Offline profile is core product |
| UX-06 | P1 | **P0** | Manual applications required for offline journey |
| MISSING-07 | P2 | **P1** | Local Scout guidance without provider |
| **NEW-P0** | — | **P0** | Provider capability truthfulness (installed ≠ auth ≠ workflow-capable) |

---

## Bugs

### BUG-01 — Provider check green while signed out

| Field | Value |
|-------|-------|
| Status | **verified** |
| Priority | **P0** |
| Evidence | `evidence/04-tools-check.webp`, `evidence/16-settings-dependencies.webp` |
| Code | `apps/macos-apple-silicon/src-tauri/src/deps.rs` — `ai_provider.ok = claude \|\| codex` binary present; `claude_auth` is optional |
| Also | Same pattern expected on intel/windows hosts |
| Acceptance | Signed-out CLI → auth required; Find jobs / Rank / Evaluate disabled with that reason |

### BUG-02 — Add portal finishes onboarding

| Field | Value |
|-------|-------|
| Status | **verified** |
| Priority | **P0** (override) |
| Evidence | `evidence/06-portal-add-failed-activity.webp` |
| Code | `packages/ui/src/components/DepFixActions.tsx` calls `finishOnboarding` after `add-portal` / Open AI Providers; `Onboarding.tsx` passes `onDone` |
| Acceptance | Add portal stays on Tools; Profile step still reachable |

### BUG-03 — Integrity check Python traceback

| Field | Value |
|-------|-------|
| Status | **verified** |
| Priority | P1 |
| Evidence | `evidence/12-integrity-check-crash.webp` |
| Code | `workspace.rs` scaffold omits `tools/posting_guard.py`; `lib.rs` always invokes it; `Studio.tsx` prints stderr |
| Acceptance | New workspace never shows traceback; missing checker → one sentence |

### BUG-04 — Date rewrite + “submitted” labeling

| Field | Value |
|-------|-------|
| Status | **verified** |
| Priority | **P0** (override) |
| Evidence | `evidence/25-pipeline-applied.webp`, `26-pipeline-drawer.webp`, `28-today-dashboard.webp` |
| Code | `workspace.rs` rewrites `date` on drafted→*; `Pipeline.tsx` labels non-drafted as “submitted”; `metrics.ts` funnel Drafted = all rows |
| Acceptance | Original date preserved; “submitted” only with `user_confirmed_submitted`; funnel Drafted = status drafted |

### BUG-05 — Relative workspace name orphans data in UI

| Field | Value |
|-------|-------|
| Status | **verified** |
| Priority | **P0** |
| Evidence | `evidence/35-invalid-workspace.webp` |
| Code | `Settings.tsx` → `set_workspace` → `ensure_workspace` creates relative path under cwd; validity fails later |
| Acceptance | `INVALID` rejected; prior workspace kept; absolute path required |

### BUG-06 — “1 thing need you today.”

| Field | Value |
|-------|-------|
| Status | **verified** |
| Priority | P3 |
| Evidence | `evidence/28-today-dashboard.webp` |
| Code | `packages/ui/src/pages/Dashboard.tsx` |
| Acceptance | Singular uses “needs” |

---

## NEW-P0 — Provider capability truthfulness

| Field | Value |
|-------|-------|
| Status | **verified** (architectural defect spanning BUG-01 + INT-01 + docs) |
| Priority | **P0** |
| Problem | UI and deps treat “CLI installed” as ready. Workflows need authenticated + workflow-capable providers. Docs disagree on which providers exist and how credentials work. |
| Code | `deps.rs`; `packages/core/src/providers.ts` (`providerSupportsWorkflow`, `providerUiStatus`); Dashboard ungated Find jobs; README/privacy vs five-provider matrix |
| Acceptance | Installed ≠ authenticated ≠ workflow-capable. Every AI CTA gated by probe + capability matrix. Unsupported ops never shown Ready. |

---

## UX issues

| ID | Status | Priority | Notes |
|----|--------|----------|-------|
| UX-01 | verified | P1 | Agent/slash vocabulary on primary surfaces |
| UX-02 | verified | **P0** | Profile read-only markdown — override to P0 |
| UX-03 | verified | P2 | Disabled controls lack reason |
| UX-04 | verified | P2 | Truncated paths; git-describe version |
| UX-05 | verified | P2 | Pipeline badge = company\|title not URL |
| UX-06 | verified | **P0** | Empty pipeline only via Studio — override to P0 |
| UX-07 | hypothesis | P2 | Terminal statuses easy to miss |
| UX-08 | verified | P3 | Empty filter keeps old detail |
| UX-09 | verified | P2 | Palette “resume” → nothing |

---

## Missing features

| ID | Status | Priority | Notes |
|----|--------|----------|-------|
| MISSING-01 | verified | P1 | Local resume/profile form (pairs with UX-02) |
| MISSING-02 | verified | P1 | Country / remote / seniority / salary filters |
| MISSING-03 | verified | P1 | Real portal connection states |
| MISSING-04 | verified | P1 | Manual application entry (= UX-06) |
| MISSING-05 | verified | P1 | Non-agent follow-up draft |
| MISSING-06 | verified | P2 | Interview scheduled vs completed |
| MISSING-07 | verified | **P1** | Ask Scout not shipped — override to P1 |

---

## Documentation / integration

| ID | Status | Priority | Notes |
|----|--------|----------|-------|
| DOC-01 | verified | P1 | Errors say `/login` |
| DOC-02 | verified | P2 | Workspace explained as agent files first |
| INT-01 | verified | P0 | Core workflows require signed-in provider (absorbs into NEW-P0 + native offline core) |
| INT-02 | verified | P2 | Gmail/Notion named, unavailable |
| INT-03 | verified | P2 | No portal CLIs |

---

## ATS Intelligence gaps (called out)

Not filed as journey bugs; required for strategic differentiator:

| Gap | Status | Priority phase |
|-----|--------|----------------|
| Local PDF/DOCX resume parse + diagnostics | missing | Phase 2 (ATS-01) |
| Structured facts with provenance / confirm | missing | Phase 2 (ATS-02) |
| Job requirement extraction (must/nice) | missing / partial score text only | Phase 2 (ATS-03) |
| Evidence-grounded match explanations | partial (stored score prose); no provenance gate | Phase 3 (ATS-04) |
| Export re-parse validation | missing | Phase 3 (ATS-05) |
| Lifecycle event log for recruiter outcomes | missing (CSV status only) | Phase 1 foundation → ATS-06 |
| ATS benchmark suite | missing | Phase 5 |
| Forbidden overclaims in marketing | hypothesis (README/docs drift) | Gate B copy review |

---

## Not reproduced as defects

| Claim | Notes |
|-------|-------|
| Ask Scout “broken” | Not shipped (MISSING-07), not a regression |
| Multi-platform parity bugs | Audit was Apple Silicon only; treat intel/Windows as Gate C evidence gaps |
| Secret leakage to disk | Not observed; still audit in Phase 5 |

---

## Stage 0 disposition

All P0 items (BUG-01/02/04/05, UX-02/06, NEW-P0, INT-01) must clear before Gate A (job-tracking beta). ATS public claims additionally require ATS-01..06 + benchmark evidence (Gate B).
