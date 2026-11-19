# Handoff — UX audit pass (2026-11-19)

## Done
Ruthless visual UX audit of the live macOS app (light + dark, empty + populated, failed automation). Implemented highest-impact fixes; rebuilt release bundle.

## Changed paths
- `src-tauri/src/bridge.rs` — `live_ids` excludes terminal statuses (zombie live)
- `src/lib/store.tsx` — live map hygiene; softer preview-mode copy
- `src/components/RunConsole.tsx` — sticky fail banner + Retry/Resume; no Stop/composer on dead runs
- `src/pages/Studio.tsx`, `PdfView.tsx`, `Dashboard.tsx`, `Jobs.tsx`, `Pipeline.tsx`, `Activity.tsx`, `Settings.tsx`, `App.tsx`, `ui.tsx`, `styles.css`

## Tests
- `npm test` — 9/9 pass
- `cargo test` — 11/11 pass
- Visual: Today (populated light), Jobs (populated), Studio (failed apply), Activity (failed + awaiting scrape)

## Open / not fully re-verified after last micro-tweaks
- Studio “Stopped before finishing” checklist row and Activity 4-card strip need the **latest** rebuild (in progress / just finished).
- Interview Prep, Documents, Onboarding, command palette, dark-mode native Settings toggle, and a live `awaiting_approval` approval card were not re-captured after rebuild.
- Canonical app path: `src-tauri/target/release/bundle/macos/AI Job Search.app` (copy synced from nested `src-tauri/src-tauri/target/...` when CARGO_TARGET_DIR was set relative).

## Next
Reopen the rebuilt app and spot-check Studio checklist row + Activity Discover/Rank/Apply/Outcome strip; then pick the next product slice if desired.
