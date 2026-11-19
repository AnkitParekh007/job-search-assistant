# Implementation Plan

## Stage A — Foundation

1. Secure credential abstraction (`security/credentials.rs` via OS keychain)
2. Expand shared TS + Rust capability contracts
3. Shared inference run lifecycle (`providers/inference.rs`)
4. Normalized events already in `types::kind` — extend usage/streaming

## Stage B — Codex

1. Keep existing `codex.rs`; harden status (do not treat `~/.codex` alone as authenticated)
2. Mock-test protocol helpers; mark live smoke blocked without CLI

## Stage C — OpenAI API

1. BYOK set/clear/test via Keychain
2. Responses API streaming + structured JSON for job-search schemas
3. Wire into Runtime; capability-gated workflows

## Stage D — Gemini

1. CLI detection + headless structured runs (safe; no auto-approve)
2. Gemini Developer API (BYOK) for inference parity with OpenAI API path
3. Distinguish modes in Settings

## Stage E — Ollama

1. Local endpoint detection (default `127.0.0.1:11434`)
2. Model list / chat / streaming; SSRF guards for remote URLs
3. Memory warnings; no auto-download; no cloud fallback

## Stage F — Product

1. Settings cards: configure key, test, models, clear
2. Workflow launcher honesty for inference-only providers
3. Port providers module to Intel + Windows hosts

## Stage G — Closure

1. Tests (unit + mock streams)
2. Docs + final report
3. PR
