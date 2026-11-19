# Application Studio

Application Studio wraps upstream `/apply`: drafter → reviewer → revision, with native PDF tooling.

## Flow

1. Provide a job URL or paste posting text.
2. Optional native **posting integrity** pre-check (`posting_guard.py`).
3. Start the Claude Code run; answer proceed / review questions in the console.
4. Compile PDFs with LuaLaTeX / XeLaTeX; preview in-app; optional ATS text check.
5. Tracker row is written as **`drafted`** when upstream completes that step.

## Gaps (honest)

- No in-app `.tex` editor — edit via the run or Reveal in Finder / your editor.
- CV “diff” is side-by-side PDF, not a line diff.
- **Does not submit** the application to the employer.

## Related

- [application-tracking.md](./application-tracking.md)
- Marketing: https://job-search-assistant.rebound-ops.org/docs/apply
