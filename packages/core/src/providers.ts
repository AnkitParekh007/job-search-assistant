/** Multi-provider AI runtime contracts shared by desktop apps and UI. */

/** Provider account/status payload returned by native bridges. Browser/demo shells can
 * report `unsupported` without inventing authentication state.
 */
export type ProviderAccountResponse = {
  unsupported?: boolean;
  account?: {
    type?: string;
    email?: string;
    planType?: string;
    [key: string]: unknown;
  } | null;
  requiresOpenaiAuth?: boolean;
  loggedIn?: boolean;
  authMethod?: string;
  [key: string]: unknown;
};

/** Native sign-in may start an interactive browser flow, or return an error. */
export type ProviderLoginResponse = {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
};

export type ProviderId = "claude" | "codex" | "openai_api" | "gemini" | "ollama";

export type ProviderCapability = {
  id: string;
  label: string;
  supported: boolean;
};

export type ProviderStatus = {
  id: ProviderId | string;
  name: string;
  available: boolean;
  authenticated: boolean;
  detail: string;
  fix: string;
  planned: boolean;
  capabilities: ProviderCapability[];
  models: string[];
  default_model?: string | null;
};

export const PROVIDER_LABEL: Record<string, string> = {
  claude: "Claude Code",
  codex: "OpenAI Codex",
  openai_api: "OpenAI API",
  gemini: "Google Gemini",
  ollama: "Ollama",
};

/** Workflows that rely on Claude-specific connectors or slash-command machinery. */
export const CLAUDE_ONLY_WORKFLOWS = new Set(["gmail-sync", "notion-sync", "add-portal", "add-template", "reset"]);

/** Core workflows Codex can attempt via engine-neutral instructions (not slash-command parity). */
export const CODEX_SUPPORTED_WORKFLOWS = new Set([
  "setup",
  "scrape",
  "rank",
  "apply",
  "outcome",
  "interview",
  "html-report",
  "expand",
  "upskill",
]);

export function providerSupportsWorkflow(provider: string, workflowId: string): boolean {
  if (provider === "claude") return true;
  if (provider === "codex") return CODEX_SUPPORTED_WORKFLOWS.has(workflowId);
  return false;
}

export function unsupportedReason(provider: string, workflowId: string): string | null {
  if (providerSupportsWorkflow(provider, workflowId)) return null;
  if (provider === "codex" && CLAUDE_ONLY_WORKFLOWS.has(workflowId)) {
    return "This workflow needs Claude Code (Gmail/Notion connectors or Claude-specific slash commands). Switch the provider to Claude Code, or pick a supported workflow.";
  }
  if (provider === "codex") {
    return "OpenAI Codex does not support this workflow yet. Use Claude Code, or choose Discover / Rank / Apply / Outcome.";
  }
  return `${PROVIDER_LABEL[provider] || provider} cannot run this workflow yet.`;
}
