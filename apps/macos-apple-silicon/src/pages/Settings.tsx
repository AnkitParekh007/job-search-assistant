import { useEffect, useState } from "react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import clsx from "clsx";
import { CircleCheck, CircleX, FolderOpen, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { PageHeader } from "../components/ui";

export default function Settings() {
  const { ws, deps, reloadDeps, reload, toast } = useStore();
  const [path, setPath] = useState(ws?.path || "");
  const [theme, setTheme] = useState("dark");
  const [model, setModel] = useState("");
  useEffect(() => { setPath(ws?.path || ""); }, [ws?.path]);
  useEffect(() => { api.getSetting("theme").then((t) => setTheme(t || "dark")); api.getSetting("model").then((m) => setModel(m || "")); }, []);

  const browse = async () => {
    const dir = await openDialog({ directory: true, title: "Choose your ai-job-search folder", defaultPath: ws?.path });
    if (typeof dir === "string") setPath(dir);
  };
  const saveWs = async () => {
    try { await api.setWorkspace(path.trim()); toast("Workspace switched", "good"); reload(); reloadDeps(); } catch (e) { toast(String(e), "bad"); }
  };
  const applyTheme = async (t: string) => {
    setTheme(t);
    if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    try { await api.setSetting("theme", t); } catch { /* preview / non-Tauri still switches visually */ }
  };
  const saveModel = async (m: string) => { setModel(m); await api.setSetting("model", m); };

  return (
    <div className="h-full overflow-auto"><div className="max-w-[820px] mx-auto px-8 pb-12">
      <PageHeader title="Settings" />
      <section className="card p-5 mb-4">
        <div className="font-semibold mb-1">Workspace</div>
        <div className="text-ink-2 text-[12.5px] mb-3">The ai-job-search checkout the app drives. Its files stay authoritative; the app keeps only run history and preferences in its own database.</div>
        <div className="flex gap-2"><input className="input flex-1 font-mono text-[12px]" value={path} onChange={(e) => setPath(e.target.value)} /><button className="btn" onClick={browse}><FolderOpen size={14} />Choose…</button><button className="btn btn-primary" onClick={saveWs} disabled={!path.trim() || path === ws?.path}>Switch</button></div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-[12.5px]">
          <div className="flex justify-between border-b border-line py-1"><span className="text-ink-3">Upstream version</span><span className="font-mono">{ws?.upstream_version || "?"}</span></div>
          <div className="flex justify-between border-b border-line py-1 gap-2"><span className="text-ink-3">App data</span><button className="font-mono truncate text-accent-ink" onClick={() => ws && revealItemInDir(ws.data_dir)}>{ws?.data_dir}</button></div>
        </div>
        <div className="flex gap-2 mt-3"><button className="btn" onClick={() => ws && revealItemInDir(ws.path)}><FolderOpen size={14} />Reveal workspace</button></div>
      </section>

      <section className="card p-5 mb-4">
        <div className="flex items-center mb-3"><div className="font-semibold flex-1">Dependencies</div><button className="btn h-7 text-[12px]" onClick={reloadDeps}><RefreshCw size={12} />Re-check</button></div>
        <div className="divide-y divide-line">
          {(deps || []).map((d) => (
            <div key={d.id} className="py-2.5 flex gap-3">
              {d.ok ? <CircleCheck size={16} className="text-good mt-0.5 shrink-0" /> : <CircleX size={16} className={clsx("mt-0.5 shrink-0", d.required ? "text-bad" : "text-ink-3")} />}
              <div className="min-w-0 flex-1">
                <div className="font-medium">{d.name}{!d.required && <span className="text-ink-3 font-normal"> · optional</span>}</div>
                <div className="text-[12px] text-ink-2 font-mono truncate selectable">{d.detail}</div>
                {!d.ok && <div className="text-[12px] text-ink-2 mt-1 selectable">{d.fix}</div>}
              </div>
            </div>))}
          {!deps && <div className="skeleton h-20" />}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-2">The app never runs installers on its own. Commands shown are the official install paths; run them yourself in Terminal.</div>
      </section>

      <section className="card p-5 mb-4">
        <div className="font-semibold mb-1">AI execution</div>
        <div className="text-ink-2 text-[12.5px] mb-3">Workflows run through your signed-in Claude Code. They send profile and posting content to Anthropic under your Claude plan or API account, and they count toward its limits or bill your credits. They are not free. Upstream permission rules in <span className="font-mono">.claude/settings.json</span> apply, and everything else asks you in the app. No permission-bypass mode is ever used.</div>
        <label className="label block mb-1">Model for new runs</label>
        <select className="input" value={model} onChange={(e) => saveModel(e.target.value)}>
          <option value="">Claude Code default</option><option value="opus">Opus</option><option value="sonnet">Sonnet</option><option value="haiku">Haiku (cheapest)</option>
        </select>
      </section>

      <section className="card p-5 mb-4">
        <div className="font-semibold mb-3">Appearance</div>
        <div className="flex gap-1 p-1 rounded-lg bg-sunken w-fit">
          {["system", "light", "dark"].map((t) => <button key={t} onClick={() => applyTheme(t)} className={clsx("btn h-7 border-0 capitalize", theme === t ? "bg-surface shadow-sm" : "btn-ghost")}>{t}</button>)}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-2">Dark is the default. System follows macOS appearance. Animations follow macOS "Reduce motion".</div>
      </section>

      <section className="card p-5">
        <div className="font-semibold mb-1">Integrations</div>
        <div className="text-ink-2 text-[12.5px]">Gmail sync uses the claude.ai Gmail connector, and Notion sync uses a Notion MCP server, both configured in Claude Code itself. The app stores no credentials. Start those workflows from Workflows; each proposes changes and waits for your approval before writing.</div>
      </section>
    </div></div>
  );
}
