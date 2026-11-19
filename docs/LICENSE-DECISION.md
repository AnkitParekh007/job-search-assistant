# License decision (owner action)

## Facts

| Fact | Evidence |
|------|----------|
| Root repository had **no** `LICENSE` file at audit time | Directory listing / GitHub API `license: null` |
| Apple Silicon `Cargo.toml` declares `license = "MIT"` | `apps/macos-apple-silicon/src-tauri/Cargo.toml` |
| Upstream ai-job-search is reported as **MIT** on GitHub | API `license.spdx_id = MIT` |
| This repo drives upstream; it does not vendor upstream source | `UPSTREAM-AUDIT.md` |

## Candidate

A root **MIT** `LICENSE` was added to match the Cargo crate declaration and upstream ecosystem norms, with copyright line:

`Copyright (c) 2026 Ankit Parekh`

## What still needs the owner

1. Confirm the copyright holder name/year are correct.
2. Confirm MIT is the intended SPDX license for **all** first-party code in this repository (including marketing site and Windows/Intel clients).
3. After push, verify GitHub detects the license on the repository page.
4. Do **not** treat this file as legal advice.

If you prefer Apache-2.0 or another license, replace `LICENSE` before tagging a release and update Cargo.toml / README badges accordingly.
