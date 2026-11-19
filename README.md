# job-search-assitant

Marketing site and docs for **AI Job Search** — a local-first macOS desktop app that drives an `ai-job-search` workspace through Claude Code.

## Live site

**https://ankitparekh007.github.io/job-search-assitant/**

Deployed with GitHub Pages. Any push that changes `website/**` (or the deploy workflow) updates the site automatically.

## Website

Static site in [`website/`](./website/):

| Page | Path |
|------|------|
| About | `website/index.html` |
| Features | `website/features.html` |
| Download | `website/download.html` |
| Docs | `website/docs/` |

### Preview locally

```bash
cd website
python3 -m http.server 5177
```

Open [http://127.0.0.1:5177](http://127.0.0.1:5177).

### Deploy

GitHub Actions workflow: [`.github/workflows/deploy-website.yml`](./.github/workflows/deploy-website.yml)

- Triggers on `main` when `website/**` changes
- Also supports manual **Run workflow** from the Actions tab
