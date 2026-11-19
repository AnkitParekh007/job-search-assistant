# Test Evidence

Date: 2026-11-20  
Branch: `feat/complete-multi-provider-runtime`

## Commands run

| Command | Result |
|---------|--------|
| `npm run test:core` | **9 passed** |
| `cargo test` (macos-apple-silicon) | **27 passed** |
| `cargo fmt --all -- --check` | Pass |
| `cargo clippy --all-targets -- -D warnings` | Pass (with `clippy.toml` arg threshold) |

## New Rust unit coverage

- OpenAI SSE delta parsing
- Responses output text extraction
- Ollama NDJSON chunk parsing / tags / endpoint SSRF
- Gemini URL encoding / generateContent path
- Inference JSON extraction + schema validation
- Credential kind parse + redaction
- Workspace excerpt builder

## Live provider tests

| Provider | Live result |
|----------|-------------|
| Claude Code | Not re-run in this session (adapter preserved) |
| OpenAI Codex | **Blocked** — CLI not installed |
| OpenAI API | **Blocked** — no Platform API key (by policy) |
| Gemini | **Blocked** — CLI not installed; no API key requested |
| Ollama | **Blocked** — `ollama` binary found; service not listening on `:11434` |

## Mock vs live

CI and agent environments use mock/unit tests only. No paid API calls.
