# Production readiness audit — 2026-11-20

## Scope and method

Source-level audit of current `main` and the release-hardening branch `fix/production-release-gates-20261120`, covering GitHub release metadata, workflows, packaging scripts, Tauri config, shared React desktop app, help guide, onboarding, documentation and marketing download path.

**This is not a completed native desktop UX test.** The connected GitHub interface can inspect and modify files, but cannot launch the author's macOS GUI or inspect the user's local credentials, live AI providers, real job portals or distribution-signing identities. Do not infer runtime success from green unit tests.

## Gate status

| Gate | Status as reviewed | Evidence / next verification |
|---|---|---|
| Source code / shared app | Implemented, coverage incomplete | `packages/ui/`, `packages/core/`, three Tauri clients |
| Fresh-user onboarding | Unverified end-to-end | Run native UI on clean profile and isolated workspace, capture screenshots |
| Profile import and persistence | Unverified end-to-end | Synthetic resume upload, restart, verify values and no overwrite |
| Portal integrations | Partial / provider-dependent | `docs/job-discovery.md` and `docs/integrations.md`; test source health and allowed authenticators |
| Job discovery and ranking | Provider/upstream-dependent | Verify live permitted sources, stale jobs, dedupe and ranking quality |
| Studio PDF and truthful tailoring | Unverified end-to-end | Synthetic candidate CV → draft → PDF → ATS text checks |
| Employer submission | Not supported; manual handoff | `docs/features.md`; should never be represented as auto-applied |
| Pipeline and outcomes | Native + upstream | `docs/application-tracking.md`; test `drafted` vs `applied` and persisted transitions |
| Outreach | Drafts only, no auto-send | `docs/application-tracking.md`; test approved draft and status semantics |
| Offline app help | Implemented; stale mascot import found | `HelpAssistant.tsx` imported removed `Scout` while onboarding uses `Jobzuu`; fixed in PR #16, CI required |
| Native installers | FAIL | Historical release workflow `ci-package-release-assets.sh` archived app source on Ubuntu |
| Release download claims | FAIL | `market-site/src/pages/DownloadPage.tsx` called source ZIPs downloads; corrected in PR #16 |
| macOS Intel and Windows | Ported source, native unverified | `apps/README.md` explicitly marks source ports |
| External AI models | Mock/unit tests only for several providers | `docs/providers/08-test-evidence.md` explicitly lists blocked live smokes |
| Signing and notarization | NOT DONE | `docs/installation.md` notes unsigned app builds |
| Website end-to-end / SEO | Deployment recheck required | Earlier report `docs/audits/market-site-audit-2026-11-20.md` describes fixed-at-source prerender issues and pending deploy verification |
| Promotion / public launch | NOT APPROVED | Do not claim installable app or hiring results until release gates pass |

## Confirmed high-severity findings

### P0 — Historical release archives are source packages, not native apps

Observed `v0.1.1` release contains `AI-Job-Search-0.1.1-macos-arm64.zip` and equivalent Intel/Windows ZIPs. The old release workflow ran on Ubuntu and called `scripts/ci-package-release-assets.sh`, whose `pack_client()` merely copied application source into `app/`. No platform-native build step existed. This is a deterministic source-level finding; archive inspection on a real machine is still recommended.

**Fixed on PR #16:** replaced automatic tag publication with an explicitly triggered native matrix that validates three real app/installer archives and creates a draft. Replaced source-fallback scripts with fail-closed code. Updated website and installation copy.

**Remaining:** PR merge, CI green, create next version tag, execute native runners, install and test on target hardware, validate draft, then manually publish. Historical v0.1.0/v0.1.1 release pages/assets must be relabeled or retired by a release administrator.

### P0 — Unverified end-to-end job-seeker journey

Components and provider mocks do not prove that a fresh user can connect a workspace, upload a synthetic resume, add sources, discover and rank jobs, prepare an application, export a truthful PDF, submit manually, track status and draft follow-ups. The complete native GUI acceptance sequence has not been observed for this audit.

**Action required:** run the scripted synthetic job-seeker journey with screenshots and state-persistence evidence. A failed or blocked step must be documented, not silently bypassed.

### P1 — Stale offline guide component import

At the reviewed main revision, `packages/ui/src/components/HelpAssistant.tsx` imported `Scout` from `../pages/Onboarding`; that module used the newer `Jobzuu` component and no longer exported Scout. This creates a TypeScript build failure. The product also used two mascot names.

**Fixed on PR #16:** imports `Jobzuu` directly and aligns the guide labels. Frontend TypeScript build must confirm.

### P1 — Real-provider compatibility not fully verified

OpenAI Codex, OpenAI API, Gemini and Ollama live tests were explicitly blocked in `docs/providers/08-test-evidence.md`, notwithstanding successful mocked Rust tests. Build claims and launch copy must distinguish configured from tested providers.

### P1 — Native Intel/Windows behavior not proven

Dedicated source ports exist and have Tauri configs, but native installer and first-run behavior is not documented as validated on target machines. The new workflow fails closed if any platform build fails.

## Release acceptance checklist

- [ ] PR #16 merged with frontend, Rust, docs and test checks passing
- [ ] Historical source-archive releases clearly labeled/retired
- [ ] Version bump consistent across root, all client packages and all Tauri configs
- [ ] New native matrix workflow succeeds for macOS ARM64, Intel and Windows
- [ ] ZIP verifier passes; checksums published and locally verified
- [ ] Synthetic first-launch → full profile → jobs → ranking → Studio → manual-submit handoff → Pipeline → outreach tested on a real Mac
- [ ] No real employer application or outreach is sent by the acceptance test
- [ ] Provider live smoke completed where keys/accounts are available, with cost approval
- [ ] Real Windows and Intel smoke tests or those platforms withheld from public promotion
- [ ] Code signing/notarization disclosures and OS-install warnings accurate
- [ ] Download page links only to tested native bundles when available
- [ ] Website routes, mobile layout, SEO/OG and links verified in deployed site
- [ ] Security/privacy pass including credential storage, log redaction and workspace permissions
- [ ] Public announcement wording reviewed against verified functionality

## Go/no-go decision

**NO-GO for broad stable release on 2026-11-20.** A limited developer preview or call for testers may be communicated with explicit **build-from-source** and **manual application submission** caveats.

This gate is evidence-based and must be revisited after native installations and a real GUI user journey, not after a unit-test-only run.
