# Ollama Local AI Implementation

## Status

| Area | Status |
|------|--------|
| Install / service detection | Implemented |
| `/api/tags`, `/api/chat` streaming | Implemented |
| JSON format responses | Implemented |
| SSRF endpoint validation | Implemented |
| Memory warnings | Implemented (macOS `sysctl`) |
| Auto model download | **Never** — user must `ollama pull` |
| Cloud fallback | **None** |
| Live inference (this environment) | **Blocked** — binary present, service not running on `:11434` |

## Defaults

- Endpoint: `http://127.0.0.1:11434`
- Remote endpoints must be explicitly configured; UI marks them as remote

## Workflows

Structured local assists: setup, rank, apply, outcome, interview, expand, upskill.
No agentic tool parity claimed.
