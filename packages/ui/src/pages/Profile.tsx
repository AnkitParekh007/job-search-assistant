import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { RefreshCw, Save, UserRoundCog, Wand2 } from "lucide-react";
import {
  emptyProfile,
  mergeFact,
  parseResumeFromText,
  type CandidateFact,
  type CandidateProfile,
  type ParseDiagnostics,
} from "@ai-job-search/core";
import { api, open as openDialog, ProfileFile } from "@ai-job-search/runtime";
import { useStore } from "../store";
import { Markdown, PageHeader } from "../components/ui";

const NICE: Record<string, string> = {
  "CLAUDE.md": "Overview (CLAUDE.md)", "01-candidate-profile.md": "Candidate profile", "02-behavioral-profile.md": "Work style", "03-writing-style.md": "Writing style",
  "04-job-evaluation.md": "Evaluation rubric", "05-cv-templates.md": "CV template rules", "06-cover-letter-templates.md": "Cover letter rules", "07-interview-prep.md": "Interview stories", "search-queries.md": "Search strategy",
};

const AUTH_OPTS = [
  { value: "unknown", label: "Unknown" },
  { value: "authorized", label: "Authorized" },
  { value: "needs_sponsorship", label: "Needs sponsorship" },
] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Coerce API payload (or empty stub) into the structured CandidateProfile shape. */
function normalizeProfile(raw: unknown): CandidateProfile {
  const base = emptyProfile();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const prefs = (r.preferences && typeof r.preferences === "object" ? r.preferences : {}) as Record<string, unknown>;
  const auth =
    (typeof r.workAuthorization === "string" && r.workAuthorization) ||
    (typeof r.work_authorization === "string" && r.work_authorization) ||
    "unknown";

  let facts: CandidateFact[] = [];
  if (Array.isArray(r.facts)) {
    facts = r.facts.filter((f): f is CandidateFact => !!f && typeof f === "object" && typeof (f as CandidateFact).field === "string");
  } else if (r.facts && typeof r.facts === "object") {
    // Legacy object map → array
    facts = Object.entries(r.facts as Record<string, Record<string, unknown>>).map(([field, v], i) => ({
      id: typeof v.id === "string" ? v.id : `legacy-${field}-${i}`,
      field,
      value: String(v.value ?? ""),
      source: (v.source as CandidateFact["source"]) || "user",
      confidence: typeof v.confidence === "number" ? v.confidence : 1,
      confirmed: !!v.confirmed,
    }));
  }

  return {
    schema_version: typeof r.schema_version === "number" ? r.schema_version : 1,
    name: String(r.name ?? ""),
    headline: String(r.headline ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    location: String(r.location ?? ""),
    workAuthorization: auth,
    preferences: {
      countries: Array.isArray(prefs.countries) ? prefs.countries.map(String) : [],
      remote: prefs.remote === true ? true : prefs.remote === false ? false : null,
      salaryMin: typeof prefs.salaryMin === "number" ? prefs.salaryMin : undefined,
      salaryMax: typeof prefs.salaryMax === "number" ? prefs.salaryMax : undefined,
      seniority: Array.isArray(prefs.seniority) ? prefs.seniority.map(String) : typeof prefs.seniority === "string" && prefs.seniority ? [String(prefs.seniority)] : undefined,
    },
    facts,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : base.updatedAt,
  };
}

function AgentFilesPane({ wsPath }: { wsPath?: string }) {
  const [files, setFiles] = useState<ProfileFile[]>([]);
  const [sel, setSel] = useState(0);
  const load = () => api.profile().then(setFiles).catch(() => setFiles([]));
  useEffect(() => { load(); }, [wsPath]);
  const f = files[sel];
  return (
    <div className="flex-1 min-h-0 flex border-t border-line">
      <div className="w-60 shrink-0 border-r border-line overflow-auto p-2">
        {files.map((x, i) => (
          <button key={x.path} onClick={() => setSel(i)} className={clsx("w-full text-left px-3 py-2 rounded-lg", sel === i ? "bg-surface shadow-sm" : "hover:bg-surface/60")}>
            <div className="font-medium text-[13px]">{NICE[x.path.split("/").pop()!] || x.path}</div>
            <div className="text-[11px] text-ink-3 font-mono truncate">{x.path}</div>
            {x.placeholders > 0 && <span className="chip bg-warn-soft text-warn mt-1">{x.placeholders} unfilled</span>}
          </button>))}
        <button className="btn btn-ghost w-full mt-2 text-[12px]" onClick={load}><RefreshCw size={12} />Reload</button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {f ? <div className="max-w-3xl"><div className="text-[11.5px] text-ink-3 mb-3">Read-only view. Use AI setup to update these grounding files. Your profile is personal data: never push it to a public fork.</div><Markdown text={f.content.replace(/^---[\s\S]*?---\n/, "")} /></div> : <div className="skeleton h-40" />}
      </div>
    </div>
  );
}

function EditFormPane() {
  const { toast, ws } = useStore();
  const [profile, setProfile] = useState<CandidateProfile>(() => emptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [pendingFacts, setPendingFacts] = useState<CandidateFact[] | null>(null);
  const [diagnostics, setDiagnostics] = useState<ParseDiagnostics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await api.candidateProfile();
      setProfile(normalizeProfile(raw));
    } catch {
      setProfile(emptyProfile());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, ws?.path]);

  const setField = <K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const setPref = <K extends keyof CandidateProfile["preferences"]>(key: K, value: CandidateProfile["preferences"][K]) =>
    setProfile((p) => ({ ...p, preferences: { ...p.preferences, [key]: value } }));

  const parseResume = () => {
    const result = parseResumeFromText(resumeText);
    setDiagnostics(result.diagnostics);
    setPendingFacts(result.facts.map((f) => ({ ...f })));
    if (!result.facts.length) {
      toast(result.diagnostics.warnings[0] || "No facts extracted", "info");
    } else {
      toast(`Parsed ${result.facts.length} fact${result.facts.length === 1 ? "" : "s"} — confirm or reject each`, "info");
    }
  };

  const importResumeFile = async () => {
    try {
      const picked = await openDialog({
        multiple: false,
        title: "Choose a resume (PDF, DOCX, or text)",
        filters: [{ name: "Resume", extensions: ["pdf", "docx", "txt", "md"] }],
      });
      const path = Array.isArray(picked) ? picked[0] : picked;
      if (typeof path !== "string" || !path) return;
      const extracted = await api.extractResumeText(path);
      setResumeText(extracted.text || "");
      toast(`Loaded ${extracted.chars} characters from resume file`, "good");
    } catch (e) {
      toast(String(e), "bad");
    }
  };

  const setFactConfirmed = (id: string, confirmed: boolean) => {
    setPendingFacts((list) => list?.map((f) => (f.id === id ? { ...f, confirmed } : f)) ?? null);
  };

  const setFactValue = (id: string, value: string) => {
    setPendingFacts((list) => list?.map((f) => (f.id === id ? { ...f, value, source: "user" as const, confidence: 1 } : f)) ?? null);
  };

  const save = async () => {
    setSaving(true);
    try {
      let next: CandidateProfile = {
        ...profile,
        preferences: {
          ...profile.preferences,
          countries: profile.preferences.countries,
        },
        updatedAt: new Date().toISOString(),
      };
      if (pendingFacts?.length) {
        for (const f of pendingFacts) {
          next = mergeFact(next, f);
        }
      }
      const saved = await api.saveCandidateProfile(next);
      setProfile(normalizeProfile(saved));
      setPendingFacts(null);
      setDiagnostics(null);
      toast("Profile saved", "good");
    } catch (e) {
      toast(String(e), "bad");
    } finally {
      setSaving(false);
    }
  };

  const countriesStr = profile.preferences.countries.join(", ");
  const seniorityStr = (profile.preferences.seniority || []).join(", ");
  const remoteVal = profile.preferences.remote === true ? "yes" : profile.preferences.remote === false ? "no" : "";

  if (loading) return <div className="flex-1 p-6"><div className="skeleton h-40 max-w-3xl" /></div>;

  return (
    <div className="flex-1 min-h-0 overflow-auto border-t border-line">
      <div className="max-w-3xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label block mb-1">Name</label><input className="input w-full" value={profile.name} onChange={(e) => setField("name", e.target.value)} autoComplete="name" /></div>
          <div><label className="label block mb-1">Headline</label><input className="input w-full" value={profile.headline} onChange={(e) => setField("headline", e.target.value)} placeholder="e.g. Principal engineer · AI platforms" /></div>
          <div><label className="label block mb-1">Email</label><input className="input w-full" type="email" value={profile.email} onChange={(e) => setField("email", e.target.value)} autoComplete="email" /></div>
          <div><label className="label block mb-1">Phone</label><input className="input w-full" value={profile.phone} onChange={(e) => setField("phone", e.target.value)} autoComplete="tel" /></div>
          <div><label className="label block mb-1">Location</label><input className="input w-full" value={profile.location} onChange={(e) => setField("location", e.target.value)} placeholder="City, country" /></div>
          <div>
            <label className="label block mb-1">Work authorization</label>
            <select className="input w-full" value={profile.workAuthorization || "unknown"} onChange={(e) => setField("workAuthorization", e.target.value)}>
              {AUTH_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="h-section mb-2">Preferences</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label block mb-1">Countries (comma-separated)</label>
              <input className="input w-full" value={countriesStr} onChange={(e) => setPref("countries", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="US, DE, NL" />
            </div>
            <div>
              <label className="label block mb-1">Remote</label>
              <select className="input w-full" value={remoteVal} onChange={(e) => {
                const v = e.target.value;
                setPref("remote", v === "yes" ? true : v === "no" ? false : null);
              }}>
                <option value="">No preference</option>
                <option value="yes">Remote only</option>
                <option value="no">On-site / hybrid</option>
              </select>
            </div>
            <div>
              <label className="label block mb-1">Seniority (comma-separated)</label>
              <input className="input w-full" value={seniorityStr} onChange={(e) => {
                const parts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                setPref("seniority", parts.length ? parts : undefined);
              }} placeholder="senior, staff" />
            </div>
            <div>
              <label className="label block mb-1">Salary min</label>
              <input className="input w-full" type="number" min={0} value={profile.preferences.salaryMin ?? ""} onChange={(e) => setPref("salaryMin", e.target.value === "" ? undefined : Number(e.target.value))} />
            </div>
            <div>
              <label className="label block mb-1">Salary max</label>
              <input className="input w-full" type="number" min={0} value={profile.preferences.salaryMax ?? ""} onChange={(e) => setPref("salaryMax", e.target.value === "" ? undefined : Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div>
          <div className="h-section mb-1 flex items-center gap-2">Resume <span className="chip bg-sunken text-ink-3 font-normal">local parse</span></div>
          <div className="text-ink-3 text-[12px] mb-2">Import PDF/DOCX/text or paste — parse locally with no AI. Edit and confirm facts; only confirmed facts feed match and export validation.</div>
          <textarea className="input w-full min-h-[140px] font-mono text-[12px]" value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste resume plain text, or import a file…" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => void importResumeFile()}>Import file</button>
            <button type="button" className="btn" onClick={parseResume} disabled={!resumeText.trim()}>Parse locally</button>
          </div>
          {diagnostics && (
            <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3 text-[12.5px] space-y-1">
              <div className="label">Parse diagnostics</div>
              {diagnostics.textCoverage != null && <div>Text coverage: {Math.round(diagnostics.textCoverage * 100)}%</div>}
              {!!diagnostics.missingSections?.length && <div className="text-warn">Missing sections: {diagnostics.missingSections.join(", ")}</div>}
              {!!diagnostics.lowConfidenceFields?.length && <div className="text-warn">Low confidence: {diagnostics.lowConfidenceFields.join(", ")}</div>}
              {diagnostics.warnings?.map((w, i) => <div key={i} className="text-ink-2">{w}</div>)}
            </div>
          )}
          {pendingFacts && pendingFacts.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="label">Extracted facts · edit, confirm, or reject</div>
              {pendingFacts.map((f) => (
                <div key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line px-3 py-2">
                  <span className="chip bg-sunken text-ink-2 font-mono font-normal">{f.field}</span>
                  <input
                    className="input flex-1 min-w-[140px] h-8 text-[13px]"
                    value={f.value}
                    onChange={(e) => setFactValue(f.id, e.target.value)}
                    aria-label={`Edit ${f.field} fact`}
                  />
                  <span className="text-[11px] text-ink-3">{f.source} · {Math.round(f.confidence * 100)}%</span>
                  <div className="flex rounded-[10px] border border-line bg-surface-2 p-0.5">
                    <button type="button" className={clsx("h-6 px-2.5 rounded-lg text-[12px]", f.confirmed ? "bg-good-soft text-good font-medium" : "text-ink-3 hover:text-ink")} onClick={() => setFactConfirmed(f.id, true)}>Confirm</button>
                    <button type="button" className={clsx("h-6 px-2.5 rounded-lg text-[12px]", !f.confirmed ? "bg-bad-soft text-bad font-medium" : "text-ink-3 hover:text-ink")} onClick={() => setFactConfirmed(f.id, false)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!!profile.facts.length && !pendingFacts && (
          <div>
            <div className="label mb-2">Saved facts ({profile.facts.length})</div>
            <div className="space-y-1.5">
              {profile.facts.slice(0, 40).map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-[12.5px]">
                  <span className={clsx("chip", f.confirmed ? "bg-good-soft text-good" : "bg-sunken text-ink-3")}>{f.confirmed ? "confirmed" : "unconfirmed"}</span>
                  <span className="font-mono text-ink-3">{f.field}</span>
                  <span className="truncate selectable">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1 sticky bottom-0 bg-bg/90 backdrop-blur py-3 border-t border-line -mx-6 px-6">
          <button type="button" className="btn btn-primary" disabled={saving} onClick={save}><Save size={14} />{saving ? "Saving…" : "Save profile"}</button>
          <button type="button" className="btn" onClick={load}><RefreshCw size={14} />Reload</button>
          <span className="text-[11.5px] text-ink-3 self-center ml-auto">Updated {profile.updatedAt ? profile.updatedAt.slice(0, 10) : todayIso()}</span>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { startWorkflow, go, ws } = useStore();
  const [mode, setMode] = useState<"edit" | "agent">("edit");
  const [placeholderCount, setPlaceholderCount] = useState(0);
  useEffect(() => {
    api.profile().then((files) => setPlaceholderCount(files.reduce((n, x) => n + x.placeholders, 0))).catch(() => setPlaceholderCount(0));
  }, [ws?.path]);
  const run = (p: string, wf = "setup") => startWorkflow(wf, p).then((r) => r && go("activity"));

  return (
    <div className="h-full flex flex-col">
      <div className="px-6">
        <PageHeader
          title="Profile"
          subtitle={mode === "edit" ? "Structured facts you control offline — confirm before export/match use them" : (placeholderCount ? `${placeholderCount} template placeholders still unfilled` : "All agent profile files are filled in")}
          actions={<>
            <div className="flex rounded-[10px] border border-line bg-surface-2 p-0.5 mr-1">
              <button type="button" onClick={() => setMode("edit")} className={clsx("h-7 px-2.5 rounded-lg text-[12px]", mode === "edit" ? "bg-surface-3 text-ink font-medium shadow-sm" : "text-ink-3 hover:text-ink")}>Edit form</button>
              <button type="button" onClick={() => setMode("agent")} className={clsx("h-7 px-2.5 rounded-lg text-[12px]", mode === "agent" ? "bg-surface-3 text-ink font-medium shadow-sm" : "text-ink-3 hover:text-ink")}>Agent files</button>
            </div>
            <button className="btn" onClick={() => run("/setup --section skills")}>Re-run skills</button>
            <button className="btn" onClick={() => run("/setup --section experience")}>Re-run experience</button>
            <button className="btn" onClick={() => run("/setup --section search")}>Re-run search</button>
            <button className="btn" onClick={() => run("/expand", "expand")}><Wand2 size={14} />Enrich profile</button>
            <button className="btn" onClick={() => run("/setup")}><UserRoundCog size={14} />Full setup</button>
          </>}
        />
      </div>
      {mode === "edit" ? <EditFormPane /> : <AgentFilesPane wsPath={ws?.path} />}
    </div>
  );
}
