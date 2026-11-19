import { useEffect, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, Play, PlugZap } from "lucide-react";
import {
  WORKFLOWS, buildPrompt, Workflow, providerSupportsWorkflow, PROVIDER_LABEL,
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
  const run = async () => {
    if (destructive && !confirm) { setConfirm(true); return; }
    const r = await startWorkflow(w.id, buildPrompt(w, arg));
    if (r) go("activity");
  };
  return (
    <div className={clsx("card p-4 flex flex-col", !supported && "opacity-70")}>
      <div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-[12px] text-accent-ink bg-accent-soft rounded-md px-1.5 py-0.5">{w.command}</span><span className="font-semibold">{w.title}</span>{w.kind === "skill" && <span className="chip bg-sunken text-ink-3">skill</span>}{!supported && <span className="chip bg-you-soft text-you">Claude only</span>}</div>
      <div className="text-ink-2 text-[12.5px] mt-2 leading-relaxed flex-1">{w.blurb}</div>
      {w.external && <div className="flex items-center gap-1.5 text-[12px] text-info mt-2"><PlugZap size={13} />Needs {w.external}. Claude reports clearly if it isn't connected.</div>}
      <div className="text-[11.5px] text-ink-3 mt-2">May change: {w.writes}</div>
      {w.args?.map((a) => <input key={a.name} className="input w-full mt-3" placeholder={a.placeholder} value={arg} onChange={(e) => setArg(e.target.value)} disabled={!supported} />)}
      {confirm && <div className="mt-3 rounded-lg bg-bad-soft text-bad px-3 py-2 text-[12px] flex gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" />/reset rewrites your profile files. Claude will show exactly what it plans to reset and ask again before changing anything. Back up first from Settings.</div>}
      <button className={clsx("btn mt-3 w-fit", destructive ? "btn-danger" : "btn-primary")} disabled={!supported || (required && !arg.trim())} onClick={run}><Play size={13} />{confirm ? "I understand, start /reset" : supported ? "Run" : `Needs ${PROVIDER_LABEL.claude}`}</button>
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
      <PageHeader title="Workflows" subtitle={`Upstream commands and skills, routed through your default provider (${PROVIDER_LABEL[provider] || provider}). Codex runs use equivalent instructions — not Claude slash commands.`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {WORKFLOWS.map((w) => <div key={w.id} className={clsx("rounded-[15px] transition-shadow", hl === w.id && "ring-2 ring-accent")}><Launcher w={w} provider={provider} /></div>)}
      </div>
    </div>
  );
}
