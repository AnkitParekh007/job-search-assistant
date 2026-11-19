# AI Job Search Assistant

### Your AI job-search workflows. One visual desktop workspace.

Discover opportunities. Evaluate fit. Prepare applications. Track your progress. Stay in control.

![AI Job Search Assistant — Scout hero](./docs/assets/brand/scout-hero.svg)

[![macOS](https://img.shields.io/badge/platform-macOS%20Apple%20Silicon-black?logo=apple)](./apps/macos-apple-silicon/)
[![CI](https://github.com/AnkitParekh007/job-search-assistant/actions/workflows/ci-macos-apple-silicon.yml/badge.svg)](https://github.com/AnkitParekh007/job-search-assistant/actions/workflows/ci-macos-apple-silicon.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/AnkitParekh007/job-search-assistant?style=social)](https://github.com/AnkitParekh007/job-search-assistant/stargazers)

**Local-first** · **Open source** · **macOS** · **MIT**

[**Build from source**](#quick-start-build-from-source) · [Website](https://ankitparekh007.github.io/job-search-assistant/) · [Docs](./docs/getting-started.md) · [Contribute](./CONTRIBUTING.md) · [Issues](https://github.com/AnkitParekh007/job-search-assistant/issues)

Independent desktop companion built around [the original AI Job Search framework](https://github.com/ai-job-search-dev/ai-job-search) by [Mads Lorentzen](https://github.com/MadsLorentzen). This app adds a visual command center — it does **not** replace the upstream engine, and it does **not** submit applications to employers for you.

> **Version note:** Package version `0.1.0`. There is **no** published GitHub Release binary yet — build from source. A downloadable installer and release badge will be added when artifacts ship.

---

## See the desktop workspace

![Value stack: upstream AI engine → desktop command center → reviewable applications](./docs/assets/diagrams/value-stack.svg)

| Layer | What it is |
|-------|------------|
| **Upstream AI engine** | Unmodified [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) workspace (Claude slash commands; Codex uses equivalent instructions) |
| **Desktop command center** | This project — Tauri 2 + React + Rust UI, multi-provider runtime (Claude Code + OpenAI Codex), approvals, native views |
| **Reviewable applications** | Drafts and tracker updates you control; you submit outside the app |

Multi-provider details: [`docs/MULTI-PROVIDER-IMPLEMENTATION.md`](./docs/MULTI-PROVIDER-IMPLEMENTATION.md).

**Product screenshots** (Today, Jobs, Ranking, Studio, Pipeline, Activity, Onboarding) belong in [`docs/assets/screenshots/`](./docs/assets/screenshots/). Captures are not checked in yet — see that folder’s checklist, or help by filing a PR with sanitized PNGs.

Until then, the [marketing site](https://ankitparekh007.github.io/job-search-assistant/) shows the product story with illustrative UI chrome (not live app captures).

---

## Why I built it

The upstream framework is powerful: local files, Claude Code workflows, and a serious job-search pipeline. I wanted that same rigor with a more approachable **visual** experience — one place to see discovery, ranking, Application Studio, the pipeline, and agent activity, with human approval before sensitive tools run.

AI Job Search Assistant is that desktop shell. Scout (the onboarding mascot) walks you through connecting a workspace; the rest stays local-first and under your control.

This project’s outcomes are its own. Do **not** treat upstream creator results as evidence for this app.

---

## How it works

![Job search journey: Connect → Discover → Rank → Prepare → Review → Track](./docs/assets/diagrams/journey.svg)

1. **Connect** your local ai-job-search workspace  
2. **Discover** opportunities (`/scrape`)  
3. **Rank** fit scores and gaps (`/rank`)  
4. **Prepare** tailored CV / cover letter in Application Studio (`/apply`)  
5. **Review** drafts and tool approvals yourself  
6. **Track** status on the pipeline and record outcomes (`/outcome`)

Preparation and drafting are **not** confirmation that an application was submitted to an employer.

<details>
<summary><strong>Architecture (technical)</strong></summary>

```mermaid
flowchart LR
  User([You]) --> UI[React 19 UI]
  UI -->|invoke / events| Host[Tauri 2 / Rust host]
  Host -->|SQLite WAL| DB[(App DB: runs + settings)]
  Host -->|spawn argv stream-json| Claude[Claude Code CLI]
  Host -->|read / atomic write| WS[ai-job-search workspace files]
  Claude -->|cwd = workspace| WS
  Claude -->|Anthropic API under your account| API[Anthropic]
```

- **Upstream workspace files** own jobs, applications, profile, CVs, and the tracker CSV.
- **SQLite** stores run history and app preferences only.
- There is **no** independent local-LLM backend today — Claude Code is required for AI workflows.

Deep dive: [Architecture](./docs/architecture.md) · [App architecture](./apps/macos-apple-silicon/docs/ARCHITECTURE.md)

</details>

---

## What makes it different

- **Human approvals** for write/exec tools; live agent timeline and cost metadata  
- **Desktop experience** — Jobs, Ranking, Studio, Pipeline, Documents in one shell  
- **Local ownership** — tracker, archives, and profile remain files on disk you own  
- **Honest boundaries** — no auto-submit, no silent email, Claude usage under *your* account  

---

## Quick start (build from source)

Primary conversion path until a verified installer ships: **build the macOS Apple Silicon app from source**.

### Prerequisites

| Requirement | Why |
|-------------|-----|
| Apple Silicon Mac, macOS 13+ | Native arm64 Tauri target |
| [Claude Code](https://claude.ai/code) CLI, signed in | Runs every AI workflow (uses your Claude plan or API credits) |
| Python ≥ 3.10 | Upstream tools (`brew install python@3.12` recommended) |
| Local [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) checkout | Unmodified workspace the app drives |
| Node.js 20+ + npm | Frontend toolchain |
| Rust (stable) + Xcode CLT | Tauri native build |

Optional: BasicTeX + LuaLaTeX/XeLaTeX (PDF compile), poppler/`pdftotext` (ATS text check).

### Commands

```bash
# 1) Upstream workspace (source of truth)
git clone https://github.com/ai-job-search-dev/ai-job-search.git
# Follow upstream SETUP.md for profile / LaTeX as needed

# 2) This repository
git clone https://github.com/AnkitParekh007/job-search-assistant.git
cd job-search-assistant/apps/macos-apple-silicon

# 3) Install & verify
npm install
npm test
(cd src-tauri && cargo test)

# 4) Development
npm run tauri dev

# 5) Release .app (unsigned personal build)
npm run tauri build
open "src-tauri/target/release/bundle/macos/AI Job Search.app"
```

On first launch, select your upstream workspace (or change it in Settings).

**Gatekeeper:** unsigned builds may need **right-click → Open** the first time. Do not disable system security broadly.

Full guide: [Installation](./docs/installation.md) · First-run walkthrough: [Getting started](./docs/getting-started.md)

### First five minutes

1. Launch (`tauri dev` or the built `.app`).  
2. Select your **ai-job-search** workspace.  
3. Open **Settings → Dependencies** and fix anything red.  
4. Run **Profile setup** (`/setup`) or confirm an existing profile.  
5. **Discover** → **Rank** → open **Application Studio** → move cards on the **Pipeline**.

---

## Features and platform support

Capabilities are **Native** (UI / SQLite / local tools), **Upstream** (Claude Code slash commands), **External** (connectors), or **Planned**.

<details>
<summary><strong>Features by journey</strong></summary>

### Discover

- Search via upstream `/scrape` — **Upstream**
- Deduplicated `seen_jobs.json` with native Jobs views — **Native + Upstream**
- Portal / source visibility — **Upstream** (+ optional community portals)

### Evaluate

- AI-assisted ranking via `/rank` — **Upstream**
- Fit scores, verdicts, strengths, and gaps — **Native**
- Compare up to four ranked jobs — **Native**

### Prepare

- Resume and cover-letter drafting via Application Studio (`/apply`) — **Upstream**
- PDF compile, page count, ATS text check, preview — **Native**
- Posting integrity / prompt-injection pre-check — **Native**
- Tracker updated to **`drafted`** after preparation — **not** employer submission

### Track

- Kanban pipeline with validated transitions — **Native**
- Full `/outcome` recording and follow-up **drafts** (never auto-sent) — **Upstream**
- Application archives under `documents/applications/` — **Upstream files**

### Interviews

- Stage-specific prep via `/interview` — **Upstream**
- Dedicated practice-history UI — **Planned** ([roadmap](./docs/roadmap.md))

### Control your AI

- Live execution timeline, tool I/O, cost metadata — **Native**
- Human approvals for write/exec; read-only “allow for this run” — **Native**
- Stop, end session, retry, resume — **Native**

Details: [Features](./docs/features.md) · [Supported workflows](./docs/supported-workflows.md) · [Parity matrix](./apps/macos-apple-silicon/docs/FEATURE-PARITY-MATRIX.md)

</details>

| Platform | Path | Status |
|----------|------|--------|
| **macOS Apple Silicon** (M1–M4) | [`apps/macos-apple-silicon/`](./apps/macos-apple-silicon/) | **Developed client** — primary supported desktop app |
| macOS Intel (x86_64) | [`apps/macos-intel/`](./apps/macos-intel/) | Source-complete; release packaging not published |
| Windows | [`apps/windows/`](./apps/windows/) | Source-complete; release packaging not published |
| Web (browser) | [`apps/web/`](./apps/web/) | UI demo with sample data — **no** Claude Code bridge |

The **browser UI is a demo**, not a functional replacement for the desktop app. See [`apps/README.md`](./apps/README.md).

---

## Privacy, costs, and limitations

> **Do not push populated job-search workspaces, resumes, application records, or personal profile data to public Git repositories.** Keep real search data local (or in private remotes you control). Public forks of upstream or this repo should stay free of your private job-hunt files.

### Privacy and security

- No app telemetry or remote product backend.
- Credentials stay in Claude Code / connectors — not stored by this app.
- App data directory uses restrictive permissions; DB is mode `0600` on macOS.
- Write/exec tools require human approval; posting-integrity checks stay in the loop.
- Profile and posting content sent through Claude Code go to Anthropic under **your** account.

More: [Privacy & security](./docs/privacy-and-security.md)

### AI provider requirements and costs

| Item | Detail |
|------|--------|
| Provider | Anthropic via **Claude Code CLI** (required) |
| Cost | Uses your Claude subscription plan allowances and/or API credits |
| Local LLM | Not supported in this product today |
| Disclosure | Every AI workflow incurs usage; check Settings and Claude Code billing |

### Key limitations

- Primary support target is **macOS Apple Silicon**.
- No published installer / GitHub Release binary yet.
- Does **not** auto-submit applications or send follow-up email.
- Gmail / Notion features need external connectors.
- Web client is a demo UI only.

---

## Community and roadmap

Help wanted in concrete areas:

- **Tauri / Rust** host and packaging  
- **Accessibility** and UI polish  
- **Provider integrations** (beyond Claude Code)  
- **Testing**, docs, and sanitized screenshots  

Starter ideas: [contributor backlog](./docs/contributor-backlog.md) · [CONTRIBUTING.md](./CONTRIBUTING.md)

- Bugs → [GitHub Issues](https://github.com/AnkitParekh007/job-search-assistant/issues) (use the bug form)  
- Features → Feature request form  
- Security → [SECURITY.md](./SECURITY.md) (do not file public issues for vulnerabilities)  
- Discussions → enable steps in [docs/discussions-setup.md](./docs/discussions-setup.md) (not live until repo setting is on)

Roadmap: [docs/roadmap.md](./docs/roadmap.md)

### Support this project

Sponsorship helps continued development, additional AI providers, platform ports, docs, and testing.

**[Become a GitHub Sponsor](https://github.com/sponsors/AnkitParekh007)**

A star, bug report, contribution, or recommendation is equally appreciated.

---

## Developer reference

<details>
<summary><strong>Documentation index</strong></summary>

| Doc | Description |
|-----|-------------|
| [Getting started](./docs/getting-started.md) | First-run path |
| [Installation](./docs/installation.md) | Prerequisites and build |
| [Architecture](./docs/architecture.md) | System design |
| [Configuration](./docs/configuration.md) | Workspace and settings |
| [Features](./docs/features.md) | Capability map |
| [Supported workflows](./docs/supported-workflows.md) | Upstream command catalog |
| [Job discovery](./docs/job-discovery.md) | Scrape / rank |
| [Application Studio](./docs/application-studio.md) | Draft / PDF / review |
| [Application tracking](./docs/application-tracking.md) | Pipeline / outcomes |
| [Interview preparation](./docs/interview-preparation.md) | Prep packs |
| [Integrations](./docs/integrations.md) | Gmail, Notion, portals |
| [Privacy and security](./docs/privacy-and-security.md) | Threat model summary |
| [Troubleshooting](./docs/troubleshooting.md) | Common failures |
| [FAQ](./docs/faq.md) | Short answers |
| [Roadmap](./docs/roadmap.md) | Near / medium / future |
| [Development](./docs/development.md) | Contributor DX |
| [Repository audit](./docs/REPOSITORY-AUDIT.md) | Evidence-based GitHub audit |
| [Marketing site](./market-site/) | GitHub Pages source |

Authoritative engineering specs: [`apps/macos-apple-silicon/docs/`](./apps/macos-apple-silicon/docs/).

</details>

<details>
<summary><strong>FAQ</strong></summary>

**Does this apply to jobs for me?**  
No. It prepares documents and tracks status. You submit applications yourself.

**Do I need Claude Code?**  
Yes, for all AI workflows. The desktop UI alone cannot rank, scrape, or draft without it.

**Is there a downloadable `.dmg`?**  
Not yet. Build from source. Releases will be announced when artifacts exist.

**Can I use Ollama / a local model?**  
Not in the current architecture.

More: [FAQ](./docs/faq.md)

</details>

<details>
<summary><strong>Shared packages / monorepo commands</strong></summary>

Feature work lands once in `packages/core` + `packages/ui`. Every client and the market site consume those packages.

```bash
npm install
npm test
npm run build:features   # writes market-site/public/assets/data/features.json
npm run build:market     # Vite React SPA → market-site/dist (GitHub Pages)
npm run build:web
```

</details>

### License and acknowledgements

AI Job Search Assistant is released under the [MIT License](./LICENSE).

Inspired by [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search), created by [Mads Lorentzen](https://github.com/MadsLorentzen) and contributors. This is an **independent** graphical desktop companion around that framework — not an official upstream release.

The upstream framework is also MIT-licensed. This repository drives a separate upstream checkout and does not vendor upstream source trees; retain upstream copyright and license notices for any code you copy from that project. See [NOTICE](./NOTICE), [THIRD-PARTY.md](./THIRD-PARTY.md), and [docs/LICENSE-DECISION.md](./docs/LICENSE-DECISION.md).

### Maintainer

- GitHub: [@AnkitParekh007](https://github.com/AnkitParekh007)
- Product site: https://ankitparekh007.github.io/job-search-assistant/

Support channels: [SUPPORT.md](./SUPPORT.md)
