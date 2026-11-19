# Handoff — Multi-provider runtime (2026-11-19)

## Done
Provider-agnostic AI runtime on Apple Silicon: Claude Code preserved; OpenAI Codex via `codex app-server`; Settings AI Providers UI; engine-neutral Codex prompts; workflow gating.

## Changed paths
- `src-tauri/src/providers/` — types, registry, codex, openai_api stub, Runtime facade
- `src-tauri/src/{bridge,db,deps,env,lib}.rs` — provider routing, DB columns, optional Claude + Codex deps
- `packages/core/src/{providers,workflows,types,features}.ts` + tests
- `packages/ui/src/{store,pages/Settings,pages/Automations,pages/Activity,components/RunConsole}.tsx`
- `apps/*/src/runtime/api.ts` — provider-aware `startRun` + stubs on web/intel/windows
- `docs/MULTI-PROVIDER-IMPLEMENTATION.md`, `docs/architecture.md`

## Tests
- `npm run test:core` — 9/9 pass
- `(cd apps/macos-apple-silicon/src-tauri && cargo test)` — 13/13 pass
- Live Codex E2E: **not run** here (`codex` CLI absent). Install Codex and smoke Discover/Rank locally.

## Next
1. Install Codex CLI, Connect in Settings, smoke a Codex rank/scrape run with approvals.
2. Port `providers/` Rust module to macos-intel + windows.
3. Optional: per-workflow provider picker; OpenAI Responses API adapter.
