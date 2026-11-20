import type { CandidateFact, CandidateProfile, JobRequirement, MatchExplanation } from "./types";

const IDENTITY_FIELDS = new Set(["name", "email", "phone", "location", "headline"]);

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-insensitive whole-token containment (handles values like "C++" or "Node.js"). */
export function containsValue(haystack: string, needle: string): boolean {
  const n = needle.trim();
  if (n.length < 2) return false;
  return new RegExp(`(?<![\\p{L}\\p{N}])${esc(n)}(?![\\p{L}\\p{N}])`, "iu").test(haystack);
}

/**
 * Explain how confirmed facts cover job requirements. Only confirmed facts are
 * evidence; nothing is inferred or invented.
 */
export function explainMatch(profile: CandidateProfile, requirements: JobRequirement[]): MatchExplanation {
  const confirmed = profile.facts.filter((f) => f.confirmed === true);
  if (!confirmed.length) {
    return { ok: false, strengths: [], gaps: [], refuseReason: "No confirmed facts in your profile. Confirm facts from your resume before matching so results are based on evidence you approved." };
  }
  if (!requirements.length) {
    return { ok: false, strengths: [], gaps: [], refuseReason: "No job requirements were found in the posting text." };
  }
  const evidence = confirmed.filter((f) => !IDENTITY_FIELDS.has(f.field));
  const strengths: MatchExplanation["strengths"] = [];
  const gaps: MatchExplanation["gaps"] = [];
  const covered = new Set<string>();

  for (const req of requirements) {
    const hits: CandidateFact[] = evidence.filter((f) => containsValue(req.text, f.value));
    for (const f of hits) {
      strengths.push({ factId: f.id, requirementId: req.id, note: `Your confirmed ${f.field} "${f.value}" appears in this ${req.kind === "must" ? "required" : "preferred"} item.` });
    }
    if (hits.length) covered.add(req.id);
    else if (req.kind === "must") gaps.push({ requirementId: req.id, note: `No confirmed fact covers: ${req.text}` });
  }

  const musts = requirements.filter((r) => r.kind === "must");
  const pool = musts.length ? musts : requirements;
  const score = pool.filter((r) => covered.has(r.id)).length / pool.length;
  return { ok: true, score, strengths, gaps };
}
