# Installation

Primary path: **macOS Apple Silicon** (`apps/macos-apple-silicon`).

Published package: **[`v0.1.4`](https://github.com/AnkitParekh007/job-search-assistant/releases/tag/v0.1.4)** — `Job-Search-Assistant-0.1.4-macos-arm64.zip` (`Job Search Assistant.app`, ad-hoc signed, not notarized). Earlier `v0.1.2` / `v0.1.3` zips are unchanged. Intel/Windows: build from source. Prefer `./scripts/build-macos-apple-silicon-preview.sh` for a validated local build. Do not disable Gatekeeper or strip quarantine to launch.

**Updates:** Settings → Updates can check GitHub Releases and download a SHA-verified zip to Downloads. Quit the app, replace the `.app`, then right-click → Open if Gatekeeper prompts. There is no silent in-place install.

## System requirements

| Item | Mandatory? | Notes |
|------|------------|-------|
| Apple Silicon Mac (M1–M4) | Yes (this guide) | Intel / Windows ports exist as source; see [`apps/README.md`](../apps/README.md) |
| macOS 13.0+ | Yes | `tauri.conf.json` → `minimumSystemVersion` |
| AI provider CLI (Claude Code and/or OpenAI Codex) | Yes for AI | Multi-provider AI support — see below |
| Python ≥ 3.10 | Yes for local tools | Prefer Homebrew `python@3.12` |
| Node.js 20+ and npm | Yes to build UI | |
| Rust stable + Xcode Command Line Tools | Yes for Tauri | |
| Local workspace folder | Yes | Any folder; Jobzuu scaffolds starter files on connect |
| BasicTeX / LuaLaTeX / XeLaTeX | Optional until PDFs | Required for Studio compile |
| poppler | Optional | ATS `pdftotext` check |
| Bun | Optional | Portal CLIs that need it |

## 1. Install AI providers (multi-provider support)

**Claude Code** (full workflow coverage, including Gmail/Notion connectors):

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

Install BasicTeX (or a fuller TeX distribution) and the packages your CV templates need. The app’s **Settings → Dependencies** lists what is missing.

## 4. Clone and build this app

```bash
git clone https://github.com/AnkitParekh007/job-search-assistant.git
cd job-search-assistant/apps/macos-apple-silicon
npm install
npm test
(cd src-tauri && cargo test)
npm run tauri dev          # development
# or
npm run tauri build
open "src-tauri/target/release/bundle/macos/Job Search Assistant.app"
```

## 5. Choose a workspace folder

On first launch, pick any folder. Empty folders are fine — Jobzuu creates `CLAUDE.md` and starter files if needed. Change the path later in Settings.

## Gatekeeper (unsigned builds)

Personal builds are typically **unsigned**. On first open, use **Finder → right-click the app → Open**, then confirm. Do not recommend disabling Gatekeeper system-wide.

## Other platforms

See [`apps/README.md`](../apps/README.md) for Intel macOS and Windows source ports.
