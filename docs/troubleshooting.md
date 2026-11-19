# Troubleshooting

## Claude Code not found / not signed in

1. `brew install --cask claude-code`
2. Run `claude` in Terminal and complete login.
3. Re-check **Settings → Dependencies**.

## Python too old

Upstream tools need **≥ 3.10**. macOS system Python 3.9 fails. Install Homebrew `python@3.12` and re-run dependency checks.

## PDF compile fails

Install BasicTeX / TeX Live with LuaLaTeX and XeLaTeX per upstream `SETUP.md`. Confirm engines appear in Dependencies.

## Workspace not detected

Pick the folder that contains upstream `CLAUDE.md` / tracker files via Settings. The historical default path may not exist on your Mac.

## Gatekeeper blocks the `.app`

Use **right-click → Open** once for unsigned personal builds. Do not disable system security globally.

## Workflow stuck awaiting input

Upstream commands ask questions mid-run. Answer in the Agent console, or End session / Stop if you need to abort.

## Gmail / Notion does nothing useful

Connectors must be configured in Claude Code first. Until then those workflows are blocked externally.

## Tests fail after a dirty tree

From `apps/macos-apple-silicon`:

```bash
npm install
npm test
(cd src-tauri && cargo test)
```

## Still stuck

- [FAQ](./faq.md)
- [SUPPORT.md](../SUPPORT.md)
- Open a bug with the issue form (sanitize logs; no credentials or private applications).
