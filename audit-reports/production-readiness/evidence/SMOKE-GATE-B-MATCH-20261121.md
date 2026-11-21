# Gate B Studio local-match smoke — 2026-11-21

**Binary:** rebuilt Apple Silicon `.app` with **Load Nordlicht sample**  
**Workspace footer:** `v0.1.1-14-ga7aaa63` (+ uncommitted Load sample)  
**Operator:** Cursor Auto (Computer Use / AX)

## Steps

1. Studio → Paste posting → **Load Nordlicht sample**
2. **Run integrity check**

## Observed

| Check | Result |
|-------|--------|
| Sample loads into textarea | **PASS** |
| Integrity | **PASS** — `Posting looks clean.` |
| Requirements chips | **PASS** — Must TypeScript / React; Nice GraphQL / design systems |
| Local match panel | **PASS** — `LOCAL MATCH (CONFIRMED FACTS ONLY)`; coverage + gaps shown (`No confirmed fact covers: Strong TypeScript…` when profile lacks those confirmed skills) |

## Verdict

Studio paste → integrity → local match path: **PASS**.
