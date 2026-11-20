/**
 * Bundled, deterministic in-app help. This module has no network, LLM,
 * provider or workspace dependencies. Keep claims aligned with docs/features.md.
 */
export type HelpTopic = {
  id: string;
  question: string;
  answer: string;
  steps?: string[];
  route?: string;
  action?: string;
  triggers: string[];
  contexts: string[];
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "start",
    question: "How do I get started?",
    answer: "Start by connecting your local ai-job-search workspace, checking tools and configuring your profile. Then discover, rank, prepare, review and track applications.",
    steps: ["Open Settings to check your workspace and dependencies.", "Open Profile to review your candidate details.", "Go to Jobs to begin discovering opportunities."],
    route: "settings", action: "Open Settings",
    triggers: ["get started", "start using", "new here", "first time", "where do i start", "where do i begin", "how it works"],
    contexts: ["dashboard"],
  },
  {
    id: "workspace",
    question: "How do I connect my workspace?",
    answer: "The app uses a local ai-job-search folder as its source of truth. Connect the upstream workspace in Settings. Your profile, tracker and documents remain in that workspace.",
    steps: ["Open Settings.", "Choose the upstream ai-job-search folder.", "Verify the connection and any missing dependencies."],
    route: "settings", action: "Open Settings",
    triggers: ["workspace", "connect folder", "choose folder", "upstream", "not connected", "missing workspace"],
    contexts: ["settings", "dashboard"],
  },
  {
    id: "appearance",
    question: "How do I change the theme or open Settings?",
    answer: "Settings is where you connect a workspace, choose an AI provider, and switch the theme. The choices are System, Light, and Dark, and they apply immediately on this Mac.",
    steps: ["Open Settings.", "Choose System, Light, or Dark.", "Connect a workspace or a provider from the same screen."],
    route: "settings", action: "Open Settings",
    triggers: ["open settings", "change the theme", "change theme", "dark mode", "light mode", "system theme", "appearance", "switch theme"],
    contexts: ["settings", "dashboard"],
  },
  {
    id: "navigate",
    question: "How do I get around the app?",
    answer: "Use the sidebar to change screens. Command-K opens the command palette to jump to a page, run a workflow, or find a job or application. Command-backslash collapses the sidebar. Command-1 through Command-9 and Command-comma open the numbered sidebar items. Settings is Command-comma.",
    triggers: ["keyboard shortcut", "keyboard shortcuts", "command palette", "search or run", "toggle sidebar", "how do i navigate", "get around"],
    contexts: ["dashboard"],
  },
  {
    id: "discover",
    question: "How do I find jobs?",
    answer: "Use Jobs to discover opportunities. The search workflow finds listings in your configured sources; review the results rather than assuming every posting is still open.",
    steps: ["Confirm your search preferences in Profile.", "Open Jobs and start discovery.", "Review listings and use ranking to compare fit."],
    route: "jobs", action: "Open Jobs",
    triggers: ["find jobs", "search for jobs", "discover jobs", "job discovery", "job search", "scrape", "listings"],
    contexts: ["jobs", "dashboard"],
  },
  {
    id: "ranking",
    question: "How do job rankings work?",
    answer: "Ranking evaluates job fit against your profile and highlights strengths and gaps. Treat scores as decision support, not a guarantee of eligibility or an offer.",
    steps: ["Open Jobs.", "Run ranking on discovered matches.", "Check the fit score, verdict, strengths and gaps."],
    route: "jobs", action: "Open Jobs",
    triggers: ["rank jobs", "ranking", "fit score", "match score", "suitable", "job fit", "strengths and gaps"],
    contexts: ["jobs"],
  },
  {
    id: "auto-apply",
    question: "Does the app automatically apply for me?",
    answer: "No. The app helps discover and rank jobs, prepare materials and track progress. It does not submit applications to employers. You review and submit them yourself.",
    route: "studio", action: "Open Studio",
    triggers: ["auto apply", "auto-apply", "automatically apply", "automatically submit", "submit for me", "send applications automatically", "does it apply", "does it submit", "apply for me", "submit the application", "submit an application", "submit my application"],
    contexts: ["studio", "pipeline"],
  },
  {
    id: "prepare",
    question: "How do I prepare a job application?",
    answer: "Use Studio to prepare a tailored CV and cover letter for a posting. Review the documents and any requested approvals before submitting through the employer's application process yourself.",
    steps: ["Open Studio and select the role or posting.", "Prepare and inspect the tailored documents.", "Submit outside the app, then update Pipeline with the actual outcome."],
    route: "studio", action: "Open Studio",
    triggers: ["prepare application", "apply for a job", "how to apply", "cover letter", "tailor resume", "customize cv", "application studio"],
    contexts: ["studio", "jobs"],
  },
  {
    id: "documents",
    question: "Where are my resumes and documents?",
    answer: "Open Documents for available application files and previews. Generated files live in your local upstream workspace; preparing a file does not mean it was sent.",
    route: "documents", action: "Open Documents",
    triggers: ["documents", "where is my resume", "where are my files", "pdf", "download cv", "resume files", "latex"],
    contexts: ["documents", "studio"],
  },
  {
    id: "pipeline",
    question: "How do I track my applications?",
    answer: "Pipeline is your application tracker. Review cards and update each status based on what really happened. A drafted application is not the same as a submitted application.",
    steps: ["Open Pipeline.", "Find the application card.", "Record the actual status and outcome after taking action."],
    route: "pipeline", action: "Open Pipeline",
    triggers: ["track applications", "pipeline", "application status", "kanban", "applied jobs", "where are my applications", "outcome"],
    contexts: ["pipeline", "dashboard"],
  },
  {
    id: "interviews",
    question: "How do I prepare for interviews?",
    answer: "Open Interview Prep to work with the interview workflow. AI-powered preparation depends on a configured provider; Jobzuu's help answers do not.",
    route: "interview", action: "Open Interview Prep",
    triggers: ["interview", "practice questions", "mock interview", "interview prep", "roleplay"],
    contexts: ["interview"],
  },
  {
    id: "workflows",
    question: "What are workflows?",
    answer: "Workflows connect to the upstream job-search commands for tasks like discovery, ranking and preparation. Starting a workflow may invoke your configured AI provider; The offline guide never runs a workflow.",
    route: "automations", action: "Open Workflows",
    triggers: ["workflows", "automation", "slash commands", "run workflow", "what can i automate"],
    contexts: ["automations"],
  },
  {
    id: "activity",
    question: "Where can I see what the agent is doing?",
    answer: "Agent Activity shows run progress, tool activity and pending requests. Check it to monitor workflows and respond when a run needs your input.",
    route: "activity", action: "Open Agent Activity",
    triggers: ["agent activity", "agent runs", "progress", "running task", "execution", "run history"],
    contexts: ["activity", "automations"],
  },
  {
    id: "approvals",
    question: "Why does the app ask for approval?",
    answer: "Some workflows can request permission before sensitive file or command actions. Review what is being requested in Agent Activity; approve only actions you understand and trust.",
    route: "activity", action: "Review Agent Activity",
    triggers: ["approval", "permission", "needs me", "needs your approval", "human review", "approve", "deny"],
    contexts: ["activity", "studio"],
  },
  {
    id: "profile",
    question: "How do I edit my profile?",
    answer: "Open Profile to review your professional details and job-search preferences. Keep them accurate because matching and generated application content depend on them.",
    route: "profile", action: "Open Profile",
    triggers: ["my profile", "edit profile", "resume details", "preferred country", "job preferences", "candidate profile"],
    contexts: ["profile"],
  },
  {
    id: "providers",
    question: "Do I need an AI provider?",
    answer: "Not for the offline Jobzuu guide. This guide is bundled and never calls a model. Job-search workflows use the provider you choose in Settings. Claude Code and Codex can run the agent workflows. OpenAI API, Gemini, and Ollama handle structured assists such as ranking, drafts, and interview prep; they do not run portal discovery or submit applications. Gmail and Notion sync need Claude Code. Ollama runs on your machine. The others use your own account or API key.",
    route: "settings", action: "Open Settings",
    triggers: ["ai provider", "claude", "codex", "openai", "gemini", "ollama", "api key", "need ai", "without ai", "no ai", "models", "local llm", "local model", "which model", "what models"],
    contexts: ["settings", "automations"],
  },
  {
    id: "privacy",
    question: "Is my data stored locally?",
    answer: "The app keeps workspace data in your local upstream folder and run history/settings in local app storage. External AI workflows may send relevant content to a configured provider. The offline guide never sends your question to a server.",
    route: "settings", action: "Open Settings",
    triggers: ["privacy", "local data", "stored locally", "where is data stored", "work offline", "data security", "private"],
    contexts: ["settings"],
  },
  {
    id: "costs",
    question: "Is the Jobzuu guide free?",
    answer: "Yes. The Jobzuu guide is a bundled, offline help feature: no subscription, API key, model download or token charge. Other AI-powered workflows may incur provider charges.",
    triggers: ["is scout free", "is jobzuu free", "does the help guide cost money", "chatbot cost", "help cost", "free assistant", "token cost", "no api cost"],
    contexts: ["dashboard", "settings"],
  },
  {
    id: "troubleshooting",
    question: "What if something isn't working?",
    answer: "Start with Settings to check your connected workspace, provider and dependencies. Use Agent Activity for workflow errors. The offline guide can explain the screens, but it cannot inspect logs or repair your system.",
    steps: ["Check Settings and the workspace connection.", "Review Agent Activity for the failed run.", "Consult the project's troubleshooting guide for your error."],
    route: "settings", action: "Open Settings",
    triggers: ["not working", "application failed", "workflow failed", "troubleshoot", "missing dependency", "something wrong", "something failed"],
    contexts: ["settings", "activity"],
  },
];

