# Free ad-hoc signing acceptance — 2026-11-21 (~07:03 IST)

**Operator:** Cursor agent (build + Computer Use AX)  
**Apple account:** Free (0 Developer ID identities)  
**GitHub Release:** **not** modified  

## 1–5 Build / sign / package

| # | Check | Result |
|---|-------|--------|
| 1 | Tauri 2 Apple Silicon `.app` | **PASS** — `./scripts/build-macos-apple-silicon-preview.sh` |
| 2 | Ad-hoc sign (`codesign -s -`) | **PASS** — `Signature=adhoc`, flags=`0x2(adhoc)` |
| 3 | `codesign --verify --deep --strict` | **PASS** — valid on disk / Designated Requirement |
| 4 | ZIP package | **PASS** — `dist-release/AI-Job-Search-0.1.2-beta-macos-arm64.zip` |
| 5 | ZIP is native (not source) | **PASS** — contains `.app/Contents/MacOS/ai-job-search-desktop`; no root `package.json` / `src-tauri/Cargo.toml` |

```
SHA256 70748243dcee3b6067ac8c45b440c03c8f409e445da8b60e36fab3e738b016d5  AI-Job-Search-0.1.2-beta-macos-arm64.zip
```

Artifact: `apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app`  
Bundle id: `dev.local.aijobsearch` · Version: `0.1.2-beta` · Arch: arm64  

## 6 Local install + first-launch acceptance

### A. Quarantined install (simulates download)

| Check | Result |
|-------|--------|
| Unzip to `~/Desktop/AI-Job-Search-adhoc-preview-install/` | **PASS** |
| Quarantine attribute present (not stripped) | **PASS** |
| codesign still verifies under quarantine | **PASS** |
| `spctl --assess` | **rejected** (expected) |
| `spctl --status` | **assessments enabled** (unchanged) |
| `open` quarantined app with no prior Gatekeeper approval | **FAIL to stay running** (expected Gatekeeper limit) |

### B. Build-tree launch + UI acceptance (Computer Use)

| Check | Result |
|-------|--------|
| Launch from build tree (no quarantine) | **PASS** — pid running |
| Sidebar channel copy | **PASS** — `Developer preview · Gate A job-tracking (ad-hoc sign).` · `APP V0.1.2-BETA · VERIFIED` |
| Settings → About | **PASS** — channel `developer preview`; ad-hoc / not notarized; right-click → Open; do not disable Gatekeeper |
| Provider validation | **PASS** — Claude Code **Ready** / signed in |
| Relative workspace `INVALID` rejected | **PASS** — toast: absolute path required; sidebar still prior workspace |
| Scout reachable | Exercised nav press (offline Scout page) |

## 7–10 Policy

| Item | Status |
|------|--------|
| Developer ID / notarization scripts | Present; inactive without `APPLE_SIGNING_IDENTITY` / notary profile |
| Gatekeeper docs | `docs/macos-gatekeeper-adhoc.md` |
| System Gatekeeper modified | **No** |
| GitHub release publish/replace | **No** — `RELEASE_PUBLISH_APPROVED` blocked |

## Verdict

Free ad-hoc Apple Silicon developer-preview path: **PASS** for local use.  
**Not** ready for public distribution without the blockers listed in the operator report.
