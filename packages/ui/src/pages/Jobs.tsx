import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api, openUrl } from "@ai-job-search/runtime";
import clsx from "clsx";
import { Check, Columns2, ExternalLink, HeartPulse, LayoutGrid, ListOrdered, MapPin, Minus, Plus, Radar, Rows3, Search, ShieldAlert, Sparkles, X } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { SeenJob } from "@ai-job-search/runtime";
import { workflowBlockedReason, workflowReady } from "@ai-job-search/core";
import { useStore } from "../store";
import { ContextMenu, Empty, MenuItem, ScoreRing } from "../components/ui";
import { AddPortalAction } from "../components/DepFixActions";

const VERDICT: Record<string, string> = { PASS: "bg-good-soft text-good", FLAG: "bg-warn-soft text-warn", FAIL: "bg-bad-soft text-bad" };

function jobRemote(j: SeenJob): boolean | null {
  if (j.remote === true) return true;
  if (j.remote === false) return false;
  const loc = (j.location || "").toLowerCase();
  if (/\bremote\b/.test(loc)) return true;
  return null;
}

function ManualJobDialog({ onClose }: { onClose: () => void }) {
  const { toast, reload } = useStore();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !company.trim()) {
      toast("Title and company are required.", "bad");
      return;
    }
    setBusy(true);
    try {
      await api.upsertJob({
        title: title.trim(),
        company: company.trim(),
        url: url.trim() || undefined,
        location: location.trim() || undefined,
        remote,
        status: "new",
        source: "manual",
      });
      await reload();
      toast(`${company.trim()}: job saved`, "good");
      onClose();
    } catch (e) {
      toast(String(e), "bad");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-40 bg-black/40 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <motion.div className="sheet w-[520px] p-6" initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 32 }} onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold text-[16px]">Add job manually</div>
        <div className="text-ink-2 mt-1 text-[12.5px]">Saves into seen jobs with manual provenance — no scrape required.</div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="col-span-2"><label className="label block mb-1">Title</label><input className="input w-full" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="col-span-2 sm:col-span-1"><label className="label block mb-1">Company</label><input className="input w-full" value={company} onChange={(e) => setCompany(e.target.value)} /></div>
          <div className="col-span-2 sm:col-span-1"><label className="label block mb-1">Location</label><input className="input w-full" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or Remote" /></div>
          <div className="col-span-2"><label className="label block mb-1">URL</label><input className="input w-full" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
          <label className="col-span-2 flex items-center gap-2 text-[12.5px] text-ink-2">
            <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
            Remote role
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Add job"}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Gate({ label, v, note }: { label: string; v?: string; note?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 border border-line p-3">
      <div className="label">{label}</div>
      <div className="mt-1.5 flex items-center gap-2">{v ? <span className={clsx("chip", VERDICT[v] || "bg-surface-3 text-ink-2")}>{v}</span> : <span className="text-ink-3 text-[12px]">not checked yet</span>}</div>
      {note && <div className="text-[11.5px] text-ink-2 mt-1.5 selectable">{note}</div>}
    </div>
  );
}

