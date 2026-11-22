/**
 * Browser-only snapshot of the fictional `demo/` workspace.
 * Used when the Apple Silicon UI is opened with `?demo=1` outside Tauri,
 * so README screenshots show the real components on sample data.
 * Not used inside the desktop app. Live runs still require Tauri.
 */

const STARTED = Date.parse("2026-11-22T10:15:00Z");

export const DEMO_WORKSPACE = {
  path: "demo (fictional sample)",
  valid: true,
  configured: true,
  upstream_version: "sample",
  data_dir: "demo",
  created: [] as string[],
};

export const DEMO_DEPS = [
  { id: "python", name: "Python 3.10+", ok: true, required: true, detail: "Demo snapshot", fix: "" },
  { id: "claude", name: "Claude Code", ok: true, required: false, detail: "Demo snapshot — not a live sign-in", fix: "" },
  { id: "claude_auth", name: "Claude Code account", ok: true, required: false, detail: "Demo snapshot — not a live sign-in", fix: "" },
  { id: "ai_provider", name: "AI provider", ok: true, required: true, detail: "Demo snapshot", fix: "" },
];

export const DEMO_TRACKER = {
  exists: true,
  header: [
    "date", "company", "sector", "role", "role_type", "channel", "status", "contact_person",
    "fit_rating", "notes", "cv_file", "cover_letter_file", "source", "deadline",
  ],
  rows: [
    {
      index: 0,
      fields: {
        date: "2026-11-20",
        company: "Nordlicht",
        sector: "Climate software",
        role: "Senior Frontend Engineer",
        role_type: "frontend",
        channel: "careers site",
        status: "drafted",
        contact_person: "",
        fit_rating: "high",
        notes: "sample draft waiting for you to submit",
        cv_file: "cv/nordlicht_cv.tex",
        cover_letter_file: "cover_letters/nordlicht_cover.tex",
        source: "https://jobs.example.com/nordlicht/senior-frontend",
        deadline: "2026-11-28",
      },
    },
    {
      index: 1,
      fields: {
        date: "2026-11-18",
        company: "Larkspur Labs",
        sector: "Developer tools",
        role: "Product Engineer",
        role_type: "product",
        channel: "careers site",
        status: "applied",
        contact_person: "",
        fit_rating: "medium",
        notes: "user confirmed submitted",
        cv_file: "cv/larkspur_cv.tex",
        cover_letter_file: "",
        source: "https://jobs.example.com/larkspur/product-engineer",
        deadline: "",
      },
    },
    {
      index: 2,
      fields: {
        date: "2026-11-20",
        company: "Meridian Health",
        sector: "Health records",
        role: "Design Systems Engineer",
        role_type: "frontend",
        channel: "careers site",
        status: "interview",
        contact_person: "",
        fit_rating: "medium",
        notes: "sample stage recorded by hand",
        cv_file: "",
        cover_letter_file: "",
        source: "https://jobs.example.com/meridian/design-systems",
        deadline: "",
      },
    },
  ],
};

const job = (partial: Record<string, unknown>) => partial;

export const DEMO_SEEN = [
  job({
    key: "nordlicht-senior-frontend",
    title: "Senior Frontend Engineer",
    company: "Nordlicht",
    url: "https://jobs.example.com/nordlicht/senior-frontend",
    location: "Berlin · remote-friendly",
    remote: true,
    first_seen: "2026-11-19",
    posted_date: "2026-11-18",
    deadline: null,
    employment_type: "full-time",
    fit: "high",
    status: "ranked",
    portal: "example",
    source: "websearch",
    rank_score: 82,
    rank_verdict: "strong match",
    rank_date: "2026-11-20",
    location_verdict: "PASS",
    language_gate: "PASS",
    language_note: "English posting",
    strengths: ["TypeScript and React match confirmed profile facts", "Climate-dashboard domain overlaps the sample resume"],
    gaps: ["Design systems are listed as nice-to-have and are not a confirmed fact"],
  }),
  job({
    key: "larkspur-product-engineer",
    title: "Product Engineer",
    company: "Larkspur Labs",
    url: "https://jobs.example.com/larkspur/product-engineer",
    location: "Remote",
    remote: true,
    first_seen: "2026-11-17",
    posted_date: "2026-11-16",
    deadline: null,
    employment_type: "full-time",
    fit: "medium",
    status: "ranked",
    portal: "example",
    source: "websearch",
    rank_score: 74,
    rank_verdict: "partial match",
    rank_date: "2026-11-18",
    location_verdict: "PASS",
    language_gate: "PASS",
    strengths: ["React and TypeScript are confirmed"],
    gaps: ["The posting asks for deeper GraphQL schema design than the sample profile confirms"],
  }),
  job({
    key: "meridian-design-systems",
    title: "Design Systems Engineer",
    company: "Meridian Health",
    url: "https://jobs.example.com/meridian/design-systems",
    location: "Hamburg",
    remote: false,
    first_seen: "2026-11-11",
    posted_date: "2026-11-10",
    deadline: null,
    employment_type: "full-time",
    fit: "medium",
    status: "ranked",
    portal: "example",
    source: "websearch",
    rank_score: 68,
    rank_verdict: "partial match",
    rank_date: "2026-11-12",
    location_verdict: "FLAG",
    language_gate: "PASS",
    strengths: ["Frontend experience is confirmed"],
    gaps: ["Design-system ownership is not a confirmed fact"],
  }),
  job({
    key: "paper-lantern-frontend",
    title: "Frontend Engineer",
    company: "Paper Lantern",
    url: "https://jobs.example.com/paper-lantern/frontend",
    location: "Remote",
    remote: true,
    first_seen: "2026-11-21",
    posted_date: "2026-11-21",
    deadline: null,
    employment_type: "full-time",
    fit: "medium",
    status: "new",
    portal: "example",
    source: "websearch",
    location_verdict: "PASS",
    language_gate: "PASS",
  }),
  job({
    key: "glass-orchard-ui",
    title: "UI Engineer",
    company: "Glass Orchard",
    url: "https://jobs.example.com/glass-orchard/ui",
    location: "Amsterdam",
    remote: false,
    first_seen: "2026-11-21",
    posted_date: "2026-11-20",
    deadline: null,
    employment_type: "full-time",
    fit: "low",
    status: "new",
    portal: "example",
    source: "websearch",
  }),
  job({
    key: "cedar-circuit-web",
    title: "Web Engineer",
    company: "Cedar Circuit",
    url: "https://jobs.example.com/cedar-circuit/web",
    location: "Remote",
    remote: true,
    first_seen: "2026-11-22",
    posted_date: "2026-11-22",
    deadline: null,
    employment_type: "contract",
    fit: "medium",
    status: "new",
    portal: "example",
    source: "websearch",
  }),
];

