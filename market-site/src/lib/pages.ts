import type { SeoMeta } from "./site";

/**
 * SEO for top-level pages, used by the prerender step (and by pages via applySeo).
 * Keep in sync with any page that still calls applySeo with inline values.
 */
export const PAGE_SEO = {
  home: {
    title: "AI Job Search — Local-first macOS job search command center",
    description:
      "Local-first macOS desktop app with multi-provider AI support (Claude Code or OpenAI Codex) for your ai-job-search workspace — discover, rank, prepare applications, and track outcomes on files you own.",
    path: "/",
  },
  features: {
    title: "Features — AI Job Search",
    description:
      "Discover jobs, rank matches, prepare documents in Studio, track your pipeline, prep interviews, and supervise multi-provider AI runs — local-first on macOS.",
    path: "/features",
  },
  download: {
    title: "Download — AI Job Search Assistant",
    description:
      "Download AI Job Search Assistant for macOS Apple Silicon, Intel Mac, Windows, or the web demo. Multi-provider AI support (Claude Code or Codex) for workflows.",
    path: "/download",
  },
} satisfies Record<string, SeoMeta>;
