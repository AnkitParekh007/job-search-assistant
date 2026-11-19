# Design Review (v2, 2026-11-19)

**Method.** Every screen below was rendered from the production build and inspected in screenshots at 1360×860, in dark and light mode. Data was a snapshot of the real workspace files, served through a test stub for the desktop backend. That checks layout, type, color, states and interaction in the web view. It does **not** test the native window (traffic lights, vibrancy, real notifications), because this session can't capture the macOS screen.

**Manual checks still needed in the real app:** the traffic-light inset aligns with the sidebar; ⌘\ collapse; the native folder picker in Settings and onboarding; a system notification when a run waits while the window is in the background; drag-and-drop in Pipeline; and a real run's approval card.

## Defects found during QA and fixed

1. **Navigation could stall on the old page.** The exit animation waited on frames. The page now swaps immediately and only the new page fades in.
2. **The sidebar highlight covered a label** while sliding between items. Replaced with a static highlight.
3. **Practice "Reveal answer" showed nothing.** The height animation stalled at 0. It's now an opacity/translate fade.
4. **The ClickUp application showed as a fresh opportunity.** Jobs already in the tracker are now excluded from Today and get an "In pipeline · status" badge in Jobs.
5. **Empty kanban columns were blank slabs.** They now say "Nothing here yet", and "Drop to move here" during a drag.

## Scores (1–10; a subjective judgment, not proof of quality)

| Screen | Visual | Hierarchy | Ease | A11y | Consistency | macOS feel | Polish | Efficiency | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Today | 8 | 9 | 9 | 7 | 8 | 7 | 8 | 8 | Answers "what now" first, and You/AI tags separate your work from Claude's. Needs more state once more data exists (weekly trend). |
| Jobs | 8 | 8 | 8 | 7 | 8 | 7 | 8 | 8 | Cards plus a dense table option. Ring styles separate the quick check from the rubric score. Cards can't open a detail panel from the keyboard alone except via Tab and Enter, which is slow with many jobs; needs arrow-key navigation. |
| Application Studio | 7 | 7 | 7 | 6 | 7 | 7 | 7 | 7 | Functional three-panel layout, but the left panel is form-heavy and the checklist ticks are inferred from the log. Next: show the fetched posting text in the left panel once the posting-fetcher returns it. |
| Agent Activity | 7 | 8 | 8 | 6 | 7 | 6 | 7 | 8 | Honest: no fake progress, full tool I/O, prominent approvals. The stage strip is coarse (latest run per workflow). |
| Pipeline | 8 | 8 | 8 | 6 | 8 | 7 | 8 | 8 | Validated drag targets, context menu, animated drawer. Drag-and-drop has no keyboard equivalent except the context menu, which is acceptable. |
| Interview Prep | 8 | 9 | 9 | 8 | 8 | 7 | 8 | 8 | Calm, content-first. Practice mode is keyboard-driven (space, arrows, Esc). There's no saved practice history yet. |
| Onboarding | 8 | 9 | 9 | 7 | 8 | 7 | 8 | 8 | Six short steps, each skippable. Suggestions are never written directly; they go to `/setup` as items to confirm. |
| Settings / Profile / Documents / Workflows | 7 | 7 | 7 | 7 | 8 | 7 | 6 | 7 | Consistent but plain. Documents would benefit from thumbnail cards. |

## Next actionable improvements

1. Studio: render the fetched posting and the reviewer's critique in their own panes. Parse reviewer output from the `application-reviewer` sub-agent's tool result.
2. Arrow-key navigation through job cards and pipeline cards, with visible focus.
3. Activity: group tool calls under the step (task_summary) they belong to, and collapse long runs.
4. Real-window check of traffic-light spacing and vibrancy, then decide on sidebar translucency (currently opaque to save GPU).
