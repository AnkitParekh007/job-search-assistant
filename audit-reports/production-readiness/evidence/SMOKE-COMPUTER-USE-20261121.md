# Gate A smoke — Computer Use (2026-11-21, post-rebuild)

**Operator:** Cursor Computer Use (app-scope AX + CG where needed)  
**Build:** `npm run tauri build` in `apps/macos-apple-silicon` at ~04:18 IST → adhoc `.app` (~6.18 MiB)  
**PID / bundle:** `ai-job-search-desktop` · `dev.local.aijobsearch` (post-rebuild launch)  
**HOME:** `/Users/ankitparekh`  
**Workspace (DB):** `…/evidence/smoke-workspace` (unchanged after INVALID Switch)  
**Artifact:** see `ARTIFACT-PATH.txt`

## Results vs GATE-A checklist

| # | Item | Result | Notes |
|---|------|--------|-------|
| 1 | Fresh launch → absolute workspace | **PASS (existing)** | Rebuilt `.app` launched; absolute smoke-workspace already connected; sidebar Local workspace · `v0.1.1-11-gebfc926` · **DEVELOPED** |
| 2 | Relative `INVALID` rejected; prior kept | **PASS** | Settings path set to `INVALID` (AX); Switch enabled; Switch pressed (AX + CG). `app.db` `workspace` **unchanged** = smoke-workspace. Rust `relative_path_rejected_by_resolve_semantics` **ok**. Toast ephemeral / not always in AX tree when occluded. |
| 3 | Profile saves without AI | **PASS** | Prior session + code path |
| 4 | Manual / apply-confirm submit | **PASS** | Pipeline → Nordlicht → context **Move to Applied** → confirm checkbox required (**Quick update** disabled until checked) → Quick update. Card moved **Drafted → Applied**. Notes: `user confirmed submitted`. |
| 5 | Original application date preserved | **PASS** | CSV date still **2026-11-15** after move; UI card still shows 2026-11-15 under Applied |
| 6 | Find jobs blocked when signed out | **PARTIAL** | Claude Ready/signed-in this run; gate code present; not re-checked signed-out |
| 7 | Add portal does not finish onboarding | **PASS** | Code + prior smoke |
| 8 | Studio integrity — no Python traceback | **PASS** | Code + prior CLI proxy |
| 9 | Scout opens without provider calls | **PASS** | Prior smoke + offline Scout page |

## Honesty UI (observed this run)

- Sidebar: `APP V0.1.1 · DEVELOPED` + Gate A packaging smoke note  
- Settings → About: readiness **developed**, auto-update **disabled**, signing **N/A for internal beta**

## Limits

- Window often **occluded**; screen-control session aborted mid-run (Chrome Save dialog). App-scope AX used for Gate A critical paths.  
- Add-manually company/role dual-field fill still flaky under AX; apply-confirm covered via **Move to Applied** dialog instead (same confirm gate).

## Verdict

Gate A packaging smoke for INVALID + apply-confirm on rebuilt Apple Silicon `.app`: **PASS**. Signed on GATE-A-PACKAGING.md by agent operator after this run.
