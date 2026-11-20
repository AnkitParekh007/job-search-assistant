# Release pipeline

Downloadable packages are published as GitHub Release assets and linked from the marketing `/download` page (`market-site/src/lib/releases.ts`).

## Current release

| Item | Value |
|------|-------|
| Tag | `v0.1.1` |
| Assets | `AI-Job-Search-0.1.1-macos-arm64.zip`, `…-macos-x64.zip`, `…-windows-x64.zip`, `SHA256SUMS.txt` |
| Site constant | `RELEASE_TAG` in `market-site/src/lib/releases.ts` |

## Local packaging (preferred for macOS `.app`)

On an Apple Silicon Mac with a successful Tauri build:

```bash
cd apps/macos-apple-silicon && npm run tauri build
./scripts/package-release-assets.sh 0.1.1
gh release create v0.1.1 \
  dist-release/AI-Job-Search-0.1.1-*.zip \
  dist-release/SHA256SUMS.txt \
  --title "AI Job Search Assistant v0.1.1" \
  --notes-file - <<'EOF'
Desktop packages for AI Job Search Assistant.

- macOS Apple Silicon zip includes the unsigned `.app` when built locally.
- Intel / Windows zips include the platform client (build with Tauri if no installer is bundled).
- Does not auto-submit applications. Multi-provider AI support (Claude Code or Codex) required for AI workflows.
EOF
```

## CI

`.github/workflows/release.yml` refreshes the GitHub Release for the version in `package.json` (and `market-site/src/lib/releases.ts`) when `main` changes app code, shared packages, or the release scripts. It also runs on `v*` tags and `workflow_dispatch` from `main`.

The download URLs stay on the current tag (`v0.1.1` today). A `main` push does not create a new tag. It replaces the zip assets in place:

- **macOS Apple Silicon** — `macos-latest` builds the unsigned `.app` and replaces `AI-Job-Search-<version>-macos-arm64.zip`.
- **macOS Intel / Windows** — Ubuntu repackages the platform client sources. Those zips are replaced on the same release.
- **SHA256SUMS.txt** is rewritten for the full set. An asset that was not rebuilt is left in place, and the release notes record which platforms were rebuilt.

The download page constants must match `package.json`. The workflow stops if `RELEASE_TAG` / `RELEASE_VERSION` disagree, so the site cannot keep linking at files this run did not publish.

These builds are unsigned. Prefer a local Apple Silicon package when you need to replace the `.app` before CI finishes:

```bash
gh release upload v0.1.1 dist-release/AI-Job-Search-0.1.1-macos-arm64.zip --clobber
```

## Gatekeeper (unsigned)

Users may need **right-click → Open**. Do not instruct users to disable Gatekeeper or run `spctl --master-disable`.

## Version bumps

1. Bump `package.json` + each app `tauri.conf.json` together  
2. Update `RELEASE_TAG` / `RELEASE_VERSION` in `market-site/src/lib/releases.ts`  
3. Tag `vX.Y.Z` and publish assets  
4. Deploy market site from `main`

## Explicit non-goals (for now)

- Cutting a new version tag for every `main` commit. Asset refresh stays on the current tag until `package.json` and the download page move together.
- Claiming notarized Windows/Intel binaries before those pipelines are proven
- Bypassing notarization with unsafe workarounds
