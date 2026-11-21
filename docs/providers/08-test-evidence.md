# Test Evidence

Date: 2026-11-21  
Branch: `fix/issues-17-20-acceptance`

## Commands run

| Command | Result |
|---------|--------|
| `npm run test:core` | See CI / local run on this branch |
| `cargo test` (macos-apple-silicon `workspace` tracker header tests) | See local run on this branch |
| `cargo fmt` / `clippy` | As available in CI |

## New / updated coverage (this branch)

- Tracker CSV human-header aliases → canonical keys; missing Status rejected
- Empty/unknown tracker status no longer counts as Submitted (`computeMetrics`)
- Studio “Evaluate fit with AI” gated on `aiProviderReady`
- `ai_provider` dep includes OpenAI API keychain, Gemini keychain, and Ollama service readiness
- Billable confirm before OpenAI API / Gemini workflow starts
- Settings shows live / unit / untested evidence chips (`PROVIDER_EVIDENCE`)

## Live provider tests

| Provider | Live result | Notes |
|----------|-------------|-------|
| Claude Code | **Prior live evidence preserved** (adapter + Gate A acceptance path) | Marked `live` in Settings |
| OpenAI Codex | **Blocked** — CLI not installed / not live-probed this session | Marked `untested` |
| OpenAI API | **Unit only** — parsers + keychain path; no Platform API key used | Marked `unit` |
| Gemini | **Unit only** — request builders; no API key used | Marked `unit` |
| Ollama | **Blocked** unless `ollama serve` is running with a pulled model | Marked `untested` until a live probe is recorded |

## Mock vs live

CI and agent environments use mock/unit tests by default. No paid API calls without an explicit user confirm in the app. Label anything not live-probed as untested or unit-only — never “Ready for all workflows.”

## Honesty rules

- Installed ≠ signed in ≠ workflow-capable
- Inference providers cannot scrape portals or run agentic tool loops
- Do not claim live verification without a dated row in this file
