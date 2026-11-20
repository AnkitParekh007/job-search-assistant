<p align="center">
  <img src="./docs/assets/brand/scout-hero.svg" width="100%" alt="AI Job Search Assistant conceptual hero: Jobzuu and a dark desktop workspace showing discovery, application preparation and tracking." />
</p>

<h1 align="center">AI Job Search Assistant</h1>

<p align="center">
  <strong>Less tab chaos. More career momentum.</strong><br />
  A local-first command center for discovering jobs, preparing honest applications, and tracking your search — with human approvals at every important step.
</p>

<p align="center">
  <a href="./docs/installation.md"><strong>Build from source</strong></a> ·
  <a href="https://job-search-assistant.rebound-ops.org/"><strong>Explore the website</strong></a> ·
  <a href="./docs/getting-started.md"><strong>Get started</strong></a> ·
  <a href="https://github.com/AnkitParekh007/job-search-assistant/discussions"><strong>Join the discussion</strong></a>
</p>

<p align="center">
  <a href="./LICENSE"><img alt="MIT licensed" src="https://img.shields.io/badge/license-MIT-AD9CFF?style=flat-square" /></a>
  <a href="./apps/macos-apple-silicon/"><img alt="macOS Apple Silicon" src="https://img.shields.io/badge/platform-macOS%20arm64-17233A?style=flat-square&logo=apple&logoColor=white" /></a>
  <a href="https://github.com/AnkitParekh007/job-search-assistant/actions/workflows/ci.yml"><img alt="CI status" src="https://github.com/AnkitParekh007/job-search-assistant/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/AnkitParekh007/job-search-assistant/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/AnkitParekh007/job-search-assistant?style=flat-square&color=6B78D5" /></a>
</p>

---

## One workspace. Three big steps.

<p align="center">
  <img src="./docs/assets/brand/feature-triptych.svg" width="100%" alt="Concept illustrations: discover opportunities, prepare reviewed resumes and cover letters, and track applications in one pipeline." />
</p>

Discover aligned roles, prepare tailored documents through the upstream workflows, then review and track the results from the desktop UI. **You approve actions and submit applications yourself** — the app does not auto-submit or send emails.

**The pictures above are original concept illustrations, not screenshots.** Real screenshots will be added after capturing a sanitized running desktop build. [Help with screenshots](./docs/assets/screenshots/README.md) · [Explore features](./docs/features.md).

---

## What's inside the desktop app

| **A visible agent workspace** | **A safer application workflow** |
|:---|:---|
| See job discovery, fit ranking, workflow progress, tool activity and the application pipeline in one place. | Review generated CVs and cover letters, inspect PDF output, and approve sensitive file or command actions before proceeding. |
| **Files remain yours** | **Designed for extensions** |
| Your candidate profile, tracker and application archives remain in a local workspace folder you choose. | **Multi-provider AI** — Claude Code, Codex, OpenAI API, Gemini, and Ollama (capability varies; installed ≠ signed in ≠ workflow-capable). Track applications offline without AI. |

**Need the technical view?** [Architecture](./docs/architecture.md) · [Provider capability matrix](./docs/providers/01-provider-capability-matrix.md) · [Workflow support](./docs/supported-workflows.md) · [Multi-provider status](./docs/MULTI-PROVIDER-IMPLEMENTATION.md)

---

## Why I built it

The upstream framework is powerful: local files, AI-assisted workflows, and a serious job-search pipeline. I wanted that same rigor with a more approachable **visual** experience — one place to see discovery, ranking, Application Studio, the pipeline, and agent activity, with human approval before sensitive tools run and multi-provider AI support.

AI Job Search Assistant is that desktop shell. Jobzuu (the onboarding AI agent) walks you through connecting a workspace; the rest stays local-first and under your control.

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
  Host -->|multi-provider runtime| Provider[Claude Code or Codex]
  Host -->|read / atomic write| WS[ai-job-search workspace files]
  Provider -->|cwd = workspace| WS
  Provider -->|your provider account| API[Anthropic / OpenAI]
```

- **Upstream workspace files** own jobs, applications, profile, CVs, and the tracker CSV.
- **SQLite** stores run history and app preferences only.
- **Multi-provider AI:** Claude Code, Codex, OpenAI API, Gemini, and Ollama — support differs by workflow (see [`providers.ts`](./packages/core/src/providers.ts)). You can still track applications and confirm profile facts offline with no provider. See the [capability matrix](./docs/providers/01-provider-capability-matrix.md).

Deep dive: [Architecture](./docs/architecture.md) · [App architecture](./apps/macos-apple-silicon/docs/ARCHITECTURE.md)

</details>

---

## What makes it different

- **Human approvals** for write/exec tools; live agent timeline and cost metadata  
- **Desktop experience** — Jobs, Ranking, Studio, Pipeline, Documents in one shell  
- **Local ownership** — tracker, archives, and profile remain files on disk you own  
- **Honest boundaries** — no auto-submit, no silent email; provider usage depends on your configured account  

---

## Quick start (build from source)

Primary conversion path until a verified installer ships: **build the macOS Apple Silicon app from source**.

### Prerequisites

| Requirement | Why |
|-------------|-----|
| Apple Silicon Mac, macOS 13+ | Native arm64 Tauri target |
| AI provider CLI (Claude Code and/or OpenAI Codex), signed in | Multi-provider AI support for workflows (uses your plan or API credits) |
| Python ≥ 3.10 | Upstream tools (`brew install python@3.12` recommended) |
| Local workspace folder | Any folder; Jobzuu scaffolds starter files on connect |
| Node.js 20+ + npm | Frontend toolchain |
| Rust (stable) + Xcode CLT | Tauri native build |

Optional: BasicTeX + LuaLaTeX/XeLaTeX (PDF compile), poppler/`pdftotext` (ATS text check).

### Commands

```bash
# 1) This repository
git clone https://github.com/AnkitParekh007/job-search-assistant.git
cd job-search-assistant/apps/macos-apple-silicon

