# AI Job Search — macOS (Apple Silicon)

Local-first **Apple Silicon** (`arm64`) desktop app for macOS. Drives an unmodified [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) workspace through your signed-in Claude Code CLI.

This is the primary developed client. Sibling folders under `apps/` hold Intel Mac, Windows, and Web variants.

## Requirements

| Need | Why | Install |
|---|---|---|
| Apple Silicon Mac | arm64 native target | M1 / M2 / M3 / M4 |
| Claude Code CLI, signed in | runs every AI workflow | `brew install --cask claude-code`, then run `claude` once |
| Python ≥ 3.10 | upstream tools | `brew install python@3.12` |
| BasicTeX + packages | CV / cover-letter PDFs | see upstream `SETUP.md` |
| poppler (optional) | ATS text check | `brew install poppler` |

Settings → Dependencies checks these and shows what to run.

## Develop

```bash
cd apps/macos-apple-silicon
npm install
npm test
(cd src-tauri && cargo test)
npm run tauri dev
```

## Build (Apple Silicon)

```bash
cd apps/macos-apple-silicon
npm install
npm run tauri build
```

Open:

```bash
open "src-tauri/target/release/bundle/macos/AI Job Search.app"
```

Unsigned personal build — first launch may need right-click → Open.

On first launch it looks for `~/Desktop/Projects/Automations/Job-Automations/ai-job-search` as the workspace. Change it in Settings.

## Docs

`docs/UPSTREAM-AUDIT.md` · `docs/FEATURE-PARITY-MATRIX.md` · `docs/ARCHITECTURE.md` · `docs/SECURITY-MODEL.md` · `docs/UI-UX-SPECIFICATION.md` · `docs/IMPLEMENTATION-PLAN.md`
