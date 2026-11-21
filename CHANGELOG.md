# Changelog

All notable changes to this repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for the application package version (`0.1.1` in `package.json` / `tauri.conf.json`).

## [0.1.1] — 2026-11-20

### Fixed
- Tailwind v4 monorepo source scanning so the desktop UI styles correctly when packages load via Vite `@fs` paths.

### Changed
- Sidebar and desktop app icons use the market-site Ascend brand mark.

## [0.1.5] — 2026-11-21

### Security
- Assisted update downloads fail closed unless `SHA256SUMS.txt` is present and the digest matches
- Exact selected AI provider must be ready before any workflow starts (UI + Rust)
- Workspace `safe_join` blocks symlink escapes outside the selected folder

### Fixed
- Windows `deps.rs` syntax error that broke cargo parse/fmt
- Sidebar brand label uses **Job Search Assistant** (not “AI Job Search”)
- Keychain / privacy disclosures for OpenAI and Gemini BYOK keys

## [Unreleased]

### Added

- OpenAI Responses API provider with OS-keychain BYOK, streaming, and structured job-search schemas
- Google Gemini provider (CLI headless + Developer API BYOK)
- Ollama local provider (tags/chat streaming, SSRF-safe endpoints, memory warnings)
- Shared inference orchestration + provider docs under `docs/providers/`
- Settings → AI Providers configure / test / model refresh for API and Ollama engines
- Provider runtime ported to macOS Intel and Windows host trees

### Changed

- Multi-provider capability gating for inference engines (honest non-agentic scope)
- Codex status wording no longer treats `~/.codex` alone as Ready

### Added (earlier unreleased)

- Root documentation system under `docs/`
- Community health files (`CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `SUPPORT`)
- GitHub issue forms and pull request template
- CI workflow for macOS Apple Silicon frontend and Rust unit tests
- MIT `LICENSE`, `NOTICE`, and third-party attribution notes
- Repository audit and professionalization report

### Changed (earlier unreleased)

- Root README rewritten for product clarity and accurate platform status
- `apps/README.md` and marketing download messaging aligned with build-from-source reality

## [0.1.0] — 2026-11-19

Package version embedded in the desktop clients. Corresponds to early repository history including:

### Added

- macOS Apple Silicon Tauri 2 desktop client (`apps/macos-apple-silicon`)
- Marketing site under `market-site/` with GitHub Pages deploy workflow
- macOS Intel and Windows client trees (`a34bfca`)

No tagged GitHub Release accompanies this version yet.
