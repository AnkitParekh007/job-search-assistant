import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Eye, GraduationCap, LayoutList, Maximize2, MessagesSquare, Minimize2, Sparkles, X } from "lucide-react";
import { api, canonical } from "@ai-job-search/runtime";
import { parseInterview, Story } from "@ai-job-search/core";
import { useStore } from "../store";
import { Empty, PageHeader } from "../components/ui";

function StoryCard({ s, compact }: { s: Story; compact: boolean }) {
  const parts: [string, string][] = [["Situation", s.s], ["Task", s.t], ["Action", s.a], ["Result", s.r]];
  return (
    <div className="card p-5">
      <div className="flex items-start gap-2">
        <div className="flex-1"><div className="h-section">{s.title}</div>{s.skill && <div className="text-accent-ink text-[12px] mt-0.5">{s.skill}</div>}</div>
        {s.needsDetail && <span className="chip bg-warn-soft text-warn" title="Add your own numbers and specifics in 07-interview-prep.md">needs your detail</span>}
      </div>
      <div className={clsx("mt-3", compact ? "space-y-1" : "grid grid-cols-2 gap-3")}>
        {parts.map(([k, v]) => (
          <div key={k} className={compact ? "text-[12.5px]" : "rounded-xl bg-surface-2 border border-line p-3"}>
            <span className={clsx("font-semibold", compact ? "text-ink mr-1.5" : "label block mb-1")}>{compact ? k[0] + ":" : k}</span>
            <span className="text-ink-2 leading-relaxed selectable">{v.replace(/\[ADD DETAIL:[^\]]*\]/g, "").trim() || "—"}</span>
          </div>))}
      </div>
      {!!s.useFor.length && <div className="flex flex-wrap gap-1.5 mt-3">{s.useFor.map((u) => <span key={u} className="chip bg-surface-3 text-ink-2 font-normal">“{u}”</span>)}</div>}
    </div>
  );
}

/** Calm, full-window practice: a question, then reveal the story that answers it. Nothing is recorded or sent. */
function Practice({ stories, onClose }: { stories: Story[]; onClose: () => void }) {
  const deck = useMemo(() => stories.flatMap((s) => (s.useFor.length ? s.useFor : [s.title]).map((q) => ({ q, s }))), [stories]);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [big, setBig] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") { e.preventDefault(); setShown((v) => !v); }
      if (e.key === "ArrowRight") { setI((x) => Math.min(deck.length - 1, x + 1)); setShown(false); }
      if (e.key === "ArrowLeft") { setI((x) => Math.max(0, x - 1)); setShown(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [deck.length, onClose]);
  const c = deck[i];
  return (
    <motion.div className="fixed inset-0 z-50 bg-bg flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="h-[52px] drag flex items-center justify-end gap-2 px-4">
        <span className="no-drag text-ink-3 text-[12px] tnum mr-2">{i + 1} / {deck.length}</span>
        <button className="no-drag btn btn-ghost" onClick={() => setBig(!big)} title="Answer size">{big ? <Minimize2 size={14} /> : <Maximize2 size={14} />}{big ? "Compact" : "Expanded"}</button>
        <button className="no-drag btn btn-ghost" onClick={onClose}><X size={14} />Exit</button>
      </div>
      <div className="flex-1 grid place-items-center px-8">
        <AnimatePresence mode="popLayout">
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }} className="w-full max-w-2xl">
            <div className="label mb-3">Interviewer asks</div>
            <div className="font-[family-name:var(--font-display)] text-[28px] leading-tight font-semibold tracking-tight">“{c.q}”</div>
            <AnimatePresence>
              {shown && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  <div className="mt-8"><div className="label mb-2">Your story · {c.s.title}</div>
                    {big ? <StoryCard s={c.s} compact={false} /> : (
                      <ul className="space-y-2 text-[15px] leading-relaxed text-ink-2">
                        {[c.s.s, c.s.t, c.s.a, c.s.r].map((x, k) => <li key={k} className="flex gap-3"><span className="text-accent font-semibold w-4">{"STAR"[k]}</span><span className="flex-1 selectable">{x.replace(/\[ADD DETAIL:[^\]]*\]/g, "").trim()}</span></li>)}
                      </ul>)}
                  </div>
                </motion.div>)}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-2 pb-10">
        <button className="btn btn-lg" disabled={i === 0} onClick={() => { setI(i - 1); setShown(false); }}><ArrowLeft size={14} /></button>
        <button className="btn btn-primary btn-lg w-48 justify-center" onClick={() => setShown(!shown)}><Eye size={14} />{shown ? "Hide answer" : "Reveal answer"}<span className="opacity-60 text-[11px]">space</span></button>
        <button className="btn btn-lg" disabled={i === deck.length - 1} onClick={() => { setI(i + 1); setShown(false); }}><ArrowRight size={14} /></button>
      </div>
    </motion.div>
  );
}

