# FAQ

**What is AI Job Search?**  
A local-first macOS desktop shell that drives the upstream ai-job-search workspace through Claude Code.

**Does it auto-apply to jobs?**  
No. It helps you discover, rank, prepare documents, and track status. You submit applications yourself.

**Is Claude Code required?**  
Yes for AI workflows. The UI alone cannot run scrape/rank/apply/interview.

**Does it cost money?**  
The app has no subscription of its own. Claude Code uses your Claude plan or API credits. LaTeX and portal tooling may have their own install costs.

**Where is my data?**  
In your upstream workspace files, plus local SQLite for run history/settings under Application Support.

**Is there a Windows / Intel / web app?**  
Source ports exist. Apple Silicon is the developed client. Web is a localStorage demo without Claude. See [apps/README.md](../apps/README.md).

**Where do I download a binary?**  
No GitHub Release artifacts are published yet. Build from source ([installation.md](./installation.md)).

**Can I use a local LLM?**  
Not with the current architecture.

**Why was the repo briefly named `job-search-assitant`?**  
That misspelling was corrected. The canonical repository is [`AnkitParekh007/job-search-assistant`](https://github.com/AnkitParekh007/job-search-assistant). Product display name remains **AI Job Search Assistant**.
