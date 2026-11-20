import { validateExportText } from "./exportValidate";
import { explainMatch } from "./match";
import { mergeFact, emptyProfile } from "./profile";
import { parseResumeFromText } from "./parse";
import { extractJobRequirements } from "./requirements";

const RESUME = `Alex Morgan
alex.morgan@example.com
+49 30 1234567
Berlin, Germany

Skills: TypeScript, React, Node.js, GraphQL

Experience
Senior Frontend Engineer, Example GmbH 2019 - 2024
`;

const POSTING = `Nordlicht — Senior Frontend Engineer

About us
Nordlicht builds climate dashboards.

Requirements
- Strong TypeScript experience
- Production React applications

Nice to have
- GraphQL
- Experience with design systems
`;

const EXPECTED_SKILLS = ["TypeScript", "React", "Node.js", "GraphQL"];

/** Pure-JS synthetic benchmark (no fs / node imports; safe for the browser bundle). */
export function runBenchmark(): { ok: boolean; details: Record<string, unknown> } {
  const parsed = parseResumeFromText(RESUME);
  const requirements = extractJobRequirements(POSTING);
  let profile = emptyProfile();
  for (const f of parsed.facts) profile = mergeFact(profile, { ...f, confirmed: true });
  const match = explainMatch(profile, requirements);
  const skills = parsed.facts.filter((f) => f.field === "skill").map((f) => f.value.toLowerCase());
  const recall = EXPECTED_SKILLS.filter((s) => skills.includes(s.toLowerCase())).length / EXPECTED_SKILLS.length;
  const exportText = "Alex Morgan\nalex.morgan@example.com\nSkills: TypeScript, React";
  const exportValidation = validateExportText(exportText, profile);
  const nameOk = profile.name === "Alex Morgan";
  const ok = nameOk && requirements.length > 0 && match.ok && recall >= 0.75 && exportValidation.ok;
  return {
    ok,
    details: { nameOk, requirements: requirements.length, matchOk: match.ok, score: match.score, skillsRecall: recall, exportOk: exportValidation.ok, strengths: match.strengths.length, gaps: match.gaps.length },
  };
}
