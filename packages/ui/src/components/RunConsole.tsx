import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Bot, Check, ChevronRight, CircleAlert, FileText, Globe, Hand, Loader2, RotateCcw, Search, ShieldAlert, Square, Terminal, Users, Wrench, X } from "lucide-react";
import { api, Pending, RunEvent } from "@ai-job-search/runtime";
import { buildPrompt, type Workflow } from "@ai-job-search/core";
import { useStore } from "../store";
import { Markdown } from "./ui";
import { AgentComposer } from "./AgentComposer";

const TOOL_ICON: Record<string, any> = { Bash: Terminal, Read: FileText, Write: FileText, Edit: FileText, Grep: Search, Glob: Search, WebSearch: Globe, WebFetch: Globe, Task: Users, Agent: Users };

export const STATUS_LABEL: Record<string, string> = {
  running: "Running", awaiting_approval: "Needs your approval", awaiting_input: "Waiting for your reply",
  completed: "Completed", failed: "Failed", cancelled: "Stopped", interrupted: "Interrupted (app closed)", starting: "Starting",
};

export function RunStatusPill({ status }: { status: string }) {
  const tone = status === "running" ? "bg-ai-soft text-ai" : status.startsWith("awaiting") ? "bg-you-soft text-you" : status === "completed" ? "bg-good-soft text-good" : status === "failed" ? "bg-bad-soft text-bad" : "bg-sunken text-ink-3";
  return (
    <span className={clsx("chip", tone)}>
      {(status === "running" || status.startsWith("awaiting")) && <span className="w-1.5 h-1.5 rounded-full bg-current live-dot" />}
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function toolSummary(name: string, input: any): string {
  if (!input) return "";
  if (name === "Bash") return input.command || "";
  if (["Read", "Write", "Edit"].includes(name)) return input.file_path || "";
  if (name === "WebFetch") return input.url || "";
  if (name === "WebSearch") return input.query || "";
  if (name === "Grep" || name === "Glob") return input.pattern || "";
  if (name === "Task" || name === "Agent") return `${input.subagent_type || "agent"}: ${input.description || ""}`;
  if (name === "Skill") return input.skill || "";
  return JSON.stringify(input).slice(0, 160);
}

type Item =
  | { t: "text"; key: string; text: string }
  | { t: "tool"; key: string; id: string; name: string; input: any; result?: string; isError?: boolean; sub?: boolean }
  | { t: "step"; key: string; text: string }
  | { t: "user"; key: string; text: string }
  | { t: "denied"; key: string; text: string }
  | { t: "result"; key: string; ok: boolean; text: string; cost?: number; turns?: number; ms?: number }
  | { t: "err"; key: string; text: string };

export function buildItems(events: RunEvent[]): Item[] {
  const items: Item[] = [];
  const tools = new Map<string, Item & { t: "tool" }>();
  for (const ev of events) {
    const d = ev.data || {};
    if (ev.kind === "assistant") {
      for (const b of d.message?.content || []) {
        if (b.type === "text" && b.text?.trim()) items.push({ t: "text", key: `${ev.seq}-${items.length}`, text: b.text });
        if (b.type === "tool_use") {
          const it = { t: "tool" as const, key: b.id, id: b.id, name: b.name, input: b.input, sub: !!d.parent_tool_use_id };
          tools.set(b.id, it);
          items.push(it);
        }
      }
    } else if (ev.kind === "user") {
      for (const b of d.message?.content || []) {
        if (b.type === "tool_result") {
          const it = tools.get(b.tool_use_id);
          const txt = typeof b.content === "string" ? b.content : (b.content || []).map((c: any) => c.text || "").join("\n");
          if (it) { it.result = txt; it.isError = !!b.is_error; }
        }
      }
    } else if (ev.kind === "system:task_summary" && d.detail) {
      items.push({ t: "step", key: `s${ev.seq}`, text: d.detail });
    } else if (ev.kind === "bridge:user_message") {
      items.push({ t: "user", key: `u${ev.seq}`, text: d.text });
    } else if (ev.kind === "system:permission_denied") {
      items.push({ t: "denied", key: `d${ev.seq}`, text: d.message || "Permission denied" });
    } else if (ev.kind.startsWith("result:")) {
      items.push({ t: "result", key: `r${ev.seq}`, ok: ev.kind === "result:success" && !d.is_error, text: d.result || "", cost: d.total_cost_usd, turns: d.num_turns, ms: d.duration_ms });
    } else if (ev.kind === "bridge:exit" && d.status === "failed") {
      items.push({ t: "err", key: `e${ev.seq}`, text: "AI provider process exited without a result." });
    } else if (ev.kind === "agent.message" && d.message?.content) {
      for (const b of d.message.content) {
        if (b.type === "text" && b.text?.trim()) items.push({ t: "text", key: `am${ev.seq}-${items.length}`, text: b.text });
      }
    } else if (ev.kind === "execution.failed" && d.message) {
      items.push({ t: "err", key: `ef${ev.seq}`, text: String(d.message) });
    }
  }
  return items;
}

function ToolRow({ it }: { it: Item & { t: "tool" } }) {
  const [open, setOpen] = useState(false);
  const Icon = TOOL_ICON[it.name] || Wrench;
  const done = it.result !== undefined;
  return (
    <div className={clsx("rounded-lg border border-line bg-surface-2", it.sub && "ml-6")}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left">
        <ChevronRight size={13} className={clsx("text-ink-3 transition-transform", open && "rotate-90")} />
        <Icon size={13} className="text-ink-2 shrink-0" />
        <span className="font-medium text-[12.5px]">{it.name}</span>
        <span className="text-ink-3 text-[12px] truncate font-mono flex-1">{toolSummary(it.name, it.input)}</span>
        {!done ? <Loader2 size={13} className="animate-spin text-ai" /> : it.isError ? <X size={13} className="text-bad" /> : <Check size={13} className="text-good" />}
      </button>
      {open && (
        <div className="border-t border-line px-3 py-2 space-y-2">
          <pre className="text-[11.5px] font-mono whitespace-pre-wrap break-all text-ink-2 selectable max-h-48 overflow-auto">{JSON.stringify(it.input, null, 2)}</pre>
          {done && <pre className={clsx("text-[11.5px] font-mono whitespace-pre-wrap break-words selectable max-h-72 overflow-auto rounded-md p-2", it.isError ? "bg-bad-soft text-bad" : "bg-sunken text-ink-2")}>{it.result}</pre>}
        </div>
      )}
    </div>
  );
}

function AskCard({ runId, p }: { runId: string; p: Pending }) {
  const qs: any[] = p.request.input?.questions || [];
  const [ans, setAns] = useState<Record<string, string[]>>({});
  const [other, setOther] = useState<Record<string, string>>({});
  const submit = async () => {
    const answers: Record<string, string> = {};
    for (const q of qs) {
      const picked = [...(ans[q.question] || [])];
      if (other[q.question]?.trim()) picked.push(other[q.question].trim());
      answers[q.question] = picked.join(", ");
    }
    await api.respond(runId, p.request_id, true, { ...p.request.input, answers });
  };
  const ready = qs.every((q) => (ans[q.question]?.length || other[q.question]?.trim()));
  return (
    <div className="space-y-4">
      {qs.map((q) => (
        <div key={q.question}>
          <div className="font-medium mb-2">{q.question}</div>
          <div className="grid gap-1.5">
            {(q.options || []).map((o: any) => {
              const sel = ans[q.question]?.includes(o.label);
              return (
                <button key={o.label} onClick={() => setAns((a) => ({ ...a, [q.question]: q.multiSelect ? (sel ? a[q.question].filter((x) => x !== o.label) : [...(a[q.question] || []), o.label]) : [o.label] }))}
                  className={clsx("text-left rounded-lg border px-3 py-2 transition-colors", sel ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong")}>
                  <div className="font-medium text-[13px]">{o.label}</div>
                  {o.description && <div className="text-ink-2 text-[12px] mt-0.5">{o.description}</div>}
                </button>
              );
            })}
            <input className="input" placeholder="Other…" value={other[q.question] || ""} onChange={(e) => setOther((x) => ({ ...x, [q.question]: e.target.value }))} />
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={!ready} onClick={submit}>Send answers</button>
        <button className="btn" onClick={() => api.respond(runId, p.request_id, false, undefined, "The user skipped this question.")}>Skip</button>
      </div>
    </div>
  );
}

export function ApprovalCard({ runId, p }: { runId: string; p: Pending }) {
  const tool = p.request.tool_name;
  const [why, setWhy] = useState("");
  const readOnly = ["Read", "Grep", "Glob", "WebSearch", "WebFetch"].includes(tool);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-you/50 bg-you-soft p-3.5">
      <div className="flex items-center gap-2 mb-2">
        {tool === "AskUserQuestion" ? <Hand size={15} className="text-you" /> : <ShieldAlert size={15} className="text-you" />}
        <div className="font-semibold">{tool === "AskUserQuestion" ? "Claude is asking you" : `Allow ${p.request.display_name || tool}?`}</div>
      </div>
      {tool === "AskUserQuestion" ? (
        <AskCard runId={runId} p={p} />
      ) : (
        <>
          <div className="text-[12px] text-ink-2 mb-1.5">Review exactly what will run. Nothing executes until you choose.</div>
          <pre className="text-[11.5px] font-mono whitespace-pre-wrap break-all bg-surface rounded-lg border border-line p-2.5 max-h-56 overflow-auto selectable">{tool === "Bash" ? p.request.input?.command : JSON.stringify(p.request.input, null, 2)}</pre>
          {p.request.input?.description && <div className="text-[12px] text-ink-2 mt-1.5">{p.request.input.description}</div>}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button className="btn btn-you" onClick={() => api.respond(runId, p.request_id, true)}>Allow once</button>
            {readOnly && <button className="btn" onClick={() => api.respond(runId, p.request_id, true, undefined, undefined, true)}>Allow {tool} for this run</button>}
            <input className="input flex-1 min-w-40" placeholder="Reason (optional, sent to Claude)" value={why} onChange={(e) => setWhy(e.target.value)} />
            <button className="btn btn-danger" onClick={() => api.respond(runId, p.request_id, false, undefined, why || undefined)}>Deny</button>
          </div>
        </>
      )}
    </motion.div>
  );
}

const ACTIVE = new Set(["running", "starting", "awaiting_approval", "awaiting_input"]);

export function RunConsole({ runId, compact }: { runId: string; compact?: boolean }) {
  const { events, pending, live, runs, loadRun, toast, startWorkflow } = useStore();
  const run = runs.find((r) => r.id === runId);
  const status = (ACTIVE.has(live[runId] || "") ? live[runId] : undefined) || run?.status || "completed";
  const evs = events[runId];
  const items = useMemo(() => buildItems(evs || []), [evs]);
  const pend = pending[runId] || [];
  const [showRaw, setShowRaw] = useState(false);
  const [optimistic, setOptimistic] = useState<{ key: string; text: string }[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const isActive = ACTIVE.has(status);
  const canResume = !isActive && !!run?.session_id;
  const failedResult = items.find((it) => it.t === "result" && !it.ok);
  const failHint = failedResult?.t === "result" ? failedResult.text : (run?.error || "");

  useEffect(() => { if (!evs) loadRun(runId); }, [runId, evs, loadRun]);
  useEffect(() => { setOptimistic([]); }, [runId]);
  useEffect(() => {
    // Drop optimistic bubbles once the bridge echoes the same user text.
    setOptimistic((prev) => prev.filter((o) => !items.some((it) => it.t === "user" && it.text === o.text)));
  }, [items]);
  useEffect(() => {
    if (!isActive && (status === "failed" || status === "interrupted")) return; // don't yank scroll off the failure banner
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [items.length, pend.length, optimistic.length, isActive, status]);

  const sendLive = async (text: string) => {
    setOptimistic((o) => [...o, { key: `opt-${Date.now()}`, text }]);
    try {
      await api.send(runId, text);
    } catch (e) {
      setOptimistic((o) => o.filter((x) => x.text !== text));
      toast(String(e), "bad");
      throw e;
    }
  };
  const resumeWith = async (text: string) => {
    if (!run) return;
    const r = await startWorkflow(run.workflow, text, run.session_id);
    if (!r) throw new Error("Could not continue session");
  };
  const launchWorkflow = async (w: Workflow, arg: string) => {
    const r = await startWorkflow(w.id, buildPrompt(w, arg));
    if (!r) throw new Error("Could not start workflow");
  };
  const stderr = (evs || []).filter((e) => e.kind === "stderr").map((e) => e.data.line);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line">
        <Bot size={15} className="text-ai" />
        <div className="font-medium truncate">{run?.prompt.split("\n")[0].slice(0, 80) || "Run"}</div>
        {run?.provider && <span className="chip bg-sunken text-ink-3">{run.provider}{run.model ? ` · ${run.model}` : ""}</span>}
        <RunStatusPill status={status} />
        <div className="flex-1" />
        <button className="btn btn-ghost h-7 text-[12px]" onClick={() => setShowRaw(!showRaw)}>{showRaw ? "Timeline" : "Raw log"}</button>
        {isActive && status !== "awaiting_input" && <button className="btn h-7 text-[12px]" onClick={() => api.cancel(runId)}><Square size={11} />Stop</button>}
        {isActive && status === "awaiting_input" && <button className="btn h-7 text-[12px]" onClick={() => api.finish(runId)}>End session</button>}
      </div>
      {(status === "failed" || status === "interrupted" || status === "cancelled") && (
        <div className="mx-3 mt-3 rounded-xl border border-bad/35 bg-bad-soft px-3.5 py-3 text-[12.5px] text-bad">
          <div className="flex items-start gap-2">
            <CircleAlert size={15} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-bad">{status === "cancelled" ? "Run stopped" : status === "interrupted" ? "Run interrupted" : "Run failed"}</div>
              <div className="text-ink-2 mt-0.5 line-clamp-3 selectable">{failHint || (status === "interrupted" ? `Process can't be reattached (session ${run?.session_id.slice(0, 8)}).` : "Open the timeline below for details.")}</div>
            </div>
          </div>
          {run && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              <button className="btn h-7 text-[12px]" onClick={() => startWorkflow(run.workflow, run.prompt)}><RotateCcw size={12} />Retry fresh</button>
              {run.session_id && <button className="btn h-7 text-[12px]" onClick={() => startWorkflow(run.workflow, "Continue where you left off.", run.session_id)}>Resume session</button>}
            </div>
          )}
        </div>
      )}
      <div ref={scroller} className={clsx("flex-1 overflow-auto min-h-0", compact ? "p-3" : "p-4")}>
        {!evs && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-8" />)}</div>}
        {showRaw ? (
          <pre className="text-[11px] font-mono whitespace-pre-wrap break-all selectable text-ink-2">{(evs || []).map((e) => `${new Date(e.ts).toLocaleTimeString()} ${e.kind} ${JSON.stringify(e.data).slice(0, 600)}`).join("\n")}</pre>
        ) : (
          <div className="space-y-2.5 max-w-3xl">
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <motion.div key={it.key} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                  {it.t === "text" && <div className="text-[13.5px]"><Markdown text={it.text} /></div>}
                  {it.t === "tool" && <ToolRow it={it} />}
                  {it.t === "step" && <div className="flex items-center gap-2 text-[12px] text-ink-3"><span className="w-1.5 h-1.5 rounded-full bg-accent" />{it.text}</div>}
                  {it.t === "user" && <div className="ml-auto max-w-[80%] rounded-2xl bg-accent-soft px-3.5 py-2.5 text-[13.5px] text-accent-ink w-fit selectable whitespace-pre-wrap">{it.text}</div>}
                  {it.t === "denied" && <div className="flex items-start gap-2 text-[12.5px] text-warn"><ShieldAlert size={14} className="mt-0.5" />{it.text}</div>}
                  {it.t === "err" && <div className="flex items-start gap-2 text-[12.5px] text-bad"><CircleAlert size={14} className="mt-0.5" />{it.text}</div>}
                  {it.t === "result" && (
                    <div className={clsx("rounded-lg px-3 py-2 text-[12px] flex flex-wrap gap-x-4 gap-y-1", it.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad")}>
                      <span className="font-semibold">{it.ok ? "Turn finished" : "Turn failed"}</span>
                      {it.ms != null && <span>{Math.round(it.ms / 1000)}s</span>}
                      {it.turns != null && <span>{it.turns} turns</span>}
                      {it.cost != null && <span title="Reported by Claude Code. On a subscription this counts toward plan limits rather than being billed per run.">usage-equivalent ${it.cost.toFixed(3)}</span>}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {optimistic.map((o) => (
              <div key={o.key} className="ml-auto max-w-[80%] rounded-2xl bg-accent-soft/70 px-3.5 py-2.5 text-[13.5px] text-accent-ink w-fit selectable whitespace-pre-wrap opacity-80">
                {o.text}
              </div>
            ))}
            {status === "running" && <div className="flex items-center gap-2 text-ink-3 text-[12.5px]"><Loader2 size={13} className="animate-spin" />Working…</div>}
            {stderr.length > 0 && !isActive && status === "failed" && (
              <pre className="text-[11.5px] font-mono whitespace-pre-wrap bg-bad-soft text-bad rounded-lg p-2.5 selectable">{stderr.slice(-30).join("\n")}</pre>
            )}
            {pend.map((p) => <ApprovalCard key={p.request_id} runId={runId} p={p} />)}
          </div>
        )}
      </div>
      {!compact && (
        <AgentComposer
          status={status}
          canSend={isActive}
          canResume={canResume}
          sessionId={run?.session_id}
          onSend={sendLive}
          onResume={resumeWith}
          onWorkflow={launchWorkflow}
          onStop={isActive && status !== "awaiting_input" ? () => { void api.cancel(runId); } : undefined}
        />
      )}
    </div>
  );
}
