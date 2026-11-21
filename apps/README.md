# Apps

Native desktop clients for **Job Search Assistant**.

| Client | Path | Host | Status |
|--------|------|------|--------|
| macOS Apple Silicon | [`macos-apple-silicon/`](./macos-apple-silicon/) | Tauri 2 | **Developed client** — primary supported desktop app |
| macOS Intel | [`macos-intel/`](./macos-intel/) | Tauri 2 | Source port — build from this tree |
| Windows | [`windows/`](./windows/) | Tauri 2 | Source port — build from this tree |

Shared UI and domain logic live in [`packages/ui`](../packages/ui/) and [`packages/core`](../packages/core/). Each app supplies a thin `@ai-job-search/runtime` bridge (Tauri `invoke` + events).
