import { Link } from "react-router-dom";

const STEPS = [
  { number: "01", title: "Shortlist deliberately", description: "Bring your search into one visible workflow. Review match reasoning before investing time in an application." },
  { number: "02", title: "Prepare, then inspect", description: "Draft role-specific materials with a configured AI provider, review the generated files and check readable PDF text." },
  { number: "03", title: "Stay in control", description: "You decide whether to submit. Your files and application history remain in your local workspace." },
] as const;

export function CandidateValueSection() {
  return (
    <section className="band band-tight" id="why-it-matters">
      <div className="section-head reveal">
        <p className="kicker">For people behind every application</p>
        <h2>Less busywork. <em>More intentional applications.</em></h2>
        <p className="lede">
          A calm desktop workspace for candidates who want to search thoughtfully,
          understand the match and keep control of the final submission.
        </p>
      </div>
      <div className="marketing-steps">
        {STEPS.map((step) => (
          <article className="marketing-step reveal" key={step.number}>
            <span className="marketing-step-index mono">{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
      <div className="release-honesty reveal">
        <div>
          <p className="kicker">Available in the current app</p>
          <strong>Visual workflows, job views, Application Studio, document review, pipeline, and local workspace files.</strong>
          <p>Some discovery and drafting actions need configured external AI and tools.</p>
        </div>
        <div>
          <p className="kicker">Being developed</p>
          <strong>Complete offline candidate profile, manual application entry, native Scout help, and ATS Intelligence Lab.</strong>
          <p>These are roadmap items, not capabilities we claim are already shipped.</p>
        </div>
      </div>
    </section>
  );
}

export function ApproachSection() {
  return (
    <section className="band band-tight" id="approach">
      <div className="section-head reveal">
        <p className="kicker">Our approach</p>
        <h2>Not another <em>blind auto-apply button.</em></h2>
        <p className="lede">
          Bulk submission isn't our success metric. We prioritize transparent matching,
          useful drafts and candidate approval at the moment it matters.
        </p>
      </div>
      <div className="approach-grid">
        <article className="approach-card reveal">
          <span className="approach-label mono">Traditional search</span>
          <h3>Scattered tabs and spreadsheets</h3>
          <p>Flexible, but it is easy to lose the reason you saved a job, which version of a resume you used, or when to follow up.</p>
        </article>
        <article className="approach-card reveal reveal-delay-1">
          <span className="approach-label mono">Unsupervised automation</span>
          <h3>More submissions, less context</h3>
          <p>Hands-off tools may prioritize volume. Every candidate should still understand what personal information gets sent and when.</p>
        </article>
        <article className="approach-card approach-card--featured reveal reveal-delay-2">
          <span className="approach-label mono">Job Search Assistant</span>
          <h3>Prepare with AI. Apply on purpose.</h3>
          <p>See the steps, inspect the output, approve sensitive actions and decide when a real application is submitted.</p>
        </article>
      </div>
      <p className="marketing-footnote">
        These are workflow approaches, not a ranking or a claim about hiring outcomes.{" "}
        <Link to="/compare" className="marketing-inline-link">Compare published features of other tools.</Link>
      </p>
    </section>
  );
}

export function BenchmarksTeaser() {
  return (
    <section className="band band-tight" id="ats-evidence">
      <div className="benchmarks-teaser reveal">
        <div className="benchmarks-teaser-copy">
          <p className="kicker">ATS Intelligence Lab · In development</p>
          <h2>The proof should be <em>in the results.</em></h2>
          <p className="lede">
            We are designing a reproducible benchmark for resume parsing, requirement coverage,
            truthful tailoring and recruiter-screen outcomes. We won't call an invented 95/100
            score a 95% chance of getting a call.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary btn-lg" to="/benchmarks">Explore the benchmark plan</Link>
            <Link className="btn btn-ghost btn-lg" to="/faq">Read common questions</Link>
          </div>
        </div>
        <div className="proof-visual" aria-label="Benchmark measurements being designed; no results are yet published">
          <div className="proof-visual-head">
            <span className="mono">ATS_EVIDENCE / ROADMAP</span>
            <span className="status-pill status-pill--planned">No measured uplift yet</span>
          </div>
          {[
            ["Resume extraction", "Protocol planned"],
            ["Verified requirements", "Protocol planned"],
            ["Truthful claims", "Protocol planned"],
            ["Recruiter screens", "Not collected"],
          ].map(([name, state], i) => (
            <div className="proof-visual-row" key={name}>
              <span className="proof-visual-number mono">0{i + 1}</span>
              <strong>{name}</strong>
              <span>{state}</span>
            </div>
          ))}
          <p>Every future result will include a method, sample size, date and limitations.</p>
        </div>
      </div>
    </section>
  );
}
