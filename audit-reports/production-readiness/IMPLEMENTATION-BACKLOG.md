# IMPLEMENTATION-BACKLOG

Ordered P0→P3 by phase. Dependencies and Definition of Done (DoD) included. ATS-01..06 mapped. No product code before Stage 0 approval (this doc set).

---

## Stage 0 — Planning (this folder)

| ID | Item | DoD |
|----|------|-----|
| S0-1 | VERIFIED-AUDIT.md | All BUG/UX/MISSING/DOC/INT + NEW-P0 + ATS gaps classified |
| S0-2 | GAP-ANALYSIS.md | Native/AI/ATS gaps + doc conflicts + security |
| S0-3 | TARGET-ARCHITECTURE.md | Domains A–E, ATS APIs, canonical model |
| S0-4 | IMPLEMENTATION-BACKLOG.md | This file |
| S0-5 | ACCEPTANCE-MATRIX.md | Per-issue tests + ATS-01..06 + gates |
| S0-6 | RELEASE-READINESS.md | Gate A/B/C |

**Exit:** Ankit approves docs → Phase 1.

---

## Phase 1 — Data integrity and stability (P0)

**Depends on:** Stage 0. **Unlocks:** safe workspace + truthful status/events foundation.

| ID | Priority | Item | Approach | Failure cases | DoD |
|----|----------|------|----------|---------------|-----|
| P1-01 | P0 | BUG-05 workspace safety | Absolute existing dir or explicit create; canonicalize; failed switch keeps prior | relative `INVALID`, missing parent, permission denied | Rust + Settings tests; no accidental scaffold under cwd |
| P1-02 | P0 | BUG-04 + lifecycle foundation | Event log skeleton; stop date rewrite; Applied needs confirmation; funnel Drafted = drafted | move without confirm; old CSV rows | Rust + vitest; UI not “submitted” without event |
| P1-03 | P0 | BUG-01 + NEW-P0 | Installed ≠ auth ≠ capable; gate Find/Rank/Evaluate/setup; human CTAs | signed-out Claude; unsupported provider workflow | deps.rs all hosts; UI disabled reason |
| P1-04 | P0 | BUG-02 | Stop finishOnboarding on Add portal / Open providers | failed portal run | stays on Tools |
| P1-05 | P1 | BUG-03 | Scaffold/bundle posting_guard + one-sentence errors | missing script | no traceback in Studio |
| P1-06 | P3 | BUG-06 | Grammar fix | n=1 | Dashboard copy |
| P1-07 | P0 | Canonical skeleton | `meta.json` schema_version + backup-before-migrate hooks | missing meta | ensure_workspace writes version |

**Suggested PR order:** P1-01 → P1-02 → P1-03 → P1-04 → P1-05 → P1-07 → P1-06.

**Exit gate:** No destructive workspace behavior, false readiness, or misleading submission status. Regression tests for each fix.

---

## Phase 2 — Offline journey + ATS foundation (P0)

**Depends on:** Phase 1. **Unlocks:** meaningful offline use + parse/extract.

| ID | Priority | Item | ATS map | DoD |
|----|----------|------|---------|-----|
| P2-01 | P0 | Editable profile form; inferred vs confirmed; work auth unknown unless set | ATS-02 | Round-trip without AI |
| P2-02 | P0 | Local PDF/DOCX parse + diagnostics | ATS-01 | Fixture resumes; diagnostics in UI |
| P2-03 | P0 | Structured facts + provenance (span / user edit) | ATS-02 | Unconfirmed excluded from export default |
| P2-04 | P0 | Job requirement extraction (rules) | ATS-03 | Fixture postings → must/nice |
| P2-05 | P0 | Search prefs + filters (country, remote, salary, seniority) | — | MISSING-02 |
| P2-06 | P0 | Manual job entry + provenance/freshness | — | source_url, first_seen, last_verified |
| P2-07 | P0 | Manual applications (UX-06) + follow-up/interview events | ATS-06 | Offline apply-confirm path |
| P2-08 | P1 | Pipeline badge by job id/URL (UX-05); disabled reasons; clear detail | — | UX-03/05/08 |
| P2-09 | P0 | Migrate legacy CSV/seen_jobs → canonical with backup | — | One-shot; rollback path |

