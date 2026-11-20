# FAQ

**What is AI Job Search?**  
A local-first macOS desktop shell (Jobzuu) for your own workspace folder, with **multi-provider AI support** (Claude Code, OpenAI Codex, and more).

**Does it auto-apply to jobs?**  
No. It helps you discover, rank, prepare documents, and track status. You submit applications yourself.

**Is Claude Code required?**  
Not exclusively. The app has multi-provider AI support: Claude Code and/or OpenAI Codex. You need at least one signed-in provider for AI workflows. Gmail / Notion sync still require Claude Code connectors.

**Does it cost money?**  
The app has no subscription of its own. Claude Code and Codex use your respective plan or API credits. LaTeX and portal tooling may have their own install costs.

**Where is my data?**  
In the local workspace folder you chose, plus SQLite for run history/settings under Application Support.

**Is there a Windows / Intel app?**  
Source ports exist under `apps/macos-intel` and `apps/windows`. Apple Silicon is the developed client. See [apps/README.md](../apps/README.md).

**Where do I download a binary?**  
Platform packages are on [GitHub Releases](https://github.com/AnkitParekh007/job-search-assistant/releases) and the [download page](https://job-search-assistant.rebound-ops.org/download). Notarized installers are not published yet — see [installation.md](./installation.md).

**Can I use a local LLM?**  
Not with the current architecture (Ollama is on the roadmap as a planned option).

**Why was the repo briefly named `job-search-assitant`?**  
That misspelling was corrected. The canonical repository is [`AnkitParekh007/job-search-assistant`](https://github.com/AnkitParekh007/job-search-assistant). Product display name remains **AI Job Search Assistant**.
