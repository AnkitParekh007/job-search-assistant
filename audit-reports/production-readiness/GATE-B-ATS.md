# Gate B — ATS claims checklist

Use this before marketing parse quality, match explainability, or export validation as product capabilities. Gate A must remain **verified**.

## Labels

| Allowed | Meaning |
|---------|---------|
| Evidence-grounded local match / export validation | Backed by ATS-01..06 + benchmark evidence |
| Experimental AI tailor | Still capability-gated; not a pass-rate claim |

## Forbidden without independent evidence

- Universal ATS pass rate
- Guaranteed interviews
- Named-employer ATS compatibility

## ATS-01 .. ATS-06

- [x] **ATS-01** Local text parse + diagnostics; PDF/DOCX via `extract_resume_text` → Profile Import; fixtures in `packages/core/src/ats/fixtures.ts`; vitest green
- [x] **ATS-02** Provenance + confirm/reject + **editable** values; unconfirmed excluded from `explainMatch` / `validateExportText`
- [x] **ATS-03** Requirement extract must/nice + spans; Studio paste-mode chips with span titles; Nordlicht fixture test
- [x] **ATS-04** `explainMatch` wired in Studio (local match panel); refuses without confirmed facts; adversarial “absent facts” vitest
- [x] **ATS-05** `validateExportText` wired as **Validate export** on Documents/Studio `PdfView`; user-visible block/warn
- [x] **ATS-06** Submit-confirm on Quick update **and** Record with AI; `user_confirmed_submitted`; interview also appends `recruiter_screen_scheduled`

## Phase 3 / 5 / 6

- [x] Phase 3 core path: match + export validation shipped in UI (AI tailor still review-gated)
- [x] Phase 5: `runBenchmark().ok` reproducible; [`packages/core/src/ats/PRIVACY.md`](../../packages/core/src/ats/PRIVACY.md); evidence [`evidence/GATE-B-BENCHMARK-20261121.json`](./evidence/GATE-B-BENCHMARK-20261121.json)
- [x] P6-03 copy review: README / Settings / Studio / Profile avoid forbidden claims (re-check before public marketing push)
- [x] Gate A still verified ([GATE-A-PACKAGING.md](./GATE-A-PACKAGING.md))

## Remaining (non-blocking for evidence-backed local ATS; required before heavy marketing)

- [ ] Binary PDF/DOCX fixture automation when poppler available
- [ ] Pipeline drawer timeline reading `events.jsonl`
- [ ] Funnel metrics derived from events (not only CSV status)
- [ ] Market site BenchmarksPage publish aggregate from evidence pack (still “not a pass rate”)

## Honesty

- [x] In-app: local match/export labeled evidence-grounded; AI path separate
- [x] Benchmark is synthetic regression only

**Signer:** Cursor Auto (Gate B implementation pass) **Date:** 2026-11-21

---

## Notes

- Signing this checklist authorizes **evidence-backed local ATS helpers**, not universal pass-rate marketing.
- Re-run `npm run test:core` and refresh the evidence JSON hash after corpus changes.
