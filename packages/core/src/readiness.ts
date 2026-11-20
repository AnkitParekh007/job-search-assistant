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
  const claudeInstalled = ok(deps, "claude");
  const codexInstalled = ok(deps, "codex");
  if (claudeInstalled && !ok(deps, "claude_auth")) return "Sign in to Claude Code in Settings → AI Providers.";
  if (codexInstalled && !ok(deps, "codex_auth")) return "Sign in to Codex in Settings → AI Providers.";
  const aggregate = find(deps, "ai_provider");
  if (aggregate?.fix) return aggregate.fix;
  return "Install and sign in to an AI provider (Claude Code, Codex, OpenAI API, Gemini or Ollama) in Settings.";
}
