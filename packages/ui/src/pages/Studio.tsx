import { useEffect, useMemo, useState } from "react";
import { openUrl } from "@ai-job-search/runtime";
import clsx from "clsx";
import { ExternalLink, FileCheck2, Link2, ShieldCheck, Sparkles, TextQuote } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { api } from "@ai-job-search/runtime";
import { useStore } from "../store";
import { Empty } from "../components/ui";
import { RunConsole } from "../components/RunConsole";
import { PdfView } from "../components/PdfView";

const STEPS = ["Integrity check", "Fit evaluation", "Your go-ahead", "Draft CV + letter", "Reviewer", "Revise", "Compile + verify", "Recorded as drafted"];

/** Documents this run wrote, taken from its actual Write/Edit tool calls. */
function producedDocs(events: any[]): string[] {
  const out = new Set<string>();
  for (const e of events) {
    if (e.kind !== "assistant") continue;
    for (const b of e.data?.message?.content || []) {
      const p: string | undefined = b.type === "tool_use" && ["Write", "Edit"].includes(b.name) ? b.input?.file_path : undefined;
      const m = p?.match(/(cv\/main_[^/]+\.tex|cover_letters\/cover_[^/]+\.tex)$/);
      if (m) out.add(m[1]);
    }
  }
  return [...out];
}

function stepsReached(events: any[]): number {
  const text = JSON.stringify(events.map((e) => e.kind === "assistant" || e.kind === "user" ? e.data?.message?.content : e.data?.detail)).toLowerCase();
  let n = 0;
  if (text.includes("posting_guard")) n = 1;
  if (/skills match|fit score|overall fit/.test(text)) n = 2;
  if (/should i proceed|proceed with drafting/.test(text)) n = 3;
  if (producedDocs(events).length) n = 4;
  if (text.includes("application-reviewer") || text.includes("reviewer")) n = Math.max(n, 5);
  if (/lualatex|xelatex/.test(text)) n = Math.max(n, 7);
  if (text.includes("job_search_tracker.csv") && text.includes("drafted")) n = 8;
  return n;
}

