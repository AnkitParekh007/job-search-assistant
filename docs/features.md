# Features

Evidence base: [`FEATURE-PARITY-MATRIX.md`](../apps/macos-apple-silicon/docs/FEATURE-PARITY-MATRIX.md) and the React pages under `apps/macos-apple-silicon/src/pages/`.

Legend: **Native** · **Upstream (Claude Code)** · **External connector** · **Planned**

## Discover

| Feature | Kind |
|---------|------|
| Job search via `/scrape` | Upstream |
| Deduped seen-jobs list | Native view of upstream files |
| Portal health / focus text | Upstream |

## Evaluate

| Feature | Kind |
|---------|------|
| Ranking via `/rank` | Upstream |
| Scores, verdicts, strengths, gaps | Native |
| Compare up to 4 jobs | Native |

## Prepare

| Feature | Kind |
|---------|------|
| Application Studio `/apply` | Upstream |
| Posting integrity pre-check | Native |
| PDF compile + preview + ATS check | Native |
| In-app `.tex` line editor | Planned |
| Employer submission | **Not supported** |

## Track

| Feature | Kind |
|---------|------|
| Kanban pipeline | Native |
| Quick status update | Native (upstream rules) |
| Full `/outcome` + follow-up drafts | Upstream |
| Auto-send email | **Not supported** |

## Interviews

| Feature | Kind |
|---------|------|
| `/interview` prep / roleplay | Upstream |
| Distraction-free practice history UI | Planned |

## Control AI

| Feature | Kind |
|---------|------|
| Agent Activity timeline | Native |
| Approvals / stop / resume | Native |
| SQLite run history | Native |

## Integrations

| Feature | Kind |
|---------|------|
| Gmail sync | Upstream + External |
| Notion sync | Upstream + External |
| HTML report | Upstream |
| Portal / template adders | Upstream |

See also [supported-workflows.md](./supported-workflows.md).
