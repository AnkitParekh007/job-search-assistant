import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, Dep, inTauri, on, Pending, RunEvent, RunSummary, SeenJob, Tracker, Workspace } from "./api";

/** System notification, only while the window is unfocused. Text is generic on purpose: no posting or profile content goes to Notification Center. */
async function notify(status: string) {
  try {
    const n = await import("@tauri-apps/plugin-notification");
    let ok = await n.isPermissionGranted();
    if (!ok) ok = (await n.requestPermission()) === "granted";
    if (!ok) return;
    const body = { awaiting_approval: "Claude needs your approval to continue.", awaiting_input: "Claude is waiting for your reply.", completed: "A workflow finished.", failed: "A workflow failed. Open Agent Activity for details." }[status] || status;
    n.sendNotification({ title: "AI Job Search", body });
  } catch { /* notifications unavailable */ }
}

type Toast ={ id: number; tone: "good" | "bad" | "info"; text: string };

type Store = {
  ws: Workspace | null;
  tracker: Tracker | null;
  seen: SeenJob[];
  deps: Dep[] | null;
  dataError: string | null;
  loading: boolean;
  reload: () => Promise<void>;
  reloadDeps: () => Promise<void>;
  runs: RunSummary[];
  live: Record<string, string>;
  events: Record<string, RunEvent[]>;
  pending: Record<string, Pending[]>;
  loadRun: (id: string) => Promise<void>;
  refreshRuns: () => Promise<void>;
  startWorkflow: (workflow: string, prompt: string, resume?: string) => Promise<RunSummary | null>;
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
  route: string;
  go: (r: string) => void;
  focusRun: string | null;
  setFocusRun: (id: string | null) => void;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("store missing");
  return c;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [seen, setSeen] = useState<SeenJob[]>([]);
  const [deps, setDeps] = useState<Dep[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [live, setLive] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Record<string, RunEvent[]>>({});
  const [pending, setPending] = useState<Record<string, Pending[]>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [route, setRoute] = useState("dashboard");
  const [focusRun, setFocusRun] = useState<string | null>(null);
  const tid = useRef(0);

  const toast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const reload = useCallback(async () => {
    if (!inTauri()) { setLoading(false); setDataError("Preview mode — open the desktop app for live Claude runs and your workspace."); return; }
    try {
      const w = await api.workspace();
      setWs(w);
      const errs: string[] = [];
      const [t, s] = await Promise.all([
        api.tracker().catch((e) => { errs.push(String(e)); return null; }),
        api.seen().catch((e) => { errs.push(String(e)); return null; }),
      ]);
      if (t) setTracker(t);
      if (s) setSeen(s);
      setDataError(errs.length ? errs.join(" · ") : null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadDeps = useCallback(async () => { if (inTauri()) setDeps(await api.deps()); }, []);

  const refreshRuns = useCallback(async () => {
    if (!inTauri()) return;
    const r = await api.runs();
    setRuns(r.runs);
    setLive(r.live);
  }, []);

  const loadRun = useCallback(async (id: string) => {
    const r = await api.runEvents(id);
    setEvents((e) => ({ ...e, [id]: r.events }));
    setPending((p) => ({ ...p, [id]: r.pending }));
  }, []);

  const startWorkflow = useCallback(async (workflow: string, prompt: string, resume?: string) => {
    try {
      const model = (await api.getSetting("model")) || undefined;
      const r = await api.startRun(workflow, prompt, model, resume);
      setRuns((rs) => [r, ...rs]);
      setLive((l) => ({ ...l, [r.id]: "running" }));
      setEvents((e) => ({ ...e, [r.id]: [] }));
      setFocusRun(r.id);
      toast(`Started ${prompt.split(" ")[0]}`, "info");
      return r;
    } catch (e) {
      toast(String(e), "bad");
      return null;
    }
  }, [toast]);

  useEffect(() => {
    reload();
    reloadDeps();
    refreshRuns();
    if (!inTauri()) return;
    let timer: number | undefined;
    const subs = [
      on<{ paths: string[] }>("workspace-changed", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(reload, 350);
      }),
      on<RunEvent>("run-event", (ev) => {
        setEvents((e) => ({ ...e, [ev.run_id]: [...(e[ev.run_id] || []), ev].slice(-1500) }));
        if (ev.kind === "control:can_use_tool") {
          setPending((p) => ({ ...p, [ev.run_id]: [...(p[ev.run_id] || []), ev.data] }));
        }
        if (ev.kind === "bridge:answered") {
          setPending((p) => ({ ...p, [ev.run_id]: (p[ev.run_id] || []).filter((x) => x.request_id !== ev.data.request_id) }));
        }
      }),
      on<{ run_id: string; status: string }>("run-status", (s) => {
        if (!document.hasFocus() && ["awaiting_approval", "awaiting_input", "completed", "failed"].includes(s.status)) notify(s.status);
        setLive((l) => {
          const n = { ...l, [s.run_id]: s.status };
          // Keep awaiting_* in live; drop anything terminal so badges/composer can't zombie.
          if (!["running", "starting", "awaiting_approval", "awaiting_input"].includes(s.status)) delete n[s.run_id];
          return n;
        });
        setRuns((rs) => rs.map((r) => (r.id === s.run_id ? { ...r, status: s.status } : r)));
        if (["completed", "failed", "cancelled", "interrupted", "awaiting_input"].includes(s.status)) refreshRuns();
      }),
    ];
    return () => { subs.forEach((p) => p.then((u) => u())); };
  }, [reload, reloadDeps, refreshRuns]);

  const value = useMemo(
    () => ({ ws, tracker, seen, deps, dataError, loading, reload, reloadDeps, runs, live, events, pending, loadRun, refreshRuns, startWorkflow, toasts, toast, route, go: setRoute, focusRun, setFocusRun }),
    [ws, tracker, seen, deps, dataError, loading, reload, reloadDeps, runs, live, events, pending, loadRun, refreshRuns, startWorkflow, toasts, toast, route, focusRun],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
