# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `0.1.x` (source builds from `main`) | Yes — best effort |
| Published GitHub Release binaries | None published yet |

## Reporting a vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

Prefer **GitHub Private Vulnerability Reporting** on this repository (Settings → Code security → Private vulnerability reporting) when the owner has enabled it.

If private reporting is not yet enabled, contact the maintainer via GitHub (@AnkitParekh007) using a private channel and include:

- Affected commit or package version (`0.1.1` today)
- Platform (macOS version + CPU architecture)
- Clear reproduction steps **without** secrets
- Impact assessment (what an attacker could achieve)

Please allow reasonable time for triage before public disclosure.

## Scope — security-sensitive areas

| In scope | Out of scope (examples) |
|----------|-------------------------|
| Path traversal / unsafe file joins in the Rust host | Social engineering of Claude prompts that does not bypass app approvals |
| Shell injection via argv construction | Issues solely in upstream ai-job-search (report upstream) |
| XSS via Markdown rendering in the UI | Denial of service against Anthropic’s API |
| Improper auto-approval of write/exec tools | Physical access to an unlocked Mac |
| Credential or secret leakage introduced by this app | User pasting secrets into public issues |

## Credential handling

- This app must not store Claude, Gmail, Notion, or employer credentials.
- Auth remains in Claude Code / OS keychains / connector configuration.
- Never commit `.env` files, tokens, cookies, or personal job archives.

## Prompt-injection considerations

Job postings, emails, and web content can contain adversarial instructions. Controls include upstream `posting_guard.py`, human tool approvals, and CSP-hardened UI rendering. Reports that demonstrate **bypass of approval or sandbox boundaries** are especially valuable.

## Safe harbor

Good-faith research that follows this policy and avoids privacy violations / service abuse is appreciated. Do not access other users’ data or destroy workspace files.
