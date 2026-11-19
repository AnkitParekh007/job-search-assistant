# Architecture

```
┌──────────────── AI Job Search.app (Tauri 2, WKWebView, ~10 MB) ────────────────┐
│ React 19 + TS + Tailwind 4 UI                                                   │
│  Dashboard · Jobs · Studio · Pipeline · Documents · Activity · Workflows · ...  │
│        │ invoke()                       ▲ events: run-event, run-status,        │
│        ▼                                │         workspace-changed            │
│ Rust core                                                                       │
│  bridge.rs   Claude Code supervisor (stream-json, control protocol)            │
│  workspace.rs typed adapters: tracker CSV, seen_jobs.json, archives, profile   │
│  deps.rs     dependency health · allow-listed upstream tools · LaTeX compile   │
│  db.rs       SQLite (WAL, 0600): runs, run_events, settings                    │
│  env.rs      explicit PATH, python>=3.10 shim, app data dir (0700)             │
│  notify watcher on the workspace → debounced reload                            │
└───────────────┬───────────────────────────────────────────────┬────────────────┘
                │ spawn argv (no shell)                         │ read/atomic write
                ▼                                               ▼
   claude -p --input-format stream-json            ai-job-search checkout (upstream,
   --output-format stream-json --verbose           unmodified): CLAUDE.md, .claude/*,
   --permission-prompts host                       tools/*.py, cv/, cover_letters/,
   --permission-prompt-tool stdio                  job_search_tracker.csv,
   --session-id|--resume <uuid> [--model]          job_scraper/seen_jobs.json,
   cwd = workspace                                 documents/applications/
```

## Claude Code bridge

- **Why the CLI and not the TypeScript Agent SDK:** the SDK would need a Node sidecar (~60–100 MB RAM). The CLI already speaks the SDK's control protocol over stdio. Verified against 2.1.311: after an `initialize` control_request, each tool needing approval arrives as `control_request{subtype:"can_use_tool"}`, and the reply `control_response{behavior:"allow",updatedInput}` executes it. Without the handshake, prompts are silently denied; that's why the bridge always sends it.
- **Sessions are bidirectional.** Upstream commands ask questions mid-run ("Should I proceed with drafting?"). After each `result` the run goes to `awaiting_input` and the user can reply in the console. "End session" closes stdin.
- **Approvals.** Upstream `.claude/settings.json` allow/ask/deny rules apply first, inside Claude Code. Everything left comes to the UI as an approval card showing the exact command or file. "Allow for this run" only exists for read-only tools (Read, Grep, Glob, WebSearch, WebFetch). `AskUserQuestion` renders as a question card, and answers go back as `updatedInput.answers`.
- **Cancel** sends `control_request{subtype:"interrupt"}`, then kills the process after 1.5 s.
- **Resume:** `--resume <session_id>` for failed or interrupted runs.
- **Persistence:** every event except token ticks goes to SQLite. Thinking signatures and long tool output are trimmed. Runs that were live when the app quit are marked `interrupted` on next launch (a process can't be reattached).
- **Progress:** none is invented. The UI shows an indeterminate state plus the steps and tool calls that actually happened.

## Data ownership

Upstream files are the only source of truth for jobs, applications and profile. SQLite holds only run history and preferences. The one native write is the `/outcome` Step 4 status change, guarded by an expected-current-status check and written atomically. Everything else that changes upstream files goes through the multi-provider AI runtime (Claude Code or Codex) running upstream-compatible instructions.

## Resource use

There's no Electron and no Node at runtime. WKWebView renders the UI and PDFs natively. Rust threads only run while a Claude process is live. The file watcher is debounced. Release build: `opt-level=s`, LTO, strip.
