# Gatekeeper limitations — free / ad-hoc macOS builds

Applies to **developer preview** builds signed with `codesign -s -` (no Apple Developer Program).

## What works without a paid membership

| Step | Status |
|------|--------|
| Tauri 2 Apple Silicon `.app` build | Supported |
| Ad-hoc code signature (`Signature=adhoc`) | Supported — `scripts/sign-macos-adhoc.sh` |
| `codesign --verify --deep --strict` | Passes |
| Local launch from the build tree | Works (`open` / double-click in `target/...`) |
| Packaging a native `.app` ZIP | Supported — `scripts/package-release-assets.sh` |

## What Gatekeeper blocks (expected)

| Behavior | Expected result |
|----------|-----------------|
| `spctl --assess --type execute` | **rejected** for ad-hoc apps |
| Stapler / notarization ticket | Absent |
| First launch of a **quarantined** download (Safari/GitHub zip) | Blocked until user **right-clicks → Open** (or equivalent System Settings allow) |
| `open` on a quarantined copy with no prior approval | May exit immediately with no lasting process (observed 2026-11-21) |
| App Translocation of quarantined apps | May start briefly then fail without user Gatekeeper approval |

## Allowed user guidance

- Unzip the archive.
- **Right-click** `AI Job Search.app` → **Open** → confirm Open.
- Or: build locally with `./scripts/build-macos-apple-silicon-preview.sh` and run from the build tree.

## Forbidden workarounds (do not document as install steps)

- `spctl --master-disable` / turning off assessments globally  
- `xattr -d com.apple.quarantine` / `xattr -cr` as the primary install method  
- Instructing users to disable macOS security features  

Scripts and validators in this repo preserve quarantine during fresh-install tests and never change Gatekeeper policy.

## Path to remove these limitations (paid)

1. Apple Developer Program membership  
2. Developer ID Application certificate  
3. `APPLE_SIGNING_IDENTITY` + `scripts/sign-macos-developer-id.sh`  
4. Notary credentials + `scripts/notarize-macos.sh`  
5. Staple + `spctl` accept  

Until then, market the channel as **developer preview (ad-hoc, not notarized)**.
