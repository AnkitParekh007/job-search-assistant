import { WORKFLOWS } from "./workflows";

/** Marketing / docs feature cards derived from the live workflow catalog + product pillars. */
export type FeatureCard = {
  id: string;
  title: string;
  blurb: string;
  group: "Find" | "Apply" | "Track" | "Automate" | "Platform";
};

export const PRODUCT_FEATURES: FeatureCard[] = [
  { id: "discover", title: "Discover jobs", blurb: "Scrape portal CLIs or web search, then dedupe into local seen-jobs.", group: "Find" },
  { id: "rank", title: "Rank matches", blurb: "Integrity-gated scoring against your profile rubric.", group: "Find" },
  { id: "studio", title: "Application Studio", blurb: "Drafter → reviewer → revision with PDF compile and approvals.", group: "Apply" },
  { id: "documents", title: "Documents", blurb: "Real CV and cover-letter sources from your workspace.", group: "Apply" },
  { id: "pipeline", title: "Pipeline & outcomes", blurb: "Track statuses, archive what was sent, draft follow-ups (never auto-send).", group: "Track" },
  { id: "interview", title: "Interview prep", blurb: "Stage-specific packs from archived postings and your docs.", group: "Track" },
  { id: "activity", title: "Agent activity", blurb: "Watch live Claude Code runs, approvals, and workflow stages.", group: "Automate" },
  { id: "local-first", title: "Local-first", blurb: "Tracker, archives, and profile stay on disk you own.", group: "Platform" },
];

/** Workflow catalog projection for docs/marketing tables. */
export const WORKFLOW_FEATURES = WORKFLOWS.map((w) => ({
  id: w.id,
  command: w.command,
  title: w.title,
  blurb: w.blurb,
  writes: w.writes,
  stage: w.stage || "",
  external: w.external || "",
}));
