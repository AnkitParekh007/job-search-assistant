# UI / UX Specification

**Layout:** a translucent-feel left sidebar (218 px), an overlay title bar (drag region, ⌘K search) and a flexible workspace. Studio, Jobs and Documents use resizable panels.

**Design system** (`src/styles.css`): warm neutral surfaces, one indigo accent, and semantic good/warn/bad/info tones with soft backgrounds. Text is SF Pro, with SF Mono for paths and commands. Radii are 8 / 14 px. Shadows are subtle in light mode and deeper in dark. Every color is a token with light and dark values; the theme follows the system unless pinned in Settings.

**Motion:** page fades (140 ms), toast and list item entrances, and an approval-card entrance. A pulsing dot marks live runs. There are no looping decorative effects, and all motion turns off under `prefers-reduced-motion`.

**Keyboard:** ⌘K opens the command palette (pages, all 14 workflows, applications, jobs). ⌘1–8 and ⌘, switch pages. ⌘↩ sends a console reply, Esc closes overlays, and Enter opens a focused pipeline card.

**States:** every list has an explanatory empty state. Loading uses shimmer skeletons. Runs show *Running / Needs your approval / Waiting for your reply / Completed / Failed / Stopped / Interrupted*.

**Screens:**
- **Dashboard:** 8 clickable KPIs, funnel, fit bands, monthly submissions, deadlines, follow-ups, recent applications, recent runs.
- **Jobs:** table with filters, detail panel with ranking analysis and verdict chips, compare view, Search / Rank / Portal health actions.
- **Studio:** input (URL or paste plus integrity check), a workflow checklist ticked from real log evidence, live console, and a PDF panel with compile, page-count and ATS checks.
- **Pipeline:** kanban by canonical status with drag-and-drop transitions, a validation dialog (via /outcome, or a quick update), and an application drawer (timeline, archive, outcome.md, CV and cover letter PDFs, posting snapshot).
- **Documents:** every CV and cover letter, with the master CV side by side.
- **Agent Activity:** stage strip, run history with cost and duration, timeline or raw log, retry and resume.
- **Workflows:** a launcher card for each upstream workflow, showing what it may change and which external integration it needs.
- **Profile:** read-only rendering of every profile file, a placeholder counter, and section re-runs.
- **Settings:** workspace, dependency checklist, model, theme, integrations note.
