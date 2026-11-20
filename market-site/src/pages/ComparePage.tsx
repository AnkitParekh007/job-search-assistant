import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { PAGE_SEO } from "../lib/pages";
import { applySeo } from "../lib/seo";

const SOURCES = [
  { name: "Ronin", url: "https://roninapply.com/#features" },
  { name: "Finds You Jobs", url: "https://findsyoujobs.com/" },
  { name: "JobSifter", url: "https://jobsifter.eu/" },
] as const;

const ROWS = [
  {
    title: "Main focus",
    values: [
      "Review-first discovery, fit ranking, drafts and application pipeline",
      "On-device discovery, browser auto-fill and automatic application submission",
      "Job discovery, scoring, resume tailoring, outreach and tracking",
      "Job matching, resume analysis and personalized cover letters",
    ],
  },
  {
    title: "Who submits?",
    values: [
      "The candidate. No silent application submission.",
      "The app offers automated submission.",
      "The candidate reviews and submits applications.",
      "Automatic application submission is not advertised on its home page.",
    ],
  },
  {
    title: "AI and data model",
    values: [
      "Local workspace with optional provider-backed workflows; cloud providers may receive data.",
      "On-device AI by default, optional external providers.",
      "Local data; own API key or local model option.",
      "Desktop-local data; optional external AI provider usage.",
    ],
  },
  {
    title: "Software licensing",
    values: [
      "MIT — open source",
      "Commercial purchase / free trial as advertised",
      "AGPL-3.0 — open source",
      "GPL-3.0 — open source",
    ],
  },
  {
    title: "Platform status",
    values: [
      "Apple Silicon is the primary desktop target; other clients require independent release verification.",
      "macOS Apple Silicon and Windows advertised",
      "macOS, Windows and Linux beta downloads advertised",
      "macOS and Windows downloads advertised",
    ],
  },
] as const;

export function ComparePage() {
  useEffect(() => { applySeo(PAGE_SEO.compare); }, []);

  return (
    <>
      <SiteHeader ghostCta={{ to: "/benchmarks", label: "Benchmarks" }} />
      <main>
        <section className="band band-hero page-hero marketing-page-intro">
          <div className="section-head reveal">
            <p className="kicker">Choose what fits your search</p>
            <h1>More choice. <em>Fewer surprises.</em></h1>
            <p className="lede">
              Different job-search tools make different trade-offs. Here's a sourced feature overview
              so you can choose a workflow that respects your preferences.
            </p>
          </div>
          <div className="benchmark-notice reveal">
            <strong>Comparison method</strong>
            <p>
              Based on public product descriptions reviewed on 21 November 2026. We have not
              independently tested competitors or verified their marketing claims. Capabilities
              and prices may change; consult each provider before making a decision.
            </p>
          </div>
        </section>
        <section className="band band-tight">
          <div className="table-wrap reveal">
            <table className="data-table competitor-table">
              <caption className="sr-only">
                Publicly described features of Job Search Assistant, Ronin, Finds You Jobs and JobSifter
              </caption>
              <thead>
                <tr>
                  <th scope="col">Criterion</th>
                  <th scope="col">Job Search Assistant</th>
                  <th scope="col">Ronin</th>
                  <th scope="col">Finds You Jobs</th>
                  <th scope="col">JobSifter</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.title}>
                    <th scope="row">{row.title}</th>
                    {row.values.map((value, i) => <td key={i}>{value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="marketing-footnote">
            This table describes published workflow claims — not a measured ranking, test result
            or endorsement of competing products.
          </p>
        </section>
        <section className="band band-tight">
          <div className="section-head reveal">
            <p className="kicker">Source transparency</p>
            <h2>Check the <em>original descriptions.</em></h2>
            <p className="lede">We link directly to each product's published feature list.</p>
          </div>
          <div className="marketing-source-links reveal">
            {SOURCES.map((source) => (
              <a key={source.name} href={source.url} rel="noopener noreferrer" target="_blank">
                {source.name} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>
        <section className="marketing-bottom-cta reveal">
          <p className="kicker">Our principle</p>
          <h2>Keep the candidate in control.</h2>
          <p>
            Prepare with the tools you choose. Review the evidence. Submit only when you're ready.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary btn-lg" to="/download">Explore downloads</Link>
            <Link className="btn btn-soft btn-lg" to="/faq">Read FAQs</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
