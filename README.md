# AI Job Search

**Your AI-powered job search command center** — discover opportunities, evaluate fit, prepare tailored applications, and track your journey from one local-first desktop app.

AI Job Search is a native **macOS** shell (Tauri 2 + React + Rust) that drives an unmodified [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) workspace through your signed-in **Claude Code** CLI. Your tracker, archives, CVs, and profile stay as files on disk you own. The app supervises runs, approvals, and native views — it does not reimplement upstream agents in the cloud, and it does **not** submit applications to employers for you.

[Website](https://ankitparekh007.github.io/job-search-assitant/) · [Documentation](./docs/getting-started.md) · [Install / build](./docs/installation.md) · [Contributing](./CONTRIBUTING.md) · [Upstream engine](https://github.com/ai-job-search-dev/ai-job-search)

[![macOS](https://img.shields.io/badge/platform-macOS%20Apple%20Silicon-black?logo=apple)](./apps/macos-apple-silicon/)
[![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Rust](https://img.shields.io/badge/Rust-edition%202021-DEA584?logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CI](https://github.com/AnkitParekh007/job-search-assitant/actions/workflows/ci-macos-apple-silicon.yml/badge.svg)](https://github.com/AnkitParekh007/job-search-assitant/actions/workflows/ci-macos-apple-silicon.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/AnkitParekh007/job-search-assitant?style=social)](https://github.com/AnkitParekh007/job-search-assitant/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/AnkitParekh007/job-search-assitant)](https://github.com/AnkitParekh007/job-search-assitant/issues)
[![Last commit](https://img.shields.io/github/last-commit/AnkitParekh007/job-search-assitant)](https://github.com/AnkitParekh007/job-search-assitant/commits)

> **Version note:** Application package version is `0.1.0`. There is **no** published GitHub Release binary yet — build from source (below). A release badge will be added when artifacts ship.

---

## Visual product showcase

Product screenshots belong in [`docs/assets/screenshots/`](./docs/assets/screenshots/). Capture guidance and the checklist for Today, Jobs, Ranking, Studio, Pipeline, Interview, Agent Activity, and Onboarding are in that folder.

Until screenshots are checked in, the [marketing site](https://ankitparekh007.github.io/job-search-assitant/) shows the product story with illustrative UI chrome (not live app captures).

![AI Job Search social preview](./docs/assets/social/social-preview.svg)

---

## Why this exists

Serious job searches produce messy state: portal results, ranked shortlists, tailored PDFs, tracker rows, interview notes, and email threads. Spreadsheets and chat windows fragment that work. This app keeps **one local workspace** as the source of truth and gives you a native command center — with visible agent activity and human approval for sensitive tools — on top of the proven upstream Claude Code workflows.

---

## Features (by journey)

Capabilities are marked **Native** (UI / SQLite / local tools), **Upstream** (Claude Code runs real slash commands / skills), or **External** (needs a connector).

### Discover

- Search opportunities through upstream `/scrape` (portal CLIs or WebSearch fallback) — **Upstream**
- Deduplicated `seen_jobs.json` with native Jobs views — **Native + Upstream**
- Portal / source visibility and portal-health focus — **Upstream** (+ optional community portals)

### Evaluate

- AI-assisted ranking via `/rank` — **Upstream**
- Fit scores, verdicts, strengths, and gaps in the Jobs UI — **Native**
- Compare up to four ranked jobs — **Native**

### Prepare

- Resume and cover-letter drafting via Application Studio (`/apply`) — **Upstream**
- PDF compile (LuaLaTeX / XeLaTeX), page count, ATS text check, PDF preview — **Native**
- Posting integrity / prompt-injection pre-check — **Native** (upstream `posting_guard.py`)
- Tracker updated to **`drafted`** after preparation — **not** employer submission

### Track

- Kanban pipeline with validated status transitions — **Native**
- Full `/outcome` recording and follow-up **drafts** (never auto-sent) — **Upstream**
- Application archives under `documents/applications/` — **Upstream files**

### Prepare for interviews

- Stage-specific prep and roleplay via `/interview` — **Upstream**
- Dedicated distraction-free practice history UI — **Planned** (see [roadmap](./docs/roadmap.md))

### Control your AI

- Live execution timeline, tool inputs/outputs, cost metadata — **Native**
- Human approvals for write/exec tools; read-only “allow for this run” — **Native**
- Stop, end session, retry, resume — **Native**
- Run history in local SQLite (not the job source of truth) — **Native**

Details: [Features](./docs/features.md) · [Supported workflows](./docs/supported-workflows.md) · [Parity matrix](./apps/macos-apple-silicon/docs/FEATURE-PARITY-MATRIX.md)

---

## Platform availability

| Platform | Path | Status |
|----------|------|--------|
| **macOS Apple Silicon** (M1–M4) | [`apps/macos-apple-silicon/`](./apps/macos-apple-silicon/) | **Developed client** — primary supported desktop app |
| macOS Intel (x86_64) | [`apps/macos-intel/`](./apps/macos-intel/) | Source-complete port with Intel build target; release packaging not published |
| Windows | [`apps/windows/`](./apps/windows/) | Source-complete port (NSIS/MSI targets configured); release packaging not published |
| Web (browser) | [`apps/web/`](./apps/web/) | UI demo with `localStorage` sample data — **no** Claude Code bridge |

See [`apps/README.md`](./apps/README.md).

---

## How it works

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
- There is **no** independent local-LLM backend in this product today — Claude Code is required for AI workflows.

Deep dive: [Architecture](./docs/architecture.md) · [App architecture](./apps/macos-apple-silicon/docs/ARCHITECTURE.md)

---

## Installation (macOS Apple Silicon)

### Mandatory

| Requirement | Why |
|-------------|-----|
| Apple Silicon Mac, macOS 13+ | Native arm64 Tauri target |
| [Claude Code](https://claude.ai/code) CLI, signed in | Runs every AI workflow (uses your Claude plan or API credits) |
| Python ≥ 3.10 | Upstream tools (`brew install python@3.12` recommended) |
| Local [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) checkout | Unmodified workspace the app drives |
| Node.js 20+ + npm | Frontend toolchain |
| Rust (stable) + Xcode CLT | Tauri native build |

### Optional

| Requirement | Why |
|-------------|-----|
| BasicTeX + LuaLaTeX / XeLaTeX | Compile CV / cover-letter PDFs |
| poppler (`pdftotext`) | ATS text-layer verification |
| Bun | Only if you install community portal CLIs |

### Commands

```bash
# 1) Upstream workspace (source of truth)
git clone https://github.com/ai-job-search-dev/ai-job-search.git
# Follow upstream SETUP.md for profile / LaTeX as needed

# 2) This repository
git clone https://github.com/AnkitParekh007/job-search-assitant.git
cd job-search-assitant/apps/macos-apple-silicon

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

On first launch, select your upstream workspace (or change it in Settings). Default probe path used historically: `~/Desktop/Projects/Automations/Job-Automations/ai-job-search`.

**Gatekeeper:** unsigned builds may need **right-click → Open** the first time. Do not disable system security broadly.

Full guide: [Installation](./docs/installation.md)

---

## First five minutes

1. Launch the app (`tauri dev` or the built `.app`).
2. Select your upstream **ai-job-search** workspace.
3. Open **Settings → Dependencies** and fix anything red (Claude signed in, Python, LaTeX).
4. Run **Profile setup** (`/setup`) or confirm an existing candidate profile.
5. Set search preferences / focus for discovery.
6. **Discover** jobs (`/scrape`).
7. **Rank** new matches (`/rank`).
8. Open **Application Studio**, prepare a reviewed CV/cover letter, and confirm PDFs — tracker becomes **`drafted`**.
9. Move the card on the **Pipeline** and record outcomes as you actually apply outside the app.

Preparation and drafting are **not** confirmation that an application was submitted to an employer.

Walkthrough: [Getting started](./docs/getting-started.md)

---

## Architecture overview

| Layer | Responsibility |
|-------|----------------|
| React UI | Dashboard, Jobs, Studio, Pipeline, Documents, Activity, Workflows, Settings, Onboarding |
| Rust host | Claude Code supervisor, workspace adapters, deps checks, SQLite, file watcher |
| Claude Code | Executes upstream Markdown workflows with your account |
| Upstream files | Authoritative job / application / profile state |

Security model: [Privacy & security](./docs/privacy-and-security.md) · [SECURITY-MODEL.md](./apps/macos-apple-silicon/docs/SECURITY-MODEL.md)

---

## Supported workflows

All 14 upstream workflows have app entry points (bridge and/or native). Catalog: [Supported workflows](./docs/supported-workflows.md).

Notable externals: **Gmail sync** needs the claude.ai Gmail connector; **Notion sync** needs a Notion MCP server.

---

## Data privacy and security

- No app telemetry or remote product backend.
- Credentials stay in Claude Code / connectors — not stored by the app.
- App data directory uses restrictive permissions; DB is mode `0600` on macOS.
- Prompt-injection and posting integrity controls stay in the loop; write/exec tools require human approval.
- Profile and posting content sent through Claude Code go to Anthropic under **your** account and are **not free**.

---

## AI provider requirements and costs

| Item | Detail |
|------|--------|
| Provider | Anthropic via **Claude Code CLI** (required) |
| Cost | Uses your Claude subscription plan allowances and/or API credits |
| Local LLM | Not supported in this product today |
| Disclosure | Every AI workflow incurs usage; check Settings and Claude Code billing |

---

## Key limitations

- Primary support target is **macOS Apple Silicon**.
- No published installer / GitHub Release binary yet.
- Does not auto-submit applications or send follow-up email.
- Gmail / Notion features need external connectors.
- Web client is a demo UI only.
- Repository folder name `job-search-assitant` is intentional for URL compatibility until an explicit rename.

---

## Product roadmap

See [docs/roadmap.md](./docs/roadmap.md) (derived from `IMPLEMENTATION-PLAN.md` and open gaps in the parity matrix).

---

## Documentation index

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

Authoritative engineering specs also live under [`apps/macos-apple-silicon/docs/`](./apps/macos-apple-silicon/docs/).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Bug reports, docs fixes, tests, and carefully scoped UI improvements are welcome. Respect upstream file contracts — do not reimplement slash-command logic inside the app.

- Bugs → [GitHub Issues](https://github.com/AnkitParekh007/job-search-assitant/issues) (use the bug form)
- Features → Feature request form
- Security → [SECURITY.md](./SECURITY.md) (do not file public issues for vulnerabilities)

---

## FAQ

**Does this apply to jobs for me?**  
No. It prepares documents and tracks status. You submit applications yourself.

**Do I need Claude Code?**  
Yes, for all AI workflows. The desktop UI alone cannot rank, scrape, or draft without it.

**Is there a downloadable `.dmg`?**  
Not yet. Build from source. Releases will be announced when artifacts exist.

**Can I use Ollama / a local model?**  
Not in the current architecture.

More: [FAQ](./docs/faq.md)

---

## Upstream attribution

This project **drives** [ai-job-search](https://github.com/ai-job-search-dev/ai-job-search) (MIT, per GitHub license metadata) without copying or modifying its source in this repository. You must keep a separate upstream checkout. See [NOTICE](./NOTICE) and [THIRD-PARTY.md](./THIRD-PARTY.md).

---

## License

This repository is intended to be licensed under the **MIT License**. See [LICENSE](./LICENSE).  
Confirm the copyright holder line matches your preferred attribution before publishing forks or binaries. See [docs/LICENSE-DECISION.md](./docs/LICENSE-DECISION.md).

---

## Maintainer

- GitHub: [@AnkitParekh007](https://github.com/AnkitParekh007)
- Product site: https://ankitparekh007.github.io/job-search-assitant/

Support channels: [SUPPORT.md](./SUPPORT.md)