const normalize = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

const STOP_WORDS = new Set(["how", "what", "where", "when", "which", "why", "does", "do", "the", "this", "that", "for", "can", "you", "me", "my", "i", "a", "an", "to", "is", "it", "in", "on", "and", "with", "of", "or", "be", "am"]);

/** Words that show up in ordinary sentences and must not win a match by themselves. */
const GENERIC = new Set(["job", "jobs", "app", "help", "work", "file", "files", "data", "open", "show", "need", "make", "cost", "free", "score", "model", "models", "error", "failed", "broken", "stuck", "begin", "using", "used", "scout", "screen", "thing", "something", "please", "just", "like", "want", "from", "your", "about", "have", "has"]);

const isContent = (word: string) => (word.length > 2 || word === "ai") && !STOP_WORDS.has(word);

const contentWords = (text: string) => normalize(text).split(" ").filter(isContent);

const RAW_WORDS = new Set(HELP_TOPICS.flatMap((topic) => contentWords([topic.question, ...topic.triggers].join(" "))));

const stemToken = (word: string) => {
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) {
    const stem = word.slice(0, -1);
    if (RAW_WORDS.has(stem)) return stem;
  }
  return word;
};

const stemText = (text: string) => normalize(text).split(" ").map(stemToken).join(" ").replace(/\s+/g, " ").trim();

