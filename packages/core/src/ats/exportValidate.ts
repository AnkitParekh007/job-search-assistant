import type { CandidateProfile, ExportValidation } from "./types";

const YEAR_RANGE = /\b((?:19|20)\d{2})\s*(?:[-–—]|to)\s*((?:19|20)\d{2}|present|current|now)\b/gi;
const EMPLOYER = /\b(?:worked at|employed (?:at|by)|joined|(?:engineer|developer|designer|manager|lead|consultant|analyst|architect|intern) (?:at|for))\s+([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3})/g;

const has = (hay: string, needle: string) => hay.toLowerCase().includes(needle.toLowerCase());

/**
 * Heuristic guard before exporting a CV/cover letter: confirmed identity must be
 * present, and employer/date claims must be backed by confirmed facts.
 */
export function validateExportText(exportText: string, profile: CandidateProfile): ExportValidation {
  const confirmed = profile.facts.filter((f) => f.confirmed);
  const confirmedText = confirmed.map((f) => f.value).join("\n");
  const missing: string[] = [];
  const invented: string[] = [];
  const warnings: string[] = [];

  const name = profile.name.trim() || confirmed.find((f) => f.field === "name")?.value.trim() || "";
  const email = profile.email.trim() || confirmed.find((f) => f.field === "email")?.value.trim() || "";
  if (name && !has(exportText, name)) missing.push("name");
  if (email && !has(exportText, email)) missing.push("email");
  if (!name) warnings.push("No confirmed name to verify.");
  if (!email) warnings.push("No confirmed email to verify.");
  if (!exportText.trim()) warnings.push("Export text is empty.");

  const flag = (line: string) => { const t = line.trim(); if (!invented.includes(t)) invented.push(t); };
  for (const line of exportText.split(/\r\n|\n|\r/)) {
    if (!line.trim()) continue;
    for (const m of line.matchAll(YEAR_RANGE)) {
      const years = [m[1], /^\d/.test(m[2]) ? m[2] : null].filter(Boolean) as string[];
      if (!years.every((y) => has(confirmedText, y))) { flag(line); break; }
    }
    for (const m of line.matchAll(EMPLOYER)) {
      if (!has(confirmedText, m[1].trim())) { flag(line); break; }
    }
  }
  if (invented.length) warnings.push("Some lines mention employers or dates that are not in your confirmed facts.");
  return { ok: missing.length === 0 && invented.length === 0, missing, invented, warnings };
}
