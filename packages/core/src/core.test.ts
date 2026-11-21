import { describe, expect, it } from "vitest";
import { canTransition, computeMetrics, lastContact, type LifecycleEvent } from "./metrics";
import { buildCodexPrompt, buildPrompt, buildPromptForProvider, WORKFLOWS } from "./workflows";
import { PRODUCT_FEATURES, WORKFLOW_FEATURES } from "./features";
import { providerSupportsWorkflow, unsupportedReason } from "./providers";
import {
  aiProviderBlockedReason,
  selectedProviderBlockedReason,
  selectedProviderReady,
  workflowBlockedReason,
  workflowReady,
} from "./readiness";
import type { Dep, TrackerRow, SeenJob } from "./types";

const dep = (id: string, okFlag: boolean, detail = "", fix = ""): Dep => ({
  id, name: id, ok: okFlag, required: false, detail, fix,
});

const row = (i: number, f: Partial<Record<string, string>>): TrackerRow => ({
  index: i,
  fields: { date: "2026-11-01", company: "C" + i, role: "R", status: "applied", notes: "", deadline: "", ...f } as Record<string, string>,
});

describe("metrics", () => {
  const rows = [
    row(0, { status: "drafted", deadline: "2026-11-22" }),
    row(1, { status: "applied", date: "2026-11-01" }),
    row(2, { status: "interview", date: "2026-11-15", notes: "2026-11-18 phone screen" }),
    row(3, { status: "No Response" }),
  ];
  const seen = [
    { key: "a", title: "t", company: "c", url: "u", fit: "high", status: "new" },
    { key: "b", title: "t", company: "c", url: "u", fit: "low", status: "ranked", rank_score: 40 },
  ] as SeenJob[];
  const m = computeMetrics(rows, seen, new Date("2026-11-19T12:00:00"));

  it("counts real records only, canonicalising legacy spellings", () => {
    expect(m.discovered).toBe(2);
    expect(m.byStatus.no_response).toBe(1);
    expect(m.open).toBe(3);
    expect(m.funnel.find((f) => f.label === "Drafted")!.value).toBe(1);
    expect(m.funnel.find((f) => f.label === "Submitted")!.value).toBe(3);
  });
  it("follow-ups use the latest dated note, never drafted rows", () => {
    expect(m.followUps.map((f) => f.company)).toEqual(["C1"]);
    expect(lastContact(rows[2].fields)).toBe("2026-11-18");
  });
  it("deadlines are days-until", () => {
    expect(m.deadlines[0]).toMatchObject({ company: "C0", days: 3 });
  });
  it("empty or unknown status does not count as Submitted (CA-P1-01)", () => {
    const orphan = [
      row(0, { status: "drafted" }),
      row(1, { status: "" }),
      row(2, { status: "Status" }), // unmapped human header leftover as value
    ];
    const orphanMetrics = computeMetrics(orphan, [], new Date("2026-11-19T12:00:00"));
    expect(orphanMetrics.funnel.find((f) => f.label === "Drafted")!.value).toBe(1);
    expect(orphanMetrics.funnel.find((f) => f.label === "Submitted")!.value).toBe(0);
    expect(orphanMetrics.byStatus.unknown).toBe(2);
  });
});

describe("status transitions follow upstream rules", () => {
  it("never reopens final statuses or moves backwards", () => {
    expect(canTransition("rejected", "interview").ok).toBe(false);
    expect(canTransition("interview", "applied").ok).toBe(false);
    expect(canTransition("applied", "drafted").ok).toBe(false);
    expect(canTransition("applied", "interview").ok).toBe(true);
    expect(canTransition("drafted", "applied").ok).toBe(true);
  });
});

describe("workflow catalog", () => {
  it("covers every shipped upstream workflow", () => {
    const cmds = WORKFLOWS.map((w) => w.command).sort();
    expect(cmds).toEqual(
      ["/add-portal", "/add-template", "/apply", "/expand", "/gmail-sync", "/html-report", "/interview", "/notion-sync", "/outcome", "/rank", "/reset", "/scrape", "/setup", "/upskill"].sort(),
    );
  });
  it("passes arguments as message text, not shell", () => {
    expect(buildPrompt(WORKFLOWS.find((w) => w.id === "apply")!, "https://x.test/j?a=1&b=$(rm -rf ~)")).toBe(
      "/apply https://x.test/j?a=1&b=$(rm -rf ~)",
    );
  });
  it("exposes marketing feature projections", () => {
    expect(PRODUCT_FEATURES.length).toBeGreaterThan(5);
    expect(WORKFLOW_FEATURES.map((w) => w.command).sort()).toEqual(WORKFLOWS.map((w) => w.command).sort());
  });
  it("builds Codex prompts without assuming slash-command execution", () => {
    const apply = WORKFLOWS.find((w) => w.id === "apply")!;
    const p = buildCodexPrompt(apply, "https://x.test/j");
    expect(p).not.toMatch(/^\/apply/);
    expect(p).toContain("never auto-submit");
    expect(p).toContain("https://x.test/j");
    expect(buildPromptForProvider(apply, "u", "claude")).toBe("/apply u");
    expect(buildPromptForProvider(apply, "u", "codex")).toContain("Workflow id: apply");
  });
  it("gates provider-supported workflows", () => {
    expect(providerSupportsWorkflow("claude", "gmail-sync")).toBe(true);
    expect(providerSupportsWorkflow("codex", "gmail-sync")).toBe(false);
    expect(providerSupportsWorkflow("codex", "rank")).toBe(true);
    expect(unsupportedReason("codex", "gmail-sync")).toMatch(/Claude Code/);
    expect(providerSupportsWorkflow("openai_api", "rank")).toBe(true);
    expect(providerSupportsWorkflow("ollama", "scrape")).toBe(false);
    expect(providerSupportsWorkflow("gemini", "interview")).toBe(true);
    expect(unsupportedReason("ollama", "scrape")).toMatch(/structured analysis/);
    expect(buildPromptForProvider(WORKFLOWS.find((w) => w.id === "rank")!, "", "openai_api")).toContain("structured inference");
  });
});

