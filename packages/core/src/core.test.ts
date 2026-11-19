import { describe, expect, it } from "vitest";
import { canTransition, computeMetrics, lastContact } from "./metrics";
import { buildCodexPrompt, buildPrompt, buildPromptForProvider, WORKFLOWS } from "./workflows";
import { PRODUCT_FEATURES, WORKFLOW_FEATURES } from "./features";
import { providerSupportsWorkflow, unsupportedReason } from "./providers";
import type { TrackerRow, SeenJob } from "./types";

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
    expect(m.funnel.find((f) => f.label === "Submitted")!.value).toBe(3);
  });
  it("follow-ups use the latest dated note, never drafted rows", () => {
    expect(m.followUps.map((f) => f.company)).toEqual(["C1"]);
    expect(lastContact(rows[2].fields)).toBe("2026-11-18");
  });
  it("deadlines are days-until", () => {
    expect(m.deadlines[0]).toMatchObject({ company: "C0", days: 3 });
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
  });
});
