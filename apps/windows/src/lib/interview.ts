// Parses upstream 07-interview-prep.md into structured cards. Only content
// that exists in the file is returned; unfilled template placeholders are dropped.
export type Story = { title: string; skill: string; s: string; t: string; a: string; r: string; useFor: string[]; needsDetail: boolean };
export type Tough = { q: string; a: string | null };
export type AskGroup = { title: string; items: string[] };

const isPlaceholder = (s: string) => /^\[[A-Z_ \-–,./]+.*\]$/.test(s.trim()) || /\[PREPARE YOUR ANSWER/.test(s);

export function parseInterview(md: string): { stories: Story[]; tough: Tough[]; ask: AskGroup[] } {
  const section = (name: string) => {
    const i = md.indexOf(`## ${name}`);
    if (i < 0) return "";
    const rest = md.slice(i + name.length + 3);
    const j = rest.search(/\n## /);
    return j < 0 ? rest : rest.slice(0, j);
  };
  const stories: Story[] = [];
  for (const block of section("Ready-Made STAR Examples").split(/\n### /).slice(1)) {
    const head = block.split("\n")[0];
    const m = head.match(/^\d+\.\s*(.*?)\s*\((.*)\)\s*$/) || head.match(/^\d+\.\s*(.*)$/);
    const field = (k: string) => (block.match(new RegExp(`\\*\\*${k}:\\*\\*\\s*([^\\n]*)`)) || [])[1]?.trim() || "";
    const story: Story = {
      title: m?.[1] || head, skill: m?.[2] || "", s: field("S"), t: field("T"), a: field("A"), r: field("R"),
      useFor: (field("Use for").match(/"([^"]+)"/g) || []).map((x) => x.replace(/"/g, "")),
      needsDetail: /\[ADD DETAIL/.test(block),
    };
    if (!isPlaceholder(story.title) && story.s && !isPlaceholder(story.s)) stories.push(story);
  }
  const tough: Tough[] = [];
  for (const block of section("Common Tough Questions").split(/\n### /).slice(1)) {
    const q = block.split("\n")[0].replace(/^"|"$/g, "").trim();
    const a = (block.match(/^>\s*(.*)$/m) || [])[1]?.trim() || null;
    if (q.includes("[")) continue;
    tough.push({ q, a: a && !isPlaceholder(a) ? a : null });
  }
  const ask: AskGroup[] = [];
  for (const block of section("Questions You Should Ask Interviewers").split(/\n### /).slice(1)) {
    const title = block.split("\n")[0].replace(/\s*\(.*\)$/, "").trim();
    const items = (block.match(/^- "(.*)"$/gm) || []).map((l) => l.replace(/^- "|"$/g, ""));
    if (items.length) ask.push({ title, items });
  }
  return { stories, tough, ask };
}
