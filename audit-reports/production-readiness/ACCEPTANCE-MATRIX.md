# ACCEPTANCE-MATRIX

Proof required before an issue or gate is marked done. Prefer automated tests; manual only where noted.

---

## A. Bug / integrity acceptance

| ID | Automated proof | Manual proof |
|----|-----------------|--------------|
| BUG-01 | Rust deps: signed-out CLI → `ai_provider` not ok / auth required | Tools step shows auth required; Find jobs disabled with reason |
| BUG-02 | UI/unit: Add portal does not call finish | Onboarding Tools → add portal → still on Tools / Profile reachable |
| BUG-03 | ensure_workspace includes guard or posting_guard returns friendly error | Studio paste → no Python traceback |
| BUG-04 | Rust: status change preserves application date; vitest: funnel Drafted = drafted count; event `user_confirmed_submitted` required for submitted label | Pipeline drawer never says “submitted” for unconfirmed move |
| BUG-05 | Rust: relative path rejected; failed set_workspace keeps prior setting | Settings: type `INVALID` → error; previous jobs still visible |
| BUG-06 | Snapshot or string unit | Today with 1 task → “needs” |
| NEW-P0 | `providerSupportsWorkflow` gates + probe mocks | Unsupported provider workflow never Ready |

---

## B. Product journey gates

| Gate | Pass criteria |
|------|---------------|
| Fresh install | App launches; no prior workspace; onboarding starts |
| Onboarding | Workspace connect → tools truth → profile reachable without finishing via portal |
| Offline use | Profile + manual job + application + follow-up with **no** provider |
| AI readiness | Only authenticated + capable provider enables AI CTAs |
| Data integrity | Restart preserves records; bad workspace switch does not wipe UI binding |
| Privacy | No unexpected network; secrets not in workspace JSON |
| Recovery | Migration backup + rollback restores prior tree |
| Discover→Track | Manual or AI path ends in accurate lifecycle timestamps |
| CI | Unit + ATS benchmark threshold green; zero unresolved P0 |

---

## C. ATS-01 .. ATS-06

| ID | Requirement | Proof |
|----|-------------|--------|
| **ATS-01** | Local PDF and DOCX resume parse → structured facts + diagnostics without AI | Fixture resumes; parser unit tests; UI shows diagnostics |
| **ATS-02** | Every extracted fact carries provenance; user can confirm/correct before use | Edit round-trip; unconfirmed facts excluded from tailor/export by default |
| **ATS-03** | Job requirement extraction → must-haves/nice-to-haves with source spans | Fixture postings; golden fields |
| **ATS-04** | Match explanations only cite confirmed candidate facts and extracted requirements | Golden match cases; fail if explanation references absent facts |
| **ATS-05** | Exported resume re-parse detects missing sections and unsupported/invented statements | Export → Validate tests; block or warn with user-visible reason |
| **ATS-06** | Lifecycle records recruiter screen, interview, offer, outcomes with accurate timestamps; metrics from events | Event-log tests; UI cannot invent submission without confirmation |

**Benchmark CI threshold (Phase 5):** vitest `runBenchmark().ok === true` on the synthetic Alex/Nordlicht corpus — specifically: **name extracted**, **employer fact**, **≥1 must-have** requirement, and **match does not refuse** when useful facts are confirmed (also skills-subset recall ≥ 0.75 and export validation ok inside `runBenchmark`). This is a private regression gate — **not** marketed as a universal ATS pass rate. See `packages/core/src/ats/benchmark.ts`, `fixtures.ts`, and [`packages/core/src/ats/PRIVACY.md`](../../packages/core/src/ats/PRIVACY.md). Gate B checklist: [`GATE-B-ATS.md`](./GATE-B-ATS.md).

---

## D. Tracking-beta vs ATS-claims split

| Gate | Name | Must pass |
|------|------|-----------|
| **A** | Job-tracking beta (Apple Silicon) | Phase 1–2 exit; zero unresolved P0; offline journey; lifecycle timestamps accurate; workspace recovery; clean-device smoke; packaging honesty. ATS may ship experimental/unlabeled but **not marketed** as ATS optimization. |
| **B** | ATS claims allowed | Gate A + Phase 3 ATS path + ATS-01..06 + Phase 5 benchmark evidence + copy review forbidding overclaims + zero unresolved P1 on ATS core path |
| **C** | Multi-platform | Per-platform Gate A (and B if that build makes ATS claims) |

---

## E. Test strategy map

| Layer | Covers |
|-------|--------|
| Unit (vitest / Rust) | Schema, events, filters, capability gating, parser/validators, match evidence rules |
| ATS benchmark | Synthetic/consented corpus; ground truth; rubric; CI threshold |
| Integration | Workspace switch failure; migration/rollback; posting_guard missing; provider probe failures |
| Desktop e2e | Offline profile→job→apply-confirm→track; export validate; no paid calls in default CI |
| Manual / consented | Provider live probes; packaging smoke on clean Mac |

Privacy: fixtures contain no real PII unless consented; metrics strip identifiers; telemetry default off.
