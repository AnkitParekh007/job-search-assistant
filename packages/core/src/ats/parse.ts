import type { CandidateFact, ParseDiagnostics, Span } from "./types";

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE = /(?<![\w@])\+?\d[\d\s().-]{6,}\d(?![\w@])/g;
const SKILL_HEADER = /^\s*(?:#+\s*)?(?:technical\s+|key\s+|core\s+)?(?:skills|technologies|tech stack|competencies)\s*:?\s*(.*)$/i;
const OTHER_HEADER = /^\s*(?:#+\s*)?(?:work\s+)?(?:experience|employment|education|projects|summary|profile|certifications|languages|interests|publications|awards|contact)\s*:?\s*$/i;

type Line = { text: string; start: number };

function splitLines(text: string): Line[] {
  const out: Line[] = [];
  let pos = 0;
  for (const raw of text.split(/\r\n|\n|\r|\f/)) {
    const start = text.indexOf(raw, pos);
    out.push({ text: raw, start: start === -1 ? pos : start });
    pos = (start === -1 ? pos : start) + raw.length;
  }
  return out;
}

function looksLikeName(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 50 || /[\d@:/\\|,]/.test(t)) return false;
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (OTHER_HEADER.test(t) || SKILL_HEADER.test(t) || /^(resume|curriculum vitae|cv)$/i.test(t)) return false;
  return words.every((w) => /^[A-ZÀ-Ý][\p{L}'’.-]*$/u.test(w));
}

const cleanSkill = (s: string) => s.replace(/^[\s•\-*·▪–]+/, "").replace(/[.;]+$/, "").trim();
const validSkill = (s: string) => s.length >= 2 && s.length <= 40 && s.split(/\s+/).length <= 4;

export function parseResumeFromText(text: string): { facts: CandidateFact[]; diagnostics: ParseDiagnostics } {
  const warnings: string[] = [];
  const facts: CandidateFact[] = [];
  const chars = text.length;
  const pages = text.includes("\f") ? text.split("\f").length : undefined;
  if (!text.trim()) {
    return {
      facts,
      diagnostics: { chars, pages, warnings: ["Resume text is empty — paste text or import a file."], missingSections: ["experience", "education", "skills"], textCoverage: 0, lowConfidenceFields: [] },
    };
  }

  let seq = 0;
  const add = (field: string, value: string, confidence: number, span?: Span) => {
    const v = value.trim();
    if (!v) return;
    if (facts.some((f) => f.field === field && f.value.toLowerCase() === v.toLowerCase())) return;
    facts.push({ id: `resume-${field}-${seq++}`, field, value: v, source: "resume", confidence, confirmed: false, span });
  };
  const lines = splitLines(text);
  const used = new Set<number>();

  // Email
  const em = EMAIL.exec(text);
  if (em) {
    add("email", em[0], 0.9, { start: em.index, end: em.index + em[0].length });
    lines.forEach((l, i) => { if (l.text.includes(em[0])) used.add(i); });
  } else warnings.push("No email address found.");

  // Phone
  for (const m of text.matchAll(PHONE)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) continue;
    if (/^(?:19|20)\d{2}\D+(?:19|20)\d{2}$/.test(m[0].trim())) continue; // year range
    add("phone", m[0], 0.75, { start: m.index!, end: m.index! + m[0].length });
    break;
  }

  // Name: first non-empty line if it looks like a name
  const firstIdx = lines.findIndex((l) => l.text.trim());
  if (firstIdx >= 0 && looksLikeName(lines[firstIdx].text)) {
    const l = lines[firstIdx];
    const lead = l.text.length - l.text.trimStart().length;
    add("name", l.text.trim(), 0.8, { start: l.start + lead, end: l.start + lead + l.text.trim().length });
    used.add(firstIdx);
  } else warnings.push("Could not identify a name on the first line.");

  // Location
  const CITY = /^[\p{Lu}][\p{L}.' -]+,\s*[\p{Lu}][\p{L}.' -]+(?:,\s*[\p{Lu}][\p{L}.' -]+)?$/u;
  let locDone = false;
  for (let i = 0; i < lines.length && !locDone; i++) {
    const m = /^\s*(?:location|address|based in)\s*:\s*(.+)$/i.exec(lines[i].text);
    if (m) {
      const idx = lines[i].text.indexOf(m[1]);
      add("location", m[1].trim(), 0.85, { start: lines[i].start + idx, end: lines[i].start + idx + m[1].trim().length });
      used.add(i); locDone = true;
    }
  }
  if (!locDone) {
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      for (const part of lines[i].text.split(/\s[|•·]\s/)) {
        const t = part.trim();
        if (t && !t.includes("@") && !/\d/.test(t) && t.length <= 60 && CITY.test(t) && !SKILL_HEADER.test(t)) {
          const idx = text.indexOf(t, lines[i].start);
          add("location", t, 0.6, { start: idx, end: idx + t.length });
          used.add(i); locDone = true; break;
        }
      }
      if (locDone) break;
    }
  }

  // Skills
  let inSkills = false;
  let skillCount = 0;
  const pushSkills = (raw: string, offset: number, conf: number, lineIdx: number) => {
    let cursor = offset;
    for (const part of raw.split(/[,;|•·]/)) {
      const at = text.indexOf(part, cursor);
      cursor = at === -1 ? cursor : at + part.length;
      const s = cleanSkill(part);
      if (!validSkill(s)) continue;
      const sIdx = text.indexOf(s, at === -1 ? offset : at);
      add("skill", s, conf, sIdx >= 0 ? { start: sIdx, end: sIdx + s.length } : undefined);
      skillCount++;
      used.add(lineIdx);
    }
  };
  lines.forEach((l, i) => {
    const t = l.text;
    if (!t.trim()) { inSkills = false; return; }
    const hm = SKILL_HEADER.exec(t);
    if (hm) {
      inSkills = true;
      if (hm[1]) pushSkills(hm[1], l.start + t.lastIndexOf(hm[1]), 0.85, i);
      used.add(i);
      return;
    }
    if (OTHER_HEADER.test(t)) { inSkills = false; return; }
    if (inSkills) { pushSkills(t, l.start, 0.8, i); return; }
    // Free-standing comma list: 4+ short items, not a sentence
    const parts = t.split(",");
    if (parts.length >= 4 && !/[.!?]\s*$/.test(t) && !t.includes("@") && parts.every((p) => validSkill(cleanSkill(p)))) {
      pushSkills(t, l.start, 0.5, i);
    }
  });
  if (!skillCount) warnings.push("No skills section detected.");

  // Experience / employers (Title, Company YEAR - YEAR)
  let inExperience = false;
  let employerCount = 0;
  const EXP_LINE = /^(.+?),\s+([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,4})\s+((?:19|20)\d{2})\s*(?:[-–—]|to)\s*((?:19|20)\d{2}|present|current|now)\s*$/i;
  lines.forEach((l, i) => {
    const t = l.text.trim();
    if (!t) return;
    if (/^\s*(?:#+\s*)?(?:work\s+)?(?:experience|employment)\s*:?\s*$/i.test(t)) {
      inExperience = true;
      used.add(i);
      return;
    }
    if (OTHER_HEADER.test(t) && !/experience|employment/i.test(t)) {
      inExperience = false;
      return;
    }
    if (!inExperience && !EXP_LINE.test(t)) return;
    const m = EXP_LINE.exec(t);
    if (!m) return;
    const company = m[2].trim();
    const years = `${m[3]} - ${m[4]}`;
    const title = m[1].trim();
    const companyAt = text.indexOf(company, l.start);
    add("employer", company, 0.7, companyAt >= 0 ? { start: companyAt, end: companyAt + company.length } : undefined);
    add("experience", `${title} at ${company} (${years})`, 0.65, { start: l.start, end: l.start + l.text.length });
    employerCount++;
    used.add(i);
    inExperience = true;
  });
  if (!employerCount && /^\s*(?:#+\s*)?(?:work\s+)?(?:experience|employment)/im.test(text)) {
    warnings.push("Experience section found but no Title, Company YEAR - YEAR lines parsed.");
  }

  const missingSections: string[] = [];
  if (!/^\s*(?:#+\s*)?(?:work\s+)?(?:experience|employment)/im.test(text) && !employerCount) missingSections.push("experience");
  if (!/^\s*(?:#+\s*)?education/im.test(text)) missingSections.push("education");
  if (!skillCount) missingSections.push("skills");

  const nonEmpty = lines.filter((l) => l.text.trim()).length || 1;
  const usedNonEmpty = [...used].filter((i) => lines[i]?.text.trim()).length;
  const best = new Map<string, number>();
  for (const f of facts) best.set(f.field, Math.max(best.get(f.field) ?? 0, f.confidence));
  const lowConfidenceFields = [...best].filter(([, c]) => c < 0.6).map(([k]) => k);
  if (chars < 200) warnings.push("Very little text extracted — the resume may be scanned or image-based.");

  return {
    facts,
    diagnostics: { chars, pages, warnings, missingSections, textCoverage: Math.min(1, usedNonEmpty / nonEmpty), lowConfidenceFields },
  };
}
