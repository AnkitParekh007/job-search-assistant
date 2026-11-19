# Security Audit — Multi-Provider Runtime

## Secrets

| Control | Status |
|---------|--------|
| API keys in OS keychain (`keyring`) | Implemented |
| No keys in SQLite | Verified by design (`set_setting` never stores keys) |
| No keys in renderer persistence | Keys only in short-lived password inputs |
| Redaction helper for logs | `security::credentials::redact` |
| Codex ChatGPT tokens not reused as Platform keys | Enforced in UI copy + separate code paths |

## Approvals

| Control | Status |
|---------|--------|
| Claude host permission prompts | Preserved |
| Codex `on-request` + `workspace-write` | Preserved |
| Gemini `--yolo` / auto-approve | Explicitly rejected |
| Inference providers cannot emit tool approvals | Returns clear error |

## Prompt injection

| Control | Status |
|---------|--------|
| System prompt treats postings as untrusted | Implemented |
| Inference providers have no tool surface | Implemented |
| Workspace path traversal blocked | Existing `safe_join` tests |

## SSRF

| Control | Status |
|---------|--------|
| Ollama endpoint URL validation | Implemented |
| Blocks `169.254.169.254` / metadata hosts | Tested |
