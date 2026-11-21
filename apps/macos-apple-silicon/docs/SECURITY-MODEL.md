# Security Model

| Threat | Control |
|---|---|
| Prompt injection in postings, emails or portal content | Upstream `posting_guard.py` stays in every upstream flow, and Studio can also run it on pasted text before starting. Injected text can't grant permissions: approvals come only from a human click in the app, and the bridge never auto-approves write or exec tools. |
| Injection into the UI | Untrusted text is rendered by a Markdown→React-element renderer (no `innerHTML`). A test confirms `<script>`/`<img onerror>` render as inert text. Strict CSP: `script-src 'self'`, no remote origins. |
| Shell injection via job titles or URLs | Every process is spawned with an argv vector (`std::process::Command`), never `sh -c`. URLs and posting text reach Claude Code as JSON message content on stdin. Direct tool calls use an allow-list of 5 upstream scripts. |
| Path traversal | `safe_join` rejects absolute paths and `..`. All file commands go through it, and asset-protocol scope is limited to the active workspace at runtime. |
| Unattended destructive actions | No `--dangerously-skip-permissions`, no `bypassPermissions`. `/reset` needs a second click, and upstream asks again. The tracker can't move backwards or reopen final statuses. Applications are never marked applied by generating documents. |
| Credential exposure | No API keys in SQLite or the UI bundle. Claude auth stays in Claude Code; Codex stays with the Codex CLI; Gmail/Notion stay in Claude Code connectors. Optional OpenAI Platform / Gemini BYOK keys are stored only in the OS keychain via `keyring`. App data lives in `~/Library/Application Support/dev.local.aijobsearch` (dir 0700, db 0600). |
| Symlink path escape | `safe_join` rejects absolute paths, `..`, and canonicalized targets that leave the workspace root. |
| Unverified updates | Assisted downloads require `SHA256SUMS.txt` and a matching digest; mismatch or missing sums fail closed and remove the partial file. |
| Data leaving the Mac | No telemetry or remote backend. The only network use is Claude Code itself (Anthropic API) and what upstream workflows fetch. Settings states clearly that profile and posting content go to Anthropic under the user's account and isn't free. |
| Public exposure of personal data | The app never runs git. Upstream gitignores tracker, archives and tailored documents. Profile edits stay local, and the Profile screen warns against pushing to a public fork. |
| Concurrent writes | Atomic temp-file + rename, and an expected-status check before a write. Invalid or mid-write JSON is reported, not overwritten. |
