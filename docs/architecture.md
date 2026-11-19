# Architecture

AI Job Search is a **local-first desktop shell**. It does not host agents in the cloud and does not replace the upstream [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) framework.

## Diagram

```mermaid
flowchart TB
  subgraph app [AI Job Search.app]
    UI[React 19 + TypeScript + Tailwind UI]
    Rust[Tauri 2 Rust host]
    DB[(SQLite WAL\nruns + settings)]
    UI -->|invoke / events| Rust
    Rust --> DB
  end
  Claude[Claude Code CLI\nstream-json control protocol]
  WS[Upstream workspace\ntracker CSV, seen_jobs.json,\ncv/, documents/, CLAUDE.md]
  API[Anthropic API\nuser account]
  User([User]) --> UI
  Rust -->|spawn argv, no shell| Claude
  Rust -->|read / atomic write| WS
  Claude --> WS
  Claude --> API
```

## Responsibilities

| Component | Owns | Does not own |
|-----------|------|--------------|
| React UI | Screens, approvals UX, PDF preview pane | Slash-command logic |
| Rust bridge | Process supervision, permissions UI wiring, deps checks | Employer submission |
| SQLite | Run events, preferences | Jobs / applications / profile content |
| Upstream files | Authoritative job-search state | App chrome |
| Claude Code | Agent workflows under your login | App packaging |

## Claude Code bridge (summary)

- Uses CLI `stream-json` I/O and the host permission protocol (verified against Claude Code 2.1.311 in project docs).
- Bidirectional: mid-run questions surface in the UI.
- No `--dangerously-skip-permissions`. Write/exec tools require a human click.
- Cancel via interrupt control request; resume via `--resume <session_id>`.

Authoritative detail: [`apps/macos-apple-silicon/docs/ARCHITECTURE.md`](../apps/macos-apple-silicon/docs/ARCHITECTURE.md).

## Multi-provider runtime

The Apple Silicon desktop host routes workflows through a provider-agnostic runtime (`apps/macos-apple-silicon/src-tauri/src/providers/`):

| Provider | Status | Transport |
|----------|--------|-----------|
| Claude Code | Production | Existing `bridge.rs` stream-json |
| OpenAI Codex | Production-candidate | `codex app-server` JSON-RPC over stdio |
| OpenAI Responses API | Implemented (BYOK) | HTTPS Responses API + Keychain |
| Google Gemini | Implemented | Gemini CLI headless and/or Developer API |
| Ollama | Implemented | Local `127.0.0.1:11434` chat API |

Upstream slash commands (`/rank`, `/apply`, …) remain Claude-oriented. Codex runs use engine-neutral instructions. OpenAI API / Gemini / Ollama run **structured inference** (advisory JSON) with capability gating — not full agentic parity. See [`docs/MULTI-PROVIDER-IMPLEMENTATION.md`](./MULTI-PROVIDER-IMPLEMENTATION.md) and [`docs/providers/`](./providers/).

## Local LLM

Ollama is a **planned** local option for lightweight tasks. Today, production workflows require Claude Code or OpenAI Codex.
