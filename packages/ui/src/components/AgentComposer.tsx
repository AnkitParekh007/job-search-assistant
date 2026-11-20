import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import clsx from "clsx";
import { ArrowUp, CornerDownLeft, Loader2, Sparkles, Square } from "lucide-react";
import { WORKFLOWS, type Workflow } from "@ai-job-search/core";
import { Jobzuu } from "./Jobzuu";

const HISTORY_KEY = "jobzuu.composer.history";
const MAX_HISTORY = 40;
const MAX_ROWS = 8;
const ACTIVE_SEND = new Set(["running", "starting", "awaiting_approval", "awaiting_input"]);

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function pushHistory(text: string) {
  const next = [text, ...loadHistory().filter((h) => h !== text)].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

function contextChips(status: string): string[] {
  if (status === "awaiting_input") {
    return ["Yes, proceed", "Skip that", "Explain more", "Use my CV and keep going"];
  }
  if (status === "awaiting_approval") {
    return ["Looks good — allow it", "Hold on, let me check", "Deny that step"];
  }
  if (status === "running" || status === "starting") {
    return ["Pause after this step", "Focus on the profile only", "Be concise"];
  }
  if (["completed", "failed", "interrupted", "cancelled"].includes(status)) {
    return ["Continue where you left off", "Summarize what you did", "Fix the last error"];
  }
  return [];
}

function placeholderFor(status: string, canResume: boolean): string {
  if (status === "awaiting_input") return "Reply to Jobzuu…";
  if (status === "awaiting_approval") return "Optional note for the agent, or use Allow / Deny above…";
  if (status === "running" || status === "starting") return "Steer the run — ask a question or give direction…";
  if (canResume) return "Continue this session, or type / for a workflow…";
  return "Message Jobzuu…";
}

export function AgentComposer({
  status,
  disabled,
  busy,
  canSend,
  canResume,
  sessionId,
  onSend,
  onResume,
  onWorkflow,
  onStop,
}: {
  status: string;
  disabled?: boolean;
  busy?: boolean;
  canSend: boolean;
  canResume: boolean;
  sessionId?: string | null;
  onSend: (text: string) => Promise<void> | void;
  onResume: (text: string) => Promise<void> | void;
  onWorkflow: (w: Workflow, arg: string) => Promise<void> | void;
  onStop?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const [histIdx, setHistIdx] = useState(-1);
  const ta = useRef<HTMLTextAreaElement>(null);
  const slashRef = useRef<HTMLDivElement>(null);

  const chips = useMemo(() => contextChips(status), [status]);
  const slashQuery = draft.match(/^\/([^\s]*)$/);
  const slashHits = useMemo(() => {
    if (!slashQuery) return [];
    const q = slashQuery[1].toLowerCase();
    return WORKFLOWS.filter(
      (w) =>
        w.command.slice(1).startsWith(q) ||
        w.title.toLowerCase().includes(q) ||
        w.id.includes(q),
    ).slice(0, 8);
  }, [slashQuery?.[1]]);

  useEffect(() => {
    setSlashOpen(!!slashQuery && slashHits.length > 0);
    setSlashIdx(0);
  }, [slashQuery?.[1], slashHits.length]);

  useEffect(() => {
    if (status === "awaiting_input" || status === "awaiting_approval") {
      ta.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, MAX_ROWS * 22 + 16);
    el.style.height = `${Math.max(40, next)}px`;
  }, [draft]);

  const applyChip = (text: string) => {
    setDraft(text);
    requestAnimationFrame(() => ta.current?.focus());
  };

  const pickSlash = (w: Workflow) => {
    setDraft(`${w.command} `);
    setSlashOpen(false);
    requestAnimationFrame(() => ta.current?.focus());
  };

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending || disabled) return;
    setSending(true);
    try {
      pushHistory(text);
      setHistIdx(-1);
      const wfMatch = text.match(/^(\/[a-z-]+)(?:\s+([\s\S]*))?$/i);
      const wf = wfMatch ? WORKFLOWS.find((w) => w.command === wfMatch[1]) : undefined;
      if (wf && (!canSend || !ACTIVE_SEND.has(status))) {
        await onWorkflow(wf, (wfMatch?.[2] || "").trim());
      } else if (canSend) {
        await onSend(text);
      } else if (canResume) {
        await onResume(text);
      } else {
        return;
      }
      setDraft("");
      setSlashOpen(false);
    } finally {
      setSending(false);
      requestAnimationFrame(() => ta.current?.focus());
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen && slashHits.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIdx((i) => (i + 1) % slashHits.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIdx((i) => (i - 1 + slashHits.length) % slashHits.length);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        pickSlash(slashHits[slashIdx] || slashHits[0]);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const hit = slashHits[slashIdx] || slashHits[0];
        if (hit && draft.trim() === hit.command) {
          setSlashOpen(false);
          void submit();
        } else {
          pickSlash(hit);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashOpen(false);
        return;
      }
    }

    if (e.key === "ArrowUp" && !draft && !e.shiftKey) {
      const hist = loadHistory();
      if (!hist.length) return;
      e.preventDefault();
      const next = Math.min(histIdx + 1, hist.length - 1);
      setHistIdx(next);
      setDraft(hist[next] || "");
      return;
    }
    if (e.key === "ArrowDown" && histIdx >= 0 && !e.shiftKey) {
      const hist = loadHistory();
      e.preventDefault();
      const next = histIdx - 1;
      setHistIdx(next);
      setDraft(next < 0 ? "" : hist[next] || "");
      return;
    }

    // ChatGPT / Cursor: Enter sends, Shift+Enter newline. Cmd/Ctrl+Enter also sends.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const ready = !!draft.trim() && !sending && !disabled && (canSend || canResume);
  const showStop = !!onStop && (status === "running" || status === "starting");

  return (
    <div className="border-t border-line bg-sidebar/40 px-3 pt-2.5 pb-3">
      {chips.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              className="shrink-0 h-7 px-2.5 rounded-full border border-line bg-surface text-[12px] text-ink-2 hover:text-ink hover:border-line-strong transition-colors"
              onClick={() => applyChip(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        {slashOpen && (
          <div
            ref={slashRef}
            className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 sheet !rounded-xl overflow-hidden max-h-64 overflow-y-auto"
            role="listbox"
            aria-label="Workflow commands"
          >
            {slashHits.map((w, i) => (
              <button
                key={w.id}
                type="button"
                role="option"
                aria-selected={i === slashIdx}
                className={clsx(
                  "w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors",
                  i === slashIdx ? "bg-accent-soft" : "hover:bg-surface-2",
                )}
                onMouseEnter={() => setSlashIdx(i)}
                onClick={() => pickSlash(w)}
              >
                <span className="font-mono text-[12px] text-accent-ink bg-accent-soft rounded-md px-1.5 py-0.5 shrink-0">{w.command}</span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-ink">{w.title}</span>
                  <span className="block text-[11.5px] text-ink-3 truncate">{w.blurb}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div
          className={clsx(
            "rounded-2xl border bg-surface shadow-[var(--shadow)] transition-[border-color,box-shadow]",
            status === "awaiting_input" ? "border-you/50 ring-1 ring-you/20" : "border-line-strong focus-within:border-accent focus-within:shadow-[var(--ring)]",
          )}
        >
          <div className="flex items-end gap-2 px-2.5 pt-2.5 pb-2">
            <div className="shrink-0 mb-1.5 opacity-90">
              <Jobzuu size={28} />
            </div>
            <textarea
              ref={ta}
              rows={1}
              value={draft}
              disabled={disabled || sending}
              placeholder={placeholderFor(status, canResume)}
              className="flex-1 min-w-0 resize-none border-0 bg-transparent shadow-none outline-none focus:outline-none focus-visible:outline-none focus-visible:!shadow-none text-[13.5px] leading-[1.45] text-ink placeholder:text-ink-3 py-1.5 max-h-[192px]"
              onChange={(e) => {
                setDraft(e.target.value);
                setHistIdx(-1);
              }}
              onKeyDown={onKeyDown}
              aria-label="Message Jobzuu"
            />
            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
              {showStop && (
                <button type="button" className="btn h-8 w-8 p-0" title="Stop run" onClick={onStop}>
                  <Square size={12} />
                </button>
              )}
              <button
                type="button"
                className={clsx(
                  "h-8 w-8 rounded-full grid place-items-center transition-colors",
                  ready ? "bg-accent text-white hover:opacity-90" : "bg-sunken text-ink-3",
                )}
                disabled={!ready}
                title={canSend ? "Send (Enter)" : canResume ? "Continue session (Enter)" : "Send"}
                onClick={() => void submit()}
              >
                {sending || busy ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={15} strokeWidth={2.4} />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 pb-2 text-[11px] text-ink-3">
            <Sparkles size={11} className="shrink-0 opacity-70" />
            <span className="flex-1 truncate">
              {status === "awaiting_input"
                ? "Jobzuu is waiting on your reply"
                : canSend
                  ? "Live session"
                  : canResume && sessionId
                    ? "Session paused — message to continue"
                    : "Type / for workflows"}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 shrink-0">
              <CornerDownLeft size={10} />
              send
              <span className="opacity-50 mx-0.5">·</span>
              ⇧↵ newline
              <span className="opacity-50 mx-0.5">·</span>
              / commands
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