# 2) Install & verify
npm install
npm test
(cd src-tauri && cargo test)

# 3) Development
npm run tauri dev

# 4) Release .app (unsigned personal build)
npm run tauri build
open "src-tauri/target/release/bundle/macos/AI Job Search.app"
```

On first launch, choose any workspace folder (empty is fine — Jobzuu scaffolds starter files). Change it later in Settings.

**Gatekeeper:** unsigned builds may need **right-click → Open** the first time. Do not disable system security broadly.

Full guide: [Installation](./docs/installation.md) · First-run walkthrough: [Getting started](./docs/getting-started.md)

### First five minutes

1. Launch (`tauri dev` or the built `.app`).  
2. Choose a **workspace folder** (any local path).  
3. Open **Settings → Dependencies** and fix anything red.  
4. Run **Profile setup** (`/setup`) or confirm an existing profile.  
5. **Discover** → **Rank** → open **Application Studio** → move cards on the **Pipeline**.

---

## Features and platform support

Capabilities are **Native** (UI / SQLite / local tools), **Upstream** (provider-run workflows), **External** (connectors), or **Planned**.

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

See [`apps/README.md`](./apps/README.md).

---

## Privacy, costs, and limitations

> **Do not push populated job-search workspaces, resumes, application records, or personal profile data to public Git repositories.** Keep real search data local (or in private remotes you control). Public forks of upstream or this repo should stay free of your private job-hunt files.

### Privacy and security

- No app telemetry or remote product backend.
- Credentials stay in your provider CLI / connectors — not stored by this app.
- App data directory uses restrictive permissions; DB is mode `0600` on macOS.
- Write/exec tools require human approval; posting-integrity checks stay in the loop.
- Profile and posting content sent through your selected provider go to that provider under **your** account.

More: [Privacy & security](./docs/privacy-and-security.md)

### AI provider requirements and costs

| Item | Detail |
|------|--------|
| Providers | Claude Code, Codex, OpenAI API, Gemini, Ollama — capability varies by workflow ([matrix](./docs/providers/01-provider-capability-matrix.md); runtime: [`providers.ts`](./packages/core/src/providers.ts)) |
| Ready means | **Installed ≠ signed in ≠ workflow-capable.** Sign in (or configure keys/local service) before Find jobs / Rank / Evaluate look ready |
| Cost | Cloud providers bill your plan/API; Ollama is local unless you point at a remote endpoint |
| Offline | Profile, manual jobs, applications, and follow-up tracking work with **no** AI provider |
| Disclosure | AI workflows consume the selected provider's usage allowances or credits; review its billing and limits |

### Release honesty (Gate A)

- macOS Apple Silicon builds are labeled **developed** until Gate A packaging smoke is signed ([checklist](./audit-reports/production-readiness/GATE-A-PACKAGING.md)).
- Auto-update is **disabled**. Notarized installers are **not** claimed for the internal beta channel.
- Local resume parse / match helpers are **experimental** — we do **not** claim universal ATS pass rates, guaranteed interviews, or named-employer ATS compatibility.

### Key limitations

- Primary support target is **macOS Apple Silicon**.
- GitHub Release `v0.1.1` ships platform client packages; notarized installers are not published yet.
- Does **not** auto-submit applications or send follow-up email.
- Gmail / Notion features need external connectors.

---

## Community and roadmap

Help wanted in concrete areas:

- **Tauri / Rust** host and packaging  
- **Accessibility** and UI polish  
- **Provider integrations** (additional engines beyond Claude Code / Codex)  
- **Testing**, docs, and sanitized screenshots  

Starter ideas: [contributor backlog](./docs/contributor-backlog.md) · [CONTRIBUTING.md](./CONTRIBUTING.md)

- Bugs → [GitHub Issues](https://github.com/AnkitParekh007/job-search-assistant/issues) (use the bug form)  
- Features → Feature request form  
- Security → [SECURITY.md](./SECURITY.md) (do not file public issues for vulnerabilities)  
- Discussions → [Join the community conversation](https://github.com/AnkitParekh007/job-search-assistant/discussions)

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
Not for offline tracking and profile work. AI workflows need a configured provider (Claude Code, Codex, OpenAI API, Gemini, or Ollama — capability varies; see the [provider matrix](./docs/providers/01-provider-capability-matrix.md)). Some connector workflows (Gmail / Notion) still require Claude Code. Provider usage is not free by default.

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
```

</details>

### License and acknowledgements

AI Job Search Assistant is released under the [MIT License](./LICENSE).

Jobzuu / AI Job Search Assistant is an **independent** local-first desktop product. Your workspace is any folder you choose; the app does not require a third-party org checkout. See [NOTICE](./NOTICE), [THIRD-PARTY.md](./THIRD-PARTY.md), and [docs/LICENSE-DECISION.md](./docs/LICENSE-DECISION.md).

### Maintainer

- GitHub: [@AnkitParekh007](https://github.com/AnkitParekh007)
- Product site: https://job-search-assistant.rebound-ops.org/

Support channels: [SUPPORT.md](./SUPPORT.md)
