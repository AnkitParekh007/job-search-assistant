# Signing / notarization status — 2026-11-21

| Item | Status |
|------|--------|
| Developer ID Application identity | **None found** (`security find-identity -v -p codesigning` → 0 valid identities) |
| Adhoc sign | Used for local Apple Silicon `.app` (`codesign --force --deep -s -`) |
| Notarization | **Not done** — requires Apple Developer Program + Developer ID cert + notarytool credentials |
| Stapling | N/A until notarized |
| Auto-update | Disabled |

## Wider beta unblock

1. Enroll / use Apple Developer Program membership.
2. Create **Developer ID Application** certificate in Keychain.
3. Set Tauri signing identity in `tauri.conf.json` / CI secrets (`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_APP_SPECIFIC_PASSWORD` or API key).
4. Re-run `npm run tauri build` → notarize → staple → re-package zip/DMG.
5. Update Download page from “unsigned / right-click Open” to notarized installer copy.

Until then, Gatekeeper first-launch remains: **right-click → Open**.
