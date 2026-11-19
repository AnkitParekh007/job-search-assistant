# job-search-assitant

Marketing site and public home for **AI Job Search** — a local-first macOS desktop app that drives an `ai-job-search` workspace through Claude Code.

## Website

Static three-page site in [`website/`](./website/):

| Page | File | Purpose |
|------|------|---------|
| About | `website/index.html` | Product story |
| Features | `website/features.html` | Capability overview |
| Download | `website/download.html` | macOS download + requirements |

### Preview locally

```bash
cd website
python3 -m http.server 5177
```

Open [http://127.0.0.1:5177](http://127.0.0.1:5177).

### GitHub Pages (optional)

Point Pages at the `/website` folder (or copy its contents to `docs/`).
