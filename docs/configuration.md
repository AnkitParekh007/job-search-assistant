# Configuration

## Workspace path

The app must point at a local [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) checkout. Choose it during onboarding or in **Settings**.

Upstream files remain the source of truth. Moving the folder requires updating the path in Settings.

## App settings (SQLite)

Preferences and run history live in the macOS app data directory:

`~/Library/Application Support/dev.local.aijobsearch`

Directory mode `0700`, database mode `0600` (see security model). Windows port uses `%AppData%\dev.local.aijobsearch.windows` when built from `apps/windows`.

## AI Providers

**Settings → AI Providers** (Apple Silicon app) selects the default engine:

| Setting key | Purpose |
|-------------|---------|
| `ai_provider` | `claude` (default) or `codex` |
| `model` | Claude model override (opus/sonnet/haiku or empty) |
| `codex_model` | Codex model id override (empty = Codex default) |

- **Claude Code:** auth stays in the Claude CLI; upstream `.claude/settings.json` still applies; remaining prompts appear in the app.
- **OpenAI Codex:** auth via ChatGPT Connect in Settings (Codex CLI / app-server). Runs use `workspace-write` + `on-request` approvals. Does not execute Claude slash commands — see [MULTI-PROVIDER-IMPLEMENTATION.md](./MULTI-PROVIDER-IMPLEMENTATION.md).
- The app does not store API keys in SQLite or the UI bundle.

## Dependencies

**Settings → Dependencies** checks that at least one AI provider CLI is present, plus Python ≥ 3.10, LaTeX engines, `pdftotext`, and related tools, and shows official fix hints.

## Environment / PATH

The Rust host builds an explicit PATH (Homebrew, common Claude/Python/TeX locations). Prefer fixing installs via Dependencies rather than custom shell hacks inside the app.

## Related

- Marketing: [AI Providers](https://ankitparekh007.github.io/job-search-assistant/docs/providers) · [Settings](https://ankitparekh007.github.io/job-search-assistant/docs/settings)
- [MULTI-PROVIDER-IMPLEMENTATION.md](./MULTI-PROVIDER-IMPLEMENTATION.md)
- [Privacy and security](./privacy-and-security.md)
- [apps/macos-apple-silicon/docs/SECURITY-MODEL.md](../apps/macos-apple-silicon/docs/SECURITY-MODEL.md)
