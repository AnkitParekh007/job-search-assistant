# Project Map — Job Search Assistant Desktop

- Purpose: Local-first macOS shell (Tauri 2) that drives an unmodified `ai-job-search` workspace through a multi-provider AI runtime (Claude Code and OpenAI Codex today). Upstream files are the source of truth for jobs, applications, and profile.
- Product entrypoints: `src/main.tsx` → shared `@ai-job-search/ui`; `src-tauri/src/main.rs` → `lib.rs` (Rust host).
- Source directories and ownership:
  - Shared UI: `packages/ui/` — screens, RunConsole, store
  - Shared contracts: `packages/core/` — workflows, providers, metrics, types
  - App runtime: `src/runtime/api.ts` — Tauri invoke wrappers
  - `src-tauri/src/bridge.rs` — Claude Code stream-json supervisor
  - `src-tauri/src/providers/` — Runtime facade, Codex app-server, registry, stubs
  - `src-tauri/src/workspace.rs` — tracker CSV, seen_jobs, archives, profile adapters
  - `src-tauri/src/deps.rs` — dependency health (Claude + Codex optional; need ≥1 AI provider)
  - `src-tauri/src/db.rs` — SQLite run history/settings (`provider`, `model` on runs)
  - `src-tauri/src/env.rs` — PATH/python shim, app data dir
  - Docs: `docs/MULTI-PROVIDER-IMPLEMENTATION.md`, architecture, parity, security
- Existing APIs and contracts:
  - Tauri `invoke` + events `run-event`, `run-status`, `workspace-changed`
  - Provider commands: `list_providers`, `provider_account`, `provider_login`, `provider_models`
  - Workflow catalog: `packages/core/src/workflows.ts` (14 upstream commands/skills)
  - Tracker header + atomic outcome write: `workspace.rs` (`TRACKER_HEADER`)
  - Upstream workspace default: `~/Desktop/Projects/Automations/Job-Automations/ai-job-search` (changeable in Settings)
- Runtime and language versions: React 19 + TypeScript ~5.8 + Vite 7 + Tailwind 4; Tauri 2 + Rust edition 2021; Claude Code and/or Codex CLI, Python ≥ 3.10, LuaLaTeX/XeLaTeX for PDFs
- Install/setup command: `npm install` (repo root)
- Focused test command: `npm test` (Vitest); Rust: `(cd src-tauri && cargo test)`
- Typecheck command: `npx tsc --noEmit` (also runs inside `npm run build`)
- Lint command: none configured in `package.json`
- Full build command: `npm run tauri build` (produces unsigned `.app`)
- Security-sensitive directories (paths only):
  - Upstream workspace files: tracker, `documents/applications/`, profile under the configured workspace path
  - App data: `~/Library/Application Support/dev.local.aijobsearch` (SQLite runs/settings)
  - Never store credentials in-app; Claude auth stays in Claude Code; Codex/ChatGPT auth stays with Codex CLI
- Canonical implementations to reuse: `packages/ui` store/RunConsole, `src/runtime/api.ts`, `bridge.rs`, `providers/codex.rs`, `workspace.rs` `safe_join` + atomic writes
- Things explicitly out of scope:
  - Reimplementing upstream `/apply`, `/scrape`, skills, or agents inside the desktop app
  - Claiming Codex slash-command parity with Claude
  - Electron/Node sidecar; public distribution/signing (personal unsigned build)
  - Auto-approving write/exec tools or unrestricted Codex sandbox

Update this file only when project architecture or commands change; don't turn it into a source-code dump.
