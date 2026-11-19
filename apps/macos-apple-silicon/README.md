# AI Job Search — macOS (Apple Silicon)

Desktop app build for **Apple Silicon** Macs (`arm64`: M1, M2, M3, M4).

## Status

Scaffold ready. Product implementation will live in this folder (Tauri / native shell driving the `ai-job-search` workspace via Claude Code).

## Planned layout

```text
macos-apple-silicon/
  src/           # frontend UI
  src-tauri/     # Rust host (arm64 target)
  package.json
  README.md
```

## Release target

- Bundle: `AI Job Search.app` (arm64)
- Distribution: GitHub Releases asset tagged for Apple Silicon
