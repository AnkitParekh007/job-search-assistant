import { describe, expect, it } from "vitest";
import { aiProviderBlockedReason, aiProviderReady } from "../readiness";
import { emptyProfile, explainMatch, extractJobRequirements, mergeFact, parseResumeFromText, runBenchmark, validateExportText } from "./index";

const RESUME = "Alex Morgan\nalex@example.com\n+49 30 1234567\nBerlin, Germany\nSkills: TypeScript, React\n";

describe("parseResumeFromText", () => {
  it("extracts unconfirmed facts", () => {
    const { facts, diagnostics } = parseResumeFromText(RESUME);
    const by = (f: string) => facts.filter((x) => x.field === f).map((x) => x.value);
    expect(by("name")).toEqual(["Alex Morgan"]);
    expect(by("email")).toEqual(["alex@example.com"]);
    expect(by("phone")).toHaveLength(1);
    expect(by("location")).toEqual(["Berlin, Germany"]);
    expect(by("skill")).toEqual(["TypeScript", "React"]);
    expect(facts.every((f) => !f.confirmed && f.source === "resume" && f.confidence >= 0.5 && f.confidence <= 0.9)).toBe(true);
    expect(diagnostics.chars).toBe(RESUME.length);
    expect(diagnostics.missingSections).toContain("experience");
  });
  it("warns on empty text", () => {
    const { facts, diagnostics } = parseResumeFromText("  ");
    expect(facts).toEqual([]);
    expect(diagnostics.warnings.length).toBeGreaterThan(0);
  });
});

describe("extractJobRequirements", () => {
  const posting = "Role\n\nRequirements:\n- TypeScript\n- React\n\nNice to have\n- GraphQL\n";
  it("splits must and nice with spans", () => {
    const reqs = extractJobRequirements(posting);
    expect(reqs.map((r) => [r.kind, r.text])).toEqual([["must", "TypeScript"], ["must", "React"], ["nice", "GraphQL"]]);
    for (const r of reqs) expect(posting.slice(r.span!.start, r.span!.end)).toBe(r.text);
  });
});

describe("explainMatch", () => {
  const reqs = extractJobRequirements("Requirements\n- TypeScript\n- Rust\n");
  it("refuses with no confirmed facts", () => {
    const { facts } = parseResumeFromText(RESUME);
    let p = emptyProfile();
    for (const f of facts) p = mergeFact(p, f);
    const m = explainMatch(p, reqs);
    expect(m.ok).toBe(false);
    expect(m.refuseReason).toBeTruthy();
  });
  it("reports strengths and gaps from confirmed facts only", () => {
    let p = emptyProfile();
    for (const f of parseResumeFromText(RESUME).facts) p = mergeFact(p, { ...f, confirmed: f.field === "skill" && f.value === "TypeScript" });
    const m = explainMatch(p, reqs);
    expect(m.ok).toBe(true);
    expect(m.strengths).toHaveLength(1);
    expect(m.gaps).toHaveLength(1);
    expect(m.score).toBe(0.5);
  });
});

describe("validateExportText", () => {
  it("flags missing identity and invented employers", () => {
    let p = emptyProfile();
    for (const f of parseResumeFromText(RESUME).facts) p = mergeFact(p, { ...f, confirmed: true });
    const v = validateExportText("Alex Morgan\nWorked at Globex 2015 - 2020", p);
    expect(v.ok).toBe(false);
    expect(v.missing).toContain("email");
    expect(v.invented).toHaveLength(1);
  });
});

describe("runBenchmark", () => {
  it("passes", () => {
    const r = runBenchmark();
    expect(r.details).toBeDefined();
    expect(r.ok).toBe(true);
  });
});

describe("readiness", () => {
  const dep = (id: string, ok: boolean) => ({ id, name: id, ok, required: false, detail: "", fix: "" });
  it("prefers ai_provider", () => {
    expect(aiProviderReady([dep("ai_provider", true)])).toBe(true);
    expect(aiProviderReady([dep("ai_provider", false), dep("claude", true), dep("claude_auth", true)])).toBe(false);
  });
  it("falls back to authenticated providers", () => {
    expect(aiProviderReady([dep("claude", true), dep("claude_auth", true)])).toBe(true);
    expect(aiProviderReady([dep("claude", true), dep("claude_auth", false)])).toBe(false);
    expect(aiProviderBlockedReason([dep("claude", true), dep("claude_auth", false)])).toMatch(/Claude/);
    expect(aiProviderBlockedReason([dep("claude", true), dep("claude_auth", true)])).toBeNull();
  });
});
