export type Span = { start: number; end: number };

export type CandidateFact = {
  id: string;
  field: string;
  value: string;
  source: "resume" | "user" | "inferred";
  confidence: number;
  confirmed: boolean;
  span?: Span;
};

export type CandidateProfile = {
  schema_version: number;
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  workAuthorization: string;
  preferences: {
    countries: string[];
    remote: boolean | null;
    salaryMin?: number;
    salaryMax?: number;
    seniority?: string[];
  };
  facts: CandidateFact[];
  updatedAt: string;
};

export type ParseDiagnostics = {
  pages?: number;
  chars: number;
  warnings: string[];
  missingSections: string[];
  /** Share of non-empty lines that produced a fact (0..1). */
  textCoverage?: number;
  /** Fields whose best fact confidence is below 0.6. */
  lowConfidenceFields?: string[];
};

export type JobRequirement = {
  id: string;
  text: string;
  kind: "must" | "nice";
  span?: Span;
};

export type MatchExplanation = {
  ok: boolean;
  score?: number;
  strengths: { factId: string; requirementId: string; note: string }[];
  gaps: { requirementId: string; note: string }[];
  refuseReason?: string;
};

export type ExportValidation = {
  ok: boolean;
  missing: string[];
  invented: string[];
  warnings: string[];
};
