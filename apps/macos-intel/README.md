# AI Job Search — macOS (Intel)

Local-first **Intel** (`x86_64`) desktop app for macOS. Same product as the Apple Silicon client, built for Intel Macs.

## Requirements

Same as Apple Silicon, plus an Intel Mac (or Rosetta cross-compile host).

| Need | Install |
|---|---|
| AI provider CLI (Claude Code and/or Codex) | Multi-provider AI support |
| Python ≥ 3.10 | `brew install python@3.12` |
| BasicTeX | see upstream `SETUP.md` |
| Rust `x86_64-apple-darwin` target | `rustup target add x86_64-apple-darwin` |

## Develop

```bash
cd apps/macos-intel
npm install
npm test
(cd src-tauri && cargo test)
npm run tauri dev
```

On Apple Silicon hosts, prefer building the Intel release target explicitly:

```bash
npm run build:intel
```

## Build (Intel)

```bash
cd apps/macos-intel
npm install
rustup target add x86_64-apple-darwin
npm run build:intel
```

Artifact: `src-tauri/target/x86_64-apple-darwin/release/bundle/macos/AI Job Search.app`
