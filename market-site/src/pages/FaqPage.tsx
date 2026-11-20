import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaqSection } from "../components/FaqSection";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { PAGE_SEO } from "../lib/pages";
import { applySeo } from "../lib/seo";

export function FaqPage() {
  useEffect(() => { applySeo(PAGE_SEO.faq); }, []);

  return (
    <>
      <SiteHeader active="faq" ghostCta={{ to: "/benchmarks", label: "Our evidence" }} />
      <main>
        <section className="band band-hero page-hero marketing-page-intro">
          <div className="section-head reveal">
            <p className="kicker">No hidden surprises</p>
            <h1>Questions before <em>you get started?</em></h1>
            <p className="lede">
              The honest answers — including what is working today, which features need an AI provider,
              and what is still on the roadmap.
            </p>
          </div>
        </section>
        <FaqSection />
        <section className="marketing-bottom-cta reveal">
          <p className="kicker">Start with the facts</p>
          <h2>Explore the project before you install.</h2>
          <div className="cta-row">
            <Link to="/download" className="btn btn-primary btn-lg">View downloads</Link>
            <Link to="/docs" className="btn btn-soft btn-lg">Read the setup guide</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
