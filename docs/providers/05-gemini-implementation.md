# Google Gemini Implementation

## Modes

| Mode | Status |
|------|--------|
| Gemini Developer API (BYOK) | Implemented |
| Gemini CLI headless (`-p`, no `--yolo`) | Implemented |
| Interactive CLI tool approvals | Partial — unsafe auto-approve intentionally rejected |

## Auth

- API key → OS keychain (same pattern as OpenAI API)
- CLI → user signs in via Terminal (`gemini`)
- Consumer Gemini subscription ≠ Developer API credits

## Workflows

Same structured-inference set as OpenAI API when using API mode.
CLI mode is experimental text assist without host-mediated tool approvals.
