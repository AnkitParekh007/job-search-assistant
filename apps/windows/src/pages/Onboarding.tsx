import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, CircleCheck, CircleX, FolderOpen, ShieldCheck } from "lucide-react";
import { api, ProfileFile } from "../lib/api";
import { useStore } from "../lib/store";

/** "Scout": an original assistant mark. Blinks every few seconds on this screen only; static under Reduce Motion. */
export function Scout({ size = 72, mood = "happy" }: { size?: number; mood?: "happy" | "thinking" | "done" }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 72 72" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} aria-hidden>
      <style>{`@keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}.eye{transform-origin:center;transform-box:fill-box;animation:blink 4.5s infinite}@media (prefers-reduced-motion: reduce){.eye{animation:none}}`}</style>
      <rect x="8" y="12" width="56" height="48" rx="18" fill="var(--accent)" />
      <rect x="14" y="18" width="44" height="36" rx="13" fill="var(--surface)" />
      <circle cx="36" cy="8" r="3.5" fill="var(--ai)" /><rect x="35" y="9" width="2" height="5" fill="var(--accent)" />
      {mood === "done" ? (
        <><path d="M24 34 l4 4 l6 -7" stroke="var(--good)" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M40 34 l4 4 l6 -7" stroke="var(--good)" strokeWidth="3" fill="none" strokeLinecap="round" /></>
      ) : (
        <><ellipse className="eye" cx="28" cy="33" rx="3.2" ry="4.2" fill="var(--text)" /><ellipse className="eye" cx="44" cy="33" rx="3.2" ry="4.2" fill="var(--text)" /></>
      )}
      {mood === "thinking" ? <path d="M30 45 h12" stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round" /> : <path d="M29 43 q7 6 14 0" stroke="var(--text-2)" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
    </motion.svg>
  );
}

