# AI Job Search — macOS (Apple Silicon)

Local-first **Apple Silicon** (`arm64`) desktop app for macOS. Connects to a local workspace folder you choose (scaffolded on connect if empty) with **multi-provider AI support** (Claude Code and/or OpenAI Codex).

This is the primary developed client. Sibling folders under `apps/` hold Intel Mac and Windows variants.

## Requirements

| Need | Why | Install |
|---|---|---|
| Apple Silicon Mac | arm64 native target | M1 / M2 / M3 / M4 |
| AI provider CLI (Claude Code and/or Codex) | multi-provider AI workflows | Claude: `brew install --cask claude-code`; Codex: CLI + Settings → Connect |
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