const DOC_FREQ = new Map<string, number>();
for (const topic of HELP_TOPICS) {
  const words = new Set(stemText([topic.question, ...topic.triggers].join(" ")).split(" ").filter(isContent));
  for (const word of words) DOC_FREQ.set(word, (DOC_FREQ.get(word) || 0) + 1);
}

const containsPhrase = (haystack: string, phrase: string) =>
  ` ${haystack} `.includes(` ${phrase} `);

/** Best whole-phrase score for one topic. Keyword hits are not summed across triggers. */
function scoreTopic(stemQuery: string, topic: HelpTopic): number {
  let best = 0;
  for (const variantRaw of [topic.question, ...topic.triggers]) {
    const variant = stemText(variantRaw);
    if (!variant) continue;
    if (stemQuery === variant) return 1000;
    if (!containsPhrase(stemQuery, variant)) continue;
    const words = variant.split(" ").filter(isContent);
    if (!words.length) continue;
    if (words.length === 1) {
      const word = words[0];
      if (word.length < 5 || GENERIC.has(word)) continue;
      best = Math.max(best, 80 + variant.length);
      continue;
    }
    const idf = words.reduce((sum, word) => sum + Math.log((HELP_TOPICS.length + 1) / (1 + (DOC_FREQ.get(word) || 0))), 0);
    best = Math.max(best, 200 + words.length * 20 + idf * 12);
  }
  return best;
}

