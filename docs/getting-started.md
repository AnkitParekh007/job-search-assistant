# Getting started

This guide assumes **macOS Apple Silicon** — the developed client under [`apps/macos-apple-silicon/`](../apps/macos-apple-silicon/).

## Before you begin

1. Clone the upstream workspace: [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search).
2. Install and sign in to at least one AI provider for **multi-provider AI support** — Claude Code (`brew install --cask claude-code`, then `claude`) and/or OpenAI Codex.
3. Build or run this app — see [installation.md](./installation.md).

Provider usage uses your plan allowances or API credits. AI workflows are not free.

## First-run checklist

1. **Launch** — `npm run tauri dev` from `apps/macos-apple-silicon`, or open the built `AI Job Search.app`.
2. **Select workspace** — point the onboarding/settings picker at your upstream checkout.
3. **Verify dependencies** — Settings → Dependencies / AI Providers (provider signed in, Python ≥ 3.10, LaTeX if you need PDFs).
4. **Configure profile** — run Profile setup (`/setup`) or confirm existing upstream profile files.
5. **Set preferences** — search focus / queries per upstream docs.
6. **Discover** — Jobs → Search / Discover (`/scrape`).
7. **Rank** — Rank new matches (`/rank`).
8. **Prepare** — Application Studio for one posting; review PDFs and approvals. Tracker status becomes **`drafted`**.
9. **Track** — Pipeline kanban; record real outcomes when you apply outside the app.

## Important

- Preparing documents is **not** the same as submitting an application.
- Follow-up emails produced by `/outcome` are **drafts** only.
- Do not paste credentials, full resumes with sensitive IDs, or private employer data into public GitHub issues.

## Next

- [Installation](./installation.md)
- [Configuration](./configuration.md) — AI Providers (Claude Code / Codex)
- [Features](./features.md)
- Marketing docs: [first run](https://job-search-assistant.rebound-ops.org/docs/first-run) · [AI Providers](https://job-search-assistant.rebound-ops.org/docs/providers)
