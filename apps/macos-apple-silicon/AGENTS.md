# Project Agent Contract

- Identify the task and read the **smallest relevant** set of source files before editing.
- Use `rg`, targeted file reads and existing code patterns; do not dump the entire repo or large logs.
- Make the smallest correct change; avoid unrelated refactors, packages, formatting or configuration changes.
- Reuse existing components, tests, APIs and conventions before creating new abstractions.
- For changes spanning several modules, write a short file-level plan before implementation.
- Test locally with the narrowest relevant test, then typecheck/lint if available; provide actual evidence, not claims.
- Do not retry a failing command unchanged; diagnose before a retry.
- Never read, print, commit or transmit credentials/secrets. Seek explicit approval for destructive/production actions.
- Keep responses concise: changes, validation, blockers, and next action. Don't echo large code blocks or raw logs.
- For complex unfinished work, update `docs/agent/HANDOFF.md` with current state, changed paths, tests and next task.
- `docs/agent/PROJECT_MAP.md` describes project-specific boundaries. Verify its facts against the code.

## Desktop-app constraints

- Drive the unmodified upstream checkout (default `~/Desktop/Projects/Automations/Job-Automations/ai-job-search`); do not reimplement slash-command logic in the app.
- Prefer bridge + native adapters already in `src-tauri/src/` and `src/lib/`.
- Upstream file contracts (tracker CSV header, `seen_jobs.json`, workflows) are sacred; change them only with matching tests.
