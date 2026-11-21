# Signing / notarization status — 2026-11-21 (Phase A)

| Item | Status |
|------|--------|
| Apple account | **Free** — `security find-identity -v -p codesigning` → **0** valid identities |
| Developer ID Application identity | Absent (paid program not purchased) |
| Ad-hoc sign | **Verified** — `scripts/sign-macos-adhoc.sh` / `build-macos-apple-silicon-preview.sh` |
| Notarization | **Not done** — `scripts/notarize-macos.sh` ready when credentials exist |
| Stapling | N/A until notarized |
| Credentials in repo | **None** — see `scripts/lib/macos-release.env.example` |
| Auto-update | Disabled |
| Gatekeeper policy | **Unchanged** (`spctl --status` → assessments enabled) — see `docs/macos-gatekeeper-adhoc.md` |
| Acceptance evidence | [`ADHOC-SIGN-ACCEPTANCE-20261121.md`](./ADHOC-SIGN-ACCEPTANCE-20261121.md) |

## Phase A workflow (no paid account)

```bash
./scripts/build-macos-apple-silicon-preview.sh
EXPECT_VERSION=0.1.2-beta FRESH_INSTALL_TEST=1 ./scripts/validate-macos-release.sh
```

## Phase B unblock (paid Apple Developer — later)

1. Enroll in Apple Developer Program (explicit approval + spend).
2. Install **Developer ID Application** certificate.
3. Set env from `macos-release.env.example` (never commit secrets).
4. `sign-macos-developer-id.sh` → `notarize-macos.sh` → `validate` with `REQUIRE_DEVELOPER_ID=1 REQUIRE_NOTARIZED=1`.
5. Cut bundle id per `docs/macos-bundle-identifier.md` before public notarized ship.
6. Only then approve GitHub Release asset replacement.

## Security policy

- Do not disable Gatekeeper (`spctl --master-disable`).
- Do not strip `com.apple.quarantine` as an install workaround.
- First launch for developer preview: **right-click → Open**.
