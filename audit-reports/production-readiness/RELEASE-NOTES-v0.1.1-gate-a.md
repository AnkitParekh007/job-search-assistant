# Release notes — v0.1.1 (Gate A job-tracking beta candidate)

**Readiness label: developed** (not verified until [GATE-A-PACKAGING.md](./GATE-A-PACKAGING.md) smoke is signed).

## What this build is for

Local-first job tracking on **macOS Apple Silicon**:

- Connect an absolute workspace folder; relative paths are rejected
- Edit profile offline; import/paste resume and confirm facts (experimental parse)
- Add jobs and applications manually; confirm real submissions before “applied”
- Pipeline status without rewriting the original application date
- Optional AI when a provider is installed **and** signed in **and** supports the workflow

## What this build is not

- Not a verified public installer (unsigned internal / developer channel)
- No auto-update channel
- No claim of universal ATS pass rates, guaranteed interviews, or named-employer ATS compatibility
- ATS match/parse UI is **experimental** until Gate B

## Platforms

| Platform | Status |
|----------|--------|
| macOS Apple Silicon | Primary — Gate A candidate |
| macOS Intel / Windows | Source mirrored; not Gate A verified |

## Provider honesty

Installed ≠ authenticated ≠ workflow-capable. Find jobs / Rank / Evaluate stay blocked until readiness probes pass.
