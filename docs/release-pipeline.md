# Future release pipeline

No GitHub Release artifacts exist today. This document sketches a safe path — **not** an implemented workflow.

## Goals

1. Build macOS Apple Silicon `.app` (and later `.dmg`) from a tagged commit
2. Publish checksums on the GitHub Release
3. Document Gatekeeper behavior for unsigned vs signed builds
4. Optionally notarize for smoother first launch

## Suggested stages

| Stage | Action |
|-------|--------|
| Version | Bump `package.json` + `src-tauri/tauri.conf.json` together |
| Tag | `git tag v0.x.y` after CI green |
| CI build | `macos-14` runner: `npm ci` → `npm run tauri build` |
| Artifacts | Upload `AI Job Search.app` (zip) + `SHA256SUMS` |
| Notes | Changelog excerpt; Claude Code requirement; unsigned caveat |
| Signing | Apple Developer ID + notarization (requires certificates — owner only) |

## Gatekeeper (unsigned)

Users may need **right-click → Open**. Do not instruct users to disable Gatekeeper or run `spctl --master-disable`.

## Explicit non-goals (for now)

- Auto-publishing every green `main` build as a “stable” release
- Claiming Windows/Intel binaries before those pipelines are proven
- Bypassing notarization with unsafe workarounds
