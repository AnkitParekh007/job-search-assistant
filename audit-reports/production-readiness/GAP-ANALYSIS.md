# GAP-ANALYSIS

Maps current product reality vs target architecture (native core + ATS Intelligence + AI adapters). Sources: [VERIFIED-AUDIT.md](./VERIFIED-AUDIT.md), codebase, provider docs.

---

## 1. Ownership gaps (who should own what)

| Capability | Today | Should own | Gap |
|------------|-------|------------|-----|
| Profile edit | Agent `/setup` only; UI read-only markdown | **Native core** | UX-02 / MISSING-01 |
| Resume ingest | None / agent | **ATS Intelligence** (parse) + native edit | ATS-01/02 |
| Search prefs / filters | Text + fit/status only | **Native core** | MISSING-02 |
| Job records | `seen_jobs.json` via scrape/rank | Native manual + AI scrape optional | Manual entry missing |
| Application lifecycle | CSV status + rewritten `date` | **Native core** event log | BUG-04 / ATS-06 |
| Follow-ups / interviews | Agent `/outcome`; one Interview status | **Native core** | MISSING-05/06 |
| Match score explain | Stored prose from rank | **ATS** evidence-grounded; AI optional | ATS-03/04 |
| Draft / tailor | Provider workflows | AI adapter + ATS validate | ATS-05 |
| Scout help | Missing | Local deterministic | MISSING-07 |
| Workspace safety | Relative create + orphan UI | Recoverable absolute paths | BUG-05 |
| Provider readiness | Binary = ready | Probe + capability matrix | BUG-01 / NEW-P0 |

---

## 2. Native vs AI vs ATS — current bleed

```
Today: almost every “job seeker” action routes through a provider run.
Target: native tracking works offline; ATS parse/validate is local; AI only when capable.
```

| Bleed | Risk |
|-------|------|
| Onboarding Tools finishes on portal attempt | Candidate never builds profile |
| Find jobs CTA ungated | Failure looks like product crash |
| Studio integrity depends on missing Python tool | Traceback = trust loss |
| Pipeline “submitted” without confirmation | Corrupts outcome metrics |
| Docs claim Claude/Codex-only while code has five providers | Capability lie |

---

## 3. Provider documentation conflicts

| Document | Says | Code says |
|----------|------|-----------|
| README / privacy (high level) | Claude Code / Codex oriented | Five providers + keychain BYOK |
| `docs/MULTI-PROVIDER-IMPLEMENTATION.md` | Multi-provider architecture | Partially implemented |
| `docs/providers/01-provider-capability-matrix.md` | Per-workflow matrix | `packages/core/src/providers.ts` is runtime source |
| In-app errors | `Please run /login` | No in-app login for Claude; Settings / CLI sign-in |

**Gap:** Single authoritative capability matrix must drive UI + deps + docs (NEW-P0).

---

## 4. Data model gaps

| Area | Today | Gap |
|------|-------|-----|
| Schema version | None on workspace | Need `meta.json` `schema_version` |
| Backup / migrate | None | Pre-migration `.backups/<ts>/` + rollback |
| Dual formats | CSV tracker + seen_jobs JSON forever | Canonical apps/jobs + one-shot import; optional CSV export |
| Provenance | None on profile fields | `source` / `confidence` / `confirmed` |
| Job freshness | Limited timestamps | `first_seen`, `last_verified`, stale flags |
| Events | Implicit status | Append-only `events.jsonl` |
| Secrets | Keychain + CLI sessions | Phase 5 audit; never in workspace JSON |
| Concurrent writes | CSV rewrite | Atomic write + lock strategy |

---

## 5. ATS Intelligence gaps (detail)

| Capability | Gap |
|------------|-----|
| PDF/DOCX parse | No in-process parser; no diagnostics UI |
| Fact confirmation | No inferred vs confirmed |
| Requirement extraction | Rank dumps free text; no must/nice structure with spans |
| Match evidence rules | No validator that explanations only cite confirmed facts |
| Export validation | No re-parse of exported PDF/DOCX |
| Benchmark | No fixtures, golden fields, CI threshold, privacy rules |
| Honesty policy | No release gate blocking universal pass-rate claims |

---

## 6. Security / recovery / quality gaps

| Area | Gap |
|------|-----|
| Path confinement | Relative paths; create-anywhere |
| Symlink / disk-full / permissions | Untested systematically |
| Prompt injection from postings | No documented boundary |
| Desktop e2e | Vitest + Rust unit only; no Playwright/Tauri e2e |
| Signing / updates | Packaging honesty (“developed vs verified”) incomplete |
| A11y / keyboard | Not audited |
| Telemetry | Must stay opt-in / privacy-respecting |
| Crash recovery | Partial (settings persist); workspace switch loss is regression |

---

## 7. Platform gaps

| Platform | Status |
|----------|--------|
| macOS Apple Silicon | Primary audit host; Gate A target |
| macOS Intel | Code twin; no journey evidence |
| Windows | Code twin; no journey evidence |

---

## 8. Gap → phase mapping

| Phase | Closes |
|-------|--------|
| 1 | BUG-01..06, NEW-P0 gates, lifecycle foundation, workspace recovery, schema_version hooks |
| 2 | Offline profile/resume parse, filters, manual jobs/apps, provenance, migration import |
| 3 | Provider probes, evidence match/tailor, export validate, doc truthfulness |
| 4 | Onboarding, Scout, human copy, palette |
| 5 | Security, backup/rollback, ATS benchmark, e2e, a11y, diagnostics |
| 6 | Gate A packaging; Gate B ATS claims |

See [IMPLEMENTATION-BACKLOG.md](./IMPLEMENTATION-BACKLOG.md) for ordered work items.