export function findHelpTopic(input: string): HelpTopic | null {
  const query = stemText(input);
  if (!query) return null;
  let best: HelpTopic | null = null;
  let bestScore = 0;
  for (const topic of HELP_TOPICS) {
    const score = scoreTopic(query, topic);
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return bestScore >= 80 ? best : null;
}

const THANKS = /^(?:thanks|thank you|thx|ok|okay|got it|great|cool)(?: (?:scout|jobzuu))?$/;
const FOLLOW_UP_OPEN = /^(?:please )?(?:open it|open that|open this|go there|take me there|show me that|take me to it|open the screen)$/;
const OPEN_REQUEST = /^(?:please )?(?:open|go to|take me to|show me) (?:the )?(.+)$/;

const DESTINATIONS: Record<string, string> = {
  today: "dashboard",
  dashboard: "dashboard",
  jobs: "jobs",
  studio: "studio",
  documents: "documents",
  pipeline: "pipeline",
  "interview prep": "interview",
  interview: "interview",
  "agent activity": "activity",
  activity: "activity",
  workflows: "automations",
  automations: "automations",
  profile: "profile",
  settings: "settings",
};

const ROUTE_TOPIC: Record<string, string> = {
  dashboard: "start",
  jobs: "discover",
  studio: "prepare",
  documents: "documents",
  pipeline: "pipeline",
  interview: "interviews",
  activity: "activity",
  automations: "workflows",
  profile: "profile",
  settings: "appearance",
};

export const HELP_FALLBACK = "I'm not sure how to answer that yet. I can explain the app's screens and common workflows, but I don't have AI or access to your personal data. Try one of the help topics below.";

export type HelpAnswer = { text: string; topic: HelpTopic | null; openRoute?: string };

export function answerHelpQuestion(input: string, context: { previous?: HelpTopic | null } = {}): HelpAnswer {
  const query = normalize(input);
  if (!query) return { text: "", topic: null };
  if (THANKS.test(query)) return { text: "Anytime. Ask another question whenever you want.", topic: null };
  if (context.previous?.route && FOLLOW_UP_OPEN.test(query)) {
    return { text: context.previous.answer, topic: context.previous, openRoute: context.previous.route };
  }
  const request = query.match(OPEN_REQUEST);
  if (request) {
    const route = DESTINATIONS[request[1]];
    if (route) {
      const topic = HELP_TOPICS.find((item) => item.id === ROUTE_TOPIC[route]) || null;
      return { text: topic?.answer || "Opening that screen.", topic, openRoute: route };
    }
  }
  const topic = findHelpTopic(input);
  if (!topic) return { text: HELP_FALLBACK, topic: null };
  return { text: topic.answer, topic };
}

export function suggestedHelpTopics(route: string): HelpTopic[] {
  const matching = HELP_TOPICS.filter((topic) => topic.contexts.includes(route));
  return (matching.length ? matching : HELP_TOPICS.slice(0, 4)).slice(0, 4);
}