export const DEMO_PROFILE = {
  schema_version: 1,
  name: "Alex Morgan",
  headline: "Senior frontend engineer (fictional sample)",
  email: "alex.morgan@example.com",
  phone: "",
  location: "Berlin, Germany",
  workAuthorization: "sample",
  preferences: { countries: ["Germany"], remote: true, seniority: ["senior"] },
  facts: [
    { id: "ts", field: "skill", value: "TypeScript", source: "user", confidence: 1, confirmed: true },
    { id: "react", field: "skill", value: "React", source: "user", confidence: 1, confirmed: true },
    { id: "node", field: "skill", value: "Node.js", source: "user", confidence: 1, confirmed: true },
    { id: "gql", field: "skill", value: "GraphQL", source: "user", confidence: 1, confirmed: true },
  ],
  updatedAt: "2026-11-20T09:00:00Z",
};

export const DEMO_INTERVIEW_MD = `# Interview prep (fictional sample)

## Ready-Made STAR Examples

### 1. Climate dashboard (frontend)
**S:** A sample team needed one screen for emissions data that non-engineers could read.
**T:** Ship a React view that matched the confirmed TypeScript skills in this profile.
**A:** Built the view from the sample posting's requirements and left numbers for the candidate to fill.
**R:** This sample does not invent a metric. [ADD DETAIL: your own result]
**Use for:** "Tell me about a frontend project"

## Common Tough Questions

### Tell me about the gap.
> The sample profile does not invent an answer. Write yours in this file.

## Questions You Should Ask Interviewers

### The work
- "What would I ship in the first 90 days?"
`;

const RUN_ID = "demo-apply";

export const DEMO_RUNS = {
  runs: [
    {
      id: RUN_ID,
      workflow: "apply",
      prompt: "/apply Nordlicht — Senior Frontend Engineer",
      session_id: "demo-session",
      status: "awaiting_approval",
      started_at: STARTED,
      finished_at: null,
      cost_usd: null,
      summary: null,
      error: null,
      provider: "claude",
      model: "sample",
    },
  ],
  live: { [RUN_ID]: "awaiting_approval" } as Record<string, string>,
};

export const DEMO_EVENTS = {
  events: [
    {
      run_id: RUN_ID,
      seq: 1,
      ts: STARTED,
      kind: "user",
      data: { detail: "Evaluate the Nordlicht sample posting. Do not write files until allowed." },
    },
    {
      run_id: RUN_ID,
      seq: 2,
      ts: STARTED + 4000,
      kind: "assistant",
      data: { detail: "Fit looks usable. Waiting to save cv/nordlicht_cv.tex." },
    },
  ],
  pending: [
    {
      request_id: "req-demo-write",
      request: {
        tool_name: "Write",
        display_name: "Write",
        input: {
          file_path: "cv/nordlicht_cv.tex",
          description: "Save the tailored CV draft. Nothing is written until you allow it.",
          content: "% fictional sample — not saved until you allow it",
        },
      },
    },
  ],
};

export function demoMode(): boolean {
  return typeof window !== "undefined"
    && !("__TAURI_INTERNALS__" in window)
    && new URLSearchParams(window.location.search).get("demo") === "1";
}
