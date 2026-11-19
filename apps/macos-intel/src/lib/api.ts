import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export type Workspace = { path: string; valid: boolean; upstream_version: string; data_dir: string };
export type Dep = { id: string; name: string; ok: boolean; required: boolean; detail: string; fix: string };
export type TrackerRow = { index: number; fields: Record<string, string> };
export type Tracker = { header: string[]; rows: TrackerRow[]; exists: boolean };
export type SeenJob = {
  key: string; title: string; company: string; url: string; location?: string; first_seen?: string;
  posted_date?: string | null; deadline?: string | null; employment_type?: string | null; fit?: string;
  status?: string; portal?: string; source?: string; rank_score?: number; rank_verdict?: string; rank_date?: string;
  location_verdict?: string; language_gate?: string; language_note?: string; strengths?: string[]; gaps?: string[];
};
export type RunSummary = {
  id: string; workflow: string; prompt: string; session_id: string; status: string; started_at: number;
  finished_at: number | null; cost_usd: number | null; summary: string | null; error: string | null;
};
export type RunEvent = { run_id: string; seq: number; ts: number; kind: string; data: any };
export type Pending = { request_id: string; request: { tool_name: string; input: any; display_name?: string; [k: string]: any } };
export type AppFolder = { name: string; files: string[]; outcome: string | null; posting: string | null };
export type ProfileFile = { path: string; content: string; placeholders: number };

export const STATUSES = ["drafted", "applied", "interview", "offer", "hired", "rejected", "no_response", "offer_declined", "withdrawn"] as const;
export const FINAL = new Set(["hired", "rejected", "no_response", "offer_declined", "withdrawn"]);
export const canonical = (s: string) => {
  const t = (s || "").trim().toLowerCase();
  return t === "no response" ? "no_response" : t === "offer declined" ? "offer_declined" : t;
};

export const api = {
  workspace: () => invoke<Workspace>("get_workspace"),
  setWorkspace: (path: string) => invoke<Workspace>("set_workspace", { path }),
  deps: () => invoke<Dep[]>("dependencies"),
  tracker: () => invoke<Tracker>("tracker"),
  seen: () => invoke<SeenJob[]>("seen_jobs"),
  updateStatus: (index: number, expected: string, status: string, note: string) =>
    invoke<TrackerRow>("update_status", { index, expected, status, note }),
  appFolder: (company: string, role: string) => invoke<AppFolder>("application_folder", { company, role }),
  profile: () => invoke<ProfileFile[]>("profile"),
  documents: () => invoke<{ cv: string[]; cover: string[]; cv_pdf: string[]; cover_pdf: string[]; reports: string[] }>("documents"),
  readText: (rel: string) => invoke<string>("read_text", { rel }),
  absPath: (rel: string) => invoke<string>("abs_path", { rel }),
  exists: (rel: string) => invoke<boolean>("file_exists", { rel }),
  compile: (rel: string) => invoke<{ ok: boolean; log: string; pdf: string; pages: number | null }>("compile_doc", { rel }),
  verifyPdf: (rel: string) => invoke<{ code: number; stdout: string; stderr: string }>("verify_pdf", { rel }),
  postingGuard: (text: string) => invoke<{ code: number; stdout: string; stderr: string }>("posting_guard", { text }),
  startRun: (workflow: string, prompt: string, model?: string, resume?: string) =>
    invoke<RunSummary>("start_run", { workflow, prompt, model: model || null, resume: resume || null }),
  respond: (runId: string, requestId: string, allow: boolean, updatedInput?: any, message?: string, remember?: boolean) =>
    invoke<void>("respond_permission", { runId, requestId, allow, updatedInput: updatedInput ?? null, message: message ?? null, remember: remember ?? false }),
  send: (runId: string, text: string) => invoke<void>("send_message", { runId, text }),
  finish: (runId: string) => invoke<void>("finish_run", { runId }),
  cancel: (runId: string) => invoke<void>("cancel_run", { runId }),
  runs: () => invoke<{ runs: RunSummary[]; live: Record<string, string> }>("list_runs"),
  runEvents: (runId: string) => invoke<{ events: RunEvent[]; pending: Pending[] }>("run_events", { runId }),
  getSetting: (key: string) => invoke<string | null>("get_setting", { key }),
  setSetting: (key: string, value: string) => invoke<void>("set_setting", { key, value }),
};

export const fileUrl = (abs: string) => convertFileSrc(abs);
export const on = <T,>(name: string, cb: (p: T) => void): Promise<UnlistenFn> => listen<T>(name, (e) => cb(e.payload));
export const inTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
