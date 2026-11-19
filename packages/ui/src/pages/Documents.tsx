import { useEffect, useState } from "react";
import clsx from "clsx";
import { Columns2, FileText, LayoutTemplate } from "lucide-react";
import { api } from "@ai-job-search/runtime";
import { useStore } from "../store";
import { Empty, PageHeader } from "../components/ui";
import { PdfView } from "../components/PdfView";

export default function Documents() {
  const { ws, startWorkflow, go } = useStore();
  const [docs, setDocs] = useState<{ cv: string[]; cover: string[]; reports: string[] } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [side, setSide] = useState(false);
  useEffect(() => { api.documents().then(setDocs).catch(() => setDocs(null)); }, [ws?.path]);
  const all = [...(docs?.cv || []), ...(docs?.cover || [])];
  const cur = sel || all.find((d) => d !== "cv/main_example.tex") || all[0];
  const kind = (d: string) => (d.startsWith("cv/") ? 2 : 1);
  return (
    <div className="h-full flex flex-col">
      <div className="px-6"><PageHeader title="Documents" subtitle="Real CV and cover-letter sources in the workspace, compiled with the upstream engines"
        actions={<>
          <button className={clsx("btn", side && "bg-accent-soft text-accent-ink")} onClick={() => setSide(!side)}><Columns2 size={14} />Compare with master CV</button>
          <button className="btn" onClick={() => startWorkflow("add-template", "/add-template").then((r) => r && go("activity"))}><LayoutTemplate size={14} />Add template</button>
          <button className="btn" onClick={() => startWorkflow("html-report", "/html-report").then((r) => r && go("activity"))}>Generate HTML report</button>
        </>} /></div>
      <div className="flex-1 min-h-0 flex border-t border-line">
        <div className="w-64 shrink-0 border-r border-line overflow-auto p-2">
          {[["CVs", docs?.cv], ["Cover letters", docs?.cover]].map(([h, list]) => (
            <div key={h as string} className="mb-3">
              <div className="label px-2 py-1.5">{h as string}</div>
              {(list as string[] | undefined)?.map((d) => (
                <button key={d} onClick={() => setSel(d)} className={clsx("w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2", cur === d ? "bg-surface shadow-sm" : "hover:bg-surface/60")}>
                  <FileText size={13} className="text-ink-3 shrink-0" /><span className="truncate text-[12.5px]">{d.split("/")[1].replace(/\.tex$/, "")}</span>
                </button>))}
            </div>))}
          {!!docs?.reports.length && <div className="label px-2 py-1.5">Reports: {docs.reports.join(", ")}</div>}
        </div>
        <div className="flex-1 min-w-0 flex">
          {!cur ? <Empty icon={<FileText size={18} />} title="No documents yet" body="Tailored documents appear after /apply." /> : (
            <>
              {side && <div className="flex-1 min-w-0 border-r border-line"><PdfView rel="cv/main_example.pdf" source="cv/main_example.tex" expectPages={2} /></div>}
              <div className="flex-1 min-w-0"><PdfView key={cur} rel={cur.replace(/\.tex$/, ".pdf")} source={cur} expectPages={kind(cur)} /></div>
            </>)}
        </div>
      </div>
    </div>
  );
}
