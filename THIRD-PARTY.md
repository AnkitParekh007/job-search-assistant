# Third-party attribution

## Upstream engine (required at runtime)

| Project | URL | License (GitHub metadata) | Relationship |
|---------|-----|---------------------------|--------------|
| ai-job-search | https://github.com/ai-job-search-dev/ai-job-search | MIT | Separate checkout driven by this app; not vendored here |
| community-portals (optional) | https://github.com/ai-job-search-dev/community-portals | See upstream repo | Optional portal skills |

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
