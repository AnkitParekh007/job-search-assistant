# Marketing site (React SPA)

Vite + React + React Router, deployed to GitHub Pages at:

`https://ankitparekh007.github.io/job-search-assistant/`

## Clean routes

| Path | Page |
|------|------|
| `/` | About / home |
| `/features` | Features |
| `/download` | Download / install |
| `/docs` | Docs overview |
| `/docs/providers` | AI Providers (Claude Code / Codex) |
| `/docs/*` | Docs guides (install, quickstart, workflows, …) |

Legacy `*.html` paths redirect to the clean routes inside the SPA. Deep links work via a `404.html` fallback identical to `index.html`.

## Commands

```bash
npm run dev:market      # from repo root
npm run build:market
npm run build:features  # regenerates public/assets/data/features.json
```

Production base path defaults to `/job-search-assistant/`. Override with `BASE_PATH=/` for local preview at the server root if needed.
