// Catalog of every upstream workflow. Each maps to the exact slash command or
// skill trigger upstream ships; the app never re-implements their logic.
export type Workflow = {
  id: string;
  command: string; // what is sent to Claude Code
  title: string;
  blurb: string;
  kind: "command" | "skill";
  args?: { name: string; placeholder: string; optional?: boolean }[];
  external?: string; // integration it needs
  writes: string; // what it may change, shown before starting
  stage?: string; // pipeline stage in the Activity visualizer
};

export const WORKFLOWS: Workflow[] = [
  { id: "setup", command: "/setup", title: "Profile setup", kind: "command", stage: "Onboarding",
    blurb: "Guided onboarding: import a CV, a documents folder, or answer an interview. Re-run one section with --section.",
    args: [{ name: "args", placeholder: "--section skills | experience | search (optional)", optional: true }],
    writes: "CLAUDE.md, profile skill files, search-queries.md" },
  { id: "scrape", command: "/scrape", title: "Discover jobs", kind: "skill", stage: "Job Discovery",
    blurb: "Searches installed portal CLIs (or WebSearch when none), deduplicates, and stores new postings.",
    args: [{ name: "focus", placeholder: "focus area, 'broad', or 'health' (optional)", optional: true }],
    writes: "job_scraper/seen_jobs.json" },
  { id: "rank", command: "/rank", title: "Rank matches", kind: "command", stage: "Ranking",
    blurb: "Fetches each new posting, runs the integrity gate, scores it with the upstream rubric, and returns a shortlist.",
    writes: "rank fields in job_scraper/seen_jobs.json" },
  { id: "apply", command: "/apply", title: "Application Studio", kind: "command", stage: "Document Drafting",
    blurb: "Drafter → reviewer → revision. Evaluates fit, asks before drafting, compiles and verifies the PDFs.",
    args: [{ name: "posting", placeholder: "job URL or pasted posting text" }],
    writes: "cv/, cover_letters/, job_search_tracker.csv (drafted), documents/applications/" },
  { id: "outcome", command: "/outcome", title: "Record outcome", kind: "command", stage: "Tracking",
    blurb: "Updates an application's status, archives what was sent, drafts follow-ups (never sends).",
    args: [{ name: "company", placeholder: "company, 'stale', or empty for the open list", optional: true }],
    writes: "job_search_tracker.csv, documents/applications/<app>/outcome.md" },
  { id: "interview", command: "/interview", title: "Interview prep", kind: "command", stage: "Interviews",
    blurb: "Stage-specific prep pack from the archived posting and your documents; roleplay on request.",
    args: [{ name: "company", placeholder: "company of a tracked application" }],
    writes: "documents/applications/<app>/ prep notes" },
  { id: "gmail-sync", command: "/gmail-sync", title: "Gmail sync", kind: "command", stage: "Tracking",
    blurb: "Reads application emails through the claude.ai Gmail connector and proposes status changes for approval.",
    external: "claude.ai Gmail connector", writes: "job_search_tracker.csv (after you approve)" },
  { id: "notion-sync", command: "/notion-sync", title: "Notion sync", kind: "command", stage: "Tracking",
    blurb: "One-way push of ranked jobs and applications to a Notion database. Local files stay authoritative.",
    external: "Notion MCP server", writes: "your Notion database (external)" },
  { id: "html-report", command: "/html-report", title: "HTML report", kind: "command", stage: "Reporting",
    blurb: "Generates a self-contained offline dashboard from the tracker and archives.",
    args: [{ name: "path", placeholder: "output path (optional, default reports/application-dashboard.html)", optional: true }],
    writes: "reports/application-dashboard.html" },
  { id: "expand", command: "/expand", title: "Profile enrichment", kind: "command", stage: "Onboarding",
    blurb: "Finds competency evidence in your documents, GitHub or portfolio; confirms before writing.",
    args: [{ name: "source", placeholder: "e.g. github.com/you or documents (optional)", optional: true }],
    writes: "profile skill files (after confirmation)" },
  { id: "upskill", command: "/upskill", title: "Skill gaps", kind: "skill", stage: "Growth",
    blurb: "Compares tracked postings with your profile and builds a prioritised learning plan.",
    writes: "upskill/ plan files" },
  { id: "add-template", command: "/add-template", title: "Add template", kind: "command", stage: "Templates",
    blurb: "Registers a custom CV or cover-letter template and its compile command.",
    args: [{ name: "path", placeholder: "path to template source", optional: true }],
    writes: "05/06 template files (ACTIVE-TEMPLATE block)" },
  { id: "add-portal", command: "/add-portal", title: "Add portal", kind: "command", stage: "Portals",
    blurb: "Generates a portal-search skill for a job board, checked by the upstream security guard.",
    args: [{ name: "board", placeholder: "job board name or URL" }],
    writes: ".agents/skills/<portal>/" },
  { id: "reset", command: "/reset", title: "Reset profile", kind: "command", stage: "Workspace",
    blurb: "Resets candidate profile data back to templates. Destructive: it shows what will change and asks first.",
    writes: "profile files (destructive)" },
];

export const byId = (id: string) => WORKFLOWS.find((w) => w.id === id);

/** Build the message sent to Claude Code. Untrusted text is passed as data, never interpolated into a shell. */
export function buildPrompt(w: Workflow, arg: string): string {
  const a = arg.trim();
  return a ? `${w.command} ${a}` : w.command;
}
