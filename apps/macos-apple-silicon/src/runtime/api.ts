import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  DEMO_DEPS, DEMO_EVENTS, DEMO_INTERVIEW_MD, DEMO_PROFILE, DEMO_RUNS, DEMO_SEEN, DEMO_TRACKER, DEMO_WORKSPACE, demoMode,
} from "./demoFixture";
export type {
  Workspace, Dep, TrackerRow, Tracker, SeenJob, RunSummary, RunEvent, Pending, AppFolder, ProfileFile, CandidateProfile,
} from "@ai-job-search/core";
export { STATUSES, FINAL, canonical, TRACKER_HEADER } from "@ai-job-search/core";

export type UpdateCheckResult = {
  status: string;
  current: string;
  latest: string;
  tag: string;
  asset: string;
  url: string | null;
  notes_url: string;
  downloaded_path: string | null;
  sha256_ok: boolean | null;
  message: string;
};

const liveApi = {
  workspace: () => invoke<import("@ai-job-search/core").Workspace>("get_workspace"),
  setWorkspace: (path: string) => invoke<import("@ai-job-search/core").Workspace>("set_workspace", { path }),
  deps: () => invoke<import("@ai-job-search/core").Dep[]>("dependencies"),
  tracker: () => invoke<import("@ai-job-search/core").Tracker>("tracker"),
  seen: () => invoke<import("@ai-job-search/core").SeenJob[]>("seen_jobs"),
  updateStatus: (index: number, expected: string, status: string, note: string) =>
    invoke<import("@ai-job-search/core").TrackerRow>("update_status", { index, expected, status, note }),
  appFolder: (company: string, role: string) => invoke<import("@ai-job-search/core").AppFolder>("application_folder", { company, role }),
  profile: () => invoke<import("@ai-job-search/core").ProfileFile[]>("profile"),
  candidateProfile: () => invoke<import("@ai-job-search/core").CandidateProfile | Record<string, unknown>>("candidate_profile"),
  saveCandidateProfile: (profile: import("@ai-job-search/core").CandidateProfile | Record<string, unknown>) =>
    invoke<import("@ai-job-search/core").CandidateProfile | Record<string, unknown>>("save_candidate_profile", { profile }),
  addApplication: (fields: Record<string, string>) =>
    invoke<import("@ai-job-search/core").TrackerRow>("add_application", { fields }),
  upsertJob: (job: Record<string, unknown>) => invoke<Record<string, unknown>>("upsert_job", { job }),
  migrateWorkspace: () =>
    invoke<{
      migrated: boolean;
      already_current?: boolean;
      schema_version: number;
      backup: string | null;
      applications_written: number;
    }>("migrate_workspace"),
  restoreWorkspaceBackup: (backupFolderName: string) =>
    invoke<{ restored: boolean; backup: string; files: string[] }>("restore_workspace_backup", {
      backupFolderName,
    }),
  extractResumeText: (path: string) =>
    invoke<{ text: string; chars: number; source_path: string; artifact: string }>("extract_resume_text", { path }),
  documents: () => invoke<{ cv: string[]; cover: string[]; cv_pdf: string[]; cover_pdf: string[]; reports: string[] }>("documents"),
  readText: (rel: string) => invoke<string>("read_text", { rel }),
  absPath: (rel: string) => invoke<string>("abs_path", { rel }),
  exists: (rel: string) => invoke<boolean>("file_exists", { rel }),
  compile: (rel: string) => invoke<{ ok: boolean; log: string; pdf: string; pages: number | null }>("compile_doc", { rel }),
  verifyPdf: (rel: string) => invoke<{ code: number; stdout: string; stderr: string }>("verify_pdf", { rel }),
  postingGuard: (text: string) => invoke<{ code: number; stdout: string; stderr: string }>("posting_guard", { text }),
  startRun: (workflow: string, prompt: string, model?: string, resume?: string, provider?: string) =>
    invoke<import("@ai-job-search/core").RunSummary>("start_run", {
      workflow, prompt, model: model || null, resume: resume || null, provider: provider || null,
    }),
  respond: (runId: string, requestId: string, allow: boolean, updatedInput?: any, message?: string, remember?: boolean) =>
    invoke<void>("respond_permission", { runId, requestId, allow, updatedInput: updatedInput ?? null, message: message ?? null, remember: remember ?? false }),
  send: (runId: string, text: string) => invoke<void>("send_message", { runId, text }),
  finish: (runId: string) => invoke<void>("finish_run", { runId }),
  cancel: (runId: string) => invoke<void>("cancel_run", { runId }),
  runs: () => invoke<{ runs: import("@ai-job-search/core").RunSummary[]; live: Record<string, string> }>("list_runs"),
  runEvents: (runId: string) => invoke<{ events: import("@ai-job-search/core").RunEvent[]; pending: import("@ai-job-search/core").Pending[] }>("run_events", { runId }),
  getSetting: (key: string) => invoke<string | null>("get_setting", { key }),
  setSetting: (key: string, value: string) => invoke<void>("set_setting", { key, value }),
  providers: () => invoke<import("@ai-job-search/core").ProviderStatus[]>("list_providers"),
  providerAccount: (provider: string) => invoke<import("@ai-job-search/core").ProviderAccountResponse>("provider_account", { provider }),
  providerLogin: (provider: string, mode?: string) => invoke<import("@ai-job-search/core").ProviderLoginResponse>("provider_login", { provider, mode: mode || null }),
  providerModels: (provider: string) => invoke<any>("provider_models", { provider }),
  providerSetCredential: (provider: string, secret: string) =>
    invoke<{ ok: boolean }>("provider_set_credential", { provider, secret }),
  providerClearCredential: (provider: string) =>
    invoke<{ ok: boolean }>("provider_clear_credential", { provider }),
  providerTest: (provider: string) => invoke<any>("provider_test", { provider }),
  checkForUpdate: () => invoke<UpdateCheckResult>("check_for_update"),
  downloadUpdate: (tag: string, asset: string) =>
    invoke<UpdateCheckResult>("download_update", { tag, asset }),
};

