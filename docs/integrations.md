# Integrations

## Multi-provider AI support

AI workflows run through your selected provider CLI under your account:

| Provider | Role |
|----------|------|
| **Claude Code** | Established path for all upstream slash commands / skills |
| **OpenAI Codex** | Multi-provider adapter on Apple Silicon for core workflows (discover, rank, apply, outcome, interview, and related) |

Install and sign in to at least one provider. Pick the default in **Settings → AI Providers**. See [MULTI-PROVIDER-IMPLEMENTATION.md](./MULTI-PROVIDER-IMPLEMENTATION.md).

## Gmail sync

- Workflow: `/gmail-sync`
- Requires the **claude.ai Gmail connector** enabled in Claude Code (Claude provider only).
- Proposes tracker status changes for approval; not a silent sync.
- No dedicated proposal-review table UI yet (console-based).

## Notion sync

- Workflow: `/notion-sync`
- Requires a **Notion MCP** server configured for Claude Code (Claude provider only).
- One-way push; local files stay authoritative.

## Community portals

- Upstream / [community-portals](https://github.com/ai-job-search-dev/community-portals) skills install into the workspace.
- `/add-portal` generates skills with upstream security guard review.
- Bun may be required for some portal CLIs.

## HTML report

- `/html-report` writes a self-contained HTML dashboard under `reports/`.
- Open from Finder; not embedded in the app yet.
