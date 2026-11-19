# Phase 0 — Baseline Audit

Branch: `feat/complete-multi-provider-runtime`  
Date: 2026-11-20  
Host audited: `apps/macos-apple-silicon`

## Existing and working

| Area | Status | Evidence |
|------|--------|----------|
| Claude Code bridge (`bridge.rs`) | Working | Stream-json spawn, host approvals, cancel, resume; preserved |
| OpenAI Codex app-server (`providers/codex.rs`) | Implemented; live unverified here | ~1k LOC; protocol initialize/thread/turn/approvals |
| Provider registry + status probes | Working for Claude/Codex | `providers/registry.rs` |
| Runtime facade routing Claude/Codex | Working | `providers/mod.rs` |
| Run history `provider` + `model` columns | Working | `db.rs` migrations |
| Shared TS contracts | Partial | `packages/core/src/providers.ts` |
| Settings → AI Providers UI | Partial | Cards for all five; only Claude/Codex actionable |
| Workflow gating (Claude vs Codex) | Working | `providerSupportsWorkflow` |
| Engine-neutral Codex prompts | Working | `buildCodexPrompt` |

## Implemented but unverified

| Area | Notes |
|------|-------|
| Codex ChatGPT login / account/read / model/list | Requires local `codex` CLI + auth; **not installed** in this agent environment |
| Codex live workflow smoke | Blocked — no `codex` binary |

## Partially implemented

| Area | Gap |
|------|-----|
| Multi-provider Settings | OpenAI API / Gemini / Ollama shown as `planned` stubs |
| Capability-aware routing | Only Claude + Codex; API/local providers return false |
| Intel macOS / Windows hosts | No `providers/` module; Claude-only |

## Missing (pre-implementation)

- OpenAI Responses API client + BYOK Keychain storage
- Google Gemini CLI + Gemini API adapters
- Ollama local detection / chat / streaming
- Shared structured job-search orchestration for inference providers
- Secure credential Tauri commands (set/clear/test)
- Provider setup wizard UX (test connection, model refresh, remove credentials)
- `docs/providers/*` evidence set
- Mock fixtures for Responses / Gemini / Ollama streams

## Unsafe / not found

- No plaintext API keys in SQLite observed
- No `--dangerously-skip-permissions` or Codex unrestricted defaults
- Stub providers correctly refuse execution (`mod.rs` returns error for non-Claude/Codex)

## Platform-specific

| Platform | Provider runtime |
|----------|------------------|
| macOS Apple Silicon | Primary; Claude + Codex present |
| macOS Intel | Claude bridge only (pre-port) |
| Windows | Claude bridge only (pre-port) |
## Baseline test commands (to re-run after changes)

```bash
npm run test:core
cd apps/macos-apple-silicon/src-tauri && cargo test && cargo fmt --all -- --check
```

## Environment probes (2026-11-20)

| Tool | Result |
|------|--------|
| `codex` | Not found |
| `gemini` | Not found |
| `ollama` | Binary at `/usr/local/bin/ollama`; service **not running** on `:11434` |
| `claude` | Not re-probed in this pass (existing adapter preserved) |
