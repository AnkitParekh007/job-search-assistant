# ATS benchmark privacy

Gate B regression corpus rules for `runBenchmark()` and fixtures in this package.

## Default: synthetic only

- The committed Alex / Nordlicht corpus in `fixtures.ts` / `benchmark.ts` is **fully synthetic**.
- No real resumes, employer PII, or production tracker rows belong in CI.
- Do not commit candidate PDFs, DOCX, or workspace CSVs under `packages/core/src/ats/`.

## Optional consented corpora

If a future benchmark uses real (anonymized) resumes:

1. Written consent recorded outside the public tree (or an explicit consent statement in the evidence pack).
2. Corpus lives in a private artifact store — **not** this repo by default.
3. Evidence pack under `audit-reports/production-readiness/evidence/` may include hashes and aggregate metrics only.
4. Market copy must not present private corpus results as a universal ATS pass rate.

## What we publish

- `runBenchmark().ok === true` is a **private regression gate** (name extracted, ≥1 must-have, match does not refuse with confirmed facts, skills recall ≥ 0.75, export validation ok).
- It is **not** marketed as an industry ATS pass rate, guaranteed interviews, or named-employer ATS compatibility.
