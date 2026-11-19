# Feature Parity Matrix

Legend:
- **Native**: a dedicated screen that reads or writes upstream files directly with upstream rules.
- **Bridge**: runs the real upstream workflow through Claude Code with a live timeline, approvals and question answering.
- **Partial**: available, but less than the brief's full design (listed under Gaps).
- **Blocked**: needs an external account or connector the app can't provide.

Baseline: upstream `v2.0.0-4-gd2afe00`.

| Upstream workflow | Visual entry point | How it's implemented | Status | Gaps vs the brief |
|---|---|---|---|---|
| `/setup` | Profile → Full setup / Re-run skills, experience, search; Workflows | Bridge (`/setup`, `/setup --section …`). Multiple-choice questions render as cards. | Bridge | No custom wizard screens (the upstream interview drives the questions). No document import picker: point it at the `documents/` folder or give a file path. |
| `/scrape` (skill) | Jobs → Search (with focus), Portal health; Dashboard → Discover jobs | Bridge. Results read natively from `seen_jobs.json`, deduplicated by upstream's `scrape_state.py`. | Bridge + Native view | No per-portal / country / seniority form controls: focus is free text, as upstream accepts. |
| `/rank` | Jobs → Rank new | Bridge. Scores, verdicts, strengths and gaps shown natively from persisted rank fields. Compare view for up to 4 jobs. | Bridge + Native view | Not exercised end to end (no ranked jobs yet in this workspace). |
| `/apply` | Application Studio (URL or pasted text, integrity check, live console, PDF panel) | Bridge for the drafter/reviewer flow. Native posting-guard pre-check for pasted text, compile (lualatex/xelatex), page count, `verify_pdf.py` ATS check, PDF preview. | Bridge + Native | No in-app text editor for `.tex`: edits happen in the run or in your editor ("Reveal"). The CV diff is a side-by-side PDF view, not a line diff. |
| `/outcome` | Pipeline drag-and-drop → Record with /outcome or Quick update; drawer buttons; Open-applications review; Stale sweep | Quick update is native (`/outcome` Step 4 rules: canonical status, comma-free dated note, date rewritten when leaving drafted, atomic write, no reopening a final status, concurrent-change guard). Full record is Bridge. | Native + Bridge | |
| `/interview` | Pipeline drawer → Interview prep; Workflows | Bridge (prep pack and roleplay in the console) | Bridge | No dedicated distraction-free interview mode or saved practice-history screen. |
| `/gmail-sync` | Workflows | Bridge. Needs the claude.ai Gmail connector enabled in Claude Code. | Blocked until connected | No dedicated proposal-review screen: proposals and approvals happen in the console. |
| `/notion-sync` | Workflows | Bridge. Needs a Notion MCP server. | Blocked until connected | No connection-status panel. |
| `/html-report` | Documents → Generate HTML report; Workflows | Bridge. The native Dashboard reads the same tracker, so there's one source of truth. | Bridge | The generated HTML isn't embedded yet (open it from Finder). |
| `/expand` | Profile → Enrich; Workflows | Bridge. Confirmation questions handled in the console. | Bridge | |
| `/upskill` (skill) | Workflows | Bridge | Bridge | No skill-gap charts. |
| `/add-template` | Documents → Add template; Workflows | Bridge | Bridge | No template gallery. |
| `/add-portal` | Workflows | Bridge (upstream security guard reviews generated code) | Bridge | No portal manager with enable/disable toggles; installing community portals is manual. |
| `/reset` | Workflows (two-step confirmation) | Bridge; upstream also asks before resetting | Bridge | No app-level backup/restore UI. |
| Agent Activity | Agent Activity | Native: stage strip, run list, timeline, tool calls with inputs and outputs, sub-agent nesting, denials, stderr, cost metadata, stop, end session, retry, resume | Native | |
| Dependencies | Settings | Native checks for Claude CLI and sign-in, Python ≥ 3.10, LuaLaTeX, XeLaTeX, pdftotext, Bun and portals, with official fix instructions | Native | |
| Dashboard | Dashboard | Native metrics and charts from the tracker and `seen_jobs.json`, every metric clickable | Native | No "jobs by country" chart (location is free text upstream). |

Every one of the 14 upstream workflows has a working entry point that runs the real upstream implementation. None of the buttons are placeholders.
