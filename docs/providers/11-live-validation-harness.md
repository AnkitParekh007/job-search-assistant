# Provider validation evidence (Issue #20)

The runtime records a local SQLite preflight observation before dispatch, including blocked attempts. The record contains allowlisted state labels, not raw account responses, credentials, prompt text, account identifiers, model names, or endpoint URLs. The latest 200 records can be queried via the native `provider_preflight_history` command. Successful dispatch is linked to the existing run status; it is not proof of live verification. A pending record may indicate interruption or an evidence-write failure. No provider credits are spent by the new evidence code itself.

## Safe manual live validation matrix

Use isolated authorized test accounts and synthetic workspace data; never submit real applications or send outreach. Record a fresh preflight for each scenario. Obtain explicit spend approval before billable inference. Never export raw account responses or tokens.

| Provider | Cases to exercise | Required evidence |
| --- | --- | --- |
| Claude | Signed out, signed in, resumed session, cancelled approval | Auth observation, run outcome |
| Codex | Missing config, stale config, actual account/read, resume/cancel | Explicit account test and outcome; config hint is not verified |
| OpenAI | Missing key, revoked key, valid restricted key, rate limit | Explicit connection test and approved synthetic inference |
| Gemini | Missing credentials, CLI-only, revoked key, valid key, quota | Explicit connection test and approved synthetic inference |
| Ollama | Offline, no model, selected model absent, installed model | Service/model observation and synthetic inference |

Quota and billing remain unknown unless a provider supplies authoritative evidence. Do not deliberately exhaust quotas to test failure paths; use mocks. Existing readiness gates are unchanged by this first increment. Inference errors have conservative coarse classification; unknown errors require investigation, not attribution to application defects. Agentic error classification, UI history, retention/deletion controls, actual live verification and portal recovery tests remain follow-ups. Issue #20 must stay open until live checks are independently verified.
