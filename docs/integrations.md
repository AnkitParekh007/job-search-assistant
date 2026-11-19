# Integrations

## Claude Code (required)

All AI workflows run through the Claude Code CLI under your account. Install and sign-in are mandatory for scrape/rank/apply/interview and related commands.

## Gmail sync

- Workflow: `/gmail-sync`
- Requires the **claude.ai Gmail connector** enabled in Claude Code.
- Proposes tracker status changes for approval; not a silent sync.
- No dedicated proposal-review table UI yet (console-based).

## Notion sync

- Workflow: `/notion-sync`
- Requires a **Notion MCP** server configured for Claude Code.
- One-way push; local files stay authoritative.

## Community portals

- Upstream / [community-portals](https://github.com/ai-job-search-dev/community-portals) skills install into the workspace.
- `/add-portal` generates skills with upstream security guard review.
- Bun may be required for some portal CLIs.

## HTML report

- `/html-report` writes a self-contained HTML dashboard under `reports/`.
- Open from Finder; not embedded in the app yet.
