# Release pipeline

Downloadable packages are published as GitHub Release assets and linked from the marketing `/download` page (`market-site/src/lib/releases.ts`).

## Current release

| Item | Value |
|------|-------|
| Tag | `v0.1.0` |
| Assets | `AI-Job-Search-0.1.0-macos-arm64.zip`, `…-macos-x64.zip`, `…-windows-x64.zip`, `…-web.zip`, `SHA256SUMS.txt` |
| Site constant | `RELEASE_TAG` in `market-site/src/lib/releases.ts` |

## Local packaging (preferred for macOS `.app`)

On an Apple Silicon Mac with a successful Tauri build:

```bash
cd apps/macos-apple-silicon && npm run tauri build
./scripts/package-release-assets.sh 0.1.0
gh release create v0.1.0 \
  dist-release/AI-Job-Search-0.1.0-*.zip \
  dist-release/SHA256SUMS.txt \
  --title "AI Job Search Assistant v0.1.0" \
  --notes-file - <<'EOF'
Desktop and web packages for AI Job Search Assistant.

- macOS Apple Silicon zip includes the unsigned `.app` when built locally.
- Intel / Windows zips include the platform client (build with Tauri if no installer is bundled).
- Web zip is a static demo only.
- Does not auto-submit applications. Claude Code required for AI workflows.
EOF
```

## CI

`.github/workflows/release.yml` runs on `v*` tags (and `workflow_dispatch`) and publishes source/client zips from Ubuntu. It cannot produce notarized macOS binaries on this account (macOS runners unavailable). Prefer local packaging for Apple Silicon `.app` assets, then upload/replace release files:

```bash
gh release upload v0.1.0 dist-release/AI-Job-Search-0.1.0-macos-arm64.zip --clobber
```

## Gatekeeper (unsigned)

Users may need **right-click → Open**. Do not instruct users to disable Gatekeeper or run `spctl --master-disable`.

## Version bumps

1. Bump `package.json` + each app `tauri.conf.json` together  
2. Update `RELEASE_TAG` / `RELEASE_VERSION` in `market-site/src/lib/releases.ts`  
3. Tag `vX.Y.Z` and publish assets  
4. Deploy market site from `main`

## Explicit non-goals (for now)

- Auto-publishing every green `main` build as a stable release  
- Claiming notarized Windows/Intel binaries before those pipelines are proven  
- Bypassing notarization with unsafe workarounds
