import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AppChrome } from "../components/AppChrome";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import featuresData from "../../public/assets/data/features.json";
import { PAGE_SEO } from "../lib/pages";
import { applySeo } from "../lib/seo";

type Feature = { id?: string; title: string; blurb: string; group?: string };
type Workflow = { command: string; title: string; stage: string; blurb: string };

// Bundled at build time so the page prerenders with real content and never
// swaps cards after load. Regenerate with `npm run build:features`.
const product = (featuresData.product ?? []) as Feature[];
const workflows = (featuresData.workflows ?? []) as Workflow[];

export function FeaturesPage() {
  useEffect(() => {
    applySeo(PAGE_SEO.features);
  }, []);

  return (
    <>
      <SiteHeader
        active="features"
        ghostCta={{ to: "/", label: "About" }}
        primaryCta={{ to: "/download", label: "Download" }}
      />
      <main>
        <section className="band band-hero">
          <div className="section-head reveal">
            <p className="kicker">Features</p>
            <h1>Everything you need to run the search end to end</h1>
            <p className="lede">
              One native surface for discovery, ranking, drafting, tracking, and prep — each action mapped
              to a real upstream slash command.
            </p>
          </div>

          <div className="feature-grid">
            {product.map((f, i) => (
              <article
                key={f.id ?? f.title}
                className={`feature-card reveal${i % 3 === 1 ? " reveal-delay-1" : i % 3 === 2 ? " reveal-delay-2" : ""}`}
              >
                {f.group ? <p className="feature-kicker">{f.group}</p> : null}
                <h3>{f.title}</h3>
                <p>{f.blurb}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="band band-tight">
          <div className="split">
            <div className="panel reveal" data-tone="amber" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  Look across new postings, score them against my profile, and shortlist the ones worth
                  drafting.
                </div>
                <AppChrome chips={["Jobs", "Ranked"]} sideStrongIndex={1} sideCount={3} />
              </div>
            </div>
            <div className="stack reveal reveal-delay-1">
              <p className="kicker">Find</p>
              <h2>Discover and rank without losing the thread</h2>
              <p className="lede">
                Start from Today, scan Jobs with visible compare controls, and keep ranking honest —
                failed runs never pretend they finished.
              </p>
              <p className="lede">
                Seen jobs and tracker CSV stay in the upstream workspace so other tools and reports keep
                working.
              </p>
            </div>
          </div>
        </section>

        <section className="band band-tight">
          <div className="split reverse">
            <div className="panel reveal" data-tone="violet" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  Draft the application, compile the PDFs, and pause for my approval before anything is
                  marked sent.
                </div>
                <AppChrome chips={["Studio", "Documents"]} sideStrongIndex={2} sideCount={3} />
              </div>
            </div>
            <div className="stack reveal reveal-delay-1">
              <p className="kicker">Apply</p>
              <h2>Studio drafts. You approve. Files stay local.</h2>
              <p className="lede">
                Application Studio wraps the upstream apply loop with a truthful stage tracker, sticky
                retry/resume when a run fails, and PDF compile when a TeX source is ready.
              </p>
              <p className="lede">
                Documents, Pipeline, and Interview Prep keep the rest of the apply → outcome path in one
                place.
              </p>
            </div>
          </div>
        </section>

        <section className="band band-tight">
          <div className="split">
            <div className="panel reveal" data-tone="mint" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  Sync Gmail for status proposals, push ranked jobs to Notion, and generate an offline HTML
                  report.
                </div>
                <AppChrome chips={["Workflows", "Gmail", "Notion"]} sideStrongIndex={0} sideCount={2} />
              </div>
            </div>
            <div className="stack reveal reveal-delay-1">
              <p className="kicker">Automate</p>
              <h2>Workflows you can see — and stop</h2>
              <p className="lede">
                Launch any catalogued command from Automations. Live badges only count active runs.
                Terminal failures clear from the live map so the UI stays honest.
              </p>
              <p className="lede">
                Optional connectors (Gmail, Notion) propose changes; local files remain authoritative.
              </p>
              <div className="cta-row">
                <Link className="btn btn-primary btn-lg" to="/download">
                  Download for macOS
                </Link>
              </div>
            </div>
          </div>
        </section>

        {workflows.length > 0 ? (
          <section className="band" id="core-workflows">
            <div className="section-head reveal">
              <p className="kicker">Workflows</p>
              <h2>Live catalog from shared core</h2>
              <p className="lede">
                Generated from <code>packages/core</code> so marketing stays in lockstep with every client.
              </p>
            </div>
            <div className="table-wrap reveal">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Command</th>
                    <th>Title</th>
                    <th>Stage</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((w) => (
                    <tr key={w.command}>
                      <td>
                        <code>{w.command}</code>
                      </td>
                      <td>{w.title}</td>
                      <td>{w.stage}</td>
                      <td>{w.blurb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter note="Personal macOS build · Not affiliated with Anthropic or OpenAI" />
    </>
  );
}
