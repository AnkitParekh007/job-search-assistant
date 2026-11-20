import type React from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Command } from "cmdk";
import clsx from "clsx";
import { Activity, BriefcaseBusiness, CircleCheck, CircleX, FileText, GraduationCap, Hand, Info, PanelLeft, Search, Settings as Cog, Sparkles, SquareKanban, Sun, User, Workflow as Flow } from "lucide-react";
import { StoreProvider, useStore } from "./store";
import { WORKFLOWS } from "@ai-job-search/core";
import { api, inTauri } from "@ai-job-search/runtime";
import { Kbd } from "./components/ui";
import { BrandMark } from "./components/BrandMark";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Pipeline from "./pages/Pipeline";
import Studio from "./pages/Studio";
import ActivityPage from "./pages/Activity";
import Automations from "./pages/Automations";
import Profile from "./pages/Profile";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Interview from "./pages/Interview";
import Onboarding from "./pages/Onboarding";

type NavItem = { id: string; label: string; icon: any; key: string };
export const NAV_GROUPS: { title: string | null; items: NavItem[] }[] = [
  { title: null, items: [{ id: "dashboard", label: "Today", icon: Sun, key: "1" }] },
  { title: "Find", items: [{ id: "jobs", label: "Jobs", icon: BriefcaseBusiness, key: "2" }] },
  { title: "Apply", items: [{ id: "studio", label: "Studio", icon: Sparkles, key: "3" }, { id: "documents", label: "Documents", icon: FileText, key: "4" }] },
  { title: "Track", items: [{ id: "pipeline", label: "Pipeline", icon: SquareKanban, key: "5" }, { id: "interview", label: "Interview Prep", icon: GraduationCap, key: "6" }] },
  { title: "Automation", items: [{ id: "activity", label: "Agent Activity", icon: Activity, key: "7" }, { id: "automations", label: "Workflows", icon: Flow, key: "8" }] },
  { title: "You", items: [{ id: "profile", label: "Profile", icon: User, key: "9" }, { id: "settings", label: "Settings", icon: Cog, key: "," }] },
];
export const NAV = NAV_GROUPS.flatMap((g) => g.items);

function Sidebar({ collapsed }: { collapsed: boolean }) {
  const { route, go, live, ws } = useStore();
  const active = Object.entries(live).filter(([, s]) => ["running", "starting", "awaiting_approval", "awaiting_input"].includes(s));
  const liveCount = active.length;
  const waiting = active.filter(([, s]) => s.startsWith("awaiting")).length;
  return (
    <motion.aside animate={{ width: collapsed ? 64 : 224 }} transition={{ type: "spring", stiffness: 420, damping: 40 }} className="shrink-0 bg-sidebar border-r border-line flex flex-col overflow-hidden">
      <div className="h-[52px] drag shrink-0" />
      <div className={clsx("px-2.5 pb-3 shrink-0", collapsed ? "flex justify-center" : "")}>
        <div className={clsx("flex items-center gap-2.5 min-w-0", collapsed ? "justify-center" : "px-1")}>
          <BrandMark size={collapsed ? 28 : 26} className="shrink-0" />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="text-[13px] font-semibold text-ink truncate">AI Job <span className="text-accent-ink">Search</span></div>
            </div>
          )}
        </div>
      </div>
      <nav className="flex-1 px-2.5 overflow-y-auto overflow-x-hidden" aria-label="Main">
        {NAV_GROUPS.map((g, gi) => (
          <div key={gi} className={gi ? "mt-4" : ""}>
            {g.title && !collapsed && <div className="label px-2.5 mb-1">{g.title}</div>}
            {g.items.map((n) => {
              const active = route === n.id;
              return (
                <button key={n.id} onClick={() => go(n.id)} title={collapsed ? `${n.label} (⌘${n.key})` : undefined} aria-current={active ? "page" : undefined}
                  className={clsx("relative w-full flex items-center gap-2.5 h-[30px] px-2.5 rounded-[9px] text-[13px] transition-colors", active ? "text-ink font-medium" : "text-ink-2 hover:text-ink hover:bg-surface-2")}>
                  {active && <span className="absolute inset-0 rounded-[9px] bg-surface-3 border border-line" />}
                  <n.icon size={15} className={clsx("relative shrink-0", active && "text-accent")} />
                  {!collapsed && <span className="relative flex-1 text-left truncate">{n.label}</span>}
                  {n.id === "activity" && liveCount > 0 && (
                    <span className={clsx("relative", collapsed ? "absolute top-1 right-1 w-2 h-2 rounded-full" : "chip", waiting ? (collapsed ? "bg-you" : "bg-you-soft text-you") : (collapsed ? "bg-ai" : "bg-ai-soft text-ai"))}>{!collapsed && (waiting ? `${waiting} needs you` : `${liveCount} live`)}</span>
                  )}
                </button>);
            })}
          </div>))}
      </nav>
      {!collapsed && <div className="px-4 py-3 text-[11px] text-ink-3 leading-snug border-t border-line">
        <div className="font-medium text-ink-2">Local workspace</div>
        <div className="truncate font-mono">{ws?.upstream_version ? `ai-job-search ${ws.upstream_version}` : "not connected"}</div>
      </div>}
    </motion.aside>
  );
}

