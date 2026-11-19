# OpenAI Codex Implementation

## Status

| Area | Status |
|------|--------|
| App-server adapter | Implemented (existing `codex.rs`, retained) |
| Approvals / sandbox | Implemented (`on-request`, `workspace-write`) |
| Auth Connect UI | Implemented |
| Live smoke (this environment) | **Blocked** — `codex` CLI not installed |

## Behaviour

- Spawns `codex app-server` over stdio
- JSON-RPC initialize → thread start/resume → turn start/interrupt
- Streams notifications into the shared run-event bus
- Approvals answered only via the desktop UI
- Soft `~/.codex` presence is a hint only — Status uses `account/read`

## Live validation steps (local)

1. `npm i -g @openai/codex` (or official install)
2. Settings → AI Providers → Codex → Connect
3. Status should show account email/plan
4. Run Discover or Rank with default provider = Codex
5. Approve tool prompts in Agent Activity
