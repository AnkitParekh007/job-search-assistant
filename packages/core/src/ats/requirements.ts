import type { JobRequirement } from "./types";

const MUST_HDR = /^\s*(?:#+\s*)?(?:\*\*)?(?:must[- ]haves?|required(?: skills| qualifications)?|requirements?|minimum qualifications|qualifications|what you(?:'|’)ll need|what we(?:'|’)re looking for|you have|you bring)(?:\*\*)?\s*:?\s*(.*)$/i;
const NICE_HDR = /^\s*(?:#+\s*)?(?:\*\*)?(?:nice[- ]to[- ]haves?|nice to have|preferred(?: skills| qualifications)?|bonus(?: points)?|a plus|good to have|desirable)(?:\*\*)?\s*:?\s*(.*)$/i;
const OTHER_HDR = /^\s*(?:#+\s*)?(?:\*\*)?(?:about(?: us| the (?:role|team|company))?|responsibilities|what you(?:'|’)ll do|the role|benefits|we offer|what we offer|perks|how to apply|our (?:stack|team|mission)|compensation|overview|description)(?:\*\*)?\s*:?\s*$/i;
const BULLET = /^(\s*(?:[-*•·▪–]|\d+[.)])\s+)(.*\S)\s*$/;

function stripMd(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

/** Rule-based, offline extraction of requirements with character spans into `text`. */
export function extractJobRequirements(text: string): JobRequirement[] {
  const out: JobRequirement[] = [];
  const seen = new Set<string>();
  let section: "must" | "nice" | null = null;
  let pos = 0;
  const push = (raw: string, start: number, kind: "must" | "nice") => {
    const t = stripMd(raw).replace(/[.;]+$/, "").trim();
    if (t.length < 2) return;
    const key = `${kind}:${t.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    const idx = text.indexOf(raw.trim(), start);
    const s = idx === -1 ? start : idx;
    out.push({ id: `req-${out.length + 1}`, text: t, kind, span: { start: s, end: s + raw.trim().length } });
  };

  for (const line of text.split(/\r\n|\n|\r/)) {
    const lineStart = pos;
    pos += line.length + (text.startsWith("\r\n", pos + line.length) ? 2 : 1);
    if (!line.trim()) continue;

    const bullet = BULLET.exec(line);
    if (!bullet) {
      const nice = NICE_HDR.exec(line);
      const must = !nice ? MUST_HDR.exec(line) : null;
      const hdr = nice || must;
      if (hdr && line.trim().length <= 80 + (hdr[1]?.length ?? 0)) {
        section = nice ? "nice" : "must";
        const inline = hdr[1]?.trim();
        if (inline) {
          const base = lineStart + line.lastIndexOf(inline);
          let cursor = 0;
          for (const part of inline.split(/[,;]|\band\b/)) {
            const at = inline.indexOf(part, cursor);
            cursor = at + part.length;
            if (part.trim()) push(part, base + at, section);
          }
        }
        continue;
      }
      if (OTHER_HDR.test(line)) { section = null; continue; }
      // A short header-like line ending with ":" that we don't recognise ends the section.
      if (/^[^.]{1,60}:\s*$/.test(line.trim())) { section = null; continue; }
      // Plain sentence in a requirements section
      if (section && line.trim().length > 8) push(line, lineStart, section);
      continue;
    }

    const body = bullet[2];
    const bodyStart = lineStart + bullet[1].length;
    if (section) { push(body, bodyStart, section); continue; }
    // Bullets outside any section: only keep ones that signal a requirement inline.
    if (/\b(?:nice to have|preferred|a plus|bonus)\b/i.test(body)) push(body, bodyStart, "nice");
    else if (/\b(?:must|required|requires?|minimum|\d+\+?\s*years?)\b/i.test(body)) push(body, bodyStart, "must");
  }
  return out;
}