function Palette({ open, setOpen }: { open: boolean; setOpen: (b: boolean) => void }) {
  const { go, tracker, seen, startWorkflow } = useStore();
  const pick = (fn: () => void) => { fn(); setOpen(false); };
  const item = "flex items-center gap-2.5 px-2.5 h-8 rounded-lg text-[13px] data-[selected=true]:bg-accent data-[selected=true]:text-white";
  const group = "[&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:pb-1";
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 bg-black/40 flex justify-center pt-[13vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} onClick={() => setOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.97, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.14, ease: "easeOut" }} onClick={(e) => e.stopPropagation()} className="h-fit">
            <Command className="sheet w-[640px] overflow-hidden" label="Command palette" loop>
              <div className="flex items-center gap-2.5 px-4 border-b border-line"><Search size={16} className="text-ink-3" /><Command.Input autoFocus placeholder="Jump to a page, run a workflow, find an application or job…" className="flex-1 h-12 bg-transparent outline-none text-[14px] placeholder:text-ink-3" /><Kbd>esc</Kbd></div>
              <Command.List className="max-h-[400px] overflow-auto p-1.5">
                <Command.Empty className="p-6 text-center text-ink-3">Nothing matches.</Command.Empty>
                <Command.Group heading="Go to" className={group}>
                  {NAV.map((n) => <Command.Item key={n.id} onSelect={() => pick(() => go(n.id))} className={item}><n.icon size={14} /><span className="flex-1">{n.label}</span><span className="text-[11px] opacity-60">⌘{n.key}</span></Command.Item>)}
                </Command.Group>
                <Command.Group heading="Run with Claude" className={group}>
                  {WORKFLOWS.filter((w) => !w.args?.some((a) => !a.optional)).map((w) => <Command.Item key={w.id} value={`run ${w.command} ${w.title}`} onSelect={() => pick(() => { if (w.id === "reset") { sessionStorage.setItem("wf", w.id); go("automations"); } else startWorkflow(w.id, w.command).then((r) => r && go("activity")); })} className={item}><Flow size={14} /><span className="font-mono text-[12px] opacity-70 w-24">{w.command}</span>{w.title}</Command.Item>)}
                  {WORKFLOWS.filter((w) => w.args?.some((a) => !a.optional)).map((w) => <Command.Item key={w.id} value={`${w.command} ${w.title}`} onSelect={() => pick(() => { sessionStorage.setItem("wf", w.id); go(w.id === "apply" ? "studio" : "automations"); })} className={item}><Flow size={14} /><span className="font-mono text-[12px] opacity-70 w-24">{w.command}</span>{w.title}…</Command.Item>)}
                </Command.Group>
                {!!tracker?.rows.length && <Command.Group heading="Applications" className={group}>
                  {tracker.rows.map((r) => <Command.Item key={r.index} value={`app ${r.fields.company} ${r.fields.role}`} onSelect={() => pick(() => { sessionStorage.setItem("openApp", String(r.index)); go("pipeline"); })} className={item}><SquareKanban size={14} />{r.fields.company}<span className="opacity-60">· {r.fields.role}</span></Command.Item>)}
                </Command.Group>}
                {!!seen.length && <Command.Group heading="Jobs" className={group}>
                  {seen.slice(0, 80).map((j) => <Command.Item key={j.key} value={`job ${j.company} ${j.title} ${j.key}`} onSelect={() => pick(() => { sessionStorage.setItem("openJob", j.key); go("jobs"); })} className={item}><BriefcaseBusiness size={14} />{j.company}<span className="opacity-60 truncate">· {j.title}</span></Command.Item>)}
                </Command.Group>}
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>)}
    </AnimatePresence>
  );
}

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[360px] pointer-events-none" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 24 }} transition={{ type: "spring", stiffness: 500, damping: 38 }} className="sheet !rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 pointer-events-auto" role="status">
            {t.tone === "good" ? <CircleCheck size={15} className="text-good mt-0.5 shrink-0" /> : t.tone === "bad" ? <CircleX size={15} className="text-bad mt-0.5 shrink-0" /> : <Info size={15} className="text-accent mt-0.5 shrink-0" />}
            <div className="text-[12.5px] leading-snug selectable break-words min-w-0 whitespace-pre-wrap">{t.text}</div>
          </motion.div>))}
      </AnimatePresence>
    </div>
  );
}

