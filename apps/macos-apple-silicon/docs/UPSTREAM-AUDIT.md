# Upstream Audit

**Upstream:** https://github.com/ai-job-search-dev/ai-job-search
**Baseline:** commit `d2afe00bfc9b7be8ffc2ee41acc22570970b76d4` (2026-11-19), `git describe` = `v2.0.0-4-gd2afe00`
**License:** upstream `LICENSE` is preserved untouched in the upstream checkout. This desktop app is a separate project that *drives* the upstream checkout; it does not copy or modify upstream source.
**Community portals:** https://github.com/ai-job-search-dev/community-portals (none installed in the audited workspace; `.agents/` absent).

## What upstream is

An agent-oriented framework, not a service. There is **no HTTP API**. Behaviour lives in Markdown instructions that Claude Code executes (slash commands, skills, sub-agents), backed by a small set of deterministic Python helpers and LaTeX templates. State lives in plain files in the workspace.

## Workflow inventory

| Workflow | Entry | Kind | Deterministic helpers it calls | External / approvals |
|---|---|---|---|---|
| `/setup` | `.claude/commands/setup.md` | Agent (interactive interview, 3 paths) | `install_portal_clis.py` | Asks user many questions; writes profile files |
| `/scrape` | skill `job-scraper` (no command file) | Agent + portal CLIs + WebSearch fallback | `scrape_state.py`, `job_key.py`, `fetch_page.py` | Network reads; bun for portal CLIs |
| `/rank` | `rank.md` | Agent + `posting-scorer` sub-agents | `rank_state.py`, `job_key.py`, `posting_guard.py`, `fetch_page.py` | Network reads |
| `/apply` | `apply.md` (+ skill `job-application-assistant`) | Agent: drafter → `application-reviewer` → revise | `posting_guard.py`, `fetch_page.py`, `verify_pdf.py`, `verify_layout.py`; lualatex/xelatex | Asks "proceed?" before drafting; writes tracker row `drafted` |
| `/outcome` | `outcome.md` | Agent (data-entry, follow-up drafts, stale sweep) | `rank_state.py`, `posting_guard.py` | Follow-ups are draft-only; stale sweep needs explicit confirm |
| `/interview` | `interview.md` | Agent (prep pack, roleplay) | `posting_guard.py` | Web research |
| `/gmail-sync` | `gmail-sync.md` | Agent + Gmail MCP (`mcp__claude_ai_Gmail__*`) | `rank_state.py` | Needs claude.ai Gmail connector; proposes status changes |
| `/notion-sync` | `notion-sync.md` | Agent + Notion MCP (`mcp__notion__*`) | `job_key.py` | Needs Notion MCP; one-way push |
| `/html-report` | `html-report.md` | Agent writes a self-contained HTML | — | Output `reports/application-dashboard.html` |
| `/expand` | `expand.md` | Agent (documents, GitHub, portfolio) | — | Confirms before writing profile additions |
| `/upskill` | skill `upskill` (no command file) | Agent | `rank_state.py` | — |
| `/add-template` | `add-template.md` | Agent | compile toolchain | Writes ACTIVE-TEMPLATE block |
| `/add-portal` | `add-portal.md` | Agent generates `.agents/skills/<portal>/` | `fetch_page.py`, `security_guards.py` | Generated code reviewed by guard |
| `/reset` | `reset.md` | Agent | `check_framework_version.py`, `check_upstream_updates.py` | Destructive; confirms |

Sub-agents (`.claude/agents/`): `posting-fetcher`, `posting-scorer`, `application-reviewer`.

## Deterministic tools (`tools/`)

`scrape_state.py` (candidates/store/history; dedup against seen_jobs + tracker), `rank_state.py`, `job_key.py` (canonical keys), `posting_guard.py` (prompt-injection / hidden-text integrity gate), `fetch_page.py` (browser headers, robots.txt enforced), `robots_check.py`, `page_decode.py`, `verify_pdf.py` (text-layer extraction), `verify_layout.py`, `security_guards.py`, `install_portal_clis.py`, `check_framework_version.py`, `check_upstream_updates.py`, `upstream_triage.py`, `lint_skills.py`, `convert_salary_excel.py`. Plus root `salary_lookup.py`. **Python >= 3.10 required** (PEP 604 unions); macOS system `python3` 3.9 fails, so the app resolves an interpreter >= 3.10.

## State contracts (authoritative, app never migrates them)

| File | Format | Writers |
|---|---|---|
| `job_scraper/seen_jobs.json` | `{"seen": {key: {title, company, url, first_seen, posted_date, deadline, employment_type, fit, status, portal, source, location, [rank_score, rank_verdict, rank_date, location_verdict, language_gate, language_note, strengths, gaps]}}}` | scrape_state.py, /rank |
| `job_search_tracker.csv` | header `date,company,sector,role,role_type,channel,status,contact_person,fit_rating,notes,cv_file,cover_letter_file,source,deadline`; notes contain no commas | /apply 6b, /outcome, /gmail-sync |
| Status vocabulary | `drafted applied interview offer hired rejected no_response offer_declined withdrawn`; final = `hired rejected no_response offer_declined withdrawn` | |
| `documents/applications/<company>_<role>/` | `job_posting.md`, `cv_draft.<ext>`, `cover_letter.<ext>`, `outcome.md` (fixed Markdown format), `followup_YYYY-MM-DD.md` | /apply, /outcome |
| Folder naming | lowercase, spaces→`_`, drop non `[a-z0-9_]`, collapse `_`, trim | documents/README.md |
| Profile | `CLAUDE.md`, `.claude/skills/job-application-assistant/0[1-7]-*.md`, `job-scraper/search-queries.md` | /setup, /expand |
| CV / cover | `cv/main_<company>_<role>.tex` (lualatex, 2 pages), `cover_letters/cover_<...>.tex` (xelatex, 1 page) | /apply |

## Classification

- **Deterministic (safe to call directly from the app):** scrape_state candidates/history, job_key, posting_guard, verify_pdf, verify_layout, robots_check, check_upstream_updates, lualatex/xelatex compiles, tracker/seen_jobs reads.
- **Agent workflows (must go through Claude Code):** setup, scrape, rank, apply, outcome (follow-up drafting, stale sweep), interview, gmail-sync, notion-sync, html-report, expand, upskill, add-template, add-portal, reset.
- **External integrations:** WebSearch/WebFetch (scrape, rank, apply, interview), Gmail MCP, Notion MCP, portal CLIs (bun).
- **Approval-dependent:** apply (proceed + stretch-claim review), outcome stale sweep, gmail-sync status writes, notion push, reset, add-portal install, any status change.

## Findings that shaped the design

1. Commands are interactive (they ask questions mid-run). A one-shot `claude -p "/apply url"` would stall or auto-deny. The bridge must keep a live bidirectional session.
2. Claude Code 2.1.311 supports `--input-format stream-json --output-format stream-json --permission-prompts host`, `--session-id`, `--resume`. That is the SDK control protocol, usable without Node by speaking it directly from Rust.
3. `--bare` skips hooks, CLAUDE.md and skills, so it is **not** used.
4. Upstream project `settings.json` allow/ask/deny lists stay in force; the app never passes `--dangerously-skip-permissions`.
