# Multi-Provider AI Runtime — Implementation Report

Branch: `feat/multi-provider-runtime`  
Primary host: `apps/macos-apple-silicon`  
Date: 2026-11-19

## Phase 1 audit (existing Claude-only behavior)

| Area | Finding |
|------|---------|
| `bridge.rs` | Spawns `claude -p` with bidirectional stream-json; host permission prompts; interrupt cancel; `--resume` sessions; no permission-bypass flag |
| `lib.rs` | Tauri commands for runs, workspace adapters, settings |
| `db.rs` | SQLite WAL for runs/events/settings only — not job data |
| `workflows.ts` | Catalog maps 1:1 to upstream slash commands / skills |
| UI | Settings had Claude model picker only; Automations always sent `/command` text |
| Contracts | Tracker CSV, `seen_jobs.json`, archives remain authoritative in the upstream checkout |

Claude-specific assumptions removed or gated: required-only Claude deps, slash-command prompts for every engine, “Claude needs approval” copy.

## Implemented features

### Provider-agnostic runtime (Rust)

- `src-tauri/src/providers/` — `types`, `registry`, `codex`, `openai_api` stub, `Runtime` facade
- Existing `bridge.rs` preserved for Claude Code
- `start_run` accepts `provider`; resumes prefer the session’s stored provider (no silent switch)
- Runs persist `provider` + `model` columns

### OpenAI Codex (app-server)

- Detects `codex` CLI; spawns `codex app-server` over stdio
- `initialize` / `initialized`, `thread/start|resume`, `turn/start`, `turn/interrupt`
- Streams notifications → UI-compatible + normalized event kinds
- Approvals: `item/*/requestApproval` answered with `{ decision: accept|acceptForSession|decline|cancel }`
- Sandbox: `workspace-write`; approval policy: `on-request` (never unrestricted unattended)
- Settings: Connect (ChatGPT login), account status, model preference field
- One-shot RPC helper for `account/read`, `account/login/start`, `model/list`

### Engine-neutral workflows

- Claude: unchanged slash prompts via `buildPrompt`
- Codex: `buildCodexPrompt` / `buildPromptForProvider` — equivalent goals, no `/apply` assumption
- Unsupported on Codex (explicit): `gmail-sync`, `notion-sync`, `add-portal`, `add-template`, `reset`
- Supported on Codex (instruction-mapped): setup, scrape, rank, apply, outcome, interview, html-report, expand, upskill

### UI

- Settings → **AI Providers** cards (Claude, Codex, planned OpenAI API / Gemini / Ollama)
- Workflows page gates Claude-only automations when Codex is default
- Agent Activity / RunConsole show provider (+ model when set)

## Supported workflows by provider

| Workflow | Claude Code | OpenAI Codex |
|----------|-------------|--------------|
| setup, scrape, rank, apply, outcome, interview, html-report, expand, upskill | Yes (slash) | Yes (neutral instructions) |
| gmail-sync, notion-sync | Yes (connectors) | Unsupported |
| add-portal, add-template, reset | Yes | Unsupported |

## Tests run (evidence)

| Suite | Result |
|-------|--------|
| `npm run test:core` | **9 passed** (includes Codex prompt + provider gating tests) |
| `cargo test` (apple-silicon) | Run after compile fixes — see latest CI / local output |

**Not claimed:** live Codex end-to-end smoke on this machine (Codex CLI was not installed in the agent environment). Install Codex locally and use Settings → Connect, then run Discover/Rank with provider=`codex`.

## Required user setup

1. Keep an unmodified `ai-job-search` workspace (with `CLAUDE.md`).
2. **Claude:** install Claude Code CLI and sign in (`claude`).
3. **Codex:** install Codex CLI, then Settings → AI Providers → Connect (ChatGPT).
4. Set default provider in Settings; optionally set Claude / Codex model overrides.
5. Launch a supported workflow; approve tool/file prompts in Agent Activity.

## Remaining limitations

- Intel macOS / Windows Tauri hosts still need the Rust `providers/` module ported (TS stubs already added).
- OpenAI Responses API, Gemini, Ollama are **stubs only**.
- Codex does not execute upstream slash commands or Claude connectors.
- Codex live integration smoke not executed in this environment (no `codex` binary).
- Per-workflow provider overrides are prepared via settings + session stickiness; a full per-launcher picker can follow.

## Security notes

- No API keys stored in SQLite or the renderer.
- Codex ChatGPT auth stays with the Codex CLI / OS storage.
- Approvals remain interactive; no `--dangerously-skip-permissions` / danger-full-access defaults.
- Applications are never marked submitted without user-confirmed submission semantics in prompts and existing tracker rules.

## Future roadmap

1. Port providers module to Intel + Windows hosts.
2. Wire OpenAI Responses API for non-agentic ranking/summary helpers (Keychain for secrets).
3. Gemini adapter.
4. Ollama local detection + lightweight tasks with memory warnings.
5. Optional per-workflow provider/model override in the launcher UI.