/** Persistent strip whenever any run is waiting on the user, wherever they are. */
function NeedsYou() {
  const { live, runs, go, setFocusRun, route } = useStore();
  const waiting = Object.entries(live).filter(([, s]) => s.startsWith("awaiting"));
  if (!waiting.length || route === "activity") return null;
  const [id, s] = waiting[0];
  const run = runs.find((r) => r.id === id);
  return (
    <motion.button initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} onClick={() => { setFocusRun(id); go("activity"); }}
      className="mx-6 mb-3 flex items-center gap-2.5 rounded-xl border border-you/40 bg-you-soft px-3.5 h-9 text-left text-[12.5px]">
      <Hand size={14} className="text-you" /><span className="font-semibold text-you">{s === "awaiting_approval" ? "Claude needs your approval" : "Claude is waiting for your reply"}</span>
      <span className="text-ink-2 truncate flex-1 font-mono">{run?.prompt.split("\n")[0].slice(0, 60)}</span>
      {waiting.length > 1 && <span className="chip bg-you text-white">+{waiting.length - 1}</span>}<span className="text-you font-medium">Review →</span>
    </motion.button>
  );
}

function Shell() {
  const { route, go, dataError, ws, loading } = useStore();
  const [palette, setPalette] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [onboard, setOnboard] = useState<boolean | null>(null);
  const prev = useRef(route);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "k") { e.preventDefault(); setPalette((p) => !p); }
      if (e.metaKey && e.key === "\\") { e.preventDefault(); setCollapsed((c) => !c); }
      if (e.metaKey && !e.shiftKey && !e.altKey) { const n = NAV.find((x) => x.key === e.key); if (n) { e.preventDefault(); go(n.id); } }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);
  useEffect(() => {
    if (!inTauri()) { setOnboard(false); return; }
    api.getSetting("theme").then((t) => { const v = t || "dark"; if (v === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v; });
    api.getSetting("onboarded").then((o) => setOnboard(o !== "1"));
  }, []);
  useEffect(() => { prev.current = route; }, [route]);
  const Page = ({ dashboard: Dashboard, jobs: Jobs, pipeline: Pipeline, studio: Studio, activity: ActivityPage, automations: Automations, profile: Profile, documents: Documents, settings: Settings, interview: Interview } as Record<string, React.ComponentType>)[route] || Dashboard;
  if (onboard && !loading) return <Onboarding onDone={() => { api.setSetting("onboarded", "1"); setOnboard(false); }} />;
  return (
    <div className="h-full flex">
      <Sidebar collapsed={collapsed} />
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="h-[52px] shrink-0 drag flex items-center px-3 gap-1">
          <button className="no-drag btn btn-ghost h-7 w-7 p-0 justify-center text-ink-3" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar (⌘\)" aria-label="Toggle sidebar"><PanelLeft size={15} /></button>
          <div className="flex-1" />
          <button className="no-drag btn h-8 text-ink-2 gap-2 px-3 border-line bg-surface shadow-sm" onClick={() => setPalette(true)}><Search size={13} className="text-ink-3" />Search or run…<Kbd>⌘K</Kbd></button>
        </div>
        <NeedsYou />
        {(dataError || (ws && !ws.valid)) && (
          <div className="mx-6 mb-3 rounded-lg border border-line bg-surface-2 text-ink-2 px-3.5 py-2 text-[12.5px] flex items-center gap-2">
            <Info size={14} className="shrink-0 text-warn" /><span className="flex-1">{ws && !ws.valid ? `No AI Job Search workspace at ${ws.path}.` : dataError}</span>
            {ws && !ws.valid && <button className="btn h-6 btn-primary" onClick={() => go("settings")}>Choose workspace</button>}
          </div>)}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* No exit animation: the old page unmounts immediately, so navigation never waits on frames. */}
          <motion.div key={route} className="h-full" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}>
            <Page />
          </motion.div>
        </div>
      </main>
      <Palette open={palette} setOpen={setPalette} />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
