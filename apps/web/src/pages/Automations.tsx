import { useEffect, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, Play, PlugZap } from "lucide-react";
import { WORKFLOWS, buildPrompt, Workflow } from "../lib/workflows";
import { useStore } from "../lib/store";
import { PageHeader } from "../components/ui";

function Launcher({ w }: { w: Workflow }) {
  const { startWorkflow, go } = useStore();
  const [arg, setArg] = useState("");
  const [confirm, setConfirm] = useState(false);
  const required = w.args?.some((a) => !a.optional);
  const destructive = w.id === "reset";
  const run = async () => {
    if (destructive && !confirm) { setConfirm(true); return; }
    const r = await startWorkflow(w.id, buildPrompt(w, arg));
    if (r) go("activity");
  };
  return (
    <div className="card p-4 flex flex-col">
      <div className="flex items-center gap-2"><span className="font-mono text-[12px] text-accent-ink bg-accent-soft rounded-md px-1.5 py-0.5">{w.command}</span><span className="font-semibold">{w.title}</span>{w.kind === "skill" && <span className="chip bg-sunken text-ink-3">skill</span>}</div>
      <div className="text-ink-2 text-[12.5px] mt-2 leading-relaxed flex-1">{w.blurb}</div>
      {w.external && <div className="flex items-center gap-1.5 text-[12px] text-info mt-2"><PlugZap size={13} />Needs {w.external}. Claude reports clearly if it isn't connected.</div>}
      <div className="text-[11.5px] text-ink-3 mt-2">May change: {w.writes}</div>
      {w.args?.map((a) => <input key={a.name} className="input w-full mt-3" placeholder={a.placeholder} value={arg} onChange={(e) => setArg(e.target.value)} />)}
      {confirm && <div className="mt-3 rounded-lg bg-bad-soft text-bad px-3 py-2 text-[12px] flex gap-2"><AlertTriangle size={14} className="shrink-0 mt-0.5" />/reset rewrites your profile files. Claude will show exactly what it plans to reset and ask again before changing anything. Back up first from Settings.</div>}
      <button className={clsx("btn mt-3 w-fit", destructive ? "btn-danger" : "btn-primary")} disabled={required && !arg.trim()} onClick={run}><Play size={13} />{confirm ? "I understand, start /reset" : "Run"}</button>
    </div>
  );
}

export default function Automations() {
  const [hl, setHl] = useState<string | null>(sessionStorage.getItem("wf"));
  useEffect(() => { sessionStorage.removeItem("wf"); const t = setTimeout(() => setHl(null), 2500); return () => clearTimeout(t); }, []);
  return (
    <div className="h-full overflow-auto px-6 pb-8">
      <PageHeader title="Workflows" subtitle="Every upstream command and skill, run through Claude Code in this workspace. Runs use your Claude plan or API credits." />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {WORKFLOWS.map((w) => <div key={w.id} className={clsx("rounded-[15px] transition-shadow", hl === w.id && "ring-2 ring-accent")}><Launcher w={w} /></div>)}
      </div>
    </div>
  );
}
