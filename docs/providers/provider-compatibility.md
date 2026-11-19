# Provider Compatibility Matrix

Generated to match `packages/core/src/providers.ts` + Rust registry capabilities.

Legend: **Verified** · **Implemented** · **Partial** · **Unsupported** · **Blocked**

| Capability | Claude | Codex | OpenAI API | Gemini | Ollama |
|---|---|---|---|---|---|
| Authentication | Implemented | Implemented | Implemented (BYOK) | Implemented (CLI/API) | Local |
| Text generation | Verified (prior) | Implemented | Implemented | Implemented | Implemented |
| Streaming | Verified (prior) | Implemented | Implemented | Implemented | Implemented |
| Model selection | Implemented | Implemented | Implemented | Implemented | Implemented |
| Tool execution | Verified | Implemented | Partial (host-managed scope) | Partial (CLI / host) | Unsupported (default) |
| Human approval | Verified | Implemented | N/A (inference) | Mode-dependent | N/A (inference) |
| Session resume | Verified | Implemented | App-managed | Mode-dependent | App-managed |
| Job analysis | Verified | Implemented | Implemented | Implemented | Implemented |
| Resume drafting | Verified | Implemented | Implemented (draft assist) | Implemented (draft assist) | Implemented (draft assist) |
| Full workflow automation | Verified | Partial | Unsupported | Partial / Unsupported | Unsupported |

Live credential-gated rows remain **Blocked** until exercised on a developer machine — see `08-test-evidence.md`.