export default function Studio() {
  const { startWorkflow, runs, events, live, toast } = useStore();
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState(sessionStorage.getItem("studioUrl") || "");
  const [text, setText] = useState("");
  const [guard, setGuard] = useState<{ ok: boolean; out: string } | null>(null);
  const [runId, setRunId] = useState<string | null>(() => runs.find((r) => r.workflow === "apply")?.id || null);
  const [doc, setDoc] = useState<string | null>(null);
  useEffect(() => { sessionStorage.removeItem("studioUrl"); }, []);

  const evs = (runId && events[runId]) || [];
  const docs = useMemo(() => producedDocs(evs), [evs]);
  const reached = useMemo(() => stepsReached(evs), [evs]);
  const runStatus = runId ? (live[runId] || runs.find((r) => r.id === runId)?.status) : undefined;
  const runFailed = !!runStatus && ["failed", "interrupted", "cancelled"].includes(runStatus);
  useEffect(() => { if (!doc && docs.length) setDoc(docs[0]); }, [docs, doc]);

  const validUrl = /^https?:\/\/[^\s]+$/.test(url.trim());
  const checkText = async () => {
    try {
      const r = await api.postingGuard(text);
      let ok = r.code === 0;
      try { const j = JSON.parse(r.stdout); ok = ok && !(j.instruction_like?.length || j.invisible_flagged); } catch { /* text output */ }
      setGuard({ ok, out: (r.stderr || r.stdout).slice(0, 1500) });
    } catch (e) { toast(String(e), "bad"); }
  };
  const start = async () => {
    const arg = mode === "url" ? url.trim() : text.trim();
    const r = await startWorkflow("apply", `/apply ${arg}`);
    if (r) { setRunId(r.id); setDoc(null); }
  };

  return (
    <Group orientation="horizontal" className="h-full border-t border-line">
      <Panel defaultSize={27} minSize={20}>
        <div className="h-full overflow-auto p-5 space-y-5">
          <div>
            <div className="h-title !text-[20px]">Studio</div>
            <div className="text-ink-2 text-[12.5px] mt-1">Evaluate fit first. Documents draft only after you agree — grounded in your profile.</div>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-sunken w-fit">
            <button className={clsx("btn h-7 text-[12px] border-0", mode === "url" ? "bg-surface shadow-sm" : "btn-ghost")} onClick={() => setMode("url")}><Link2 size={12} />Job URL</button>
            <button className={clsx("btn h-7 text-[12px] border-0", mode === "text" ? "bg-surface shadow-sm" : "btn-ghost")} onClick={() => setMode("text")}><TextQuote size={12} />Paste posting</button>
          </div>
          {mode === "url" ? (
            <div className="space-y-2">
              <input className="input w-full" placeholder="https://jobs.ashbyhq.com/…" value={url} onChange={(e) => setUrl(e.target.value)} />
              <div className="text-[11.5px] text-ink-3">The posting-fetcher agent fetches it and runs the integrity gate before anything is read as content. Official ATS hosts (Greenhouse, Lever, Ashby, Workday…) are verified; other hosts are flagged.</div>
              {validUrl && <button className="btn h-7 text-[12px]" onClick={() => openUrl(url.trim())}><ExternalLink size={12} />Open official page</button>}
            </div>
          ) : (
            <div className="space-y-2">
              <textarea className="input w-full h-56 font-mono text-[12px]" placeholder="Paste the full posting text" value={text} onChange={(e) => { setText(e.target.value); setGuard(null); }} />
              <button className="btn h-7 text-[12px]" disabled={!text.trim()} onClick={checkText}><ShieldCheck size={12} />Run integrity check</button>
              {guard && <pre className={clsx("text-[11px] font-mono whitespace-pre-wrap rounded-lg p-2.5 selectable", guard.ok ? "bg-good-soft text-good" : "bg-warn-soft text-warn")}>{guard.out || (guard.ok ? "clean" : "flagged")}</pre>}
            </div>
          )}
          <button className="btn btn-primary w-full justify-center h-9" disabled={mode === "url" ? !validUrl : !text.trim()} onClick={start}><Sparkles size={14} />Evaluate fit</button>
          <div>
            <div className="label mb-2">Workflow</div>
            <ol className="space-y-1.5">
              {STEPS.map((s, i) => {
                const done = i < reached;
                const current = i === reached && !!runId && !!live[runId];
                return (
                  <li key={s} className="flex items-center gap-2 text-[12.5px]">
                    <span className={clsx("w-5 h-5 rounded-full grid place-items-center text-[10.5px] font-semibold",
                      done ? "bg-good text-white" : current ? "bg-accent-soft text-accent-ink" : "bg-sunken text-ink-3")}>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={done ? "text-ink" : "text-ink-3"}>{s}</span>
                  </li>
                );
              })}
              {runFailed && (
                <li className="flex items-center gap-2 text-[12.5px] text-bad font-medium pt-0.5">
                  <span className="w-5 h-5 rounded-full bg-bad text-white grid place-items-center text-[10.5px] font-semibold">!</span>
                  Stopped before finishing
                </li>
              )}
            </ol>
            <div className="text-[11px] text-ink-3 mt-2">{runFailed ? "Green ticks are log evidence only — the run still failed. Retry from the timeline, or compile any drafted .tex." : "Ticks come from the run log. Recording “applied” happens in Pipeline after you submit."}</div>
          </div>
        </div>
      </Panel>
      <Separator className="w-px bg-line hover:bg-accent transition-colors" />
      <Panel defaultSize={38} minSize={25}>
        {runId ? <RunConsole runId={runId} /> : <Empty icon={<Sparkles size={18} />} title="Start with a posting" body="Paste a job URL or the posting text. Claude evaluates fit first and asks before drafting anything." />}
      </Panel>
      <Separator className="w-px bg-line hover:bg-accent transition-colors" />
      <Panel defaultSize={35} minSize={22}>
        {docs.length ? (
          <div className="h-full flex flex-col">
            <div className="flex gap-1 p-2 border-b border-line">
              {docs.map((d) => <button key={d} className={clsx("btn h-7 text-[12px]", doc === d ? "bg-accent-soft text-accent-ink border-transparent" : "btn-ghost")} onClick={() => setDoc(d)}><FileCheck2 size={12} />{d.startsWith("cv/") ? "CV" : "Cover letter"}</button>)}
            </div>
            {doc && <div className="flex-1 min-h-0"><PdfView key={doc} rel={doc.replace(/\.tex$/, ".pdf")} source={doc} expectPages={doc.startsWith("cv/") ? 2 : 1} /></div>}
          </div>
        ) : <Empty icon={<FileCheck2 size={18} />} title="Documents appear here" body="After fit looks good and you approve drafting, tailored CV and cover-letter PDFs show here." />}
      </Panel>
    </Group>
  );
}