const demoApi: Partial<typeof liveApi> = {
  workspace: async () => DEMO_WORKSPACE,
  deps: async () => DEMO_DEPS,
  tracker: async () => DEMO_TRACKER,
  seen: async () => DEMO_SEEN as import("@ai-job-search/core").SeenJob[],
  appFolder: async (company: string) => ({
    name: company,
    files: [],
    outcome: null,
    posting: company === "Nordlicht"
      ? "Nordlicht — Senior Frontend Engineer (fictional sample). TypeScript and React required."
      : null,
    events: [],
  }),
  profile: async () => [],
  candidateProfile: async () => DEMO_PROFILE,
  readText: async (rel: string) => {
    if (rel.endsWith("07-interview-prep.md")) return DEMO_INTERVIEW_MD;
    return "";
  },
  documents: async () => ({ cv: ["cv/nordlicht_cv.tex"], cover: [], cv_pdf: [], cover_pdf: [], reports: [] }),
  exists: async () => false,
  absPath: async (rel: string) => rel,
  postingGuard: async (text: string) => ({
    code: 0,
    stdout: JSON.stringify({ instruction_like: [], invisible_flagged: false, chars: text.length, ok: true }),
    stderr: "",
  }),
  runs: async () => DEMO_RUNS,
  runEvents: async () => DEMO_EVENTS,
  getSetting: async (key: string) => {
    if (key === "theme") return "light";
    if (key === "onboarded") return "1";
    if (key === "ai_provider") return "claude";
    if (key === "update_check_on_launch") return "0";
    return null;
  },
  setSetting: async () => undefined,
  providers: async () => [],
  checkForUpdate: async () => ({
    status: "current",
    current: "0.1.5",
    latest: "0.1.5",
    tag: "v0.1.5",
    asset: "",
    url: null,
    notes_url: "",
    downloaded_path: null,
    sha256_ok: null,
    message: "demo",
  }),
};

export const api: typeof liveApi = new Proxy(liveApi, {
  get(target, prop, receiver) {
    if (typeof prop === "string" && demoMode()) {
      const stub = demoApi as Record<string, unknown>;
      if (prop in stub && stub[prop]) return stub[prop];
    }
    return Reflect.get(target, prop, receiver);
  },
});

export const fileUrl = (abs: string) => convertFileSrc(abs);
export const on = <T,>(name: string, cb: (p: T) => void): Promise<UnlistenFn> => listen<T>(name, (e) => cb(e.payload));
export const inTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** System notification while the window is unfocused. Generic text only. */
export async function notifyStatus(status: string) {
  if (!inTauri()) return;
  try {
    const n = await import("@tauri-apps/plugin-notification");
    let ok = await n.isPermissionGranted();
    if (!ok) ok = (await n.requestPermission()) === "granted";
    if (!ok) return;
    const body = {
      awaiting_approval: "Your AI provider needs approval to continue.",
      awaiting_input: "A workflow is waiting for your reply.",
      completed: "A workflow finished.",
      failed: "A workflow failed. Open Agent Activity for details.",
    }[status] || status;
    n.sendNotification({ title: "Job Search Assistant", body });
  } catch { /* notifications unavailable */ }
}
