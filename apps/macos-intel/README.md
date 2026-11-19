# AI Job Search — macOS (Intel)

Desktop app build for **Intel** Macs (`x86_64`).

## Status

Scaffold ready. Product implementation will live in this folder (Tauri / native shell driving the `ai-job-search` workspace via Claude Code).

## Planned layout

```text
macos-intel/
  src/           # frontend UI
  src-tauri/     # Rust host (x86_64 target)
  package.json
  README.md
```

## Release target

- Bundle: `AI Job Search.app` (Intel / universal optional later)
- Distribution: GitHub Releases asset tagged for Intel Mac
