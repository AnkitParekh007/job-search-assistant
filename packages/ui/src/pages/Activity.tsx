import { useEffect, useState } from "react";
import clsx from "clsx";
import { Activity as Act, ChevronRight, RotateCcw } from "lucide-react";
import { useStore } from "../store";
import { Empty } from "../components/ui";
import { RunConsole, RunStatusPill } from "../components/RunConsole";

/** One card per workflow — upstream stages share a run, so duplicating them lied about progress. */
const STAGES: { label: string; wf: string }[] = [
  { label: "Discover", wf: "scrape" },
  { label: "Rank", wf: "rank" },
  { label: "Apply", wf: "apply" },
  { label: "Outcome", wf: "outcome" },
];

function stageState(status?: string) {
  if (!status) return { t: "Pending", c: "bg-sunken text-ink-3" };
  if (status === "running") return { t: "Running", c: "bg-info-soft text-info" };
  if (status.startsWith("awaiting")) return { t: "Awaiting you", c: "bg-warn-soft text-warn" };
  if (status === "completed") return { t: "Completed", c: "bg-good-soft text-good" };
  if (status === "failed") return { t: "Failed", c: "bg-bad-soft text-bad" };
  return { t: status, c: "bg-sunken text-ink-3" };
}

export default function ActivityPage() {
  const { runs, live, focusRun, setFocusRun, startWorkflow, refreshRuns, go } = useStore();
  const [sel, setSel] = useState<string | null>(focusRun || runs[0]?.id || null);
  useEffect(() => { if (focusRun) setSel(focusRun); }, [focusRun]);
  useEffect(() => { refreshRuns(); }, [refreshRuns]);
  const latest = (wf: string) => runs.find((r) => r.workflow === wf);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pb-3">
        <h1 className="h-title">Agent Activity</h1><div className="text-ink-2 mt-0.5">What Claude is doing, what it did, and what it's waiting on you for.</div>
        {runs.length > 0 && (
          <>
            <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1">
              {STAGES.map((s, i) => {
                const r = latest(s.wf);
                const st = stageState(r ? live[r.id] || r.status : undefined);
                return (
                  <div key={s.label} className="flex items-center gap-1 shrink-0">
                    <button onClick={() => r && setSel(r.id)} disabled={!r} className="card px-3 py-2 text-left min-w-[120px]">
                      <div className="text-[12px] font-medium">{s.label}</div>
                      <span className={clsx("chip mt-1", st.c)}>{st.t}</span>
                    </button>
                    {i < STAGES.length - 1 && <ChevronRight size={14} className="text-ink-3" />}
                  </div>);
              })}
            </div>
            <div className="text-[11px] text-ink-3 mt-1.5">Latest run per workflow. Click a card to open that run.</div>
          </>
        )}
      </div>
      <div className="flex-1 min-h-0 flex border-t border-line">
        <div className="w-[300px] shrink-0 border-r border-line overflow-auto">
          {runs.length === 0 ? <Empty icon={<Act size={18} />} title="No runs yet" body="Kick off Find jobs, Rank, or Studio evaluate — every tool call and approval lands here." action={<><button className="btn" onClick={() => startWorkflow("scrape", "/scrape").then((r) => r && setSel(r.id))}>Find jobs</button><button className="btn btn-primary" onClick={() => go("studio")}>Open Studio</button></>} /> :
            runs.map((r) => (
              <button key={r.id} onClick={() => { setSel(r.id); setFocusRun(r.id); }} className={clsx("w-full text-left px-4 py-3 border-b border-line", sel === r.id ? "bg-accent-soft/60" : "hover:bg-surface-2")}>
                <div className="flex items-center gap-2"><span className="font-mono text-[12px] font-medium truncate flex-1">{r.prompt.split("\n")[0].slice(0, 42)}</span><RunStatusPill status={live[r.id] || r.status} /></div>
                <div className="text-[11.5px] text-ink-3 mt-1 flex gap-2">
                  <span>{new Date(r.started_at).toLocaleString()}</span>
                  {r.finished_at && <span>{Math.max(1, Math.round((r.finished_at - r.started_at) / 1000))}s</span>}
                  {r.cost_usd != null && <span title="Usage-equivalent cost reported by Claude Code">${r.cost_usd.toFixed(3)}</span>}
                </div>
                {r.error && <div className="text-[11.5px] text-bad mt-1 line-clamp-2">{r.error}</div>}
              </button>))}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          {sel ? (
            <>
              {(() => { const r = runs.find((x) => x.id === sel); return r && !live[r.id] && ["failed", "interrupted", "cancelled"].includes(r.status) ? (
                <div className="px-4 py-2 border-b border-line flex items-center gap-2 text-[12.5px]"><span className="text-ink-2 flex-1">This run ended early.</span>
                  <button className="btn h-7 text-[12px]" onClick={() => startWorkflow(r.workflow, r.prompt)}><RotateCcw size={12} />Retry fresh</button>
                  <button className="btn h-7 text-[12px]" onClick={() => startWorkflow(r.workflow, "Continue where you left off.", r.session_id)}>Resume session</button></div>) : null; })()}
              <div className="flex-1 min-h-0"><RunConsole key={sel} runId={sel} /></div>
            </>
          ) : <Empty icon={<Act size={18} />} title="Select a run" body="Pick a run to see its timeline, tool calls, approvals and output." />}
        </div>
      </div>
    </div>
  );
}
