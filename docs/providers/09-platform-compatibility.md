# Platform Compatibility

| Platform | Provider runtime | Build tested here | Notes |
|----------|------------------|-------------------|-------|
| macOS Apple Silicon | Full (Claude, Codex, OpenAI API, Gemini, Ollama) | `cargo test` + clippy + fmt | Primary host |
| macOS Intel | Providers module ported | Compile not executed on this runner | Sources synced from Apple Silicon |
| Windows | Providers module ported | Compile not executed on this runner | `today()` uses PowerShell; Keychain → Credential Manager via `keyring` |

## Build instructions

```bash
# Apple Silicon
cd apps/macos-apple-silicon && npm run tauri -- build

# Intel
cd apps/macos-intel && npm run build:intel

# Windows (on a Windows runner)
cd apps/windows && npm run tauri -- build
```