function JobDetail({ j, onClose }: { j: SeenJob; onClose: () => void }) {
  const { go } = useStore();
  const ranked = j.rank_score != null;
  return (
    <motion.div key={j.key} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }} className="h-full overflow-auto bg-surface">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <ScoreRing score={j.rank_score} fit={j.fit} size={56} />
          <div className="flex-1 min-w-0">
            <div className="text-ink-3 text-[12px]">{j.company}</div>
            <div className="h-section !text-[17px] leading-snug selectable">{j.title}</div>
            <div className="text-ink-2 text-[12.5px] mt-1 flex items-center gap-1"><MapPin size={12} />{j.location || "location not recorded"}</div>
          </div>
          <button className="btn btn-ghost h-7 w-7 p-0 justify-center" onClick={onClose} aria-label="Close details"><X size={14} /></button>
        </div>
        <div className="flex gap-2 mt-5">
          <button className="btn btn-primary btn-lg" onClick={() => { sessionStorage.setItem("studioUrl", j.url); go("studio"); }}><Sparkles size={14} />Evaluate & apply</button>
          <button className="btn btn-lg" onClick={() => openUrl(j.url)}><ExternalLink size={14} />Original posting</button>
        </div>
        {(j.source === "websearch" || j.status === "expired") && (
          <div className={clsx("mt-4 rounded-xl px-3.5 py-2.5 text-[12px] flex gap-2", j.status === "expired" ? "bg-bad-soft text-bad" : "bg-info-soft text-info")}>
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            {j.status === "expired" ? "Marked expired or unreachable when it was last fetched." : "Found through the web-search fallback. Search indexes can be stale, so a saved link doesn't prove the role is still open. Evaluate re-checks it."}
          </div>)}

        <div className="mt-6">
          <div className="h-section mb-1">{ranked ? `Scored ${j.rank_score}/100 · ${j.rank_verdict}` : "Preliminary fit only"}</div>
          <div className="text-ink-3 text-[12px]">{ranked ? `By /rank's rubric on ${j.rank_date}. The app shows the stored score and never adjusts it.` : `/scrape's quick check rated this "${j.fit || "unknown"}". Rank it for a scored breakdown, or Evaluate for the full assessment.`}</div>
          <div className="grid grid-cols-2 gap-2 mt-3"><Gate label="Location" v={j.location_verdict} /><Gate label="Language" v={j.language_gate} note={j.language_note} /></div>
          {!!j.strengths?.length && <div className="mt-4"><div className="label mb-2">Why it fits</div><ul className="space-y-1.5">{j.strengths.map((s, i) => <li key={i} className="flex gap-2 text-[12.5px] text-ink-2"><Check size={14} className="text-good shrink-0 mt-0.5" /><span className="selectable">{s}</span></li>)}</ul></div>}
          {!!j.gaps?.length && <div className="mt-4"><div className="label mb-2">Gaps to address</div><ul className="space-y-1.5">{j.gaps.map((s, i) => <li key={i} className="flex gap-2 text-[12.5px] text-ink-2"><Minus size={14} className="text-bad shrink-0 mt-0.5" /><span className="selectable">{s}</span></li>)}</ul></div>}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-6 text-[12px]">
          {[["First seen", j.first_seen], ["Published", j.posted_date ?? "unknown"], ["Deadline", j.deadline ?? "none stated"], ["Employment", j.employment_type ?? "not stated"], ["Found via", `${j.source === "cli" ? "portal CLI" : "web search"}${j.portal && j.portal !== "websearch" ? ` · ${j.portal}` : ""}`], ["Status", j.status]].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-line"><span className="text-ink-3">{k}</span><span className="font-medium tnum">{v || "—"}</span></div>))}
        </div>
      </div>
    </motion.div>
  );
}

