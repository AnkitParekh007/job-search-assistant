import { useEffect, useState } from "react";
import clsx from "clsx";
import { FileWarning, Hammer, ScanText, FolderOpen, ShieldAlert } from "lucide-react";
import { emptyProfile, validateExportText, type CandidateFact, type CandidateProfile, type ExportValidation } from "@ai-job-search/core";
import { revealItemInDir } from "@ai-job-search/runtime";
import { api, fileUrl } from "@ai-job-search/runtime";
import { useStore } from "../store";

function normalizeProfile(raw: unknown): CandidateProfile {
  const base = emptyProfile();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  let facts: CandidateFact[] = [];
  if (Array.isArray(r.facts)) {
    facts = r.facts.filter((f): f is CandidateFact => !!f && typeof f === "object" && typeof (f as CandidateFact).field === "string");
  }
  return {
    ...base,
    name: String(r.name ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    location: String(r.location ?? ""),
    headline: String(r.headline ?? ""),
    facts,
  };
}

/** Shows a real generated PDF via WebKit's built-in PDF renderer, plus the
 *  upstream compile and text-layer checks. */
export function PdfView({ rel, source, expectPages }: { rel: string; source?: string; expectPages?: number }) {
  const { toast } = useStore();
  const [abs, setAbs] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [stamp, setStamp] = useState(Date.now());
  const [busy, setBusy] = useState<string | null>(null);
  const [check, setCheck] = useState<{ pages?: number | null; ats?: string; export?: ExportValidation } | null>(null);

  useEffect(() => {
    if (!rel) return;
    api.absPath(rel).then(setAbs).catch(() => setAbs(null));
    api.exists(rel).then(setExists).catch(() => setExists(false));
  }, [rel, stamp]);

  const compile = async () => {
    if (!source) return;
    setBusy("compile");
    try {
      const r = await api.compile(source);
      setCheck((c) => ({ ...c, pages: r.pages }));
      toast(r.ok ? `Compiled ${source}${r.pages ? ` · ${r.pages} page(s)` : ""}` : `Compile failed:\n${r.log.slice(-600)}`, r.ok ? "good" : "bad");
      setStamp(Date.now());
    } catch (e) { toast(String(e), "bad"); }
    setBusy(null);
  };
  const verify = async () => {
    setBusy("verify");
    try {
      const r = await api.verifyPdf(rel);
      setCheck((c) => ({ ...c, ats: (r.stdout + r.stderr).trim() }));
    } catch (e) { toast(String(e), "bad"); }
    setBusy(null);
  };
  const validateExport = async () => {
    const tex = source || rel.replace(/\.pdf$/i, ".tex");
    setBusy("export");
    try {
      const [rawProfile, text] = await Promise.all([
        api.candidateProfile().catch(() => null),
        api.readText(tex),
      ]);
      const profile = normalizeProfile(rawProfile);
      const result = validateExportText(text, profile);
      setCheck((c) => ({ ...c, export: result }));
      toast(
        result.ok
          ? "Export validation passed against confirmed facts"
          : `Export issues: ${[...result.missing.map((m) => `missing ${m}`), ...result.invented.slice(0, 2).map(() => "unsupported claim")].join("; ") || result.warnings[0] || "failed"}`,
        result.ok ? "good" : "bad",
      );
    } catch (e) { toast(String(e), "bad"); }
    setBusy(null);
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-line text-[12px]">
        <span className="font-mono text-ink-3 truncate flex-1" title={rel}>{rel}</span>
        {source && <button className={clsx("btn h-7 text-[12px]", exists === false && "btn-primary")} disabled={!!busy} onClick={compile}><Hammer size={12} />{busy === "compile" ? "Compiling…" : "Compile"}</button>}
        <button className="btn h-7 text-[12px]" disabled={!!busy || !exists} onClick={verify}><ScanText size={12} />{busy === "verify" ? "Checking…" : "ATS text check"}</button>
        <button className="btn h-7 text-[12px]" disabled={!!busy} onClick={validateExport} title="Compare .tex source to confirmed profile facts"><ShieldAlert size={12} />{busy === "export" ? "Validating…" : "Validate export"}</button>
        {abs && <button className="btn h-7 text-[12px]" onClick={() => revealItemInDir(abs)}><FolderOpen size={12} />Reveal</button>}
      </div>
      {check && (
        <div className="px-4 py-2 border-b border-line text-[12px] space-y-1">
          {check.pages != null && <div className={expectPages && check.pages !== expectPages ? "text-bad" : "text-good"}>{check.pages} page(s){expectPages ? ` · template expects exactly ${expectPages}` : ""}</div>}
          {check.export && (
            <div className={check.export.ok ? "text-good" : "text-bad"}>
              Export validation: {check.export.ok ? "ok" : "blocked / warn"}
              {!!check.export.missing.length && ` · missing ${check.export.missing.join(", ")}`}
              {!!check.export.invented.length && ` · ${check.export.invented.length} unsupported claim(s)`}
              {check.export.warnings.map((w, i) => <div key={i} className="text-ink-2 font-normal">{w}</div>)}
              {!check.export.ok && !!check.export.invented.length && (
                <pre className="font-mono text-[11px] whitespace-pre-wrap text-ink-2 selectable mt-1">{check.export.invented.slice(0, 3).join("\n")}</pre>
              )}
            </div>
          )}
          {check.ats && <pre className="font-mono text-[11px] whitespace-pre-wrap text-ink-2 selectable">{check.ats}</pre>}
        </div>
      )}
      {exists === false ? (
        <div className="flex-1 grid place-items-center text-center p-6">
          <div className="max-w-xs">
            <FileWarning className="mx-auto mb-2 text-warn" size={22} />
            <div className="h-section text-[14px]">PDF not built yet</div>
            <div className="text-ink-2 text-[12.5px] mt-1 leading-relaxed">The .tex source is ready. Compile it to preview the pages Claude drafted.</div>
            {source && <button className="btn btn-primary mt-4" disabled={!!busy} onClick={compile}><Hammer size={13} />{busy === "compile" ? "Compiling…" : "Compile now"}</button>}
          </div>
        </div>
      ) : abs ? (
        <iframe key={stamp} title={rel} src={`${fileUrl(abs)}?t=${stamp}`} className="flex-1 w-full bg-white" />
      ) : <div className="flex-1 skeleton m-4" />}
    </div>
  );
}
