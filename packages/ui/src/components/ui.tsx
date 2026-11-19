import { ReactNode } from "react";
import clsx from "clsx";
import { canonical } from "@ai-job-search/runtime";

export const STATUS_META: Record<string, { label: string; tone: string }> = {
  drafted: { label: "Drafted", tone: "bg-sunken text-ink-2" },
  applied: { label: "Applied", tone: "bg-info-soft text-info" },
  interview: { label: "Interview", tone: "bg-accent-soft text-accent-ink" },
  offer: { label: "Offer", tone: "bg-good-soft text-good" },
  hired: { label: "Hired", tone: "bg-good-soft text-good" },
  rejected: { label: "Rejected", tone: "bg-bad-soft text-bad" },
  no_response: { label: "No response", tone: "bg-sunken text-ink-3" },
  offer_declined: { label: "Offer declined", tone: "bg-warn-soft text-warn" },
  withdrawn: { label: "Withdrawn", tone: "bg-sunken text-ink-3" },
};

export function StatusChip({ s }: { s: string }) {
  const m = STATUS_META[canonical(s)] || { label: s || "?", tone: "bg-sunken text-ink-2" };
  return <span className={clsx("chip", m.tone)}>{m.label}</span>;
}

export function FitChip({ fit, score }: { fit?: string; score?: number | null }) {
  const tone = fit === "high" ? "bg-good-soft text-good" : fit === "medium" ? "bg-warn-soft text-warn" : fit === "low" ? "bg-bad-soft text-bad" : "bg-sunken text-ink-3";
  return <span className={clsx("chip", tone)}>{score != null ? `${score}` : fit ? fit[0].toUpperCase() + fit.slice(1) : "—"}</span>;
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-11 h-11 rounded-2xl bg-surface-3 text-ink-2 grid place-items-center mb-3.5 border border-line">{icon}</div>
      <div className="h-section text-[15px]">{title}</div>
      <div className="text-ink-2 mt-1.5 max-w-sm leading-relaxed text-[13px]">{body}</div>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mb-5">
      <div className="min-w-0 flex-1">
        <h1 className="h-title">{title}</h1>
        {subtitle && <div className="text-ink-2 mt-0.5">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, onClick, tone }: { label: string; value: ReactNode; hint?: ReactNode; onClick?: () => void; tone?: string }) {
  return (
    <button onClick={onClick} disabled={!onClick} className={clsx("card text-left p-4 transition-transform", onClick && "hover:-translate-y-0.5 hover:border-line-strong")}>
      <div className="label">{label}</div>
      <div className={clsx("text-[26px] font-semibold tracking-tight mt-1 tabular-nums", tone)}>{value}</div>
      {hint && <div className="text-ink-3 text-[12px] mt-0.5">{hint}</div>}
    </button>
  );
}

export function Bars({ data, onPick }: { data: { label: string; value: number }[]; onPick?: (label: string) => void }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => (
        <button key={d.label} onClick={() => onPick?.(d.label)} disabled={!onPick} className="flex items-center gap-3 text-left group">
          <div className="w-24 shrink-0 text-ink-2 text-[12.5px] truncate">{d.label}</div>
          <div className="flex-1 h-6 rounded-md bg-sunken overflow-hidden">
            <div className="h-full rounded-md bg-accent/80 group-hover:bg-accent transition-[width] duration-500" style={{ width: `${(d.value / max) * 100}%`, minWidth: d.value ? 6 : 0 }} />
          </div>
          <div className="w-8 text-right tabular-nums font-medium">{d.value}</div>
        </button>
      ))}
    </div>
  );
}

