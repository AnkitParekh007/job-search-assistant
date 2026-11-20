import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, HelpCircle, MessageCircleQuestion, Send, X } from "lucide-react";
import { Jobzuu } from "./Jobzuu";
import { useStore } from "../store";
import { answerHelpQuestion, HELP_TOPICS, suggestedHelpTopics, type HelpTopic } from "./helpContent";

type HelpMessage = {
  id: number;
  sender: "scout" | "user";
  text: string;
  topicId?: string;
};

const GREETING = "Hi! I'm Jobzuu, your offline app guide. Ask me how to use a feature, or choose a question below. I never use AI or send your questions anywhere.";

export function HelpAssistant({ paletteOpen = false, onOpenChange }: { paletteOpen?: boolean; onOpenChange?: (open: boolean) => void }) {
  const { route, go } = useStore();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<HelpMessage[]>([{ id: 0, sender: "scout", text: GREETING }]);
  const [showTopics, setShowTopics] = useState(true);
  const nextId = useRef(1);
  const input = useRef<HTMLInputElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const previouslyOpen = useRef(false);

  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  useEffect(() => {
    if (paletteOpen) setOpen(false);
  }, [paletteOpen]);

  useEffect(() => {
    if (open) input.current?.focus();
    else if (previouslyOpen.current && !paletteOpen) launcher.current?.focus();
    previouslyOpen.current = open;
  }, [open, paletteOpen]);

  useEffect(() => {
    if (open && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages, showTopics, open]);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    window.addEventListener("keydown", escape, true);
    return () => window.removeEventListener("keydown", escape, true);
  }, [open]);

  const previousTopic = () => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const topicId = messages[index].topicId;
      if (!topicId) continue;
      return HELP_TOPICS.find((topic) => topic.id === topicId) || null;
    }
    return null;
  };

  const answer = (rawQuestion: string, selected?: HelpTopic) => {
    const question = rawQuestion.trim().slice(0, 240);
    if (!question) return;
    const reply = selected
      ? { text: selected.answer, topic: selected, openRoute: undefined }
      : answerHelpQuestion(question, { previous: previousTopic() });
    if (!reply.text) return;
    setMessages((current) => [
      ...current,
      { id: nextId.current++, sender: "user", text: question },
      { id: nextId.current++, sender: "scout", text: reply.text, topicId: reply.topic?.id },
    ]);
    setDraft("");
    setShowTopics(!reply.topic);
    if (reply.openRoute) {
      go(reply.openRoute);
      setOpen(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    answer(draft);
  };

  const navigate = (destination: string) => {
    go(destination);
    setOpen(false);
  };

  const suggestions = suggestedHelpTopics(route);
  const spoken = messages.filter((message) => message.sender === "scout");
  const latestReply = spoken.length ? spoken[spoken.length - 1].text : "";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            id="ask-jobzuu-panel"
            role="dialog"
            aria-modal="false"
            aria-label="Ask Jobzuu app guide"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
            className="fixed bottom-20 right-4 z-40 flex h-[min(460px,calc(100vh-240px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          >
            <div className="relative flex shrink-0 items-center gap-2.5 border-b border-line bg-surface-2 px-4 py-3">
              <Jobzuu size={38} />
              <div className="min-w-0 flex-1">
                <h2 className="text-[14px] font-semibold text-ink">Ask Jobzuu</h2>
                <p className="text-[11px] text-ink-3">Offline app guide · No AI · No API cost</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn btn-ghost h-8 w-8 justify-center p-0" aria-label="Close Ask Jobzuu" title="Close">
                <X size={17} />
              </button>
            </div>

            <div className="sr-only" aria-live="polite">{open ? latestReply : ""}</div>
            <div ref={transcript} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
              {messages.map((message) => {
                const topic = message.topicId ? HELP_TOPICS.find((item) => item.id === message.topicId) : undefined;
                return (
                  <div key={message.id} className={message.sender === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div className={message.sender === "user"
                      ? "max-w-[89%] rounded-2xl rounded-br-md bg-accent px-3 py-2.5 text-[12.5px] leading-relaxed text-white"
                      : "max-w-[94%] rounded-2xl rounded-bl-md border border-line bg-surface-2 px-3 py-2.5 text-[12.5px] leading-relaxed text-ink"}>
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      {topic?.steps && (
                        <ol className="mt-2 list-decimal space-y-1 pl-4 text-ink-2">
                          {topic.steps.map((step) => <li key={step}>{step}</li>)}
                        </ol>
                      )}
                      {topic?.route && (
                        <button
                          onClick={() => navigate(topic.route!)}
                          className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-accent-ink hover:underline"
                        >
                          {topic.action || "Open this screen"} <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {showTopics && (
                <div className="space-y-1.5 pt-1">
                  <p className="px-1 text-[11px] font-medium text-ink-3">Suggested questions for this screen</p>
                  {suggestions.map((topic) => (
                    <button key={topic.id} type="button" onClick={() => answer(topic.question, topic)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left text-[12px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
                      <span>{topic.question}</span><ArrowRight size={13} className="shrink-0 text-ink-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-line bg-surface px-3.5 py-3">
              <form onSubmit={submit} className="flex items-center gap-2">
                <input
                  ref={input}
                  type="text"
                  maxLength={240}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask how to use the app…"
                  aria-label="Your question for Jobzuu"
                  className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-[12.5px] text-ink outline-none focus:border-accent"
                />
                <button type="submit" disabled={!draft.trim()} aria-label="Ask Jobzuu"
                  className="btn btn-primary h-9 w-9 shrink-0 justify-center p-0 disabled:opacity-40">
                  <Send size={15} />
                </button>
              </form>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-ink-3">Answers from built-in help, not an AI model</span>
                <button type="button" onClick={() => setShowTopics((shown) => !shown)}
                  className="flex items-center gap-1 text-[11px] font-medium text-accent-ink hover:underline">
                  <HelpCircle size={12} />{showTopics ? "Hide topics" : "Help topics"}
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <button
        ref={launcher}
        onClick={() => setOpen((current) => !current)}
        type="button"
        aria-label={open ? "Close Ask Jobzuu" : "Open Ask Jobzuu"}
        aria-expanded={open}
        aria-controls="ask-jobzuu-panel"
        title="Ask Jobzuu — offline app help"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-accent text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {open ? <X size={22} /> : <MessageCircleQuestion size={22} />}
      </button>
    </>
  );
}
