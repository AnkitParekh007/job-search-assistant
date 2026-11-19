# Supported workflows

The desktop app exposes every upstream workflow listed in `apps/macos-apple-silicon/src/lib/workflows.ts`. Logic lives in the upstream checkout; the app runs workflows through **multi-provider AI support** (Claude Code slash commands, or Codex instruction-mapped prompts for supported flows).

| ID | Trigger | Title | Writes (summary) | External | Providers |
|----|---------|-------|------------------|----------|-----------|
| setup | `/setup` | Profile setup | Profile / CLAUDE.md / search queries | — | Claude · Codex |
| scrape | `/scrape` | Discover jobs | `job_scraper/seen_jobs.json` | Network / portals | Claude · Codex |
| rank | `/rank` | Rank matches | Rank fields in seen_jobs | Network | Claude · Codex |
| apply | `/apply` | Application Studio | cv/, cover_letters/, tracker (`drafted`), applications/ | — | Claude · Codex |
| outcome | `/outcome` | Record outcome | tracker, outcome.md, follow-up drafts | — | Claude · Codex |
| interview | `/interview` | Interview prep | Prep notes under applications/ | Optional research | Claude · Codex |
| gmail-sync | `/gmail-sync` | Gmail sync | tracker after approval | claude.ai Gmail connector | Claude only |
| notion-sync | `/notion-sync` | Notion sync | External Notion DB | Notion MCP | Claude only |
| html-report | `/html-report` | HTML report | `reports/…` | — | Claude · Codex |
| expand | `/expand` | Profile enrichment | Profile skills after confirm | Optional GitHub/docs | Claude · Codex |
| upskill | `/upskill` | Skill gaps | upskill/ plans | — | Claude · Codex |
| add-template | `/add-template` | Add template | Template skill files | — | Claude only |
| add-portal | `/add-portal` | Add portal | `.agents/skills/<portal>/` | Network + guard | Claude only |
| reset | `/reset` | Reset profile | Destructive profile reset | — | Claude only |

Marketing docs mirror this table: https://ankitparekh007.github.io/job-search-assistant/docs/workflows  
Provider setup: https://ankitparekh007.github.io/job-search-assistant/docs/providers · [MULTI-PROVIDER-IMPLEMENTATION.md](./MULTI-PROVIDER-IMPLEMENTATION.md)

Parity notes and gaps: [FEATURE-PARITY-MATRIX.md](../apps/macos-apple-silicon/docs/FEATURE-PARITY-MATRIX.md).  
Upstream inventory: [UPSTREAM-AUDIT.md](../apps/macos-apple-silicon/docs/UPSTREAM-AUDIT.md).