const ROLE_SUGGESTIONS = ["Principal Frontend Engineer", "Staff Frontend Engineer", "Lead Frontend Engineer", "Frontend Architect", "Angular Architect", "AI Application Architect", "AI Product Engineer", "Forward Deployed AI Engineer"];
const GEO_SUGGESTIONS = ["Germany", "Ireland", "UAE", "Malaysia", "Singapore", "Remote"];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { ws, deps, reload, reloadDeps, startWorkflow, go, toast } = useStore();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileFile[] | null>(null);
  const [roles, setRoles] = useState<Set<string>>(new Set());
  const [geo, setGeo] = useState<string[]>([]);
  useEffect(() => { api.profile().then(setProfile).catch(() => setProfile([])); }, [ws?.path]);
  const placeholders = (profile || []).reduce((n, f) => n + f.placeholders, 0);
  const required = (deps || []).filter((d) => d.required);
  const steps = ["Welcome", "Workspace", "Tools", "Profile", "Search", "Ready"];

  const pickFolder = async () => {
    const dir = await openDialog({ directory: true, title: "Choose your ai-job-search folder" });
    if (typeof dir === "string") {
      try { await api.setWorkspace(dir); await reload(); await reloadDeps(); toast("Workspace connected", "good"); } catch (e) { toast(String(e), "bad"); }
    }
  };
  const runAndFinish = async (prompt: string) => { const r = await startWorkflow("setup", prompt); if (r) { onDone(); go("activity"); } };
  const searchPrompt = () => {
    const parts = ["/setup --section search"];
    if (roles.size || geo.length) parts.push(`\n\nSuggestions from the desktop app to discuss with me. Ask before using any of them, and never overwrite profile data I've already confirmed:${roles.size ? `\n- Role families: ${[...roles].join(", ")}` : ""}${geo.length ? `\n- Geographic priority: ${geo.join(" > ")}` : ""}`);
    return parts.join("");
  };

  const body = [
    <div key="0" className="text-center">
      <div className="flex justify-center"><Scout size={88} /></div>
      <h1 className="h-title !text-[30px] mt-5">Hi, I'm Scout.</h1>
      <p className="text-ink-2 text-[15px] mt-3 max-w-md mx-auto leading-relaxed">I'll help you find roles worth your time, tailor honest applications, and keep track of every one, without you touching the Terminal.</p>
      <div className="grid grid-cols-3 gap-3 mt-8 text-left">
        {[["Local first", "Your profile, tracker and documents stay in your workspace on this Mac."], ["You stay in control", "Claude asks before it runs commands or writes files. Nothing is ever submitted for you."], ["Real AI, real cost", "Work runs through your Claude Code account and counts toward its limits."]].map(([t, d]) => (
          <div key={t} className="card p-4"><ShieldCheck size={16} className="text-ai" /><div className="font-medium mt-2">{t}</div><div className="text-ink-3 text-[12px] mt-1 leading-relaxed">{d}</div></div>))}
      </div>
    </div>,
    <div key="1">
      <h2 className="h-title">Where's your job-search workspace?</h2>
      <p className="text-ink-2 mt-2">The app drives an <span className="font-mono text-[12px]">ai-job-search</span> folder. Its files stay the source of truth.</p>
      <div className={clsx("card p-4 mt-6 flex items-center gap-3", ws?.valid ? "border-good/40" : "border-warn/40")}>
        {ws?.valid ? <CircleCheck className="text-good" size={18} /> : <CircleX className="text-warn" size={18} />}
        <div className="flex-1 min-w-0"><div className="font-medium">{ws?.valid ? "Workspace found" : "No workspace at the default location"}</div><div className="font-mono text-[11.5px] text-ink-3 truncate">{ws?.path}</div></div>
        <button className="btn" onClick={pickFolder}><FolderOpen size={14} />Choose folder…</button>
      </div>
      {ws?.valid && <div className="text-ink-3 text-[12px] mt-2">Upstream version {ws.upstream_version}</div>}
    </div>,
    <div key="2">
      <h2 className="h-title">Checking your tools</h2>
      <p className="text-ink-2 mt-2">Nothing gets installed for you. Anything missing comes with the official command to run yourself.</p>
      <div className="card mt-6 divide-y divide-line">
        {(deps || []).map((d) => (
          <div key={d.id} className="flex gap-3 p-3">
            {d.ok ? <CircleCheck size={16} className="text-good mt-0.5" /> : <CircleX size={16} className={clsx("mt-0.5", d.required ? "text-bad" : "text-ink-3")} />}
            <div className="flex-1 min-w-0"><div className="font-medium">{d.name}{!d.required && <span className="text-ink-3 font-normal"> · optional</span>}</div>{!d.ok && <div className="text-ink-3 text-[12px] selectable">{d.fix}</div>}</div>
          </div>))}
        {!deps && <div className="skeleton h-24 m-3" />}
      </div>
      <button className="btn mt-3" onClick={reloadDeps}>Check again</button>
    </div>,
    <div key="3">
      <h2 className="h-title">Your professional profile</h2>
      {profile === null ? <div className="skeleton h-24 mt-6" /> : placeholders === 0 ? (
        <div className="card p-5 mt-6 flex items-center gap-4"><Scout size={52} mood="done" /><div><div className="font-medium">Your profile is already set up</div><div className="text-ink-3 text-[12.5px]">You can refine any section later from Profile.</div></div></div>
      ) : (
        <>
          <p className="text-ink-2 mt-2">{placeholders} profile fields are still template placeholders. Claude can fill them from your CV, then ask only about what a CV doesn't cover.</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button className="card p-5 text-left hover:border-accent" onClick={() => runAndFinish("/setup")}><div className="font-medium">Import my CV</div><div className="text-ink-3 text-[12px] mt-1">Give Claude the path to your CV or a documents folder.</div></button>
            <button className="card p-5 text-left hover:border-accent" onClick={() => runAndFinish("/setup")}><div className="font-medium">Answer a few questions</div><div className="text-ink-3 text-[12px] mt-1">A guided interview, one section at a time.</div></button>
          </div>
        </>)}
    </div>,
    <div key="4">
      <h2 className="h-title">What are you looking for?</h2>
      <p className="text-ink-2 mt-2">Optional suggestions. Claude asks before using any of them and never overwrites what you've already confirmed.</p>
      <div className="label mt-6 mb-2">Role families</div>
      <div className="flex flex-wrap gap-2">{ROLE_SUGGESTIONS.map((r) => <button key={r} onClick={() => setRoles((s) => { const n = new Set(s); n.has(r) ? n.delete(r) : n.add(r); return n; })} className={clsx("btn h-8", roles.has(r) && "bg-accent-soft border-accent text-accent-ink")}>{roles.has(r) && <Check size={12} />}{r}</button>)}</div>
      <div className="label mt-6 mb-2">Geographic priority (click in order)</div>
      <div className="flex flex-wrap gap-2">{GEO_SUGGESTIONS.map((g) => { const i = geo.indexOf(g); return <button key={g} onClick={() => setGeo((x) => (i >= 0 ? x.filter((y) => y !== g) : [...x, g]))} className={clsx("btn h-8", i >= 0 && "bg-accent-soft border-accent text-accent-ink")}>{i >= 0 && <span className="tnum font-semibold">{i + 1}</span>}{g}</button>; })}</div>
      <button className="btn btn-primary mt-6" disabled={!roles.size && !geo.length} onClick={() => runAndFinish(searchPrompt())}>Refine my search with Claude</button>
    </div>,
    <div key="5" className="text-center">
      <div className="flex justify-center"><Scout size={80} mood="done" /></div>
      <h2 className="h-title mt-5">You're ready</h2>
      <p className="text-ink-2 mt-2 max-w-md mx-auto">Start on Today. It always shows what needs you next. Press <span className="font-mono">⌘K</span> anywhere to jump or run something.</p>
    </div>,
  ];

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="h-[52px] drag shrink-0" />
      <div className="flex justify-center gap-1.5 mb-2">{steps.map((s, i) => <div key={s} title={s} className={clsx("h-1 rounded-full transition-all duration-300", i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/50" : "w-4 bg-line-strong")} />)}</div>
      <div className="flex-1 overflow-auto grid place-items-center px-8">
        <div className="w-full max-w-[640px] py-8">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}>{body[step]}</motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center gap-2 px-8 py-5 border-t border-line">
        <button className="btn btn-ghost" onClick={onDone}>Skip setup</button>
        <div className="flex-1" />
        {step > 0 && <button className="btn btn-lg" onClick={() => setStep(step - 1)}><ArrowLeft size={14} />Back</button>}
        {(step === 3 || step === 4) && <button className="btn btn-lg" onClick={() => setStep(step + 1)}>Do later</button>}
        {step < steps.length - 1 ? (
          <button className="btn btn-primary btn-lg" disabled={step === 1 && !ws?.valid} onClick={() => setStep(step + 1)}>{step === 0 ? "Get started" : "Continue"}<ArrowRight size={14} /></button>
        ) : <button className="btn btn-primary btn-lg" onClick={onDone}>Open Today<ArrowRight size={14} /></button>}
      </div>
      {required.some((d) => !d.ok) && step === 2 && <div className="sr-only" role="alert">Some required tools are missing</div>}
    </div>
  );
}
