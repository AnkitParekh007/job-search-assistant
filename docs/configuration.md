# Configuration

## Workspace path

The app must point at a local [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) checkout. Choose it during onboarding or in **Settings**.

Upstream files remain the source of truth. Moving the folder requires updating the path in Settings.

## App settings (SQLite)

Preferences and run history live in the macOS app data directory:

`~/Library/Application Support/dev.local.aijobsearch`

Directory mode `0700`, database mode `0600` (see security model). Windows port uses `%AppData%\dev.local.aijobsearch.windows` when built from `apps/windows`.

## Claude Code

- Authentication is entirely inside Claude Code — the app does not store API keys.
- Upstream `.claude/settings.json` allow/ask/deny rules still apply; remaining prompts appear in the app.
- Model selection follows Claude Code / run options exposed by the bridge.

## Dependencies

**Settings → Dependencies** checks Claude CLI presence and sign-in, Python ≥ 3.10, LaTeX engines, `pdftotext`, and related tools, and shows official fix hints.

## Environment / PATH

The Rust host builds an explicit PATH (Homebrew, common Claude/Python/TeX locations). Prefer fixing installs via Dependencies rather than custom shell hacks inside the app.

## Related

- [Privacy and security](./privacy-and-security.md)
- [apps/macos-apple-silicon/docs/SECURITY-MODEL.md](../apps/macos-apple-silicon/docs/SECURITY-MODEL.md)
