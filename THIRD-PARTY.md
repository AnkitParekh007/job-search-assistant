# Third-party attribution

## Historical inspiration

Early product design was informed by the open-source job-search automation community. Jobzuu is an **independent** desktop product: it does not require cloning or linking to third-party org repositories at runtime. Your workspace is any local folder Jobzuu scaffolds or you already own.

## Major runtime / build dependencies (non-exhaustive)

Install manifests are authoritative:

- `apps/macos-apple-silicon/package.json` — React 19, Vite, Tauri JS APIs, Vitest, Tailwind, etc.
- `apps/macos-apple-silicon/src-tauri/Cargo.toml` — Tauri 2, rusqlite, serde, notify, uuid, csv, dirs

Generate full license inventories locally when preparing a distribution:

```bash
# Example (Node)
cd apps/macos-apple-silicon && npx license-checker --production --summary

# Example (Rust)
cd apps/macos-apple-silicon/src-tauri && cargo tree
```

## Fonts on the marketing site

`market-site` loads **Satoshi** from Fontshare (`api.fontshare.com`). Review Fontshare terms for your deployment.
