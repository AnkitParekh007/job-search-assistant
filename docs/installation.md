# Installation

Primary path: **macOS Apple Silicon** (`apps/macos-apple-silicon`).

Platform packages are on [GitHub Releases](https://github.com/AnkitParekh007/job-search-assistant/releases); notarized installers are not published yet. You can also build from source.

## System requirements

| Item | Mandatory? | Notes |
|------|------------|-------|
| Apple Silicon Mac (M1–M4) | Yes (this guide) | Intel / Windows ports exist as source; see [`apps/README.md`](../apps/README.md) |
| macOS 13.0+ | Yes | `tauri.conf.json` → `minimumSystemVersion` |
| AI provider CLI (Claude Code and/or OpenAI Codex) | Yes for AI | Multi-provider AI support — see below |
| Python ≥ 3.10 | Yes for upstream tools | Prefer Homebrew `python@3.12` |
| Node.js 20+ and npm | Yes to build UI | |
| Rust stable + Xcode Command Line Tools | Yes for Tauri | |
| Upstream [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) checkout | Yes | Unmodified workspace |
| BasicTeX / LuaLaTeX / XeLaTeX | Optional until PDFs | Required for Studio compile |
| poppler | Optional | ATS `pdftotext` check |
| Bun | Optional | Community portal CLIs |

## 1. Install AI providers (multi-provider support)

**Claude Code** (established path for all workflows, including Gmail/Notion connectors):

```bash
brew install --cask claude-code
claude   # complete sign-in once
```

**OpenAI Codex** (Apple Silicon adapter for core workflows): install the Codex CLI, then connect from **Settings → AI Providers**.

AI workflows consume your selected provider’s plan allowances or API credits. Pick a default provider in Settings.

## 2. Python

```bash
brew install python@3.12
python3.12 --version   # must be ≥ 3.10
```

## 3. LaTeX (for PDFs)

Follow upstream `SETUP.md` in your ai-job-search checkout (BasicTeX + required packages). The app’s Settings → Dependencies lists what is missing.

## 4. Clone upstream workspace

```bash
git clone https://github.com/ai-job-search-dev/ai-job-search.git
# Keep this path handy for the app workspace picker
```

## 5. Clone and build this app

```bash
git clone https://github.com/AnkitParekh007/job-search-assistant.git
cd job-search-assistant/apps/macos-apple-silicon
npm install
npm test
(cd src-tauri && cargo test)
npm run tauri dev          # development
# or
npm run tauri build
open "src-tauri/target/release/bundle/macos/AI Job Search.app"
```

## 6. Configure workspace path

On first launch, select the upstream checkout. You can change it later in Settings.

Historical default probe path (may not exist on your machine):

`~/Desktop/Projects/Automations/Job-Automations/ai-job-search`

## Gatekeeper (unsigned builds)

Personal builds are typically **unsigned**. On first open, use **Finder → right-click the app → Open**, then confirm. Do not recommend disabling Gatekeeper system-wide.

## Other platforms

| Client | Docs |
|--------|------|
| macOS Intel | [`apps/macos-intel/README.md`](../apps/macos-intel/README.md) — `npm run build:intel` |
| Windows | [`apps/windows/README.md`](../apps/windows/README.md) |

## Related

- Marketing install page: https://ankitparekh007.github.io/job-search-assistant/docs/install
- [Troubleshooting](./troubleshooting.md)
