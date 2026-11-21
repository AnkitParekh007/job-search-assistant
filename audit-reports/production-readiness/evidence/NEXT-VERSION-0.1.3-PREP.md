# Next version prep — 0.1.3-beta (no publish)

**Status:** planned only. **Do not** overwrite `v0.1.2-beta` assets, upload releases, or change production download links without explicit approval.

## Preserve (do not delete / rename)

| Artifact | Location |
|----------|----------|
| ZIP | `dist-release/AI-Job-Search-0.1.2-beta-macos-arm64.zip` |
| SHA-256 preserved | `audit-reports/production-readiness/evidence/SHA256SUMS-0.1.2-beta-adhoc-preserved.txt` |
| SHA-256 release copy | `dist-release/SHA256SUMS.txt` (0.1.2) |
| Signing / ad-hoc evidence | `SIGNING-STATUS-20261121.md`, `ADHOC-SIGN-ACCEPTANCE-20261121.md`, `PHASE-A-VERIFY-20261121.md` |
| Clean-accept | `CLEAN-ACCEPT-20261121.md` + `clean-accept-20261121/` |

Verified hash (0.1.2-beta ZIP):

```text
70748243dcee3b6067ac8c45b440c03c8f409e445da8b60e36fab3e738b016d5  AI-Job-Search-0.1.2-beta-macos-arm64.zip
```

## Proposed next cut

| Field | Value |
|-------|--------|
| Version string | `0.1.3-beta` |
| ZIP name | `AI-Job-Search-0.1.3-beta-macos-arm64.zip` |
| SHA256SUMS | new file, e.g. `SHA256SUMS-0.1.3-beta.txt` (do not replace 0.1.2 sums) |
| Bundle id | Keep `dev.local.aijobsearch` for another ad-hoc preview **or** switch to `app.jobzuu.aijobsearch` only with Support migration (see `docs/macos-bundle-identifier.md`) |
| Tag | `v0.1.3-beta` (create only when approved) |
| Publish | Blocked unless `RELEASE_PUBLISH_APPROVED=1` |

## Intended fix set for 0.1.3 (from clean-accept)

1. **CA-P1-01** — Map known human tracker headers → canonical keys, or refuse unknown headers with an actionable error (never count empty status as Submitted).
2. **CA-P1-02** — Keep Gatekeeper honesty in Settings / download copy; no quarantine-stripping guidance.
3. **CA-P2-01** — Surface workspace `upstream_version` instead of `?` when meta missing.
4. **CA-P2-03** — Ensure Studio integrity messaging points to Settings → Switch if `tools/posting_guard.py` missing.
5. **CA-P2-04** — Align “Evaluate fit with AI” enablement with provider readiness (same gate as Find jobs).

Optional (approval-gated): apply `app.jobzuu.aijobsearch` + first-launch Support migration.

## Build / package commands (when ready — not run here)

```bash
# bump version in apps/macos-apple-silicon/src-tauri/tauri.conf.json (+ package manifests)
./scripts/build-macos-apple-silicon-preview.sh
./scripts/sign-macos-adhoc.sh
./scripts/validate-macos-release.sh
./scripts/package-release-assets.sh   # must emit *0.1.3-beta* names
# Write new SHA256SUMS-*0.1.3* beside preserved 0.1.2 files — never clobber.
```

## Explicit non-actions (until Ankit approves)

- No `gh release` / asset upload  
- No market-site download URL changes  
- No Apple Developer Program purchase / notarization  
- No deletion of `0.1.2-beta` ZIP or preserved hashes  
