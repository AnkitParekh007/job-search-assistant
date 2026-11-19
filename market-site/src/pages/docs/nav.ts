export type DocsPageId =
  | "overview"
  | "quickstart"
  | "install"
  | "first-run"
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
    title: "Docs — AI Job Search",
    description: "Learn how to install, set up, and run AI Job Search on macOS.",
    path: "/docs",
  },
  quickstart: {
    section: "get-started",
    title: "Quickstart — Docs — AI Job Search",
    description: "Get from install to a shortlist in one sitting.",
    path: "/docs/quickstart",
  },
  install: {
    section: "get-started",
    title: "Install — Docs — AI Job Search",
    description: "What you need on the Mac before workflows can run.",
    path: "/docs/install",
  },
  "first-run": {
    section: "get-started",
    title: "First run — Docs — AI Job Search",
    description: "Workspace, profile setup, and dependency health.",
    path: "/docs/first-run",
  },
  discover: {
    section: "guides",
    title: "Discover & rank — Docs — AI Job Search",
    description: "Find new roles, dedupe them locally, then score what fits.",
    path: "/docs/discover",
  },
  apply: {
    section: "guides",
    title: "Application Studio — Docs — AI Job Search",
    description: "Draft tailored CVs and cover letters with approval gates.",
    path: "/docs/apply",
  },
  track: {
    section: "guides",
    title: "Track & prep — Docs — AI Job Search",
    description: "Pipeline outcomes, interview packs, and optional inbox sync.",
    path: "/docs/track",
  },
  settings: {
    section: "guides",
    title: "Settings — Docs — AI Job Search",
    description: "Workspace path, dependency health, and appearance.",
    path: "/docs/settings",
  },
  workflows: {
    section: "reference",
    title: "Workflows — Docs — AI Job Search",
    description: "Every catalogued upstream command the app can launch.",
    path: "/docs/workflows",
  },
  security: {
    section: "security",
    title: "Security model — Docs — AI Job Search",
    description: "How the desktop app keeps you in control.",
    path: "/docs/security",
  },
};
