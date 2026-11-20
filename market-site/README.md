# Marketing site (React SPA)

Vite + React + React Router, deployed to GitHub Pages at:

`https://job-search-assistant.rebound-ops.org/`

## Clean routes

| Path | Page |
|------|------|
| `/` | About / home |
| `/features` | Features |
| `/download` | Download / install |
| `/benchmarks` | ATS methodology & evidence status (no fabricated metrics) |
| `/faq` | Frequently asked questions |
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

Production is served at the root of the custom domain, so the base path defaults to `/`. Override with `BASE_PATH=/some/path/` only if the site is ever hosted under a sub-path.
