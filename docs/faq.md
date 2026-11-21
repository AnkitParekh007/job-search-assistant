# FAQ

**What is Job Search Assistant?**  
A local-first macOS desktop shell (Jobzuu) for your own workspace folder, with **multi-provider AI support** (Claude Code, OpenAI Codex, and more).

**Does it auto-apply to jobs?**  
No. It helps you discover, rank, prepare documents, and track status. You submit applications yourself.

**Is Claude Code required?**  
Not exclusively. Providers: Claude Code, OpenAI Codex, OpenAI Platform API, Gemini, and Ollama. Capability varies by workflow (agentic vs structured inference). Offline tracking works with no provider. Gmail / Notion sync still require Claude Code connectors. See the [capability matrix](./providers/01-provider-capability-matrix.md).

**Does it cost money?**  
The app has no subscription of its own. Cloud providers bill against your plan or API credits (the app asks before starting billable OpenAI/Gemini runs). Ollama stays local by default. LaTeX and portal tooling may have their own install costs.

**Where is my data?**  
In the local workspace folder you chose, plus SQLite for run history/settings under Application Support.

**Is there a Windows / Intel app?**  
Source trees exist under `apps/macos-intel` and `apps/windows`. Only **Apple Silicon** has a published ZIP (`v0.1.4`, ad-hoc signed, not notarized). Intel and Windows are build-from-source until native installers are smoke-verified. See [apps/README.md](../apps/README.md).

**Where do I download a binary?**  
Apple Silicon only: [GitHub Release `v0.1.4`](https://github.com/AnkitParekh007/job-search-assistant/releases/tag/v0.1.4). Assisted updates (check + download zip; manual replace) are in Settings. Notarized installers are not published — see [installation.md](./installation.md).

**Can I use a local LLM?**  
Yes — Ollama is supported for structured inference workflows when the local service is running. It cannot scrape portals or run full agentic automation.

**Why was the repo briefly named `job-search-assitant`?**  
That misspelling was corrected. The canonical repository is [`AnkitParekh007/job-search-assistant`](https://github.com/AnkitParekh007/job-search-assistant). Product display name is **Job Search Assistant**.
