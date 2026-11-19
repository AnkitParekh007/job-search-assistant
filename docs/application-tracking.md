# Application tracking

## Pipeline (native)

Kanban board driven by `job_search_tracker.csv` status vocabulary:

`drafted`, `applied`, `interview`, `offer`, `hired`, `rejected`, `no_response`, `offer_declined`, `withdrawn`

Final statuses are not reopened by the quick-update path. Writes use atomic replace and an expected-current-status guard.

## Outcomes (`/outcome`)

- Quick update: native, following upstream Step 4 rules.
- Full record / follow-up drafting / stale sweep: Claude Code bridge.
- Follow-ups are **draft files only** — the app does not send email.

## Archives

Application folders live under upstream `documents/applications/<company>_<role>/`.

Marketing: https://ankitparekh007.github.io/job-search-assistant/docs/track
