import { useEffect, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, Play, PlugZap } from "lucide-react";
import {
  WORKFLOWS, buildPrompt, Workflow, providerSupportsWorkflow, PROVIDER_LABEL, unsupportedReason, PROVIDER_META,
} from "@ai-job-search/core";
import { api } from "@ai-job-search/runtime";
import { useStore } from "../store";
import { PageHeader } from "../components/ui";

function Launcher({ w, provider }: { w: Workflow; provider: string }) {
  const { startWorkflow, go } = useStore();
  const [arg, setArg] = useState("");
  const [confirm, setConfirm] = useState(false);
  const required = w.args?.some((a) => !a.optional);
  const destructive = w.id === "reset";
  const supported = providerSupportsWorkflow(provider, w.id);
  const reason = unsupportedReason(provider, w.id);
  const meta = PROVIDER_META[provider as keyof typeof PROVIDER_META];
  const inference = meta?.execution === "inference" || meta?.execution === "hybrid";
  const run = async () => {
    if (destructive && !confirm) { setConfirm(true); return; }
    const r = await startWorkflow(w.id, buildPrompt(w, arg));
    if (r) go("activity");
  };
  const badge = !supported
    ? (provider === "codex" ? "Codex unsupported" : `${PROVIDER_LABEL[provider] || provider} unsupported`)
    : (inference && supported ? "Structured assist" : null);
  return (
    <div className={clsx("card p-4 flex flex-col", !supported && "opacity-70")}>
      <div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-[12px] text-accent-ink bg-accent-soft rounded-md px-1.5 py-0.5">{w.command}</span><span className="font-semibold">{w.title}</span>{w.kind === "skill" && <span className="chip bg-sunken text-ink-3">skill</span>}{badge && <span className="chip bg-you-soft text-you">{badge}</span>}</div>
      <div className="text-ink-2 text-[12.5px] mt-2 leading-relaxed flex-1">{w.blurb}</div>
      {w.external && <div className="flex items-center gap-1.5 text-[12px] text-info mt-2"><PlugZap size={13} />Needs {w.external}. Claude reports clearly if it isn't connected.</div>}
      <div className="text-[11.5px] text-ink-3 mt-2">May change: {inference && supported ? "advisory JSON only (no automatic writes)" : w.writes}</div>
      {!supported && reason && <div className="text-[11.5px] text-you mt-2">{reason}</div>}
      {supported && inference && <div className="text-[11.5px] text-ink-3 mt-2">Provider: {PROVIDER_LABEL[provider]} · model from Settings · no tool execution · no auto-submit</div>}
      {w.args?.map((a) => <input key={a.name} className="input w-full mt-3" placeholder={a.placeholder} value={arg} onChange={(e) => setArg(e.target.value)} disabled={!supported} />)}
      {confirm && <div className="mt-3 rounded-lg bg-bad-soft text-bad px-3 py-2 text-[12px] flex gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" />/reset rewrites your profile files. Claude will show exactly what it plans to reset and ask again before changing anything. Back up first from Settings.</div>}
      <button className={clsx("btn mt-3 w-fit", destructive ? "btn-danger" : "btn-primary")} disabled={!supported || (required && !arg.trim())} onClick={run}><Play size={13} />{confirm ? "I understand, start /reset" : supported ? "Run" : "Unsupported"}</button>
    </div>
  );
}

export default function Automations() {
  const [hl, setHl] = useState<string | null>(sessionStorage.getItem("wf"));
  const [provider, setProvider] = useState("claude");
  useEffect(() => { sessionStorage.removeItem("wf"); const t = setTimeout(() => setHl(null), 2500); return () => clearTimeout(t); }, []);
  useEffect(() => { api.getSetting("ai_provider").then((p) => setProvider(p || "claude")).catch(() => {}); }, []);
  return (
    <div className="h-full overflow-auto px-6 pb-8">
      <PageHeader title="Workflows" subtitle={`Routed through ${PROVIDER_LABEL[provider] || provider}. Claude uses upstream slash commands; Codex uses agentic instructions; OpenAI API / Gemini / Ollama run structured assists only.`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {WORKFLOWS.map((w) => <div key={w.id} className={clsx("rounded-[15px] transition-shadow", hl === w.id && "ring-2 ring-accent")}><Launcher w={w} provider={provider} /></div>)}
      </div>
    </div>
  );
}
