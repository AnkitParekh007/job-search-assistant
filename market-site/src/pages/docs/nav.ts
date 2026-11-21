export type DocsPageId =
  | "overview"
  | "quickstart"
  | "install"
  | "first-run"
  | "providers"
  | "discover"
  | "apply"
  | "track"
  | "settings"
  | "workflows"
  | "security";

export type DocsSectionId = "get-started" | "guides" | "reference" | "security";

export const DOCS_SUBNAV: { id: DocsSectionId; to: string; label: string }[] = [
  { id: "get-started", to: "/docs", label: "Overview" },
  { id: "guides", to: "/docs/discover", label: "Guides" },
  { id: "reference", to: "/docs/workflows", label: "Reference" },
  { id: "security", to: "/docs/security", label: "Security" },
];

export const DOCS_SIDEBAR: {
  title: string;
  links: { id: DocsPageId; to: string; label: string }[];
}[] = [
  {
    title: "Get started",
    links: [
      { id: "overview", to: "/docs", label: "Overview" },
      { id: "quickstart", to: "/docs/quickstart", label: "Quickstart" },
      { id: "install", to: "/docs/install", label: "Install" },
      { id: "first-run", to: "/docs/first-run", label: "First run" },
      { id: "providers", to: "/docs/providers", label: "AI Providers" },
    ],
  },
  {
    title: "Guides",
    links: [
      { id: "discover", to: "/docs/discover", label: "Discover & rank" },
      { id: "apply", to: "/docs/apply", label: "Application Studio" },
      { id: "track", to: "/docs/track", label: "Track & prep" },
      { id: "settings", to: "/docs/settings", label: "Settings" },
    ],
  },
  {
    title: "Reference",
    links: [
      { id: "workflows", to: "/docs/workflows", label: "Workflows" },
      { id: "security", to: "/docs/security", label: "Security model" },
    ],
  },
];

export const DOCS_META: Record<
  DocsPageId,
  { section: DocsSectionId; title: string; description: string; path: string }
> = {
  overview: {
    section: "get-started",
    title: "Docs — Job Search Assistant",
    description:
      "Install, configure multi-provider AI support, and run discover → rank → apply → track on files you own.",
    path: "/docs",
  },
  quickstart: {
    section: "get-started",
    title: "Quickstart — Docs — Job Search Assistant",
    description: "Get from download to a shortlist in one sitting.",
    path: "/docs/quickstart",
  },
  install: {
    section: "get-started",
    title: "Install — Docs — Job Search Assistant",
    description: "The published Apple Silicon package is v0.1.2 (ad-hoc signed, not notarized). v0.1.3 is not published. Intel and Windows: build from source.",
    path: "/docs/install",
  },
  "first-run": {
    section: "get-started",
    title: "First run — Docs — Job Search Assistant",
    description: "Workspace, AI provider, profile setup, and dependency health.",
    path: "/docs/first-run",
  },
  providers: {
    section: "get-started",
    title: "AI Providers — Docs — Job Search Assistant",
    description:
      "Choose Claude Code or OpenAI Codex, connect accounts, and see which workflows each provider supports.",
    path: "/docs/providers",
  },
  discover: {
    section: "guides",
    title: "Discover & rank — Docs — Job Search Assistant",
    description: "Find new roles, dedupe them locally, compare matches, then score what fits.",
    path: "/docs/discover",
  },
  apply: {
    section: "guides",
    title: "Application Studio — Docs — Job Search Assistant",
    description: "Draft tailored CVs and cover letters with approval gates and PDF compile.",
    path: "/docs/apply",
  },
  track: {
    section: "guides",
    title: "Track & prep — Docs — Job Search Assistant",
    description: "Pipeline outcomes, interview packs, Documents, and optional inbox sync.",
    path: "/docs/track",
  },
  settings: {
    section: "guides",
    title: "Settings — Docs — Job Search Assistant",
    description: "Workspace path, AI Providers, dependency health, and appearance.",
    path: "/docs/settings",
  },
  workflows: {
    section: "reference",
    title: "Workflows — Docs — Job Search Assistant",
    description: "All 14 workflows plus Claude vs Codex support.",
    path: "/docs/workflows",
  },
  security: {
    section: "security",
    title: "Security model — Docs — Job Search Assistant",
    description: "Approvals, local files, path guards, and provider sandbox defaults.",
    path: "/docs/security",
  },
};
