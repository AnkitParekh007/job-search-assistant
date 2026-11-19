# AI Job Search — Web

React web client for browsing the product UI with **browser-local demo data**.

Live Claude Code workflows, LaTeX compile, and real workspace files require the desktop apps under `apps/macos-*` or `apps/windows`.

## Develop

```bash
cd apps/web
npm install
npm run dev
```

Open http://127.0.0.1:5173

## Test / build

```bash
npm test
npm run build
npm run preview
```

## What works in the browser

- Today / Jobs / Pipeline / Studio / Documents / Profile / Settings UI
- Sample tracker + ranked jobs (seeded into `localStorage`)
- Status updates persist in this browser
- Workflow starts explain that Claude runs need desktop

## What stays desktop-only

- Claude Code bridge, approvals, Gmail/Notion connectors
- Real workspace filesystem + PDF compile
