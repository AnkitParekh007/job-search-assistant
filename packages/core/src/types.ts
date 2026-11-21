export type Workspace = {
  path: string;
  valid: boolean;
  /** True only after the user explicitly chose a folder via set_workspace. */
  configured?: boolean;
  upstream_version: string;
  data_dir: string;
  /** Relative paths created by ensure_workspace on the last set_workspace call. */
  created?: string[];
};
export type Dep = { id: string; name: string; ok: boolean; required: boolean; detail: string; fix: string };
export type TrackerRow = { index: number; fields: Record<string, string> };
export type Tracker = { header: string[]; rows: TrackerRow[]; exists: boolean };
export type SeenJob = {
  key: string; title: string; company: string; url: string; location?: string; first_seen?: string;
  posted_date?: string | null; deadline?: string | null; employment_type?: string | null; fit?: string;
  status?: string; portal?: string; source?: string; rank_score?: number; rank_verdict?: string; rank_date?: string;
  location_verdict?: string; language_gate?: string; language_note?: string; strengths?: string[]; gaps?: string[];
  /** Optional filter/provenance fields (manual entry or enriched scrape). */
  remote?: boolean | null;
  seniority?: string;
  salaryMin?: number;
  salaryMax?: number;
  source_url?: string;
  last_verified?: string;
  user_entered?: boolean;
};
export type RunSummary = {
  id: string; workflow: string; prompt: string; session_id: string; status: string; started_at: number;
  finished_at: number | null; cost_usd: number | null; summary: string | null; error: string | null;
  provider?: string | null; model?: string | null;
};
export type RunEvent = { run_id: string; seq: number; ts: number; kind: string; data: any };
export type Pending = { request_id: string; request: { tool_name: string; input: any; display_name?: string; [k: string]: any } };
export type AppEvent = { ts?: string; type?: string; detail?: string };
export type AppFolder = { name: string; files: string[]; outcome: string | null; posting: string | null; events?: AppEvent[] };
export type ProfileFile = { path: string; content: string; placeholders: number };

export const STATUSES = ["drafted", "applied", "interview", "offer", "hired", "rejected", "no_response", "offer_declined", "withdrawn"] as const;
export const FINAL = new Set(["hired", "rejected", "no_response", "offer_declined", "withdrawn"]);
export const canonical = (s: string) => {
  const t = (s || "").trim().toLowerCase();
  return t === "no response" ? "no_response" : t === "offer declined" ? "offer_declined" : t;
};

export const TRACKER_HEADER = [
  "date", "company", "sector", "role", "role_type", "channel", "status", "contact_person",
  "fit_rating", "notes", "cv_file", "cover_letter_file", "source", "deadline",
] as const;
