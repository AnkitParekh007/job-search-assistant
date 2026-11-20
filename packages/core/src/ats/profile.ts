import type { CandidateFact, CandidateProfile } from "./types";

export function emptyProfile(): CandidateProfile {
  return {
    schema_version: 1,
    name: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    workAuthorization: "unknown",
    preferences: { countries: [], remote: null },
    facts: [],
    updatedAt: new Date(0).toISOString(),
  };
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const IDENTITY = ["name", "headline", "email", "phone", "location"] as const;

/**
 * Upsert a fact by id, or by field+value. A confirmed fact is never replaced by an
 * unconfirmed one; a confirmed incoming fact always wins. Confirmed identity facts
 * fill empty top-level profile fields (never overwrite user-entered values).
 */
export function mergeFact(profile: CandidateProfile, fact: CandidateFact): CandidateProfile {
  const idx = profile.facts.findIndex(
    (f) => f.id === fact.id || (f.field === fact.field && norm(f.value) === norm(fact.value)),
  );
  let facts: CandidateFact[];
  if (idx === -1) {
    facts = [...profile.facts, fact];
  } else {
    const existing = profile.facts[idx];
    let winner: CandidateFact;
    if (existing.confirmed && !fact.confirmed) winner = existing;
    else if (fact.confirmed && !existing.confirmed) winner = { ...fact, id: existing.id };
    else if (fact.confirmed === existing.confirmed) winner = fact.confidence >= existing.confidence || fact.source === "user" ? { ...fact, id: existing.id } : existing;
    else winner = existing;
    facts = profile.facts.map((f, i) => (i === idx ? winner : f));
  }
  const next: CandidateProfile = { ...profile, facts };
  if (fact.confirmed && (IDENTITY as readonly string[]).includes(fact.field)) {
    const key = fact.field as (typeof IDENTITY)[number];
    if (!next[key]) next[key] = fact.value;
  }
  return next;
}
