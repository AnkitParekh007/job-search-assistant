# GitHub metadata commands

Public API at audit time showed empty `description`, `homepage`, and `topics`.  
Local `gh` auth was **invalid** during professionalization — run these after `gh auth login` / `gh auth refresh`.

## Description + homepage

```bash
gh repo edit AnkitParekh007/job-search-assistant \
  --description "Job Search Assistant — local-first desktop app for macOS Apple Silicon. Discover roles, prepare applications, and track them on your own files. Ad-hoc signed, not notarized. You submit applications yourself." \
  --homepage "https://job-search-assistant.rebound-ops.org/"
```

## Topics (≤ 20)

```bash
gh repo edit AnkitParekh007/job-search-assistant --add-topic ai-job-search
gh repo edit AnkitParekh007/job-search-assistant --add-topic job-search
gh repo edit AnkitParekh007/job-search-assistant --add-topic job-tracker
gh repo edit AnkitParekh007/job-search-assistant --add-topic career-tools
gh repo edit AnkitParekh007/job-search-assistant --add-topic macos
gh repo edit AnkitParekh007/job-search-assistant --add-topic macos-app
gh repo edit AnkitParekh007/job-search-assistant --add-topic desktop-app
gh repo edit AnkitParekh007/job-search-assistant --add-topic tauri
gh repo edit AnkitParekh007/job-search-assistant --add-topic rust
gh repo edit AnkitParekh007/job-search-assistant --add-topic react
gh repo edit AnkitParekh007/job-search-assistant --add-topic typescript
gh repo edit AnkitParekh007/job-search-assistant --add-topic claude-code
gh repo edit AnkitParekh007/job-search-assistant --add-topic local-first
gh repo edit AnkitParekh007/job-search-assistant --add-topic ai-assistant
gh repo edit AnkitParekh007/job-search-assistant --add-topic resume-builder
gh repo edit AnkitParekh007/job-search-assistant --add-topic application-tracker
gh repo edit AnkitParekh007/job-search-assistant --add-topic open-source
gh repo edit AnkitParekh007/job-search-assistant --add-topic sqlite
```

Avoid misleading topics (`ollama`, `windows-app`, `fully-autonomous`) until verified.

## Social preview

1. Upload `docs/assets/social/github-social-preview.png` (1280×640) in  
   **Settings → General → Social preview**.
2. Spec also in `docs/assets/social/README.md`.

## Private vulnerability reporting

**Settings → Code security and analysis → Private vulnerability reporting → Enable**

## Discussions

See [discussions-setup.md](./discussions-setup.md).

## Labels

```bash
./scripts/apply-github-labels.sh
```
