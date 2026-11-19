import { canonical, FINAL, SeenJob, TrackerRow } from "./api";

export type Metrics = {
  discovered: number;
  newMatches: number;
  ranked: number;
  byStatus: Record<string, number>;
  open: number;
  deadlines: { company: string; role: string; deadline: string; days: number }[];
  followUps: { company: string; role: string; quiet: number }[];
  funnel: { label: string; value: number }[];
  fitBands: { label: string; value: number }[];
  byMonth: { label: string; value: number }[];
  interviewRate: number | null;
};

const dayMs = 86400000;
export const daysBetween = (a: string, b: Date) => Math.floor((b.getTime() - new Date(a + "T00:00:00").getTime()) / dayMs);

/** Latest of the row date and any dated note (upstream /outcome "days quiet" rule). */
export function lastContact(row: Record<string, string>): string {
  const dates = [row.date, ...((row.notes || "").match(/\d{4}-\d{2}-\d{2}/g) || [])].filter(Boolean).sort();
  return dates[dates.length - 1] || row.date;
}

export function computeMetrics(rows: TrackerRow[], seen: SeenJob[], now = new Date()): Metrics {
  const byStatus: Record<string, number> = {};
  for (const r of rows) {
    const s = canonical(r.fields.status);
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  const submitted = rows.filter((r) => canonical(r.fields.status) !== "drafted" && canonical(r.fields.status) !== "withdrawn").length;
  const reachedInterview = rows.filter((r) => ["interview", "offer", "hired", "offer_declined"].includes(canonical(r.fields.status)) || /interview/i.test(r.fields.notes || "")).length;
  const offers = rows.filter((r) => ["offer", "hired", "offer_declined"].includes(canonical(r.fields.status))).length;

  const deadlines = rows
    .filter((r) => r.fields.deadline && !FINAL.has(canonical(r.fields.status)))
    .map((r) => ({ company: r.fields.company, role: r.fields.role, deadline: r.fields.deadline, days: -daysBetween(r.fields.deadline, now) }))
    .sort((a, b) => a.days - b.days);
  for (const j of seen) {
    if (j.deadline && (j.status === "new" || j.status === "ranked")) {
      deadlines.push({ company: j.company, role: j.title, deadline: j.deadline, days: -daysBetween(j.deadline, now) });
    }
  }
  deadlines.sort((a, b) => a.days - b.days);

  const followUps = rows
    .filter((r) => ["applied", "interview"].includes(canonical(r.fields.status)))
    .map((r) => ({ company: r.fields.company, role: r.fields.role, quiet: daysBetween(lastContact(r.fields), now), sent: ((r.fields.notes || "").match(/followed up \d{4}-\d{2}-\d{2}/g) || []).length }))
    .filter((r) => r.quiet >= 10 && r.sent < 2)
    .map(({ company, role, quiet }) => ({ company, role, quiet }));

  const bands = { high: 0, medium: 0, low: 0 };
  for (const j of seen) if (j.fit && j.fit in bands) bands[j.fit as keyof typeof bands]++;

  const months: Record<string, number> = {};
  for (const r of rows) if (canonical(r.fields.status) !== "drafted" && r.fields.date) months[r.fields.date.slice(0, 7)] = (months[r.fields.date.slice(0, 7)] || 0) + 1;

  return {
    discovered: seen.length,
    newMatches: seen.filter((j) => j.status === "new").length,
    ranked: seen.filter((j) => j.status === "ranked").length,
    byStatus,
    open: rows.filter((r) => !FINAL.has(canonical(r.fields.status))).length,
    deadlines,
    followUps,
    funnel: [
      { label: "Discovered", value: seen.length },
      { label: "Ranked", value: seen.filter((j) => j.rank_score != null).length },
      { label: "Drafted", value: rows.length },
      { label: "Submitted", value: submitted },
      { label: "Interview", value: reachedInterview },
      { label: "Offer", value: offers },
    ],
    fitBands: [
      { label: "High", value: bands.high },
      { label: "Medium", value: bands.medium },
      { label: "Low", value: bands.low },
    ],
    byMonth: Object.keys(months).sort().map((k) => ({ label: k, value: months[k] })),
    interviewRate: submitted ? reachedInterview / submitted : null,
  };
}

/** Allowed manual transitions mirror upstream: final statuses never reopen. */
export function canTransition(from: string, to: string): { ok: boolean; reason?: string } {
  const f = canonical(from), t = canonical(to);
  if (f === t) return { ok: false, reason: "Already in that stage." };
  if (FINAL.has(f)) return { ok: false, reason: `"${f}" is final. Upstream never reopens a closed application.` };
  if (t === "drafted") return { ok: false, reason: "An application can't move back to drafted." };
  const order = ["drafted", "applied", "interview", "offer"];
  if (order.includes(t) && order.indexOf(t) < order.indexOf(f)) return { ok: false, reason: "Upstream never moves a row backwards." };
  if (f === "drafted" && ["interview", "offer", "hired", "rejected", "no_response", "offer_declined"].includes(t))
    return { ok: true, reason: "Moving straight from drafted means it was submitted; the date becomes today." };
  return { ok: true };
}
