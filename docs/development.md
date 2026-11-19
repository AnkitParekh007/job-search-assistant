# Development

## Layout

```text
apps/
  macos-apple-silicon/   # primary client
  macos-intel/
  windows/
market-site/             # GitHub Pages React SPA (Vite)
docs/                    # Markdown docs (this tree)
.github/                 # workflows + templates
```

Agent contracts: `apps/*/AGENTS.md` and `docs/agent/*` inside each desktop app.

## Apple Silicon loop

```bash
cd apps/macos-apple-silicon
npm install
npm test
(cd src-tauri && cargo test)
npm run tauri dev
```

Frontend production build (no native bundle):

```bash
npm run build   # tsc && vite build
```

## Conventions

- Drive unmodified upstream; do not reimplement slash commands.
- Prefer existing bridge + workspace adapters.
- Smallest correct change; match existing TypeScript / Rust style.
- Never commit secrets, personal trackers, or tailored CVs.

## Tests

| Layer | Command |
|-------|---------|
| Frontend unit/component | `npm test` (Vitest) |
| Rust unit | `cargo test` in `src-tauri` |

CI: `.github/workflows/ci-macos-apple-silicon.yml` (when enabled on the default branch).

## Marketing site

```bash
npm run dev:market      # Vite dev server (port 5174)
npm run build:market    # production build → market-site/dist
```

Clean routes (GitHub Pages base `/job-search-assistant/`): `/`, `/features`, `/download`, `/docs`, `/docs/install`, …

Deployed by `.github/workflows/deploy-market-site.yml` on pushes to `market-site/**` (uploads `market-site/dist`).

## PR expectations

See [CONTRIBUTING.md](../CONTRIBUTING.md) and `.github/pull_request_template.md`.
