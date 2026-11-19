# Supported workflows

The desktop app exposes every upstream workflow listed in `apps/macos-apple-silicon/src/lib/workflows.ts`. Logic lives in the upstream checkout; the app sends the exact command/skill trigger through Claude Code.

| ID | Trigger | Title | Writes (summary) | External |
|----|---------|-------|------------------|----------|
| setup | `/setup` | Profile setup | Profile / CLAUDE.md / search queries | — |
| scrape | `/scrape` | Discover jobs | `job_scraper/seen_jobs.json` | Network / portals |
| rank | `/rank` | Rank matches | Rank fields in seen_jobs | Network |
| apply | `/apply` | Application Studio | cv/, cover_letters/, tracker (`drafted`), applications/ | — |
| outcome | `/outcome` | Record outcome | tracker, outcome.md, follow-up drafts | — |
| interview | `/interview` | Interview prep | Prep notes under applications/ | Optional research |
| gmail-sync | `/gmail-sync` | Gmail sync | tracker after approval | claude.ai Gmail connector |
| notion-sync | `/notion-sync` | Notion sync | External Notion DB | Notion MCP |
| html-report | `/html-report` | HTML report | `reports/…` | — |
| expand | `/expand` | Profile enrichment | Profile skills after confirm | Optional GitHub/docs |
| upskill | `/upskill` | Skill gaps | upskill/ plans | — |
| add-template | `/add-template` | Add template | Template skill files | — |
| add-portal | `/add-portal` | Add portal | `.agents/skills/<portal>/` | Network + guard |
| reset | `/reset` | Reset profile | Destructive profile reset | — |

Parity notes and gaps: [FEATURE-PARITY-MATRIX.md](../apps/macos-apple-silicon/docs/FEATURE-PARITY-MATRIX.md).  
Upstream inventory: [UPSTREAM-AUDIT.md](../apps/macos-apple-silicon/docs/UPSTREAM-AUDIT.md).
