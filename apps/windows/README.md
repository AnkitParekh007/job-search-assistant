# Job Search Assistant — Windows

Local-first **Windows** desktop app. Same multi-provider workspace model as the macOS clients (Claude Code / Codex when ported).

## Requirements

| Need | Why |
|---|---|
| Windows 10/11 | WebView2 host |
| AI provider CLI (Claude Code and/or Codex) | multi-provider AI workflows |
| Python ≥ 3.10 | upstream tools |
| MiKTeX or TeX Live (optional) | CV / cover-letter PDFs |
| Rust + MSVC toolchain | `npm run tauri build` |

## Develop

```bash
cd apps/windows
npm install
npm test
cd src-tauri && cargo test
npm run tauri dev
```

## Build

```bash
cd apps/windows
npm install
npm run tauri build
```

Installers land under `src-tauri/target/release/bundle/` (`nsis` / `msi`).

## Notes

- Window chrome uses standard Windows decorations (no macOS overlay titlebar).
- PATH discovery covers common Claude, Python, Git, and TeX install locations.
- App data: `%AppData%\dev.local.aijobsearch.windows`
