import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { PAGE_SEO } from "../lib/pages";
import { applySeo } from "../lib/seo";
import { GITHUB_REPO } from "../lib/site";

const TESTS = [
  {
    id: "01",
    title: "Resume readability",
    signal: "Ground-truth field extraction",
    description: "Compare text, contact information, dates and section order extracted from PDF/DOCX resumes with consented or synthetic ground-truth documents.",
    guardrail: "Report errors by file type and layout — never imply one parser represents every employer ATS.",
  },
  {
    id: "02",
    title: "Requirement matching",
    signal: "Evidence-backed coverage",
    description: "Trace mandatory and optional job criteria to passages in the job posting and to candidate-confirmed experience, noting unsupported or missing evidence.",
    guardrail: "Do not turn a similarity score into a probability of getting an interview.",
  },
  {
    id: "03",
    title: "Claim integrity",
    signal: "Unsupported statement rate",
    description: "Compare a generated resume with verified candidate facts. Check employment dates, titles, achievements, education and work authorization.",
    guardrail: "Unsupported claims must be flagged for human review; never invent experience or metrics.",
  },
  {
    id: "04",
    title: "Recruiter outcomes",
    signal: "Verified screens per 100 eligible applications",
    description: "With explicit opt-in, compare recruiter-screen outcomes across comparable applications within a defined observation window, accounting for job fit, timing and referral sources.",
    guardrail: "Do not publish uplift claims without sufficient evidence, uncertainty estimates and a transparent methodology.",
  },
] as const;

export function BenchmarksPage() {
  useEffect(() => { applySeo(PAGE_SEO.benchmarks); }, []);

  return (
    <>
      <SiteHeader active="benchmarks" ghostCta={{ to: "/faq", label: "FAQs" }} />
      <main>
        <section className="band band-hero page-hero marketing-page-intro">
          <div className="section-head reveal">
            <p className="kicker">ATS evidence lab</p>
            <h1>Trust the method. <em>Not a magic score.</em></h1>
            <p className="lede">
              We are designing an open, reproducible way to evaluate resume readability,
              job relevance, claim integrity and real recruiter responses.
            </p>
            <span className="status-pill status-pill--planned">Benchmark results: not yet published</span>
          </div>
          <div className="benchmark-notice reveal" role="note">
            <strong>No invented success rates.</strong>
            <p>
              There is no single ATS algorithm to defeat, and we have not published an independently validated
              ATS pass rate or interview-rate improvement for this app. The checks below describe a proposed
              test program, not completed product results.
            </p>
          </div>
        </section>
        <section className="band band-tight">
          <div className="section-head reveal">
            <p className="kicker">Our proposed evaluation protocol</p>
            <h2>Four checks. <em>Results you can inspect.</em></h2>
          </div>
          <div className="evidence-grid">
            {TESTS.map((test) => (
              <article className="evidence-card reveal" key={test.id}>
                <span className="evidence-index mono">{test.id} / planned</span>
                <h3>{test.title}</h3>
                <p className="evidence-signal">{test.signal}</p>
                <p>{test.description}</p>
                <p className="evidence-caveat"><strong>Guardrail:</strong> {test.guardrail}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="band band-tight">
          <div className="section-head reveal">
            <p className="kicker">Publication standards</p>
            <h2>What we'll publish <em>before any performance claim.</em></h2>
          </div>
          <div className="table-wrap reveal">
            <table className="data-table benchmark-table">
              <thead><tr><th>Evidence</th><th>What readers will be able to verify</th><th>Current status</th></tr></thead>
              <tbody>
                <tr><td>Parsing fixtures</td><td>Document types, ground-truth fields, observed misses and repeatable extraction tests</td><td>Planned</td></tr>
                <tr><td>Fit judgments</td><td>Requirement-level agreement with independent human reviewers and error categories</td><td>Planned</td></tr>
                <tr><td>Truthfulness tests</td><td>Regression fixtures for unsupported claims and final-file content loss</td><td>Planned</td></tr>
                <tr><td>Recruiter conversion</td><td>Consent-based cohorts, sample sizes, follow-up periods, uncertainty and important confounders</td><td>Not collected</td></tr>
              </tbody>
            </table>
          </div>
          <p className="marketing-footnote">
            Any future benchmark results will be dated, scoped to the versions and tools tested, and
            distinguished from employer-controlled ATS configurations.
          </p>
        </section>
        <section className="marketing-bottom-cta reveal">
          <p className="kicker">Help make this measurable</p>
          <h2>Open source means the methodology can be challenged.</h2>
          <p>
            Follow development, suggest representative test cases, or help review the benchmark design.
            Never publish private resumes or recruiter messages without permission.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary btn-lg" href={GITHUB_REPO + "/discussions"} rel="noopener">Join the discussion</a>
            <Link className="btn btn-soft btn-lg" to="/features">Explore current features</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
