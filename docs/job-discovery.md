# Job discovery

## Discover (`/scrape`)

- Entry: Jobs → Search / Dashboard discover actions / Workflows.
- Implementation: Claude Code runs the upstream job-scraper skill.
- Results: native UI reads `job_scraper/seen_jobs.json` (deduped by upstream helpers).
- Focus is free text (including `broad` or `health`) — there is no separate per-portal form in the app beyond what upstream accepts.

## Rank (`/rank`)

- Entry: Jobs → Rank new.
- Upstream fetches postings, runs integrity gating, scores against your profile rubric.
- Native UI shows scores, verdicts, strengths, gaps; compare up to four jobs.

## What this is not

- Not a hosted job board.
- Not guaranteed coverage of every portal without installing portal skills / CLIs.
- Ranking quality depends on your upstream profile and Claude Code execution.

Marketing page: https://job-search-assistant.rebound-ops.org/docs/discover
