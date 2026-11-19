import { useEffect, useState } from "react";
import clsx from "clsx";
import { RefreshCw, UserRoundCog, Wand2 } from "lucide-react";
import { api, ProfileFile } from "../lib/api";
import { useStore } from "../lib/store";
import { Markdown, PageHeader } from "../components/ui";

const NICE: Record<string, string> = {
  "CLAUDE.md": "Overview (CLAUDE.md)", "01-candidate-profile.md": "Candidate profile", "02-behavioral-profile.md": "Work style", "03-writing-style.md": "Writing style",
  "04-job-evaluation.md": "Evaluation rubric", "05-cv-templates.md": "CV template rules", "06-cover-letter-templates.md": "Cover letter rules", "07-interview-prep.md": "Interview stories", "search-queries.md": "Search strategy",
};

export default function Profile() {
  const { startWorkflow, go, ws } = useStore();
  const [files, setFiles] = useState<ProfileFile[]>([]);
  const [sel, setSel] = useState(0);
  const load = () => api.profile().then(setFiles).catch(() => setFiles([]));
  useEffect(() => { load(); }, [ws?.path]);
  const run = (p: string, wf = "setup") => startWorkflow(wf, p).then((r) => r && go("activity"));
  const f = files[sel];
  const unfilled = files.reduce((n, x) => n + x.placeholders, 0);
  return (
    <div className="h-full flex flex-col">
      <div className="px-6"><PageHeader title="Profile" subtitle={unfilled ? `${unfilled} template placeholders still unfilled` : "All profile files are filled in"}
        actions={<>
          <button className="btn" onClick={() => run("/setup --section skills")}>Re-run skills</button>
          <button className="btn" onClick={() => run("/setup --section experience")}>Re-run experience</button>
          <button className="btn" onClick={() => run("/setup --section search")}>Re-run search</button>
          <button className="btn" onClick={() => run("/expand", "expand")}><Wand2 size={14} />Enrich (/expand)</button>
          <button className="btn btn-primary" onClick={() => run("/setup")}><UserRoundCog size={14} />Full setup</button>
        </>} /></div>
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
          {f ? <div className="max-w-3xl"><div className="text-[11.5px] text-ink-3 mb-3">Read-only view. Profile changes go through /setup or /expand so upstream's grounding rules apply. Your profile is personal data: never push it to a public fork.</div><Markdown text={f.content.replace(/^---[\s\S]*?---\n/, "")} /></div> : <div className="skeleton h-40" />}
        </div>
      </div>
    </div>
  );
}
