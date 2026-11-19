import { useEffect, useState } from "react";
import { revealItemInDir } from "@ai-job-search/runtime";
import { open as openDialog } from "@ai-job-search/runtime";
import clsx from "clsx";
import { CircleCheck, CircleX, FolderOpen, KeyRound, Loader2, PlugZap, RefreshCw, Trash2, Zap } from "lucide-react";
import { api } from "@ai-job-search/runtime";
import type { ProviderStatus } from "@ai-job-search/core";
import { PROVIDER_LABEL, PROVIDER_META, providerUiStatus, type ProviderId } from "@ai-job-search/core";
import { useStore } from "../store";
import { PageHeader } from "../components/ui";

type ModelOption = { id: string; name?: string };

export default function Settings() {
  const { ws, deps, reloadDeps, reload, toast } = useStore();
  const [path, setPath] = useState(ws?.path || "");
  const [theme, setTheme] = useState("dark");
  const [model, setModel] = useState("");
  const [codexModel, setCodexModel] = useState("");
  const [openaiModel, setOpenaiModel] = useState("");
  const [geminiModel, setGeminiModel] = useState("");
  const [ollamaModel, setOllamaModel] = useState("");
  const [ollamaEndpoint, setOllamaEndpoint] = useState("http://127.0.0.1:11434");
  const [provider, setProvider] = useState("claude");
  const [providers, setProviders] = useState<ProviderStatus[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [accountDetail, setAccountDetail] = useState<Record<string, string>>({});
  const [keyDraft, setKeyDraft] = useState<Record<string, string>>({});
  const [discovered, setDiscovered] = useState<Record<string, ModelOption[]>>({});
  const [configOpen, setConfigOpen] = useState<string | null>(null);

  useEffect(() => { setPath(ws?.path || ""); }, [ws?.path]);
  useEffect(() => {
    api.getSetting("theme").then((t) => setTheme(t || "dark"));
    api.getSetting("model").then((m) => setModel(m || ""));
    api.getSetting("codex_model").then((m) => setCodexModel(m || ""));
    api.getSetting("openai_api_model").then((m) => setOpenaiModel(m || ""));
    api.getSetting("gemini_model").then((m) => setGeminiModel(m || ""));
    api.getSetting("ollama_model").then((m) => setOllamaModel(m || ""));
    api.getSetting("ollama_endpoint").then((m) => setOllamaEndpoint(m || "http://127.0.0.1:11434"));
    api.getSetting("ai_provider").then((p) => setProvider(p || "claude"));
    void refreshProviders();
  }, []);

  const refreshProviders = async () => {
    try {
      if (typeof api.providers === "function") setProviders(await api.providers());
      else setProviders([]);
    } catch { setProviders([]); }
  };

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
  const saveCodexModel = async (m: string) => { setCodexModel(m); await api.setSetting("codex_model", m); };
  const saveOpenaiModel = async (m: string) => { setOpenaiModel(m); await api.setSetting("openai_api_model", m); };
  const saveGeminiModel = async (m: string) => { setGeminiModel(m); await api.setSetting("gemini_model", m); };
  const saveOllamaModel = async (m: string) => { setOllamaModel(m); await api.setSetting("ollama_model", m); };
  const saveOllamaEndpoint = async (m: string) => { setOllamaEndpoint(m); await api.setSetting("ollama_endpoint", m.trim()); };
  const saveProvider = async (p: string) => {
    setProvider(p);
    await api.setSetting("ai_provider", p);
    toast(`Default provider: ${PROVIDER_LABEL[p] || p}`, "good");
  };

  const checkAccount = async (id: string) => {
    if (typeof api.providerAccount !== "function") return;
    setBusy(`account:${id}`);
    try {
      const a = await api.providerAccount(id);
      let summary = "checked";
      if (id === "codex") {
        summary = a?.account
          ? `${a.account.type}${a.account.email ? ` · ${a.account.email}` : ""}${a.account.planType ? ` · ${a.account.planType}` : ""}`
          : (a?.requiresOpenaiAuth ? "signed out" : "no account");
      } else if (id === "openai_api" || id === "gemini" || id === "ollama") {
        summary = a?.loggedIn ? `connected · ${a.authMethod || "?"}` : "not connected";
      } else {
        summary = a?.loggedIn ? `signed in via ${a.authMethod || "?"}` : "signed out";
      }
      setAccountDetail((d) => ({ ...d, [id]: summary }));
      toast(summary, a?.account || a?.loggedIn ? "good" : "info");
      await refreshProviders();
    } catch (e) { toast(String(e), "bad"); }
    finally { setBusy(null); }
  };

  const connect = async (id: string) => {
    if (typeof api.providerLogin !== "function") return;
    setBusy(`login:${id}`);
    try {
      const r = await api.providerLogin(id, id === "codex" ? "chatgpt" : undefined);
      toast(r?.success === false ? (r.error || "Sign-in failed") : "Sign-in started — finish in the browser if prompted", r?.success === false ? "bad" : "good");
      await checkAccount(id);
    } catch (e) { toast(String(e), "bad"); }
    finally { setBusy(null); }
  };

  const saveKey = async (id: string) => {
    const setCred = (api as { providerSetCredential?: (p: string, s: string) => Promise<unknown> }).providerSetCredential;
    if (typeof setCred !== "function") {
      toast("Credential storage requires the desktop app", "bad");
      return;
    }
    const secret = (keyDraft[id] || "").trim();
    if (!secret) { toast("Paste an API key first", "bad"); return; }
    setBusy(`key:${id}`);
    try {
      await setCred(id, secret);
      setKeyDraft((d) => ({ ...d, [id]: "" }));
      toast("API key stored in OS keychain", "good");
      await checkAccount(id);
    } catch (e) { toast(String(e), "bad"); }
    finally { setBusy(null); }
  };

  const clearKey = async (id: string) => {
    const clearCred = (api as { providerClearCredential?: (p: string) => Promise<unknown> }).providerClearCredential;
    if (typeof clearCred !== "function") return;
    setBusy(`clear:${id}`);
    try {
      await clearCred(id);
      toast("API key removed from keychain", "good");
      await refreshProviders();
    } catch (e) { toast(String(e), "bad"); }
    finally { setBusy(null); }
  };

  const testProvider = async (id: string) => {
    const test = (api as { providerTest?: (p: string) => Promise<any> }).providerTest;
    if (typeof test !== "function") return;
    setBusy(`test:${id}`);
    try {
      const r = await test(id);
      toast(r?.ok === false ? (r.error || "Test failed") : (r?.message || "Connection OK"), r?.ok === false ? "bad" : "good");
      if (r?.memory_warning) toast(String(r.memory_warning), "info");
    } catch (e) { toast(String(e), "bad"); }
    finally { setBusy(null); }
  };

  const refreshModels = async (id: string) => {
    if (typeof api.providerModels !== "function") return;
    setBusy(`models:${id}`);
    try {
      const r = await api.providerModels(id);
      const data: ModelOption[] = Array.isArray(r?.data)
        ? r.data.map((m: any) => ({ id: m.id || m.name, name: m.name || m.id }))
        : [];
      setDiscovered((d) => ({ ...d, [id]: data }));
      toast(data.length ? `${data.length} models` : "No models returned", data.length ? "good" : "info");
    } catch (e) { toast(String(e), "bad"); }
    finally { setBusy(null); }
  };

  const needsKey = (id: string) => id === "openai_api" || id === "gemini";
  const statusChip = (p: ProviderStatus) => {
    const s = providerUiStatus(p);
    const tone = s === "Ready" ? "bg-good-soft text-good"
      : s.includes("Auth") || s.includes("Not") ? "bg-you-soft text-you"
      : s === "Experimental" ? "bg-sunken text-ink-3"
      : "bg-bad-soft text-bad";
    return <span className={clsx("chip", tone)}>{s}</span>;
  };

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
        <div className="flex items-center mb-3"><div className="font-semibold flex-1">AI Providers</div><button className="btn h-7 text-[12px]" onClick={() => { refreshProviders(); reloadDeps(); }}><RefreshCw size={12} />Refresh</button></div>
        <div className="text-ink-2 text-[12.5px] mb-3">
          Configure Claude Code, OpenAI Codex, OpenAI Platform API, Gemini, or Ollama. API keys stay in the OS keychain — never SQLite or the UI bundle.
          Cloud usage bills against your provider plan. Ollama stays local unless you set a remote endpoint.
        </div>
        <div className="space-y-3">
          {(providers || []).map((p) => {
            const selected = provider === p.id;
            const connecting = busy?.startsWith("account:") || busy?.startsWith("login:") || busy?.startsWith("test:") || busy?.startsWith("key:") || busy?.startsWith("models:") || busy?.startsWith("clear:");
            const meta = PROVIDER_META[p.id as ProviderId];
            const open = configOpen === p.id;
            return (
              <div key={p.id} className={clsx("rounded-xl border p-4", selected ? "border-accent bg-accent-soft/40" : "border-line")}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.name}</span>
                      {meta?.experimental && <span className="chip bg-sunken text-ink-3">Experimental</span>}
                      {selected && <span className="chip bg-accent-soft text-accent-ink">Default</span>}
                      {statusChip(p)}
                      {meta?.local ? <span className="chip bg-sunken text-ink-3">Local</span> : <span className="chip bg-sunken text-ink-3">Cloud</span>}
                    </div>
                    <div className="text-[12.5px] text-ink-2 mt-1 selectable">{accountDetail[p.id] || p.detail}</div>
                    {!p.available && <div className="text-[12px] text-ink-3 mt-1 selectable">{p.fix}</div>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.capabilities.filter((c) => c.supported).slice(0, 5).map((c) => (
                        <span key={c.id} className="chip bg-sunken text-ink-3 text-[11px]">{c.label}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button className="btn h-7 text-[12px]" disabled={!!connecting} onClick={() => checkAccount(p.id)}>
                      {busy === `account:${p.id}` ? <Loader2 size={12} className="animate-spin" /> : null}Status
                    </button>
                    {p.id === "codex" && (
                      <button className="btn btn-primary h-7 text-[12px]" disabled={!!connecting || !p.available} onClick={() => connect(p.id)}>
                        {busy === `login:${p.id}` ? <Loader2 size={12} className="animate-spin" /> : <PlugZap size={12} />}Connect
                      </button>
                    )}
                    {(needsKey(p.id) || p.id === "ollama") && (
                      <button className="btn h-7 text-[12px]" onClick={() => setConfigOpen(open ? null : p.id)}>
                        <KeyRound size={12} />{open ? "Hide" : "Configure"}
                      </button>
                    )}
                    <button className="btn h-7 text-[12px]" disabled={!!connecting} onClick={() => testProvider(p.id)}>
                      {busy === `test:${p.id}` ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}Test
                    </button>
                    <button className="btn h-7 text-[12px]" disabled={p.planned} onClick={() => saveProvider(p.id)}>
                      {selected ? "Selected" : "Use as default"}
                    </button>
                  </div>
                </div>

                {open && needsKey(p.id) && (
                  <div className="mt-3 pt-3 border-t border-line space-y-2">
                    <div className="text-[12px] text-ink-2">
                      {p.id === "openai_api"
                        ? "OpenAI Platform API key (not a ChatGPT / Codex login). Stored in macOS Keychain."
                        : "Gemini Developer API key (optional if using Gemini CLI). Stored in macOS Keychain."}
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="input flex-1 font-mono text-[12px]"
                        type="password"
                        autoComplete="off"
                        placeholder="Paste API key — never committed or logged"
                        value={keyDraft[p.id] || ""}
                        onChange={(e) => setKeyDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                      />
                      <button className="btn btn-primary h-9 text-[12px]" disabled={!!connecting} onClick={() => saveKey(p.id)}>Save</button>
                      <button className="btn h-9 text-[12px]" disabled={!!connecting} onClick={() => clearKey(p.id)}><Trash2 size={12} />Remove</button>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <button className="btn h-7 text-[12px]" disabled={!!connecting} onClick={() => refreshModels(p.id)}>
                        {busy === `models:${p.id}` ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}Refresh models
                      </button>
                      {p.id === "openai_api" && (
                        <select className="input h-8 text-[12px] w-auto" value={openaiModel} onChange={(e) => saveOpenaiModel(e.target.value)}>
                          <option value="">Default (gpt-4.1-mini)</option>
                          {(discovered.openai_api || p.models.map((id) => ({ id }))).map((m) => (
                            <option key={m.id} value={m.id}>{m.name || m.id}</option>
                          ))}
                        </select>
                      )}
                      {p.id === "gemini" && (
                        <select className="input h-8 text-[12px] w-auto" value={geminiModel} onChange={(e) => saveGeminiModel(e.target.value)}>
                          <option value="">Default (gemini-2.0-flash)</option>
                          {(discovered.gemini || p.models.map((id) => ({ id }))).map((m) => (
                            <option key={m.id} value={m.id}>{m.name || m.id}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {open && p.id === "ollama" && (
                  <div className="mt-3 pt-3 border-t border-line space-y-2">
                    <div className="text-[12px] text-ink-2">Local by default. Changing the endpoint to a non-loopback host marks the connection as remote — there is no silent cloud fallback.</div>
                    <div className="flex gap-2">
                      <input className="input flex-1 font-mono text-[12px]" value={ollamaEndpoint} onChange={(e) => setOllamaEndpoint(e.target.value)} onBlur={() => saveOllamaEndpoint(ollamaEndpoint)} />
                      <button className="btn h-9 text-[12px]" onClick={() => saveOllamaEndpoint(ollamaEndpoint)}>Save endpoint</button>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <button className="btn h-7 text-[12px]" disabled={!!connecting} onClick={() => refreshModels("ollama")}>
                        {busy === "models:ollama" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}Refresh models
                      </button>
                      <select className="input h-8 text-[12px] w-auto" value={ollamaModel} onChange={(e) => saveOllamaModel(e.target.value)}>
                        <option value="">First available model</option>
                        {(discovered.ollama || p.models.map((id) => ({ id }))).map((m) => (
                          <option key={m.id} value={m.id}>{m.name || m.id}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[11px] text-ink-3">The app never auto-downloads models. Run <span className="font-mono">ollama pull &lt;model&gt;</span> yourself.</div>
                  </div>
                )}
              </div>
            );
          })}
          {!providers && <div className="skeleton h-24" />}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="label block mb-1">Claude model (new runs)</label>
            <select className="input" value={model} onChange={(e) => saveModel(e.target.value)}>
              <option value="">Claude Code default</option>
              <option value="opus">Opus</option>
              <option value="sonnet">Sonnet</option>
              <option value="haiku">Haiku (cheapest)</option>
            </select>
          </div>
          <div>
            <label className="label block mb-1">Codex model (new runs)</label>
            <input className="input font-mono text-[12px]" placeholder="Provider default (recommended)" value={codexModel} onChange={(e) => saveCodexModel(e.target.value)} />
            <div className="text-[11px] text-ink-3 mt-1">Leave blank for Codex default.</div>
          </div>
        </div>
        <div className="text-[11.5px] text-ink-3 mt-3">
          Claude uses upstream <span className="font-mono">.claude/settings.json</span> plus in-app approvals.
          Codex uses app-server <span className="font-mono">approvalPolicy: on-request</span> and <span className="font-mono">workspace-write</span> sandbox.
          OpenAI API / Gemini API / Ollama run structured inference only — they do not execute tools or auto-submit applications.
        </div>
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
        <div className="font-semibold mb-3">Appearance</div>
        <div className="flex gap-1 p-1 rounded-lg bg-sunken w-fit">
          {["system", "light", "dark"].map((t) => <button key={t} onClick={() => applyTheme(t)} className={clsx("btn h-7 border-0 capitalize", theme === t ? "bg-surface shadow-sm" : "btn-ghost")}>{t}</button>)}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-2">Dark is the default. System follows macOS appearance. Animations follow macOS "Reduce motion".</div>
      </section>

      <section className="card p-5">
        <div className="font-semibold mb-1">Integrations</div>
        <div className="text-ink-2 text-[12.5px]">Gmail sync uses the claude.ai Gmail connector, and Notion sync uses a Notion MCP server, both configured in Claude Code itself. Those workflows require the Claude provider. API keys for OpenAI/Gemini are OS-keychain only; the app never stores them in SQLite.</div>
      </section>
    </div></div>
  );
}
