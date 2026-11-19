# Project Map — AI Job Search Desktop

- Purpose: Local-first macOS shell (Tauri 2) that drives an unmodified `ai-job-search` workspace through the signed-in Claude Code CLI. Upstream files are the source of truth for jobs, applications, and profile.
- Product entrypoints: `src/main.tsx` → `src/App.tsx` (React UI); `src-tauri/src/main.rs` → `lib.rs` (Rust host).
- Source directories and ownership:
  - `src/pages/` — route screens (Dashboard, Jobs, Studio, Pipeline, Documents, Activity, Automations, Profile, Settings, Interview, Onboarding)
  - `src/components/` — shared UI (`ui.tsx`, `RunConsole.tsx`, `PdfView.tsx`)
  - `src/lib/` — TS contracts (`api.ts`, `store.tsx`, `workflows.ts`, `metrics.ts`, `interview.ts`)
  - `src-tauri/src/bridge.rs` — Claude Code stream-json supervisor
  - `src-tauri/src/workspace.rs` — tracker CSV, seen_jobs, archives, profile adapters
  - `src-tauri/src/deps.rs` — dependency health, allow-listed upstream tools, LaTeX compile
  - `src-tauri/src/db.rs` — SQLite run history/settings
  - `src-tauri/src/env.rs` — PATH/python shim, app data dir
  - `docs/` — architecture, parity, security, UX (reference only)
- Existing APIs and contracts:
  - Tauri `invoke` + events `run-event`, `run-status`, `workspace-changed`
  - Workflow catalog: `src/lib/workflows.ts` (14 upstream commands/skills)
  - Tracker header + atomic outcome write: `workspace.rs` (`TRACKER_HEADER`)
  - Upstream workspace default: `~/Desktop/Projects/Automations/Job-Automations/ai-job-search` (changeable in Settings)
- Runtime and language versions: React 19 + TypeScript ~5.8 + Vite 7 + Tailwind 4; Tauri 2 + Rust edition 2021; requires Claude Code CLI, Python ≥ 3.10, LuaLaTeX/XeLaTeX for PDFs
- Install/setup command: `npm install`
- Focused test command: `npm test` (Vitest); Rust: `(cd src-tauri && cargo test)`
- Typecheck command: `npx tsc --noEmit` (also runs inside `npm run build`)
- Lint command: none configured in `package.json`
- Full build command: `npm run tauri build` (produces unsigned `.app`)
- Security-sensitive directories (paths only):
  - Upstream workspace files: tracker, `documents/applications/`, profile under the configured workspace path
  - App data: `~/Library/Application Support/dev.local.aijobsearch` (SQLite runs/settings)
  - Never store credentials in-app; Claude/Gmail/Notion auth stays in Claude Code
- Canonical implementations to reuse: `src/lib/api.ts`, `src/lib/store.tsx`, `src/components/ui.tsx`, `src/components/RunConsole.tsx`, `bridge.rs` approval/control protocol, `workspace.rs` `safe_join` + atomic writes
- Things explicitly out of scope:
  - Reimplementing upstream `/apply`, `/scrape`, skills, or agents inside the desktop app
  - Electron/Node sidecar; public distribution/signing (personal unsigned build)
  - Auto-approving write/exec tools or `--dangerously-skip-permissions`

Update this file only when project architecture or commands change; don't turn it into a source-code dump.
