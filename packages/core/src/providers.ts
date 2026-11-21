/** Multi-provider AI runtime contracts shared by desktop apps and UI. */

/** Provider account/status payload returned by native bridges. Desktop shells that
 * have not wired a provider yet can report `unsupported` without inventing auth state.
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
  cliInstalled?: boolean;
  apiKeyConfigured?: boolean;
  probe?: unknown;
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

export type ProviderAuthType = "cli_oauth" | "api_key_keychain" | "local" | "none";

export type ProviderMeta = {
  id: ProviderId;
  label: string;
  authType: ProviderAuthType;
  execution: "agentic" | "inference" | "hybrid";
  local: boolean;
  experimental: boolean;
  modelSettingKey: string;
};

export const PROVIDER_META: Record<ProviderId, ProviderMeta> = {
  claude: {
    id: "claude",
    label: "Claude Code",
    authType: "cli_oauth",
    execution: "agentic",
    local: false,
    experimental: false,
    modelSettingKey: "model",
  },
  codex: {
    id: "codex",
    label: "OpenAI Codex",
    authType: "cli_oauth",
    execution: "agentic",
    local: false,
    experimental: false,
    modelSettingKey: "codex_model",
  },
  openai_api: {
    id: "openai_api",
    label: "OpenAI API",
    authType: "api_key_keychain",
    execution: "inference",
    local: false,
    experimental: false,
    modelSettingKey: "openai_api_model",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    authType: "api_key_keychain",
    execution: "hybrid",
    local: false,
    experimental: true,
    modelSettingKey: "gemini_model",
  },
  ollama: {
    id: "ollama",
    label: "Ollama",
    authType: "local",
    execution: "inference",
    local: true,
    experimental: false,
    modelSettingKey: "ollama_model",
  },
};

export const PROVIDER_LABEL: Record<string, string> = Object.fromEntries(
  Object.values(PROVIDER_META).map((p) => [p.id, p.label]),
);

/** Workflows that rely on Claude-specific connectors or slash-command machinery. */
export const CLAUDE_ONLY_WORKFLOWS = new Set([
  "gmail-sync",
  "notion-sync",
  "reset",
]);

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
  "add-portal",
  "add-template",
]);

/**
 * Structured inference workflows for OpenAI API / Gemini API / Ollama.
 * These do not execute tools or upstream slash commands — host builds context,
 * model returns advisory JSON.
 */
export const INFERENCE_SUPPORTED_WORKFLOWS = new Set([
  "setup",
  "rank",
  "apply",
  "outcome",
  "interview",
  "expand",
  "upskill",
]);

export function providerSupportsWorkflow(provider: string, workflowId: string): boolean {
  if (provider === "claude") return true;
  if (provider === "codex") return CODEX_SUPPORTED_WORKFLOWS.has(workflowId);
  if (provider === "openai_api" || provider === "gemini" || provider === "ollama") {
    return INFERENCE_SUPPORTED_WORKFLOWS.has(workflowId);
  }
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
  if (provider === "openai_api" || provider === "gemini" || provider === "ollama") {
    if (workflowId === "scrape" || workflowId === "html-report") {
      return `${PROVIDER_LABEL[provider] || provider} runs structured analysis only — it cannot scrape portals or run full agentic automation. Use Claude Code or Codex for Discover / HTML report.`;
    }
    if (CLAUDE_ONLY_WORKFLOWS.has(workflowId)) {
      return "This workflow requires Claude Code connectors or slash-command machinery.";
    }
    return `${PROVIDER_LABEL[provider] || provider} supports structured job-search assists (rank, apply drafts, interview, upskill) — not this workflow.`;
  }
  return `${PROVIDER_LABEL[provider] || provider} cannot run this workflow yet.`;
}

export function modelSettingKey(provider: string): string {
  return PROVIDER_META[provider as ProviderId]?.modelSettingKey || "model";
}

/** Derive a coarse UI status chip from provider probe fields. */
export function providerUiStatus(p: ProviderStatus): string {
  if (p.planned) return "Experimental";
  if (!p.available) return "Not installed";
  if (!p.authenticated) return "Authentication required";
  if (p.authenticated && p.available) return "Ready";
  return "Unavailable";
}

/**
 * Live end-to-end verification against a real provider account/service.
 * Unit/mock coverage alone is not "live". Keep in sync with
 * `docs/providers/08-test-evidence.md`.
 */
export type ProviderEvidenceLevel = "live" | "unit" | "untested";

export const PROVIDER_EVIDENCE: Record<ProviderId, ProviderEvidenceLevel> = {
  claude: "live",
  codex: "untested",
  openai_api: "unit",
  gemini: "unit",
  ollama: "untested",
};

export function providerEvidenceLabel(id: string): string {
  const level = PROVIDER_EVIDENCE[id as ProviderId];
  if (level === "live") return "Live verified";
  if (level === "unit") return "Unit-tested only";
  return "Live untested";
}
