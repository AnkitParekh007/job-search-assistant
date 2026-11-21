import { validateExportText } from "./exportValidate";
import { ALEX_RESUME, EXPECTED_ALEX_SKILLS, NORDLICHT_POSTING } from "./fixtures";
import { explainMatch } from "./match";
import { mergeFact, emptyProfile } from "./profile";
import { parseResumeFromText } from "./parse";
import { extractJobRequirements } from "./requirements";

/** Pure-JS synthetic benchmark (no fs / node imports; safe for the browser bundle). */
export function runBenchmark(): { ok: boolean; details: Record<string, unknown> } {
  const parsed = parseResumeFromText(ALEX_RESUME);
  const requirements = extractJobRequirements(NORDLICHT_POSTING);
  let profile = emptyProfile();
  for (const f of parsed.facts) profile = mergeFact(profile, { ...f, confirmed: true });
  const match = explainMatch(profile, requirements);
  const skills = parsed.facts.filter((f) => f.field === "skill").map((f) => f.value.toLowerCase());
  const recall = EXPECTED_ALEX_SKILLS.filter((s) => skills.includes(s.toLowerCase())).length / EXPECTED_ALEX_SKILLS.length;
  const exportText = "Alex Morgan\nalex.morgan@example.com\nSkills: TypeScript, React\nSenior Frontend Engineer at Example GmbH 2019 - 2024";
  const exportValidation = validateExportText(exportText, profile);
  const nameOk = profile.name === "Alex Morgan";
  const employerOk = parsed.facts.some((f) => f.field === "employer" && /Example GmbH/i.test(f.value));
  const ok = nameOk && employerOk && requirements.length > 0 && match.ok && recall >= 0.75 && exportValidation.ok;
  return {
    ok,
    details: {
      nameOk,
      employerOk,
      requirements: requirements.length,
      matchOk: match.ok,
      score: match.score,
      skillsRecall: recall,
      exportOk: exportValidation.ok,
      strengths: match.strengths.length,
      gaps: match.gaps.length,
    },
  };
}
