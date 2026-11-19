# job-search-assitant

**AI Job Search** — local-first job search clients plus a public marketing site.

## Live marketing site

**https://ankitparekh007.github.io/job-search-assitant/**

Deployed with GitHub Pages from [`market-site/`](./market-site/). Pushes that change `market-site/**` update the site automatically.

## Repository layout

```text
apps/
  macos-apple-silicon/   # macOS desktop (Apple Silicon / arm64)
  macos-intel/           # macOS desktop (Intel / x86_64)
  windows/               # Windows desktop
  web/                   # Browser app
market-site/             # Marketing + docs (GitHub Pages)
```

### Apps

See [`apps/README.md`](./apps/README.md).

The current developed desktop product lives in [`apps/macos-apple-silicon/`](./apps/macos-apple-silicon/). Other platform folders are scaffolds.

### Market site

Static site in [`market-site/`](./market-site/):

| Page | Path |
|------|------|
| About | `market-site/index.html` |
| Features | `market-site/features.html` |
| Download | `market-site/download.html` |
| Docs | `market-site/docs/` |

Preview locally:

```bash
cd market-site
python3 -m http.server 5177
```

Deploy workflow: [`.github/workflows/deploy-market-site.yml`](./.github/workflows/deploy-market-site.yml)
