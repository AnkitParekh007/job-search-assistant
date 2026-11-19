# OpenAI Responses API Implementation

## Status

| Area | Status |
|------|--------|
| BYOK via OS keychain | Implemented |
| Models list / connection test | Implemented |
| Streaming Responses API | Implemented (SSE + non-stream fallback) |
| Structured JSON job-search schemas | Implemented |
| Tool execution | Host-managed / not advertised as agentic |
| Live paid API call | **Blocked in CI/agent** — no Platform API key requested |

## Auth

- Settings → AI Providers → OpenAI API → Configure
- Key stored with `keyring` service `dev.local.aijobsearch.providers`
- Never written to SQLite / localStorage / logs
- Distinct from Codex ChatGPT login

## Workflows

Structured inference for: setup, rank, apply, outcome, interview, expand, upskill.

Unsupported: scrape, gmail-sync, notion-sync, add-portal, add-template, reset, html-report.
