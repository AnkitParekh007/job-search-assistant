import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
export type {
  Workspace, Dep, TrackerRow, Tracker, SeenJob, RunSummary, RunEvent, Pending, AppFolder, ProfileFile,
} from "@ai-job-search/core";
export { STATUSES, FINAL, canonical, TRACKER_HEADER } from "@ai-job-search/core";

export const api = {
  workspace: () => invoke<import("@ai-job-search/core").Workspace>("get_workspace"),
  setWorkspace: (path: string) => invoke<import("@ai-job-search/core").Workspace>("set_workspace", { path }),
  deps: () => invoke<import("@ai-job-search/core").Dep[]>("dependencies"),
  tracker: () => invoke<import("@ai-job-search/core").Tracker>("tracker"),
  seen: () => invoke<import("@ai-job-search/core").SeenJob[]>("seen_jobs"),
  updateStatus: (index: number, expected: string, status: string, note: string) =>
    invoke<import("@ai-job-search/core").TrackerRow>("update_status", { index, expected, status, note }),
  appFolder: (company: string, role: string) => invoke<import("@ai-job-search/core").AppFolder>("application_folder", { company, role }),
  profile: () => invoke<import("@ai-job-search/core").ProfileFile[]>("profile"),
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
  providers: async () => [] as import("@ai-job-search/core").ProviderStatus[],
  providerAccount: async (_provider: string): Promise<import("@ai-job-search/core").ProviderAccountResponse> => ({ unsupported: true }),
  providerLogin: async (_provider: string, _mode?: string): Promise<import("@ai-job-search/core").ProviderLoginResponse> => { throw new Error("Multi-provider runtime is on the Apple Silicon app first; rebuild the Intel app from the same sources to enable Codex."); },
  providerModels: async (_provider: string) => ({ data: [] }),
};

export const fileUrl = (abs: string) => convertFileSrc(abs);
export const on = <T,>(name: string, cb: (p: T) => void): Promise<UnlistenFn> => listen<T>(name, (e) => cb(e.payload));
export const inTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
export const isWebApp = () => false;

/** System notification while the window is unfocused. Generic text only. */
export async function notifyStatus(status: string) {
  if (!inTauri()) return;
  try {
    const n = await import("@tauri-apps/plugin-notification");
    let ok = await n.isPermissionGranted();
    if (!ok) ok = (await n.requestPermission()) === "granted";
    if (!ok) return;
    const body = {
      awaiting_approval: "Claude needs your approval to continue.",
      awaiting_input: "Claude is waiting for your reply.",
      completed: "A workflow finished.",
      failed: "A workflow failed. Open Agent Activity for details.",
    }[status] || status;
    n.sendNotification({ title: "AI Job Search", body });
  } catch { /* notifications unavailable */ }
}
