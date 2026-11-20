import { useState } from "react";
import { buildPrompt, byId } from "@ai-job-search/core";
import { Plus, Sparkles } from "lucide-react";
import { useStore } from "../store";

/** Inline Add Portal control — runs the in-app workflow instead of sending users to a CLI. */
export function AddPortalAction({
  onStarted,
  dense,
}: {
  onStarted?: () => void;
  dense?: boolean;
}) {
  const { startWorkflow, go, toast } = useStore();
  const [board, setBoard] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const w = byId("add-portal")!;

  const run = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const r = await startWorkflow("add-portal", buildPrompt(w, board));
      if (r) {
        setStatus("Portal setup started — stay on this step until it finishes. Profile and search are still next.");
        onStarted?.();
        go("activity");
      } else {
        setStatus("Could not start portal setup. Check AI sign-in in Settings, then try again.");
      }
    } catch (e) {
      toast(String(e), "bad");
      setStatus(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={dense ? "mt-2 space-y-2" : "mt-2 space-y-2.5"}>
      <input
        className="input w-full text-[12.5px]"
        placeholder="Job board name or URL (e.g. LinkedIn, stepstone.de)"
        value={board}
        onChange={(e) => setBoard(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !busy && void run()}
        disabled={busy}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary h-7 text-[12px]" disabled={busy} onClick={() => void run()}>
          <Plus size={13} />
          {busy ? "Starting…" : "Add portal"}
        </button>
      </div>
      {status && <div className="text-[12px] text-ink-2 leading-relaxed">{status}</div>}
    </div>
  );
}

/**
 * In-app fix controls for dependency rows that used to dump people into Terminal / Claude Code.
 * Installer deps (brew, etc.) stay copy-only — those cannot run inside the app.
 */
export function DepFixActions({
  depId,
  ok,
}: {
  depId: string;
  ok: boolean;
  /** @deprecated Never finish onboarding from a tool fix — Profile/Search must stay reachable (BUG-02). */
  finishOnboarding?: () => void;
}) {
  const { go } = useStore();
  if (ok) return null;

  if (depId === "portals") {
    return (
      <div className="mt-1.5">
        <div className="text-[12px] text-ink-2 leading-relaxed">
          No portal scrapers yet. Add one here — the guided workflow uses your active AI provider. This does not finish setup.
        </div>
        <AddPortalAction dense />
      </div>
    );
  }

  if (depId === "bun") {
    return (
      <div className="mt-1.5 text-[12px] text-ink-3 leading-relaxed">
        Bun is only needed for optional portal CLIs. You can still discover jobs via web search without it.
      </div>
    );
  }

  if (depId === "claude" || depId === "claude_auth" || depId === "codex" || depId === "codex_auth" || depId === "ai_provider") {
    return (
      <div className="mt-1.5">
        <button
          type="button"
          className="btn h-7 text-[12px]"
          onClick={() => go("settings")}
        >
          <Sparkles size={12} />
          Open AI Providers
        </button>
      </div>
    );
  }

  return null;
}
