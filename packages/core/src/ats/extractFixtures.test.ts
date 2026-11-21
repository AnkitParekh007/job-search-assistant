import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { ALEX_RESUME, EXPECTED_ALEX_SKILLS, parseResumeFromText } from "./index";

const here = dirname(fileURLToPath(import.meta.url));
const DOCX = join(here, "fixtures", "alex-resume.docx");
const PDF = join(here, "fixtures", "alex-resume.pdf");
const hasPdftotext = spawnSync("pdftotext", ["-v"], { encoding: "utf8" }).status === 0
  || (spawnSync("pdftotext", ["-v"], { encoding: "utf8" }).stderr || "").includes("pdftotext");

/** Minimal ZIP reader (central directory) so we need no extra dependency. */
function readZipEntry(buf: Buffer, name: string): string | null {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const elen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const entry = buf.toString("utf8", p + 46, p + 46 + nlen);
    if (entry === name) {
      const dataStart = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
      const data = buf.subarray(dataStart, dataStart + csize);
      return (method === 0 ? data : inflateRawSync(data)).toString("utf8");
    }
    p += 46 + nlen + elen + clen;
  }
  return null;
}

describe("resume extraction fixtures", () => {
  it("parses the synthetic ALEX_RESUME text (source of truth: fixtures.ts)", () => {
    const { facts } = parseResumeFromText(ALEX_RESUME);
    expect(facts.find((f) => f.field === "name")?.value).toBe("Alex Morgan");
    const skills = facts.filter((f) => f.field === "skill").map((f) => f.value);
    for (const s of EXPECTED_ALEX_SKILLS) expect(skills).toContain(s);
  });

  // Skips (not fails) when the optional synthetic DOCX is absent. See PRIVACY.md.
  it.skipIf(!existsSync(DOCX))("synthetic alex-resume.docx contains Alex Morgan in word/document.xml", () => {
    const xml = readZipEntry(readFileSync(DOCX), "word/document.xml");
    expect(xml).not.toBeNull();
    expect(xml).toContain("Alex Morgan");
    const text = (xml as string).replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "");
    const { facts } = parseResumeFromText(text);
    expect(facts.find((f) => f.field === "name")?.value).toBe("Alex Morgan");
  });

  // Requires poppler `pdftotext` on PATH (present on this Apple Silicon host).
  it.skipIf(!existsSync(PDF) || !hasPdftotext)("synthetic alex-resume.pdf extracts via pdftotext then parseResumeFromText", () => {
    const r = spawnSync("pdftotext", [PDF, "-"], { encoding: "utf8" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Alex Morgan");
    const { facts, diagnostics } = parseResumeFromText(r.stdout);
    expect(facts.find((f) => f.field === "name")?.value).toBe("Alex Morgan");
    expect(facts.some((f) => f.field === "employer" && /Example GmbH/i.test(f.value))).toBe(true);
    expect(diagnostics.chars).toBeGreaterThan(50);
  });
});
