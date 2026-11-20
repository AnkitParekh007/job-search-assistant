# Repository Audit — AI Job Search

**Audited:** 2026-11-19  
**Repository (at audit time):** https://github.com/AnkitParekh007/job-search-assitant  
**Default branch tip inspected:** `a34bfca` (historical commit; web client has since been removed)  
**Marketing site (at audit time):** https://ankitparekh007.github.io/job-search-assitant/ (HTTP 200 verified)

> **Historical note (2026-11-19):** After this audit, the GitHub repository was renamed to [`AnkitParekh007/job-search-assistant`](https://github.com/AnkitParekh007/job-search-assistant). The Pages site path is now `https://ankitparekh007.github.io/job-search-assistant/`. URLs below intentionally preserve the pre-rename slug as audited evidence.

This audit records evidence from the local checkout, public GitHub API metadata, and the live Pages site. Subjective opinions are excluded.

---

## 1. Inventory snapshot

| Area | Evidence | Finding |
|------|----------|---------|
| Root README | `README.md` (short layout pointer) | Does not explain the product, install path, or limitations |
| App README (Apple Silicon) | `apps/macos-apple-silicon/README.md` | Accurate primary-client docs: requirements, build, Claude Code |
| Apps index | `apps/README.md` | Marks Intel / Windows / Web as “Complete”; overstates readiness vs release evidence |
| License | Root has no `LICENSE`; `Cargo.toml` declares `license = "MIT"`; GitHub API `license: null` | License not discoverable on GitHub |
| Community files | No `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`, `CHANGELOG.md` | Missing open-source health files |
| Issue / PR templates | `.github/` contains only Pages deploy workflow | No templates |
| CI for apps | Only `.github/workflows/deploy-market-site.yml` | No TypeScript / Vitest / Rust checks |
| Releases / tags | `git tag -l` empty; GitHub Releases linked from marketing site | No published release artifacts |
| Discussions | API: `has_discussions: false` | Not enabled |
| Wiki | API: `has_wiki: true` | Enabled; no content audited in this repo (Wiki is a separate git store) |
| Topics / description / homepage | API: empty / null / null | Discoverability metadata unset |
| Screenshots | No product PNGs under repo docs | Marketing site uses CSS mock chrome only |
| Workspace | Local folder chosen by the user (scaffolded on connect) | Not tied to a third-party org checkout |
| Shared packages | Untracked local WIP (`packages/`) observed during audit and stashed | Not part of `origin/main` at audit time |

---

## 2. Feature reality (Apple Silicon client)

Source of truth: `apps/macos-apple-silicon/docs/FEATURE-PARITY-MATRIX.md`, `IMPLEMENTATION-PLAN.md`, `ARCHITECTURE.md`, UI pages under `apps/macos-apple-silicon/src/pages/`, Rust modules under `src-tauri/src/`.

| Capability | Classification | Notes |
|------------|----------------|-------|
| Dashboard / Today metrics | **Native (implemented)** | Reads tracker + `seen_jobs.json` |
| Job discovery (`/scrape`) | **Upstream-powered (bridge)** + native results view | Portal / WebSearch via Claude Code |
| Ranking (`/rank`) | **Upstream-powered (bridge)** + native scores / compare | |
| Application Studio (`/apply`) | **Bridge + native PDF/ATS tools** | Marks tracker `drafted`; does **not** submit to employers |
| Pipeline / quick outcome | **Native + bridge** | Validated status transitions; follow-ups draft-only |
| Interview prep (`/interview`) | **Upstream-powered (bridge)** | No distraction-free practice-history screen yet |
| Agent Activity | **Native (implemented)** | Approvals, stop/resume, SQLite run history |
| Dependency checks | **Native (implemented)** | Claude CLI, Python ≥ 3.10, LaTeX, etc. |
| Gmail / Notion sync | **Upstream-dependent / blocked until connectors** | Entry points exist; need Claude connectors |
| Local LLM backend | **Unsupported** | App requires Claude Code CLI |
| Automatic employer submission | **Unsupported** | Explicitly out of scope in security model and docs |

---

## 3. Platform status (verified against source)

| Platform | Path | Status (evidence-based) |
|----------|------|-------------------------|
| macOS Apple Silicon | `apps/macos-apple-silicon/` | **Developed client** — full Tauri/React/Rust bridge; primary README and docs |
| macOS Intel | `apps/macos-intel/` | **Source-complete port** — `build:intel` / `x86_64-apple-darwin`; not evidenced as independently release-tested here |
| Windows | `apps/windows/` | **Source-complete port** — NSIS/MSI targets in Tauri config; not evidenced as release-tested here |

`apps/README.md` previously overstated Intel/Windows completeness relative to missing release artifacts. A former web client was removed; product is desktop-only.

---

## 4. Documentation gaps

| Gap | Impact |
|-----|--------|
| No root `docs/` system linked from README | Contributors and users rely on deep app-local docs or HTML marketing pages |
| App agent docs (`UPSTREAM-AUDIT`, etc.) are excellent but discoverable only after opening the app folder | Poor first-visit DX |
| Marketing download CTA points at `/releases` with no artifacts | Misleading “download” expectation |
| Download page still says “scaffolds” in fine print while apps index says “Complete” | Inconsistent story |
| No screenshot assets with alt text | Weak social / README visual proof |
| No FAQ / troubleshooting in Markdown for GitHub | Support load on maintainer |

---

## 5. Discoverability & SEO gaps

| Gap | Evidence |
|-----|----------|
| Empty GitHub description / homepage / topics | Public API |
| No social preview asset in-repo | No `docs/assets/social/` at audit time |
| Marketing meta tags present but incomplete OG/Twitter/canonical on some pages | Spot-check of `market-site/*.html` |
| No `robots.txt` / `sitemap.xml` under `market-site/` | Directory listing |

---

## 6. Security & community gaps

| Gap | Evidence |
|-----|----------|
| No `SECURITY.md` | Missing |
| No private vulnerability reporting instructions | Prefer GitHub private reporting when enabled by owner |
| No CODE_OF_CONDUCT | Missing |
| Credential policy lives only in `SECURITY-MODEL.md` inside the app docs | Not linked from root |

---

## 7. CI / release gaps

| Gap | Notes |
|-----|-------|
| No app CI | Frontend tests (`vitest`), `tsc` build, and Rust `cargo test` exist locally but are not gated on PRs |
| No release workflow | Version `0.1.0` in package / Tauri config; no tags |
| Unsigned personal builds | Documented correctly in Apple Silicon README; Gatekeeper right-click Open required |
| Code signing / notarization | Not implemented (future) |

---

## 8. Prioritized improvements

### P0 — Trust & clarity (this pass)

1. Evidence-based root README with accurate platform table and Claude Code cost disclosure  
2. Root license decision + attribution for upstream MIT engine  
3. Community health files + issue/PR templates  
4. Correct download messaging (build-from-source until releases exist)  
5. Align `apps/README.md` and marketing copy with real platform status  

### P1 — Documentation system

6. `docs/` Markdown set linking to app-local authoritative docs  
7. Roadmap + FAQ + troubleshooting  
8. Screenshot checklist / capture guide  

### P2 — Automation & discoverability

9. CI workflow for Apple Silicon frontend + Rust unit tests on macOS runners where feasible  
10. GitHub topics, description, homepage (requires authenticated `gh`)  
11. Social preview asset + owner upload  
12. Discussions enablement (owner) + Wiki publish steps  

### P3 — Product engineering (out of “GitHub presentation” scope)

13. Release packaging / signing  
14. Interview mode, Gmail proposal UI, portal manager, backup/restore (from `IMPLEMENTATION-PLAN.md`)  
15. Complete monorepo `packages/` extraction (local WIP; not on `main` at audit)

---

## 9. Explicit non-claims

This audit does **not** assert: user counts, download counts, stars as success metrics, Windows/Intel production readiness, browser Claude parity, autonomous applications, or the existence of GitHub Release binaries.
