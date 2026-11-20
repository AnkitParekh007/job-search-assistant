/** Type contract every app runtime must satisfy. */
export * from "../core/src/types";
export type {
  CandidateProfile,
  CandidateFact,
  ParseResumeResult,
  ParseDiagnostics,
} from "../core/src/ats";

import type {
  Workspace,
  Dep,
  TrackerRow,
  Tracker,
  SeenJob,
  RunSummary,
  RunEvent,
  Pending,
  AppFolder,
  ProfileFile,
} from "../core/src/types";
import type { CandidateProfile } from "../core/src/ats";
import type {
  ProviderStatus,
  ProviderAccountResponse,
  ProviderLoginResponse,
} from "../core/src/providers";

export type MigrateWorkspaceResult = {
  migrated: boolean;
  already_current?: boolean;
  schema_version: number;
  backup: string | null;
  applications_written: number;
};

export type RuntimeApi = {
  workspace: () => Promise<Workspace>;
  setWorkspace: (path: string) => Promise<Workspace>;
  deps: () => Promise<Dep[]>;
  tracker: () => Promise<Tracker>;
  seen: () => Promise<SeenJob[]>;
  updateStatus: (index: number, expected: string, status: string, note: string) => Promise<TrackerRow>;
  appFolder: (company: string, role: string) => Promise<AppFolder>;
  profile: () => Promise<ProfileFile[]>;
  candidateProfile: () => Promise<CandidateProfile | Record<string, unknown>>;
  saveCandidateProfile: (profile: CandidateProfile | Record<string, unknown>) => Promise<CandidateProfile | Record<string, unknown>>;
  addApplication: (fields: Record<string, string>) => Promise<TrackerRow>;
  upsertJob: (job: Record<string, unknown>) => Promise<Record<string, unknown>>;
  migrateWorkspace: () => Promise<MigrateWorkspaceResult>;
  restoreWorkspaceBackup: (backupFolderName: string) => Promise<{ restored: boolean; backup: string; files: string[] }>;
  extractResumeText: (path: string) => Promise<{ text: string; chars: number; source_path: string; artifact: string }>;
  documents: () => Promise<{ cv: string[]; cover: string[]; cv_pdf: string[]; cover_pdf: string[]; reports: string[] }>;
  readText: (rel: string) => Promise<string>;
  absPath: (rel: string) => Promise<string>;
  exists: (rel: string) => Promise<boolean>;
  compile: (rel: string) => Promise<{ ok: boolean; log: string; pdf: string; pages: number | null }>;
  verifyPdf: (rel: string) => Promise<{ code: number; stdout: string; stderr: string }>;
  postingGuard: (text: string) => Promise<{ code: number; stdout: string; stderr: string }>;
  startRun: (workflow: string, prompt: string, model?: string, resume?: string, provider?: string) => Promise<RunSummary>;
  respond: (runId: string, requestId: string, allow: boolean, updatedInput?: any, message?: string, remember?: boolean) => Promise<void>;
  send: (runId: string, text: string) => Promise<void>;
  finish: (runId: string) => Promise<void>;
  cancel: (runId: string) => Promise<void>;
  runs: () => Promise<{ runs: RunSummary[]; live: Record<string, string> }>;
  runEvents: (runId: string) => Promise<{ events: RunEvent[]; pending: Pending[] }>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;
  providers: () => Promise<ProviderStatus[]>;
  providerAccount: (provider: string) => Promise<ProviderAccountResponse>;
  providerLogin: (provider: string, mode?: string) => Promise<ProviderLoginResponse>;
  providerModels: (provider: string) => Promise<any>;
  providerSetCredential: (provider: string, secret: string) => Promise<{ ok: boolean }>;
  providerClearCredential: (provider: string) => Promise<{ ok: boolean }>;
  providerTest: (provider: string) => Promise<any>;
};

export declare const api: RuntimeApi;
export declare function fileUrl(abs: string): string;
export declare function on<T>(name: string, cb: (p: T) => void): Promise<() => void>;
export declare function inTauri(): boolean;
export declare function notifyStatus(status: string): Promise<void>;
export declare function openUrl(url: string): Promise<void>;
export declare function revealItemInDir(path: string): Promise<void>;
export declare function open(opts?: {
  directory?: boolean;
  title?: string;
  defaultPath?: string;
  multiple?: boolean;
  filters?: { name: string; extensions: string[] }[];
}): Promise<string | string[] | null>;
