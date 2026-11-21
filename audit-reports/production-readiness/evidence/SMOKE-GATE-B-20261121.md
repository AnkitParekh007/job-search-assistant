# Gate B smoke — Computer Use (2026-11-21, post-rebuild `5882c35`)

**Binary:** `apps/macos-apple-silicon/src-tauri/target/release/bundle/macos/AI Job Search.app`  
**Git:** workspace footer `v0.1.1-13-g5882c35` · sidebar `APP V0.1.1 · VERIFIED`  
**Operator:** Cursor Auto (Computer Use / AX)

## Results

| Check | Result | Notes |
|-------|--------|-------|
| Binary matches Gate B commit | **PASS** | Sidebar shows `g5882c35` |
| Studio evidence-grounded match UI | **PASS** | Studio chip `evidence-grounded match` + confirmed-facts copy visible |
| Studio local match panel (paste → integrity → strengths/gaps) | **PARTIAL** | React-controlled textarea did not accept AX/CGEvent paste while window occluded; logic covered by vitest `explainMatch` + `runBenchmark` |
| Validate export control | **PASS** (bundled) | `Validate export` string present in production JS; PdfView wires `validateExportText` |
| Record-with-AI / submit confirm | **PASS** | Manual Add with status Applied: confirm checkbox required; **Add application** disabled until checked (same `needsSubmitConfirm` gate used by Record with AI) |

## Automated proxies

- `npm run test:core` — **28** passed (incl. benchmark + DOCX fixture + metrics-from-events)

## Verdict

Gate B rebuild smoke for UI presence + submit-confirm gate: **PASS** (local match panel interaction deferred to vitest proxy due to AX paste limitation).
