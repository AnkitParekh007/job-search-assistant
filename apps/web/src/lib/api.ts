/** Browser API for the web app — localStorage-backed demo workspace (no Claude Code bridge). */

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

export type UnlistenFn = () => void;

export const STATUSES = ["drafted", "applied", "interview", "offer", "hired", "rejected", "no_response", "offer_declined", "withdrawn"] as const;
export const FINAL = new Set(["hired", "rejected", "no_response", "offer_declined", "withdrawn"]);
export const canonical = (s: string) => {
  const t = (s || "").trim().toLowerCase();
  return t === "no response" ? "no_response" : t === "offer declined" ? "offer_declined" : t;
};

const HEADER = [
  "date", "company", "sector", "role", "role_type", "channel", "status", "contact_person",
  "fit_rating", "notes", "cv_file", "cover_letter_file", "source", "deadline",
];

const KEY = {
  ws: "ajs-web-workspace",
  tracker: "ajs-web-tracker",
  seen: "ajs-web-seen",
  runs: "ajs-web-runs",
  settings: "ajs-web-settings",
  seeded: "ajs-web-seeded",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedIfNeeded() {
  if (localStorage.getItem(KEY.seeded)) return;
  const tracker: Tracker = {
    exists: true,
    header: HEADER,
    rows: [
      {
        index: 0,
        fields: {
          date: "2026-11-10", company: "Northwind Labs", sector: "AI", role: "Staff Platform Engineer",
          role_type: "full-time", channel: "web", status: "applied", contact_person: "", fit_rating: "high",
          notes: "2026-11-12 recruiter screen", cv_file: "", cover_letter_file: "", source: "demo", deadline: "",
        },
      },
      {
        index: 1,
        fields: {
          date: "2026-11-14", company: "Contoso Health", sector: "Health", role: "Principal Engineer",
          role_type: "full-time", channel: "referral", status: "interview", contact_person: "Alex", fit_rating: "high",
          notes: "2026-11-18 panel", cv_file: "", cover_letter_file: "", source: "demo", deadline: "2026-11-28",
        },
      },
      {
        index: 2,
        fields: {
          date: "2026-11-16", company: "Fabrikam Cloud", sector: "Infra", role: "Senior Backend Engineer",
          role_type: "full-time", channel: "web", status: "drafted", contact_person: "", fit_rating: "medium",
          notes: "", cv_file: "", cover_letter_file: "", source: "demo", deadline: "2026-12-01",
        },
      },
    ],
  };
  const seen: SeenJob[] = [
    {
      key: "demo-1", title: "Staff Platform Engineer", company: "Northwind Labs", url: "https://example.com/jobs/1",
      location: "Remote", first_seen: "2026-11-09", fit: "high", status: "ranked", rank_score: 88,
      rank_verdict: "strong", source: "web", portal: "websearch",
      strengths: ["Platform", "TypeScript"], gaps: ["Kubernetes at scale"],
    },
    {
      key: "demo-2", title: "Principal Engineer", company: "Contoso Health", url: "https://example.com/jobs/2",
      location: "Hybrid · SF", first_seen: "2026-11-12", fit: "high", status: "ranked", rank_score: 84,
      source: "web", portal: "websearch",
    },
    {
      key: "demo-3", title: "Senior Backend Engineer", company: "Fabrikam Cloud", url: "https://example.com/jobs/3",
      location: "Remote", first_seen: "2026-11-15", fit: "medium", status: "new", source: "cli", portal: "demo",
    },
  ];
  save(KEY.tracker, tracker);
  save(KEY.seen, seen);
  save(KEY.ws, {
    path: "~/ai-job-search (browser demo)",
    valid: true,
    upstream_version: "web-demo",
    data_dir: "localStorage://ai-job-search-web",
  } satisfies Workspace);
  save(KEY.runs, [] as RunSummary[]);
  save(KEY.settings, { model: "", theme: "system" } as Record<string, string>);
  localStorage.setItem(KEY.seeded, "1");
}

seedIfNeeded();

const listeners = new Map<string, Set<(p: any) => void>>();
function emit(name: string, payload: any) {
  listeners.get(name)?.forEach((cb) => cb(payload));
}

export const api = {
  workspace: async () => load<Workspace>(KEY.ws, {
    path: "~/ai-job-search (browser demo)", valid: true, upstream_version: "web-demo", data_dir: "localStorage://ai-job-search-web",
  }),
  setWorkspace: async (path: string) => {
    const w: Workspace = { path, valid: true, upstream_version: "web-demo", data_dir: "localStorage://ai-job-search-web" };
    save(KEY.ws, w);
    emit("workspace-changed", { paths: [path] });
    return w;
  },
  deps: async (): Promise<Dep[]> => [
    { id: "claude", name: "Claude Code", ok: false, required: true, detail: "Not available in the browser", fix: "Use the macOS or Windows desktop app for live Claude runs." },
    { id: "python", name: "Python ≥ 3.10", ok: false, required: true, detail: "Desktop only", fix: "Install on the machine that runs the desktop app." },
    { id: "latex", name: "LaTeX", ok: false, required: false, detail: "Desktop only", fix: "Install BasicTeX / MiKTeX on desktop." },
    { id: "browser", name: "Web demo data", ok: true, required: true, detail: "Seeded sample tracker + jobs in this browser", fix: "" },
  ],
  tracker: async () => load<Tracker>(KEY.tracker, { header: HEADER, rows: [], exists: false }),
  seen: async () => load<SeenJob[]>(KEY.seen, []),
  updateStatus: async (index: number, expected: string, status: string, note: string) => {
    const t = await api.tracker();
    const row = t.rows.find((r) => r.index === index);
    if (!row) throw new Error("row missing");
    if (canonical(row.fields.status) !== canonical(expected)) throw new Error("status changed elsewhere — reload");
    row.fields.status = status;
    if (note) {
      const prev = row.fields.notes || "";
      row.fields.notes = prev ? `${prev}; ${note}` : note;
    }
    save(KEY.tracker, t);
    emit("workspace-changed", { paths: ["tracker"] });
    return row;
  },
  appFolder: async (company: string, role: string): Promise<AppFolder> => ({
    name: `${company} — ${role}`,
    files: ["posting.md", "notes.md"],
    outcome: null,
    posting: `# ${role} at ${company}\n\nDemo posting text for the web app.`,
  }),
  profile: async (): Promise<ProfileFile[]> => [
    {
      path: "profile/skills.md",
      content: "---\ntitle: Skills\n---\n\n# Skills\n\n- Platform architecture\n- TypeScript / React\n- Agent systems\n\n_This is demo profile content stored in the browser._",
      placeholders: 0,
    },
  ],
  documents: async () => ({
    cv: ["cv/demo-cv.tex"],
    cover: ["cover_letters/demo-cover.tex"],
    cv_pdf: [],
    cover_pdf: [],
    reports: [],
  }),
  readText: async (rel: string) => `Demo file: ${rel}\n\nOpen the desktop app to edit real workspace files.`,
  absPath: async (rel: string) => `web://${rel}`,
  exists: async (_rel: string) => true,
  compile: async (_rel: string) => ({ ok: false, log: "PDF compile requires the desktop app (LaTeX).", pdf: "", pages: null }),
  verifyPdf: async (_rel: string) => ({ code: 1, stdout: "", stderr: "PDF verify requires the desktop app." }),
  postingGuard: async (text: string) => ({ code: 0, stdout: `web-demo: ${text.slice(0, 80)}`, stderr: "" }),
  startRun: async (workflow: string, prompt: string, _model?: string, _resume?: string) => {
    const id = crypto.randomUUID();
    const now = Date.now() / 1000;
    const run: RunSummary = {
      id,
      workflow,
      prompt,
      session_id: "",
      status: "failed",
      started_at: now,
      finished_at: now,
      cost_usd: null,
      summary: null,
      error: "Claude workflows run in the desktop apps (macOS / Windows). This web build keeps demo tracker data only.",
    };
    const runs = load<RunSummary[]>(KEY.runs, []);
    runs.unshift(run);
    save(KEY.runs, runs);
    window.setTimeout(() => {
      emit("run-event", {
        run_id: id, seq: 1, ts: Date.now(), kind: "assistant",
        data: { message: { content: [{ type: "text", text: run.error }] } },
      } satisfies RunEvent);
      emit("run-status", { run_id: id, status: "failed" });
    }, 80);
    return run;
  },
  respond: async (
    _runId: string,
    _requestId: string,
    _allow: boolean,
    _updatedInput?: any,
    _message?: string,
    _remember?: boolean,
  ) => undefined,
  send: async (_runId: string, _text: string) => undefined,
  finish: async (_runId: string) => undefined,
  cancel: async (_runId: string) => undefined,
  runs: async () => ({ runs: load<RunSummary[]>(KEY.runs, []), live: {} as Record<string, string> }),
  runEvents: async (runId: string) => ({
    events: [
      {
        run_id: runId, seq: 1, ts: Date.now(), kind: "assistant",
        data: { message: { content: [{ type: "text", text: "Use the desktop app for live Claude Code runs." }] } },
      },
    ] as RunEvent[],
    pending: [] as Pending[],
  }),
  getSetting: async (key: string) => load<Record<string, string>>(KEY.settings, {})[key] ?? null,
  setSetting: async (key: string, value: string) => {
    const s = load<Record<string, string>>(KEY.settings, {});
    s[key] = value;
    save(KEY.settings, s);
  },
};

export const fileUrl = (abs: string) => abs;
export const on = async <T,>(name: string, cb: (p: T) => void): Promise<UnlistenFn> => {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name)!.add(cb as (p: any) => void);
  return () => listeners.get(name)?.delete(cb as (p: any) => void);
};
/** Web build is never Tauri — store uses the browser API instead. */
export const inTauri = () => false;
export const isWeb = () => true;
