# UX Audit and Design Direction (v2)

## Audit of v1 (from rendered screenshots of every screen)

| # | Problem | Where | Severity |
|---|---|---|---|
| 1 | The home screen is a KPI wall: 8 equal-weight number cards and 4 charts. It doesn't say what to do today, and with little data most tiles read "0". | Dashboard | High |
| 2 | No first-run experience. A new user lands on zeros with no path to setup. | App | High |
| 3 | Jobs are a plain table. Fit is a tiny chip. Match reasoning sits behind a click, and preliminary fit and the rubric score look alike. | Jobs | High |
| 4 | Approvals are only visible inside a run. A run waiting on you is easy to miss if you're elsewhere. | Global | High |
| 5 | No interview workspace, although the STAR stories already exist in the profile. | Missing | Medium |
| 6 | Sidebar items have equal weight with no grouping by journey stage. The brand mark uses a gradient, which is noise. | Sidebar | Medium |
| 7 | Light-only feel and warm grey surfaces. The brief asks for a sophisticated dark default. | Theme | Medium |
| 8 | Page change could block on exit animations (fixed in v1.1). Drawers don't close on Esc. | Motion | Medium |
| 9 | Workspace path typed by hand, no native picker. No system notifications. No context menus. | Native | Medium |
| 10 | The Studio checklist's ticks are heuristic, and that's not visually signalled. | Studio | Low |

## Direction: "Quiet command center"

- **Hierarchy over density.** Each screen answers one of the five questions. The home screen is **Today**: a short prioritized list of things only you can do (approvals, replies, unsent drafts, follow-ups, deadlines), then fresh opportunities, then the journey, then automation activity.
- **Dark first.** Near-black graphite surfaces with low-contrast hairlines, one violet accent for interaction, teal for "AI is working", coral for "needs you", green for verified success. Light mode mirrors the same semantics on paper-white.
- **Typography:** SF Pro Display for titles (24/600, -0.02em), SF Pro Text at 13 for body, 11/600 uppercase tracking for labels, SF Mono for paths and commands, and tabular numerals for every metric.
- **Shape:** 10 px controls, 14 px cards, 20 px sheets. 1 px hairlines; shadows only on floating layers.
- **Motion:** 140–220 ms ease-out for layout and opacity, and springs only for direct manipulation (drag, sheet). No ambient loops except one live-status dot while a process is truly running. All motion is disabled under Reduce Motion.
- **Honesty:** AI-performed and user-approved actions are visually distinct (teal "AI" vs coral "You"). "Applied" only ever comes from the tracker. Preliminary fit is drawn as a ring outline; a rubric score is a filled ring with its number.
- **Native:** inset traffic lights in a full-height sidebar, journey-grouped navigation, ⌘K palette, ⌘\ to collapse the sidebar, right-click menus on cards, native folder picker, system notifications when a run needs you or finishes while the window is unfocused.
