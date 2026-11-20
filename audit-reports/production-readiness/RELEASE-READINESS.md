# RELEASE-READINESS

Split release: **Gate A** job-tracking beta first; **Gate B** public ATS optimization claims only with evidence; **Gate C** other platforms with their own proof.

---

## Platform matrix

| Platform | App path | Gate A | Gate B |
|----------|----------|--------|--------|
| macOS Apple Silicon | `apps/macos-apple-silicon` | **Primary** — first beta | After ATS-01..06 + benchmark |
| macOS Intel | `apps/macos-intel` | After Apple Silicon Gate A + intel smoke | Only if build claims ATS |
| Windows | `apps/windows` | After Apple Silicon Gate A + Windows smoke | Only if build claims ATS |

Shared UI/core: `packages/ui`, `packages/core`. Rust twins must receive the same integrity fixes in Phase 1.

---

## Gate A — Job-tracking beta (Apple Silicon)

**Intent:** A candidate can manage profile, jobs, applications, follow-ups, and interviews **offline**, with truthful status and recoverable workspace. AI is optional enhancement.

### Must pass

- [ ] Phase 1 exit (BUG-01..06, NEW-P0, lifecycle foundation, workspace recovery)
- [ ] Phase 2 exit (offline profile/resume parse foundations, manual jobs/apps, filters, migration)
- [ ] Zero unresolved P0
- [ ] Lifecycle timestamps accurate; no false “submitted”
- [ ] Workspace recovery (relative path rejected; failed switch preserves prior)
- [ ] Clean-device smoke on Apple Silicon
- [x] Packaging honesty: label **verified** (Gate A signed + UI/docs flipped 2026-11-21)
- [ ] README / in-app copy does **not** claim ATS optimization / universal pass rates

### Allowed

- Experimental ATS parse/match UI **unlabeled** or marked experimental internally
- Capability-gated AI when user has a ready provider

### Blocked

- Marketing “ATS optimization,” pass rates, guaranteed interviews
- Shipping Intel/Windows as “supported” without their Gate A evidence

---

## Gate B — Public ATS optimization claims

**Intent:** Claims about parse quality, match explainability, and export validation are evidence-backed.

### Additionally required

- [ ] Phase 3 ATS match/tailor + export validation shipped
- [ ] ATS-01..06 all green per [ACCEPTANCE-MATRIX.md](./ACCEPTANCE-MATRIX.md)
- [ ] Phase 5 benchmark suite reproducible; privacy rules documented; evidence attached or available under consent
- [ ] Copy review: README, site, release notes — **no** forbidden claims
- [ ] Zero unresolved P1 on ATS core path
- [ ] Gate A still green

### Forbidden claims (without independent evidence)

- Universal ATS pass rate
- Guaranteed interviews
- Named-employer ATS compatibility

---

## Gate C — Multi-platform

For each additional OS/arch:

1. Complete Gate A checklist on that platform (smoke + packaging).
2. If that build markets ATS features, also complete Gate B on that platform.
3. Do not imply parity from Apple Silicon alone.

---

## Packaging / signing / updates

| Item | Gate A requirement |
|------|--------------------|
| Build artifact | Reproducible script for Apple Silicon |
| Code signing / notarization | Documented status (done / pending / N/A for beta) |
| Auto-update | Honest: disabled, or verified channel only |
| Developed vs verified | UI and release notes use correct label |
| Privacy policy | Matches actual providers, keychain, local storage |

---

## Documentation readiness

| Doc | Gate A | Gate B |
|-----|--------|--------|
| README first-run | Human language; offline path clear | ATS section evidence-linked |
| Provider matrix | Matches `providers.ts` | Workflow support accurate |
| Security / privacy | Local-first; secrets surface | Benchmark privacy rules |
| Changelog | Integrity + offline tracking | ATS capabilities + honesty limits |

---

## Evidence index for release

Before tagging a beta or public release, attach:

1. Link to this folder’s Stage 0 docs (frozen revision).
2. CI run IDs for unit + (Gate B) ATS benchmark.
3. Manual smoke checklist signed off for Apple Silicon.
4. Screenshot or log proving relative workspace rejection and offline apply-confirm path.
5. (Gate B) Benchmark report hash + consent statement if corpus not fully synthetic.

---

## Current status

| Gate | Status |
|------|--------|
| A | **Verified** (2026-11-21) — Gate A packaging checklist signed; Computer Use smoke (INVALID + apply-confirm) PASS; UI/docs flipped to **verified**. See [GATE-A-PACKAGING.md](./GATE-A-PACKAGING.md). |
| B | **Blocked** — Gate A is verified; next: ATS-01..06 evidence pack + copy review. `runBenchmark` exists but do not market ATS optimization. |
| C | **Blocked** — intel/Windows twins updated with same integrity APIs; no Gate A smoke evidence yet |

See also: [RE-AUDIT-20261121.md](./RE-AUDIT-20261121.md), [GATE-A-PACKAGING.md](./GATE-A-PACKAGING.md), [apps/macos-apple-silicon/e2e/smoke.offline.spec.md](../../apps/macos-apple-silicon/e2e/smoke.offline.spec.md).