export function Columns({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <div className="text-ink-3 text-[12.5px] py-6 text-center">No submitted applications yet.</div>;
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="text-[11px] tabular-nums text-ink-2">{d.value}</div>
          <div className="w-full rounded-t-md bg-accent/80" style={{ height: `${(d.value / max) * 92}px` }} />
          <div className="text-[10.5px] text-ink-3 truncate w-full text-center">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="px-1.5 h-5 inline-flex items-center rounded-md border border-line bg-surface-2 text-[11px] font-mono text-ink-2">{children}</kbd>;
}

/** Minimal Markdown renderer that builds React elements (never innerHTML), so
 *  untrusted posting/email text can't inject markup or scripts. */
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const out: ReactNode[] = [];
  let list: ReactNode[] = [];
  let table: string[][] = [];
  const flush = () => {
    if (list.length) { out.push(<ul key={`u${out.length}`}>{list}</ul>); list = []; }
    if (table.length) {
      const rows = table.filter((r) => !r.every((c) => /^:?-+:?$/.test(c.trim())));
      out.push(<table key={`t${out.length}`}><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => (i === 0 ? <th key={j}>{inline(c)}</th> : <td key={j}>{inline(c)}</td>))}</tr>)}</tbody></table>);
      table = [];
    }
  };
  lines.forEach((raw, i) => {
    const l = raw.trimEnd();
    if (/^<!--/.test(l.trim()) || /^-->/.test(l.trim()) || l.trim() === "---") { flush(); return; }
    const h = l.match(/^(#{1,4})\s+(.*)/);
    if (h) { flush(); const T = (`h${Math.min(3, h[1].length)}`) as "h1"; out.push(<T key={i}>{inline(h[2])}</T>); return; }
    if (/^\s*\|.*\|\s*$/.test(l)) { if (list.length) flush(); table.push(l.trim().slice(1, -1).split("|")); return; }
    const li = l.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
    if (li) {
      if (table.length) flush();
      const task = li[1].match(/^\[( |x|X)\]\s+(.*)/);
      list.push(task ? <li key={i} className="list-none -ml-4"><span className={task[1] === " " ? "text-ink-3" : "text-good"}>{task[1] === " " ? "☐" : "☑"}</span> {inline(task[2])}</li> : <li key={i}>{inline(li[1])}</li>);
      return;
    }
    if (!l.trim()) { flush(); return; }
    flush();
    out.push(<p key={i}>{inline(l)}</p>);
  });
  flush();
  return <div className="prose-md selectable">{out}</div>;
}

function inline(s: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) parts.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) parts.push(<code key={k++}>{t.slice(1, -1)}</code>);
    else parts.push(<em key={k++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

/** Score ring. A rubric score (from /rank) is a filled arc with its number;
 *  preliminary fit (from /scrape's quick check) is an outline with a letter,
 *  so the two can never be mistaken for each other. */
export function ScoreRing({ score, fit, size = 40 }: { score?: number | null; fit?: string; size?: number }) {
  const r = size / 2 - 3, c = 2 * Math.PI * r;
  const ranked = score != null;
  const pct = ranked ? Math.max(0, Math.min(100, score!)) / 100 : 0;
  const tone = ranked ? (score! >= 75 ? "var(--good)" : score! >= 55 ? "var(--warn)" : "var(--bad)") : fit === "high" ? "var(--good)" : fit === "medium" ? "var(--warn)" : fit === "low" ? "var(--bad)" : "var(--text-3)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={ranked ? `Rubric score ${score} (from /rank)` : `Preliminary fit: ${fit || "unknown"} (quick check, not scored)`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={3} />
        {ranked ? <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={3} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .5s ease-out" }} />
          : <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={1.5} strokeDasharray="3 3" />}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[11px] font-semibold tnum" style={{ color: tone }}>{ranked ? score : (fit || "?")[0].toUpperCase()}</div>
    </div>
  );
}

/** Who performs an action: Claude (teal) or the user (coral). */
export function Actor({ who }: { who: "ai" | "you" }) {
  return who === "ai" ? <span className="chip bg-ai-soft text-ai">AI</span> : <span className="chip bg-you-soft text-you">You</span>;
}

export function Section({ title, action, children, className }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx("card p-4", className)}>
      <div className="flex items-center gap-2 mb-3"><div className="h-section flex-1 flex items-center gap-2">{title}</div>{action}</div>
      {children}
    </section>
  );
}

export type MenuItem = { label: string; onSelect: () => void; danger?: boolean; disabled?: boolean } | "sep";
/** Right-click menu. Esc or an outside click closes it; arrow keys move focus. */
export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60]" onMouseDown={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
      <div role="menu" className="sheet !rounded-xl absolute min-w-[200px] p-1" style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 40 - items.length * 28) }}
        onMouseDown={(e) => e.stopPropagation()} onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          const btns = [...(e.currentTarget.querySelectorAll("button:not(:disabled)") as any)] as HTMLButtonElement[];
          const i = btns.indexOf(document.activeElement as HTMLButtonElement);
          if (e.key === "ArrowDown") { e.preventDefault(); btns[(i + 1) % btns.length]?.focus(); }
          if (e.key === "ArrowUp") { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length]?.focus(); }
        }}>
        {items.map((it, i) => it === "sep" ? <div key={i} className="h-px bg-line my-1" /> : (
          <button key={i} role="menuitem" autoFocus={i === 0} disabled={it.disabled} onClick={() => { it.onSelect(); onClose(); }}
            className={clsx("w-full text-left h-7 px-2.5 rounded-md text-[12.5px] hover:bg-accent hover:text-white focus:bg-accent focus:text-white disabled:opacity-40", it.danger && "text-bad")}>{it.label}</button>
        ))}
      </div>
    </div>
  );
}
