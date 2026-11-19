# Project Agent Contract — Windows

- Drive the unmodified upstream `ai-job-search` checkout; do not reimplement slash-command logic in the app.
- Prefer bridge + native adapters already in `src-tauri/src/` and `src/lib/`.
- Upstream file contracts (tracker CSV header, `seen_jobs.json`, workflows) are sacred; change them only with matching tests.
- Windows PATH / TeX / Python discovery lives in `src-tauri/src/env.rs`.
