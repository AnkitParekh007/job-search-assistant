# Contributing

Thanks for helping improve **AI Job Search**. Please read this before opening a PR.

## Local development (primary client)

```bash
git clone https://github.com/AnkitParekh007/job-search-assistant.git
cd job-search-assistant/apps/macos-apple-silicon
npm install
npm test
(cd src-tauri && cargo test)
npm run tauri dev
```

You also need a local [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) workspace and a signed-in Claude Code CLI for end-to-end AI workflows. UI-only work can often proceed without live Claude runs.

Full notes: [docs/development.md](./docs/development.md) · [docs/installation.md](./docs/installation.md)

## Folder structure

| Path | Role |
|------|------|
| `apps/macos-apple-silicon/` | Developed desktop client |
| `apps/macos-intel/`, `apps/windows/`, `apps/web/` | Additional clients (see status in `apps/README.md`) |
| `market-site/` | GitHub Pages marketing + HTML docs |
| `docs/` | Markdown documentation |

## Tests

- Frontend: `npm test` (Vitest) in the app you change
- Rust: `cargo test` in that app’s `src-tauri`
- Prefer the narrowest test that proves the change

## Code conventions

- Match existing TypeScript / React / Rust style; avoid drive-by refactors
- Reuse bridge + workspace adapters; **do not** reimplement upstream slash commands
- Upstream file contracts (tracker CSV, `seen_jobs.json`, status vocabulary) are sacred
- No secrets, personal applications, resumes, or credentials in commits or issues

## Branch and PR practices

1. Branch from `main` with a focused name (`fix/…`, `docs/…`, `feat/…`)
2. Keep PRs small and reviewable
3. Fill out `.github/pull_request_template.md`
4. Update docs when behavior or install steps change
5. Do not force-push to `main`

## Contribution categories

| Welcome | Ask first |
|---------|-----------|
| Bug fixes with tests | New AI providers / local LLM backends |
| Documentation and link fixes | Relicensing or renaming the GitHub repo |
| Accessibility and empty states | Large packaging/signing systems |
| Scoped UI polish matching the design system | Copying upstream source into this repo |

## Documentation contributions

Improve `docs/`, `apps/*/README.md`, or `market-site/` — keep claims aligned with real code. Never invent releases, platforms, or autonomous apply features.

## Security expectations

Follow [SECURITY.md](./SECURITY.md). Do not open public issues for vulnerabilities.

## Respect for upstream

This app **drives** ai-job-search. Changes that break compatibility with upstream files or require forking upstream instructions need explicit discussion in the PR.