function Compare({ jobs, onClose }: { jobs: SeenJob[]; onClose: () => void }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  const best = Math.max(...jobs.map((j) => j.rank_score ?? -1));
  return (
    <motion.div className="fixed inset-0 z-40 bg-black/40 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sheet w-[min(1100px,92vw)] max-h-[82vh] overflow-auto p-6" initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-1"><div className="h-section !text-[17px] flex-1">Compare {jobs.length} jobs</div><button className="btn btn-ghost" onClick={onClose}><X size={14} /></button></div>
        <div className="text-[12px] text-ink-3 mb-5">Scores are /rank's stored rubric output. Unranked jobs show their preliminary fit only.</div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${jobs.length}, minmax(0,1fr))` }}>
          {jobs.map((j) => (
            <div key={j.key} className={clsx("rounded-2xl border p-4", j.rank_score != null && j.rank_score === best ? "border-accent bg-accent-soft/30" : "border-line")}>
              <div className="flex items-center gap-3"><ScoreRing score={j.rank_score} fit={j.fit} size={44} /><div className="min-w-0"><div className="font-medium truncate">{j.company}</div><div className="text-ink-3 text-[12px] truncate">{j.title}</div></div></div>
              <div className="text-[12px] text-ink-2 mt-3">{j.location || "—"}</div>
              <div className="flex gap-1.5 mt-2">{j.location_verdict && <span className={clsx("chip", VERDICT[j.location_verdict])}>Location {j.location_verdict}</span>}{j.language_gate && <span className={clsx("chip", VERDICT[j.language_gate])}>Language {j.language_gate}</span>}</div>
              <div className="label mt-4 mb-1">Fits</div>{(j.strengths || []).length ? j.strengths!.map((s, i) => <div key={i} className="text-[12px] text-ink-2 flex gap-1.5"><Check size={12} className="text-good mt-0.5 shrink-0" />{s}</div>) : <div className="text-[12px] text-ink-3">not ranked</div>}
              <div className="label mt-3 mb-1">Gaps</div>{(j.gaps || []).length ? j.gaps!.map((s, i) => <div key={i} className="text-[12px] text-ink-2 flex gap-1.5"><Minus size={12} className="text-bad mt-0.5 shrink-0" />{s}</div>) : <div className="text-[12px] text-ink-3">not ranked</div>}
            </div>))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Jobs() {
  const { seen, startWorkflow, go, tracker, deps, toast } = useStore();
  const [provider, setProvider] = useState("claude");
  useEffect(() => {
    api.getSetting("ai_provider").then((p) => setProvider((p || "claude").trim())).catch(() => setProvider("claude"));
  }, [deps]);
  const scrapeReady = workflowReady(deps, provider, "scrape");
  const scrapeBlock = workflowBlockedReason(deps, provider, "scrape");
  const rankReady = workflowReady(deps, provider, "rank");
  const rankBlock = workflowBlockedReason(deps, provider, "rank");
  /** Prefer URL/source match (UX-05); fall back to company|title. */
  const trackedFor = useMemo(() => {
    const rows = tracker?.rows || [];
    return (j: SeenJob): string | undefined => {
      const url = (j.url || "").trim().toLowerCase();
      if (url) {
        const byUrl = rows.find((r) => (r.fields.source || "").trim().toLowerCase() === url);
        if (byUrl) return byUrl.fields.status;
      }
      return rows.find((r) => `${r.fields.company}|${r.fields.role}`.toLowerCase() === `${j.company}|${j.title}`.toLowerCase())?.fields.status;
    };
  }, [tracker]);
  const [q, setQ] = useState("");
  const [fit, setFit] = useState<string>(sessionStorage.getItem("jobFit") || "all");
  const [status, setStatus] = useState("active");
  const [remote, setRemote] = useState<"all" | "yes" | "no">("all");
  const [seniority, setSeniority] = useState("all");
  const [salaryMin, setSalaryMin] = useState("");
  const [view, setView] = useState<"cards" | "table">(() => (localStorage.getItem("jobsView") as any) || "cards");
  const [sel, setSel] = useState<string | null>(sessionStorage.getItem("openJob"));
  const [cmp, setCmp] = useState<Set<string>>(new Set());
  const [showCmp, setShowCmp] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; j: SeenJob } | null>(null);
  const [focus, setFocus] = useState("");
  const [showAddPortal, setShowAddPortal] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);
  useEffect(() => { sessionStorage.removeItem("jobFit"); sessionStorage.removeItem("openJob"); }, []);
  useEffect(() => { try { localStorage.setItem("jobsView", view); } catch { /* storage unavailable */ } }, [view]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !showCmp && !showAddJob) setSel(null); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [showCmp, showAddJob]);

  const hasSeniority = seen.some((j) => !!j.seniority);
  const hasSalary = seen.some((j) => j.salaryMin != null);
  const seniorityOpts = useMemo(() => {
    const s = new Set<string>();
    for (const j of seen) if (j.seniority) s.add(j.seniority);
    return [...s].sort();
  }, [seen]);

  const list = useMemo(() => {
    const t = q.toLowerCase();
    const minSal = salaryMin === "" ? null : Number(salaryMin);
    return seen
      .filter((j) => !t || `${j.title} ${j.company} ${j.location}`.toLowerCase().includes(t))
      .filter((j) => fit === "all" || j.fit === fit)
      .filter((j) => status === "all" || (status === "active" ? !["expired", "skipped"].includes(j.status || "") : j.status === status))
      .filter((j) => {
        if (remote === "all") return true;
        const r = jobRemote(j);
        if (remote === "yes") return r === true;
        return r === false;
      })
      .filter((j) => seniority === "all" || j.seniority === seniority)
      .filter((j) => minSal == null || Number.isNaN(minSal) || (j.salaryMin != null && j.salaryMin >= minSal))
      .sort((a, b) => (b.rank_score ?? -1) - (a.rank_score ?? -1) || ["high", "medium", "low"].indexOf(a.fit || "") - ["high", "medium", "low"].indexOf(b.fit || "") || (b.first_seen || "").localeCompare(a.first_seen || ""));
  }, [seen, q, fit, status, remote, seniority, salaryMin]);
  const hidden = seen.length - list.length;
  // UX-08: clear detail when filtered list no longer contains the selection
  useEffect(() => {
    if (sel && !list.some((j) => j.key === sel)) setSel(null);
  }, [list, sel]);
  const current = list.find((j) => j.key === sel);
  const run = (wf: string, p: string) => {
    if (!workflowReady(deps, provider, wf)) {
      toast(workflowBlockedReason(deps, provider, wf) || "Sign in to an AI provider in Settings first.", "bad");
      go("settings");
      return Promise.resolve();
    }
    return startWorkflow(wf, p).then((r) => r && go("activity"));
  };
  const toggleCmp = (k: string) => setCmp((c) => { const n = new Set(c); n.has(k) ? n.delete(k) : n.size < 4 && n.add(k); return n; });
  const clearFilters = () => { setQ(""); setFit("all"); setStatus("all"); setRemote("all"); setSeniority("all"); setSalaryMin(""); };
  const menuItems = (j: SeenJob): MenuItem[] => [
    { label: "Evaluate & apply", onSelect: () => { sessionStorage.setItem("studioUrl", j.url); go("studio"); } },
    { label: "Open original posting", onSelect: () => openUrl(j.url) },
    "sep",
    { label: cmp.has(j.key) ? "Remove from comparison" : "Add to comparison", onSelect: () => toggleCmp(j.key), disabled: !cmp.has(j.key) && cmp.size >= 4 },
    { label: "Copy link", onSelect: () => navigator.clipboard?.writeText(j.url) },
  ];
  const pipelineBadge = (j: SeenJob) => {
    const st = trackedFor(j);
    return st ? <span className="chip bg-accent-soft text-accent-ink">In pipeline · {st}</span> : null;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-1 pb-4 flex flex-wrap items-end gap-x-3 gap-y-3">
        <div className="flex-1 min-w-[160px]"><h1 className="h-title">Jobs</h1><div className="text-ink-2 mt-0.5">{seen.length === 0 ? "Search portals or the web for real postings" : `${list.length} shown${hidden ? ` · ${hidden} hidden by filters` : ""}`}</div></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface p-1 pl-2.5">
            <Radar size={14} className="text-ai shrink-0" />
            <input className="bg-transparent outline-none w-40 sm:w-48 text-[12.5px] placeholder:text-ink-3" placeholder="Focus, e.g. AI agents" value={focus} onChange={(e) => setFocus(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run("scrape", focus.trim() ? `/scrape ${focus.trim()}` : "/scrape")} />
            <button className="btn btn-primary" disabled={!scrapeReady} title={scrapeBlock || undefined} onClick={() => run("scrape", focus.trim() ? `/scrape ${focus.trim()}` : "/scrape")}>Find jobs</button>
          </div>
          {seen.length > 0 && <button className="btn btn-lg" disabled={!rankReady} title={rankBlock || undefined} onClick={() => run("rank", "/rank")}><ListOrdered size={14} />Rank new</button>}
          <button className="btn btn-lg" onClick={() => setShowAddJob(true)}><Plus size={14} />Add job manually</button>
          <button className="btn btn-lg" title="Add a job-board portal scraper" onClick={() => setShowAddPortal((v) => !v)} aria-label="Add portal"><Plus size={14} />Add portal</button>
          <button className="btn btn-lg btn-ghost" title="Probe installed portal CLIs" onClick={() => run("scrape", "/scrape health")} aria-label="Probe installed portal CLIs"><HeartPulse size={14} /></button>
        </div>
      </div>
      {showAddPortal && (
        <div className="px-6 pb-3">
          <div className="card p-4 max-w-xl">
            <div className="font-medium text-[13px] mb-1">Add a portal</div>
            <div className="text-ink-3 text-[12px] mb-2">Runs the guided portal workflow with your active AI provider — no Terminal or Claude Code hop required.</div>
            <AddPortalAction onStarted={() => setShowAddPortal(false)} />
          </div>
        </div>
      )}
      {seen.length > 0 && (
      <div className="px-6 pb-3 flex flex-wrap items-center gap-2">
        <div className="relative"><Search size={13} className="absolute left-2.5 top-[9px] text-ink-3" /><input className="input pl-8 w-56 sm:w-64" placeholder="Filter title, company, place" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex rounded-[10px] border border-line bg-surface-2 p-0.5">{["all", "high", "medium", "low"].map((f) => <button key={f} onClick={() => setFit(f)} className={clsx("h-6 px-2.5 rounded-lg text-[12px] capitalize", fit === f ? "bg-surface-3 text-ink font-medium shadow-sm" : "text-ink-3 hover:text-ink")}>{f === "all" ? "Any fit" : f}</button>)}</div>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="active">Open</option><option value="all">All</option><option value="new">New</option><option value="ranked">Ranked</option><option value="skipped">Skipped</option><option value="expired">Expired</option></select>
        <select className="input" value={remote} onChange={(e) => setRemote(e.target.value as "all" | "yes" | "no")} aria-label="Remote">
          <option value="all">Any remote</option>
          <option value="yes">Remote</option>
          <option value="no">Not remote</option>
        </select>
        {hasSeniority && (
          <select className="input" value={seniority} onChange={(e) => setSeniority(e.target.value)} aria-label="Seniority">
            <option value="all">Any seniority</option>
            {seniorityOpts.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {hasSalary && (
          <input className="input w-28" type="number" min={0} placeholder="Min salary" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} aria-label="Minimum salary" />
        )}
        <div className="flex-1" />
        <AnimatePresence>{cmp.size >= 2 && <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="btn" onClick={() => setShowCmp(true)}><Columns2 size={14} />Compare {cmp.size}</motion.button>}</AnimatePresence>
        <div className="flex rounded-[10px] border border-line bg-surface-2 p-0.5">
          <button aria-label="Card view" onClick={() => setView("cards")} className={clsx("h-6 w-7 grid place-items-center rounded-lg", view === "cards" ? "bg-surface-3 text-ink" : "text-ink-3")}><LayoutGrid size={13} /></button>
          <button aria-label="Table view" onClick={() => setView("table")} className={clsx("h-6 w-7 grid place-items-center rounded-lg", view === "table" ? "bg-surface-3 text-ink" : "text-ink-3")}><Rows3 size={13} /></button>
        </div>
      </div>
      )}
      <Group orientation="horizontal" className="flex-1 min-h-0 border-t border-line">
        <Panel defaultSize={current ? 58 : 100} minSize={35}>
          <div className="h-full overflow-auto">
            {list.length === 0 ? <Empty icon={<Radar size={18} />} title={seen.length ? "No jobs match these filters" : "No jobs discovered yet"} body={seen.length ? `${hidden} job${hidden === 1 ? " is" : "s are"} hidden by the current filters.` : "Find jobs searches your installed portals, or the web if you have none. Add a portal if you want a board-specific scraper — or add a job manually."} action={seen.length ? <button className="btn" onClick={clearFilters}>Clear filters</button> : <div className="flex flex-wrap gap-2 justify-center"><button className="btn btn-primary" disabled={!scrapeReady} title={scrapeBlock || undefined} onClick={() => run("scrape", "/scrape")}>Find jobs</button><button className="btn" onClick={() => setShowAddJob(true)}><Plus size={14} />Add job manually</button><button className="btn" onClick={() => setShowAddPortal(true)}><Plus size={14} />Add portal</button></div>} /> :
              view === "cards" ? (
                <div className="p-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                  {list.map((j, i) => (
                    <motion.div key={j.key} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02, duration: 0.18 }}
                      role="button" tabIndex={0} onClick={() => setSel(j.key)} onKeyDown={(e) => e.key === "Enter" && setSel(j.key)} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, j }); }}
                      className={clsx("card p-4 cursor-default transition-colors group", sel === j.key ? "border-accent" : "hover:border-line-strong", j.status === "expired" && "opacity-55")}>
                      <div className="flex items-start gap-3">
                        <ScoreRing score={j.rank_score} fit={j.fit} />
                        <div className="flex-1 min-w-0"><div className="font-medium leading-snug line-clamp-2">{j.title}</div><div className="text-ink-2 text-[12px] mt-0.5 truncate flex items-center gap-1.5">{j.company}{pipelineBadge(j)}</div></div>
                        <button aria-label="Compare" title="Add to comparison" onClick={(e) => { e.stopPropagation(); toggleCmp(j.key); }} className={clsx("w-5 h-5 rounded-md border grid place-items-center shrink-0 transition-opacity", cmp.has(j.key) ? "bg-accent border-accent text-white" : "border-line-strong opacity-55 group-hover:opacity-100 focus:opacity-100")}>{cmp.has(j.key) && <Check size={11} />}</button>
                      </div>
                      <div className="flex items-center gap-1.5 mt-3 text-[11.5px] text-ink-3"><MapPin size={11} /><span className="truncate flex-1">{j.location || "—"}</span><span className="tnum">{j.first_seen}</span></div>
                      {(j.gaps?.length || j.strengths?.length) ? <div className="mt-2 text-[11.5px] text-ink-2 line-clamp-1">{j.strengths?.[0]}</div> : null}
                    </motion.div>))}
                </div>
              ) : (
                <table className="w-full text-[12.5px]">
                  <thead className="sticky top-0 bg-bg z-10"><tr className="text-left text-ink-3 text-[11px]"><th className="w-8 pl-5" /><th className="py-2 w-10">Fit</th><th>Role</th><th>Company</th><th>Location</th><th>Found</th><th className="pr-5">Status</th></tr></thead>
                  <tbody>{list.map((j) => {
                    const badge = pipelineBadge(j);
                    return (
                    <tr key={j.key} onClick={() => setSel(j.key)} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, j }); }} className={clsx("border-t border-line", sel === j.key ? "bg-accent-soft/50" : "row-hover", j.status === "expired" && "opacity-55")}>
                      <td className="pl-5" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label="Compare" checked={cmp.has(j.key)} onChange={() => toggleCmp(j.key)} /></td>
                      <td className="py-1.5"><ScoreRing score={j.rank_score} fit={j.fit} size={26} /></td>
                      <td className="pr-3 max-w-[320px]"><div className="truncate font-medium">{j.title}</div></td>
                      <td className="pr-3 truncate max-w-[160px] text-ink-2">{j.company}{badge && <span className="ml-1">{badge}</span>}</td>
                      <td className="pr-3 text-ink-3 truncate max-w-[180px]">{j.location}</td>
                      <td className="pr-3 text-ink-3 tnum">{j.first_seen}</td>
                      <td className="pr-5 text-ink-3">{j.status}</td>
                    </tr>);
                  })}</tbody>
                </table>)}
          </div>
        </Panel>
        {current && <><Separator className="w-px bg-line hover:bg-accent transition-colors" /><Panel defaultSize={42} minSize={30}><JobDetail j={current} onClose={() => setSel(null)} /></Panel></>}
      </Group>
      <AnimatePresence>{showCmp && <Compare jobs={seen.filter((j) => cmp.has(j.key))} onClose={() => setShowCmp(false)} />}</AnimatePresence>
      {showAddJob && <ManualJobDialog onClose={() => setShowAddJob(false)} />}
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems(menu.j)} onClose={() => setMenu(null)} />}
    </div>
  );
}
