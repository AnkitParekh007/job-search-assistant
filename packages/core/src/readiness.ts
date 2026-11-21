import { providerSupportsWorkflow, unsupportedReason, PROVIDER_LABEL } from "./providers";
import type { Dep } from "./types";

type Deps = Dep[] | null | undefined;
const find = (deps: Deps, id: string) => (deps ?? []).find((d) => d.id === id);
const ok = (deps: Deps, id: string) => find(deps, id)?.ok === true;

/**
 * True only when at least one AI provider can actually run.
 * "Installed" is not "ready": CLI providers must be authenticated too.
 * The native `ai_provider` dep is authoritative when present.
 */
export function aiProviderReady(deps: Deps): boolean {
  const aggregate = find(deps, "ai_provider");
  if (aggregate) return aggregate.ok === true;
  const claude = ok(deps, "claude") && ok(deps, "claude_auth");
  const codex = ok(deps, "codex") && ok(deps, "codex_auth");
  return claude || codex || ok(deps, "openai_api") || ok(deps, "gemini") || ok(deps, "ollama");
}

/** Human-readable reason an AI provider is not ready, or null when ready. */
export function aiProviderBlockedReason(deps: Deps): string | null {
  if (aiProviderReady(deps)) return null;

  // Prefer actionable reasons for providers that appear partially set up.
  const claudeInstalled = ok(deps, "claude");
  const codexInstalled = ok(deps, "codex");
  if (claudeInstalled && !ok(deps, "claude_auth")) {
    return "Sign in to Claude Code in Settings → AI Providers.";
  }
  if (codexInstalled && !ok(deps, "codex_auth")) {
    return "Sign in to Codex in Settings → AI Providers.";
  }

  // Only nudge Ollama when the binary is present but the service is down — never
  // because the dep row exists (deps always emit openai/gemini/ollama rows).
  const ollama = find(deps, "ollama");
  if (ollama && !ollama.ok && /installed but service not reachable/i.test(ollama.detail || "")) {
    return "Start Ollama (`ollama serve`) and pull a model, then refresh Settings.";
  }

  const aggregate = find(deps, "ai_provider");
  if (aggregate?.fix) return aggregate.fix;
  return "Install and sign in to an AI provider (Claude Code, Codex, OpenAI API, Gemini or Ollama) in Settings.";
}

/**
 * Exact selected-provider readiness — never treat "some other provider is ready"
 * as permission to start workflows under the user's chosen default.
 */
export function selectedProviderReady(deps: Deps, provider: string | null | undefined): boolean {
  if (!provider) return false;
  switch (provider) {
    case "claude":
      return ok(deps, "claude") && ok(deps, "claude_auth");
    case "codex":
      return ok(deps, "codex") && ok(deps, "codex_auth");
    case "openai_api":
      return ok(deps, "openai_api");
    case "gemini":
      return ok(deps, "gemini");
    case "ollama":
      return ok(deps, "ollama");
    default:
      return false;
  }
}

export function selectedProviderBlockedReason(
  deps: Deps,
  provider: string | null | undefined,
): string | null {
  if (!provider) return "Choose a default AI provider in Settings.";
  if (selectedProviderReady(deps, provider)) return null;

  const label = PROVIDER_LABEL[provider] || provider;
  switch (provider) {
    case "claude":
      if (ok(deps, "claude") && !ok(deps, "claude_auth")) {
        return "Sign in to Claude Code in Settings → AI Providers.";
      }
      return "Claude Code is not ready. Install and sign in under Settings → AI Providers.";
    case "codex":
      if (ok(deps, "codex") && !ok(deps, "codex_auth")) {
        return "Sign in to Codex in Settings → AI Providers.";
      }
      return "OpenAI Codex is not ready. Install the CLI and connect ChatGPT under Settings → AI Providers.";
    case "openai_api":
      return "Add an OpenAI Platform API key in Settings → AI Providers (stored in the OS keychain).";
    case "gemini":
      return "Add a Gemini API key in Settings → AI Providers (stored in the OS keychain).";
    case "ollama": {
      const ollama = find(deps, "ollama");
      if (ollama && /installed but service not reachable/i.test(ollama.detail || "")) {
        return "Start Ollama (`ollama serve`) and pull a model, then refresh Settings.";
      }
      return "Ollama is not ready. Install it, run `ollama serve`, and pull a model.";
    }
    default:
      return `${label} is not ready. Finish setup in Settings → AI Providers.`;
  }
}

/**
 * Combined gate: the *selected* provider must be ready *and* support the workflow.
 * Use for Find jobs / Rank / Evaluate CTAs so unsupported providers stay disabled.
 */
export function workflowReady(deps: Deps, provider: string | null | undefined, workflowId: string): boolean {
  if (!selectedProviderReady(deps, provider)) return false;
  return providerSupportsWorkflow(provider!, workflowId);
}

export function workflowBlockedReason(
  deps: Deps,
  provider: string | null | undefined,
  workflowId: string,
): string | null {
  const selected = selectedProviderBlockedReason(deps, provider);
  if (selected) return selected;
  return unsupportedReason(provider!, workflowId);
}
