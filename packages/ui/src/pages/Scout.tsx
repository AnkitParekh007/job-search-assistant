import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Search } from "lucide-react";
import { useStore } from "../store";
import { Empty, PageHeader } from "../components/ui";
import { answerHelpQuestion, HELP_TOPICS } from "../components/helpContent";

/** Local help browser. Every answer comes from bundled product rules; no provider is called. */
export default function Scout() {
  const { go } = useStore();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(HELP_TOPICS[0]?.id ?? "");

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_TOPICS;
    const best = answerHelpQuestion(query).topic;
    const matches = HELP_TOPICS.filter((t) =>
      [t.question, t.answer, ...t.triggers].some((s) => s.toLowerCase().includes(q)),
    );
    return best && !matches.includes(best) ? [best, ...matches] : matches;
  }, [query]);

  const selected = topics.find((t) => t.id === selectedId) ?? topics[0] ?? null;

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageHeader title="Scout" subtitle="Local help — answers from product rules, not an AI provider" />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              className="input w-full pl-8"
              type="search"
              placeholder="Search help topics…"
              aria-label="Search help topics"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {topics.length === 0 ? (
            <div className="text-ink-3 text-[13px] px-1">No matching topics. Try a different word.</div>
          ) : (
            <ul className="space-y-1.5" aria-label="Help questions">
              {topics.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    aria-current={selected?.id === t.id}
                    className={clsx(
                      "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[13px] transition-colors",
                      selected?.id === t.id
                        ? "border-line-strong bg-surface-2 text-ink"
                        : "border-line bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <span>{t.question}</span>
                    <ArrowRight size={13} className="shrink-0 text-ink-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 min-h-[240px]">
          {selected ? (
            <div className="space-y-4">
              <h2 className="h-section">{selected.question}</h2>
              <p className="text-ink-2 leading-relaxed selectable">{selected.answer}</p>
              {!!selected.steps?.length && (
                <ol className="list-decimal pl-5 space-y-1 text-ink-2 text-[13px] selectable">
                  {selected.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              )}
              {selected.route && (
                <button className="btn" onClick={() => go(selected.route as string)}>
                  {selected.action || "Open"}<ArrowRight size={13} />
                </button>
              )}
              <div className="label pt-2 border-t border-line">Deterministic help · no provider calls</div>
            </div>
          ) : (
            <Empty icon={<Search size={18} />} title="No topic selected" body="Search or pick a question to see the answer." />
          )}
        </div>
      </div>
    </div>
  );
}
