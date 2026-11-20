# Ask Scout — offline in-app help

Ask Scout is a deterministic, in-app guide mounted in the shared React desktop shell.

## Scope

- Accessible via the bottom-right help button after onboarding.
- Reuses the existing Scout onboarding mascot and shared UI design.
- Accepts free-text questions, recognizes bundled phrases/keywords, and returns vetted responses.
- Shows screen-specific suggested questions based on the current desktop route.
- Offers concise steps and a button that navigates to the relevant app screen.
- Gives an honest fallback for questions it cannot match.
- Is entirely local: no LLM, API key, provider invocation, network request, telemetry, or new dependency.
- Never runs workflows or reads the workspace, emails, documents, or credentials.
- Keeps chat messages in React memory only, not in local storage.

## Source of answers

- FAQ and deterministic matcher: packages/ui/src/components/helpContent.ts
- Conversation UI: packages/ui/src/components/HelpAssistant.tsx
- Shared-shell integration: packages/ui/src/App.tsx
- Matcher tests: apps/macos-apple-silicon/src/help.test.ts

Add knowledge by defining a new topic in HELP_TOPICS. Maintain consistency with docs/features.md, docs/getting-started.md, and docs/faq.md. Never imply that preparing documents submits an application.

## Design

- Buttons navigate to screens only, never trigger AI workflows or sensitive actions.
- Scout is separate from the command palette, job-search AI and approvals.
- Intel and Windows builds use the shared component but require their own smoke tests.
- Scout doesn't pop up unsolicited. Users close it whenever they like.
- Suggestions change with the route; messages remain during the shell session.
- Escape and the close button dismiss the panel.
- User questions and answers render as plain React text, never raw HTML or markdown.

## Validation

On a development machine with dependencies installed:

1. npm run test -w ai-job-search-macos-apple-silicon
2. npm run build -w ai-job-search-macos-apple-silicon
3. npm run dev:macos and open Ask Scout on Jobs, Studio, Pipeline, and Settings.
4. Test keyboard navigation, light/dark themes, narrow windows, and Reduce Motion.
5. Verify Scout answers with all AI providers disconnected and no network access.

Tests or desktop builds were not executed when preparing this branch via the connected GitHub API. CI and local validation remain required.
