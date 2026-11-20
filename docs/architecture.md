# Architecture

AI Job Search (Jobzuu) is a **local-first desktop shell**. It does not host agents in the cloud. Your chosen folder is the workspace source of truth; the app stores only run history and preferences in its own SQLite database under Application Support.

## Layers

1. **UI** (`packages/ui`) — React onboarding, Jobs, Studio, Pipeline, Activity.
2. **Core** (`packages/core`) — workflow catalog, provider gating, prompt builders.
3. **Tauri runtime** (`apps/*/src-tauri`) — workspace IO, dependency checks, provider bridges (Claude Code, Codex, inference APIs).

## Workspace contract

Runs always use the folder you explicitly connected. The app never silently binds to an external checkout. Missing starter files are scaffolded on connect.
