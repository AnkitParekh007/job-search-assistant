# Implementation Plan and Status

| Phase | Scope | Status (2026-11-19) |
|---|---|---|
| 0 Audit and foundation | upstream audit, Tauri 2 + React + Tailwind scaffold, design tokens, dependency preflight | Done |
| 1 Automation bridge | stream-json bridge, control-protocol approvals, AskUserQuestion, cancel, resume, persisted history | Done. Protocol verified live against Claude Code 2.1.311 (Haiku probe: approval request received, allowed, file written). |
| 2 Core job search | dashboard, jobs, ranking view, compare, portal health, profile view | Done (native views + bridge) |
| 3 Application Studio | /apply bridge, posting guard pre-check, PDF preview, compile, page count, ATS check | Done. No `.tex` editor or line diff yet. |
| 4 Tracking and interviews | kanban with validated transitions, drawer, follow-ups, /outcome and /interview launch | Done. No dedicated interview mode or practice history yet. |
| 5 Remaining parity | gmail-sync, notion-sync, expand, upskill, add-template, add-portal, reset via Workflows | Entry points done through the bridge. Their dedicated screens are not built. |
| 6 Quality and packaging | Rust + TS tests, release .app | Unit and component tests plus a live smoke test done. No automated end-to-end desktop test suite (would need WebDriver tooling). |

## Next increments, in priority order

1. Interview mode: distraction-free Q&A panel reading `07-interview-prep.md` and the archived prep packs.
2. Gmail-sync proposal review screen (a structured table instead of console text).
3. Portal manager: list `.agents/skills`, toggle `enabled:`, review code before copying from community-portals.
4. Backup and restore of tracker, archives and profile to a zip in app data.
5. Skill-gap charts from `/upskill` output.
6. A `.tex` editor with a live recompile.
