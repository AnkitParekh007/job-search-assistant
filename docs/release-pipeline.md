# Release pipeline — verified native bundles only

## Current release status (2026-11-20)

**v0.1.1 is NOT a verified installable native release.** Its GitHub release workflow ran on Ubuntu and archived the three platform source directories. Those ZIPs do not constitute macOS .app packages or Windows installers. Do not promote them as click-to-install downloads.

The current product is available for **building from source**, with the developed client on macOS Apple Silicon. Intel and Windows are source ports requiring native builds and acceptance testing.

## New fail-closed release pipeline

The workflow at `.github/workflows/release.yml` now triggers **only on manual workflow_dispatch**. It does not automatically publish new version tags. To stage a release candidate:

1. Complete fixes and merge all required CI-green PRs into `main`.
2. Execute a synthetic job-seeker acceptance journey on the actual macOS desktop application. Preserve screenshots and test evidence.
3. Bump the root package version, each client package version and each Tauri config to the same `X.Y.Z`; update marketing release metadata only after native assets are published.
4. Create and push a `vX.Y.Z` tag pointing to the exact current `main` commit.
5. Manually run the **Verified native release** GitHub Actions workflow using that tag.
6. The workflow refuses an existing release tag, mismatched versions, or a tag not pointing to current main. It runs frontend tests and produces native bundles on macOS ARM64, macOS Intel and Windows hosted runners.
7. Archive verification (`scripts/verify-release-assets.py`) rejects ZIPs without real native app executables and installers, unsafe entries, and source-only folders.
8. The workflow writes SHA256SUMS and stages a **draft prerelease**, not an immediately public stable release.
9. On real machines, install, launch, onboard with synthetic data, connect a test workspace, and verify signing, integrity and permissions. Do not advertise notarization or signed installers until that is true.
10. After manual acceptance, publish the release; change the website CTA from **Build from source** to **Download** only once you have confirmed downloadable native packages.

## Important current blockers

- The historical `v0.1.0`/`v0.1.1` release assets still exist on GitHub. Mark these releases/source assets clearly as **source only** or replace them through an authorized release-management flow.
- New native workflow is unproven until it completes all three platform jobs. GitHub-hosted macOS runner availability can vary by repository and entitlement; a failure must block publication rather than fall back to source packages.
- A built app is not evidence of a successful complete onboarding → discovery → ranking → document preparation → manual submission → tracking → outreach journey.
- Live provider smokes need explicit provider access and consent for charges; do not use real candidate details.
- Signing/notarization, Windows SmartScreen reputation, and real-machine install testing remain open.

## Existing archive scripts

`scripts/ci-package-release-assets.sh` intentionally fails and no longer generates deceptive downloads.

`scripts/package-release-assets.sh X.Y.Z` only validates *already-built* native ZIPs and writes checksums. It never falls back to source packaging.

## Guardrail

Neither the desktop app nor the promotion materials may claim automatic employer application submission, guaranteed interviews, or successful hiring outcomes without real verified evidence.
