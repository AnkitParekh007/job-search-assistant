import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { openUrl } from "@ai-job-search/runtime";
import clsx from "clsx";
import { CalendarClock, ExternalLink, GraduationCap, MailPlus, NotebookPen, X } from "lucide-react";
import { api, AppFolder, canonical, STATUSES, TrackerRow } from "@ai-job-search/runtime";
import { useStore } from "../store";
import { canTransition, daysBetween, lastContact } from "@ai-job-search/core";
import { ContextMenu, Empty, Markdown, MenuItem, PageHeader, STATUS_META, StatusChip } from "../components/ui";
import { PdfView } from "../components/PdfView";

type Move = { row: TrackerRow; to: string; hint?: string };

function MoveDialog({ mv, onClose }: { mv: Move; onClose: () => void }) {
  const { toast, startWorkflow, go } = useStore();
  const [note, setNote] = useState("");
  const from = canonical(mv.row.fields.status);
  const quick = async () => {
    try {
      await api.updateStatus(mv.row.index, from, mv.to, note);
      toast(`${mv.row.fields.company}: ${from} → ${mv.to}`, "good");
      onClose();
    } catch (e) { toast(String(e), "bad"); }
  };
  const viaOutcome = async () => {
    const r = await startWorkflow("outcome", `/outcome ${mv.row.fields.company}`);
    if (r) { onClose(); go("activity"); }
  };
  return (
    <motion.div className="fixed inset-0 z-40 bg-black/40 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <motion.div className="sheet w-[540px] p-6" initial={{ scale: 0.97, y: 8 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 32 }} onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold text-[16px]">Move {mv.row.fields.company} to {STATUS_META[mv.to]?.label}?</div>
        <div className="text-ink-2 mt-1 text-[12.5px]">{mv.row.fields.role} · currently <StatusChip s={from} /></div>
        {mv.hint && <div className="mt-3 text-[12px] rounded-lg bg-info-soft text-info px-3 py-2">{mv.hint}</div>}
        <label className="label block mt-4 mb-1">Note (saved to the tracker, commas removed)</label>
        <input className="input w-full" autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder={mv.to === "applied" ? "applied via company careers portal" : "e.g. phone screen booked for Dec 2"} />
        <div className="mt-4 rounded-lg border border-line p-3 text-[12.5px] space-y-1.5">
          <div><b>Record with AI</b> (recommended): the agent archives the submitted CV and cover letter, writes outcome.md and asks you anything it needs.</div>
          <div><b>Quick update</b>: changes only the tracker's status and notes (and the date when leaving drafted), exactly as /outcome Step 4 does, with no AI call. Archiving is skipped.</div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={quick}>Quick update</button>
          <button className="btn btn-primary" onClick={viaOutcome}>Record with /outcome</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AppDrawer({ row, onClose }: { row: TrackerRow; onClose: () => void }) {
  const { startWorkflow, go } = useStore();
  const [folder, setFolder] = useState<AppFolder | null>(null);
  const [tab, setTab] = useState<"overview" | "cv" | "cover" | "posting">("overview");
  const f = row.fields;
  useEffect(() => { api.appFolder(f.company, f.role).then(setFolder).catch(() => setFolder(null)); }, [f.company, f.role]);
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  const notes = (f.notes || "").split(";").map((s) => s.trim()).filter(Boolean);
  const run = (wf: string, p: string) => startWorkflow(wf, p).then((r) => r && go("activity"));
  const pdf = (tex: string) => (tex ? tex.replace(/\.tex$/, ".pdf") : "");
  return (
    <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="fixed inset-y-0 right-0 z-30 w-[min(760px,70vw)] bg-surface border-l border-line shadow-[var(--shadow-lg)] flex flex-col">
      <div className="h-12 drag" />
      <div className="px-5 pb-3 flex items-start gap-3 border-b border-line">
        <div className="flex-1 min-w-0">
          <div className="text-ink-3 text-[12px]">{f.company}</div>
          <div className="font-semibold text-[17px] selectable">{f.role}</div>
          <div className="flex items-center gap-2 mt-1"><StatusChip s={f.status} /><span className="text-ink-3 text-[12px]">{canonical(f.status) === "drafted" ? "drafted" : "applied"} {f.date}</span>{f.fit_rating && <span className="chip bg-sunken text-ink-2">fit {f.fit_rating}</span>}</div>
        </div>
        <button className="btn btn-ghost h-7 w-7 p-0 justify-center" onClick={onClose} aria-label="Close"><X size={14} /></button>
      </div>
      <div className="px-5 py-2 flex gap-1 border-b border-line">
        {(["overview", "cv", "cover", "posting"] as const).map((t) => <button key={t} className={clsx("btn h-7 text-[12px]", tab === t ? "bg-accent-soft border-transparent text-accent-ink" : "btn-ghost")} onClick={() => setTab(t)}>{{ overview: "Overview", cv: "CV", cover: "Cover letter", posting: "Posting" }[t]}</button>)}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === "overview" && (
          <div className="p-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              {f.source && <button className="btn" onClick={() => openUrl(f.source)}><ExternalLink size={14} />Official posting</button>}
              <button className="btn" onClick={() => run("outcome", `/outcome ${f.company}`)}><NotebookPen size={14} />Record outcome</button>
              <button className="btn" onClick={() => run("interview", `/interview ${f.company}`)}><GraduationCap size={14} />Interview prep</button>
              {["applied", "interview"].includes(canonical(f.status)) && <button className="btn" onClick={() => run("outcome", `/outcome ${f.company}`)}><MailPlus size={14} />Draft follow-up</button>}
            </div>
            {f.deadline && <div className="flex items-center gap-2 text-[12.5px]"><CalendarClock size={14} />Deadline {f.deadline}</div>}
            <div>
              <div className="label mb-2">Timeline</div>
              <ol className="border-l border-line ml-1.5 space-y-2.5">
                <li className="pl-4 relative"><span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent" /><div className="text-[12.5px]"><b>{f.date}</b> · row {canonical(f.status) === "drafted" ? "drafted" : "submitted"}</div></li>
                {notes.map((n, i) => <li key={i} className="pl-4 relative"><span className="absolute -left-[4px] top-1.5 w-2 h-2 rounded-full bg-line-strong" /><div className="text-[12.5px] text-ink-2 selectable">{n}</div></li>)}
              </ol>
            </div>
            <div>
              <div className="label mb-2">Archive · documents/applications/{folder?.name}</div>
              {folder?.files.length ? <div className="flex flex-wrap gap-1.5">{folder.files.map((x) => <span key={x} className="chip bg-sunken text-ink-2 font-mono font-normal">{x}</span>)}</div> : <div className="text-ink-3 text-[12.5px]">Nothing archived yet.</div>}
            </div>
            {folder?.outcome && <div className="card p-4"><Markdown text={folder.outcome} /></div>}
          </div>
        )}
        {tab === "cv" && (f.cv_file ? <PdfView rel={pdf(f.cv_file)} expectPages={2} source={f.cv_file} /> : <Empty icon={<NotebookPen size={18} />} title="No CV recorded" body="This row has no cv_file." />)}
        {tab === "cover" && (f.cover_letter_file ? <PdfView rel={pdf(f.cover_letter_file)} expectPages={1} source={f.cover_letter_file} /> : <Empty icon={<NotebookPen size={18} />} title="No cover letter recorded" body="This row has no cover_letter_file." />)}
        {tab === "posting" && <div className="p-5">{folder?.posting ? <Markdown text={folder.posting} /> : <div className="text-ink-3">No archived posting snapshot.</div>}</div>}
      </div>
    </motion.div>
  );
}

export default function Pipeline() {
  const { tracker, startWorkflow, go } = useStore();
  const rows = tracker?.rows || [];
  const [mv, setMv] = useState<Move | null>(null);
  const [open, setOpen] = useState<number | null>(() => { const v = sessionStorage.getItem("openApp"); return v ? Number(v) : null; });
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; row: TrackerRow } | null>(null);
  const [filter] = useState(sessionStorage.getItem("pipeFilter"));
  const { toast } = useStore();
  useEffect(() => { sessionStorage.removeItem("openApp"); sessionStorage.removeItem("pipeFilter"); }, []);
  const cols = useMemo(() => STATUSES.map((s) => ({ s, items: rows.filter((r) => canonical(r.fields.status) === s) })), [rows]);
  const visible = cols.filter((c) => c.items.length || ["drafted", "applied", "interview", "offer"].includes(c.s));
  const requestMove = (row: TrackerRow, to: string) => {
    const t = canTransition(row.fields.status, to);
    if (!t.ok) { toast(t.reason || "Not allowed", "bad"); return; }
    setMv({ row, to, hint: t.reason });
  };
  const menuItems = (row: TrackerRow): MenuItem[] => [
    { label: "Open details", onSelect: () => setOpen(row.index) },
    ...(row.fields.source ? [{ label: "Open official posting", onSelect: () => openUrl(row.fields.source) }] : []),
    { label: "Record outcome with Claude", onSelect: () => startWorkflow("outcome", `/outcome ${row.fields.company}`).then((r) => r && go("activity")) },
    "sep" as const,
    ...STATUSES.filter((s) => canTransition(row.fields.status, s).ok).map((s) => ({ label: `Move to ${STATUS_META[s].label}`, onSelect: () => requestMove(row, s) })),
  ];
  const drop = (to: string) => {
    const row = rows.find((r) => r.index === dragging);
    setDragging(null); setOver(null);
    if (!row) return;
    const t = canTransition(row.fields.status, to);
    if (!t.ok) { toast(t.reason || "Not allowed", "bad"); return; }
    setMv({ row, to, hint: t.reason });
  };
  const openRow = rows.find((r) => r.index === open);

  return (
    <div className="h-full flex flex-col">
      <div className="px-6"><PageHeader title="Pipeline" subtitle={rows.length ? `${rows.length} application${rows.length === 1 ? "" : "s"} · drag a card to change status` : "Track drafted and submitted applications"}
        actions={rows.length > 0 ? <><button className="btn" onClick={() => startWorkflow("outcome", "/outcome").then((r) => r && go("activity"))}>Review open apps</button><button className="btn" onClick={() => startWorkflow("outcome", "/outcome stale").then((r) => r && go("activity"))}>Stale sweep</button></> : <button className="btn btn-primary" onClick={() => go("studio")}><GraduationCap size={14} />Start in Studio</button>} /></div>
      {rows.length === 0 ? <Empty icon={<NotebookPen size={18} />} title="No tracked applications" body="When Studio drafts a CV and cover letter for a role, it shows up here so you can track submission and interviews." action={<button className="btn btn-primary" onClick={() => go("studio")}>Open Studio</button>} /> : (
        <div className="flex-1 min-h-0 overflow-x-auto px-6 pb-6">
          <div className="flex gap-3 h-full">
            {visible.map(({ s, items }) => (
              <div key={s} onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver((o) => (o === s ? null : o))} onDrop={() => drop(s)}
                className={clsx("w-[268px] shrink-0 rounded-2xl bg-sunken border flex flex-col min-h-0 transition-colors", over === s && dragging !== null ? (canTransition(rows.find((r) => r.index === dragging)?.fields.status || "", s).ok ? "border-accent bg-accent-soft/40" : "border-bad/60") : "border-line", filter === s && "ring-2 ring-accent")}>
                <div className="px-3 py-2.5 flex items-center gap-2"><StatusChip s={s} /><span className="text-ink-3 tabular-nums">{items.length}</span></div>
                <div className="flex-1 overflow-auto px-2 pb-2 space-y-2">
                  {items.length === 0 && <div className="h-20 rounded-xl border border-dashed border-line grid place-items-center text-[11.5px] text-ink-3">{dragging !== null ? "Drop to move here" : "Nothing here yet"}</div>}
                  {items.map((r) => {
                    const quiet = ["applied", "interview"].includes(s) ? daysBetween(lastContact(r.fields), new Date()) : null;
                    return (
                      <motion.div layout layoutId={`app-${r.index}`} key={r.index} draggable onDragStart={() => setDragging(r.index)} onDragEnd={() => { setDragging(null); setOver(null); }} onClick={() => setOpen(r.index)} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, row: r }); }}
                        className={clsx("card p-3 cursor-grab active:cursor-grabbing hover:border-line-strong", dragging === r.index && "opacity-40")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(r.index)}>
                        <div className="font-medium truncate">{r.fields.company}</div>
                        <div className="text-ink-2 text-[12px] truncate">{r.fields.role}</div>
                        <div className="flex items-center gap-2 mt-2 text-[11.5px] text-ink-3">
                          <span className="tabular-nums">{r.fields.date}</span>
                          {r.fields.fit_rating && <span className="chip bg-surface-2 text-ink-2">fit {r.fields.fit_rating}</span>}
                          {quiet != null && quiet >= 10 && <span className="chip bg-warn-soft text-warn">{quiet}d quiet</span>}
                        </div>
                      </motion.div>);
                  })}
                </div>
              </div>))}
          </div>
        </div>)}
      {mv && <MoveDialog mv={mv} onClose={() => setMv(null)} />}
      <AnimatePresence>{openRow && <AppDrawer key={openRow.index} row={openRow} onClose={() => setOpen(null)} />}</AnimatePresence>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems(menu.row)} onClose={() => setMenu(null)} />}
    </div>
  );
}
