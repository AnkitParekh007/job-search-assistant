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
    triggers: ["get started", "start using", "new here", "first time", "where do i start", "how it works", "begin"],
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
    triggers: ["auto apply", "auto-apply", "automatically apply", "automatically submit", "submit for me", "send applications automatically", "does it apply", "does it submit"],
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
    answer: "Open Interview Prep to work with the interview workflow. AI-powered preparation depends on a configured provider; Scout's help answers do not.",
    route: "interview", action: "Open Interview Prep",
    triggers: ["interview", "practice questions", "mock interview", "interview prep", "roleplay"],
    contexts: ["interview"],
  },
  {
    id: "workflows",
    question: "What are workflows?",
    answer: "Workflows connect to the upstream job-search commands for tasks like discovery, ranking and preparation. Starting a workflow may invoke your configured AI provider; Scout itself never runs a workflow.",
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
    answer: "Not for Scout! This help guide works completely offline. The app's AI-powered job-search workflows may require a supported provider configured in Settings, with its own usage limits or costs.",
    route: "settings", action: "Open Settings",
    triggers: ["ai provider", "claude", "codex", "openai", "gemini", "ollama", "api key", "need ai", "without ai", "no ai", "models"],
    contexts: ["settings", "automations"],
  },
  {
    id: "privacy",
    question: "Is my data stored locally?",
    answer: "The app keeps workspace data in your local upstream folder and run history/settings in local app storage. External AI workflows may send relevant content to a configured provider. Scout never sends your question to a server.",
    route: "settings", action: "Open Settings",
    triggers: ["privacy", "local data", "stored locally", "where is data stored", "offline", "data security", "private"],
    contexts: ["settings"],
  },
  {
    id: "costs",
    question: "Is Scout free?",
    answer: "Yes. Scout is a bundled, offline help feature: no subscription, API key, model download or token charge. Other AI-powered workflows may incur provider charges.",
    triggers: ["is scout free", "chatbot cost", "help cost", "free assistant", "token cost", "no api cost"],
    contexts: ["dashboard", "settings"],
  },
  {
    id: "troubleshooting",
    question: "What if something isn't working?",
    answer: "Start with Settings to check your connected workspace, provider and dependencies. Use Agent Activity for workflow errors. Scout can explain the screens, but it cannot inspect logs or repair your system.",
    steps: ["Check Settings and the workspace connection.", "Review Agent Activity for the failed run.", "Consult the project's troubleshooting guide for your error."],
    route: "settings", action: "Open Settings",
    triggers: ["not working", "error", "failed", "broken", "troubleshoot", "stuck", "missing dependency", "something wrong"],
    contexts: ["settings", "activity"],
  },
];

const normalize = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

const STOP_WORDS = new Set(["how", "what", "where", "when", "which", "why", "does", "do", "the", "this", "that", "for", "can", "you", "me", "my", "i", "a", "an", "to", "is", "it", "in", "on", "and", "with"]);

export function findHelpTopic(input: string): HelpTopic | null {
  const query = normalize(input);
  if (!query) return null;
  const queryWords = new Set(query.split(" ").filter((word) => word.length > 2 && !STOP_WORDS.has(word)));
  const matches = HELP_TOPICS.map((topic) => {
    const variants = [topic.question, ...topic.triggers].map(normalize);
    let score = 0;
    for (const variant of variants) {
      if (query === variant) score += 100;
      else if (variant.length >= 5 && query.includes(variant)) score += 18;
      else if (query.length >= 8 && variant.includes(query)) score += 12;
      for (const token of variant.split(" ")) {
        if (token.length > 3 && queryWords.has(token)) score += 1;
      }
    }
    return { topic, score };
  }).sort((a, b) => b.score - a.score);
  return matches[0]?.score >= 3 ? matches[0].topic : null;
}

export function suggestedHelpTopics(route: string): HelpTopic[] {
  const matching = HELP_TOPICS.filter((topic) => topic.contexts.includes(route));
  return (matching.length ? matching : HELP_TOPICS.slice(0, 4)).slice(0, 4);
}
