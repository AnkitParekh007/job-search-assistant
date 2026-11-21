import { canonical, FINAL, type SeenJob, type TrackerRow } from "./types";

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
  /** "events" when Submitted/Interview/Offer come from events.jsonl lifecycle events; otherwise tracker CSV. */
  lifecycleSource: "events" | "tracker";
};

/** One lifecycle event from documents/applications/<id>/events.jsonl. `app` (optional) identifies the application for per-application de-duplication. */
export type LifecycleEvent = { type: string; app?: string };

const SUBMITTED_EVENT = "user_confirmed_submitted";
const INTERVIEW_EVENTS = ["interview_scheduled", "recruiter_screen_scheduled"];
const OFFER_EVENT = "offer_received";

/**
 * Funnel counts from lifecycle events. Each application counts at most once per stage
 * (a single interview transition emits both interview_scheduled and recruiter_screen_scheduled).
 * Events without `app` fall back to raw counts (interview = max of the two event types).
 */
function funnelFromEvents(events: LifecycleEvent[]) {
  const uniq = (types: string[]) => {
    const withApp = new Set<string>();
    const perType: Record<string, number> = {};
    for (const e of events) {
      if (!types.includes(e.type)) continue;
      if (e.app) withApp.add(e.app);
      else perType[e.type] = (perType[e.type] || 0) + 1;
    }
    return withApp.size + Math.max(0, ...Object.values(perType));
  };
  const submitted = uniq([SUBMITTED_EVENT]);
  const interview = uniq(INTERVIEW_EVENTS);
  const offer = uniq([OFFER_EVENT]);
  const any = events.some((e) => e.type === SUBMITTED_EVENT || INTERVIEW_EVENTS.includes(e.type) || e.type === OFFER_EVENT);
  return { any, submitted, interview, offer };
}

const dayMs = 86400000;
export const daysBetween = (a: string, b: Date) => Math.floor((b.getTime() - new Date(a + "T00:00:00").getTime()) / dayMs);

/** Latest of the row date and any dated note (upstream /outcome "days quiet" rule). */
export function lastContact(row: Record<string, string>): string {
  const dates = [row.date, ...((row.notes || "").match(/\d{4}-\d{2}-\d{2}/g) || [])].filter(Boolean).sort();
  return dates[dates.length - 1] || row.date;
}

/**
 * `lifecycleEvents` (optional): when any submitted/interview/offer lifecycle event exists, the
 * Submitted, Interview and Offer funnel stages (and interviewRate) are computed from events only
 * (confirmed facts), not from tracker CSV status. With no such events the CSV rules apply.
 */
export function computeMetrics(rows: TrackerRow[], seen: SeenJob[], now = new Date(), lifecycleEvents?: LifecycleEvent[]): Metrics {
  const byStatus: Record<string, number> = {};
  for (const r of rows) {
    const s = canonical(r.fields.status);
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  // "Submitted" = user-confirmed applied (or later). Drafted count is status===drafted only (BUG-04).
  const drafted = rows.filter((r) => canonical(r.fields.status) === "drafted").length;
  let submitted = rows.filter((r) => {
    const s = canonical(r.fields.status);
    return s !== "drafted" && s !== "withdrawn";
  }).length;
  let reachedInterview = rows.filter((r) => ["interview", "offer", "hired", "offer_declined"].includes(canonical(r.fields.status)) || /interview/i.test(r.fields.notes || "")).length;
  let offers = rows.filter((r) => ["offer", "hired", "offer_declined"].includes(canonical(r.fields.status))).length;
  let lifecycleSource: "events" | "tracker" = "tracker";
  if (lifecycleEvents?.length) {
    const f = funnelFromEvents(lifecycleEvents);
    if (f.any) {
      submitted = f.submitted;
      reachedInterview = f.interview;
      offers = f.offer;
      lifecycleSource = "events";
    }
  }

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
      { label: "Drafted", value: drafted },
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
    lifecycleSource,
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
  if (f === "drafted" && t === "applied")
    return { ok: true, reason: "Confirm you actually submitted this application. The original date is kept; submission is recorded as a separate event." };
  if (f === "drafted" && ["interview", "offer", "hired", "rejected", "no_response", "offer_declined"].includes(t))
    return { ok: true, reason: "Skipping Applied still requires confirming a real submission happened. The original date is kept." };
  return { ok: true };
}
