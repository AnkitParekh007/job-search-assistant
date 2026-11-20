# Integrations

## AI providers

Configure Claude Code, OpenAI Codex, OpenAI Platform API, Gemini, or Ollama in **Settings → AI Providers**. Credentials stay in the OS keychain or provider CLI — not in SQLite.

## Portals

Job discovery uses portal skills under `.agents/skills/` in your workspace when present; otherwise web search. Add a portal from **Jobs**, **Settings → Dependencies**, or **Workflows** — Jobzuu runs the guided in-app workflow with your active provider.

## Optional tools

- **Bun** — only if you install portal CLIs that need it.
- **poppler** — ATS `pdftotext` checks.
- **BasicTeX / LuaLaTeX / XeLaTeX** — PDF compile for Studio.
