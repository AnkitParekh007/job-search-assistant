# Wiki staging

GitHub Wiki is a **separate** git repository (`<repo>.wiki.git`). Adding Markdown under `docs/` does not publish Wiki pages.

## Publish (when authenticated)

```bash
# One-time
git clone https://github.com/AnkitParekh007/job-search-assitant.wiki.git
cd job-search-assitant.wiki

# Copy staged pages
cp /path/to/job-search-assitant/docs/wiki-staging/*.md .
# Rename Home.md as needed; commit & push
git add .
git commit -m "Initialize AI Job Search wiki"
git push
```

Prefer linking Wiki pages back to canonical `docs/` in the main repo to avoid contradictory copies. If Wiki drift becomes a problem, keep Wiki as a thin index and point to `docs/`.

## Staged pages

| File | Wiki title |
|------|------------|
| `Home.md` | Home |
| `Installation.md` | Installation |
| `First-Run.md` | First Run |
| `Architecture.md` | Architecture |
| `Workflow-Guide.md` | Workflow Guide |
| `Job-Discovery.md` | Job Discovery |
| `Resume-and-Cover-Letters.md` | Resume and Cover Letters |
| `Application-Tracking.md` | Application Tracking |
| `Interview-Preparation.md` | Interview Preparation |
| `Integrations.md` | Integrations |
| `Troubleshooting.md` | Troubleshooting |
| `Privacy-and-Security.md` | Privacy and Security |
| `Contributing.md` | Contributing |
