import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import { ArrowRight, BellRing, CalendarClock, CircleAlert, FileClock, Hand, ListOrdered, Radar, RotateCcw, Sparkles, Sun } from "lucide-react";
import { api, canonical } from "@ai-job-search/runtime";
import { useStore } from "../store";
import { computeMetrics, workflowBlockedReason, workflowReady, type LifecycleEvent } from "@ai-job-search/core";
import { Actor, ScoreRing, Section } from "../components/ui";
import { RunStatusPill } from "../components/RunConsole";

type Task = { key: string; who: "you" | "ai"; icon: any; tone: string; title: ReactNode; detail: ReactNode; cta: string; onClick: () => void };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const { tracker, seen, go, runs, live, loading, startWorkflow, setFocusRun, deps } = useStore();
  const rows = tracker?.rows || [];
  const [lifecycle, setLifecycle] = useState<LifecycleEvent[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all(rows.map((r) => api.appFolder(r.fields.company, r.fields.role).then((f) => (f.events || []).filter((e) => e.type).map((e) => ({ type: e.type as string, app: `${r.fields.company}|${r.fields.role}`.toLowerCase() }))).catch(() => [] as LifecycleEvent[])))
      .then((all) => { if (!cancelled) setLifecycle(all.flat()); });
    return () => { cancelled = true; };
  }, [tracker]);
  const m = useMemo(() => computeMetrics(rows, seen, new Date(), lifecycle), [rows, seen, lifecycle]);
  const [provider, setProvider] = useState("claude");
  useEffect(() => {
    api.getSetting("ai_provider").then((p) => setProvider((p || "claude").trim())).catch(() => setProvider("claude"));
  }, [deps]);
  const scrapeReady = workflowReady(deps, provider, "scrape");
  const scrapeBlock = workflowBlockedReason(deps, provider, "scrape");
  const open = (route: string, key?: string, val?: string) => { if (key && val != null) sessionStorage.setItem(key, val); go(route); };
  const runIt = (wf: string, p: string) => {
    if (!workflowReady(deps, provider, wf)) {
      go("settings");
      return Promise.resolve();
    }
    return startWorkflow(wf, p).then((r) => r && go("activity"));
  };

  const tasks: Task[] = [];
  for (const [id, s] of Object.entries(live)) {
    if (!s.startsWith("awaiting")) continue;
    const r = runs.find((x) => x.id === id);
    tasks.push({ key: "run" + id, who: "you", icon: Hand, tone: "text-you", title: s === "awaiting_approval" ? "Approve a step so Claude can continue" : "Claude asked you something", detail: <span className="font-mono">{r?.prompt.split("\n")[0].slice(0, 70)}</span>, cta: "Review", onClick: () => { setFocusRun(id); go("activity"); } });
  }
  for (const r of rows.filter((r) => canonical(r.fields.status) === "drafted")) {
    tasks.push({ key: "d" + r.index, who: "you", icon: FileClock, tone: "text-you", title: <>Submit your application to <b>{r.fields.company}</b></>, detail: `${r.fields.role} · documents ready since ${r.fields.date}. It stays "drafted" until you record that you sent it.`, cta: "Open", onClick: () => open("pipeline", "openApp", String(r.index)) });
  }
  for (const d of m.deadlines.filter((d) => d.days <= 7)) {
    tasks.push({ key: "dl" + d.company + d.role, who: "you", icon: CalendarClock, tone: d.days < 0 ? "text-bad" : "text-warn", title: <>{d.company} deadline {d.days < 0 ? `passed ${-d.days}d ago` : d.days === 0 ? "is today" : `in ${d.days} days`}</>, detail: d.role, cta: "View", onClick: () => go("pipeline") });
  }
  for (const f of m.followUps) {
    tasks.push({ key: "f" + f.company, who: "ai", icon: BellRing, tone: "text-ai", title: <>Follow up with <b>{f.company}</b></>, detail: `${f.quiet} days without a reply. Claude drafts it; you decide whether to send.`, cta: "Draft", onClick: () => runIt("outcome", `/outcome ${f.company}`) });
  }
  const failed = runs.filter((r) => !live[r.id] && ["failed", "interrupted"].includes(r.status)).slice(0, 2);
  for (const r of failed) {
    tasks.push({ key: "fr" + r.id, who: "ai", icon: CircleAlert, tone: "text-bad", title: <>A run {r.status === "failed" ? "failed" : "was interrupted"}: <span className="font-mono">{r.prompt.split(" ")[0]}</span></>, detail: r.error?.slice(0, 120) || new Date(r.started_at).toLocaleString(), cta: "Inspect", onClick: () => { setFocusRun(r.id); go("activity"); } });
  }
  const unranked = seen.filter((j) => j.status === "new" && j.rank_score == null).length;
  if (unranked >= 3) tasks.push({ key: "rank", who: "ai", icon: ListOrdered, tone: "text-ai", title: `Rank ${unranked} new postings`, detail: "Claude fetches each posting, runs the integrity check and scores it against your rubric.", cta: "Rank", onClick: () => runIt("rank", "/rank") });

  const tracked = new Set(rows.map((r) => `${r.fields.company}|${r.fields.role}`.toLowerCase()));
  const fresh = seen.filter((j) => (j.status === "new" || j.status === "ranked") && !tracked.has(`${j.company}|${j.title}`.toLowerCase())).sort((a, b) => (b.rank_score ?? -1) - (a.rank_score ?? -1) || ["high", "medium", "low"].indexOf(a.fit || "") - ["high", "medium", "low"].indexOf(b.fit || "")).slice(0, 4);
  const s = (k: string) => m.byStatus[k] || 0;
  const journey = [
    { label: "Discovered", v: m.discovered, go: () => go("jobs") },
    { label: "Ranked", v: m.funnel[1].value, go: () => go("jobs") },
    { label: "Drafted", v: m.funnel[2].value, go: () => go("pipeline") },
    { label: "Submitted", v: m.funnel[3].value, go: () => go("pipeline") },
    { label: "Interviewing", v: m.lifecycleSource === "events" ? m.funnel[4].value : s("interview"), go: () => open("pipeline", "pipeFilter", "interview") },
    { label: "Offers", v: m.lifecycleSource === "events" ? m.funnel[5].value : s("offer") + s("hired"), go: () => open("pipeline", "pipeFilter", "offer") },
  ];
  const liveRuns = runs.filter((r) => live[r.id]);

  if (loading) return <div className="p-8 space-y-3 max-w-5xl">{[60, 180, 120].map((h, i) => <div key={i} className="skeleton" style={{ height: h }} />)}</div>;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1120px] mx-auto px-8 pb-12">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3 mb-6 pt-1">
          <div className="flex-1 min-w-[220px]">
            <div className="text-ink-3 text-[12px] tnum">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
            <h1 className="h-title mt-0.5">{greeting()}</h1>
            <div className="text-ink-2 mt-1">{(() => { const n = tasks.filter((t) => t.who === "you").length; return n ? `${n} thing${n === 1 ? "" : "s"} ${n === 1 ? "needs" : "need"} you today.` : "Nothing is waiting on you right now."; })()} {m.open} open application{m.open === 1 ? "" : "s"}.</div>
            {!scrapeReady && scrapeBlock && <div className="text-[12.5px] text-warn mt-1">{scrapeBlock}</div>}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button className="btn btn-lg" disabled={!scrapeReady} title={scrapeBlock || undefined} onClick={() => runIt("scrape", "/scrape")}><Radar size={14} />Find jobs</button>
            <button className="btn btn-primary btn-lg" onClick={() => go("studio")}><Sparkles size={14} />Start application</button>
            {!scrapeReady && <button className="btn btn-lg" onClick={() => go("settings")}>Sign in</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4">
          <Section title={<><Sun size={15} className="text-accent" />Focus</>} action={<span className="text-[12px] text-ink-2 flex items-center gap-2"><span className="inline-flex items-center gap-1"><Actor who="you" /><span className="text-ink-3">needs you</span></span><span className="inline-flex items-center gap-1"><Actor who="ai" /><span className="text-ink-3">Claude can do</span></span></span>}>
            {tasks.length === 0 ? (
              <div className="py-8 text-center">
                <div className="h-section">You're all caught up</div>
                <div className="text-ink-2 mt-1 max-w-sm mx-auto">Good moment to look for new roles, or evaluate one you've already found.</div>
                <div className="flex gap-2 justify-center mt-4"><button className="btn btn-primary" onClick={() => runIt("scrape", "/scrape")}><Radar size={13} />Find jobs</button><button className="btn" onClick={() => go("jobs")}>Browse discovered</button></div>
              </div>
            ) : (
              <ul className="-mx-1.5">
                {tasks.slice(0, 7).map((t, i) => (
                  <motion.li key={t.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.18 }}>
                    <button onClick={t.onClick} className="w-full flex items-start gap-3 px-1.5 py-2.5 rounded-xl row-hover text-left group">
                      <div className={clsx("w-8 h-8 rounded-lg bg-surface-3 border border-line grid place-items-center shrink-0", t.tone)}><t.icon size={15} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="font-medium truncate">{t.title}</span><Actor who={t.who} /></div>
                        <div className="text-ink-3 text-[12px] mt-0.5 line-clamp-2">{t.detail}</div>
                      </div>
                      <span className="btn h-7 text-[12px] opacity-80 group-hover:opacity-100">{t.cta}<ArrowRight size={12} /></span>
                    </button>
                  </motion.li>))}
              </ul>)}
          </Section>

          <Section title="Fresh opportunities" action={<button className="btn btn-ghost h-7 text-[12px]" onClick={() => go("jobs")}>All jobs<ArrowRight size={12} /></button>}>
            {fresh.length === 0 ? (
              <div className="py-8 text-center text-ink-2"><div className="h-section text-ink">No open postings yet</div><div className="mt-1 max-w-xs mx-auto">Search installed portals (or the web) for real postings worth ranking.</div><button className="btn mt-4" onClick={() => go("jobs")}><Radar size={13} />Open Jobs</button></div>
            ) : (
              <div className="space-y-1 -mx-1.5">
                {fresh.map((j) => (
                  <button key={j.key} onClick={() => open("jobs", "openJob", j.key)} className="w-full flex items-center gap-3 px-1.5 py-2 rounded-xl row-hover text-left">
                    <ScoreRing score={j.rank_score} fit={j.fit} size={36} />
                    <div className="flex-1 min-w-0"><div className="font-medium truncate">{j.title}</div><div className="text-ink-3 text-[12px] truncate">{j.company} · {j.location || "location n/a"}</div></div>
                  </button>))}
                <div className="text-[11px] text-ink-3 px-1.5 pt-1">Dashed ring = quick preliminary fit. Filled ring = scored by /rank.</div>
              </div>)}
          </Section>
        </div>

        <Section className="mt-4" title="Your journey" action={<span className="text-[11.5px] text-ink-3">{m.interviewRate != null ? `${Math.round(m.interviewRate * 100)}% of submissions reached interview` : journey.every((j) => j.v === 0) ? "Starts after your first discovery" : "Interview rate appears after your first submission"}{m.lifecycleSource === "events" && <span className="block text-right">Submitted from confirmed events</span>}</span>}>
          {journey.every((j) => j.v === 0) ? (
            <div className="flex flex-wrap items-center gap-3 py-2">
              <div className="text-ink-2 text-[13px] flex-1 min-w-[200px]">No applications in the funnel yet. Find roles, then evaluate one in Studio.</div>
              <button className="btn" onClick={() => runIt("scrape", "/scrape")}><Radar size={13} />Find jobs</button>
              <button className="btn btn-primary" onClick={() => go("studio")}><Sparkles size={13} />Start application</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {journey.map((st, i) => {
                  const max = Math.max(1, ...journey.map((x) => x.v));
                  return (
                    <button key={st.label} onClick={st.go} className="text-left rounded-xl p-3 row-hover group">
                      <div className="text-[24px] font-semibold tnum tracking-tight">{st.v}</div>
                      <div className="text-ink-3 text-[12px]">{st.label}</div>
                      <div className="h-1 rounded-full bg-surface-3 mt-2.5 overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: i >= 4 ? "var(--good)" : "var(--accent)" }} initial={{ width: 0 }} animate={{ width: `${(st.v / max) * 100}%` }} transition={{ duration: 0.5, delay: i * 0.04 }} /></div>
                    </button>);
                })}
              </div>
              {(s("rejected") + s("no_response") > 0) && <div className="text-[12px] text-ink-3 mt-2 px-3">{s("rejected")} rejected · {s("no_response")} no response · {s("withdrawn")} withdrawn. Every closed application still informs your rubric.</div>}
            </>
          )}
        </Section>

        <Section className="mt-4" title="Automation" action={<button className="btn btn-ghost h-7 text-[12px]" onClick={() => go("activity")}>Agent Activity<ArrowRight size={12} /></button>}>
          {runs.length === 0 ? <div className="text-ink-2 py-2">Nothing has run yet. When Claude works, each step, tool call and approval shows up here as it happens, with its real cost.</div> : (
            <div className="divide-y divide-line">
              {[...liveRuns, ...runs.filter((r) => !live[r.id])].slice(0, 5).map((r) => (
                <button key={r.id} onClick={() => { setFocusRun(r.id); go("activity"); }} className="w-full flex items-center gap-3 py-2 text-left row-hover rounded-lg px-1">
                  <span className="font-mono text-[12px] w-28 truncate">{r.prompt.split(" ")[0]}</span>
                  <span className="text-ink-3 text-[12px] flex-1 truncate">{r.summary?.split("\n")[0] || new Date(r.started_at).toLocaleString()}</span>
                  <RunStatusPill status={live[r.id] || r.status} />
                  {r.status === "failed" && <RotateCcw size={13} className="text-ink-3" />}
                </button>))}
            </div>)}
        </Section>
      </div>
    </div>
  );
}
