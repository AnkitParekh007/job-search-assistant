# Multi-Provider AI Runtime — Implementation Report

Branch: `feat/complete-multi-provider-runtime`  
Primary host: `apps/macos-apple-silicon`  
Date: 2026-11-20

Detailed evidence: [`docs/providers/`](./providers/).

## Providers

| Provider | Role | Status |
|----------|------|--------|
| Claude Code | Full agentic upstream slash workflows | Preserved |
| OpenAI Codex | Agentic app-server | Production-candidate code; live CLI blocked here |
| OpenAI API | Responses API structured inference (BYOK) | Implemented |
| Google Gemini | CLI + Developer API | Implemented |
| Ollama | Local inference | Implemented |

## Architecture

```text
UI → Workflow launcher → Capability gate → Runtime facade
  → Claude | Codex | InferenceBridge (OpenAI / Gemini / Ollama)
  → Normalized events → SQLite history
```

Inference providers never execute tools. They stream advisory JSON validated against job-search schemas.

## Security

- API keys: macOS Keychain / Windows Credential Manager via `keyring`
- No plaintext secrets in SQLite or frontend bundles
- No Gemini `--yolo`; Codex stays `on-request` + `workspace-write`
- Ollama defaults to loopback; remote URLs validated (SSRF)

## Tests

See [`docs/providers/08-test-evidence.md`](./providers/08-test-evidence.md).