**Exit gate:** Offline journey with no AI; local resume parse produces editable structured facts.

---

## Phase 3 — Providers + evidence-grounded ATS (P1)

**Depends on:** Phase 2.

| ID | Priority | Item | ATS map | DoD |
|----|----------|------|---------|-----|
| P3-01 | P1 | Per-provider matrix verification (Claude, Codex, OpenAI API, Gemini, Ollama) | — | Probe suite; no invented success |
| P3-02 | P1 | Doc truthfulness (README/privacy/MULTI-PROVIDER) | NEW-P0 | Single matrix |
| P3-03 | P1 | Evidence-grounded match | ATS-04 | Golden cases; fail on absent facts |
| P3-04 | P1 | Truthful tailor (capability-gated) + user review | ATS-04/05 | No invented employers/dates |
| P3-05 | P1 | Deterministic export re-parse validation | ATS-05 | Block/warn with reason |
| P3-06 | P1 | Safe cancel/interrupt; sanitized errors | — | No raw `/login` as only help |

**Exit gate:** Unsupported ops never Ready; match/tailor cite evidence or refuse.

---

## Phase 4 — Onboarding + Scout (P1)

**Depends on:** Phase 2 (can parallel late Phase 3).

| ID | Priority | Item | DoD |
|----|----------|------|-----|
| P4-01 | P1 | Resume/profile-first onboarding; Add portal never finishes setup | Profile before Ready |
| P4-02 | P1 | Human labels (UX-01); slash commands on Workflows only | Primary CTAs plain language |
| P4-03 | P1 | Local deterministic Scout (MISSING-07) incl. ATS help | No provider calls |
| P4-04 | P2 | Palette: resume, ATS, follow-up (UX-09) | Matches open right screens |

**Exit gate:** New user navigates without Terminal or external docs.

---

## Phase 5 — Security, recovery, benchmark, quality (P0/P1)

**Depends on:** Phase 3 (+ Phase 4 for Scout a11y).

| ID | Priority | Item | DoD |
|----|----------|------|-----|
| P5-01 | P0 | Filesystem confinement, symlink, atomic writes, concurrency | Tests green |
| P5-02 | P0 | Secrets / personal-data audit; prompt-injection boundaries | Written findings + fixes |
| P5-03 | P0 | Backup/restore + schema migration **and rollback** | Round-trip fixture workspace |
| P5-04 | P0 | ATS benchmark suite (privacy by default) | CI-runnable; consent rules documented |
| P5-05 | P1 | Desktop e2e (Tauri + FS + CLI) | Offline profile→job→confirm→track; export validate |
| P5-06 | P1 | A11y/keyboard; crash recovery; opt-in diagnostics | Checklist + smoke |

---

## Phase 6 — Release gates (P0)

| ID | Priority | Item | Gate |
|----|----------|------|------|
| P6-01 | P0 | Apple Silicon packaging/signing/update honesty | A |
| P6-02 | P0 | Clean-device smoke; developed vs verified labeling | A |
| P6-03 | P0 | ATS claims copy review; zero forbidden claims | B |
| P6-04 | P0 | Publish/attach benchmark evidence under consent | B |
| P6-05 | P1 | Intel/Windows evidence when claiming those platforms | C |

---

## Dependency graph (summary)

```
S0 → P1 → P2 → P3 → P5 → P6(A then B)
           ↘ P4 ↗
```

---

## Execution rules

- Small PRs; run affected tests after each change.
- Preserve candidate records; migrate with backup; no indefinite dual-write after migration window.
- No invented integrations; no new paid deps without approval.
- No release or external services without approval.
- Do not mark done without ACCEPTANCE-MATRIX evidence.
- Candidate data and benchmarks private by default.
