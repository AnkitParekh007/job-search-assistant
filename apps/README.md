# Apps

Native and web clients for **AI Job Search**.

| App | Path | Target | Status |
|-----|------|--------|--------|
| macOS Apple Silicon | [`macos-apple-silicon/`](./macos-apple-silicon/) | arm64 (`M1`–`M4`) | **Developed client** — primary supported desktop app |
| macOS Intel | [`macos-intel/`](./macos-intel/) | x86_64 | **Source-complete port** with Intel build target; no published release artifact |
| Windows | [`windows/`](./windows/) | Windows desktop | **Source-complete port** (NSIS/MSI targets configured); no published release artifact |
| Web | [`web/`](./web/) | Browser (React) | **UI demo** with `localStorage` sample data — no AI provider bridge |

Marketing and docs: [`../market-site/`](../market-site/) · Markdown docs: [`../docs/`](../docs/).

> “Complete” in older copy meant “source tree present,” not “production release verified.” Prefer the statuses above.
