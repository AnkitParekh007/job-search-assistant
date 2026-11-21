# Privacy and security

Summary of [`apps/macos-apple-silicon/docs/SECURITY-MODEL.md`](../apps/macos-apple-silicon/docs/SECURITY-MODEL.md). Report vulnerabilities per [SECURITY.md](../SECURITY.md).

## Principles

- **Local-first:** jobs, applications, and profile live in the workspace folder you chose.
- **No product telemetry** and no remote app backend.
- **No secrets in SQLite or the UI bundle.** Claude Code / Codex / Gmail / Notion auth stay in those CLIs and connectors. Optional OpenAI Platform and Gemini API keys you paste in Settings are stored only in the OS keychain (BYOK), never in app databases.
- **Human approvals** for write and exec tools; no permission bypass flags.
- **Applications are never marked applied** merely because documents were generated.

## Notable controls

| Risk | Mitigation |
|------|------------|
| Prompt injection in postings | Upstream posting guard + human approvals |
| UI XSS | Markdown → React elements; strict CSP |
| Shell injection | `Command` argv only — never `sh -c` |
| Path traversal | `safe_join`; scoped asset protocol |
| Concurrent tracker writes | Atomic rename + expected-status check |

## Data leaving the machine

Network use is your selected AI provider (Anthropic via Claude Code and/or OpenAI via Codex under your account) and whatever upstream workflows fetch. Profile and posting content processed by a provider are subject to that provider’s terms and **are not free**.

## ATS benchmark corpus

Gate B regression benchmarks default to a **synthetic** Alex/Nordlicht corpus. Rules: [`packages/core/src/ats/PRIVACY.md`](../packages/core/src/ats/PRIVACY.md). Do not commit real resumes into CI.

## Public forks

Do not push personal tracker CSVs, tailored CVs, or archives to a public fork. Upstream gitignores cover many of these paths — verify before publishing.
