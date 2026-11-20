# Gate A smoke — Computer Use (2026-11-21)

**Operator:** Cursor Computer Use (app-scope AX) against built `.app`  
**PID / bundle:** `AI Job Search` · `dev.local.aijobsearch`  
**HOME:** `/Users/ankitparekh` (not sandbox)  
**Workspace:** absolute path under `evidence/smoke-workspace` (sidebar: Local workspace · `v0.1.1-6-g299c7ab`)  
**Artifact:** see `ARTIFACT-PATH.txt` (~6.2 MiB arm64 adhoc)

## Results vs GATE-A checklist

| # | Item | Result | Notes |
|---|------|--------|-------|
| 1 | Fresh launch → absolute workspace | **PASS** | App launched; absolute workspace connected; scaffold/`CLAUDE.md` present |
| 2 | Relative `INVALID` rejected; prior kept | **FAIL** | `set_workspace` in `apps/macos-apple-silicon/src-tauri/src/lib.rs` has **no** `is_absolute()` guard. UI Switch would call ensure_workspace on a relative name. AX could not type into occluded WebView fields to exercise UI toast. Do **not** mark verified until fixed + re-smoked. |
| 3 | Profile saves without AI | **PASS** | Profile reachable/saved earlier this session (offline) |
| 4 | Manual job + submission confirmation | **PASS (UI gate)** | Pipeline → Add manually shows company/role/date/status + checkbox *“I confirm I actually submitted…”*; **Add application** stays **disabled** until confirm. Full submit blocked by WebView AX (`set_value`/`type` did not stick). Screenshot: `smoke-screenshots/pipeline-add-manually-20261121.webp` |
| 5 | Original application date preserved | **PASS** | Nordlicht card still shows **2026-11-15** after session; Rust `status_update_round_trips_and_preserves_columns` ok |
| 6 | Find jobs blocked when provider signed out | **PARTIAL** | With Claude **Ready / signed in**, Find jobs is **enabled** (observed). Earlier in session signed-out state showed gate. Accidental press while signed-in started scrape (~$0.13) — Deny/End. Re-check after signing Claude out. |
| 7 | Add portal does not finish onboarding | **PASS** | Exercised earlier this session |
| 8 | Studio integrity — no Python traceback | **PASS (CLI proxy)** | `posting_guard.py --text --in … --json` → `{"ok": true, …}`. Studio UI “Run integrity check” stayed disabled because paste into textarea failed under AX. |
| 9 | Scout opens without provider calls | **PASS** | Copy: “Local help — answers from product rules, not an AI provider”; “Deterministic help · no provider calls”. Screenshot: `smoke-screenshots/scout-20261121.webp` |

## Honesty UI (observed)

- Sidebar: `APP V0.1.1 · DEVELOPED` + Gate A packaging smoke note  
- Settings → About: readiness **developed**, auto-update **disabled**, signing **N/A for internal beta**  
- Screenshot: `smoke-screenshots/settings-developed-20261121.webp`

## Limits of this smoke

- Window often **occluded**; Companion refused raise. Coordinate clicks + WebView React controlled inputs frequently left AXValue empty → incomplete form fills (Studio paste, Settings path, Add manually submit).
- HTML5 Pipeline drag → Move dialog not completed.
- This log is **agent evidence**, not Ankit signature. Gate stays **developed** until checklist signed.

## Blocking for verified

1. Implement absolute-path rejection in `set_workspace` / `ensure_workspace` (and UI), then re-smoke relative `INVALID`.  
2. Ankit: bring `.app` to front, complete Add-manually submit + optional signed-out Find jobs gate, then sign GATE-A-PACKAGING.md.
