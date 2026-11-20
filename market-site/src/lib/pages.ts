import type { SeoMeta } from "./site";

/**
 * SEO for top-level pages, used by the prerender step (and by pages via applySeo).
 * Keep in sync with any page that still calls applySeo with inline values.
 */
export const PAGE_SEO = {
  home: {
    title: "AI Job Search Assistant — Local-first job search command center",
    description:
      "Local-first desktop app with multi-provider AI support (Claude Code or OpenAI Codex) for a workspace folder you own — discover, rank, prepare applications, and track outcomes on files you keep.",
    path: "/",
  },
  features: {
    title: "Features — AI Job Search Assistant",
    description:
      "Discover jobs, rank matches, prepare documents in Studio, track your pipeline, prep interviews, and supervise multi-provider AI runs — local-first on macOS.",
    path: "/features",
  },
  download: {
    title: "Build from source — AI Job Search Assistant",
    description:
      "Build AI Job Search Assistant from source. The v0.1.1 archives contain source clients, not verified native installers; platform binaries are pending validation.",
    path: "/download",
  },
} satisfies Record<string, SeoMeta>;