export default function Interview() {
  const { tracker, startWorkflow, go, ws } = useStore();
  const [md, setMd] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const [practice, setPractice] = useState(false);
  const [company, setCompany] = useState("");
  useEffect(() => { api.readText(".claude/skills/job-application-assistant/07-interview-prep.md").then(setMd).catch(() => setMd("")); }, [ws?.path]);
  const data = useMemo(() => parseInterview(md || ""), [md]);
  const apps = (tracker?.rows || []).filter((r) => !["drafted", "withdrawn"].includes(canonical(r.fields.status)));
  const run = (p: string) => startWorkflow("interview", p).then((r) => r && go("activity"));
  const target = company || apps[0]?.fields.company || "";

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1000px] mx-auto px-8 pb-12">
        <PageHeader title="Interview Prep" subtitle="Your real stories, ready to rehearse. Practice stays on this Mac."
          actions={<>
            <button className={clsx("btn", compact && "bg-accent-soft text-accent-ink border-transparent")} onClick={() => setCompact(!compact)}><LayoutList size={14} />{compact ? "Expanded" : "Compact reference"}</button>
            <button className="btn btn-primary" disabled={!data.stories.length} onClick={() => setPractice(true)}><GraduationCap size={14} />Practice</button>
          </>} />

        <div className="card p-4 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ai-soft text-ai grid place-items-center"><Sparkles size={16} /></div>
          <div className="flex-1"><div className="font-medium">Prepare for a specific interview</div><div className="text-ink-3 text-[12px]">Claude builds a stage-specific pack from the archived posting, your documents and company research, or runs a mock interview with feedback.</div></div>
          <select className="input w-52" value={target} onChange={(e) => setCompany(e.target.value)} aria-label="Application">
            {apps.length === 0 && <option value="">No submitted applications</option>}
            {apps.map((r) => <option key={r.index} value={r.fields.company}>{r.fields.company} · {r.fields.role}</option>)}
          </select>
          <button className="btn" disabled={!target} onClick={() => run(`/interview ${target}`)}>Build prep pack</button>
          <button className="btn" disabled={!target} onClick={() => run(`/interview ${target} - run a roleplay mock interview with feedback after each answer`)}><MessagesSquare size={14} />Mock interview</button>
        </div>

        {md === null ? <div className="skeleton h-64" /> : data.stories.length === 0 ? (
          <Empty icon={<GraduationCap size={18} />} title="No STAR stories yet" body="They come from 07-interview-prep.md, which /setup fills from your experience." action={<button className="btn" onClick={() => startWorkflow("setup", "/setup --section experience").then((r) => r && go("activity"))}>Run setup for experience</button>} />
        ) : (
          <>
            <div className="label mb-2">STAR stories · {data.stories.length}</div>
            <div className={clsx("grid gap-3", compact ? "grid-cols-2" : "grid-cols-1")}>{data.stories.map((s) => <StoryCard key={s.title} s={s} compact={compact} />)}</div>
            {data.stories.some((s) => s.needsDetail) && <div className="text-[12px] text-warn mt-2">Some stories still have [ADD DETAIL] gaps. Add your own numbers to 07-interview-prep.md; the app never fills them in.</div>}
          </>)}

        {!!data.tough.length && (
          <div className="mt-8"><div className="label mb-2">Tough questions</div>
            <div className="card divide-y divide-line">{data.tough.map((t) => (
              <div key={t.q} className="p-4"><div className="font-medium">“{t.q}”</div><div className={clsx("text-[12.5px] mt-1", t.a ? "text-ink-2" : "text-ink-3 italic")}>{t.a || "Not prepared yet. Build a prep pack and Claude drafts one from your real history."}</div></div>))}
            </div>
          </div>)}
        {!!data.ask.length && (
          <div className="mt-8"><div className="label mb-2">Questions to ask them</div>
            <div className="grid grid-cols-2 gap-3">{data.ask.map((g) => (
              <div key={g.title} className="card p-4"><div className="font-medium mb-2">{g.title}</div><ul className="space-y-1.5">{g.items.map((q) => <li key={q} className="text-[12.5px] text-ink-2 selectable">“{q}”</li>)}</ul></div>))}
            </div>
          </div>)}
      </div>
      <AnimatePresence>{practice && <Practice stories={data.stories} onClose={() => setPractice(false)} />}</AnimatePresence>
    </div>
  );
}
