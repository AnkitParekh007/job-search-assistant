import type { SeoMeta } from "./site";

/**
 * SEO for top-level pages, used by the prerender step (and by pages via applySeo).
 * Keep in sync with any page that still calls applySeo with inline values.
 */
export const PAGE_SEO = {
  home: {
    title: "Job Search Assistant — Local-first job search command center",
    description:
      "Local-first desktop app with multi-provider AI support (Claude Code or OpenAI Codex) for a workspace folder you own — discover, rank, prepare applications, and track outcomes on files you keep.",
    path: "/",
  },
  features: {
    title: "Features — Job Search Assistant",
    description:
      "Discover jobs, rank matches, prepare documents in Studio, track your pipeline, prep interviews, and supervise multi-provider AI runs — local-first on macOS.",
    path: "/features",
  },
  benchmarks: {
    title: "ATS Benchmarks & Methodology — Job Search Assistant",
    description:
      "How Job Search Assistant plans to test resume readability, evidence-backed matching, truthful tailoring and recruiter outcomes. No unverified ATS pass-rate claims.",
    path: "/benchmarks",
  },
  compare: {
    title: "Job Search App Comparison — Job Search Assistant",
    description:
      "Compare published features of Job Search Assistant, Ronin, Finds You Jobs and JobSifter. Transparent sourcing, honest product scope and no fabricated claims.",
    path: "/compare",
  },
  faq: {
    title: "FAQs — Job Search Assistant",
    description:
      "Find clear answers about cost, AI provider setup, resume and ATS claims, privacy, application submission and supported desktop platforms.",
    path: "/faq",
  },
  download: {
    title: "Download — Job Search Assistant",
    description:
      "Download Job Search Assistant v0.1.5 for macOS Apple Silicon. Ad-hoc signed, not notarized. Assisted updates via Settings. Intel and Windows: build from source.",
    path: "/download",
  },
} satisfies Record<string, SeoMeta>;
