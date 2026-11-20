# Provider Capability Matrix (living)

Statuses must match application capability definitions in `packages/core/src/providers.ts` and Rust `providers/registry.rs`.

**Installed ≠ authenticated ≠ workflow-capable.** A CLI present on disk does not mean the user is signed in, and sign-in does not mean every workflow can run on that provider. Runtime truth for support checks, readiness chips, and UI gating lives in [`packages/core/src/providers.ts`](../../packages/core/src/providers.ts) (`providerSupportsWorkflow`, `providerUiStatus`, `unsupportedReason`).

Legend: **Verified** = mock or live evidence · **Implemented** = code present, not live-proved · **Partial** · **Unsupported** · **Blocked**

| Capability | Claude Code | OpenAI Codex | OpenAI API | Gemini | Ollama |
|---|---|---|---|---|---|
| Authentication | Implemented (CLI) | Implemented (ChatGPT via CLI) | Implemented (BYOK Keychain) | Implemented (CLI + API key) | Local (no key) |
| Text generation | Verified (prior) | Implemented | Implemented | Implemented | Implemented |
| Streaming | Verified (prior) | Implemented | Implemented | Implemented | Implemented |
| Model selection | Implemented | Implemented | Implemented | Implemented | Implemented |
| Tool execution | Verified (host) | Implemented (app-server) | Host-managed / Partial | Host-managed / Partial | Unsupported (default) |
| Human approval | Verified | Implemented | N/A for pure inference | Mode-dependent | N/A for pure inference |
| Session resume | Verified | Implemented | App-managed continuity | Mode-dependent | App-managed |
| Job analysis | Verified | Implemented | Implemented (structured) | Implemented (structured) | Implemented (structured) |
| Resume drafting | Verified | Implemented | Implemented (draft assist) | Implemented (draft assist) | Implemented (draft assist) |
| Full workflow automation | Verified | Partial (instruction-mapped) | Unsupported (inference scope) | Partial (CLI) / Unsupported (API) | Unsupported |

See `provider-compatibility.md` for the CI-aligned table updated at closure.
