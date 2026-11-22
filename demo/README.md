# Fictional demo workspace

Sample data for screenshots, the README GIF, and a first look at the desktop app. **Alex Morgan, Nordlicht, Larkspur Labs, Meridian Health, Paper Lantern, Glass Orchard, and Cedar Circuit are fictional.** Emails use `example.com`. Nothing here is a real employer, a real candidate, or a result the app produced.

Open this folder as the workspace in Job Search Assistant (any platform build). The app reads:

- `job_search_tracker.csv` — three hand-entered rows (`drafted`, `applied`, `interview`). Statuses are records, not outcomes the app earned.
- `job_scraper/seen_jobs.json` — three ranked postings and three new ones.
- `.claude/skills/job-application-assistant/07-interview-prep.md` — one STAR story with an `[ADD DETAIL]` gap the app will not fill in.
- `cv/nordlicht_cv.tex` — a short placeholder, not a resume to send.

An empty folder still scaffolds empty starter files. This demo does not change that. Do not replace these files with a real job search and commit them.

The browser preview `npm run dev` inside `apps/macos-apple-silicon` can show the same numbers with `http://127.0.0.1:1420/?demo=1`. That query is ignored inside the Tauri app.
