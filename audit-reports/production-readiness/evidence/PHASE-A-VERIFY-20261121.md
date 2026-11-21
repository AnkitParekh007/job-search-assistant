# Phase A verification — 2026-11-21

| Check | Result |
|-------|--------|
| Apple Silicon `tauri build` | PASS |
| Ad-hoc codesign | PASS (`Signature=adhoc`) |
| `validate-macos-release.sh` on `.app` | PASS |
| Native zip + validate (fresh unzip, quarantine kept) | PASS (11 pass / 0 fail / 3 expected WARNs) |
| Source fallback refused | PASS (`windows-x64` without installer) |
| Publish without `RELEASE_PUBLISH_APPROVED=1` | BLOCKED |
| Local `open` launch | PASS |
| Overwrite `v0.1.2-beta` release assets | **Not performed** |

## Checksums (local `dist-release/` only — not uploaded)

```
dab4fc18bae6d47b5fb4536c0b0d827e1726d3888ef5a338cf929ad603e0b686  AI-Job-Search-0.1.2-beta-macos-arm64.zip
```

## Bundle

- id: `dev.local.aijobsearch` (preview; see `docs/macos-bundle-identifier.md`)
- version: `0.1.2-beta`
- arch: arm64

## Expected warnings (developer preview)

- Not stapled / not notarized
- `spctl --assess` not accepted — right-click → Open; do not disable Gatekeeper