describe("readiness messaging", () => {
  it("does not default to OpenAI key messaging just because the openai_api dep row exists", () => {
    const deps = [
      dep("claude", false),
      dep("claude_auth", false),
      dep("openai_api", false, "no key configured", "Add an OpenAI Platform API key"),
      dep("gemini", false, "no key configured"),
      dep("ollama", false, "not installed"),
      dep("ai_provider", false, "No AI provider ready", "Install Claude Code / Codex / Ollama, or add an OpenAI / Gemini API key in Settings."),
    ];
    expect(aiProviderBlockedReason(deps)).toMatch(/Install Claude Code \/ Codex \/ Ollama/);
  });
  it("disables scrape for inference-only providers even when ai_provider is ready", () => {
    const deps = [
      dep("ai_provider", true),
      dep("ollama", true),
      dep("claude", true),
      dep("claude_auth", true),
    ];
    expect(workflowReady(deps, "ollama", "scrape")).toBe(false);
    expect(workflowReady(deps, "ollama", "rank")).toBe(true);
    expect(workflowReady(deps, "claude", "scrape")).toBe(true);
  });
  it("requires the exact selected provider to be ready, not merely any provider", () => {
    const deps = [
      dep("ai_provider", true),
      dep("ollama", true),
      dep("claude", true),
      dep("claude_auth", false),
      dep("openai_api", false),
      dep("gemini", false),
      dep("codex", false),
      dep("codex_auth", false),
    ];
    expect(selectedProviderReady(deps, "ollama")).toBe(true);
    expect(selectedProviderReady(deps, "claude")).toBe(false);
    expect(workflowReady(deps, "claude", "scrape")).toBe(false);
    expect(workflowBlockedReason(deps, "claude", "scrape")).toMatch(/Sign in to Claude/);
    expect(selectedProviderBlockedReason(deps, "openai_api")).toMatch(/OpenAI Platform API key/);
  });
});

describe("computeMetrics lifecycle events", () => {
  const rows = [row(0, { status: "applied" }), row(1, { status: "interview" }), row(2, { status: "drafted" })];
  const now = new Date("2026-11-19T12:00:00");
  const val = (m: ReturnType<typeof computeMetrics>, l: string) => m.funnel.find((f) => f.label === l)!.value;

  it("falls back to tracker CSV when no lifecycle events are given", () => {
    const m = computeMetrics(rows, [], now, []);
    expect(m.lifecycleSource).toBe("tracker");
    expect(val(m, "Submitted")).toBe(2);
  });
  it("ignores events that are not submitted/interview/offer", () => {
    const m = computeMetrics(rows, [], now, [{ type: "draft_created" }]);
    expect(m.lifecycleSource).toBe("tracker");
  });
  it("uses events only once any funnel event exists, de-duplicating per application", () => {
    const ev: LifecycleEvent[] = [
      { type: "user_confirmed_submitted", app: "a" },
      { type: "user_confirmed_submitted", app: "a" },
      { type: "user_confirmed_submitted", app: "b" },
      { type: "interview_scheduled", app: "b" },
      { type: "recruiter_screen_scheduled", app: "b" },
      { type: "offer_received", app: "b" },
    ];
    const m = computeMetrics(rows, [], now, ev);
    expect(m.lifecycleSource).toBe("events");
    expect(val(m, "Submitted")).toBe(2);
    expect(val(m, "Interview")).toBe(1);
    expect(val(m, "Offer")).toBe(1);
    expect(m.interviewRate).toBe(0.5);
  });
  it("counts app-less events by raw count (interview = max of the two event types)", () => {
    const m = computeMetrics(rows, [], now, [
      { type: "user_confirmed_submitted" },
      { type: "interview_scheduled" },
      { type: "recruiter_screen_scheduled" },
    ]);
    expect(val(m, "Submitted")).toBe(1);
    expect(val(m, "Interview")).toBe(1);
  });
});
