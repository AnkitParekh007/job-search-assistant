# macOS bundle identifier — audit & recommendation

## Current (Phase A developer preview)

| App | `CFBundleIdentifier` / Tauri `identifier` |
|-----|-------------------------------------------|
| Apple Silicon | `dev.local.aijobsearch` |
| Intel | `dev.local.aijobsearch.intel` |
| Windows (Tauri id) | `dev.local.aijobsearch.windows` |

### Problems with the current id

- `dev.local.*` signals a throwaway local build, not a distributable product.
- Splitting `.intel` / `.windows` fragments the product identity across platforms (separate Keychain items, separate TCC grants, harder support).
- Changing the id after users install resets macOS privacy prompts and can orphan app-support paths tied to the old id.

## Recommendation (next public version — not applied in Phase A)

Use one stable reverse-DNS id for **all** desktop shells:

```text
app.jobzuu.aijobsearch
```

Rationale:

- Matches in-product “Jobzuu” scaffolding language and “AI Job Search” product name.
- Avoids a personal GitHub username in the permanent id (transferable if ownership moves).
- Leaves room for related ids (`app.jobzuu.aijobsearch.helper`, etc.) without colliding with `dev.local`.

### Alternatives considered

| Candidate | Notes |
|-----------|-------|
| `com.ankitparekh.aijobsearch` | Fine if personal brand is intentional; less transferable |
| `org.rebound-ops.aijobsearch` | Matches site host branding; hyphen awkward in some tooling |
| Keep `dev.local.aijobsearch` | Acceptable only for private preview; do not notarize under this id |

## Local-data implications of changing the id

macOS and Tauri key storage off the bundle id. A cut that flips `dev.local.aijobsearch` → `app.jobzuu.aijobsearch` without a migration will look like a **new app** to the OS.

| Asset | Path / store today | After id change |
|-------|--------------------|-----------------|
| App Support DB / settings | `~/Library/Application Support/dev.local.aijobsearch/` (`app.db`, shims, workspace pointer) | **New empty** dir under `…/app.jobzuu.aijobsearch/`; old folder left orphaned |
| Preferences | `~/Library/Preferences/dev.local.aijobsearch.plist` (if present) | Not read by new id |
| Caches / logs | under `Library/Caches` / `Logs` keyed by id | Orphaned |
| Keychain (API keys) | service names tied to app id / team | **Not visible** to new id unless migrated |
| TCC (Files & Folders, Automation) | grants recorded per bundle id | User is re-prompted |
| Workspace on disk | user-chosen folder (`job_search_tracker.csv`, candidate, jobs) | **Unaffected** (path is absolute); but app may not remember the last path until re-selected |
| Intel / Windows sibling ids | `.intel` / `.windows` suffixes | Still fragmented unless unified in the same cut |

### Required migration (for 0.1.3 / first notarized build)

1. On first launch of the new id, detect prior Support dir `dev.local.aijobsearch`.
2. Offer one-shot copy/move of `app.db` (+ shims) into the new Support dir, or document a manual Reveal + copy.
3. Re-select workspace if the stored path setting did not migrate.
4. Re-enter provider credentials if Keychain items do not transfer.
5. Do **not** delete the old Support folder automatically without explicit user confirmation.
6. Document in release notes: “Upgrading from developer preview may ask for folder access and AI provider sign-in again.”

Clean-accept 2026-11-21 confirmed Support path isolation: swapping `~/Library/Application Support/dev.local.aijobsearch` fully resets in-app state while leaving workspace files intact — the same split applies to a bundle-id change.

## When to change

Apply the new identifier on the **next** version cut **before** Developer ID signing / notarization (Phase B), so the notarized product never ships under `dev.local.*`.

Phase A / clean-accept keeps `dev.local.aijobsearch` so local smoke workspaces and evidence stay comparable. **Do not** change production download links or publish a new id without explicit approval.
