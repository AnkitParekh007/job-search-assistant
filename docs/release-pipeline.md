# Release pipeline

Downloadable packages are published as GitHub Release assets and linked from the marketing `/download` page (`market-site/src/lib/releases.ts`).

## Published release

| Item | Value |
|------|-------|
| Tag / version | `v0.1.5` / `0.1.5` (regular release, not a prerelease) |
| Signing | Ad-hoc, **not notarized**. No Developer ID on the build machine |
| Native asset | `Job-Search-Assistant-0.1.5-macos-arm64.zip` |
| Preserved previous assets | `v0.1.2`–`v0.1.4` Apple Silicon zips (not replaced) |
| Updates | Assisted: in-app GitHub check + SHA-verified zip download; manual `.app` replace (no silent install) |
| Site constants | `RELEASE_TAG` / `RELEASE_VERSION` in `market-site/src/lib/releases.ts` |
| Auto-publish | **Off** — GitHub uploads require `workflow_dispatch` + `publish_assets=true` + `RELEASE_PUBLISH_APPROVED=1` |

## Local Apple Silicon package (no upload)

```bash
./scripts/build-macos-apple-silicon-preview.sh
REQUIRE_NATIVE=1 ONLY=macos-arm64 ./scripts/package-release-assets.sh
# Validates .app, ad-hoc signature, arch, checksums, fresh-unzip with quarantine preserved.
# Does NOT upload to GitHub Releases.
```

Optional future paid path (credentials via env only — see `scripts/lib/macos-release.env.example`):

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: … (TEAMID)"
export APPLE_NOTARY_PROFILE=ai-job-search-notary
./scripts/sign-macos-developer-id.sh
./scripts/notarize-macos.sh
REQUIRE_NOTARIZED=1 REQUIRE_DEVELOPER_ID=1 ./scripts/validate-macos-release.sh
```

## Packaging rules

- **Native only.** `scripts/package-release-assets.sh` refuses source-archive fallbacks.
- Missing `.app` / NSIS / MSI → hard failure (`REQUIRE_NATIVE=1`).
- Intel / Windows are omitted from the download grid until native artifacts exist.
- Never instruct users to disable Gatekeeper, run `spctl --master-disable`, or strip `com.apple.quarantine`.

## CI

`.github/workflows/release.yml`:

| Trigger | Build + validate | Upload Actions artifact | Publish GitHub Release |
|---------|------------------|-------------------------|------------------------|
| `main` push (app paths) | Yes (Apple Silicon) | Yes | **No** |
| `v*` tag | Yes | Yes | **No** |
| `workflow_dispatch` + `publish_assets=true` | Yes | Yes | Yes (after approval env) |

## Version bumps

Keep these equal:

1. Root `package.json` + workspace package versions  
2. Each app `tauri.conf.json` + `Cargo.toml` `version`  
3. `packages/ui/src/version.ts` (`APP_VERSION`)  
4. `market-site/src/lib/releases.ts` (`RELEASE_TAG` / `RELEASE_VERSION`)  

## Bundle identifier

See [macos-bundle-identifier.md](./macos-bundle-identifier.md). v0.1.5 keeps `dev.local.aijobsearch`. Changing it without a migration orphans Application Support, Keychain items, and TCC grants.

## Gatekeeper (ad-hoc, not notarized)

Users may need **right-click → Open** on first launch and after replacing the `.app` from an assisted update download. Do not instruct users to disable Gatekeeper or clear quarantine as a workaround.

## Explicit non-goals (Phase A)

- Overwriting `v0.1.2` / `v0.1.3` or publishing without human approval  
- Silent in-place auto-install or Tauri updater claims without Developer ID + notarization  
- Claiming notarized or Developer ID–signed installers  
- Shipping source trees as platform “installers”  
- Apple Developer Program enrollment / paid certificates  
