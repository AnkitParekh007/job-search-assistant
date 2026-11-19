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

const GLYPHS: Record<string, string> = {
  discover: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4",
  rank: "M5 19v-7M12 19V5M19 19v-10",
  studio: "M4 20l4-1L19 8l-3-3L5 16l-1 4ZM14 7l3 3",
  documents: "M7 3h7l5 5v13H7V3ZM14 3v5h5M10 13h6M10 17h4",
  pipeline: "M4 6h16M4 12h11M4 18h6",
  interview: "M5 5h14v10H10l-5 4V5Z",
  activity: "M3 12h4l3-7 4 14 3-7h4",
  "local-first": "M4 5h16v11H4V5ZM2 19h20",
};

function FeatureGlyph({ id }: { id?: string }) {
  return (
    <span className="feature-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d={GLYPHS[id ?? ""] ?? "M5 12h14M12 5v14"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

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
        <section className="band band-hero page-hero">
          <div className="section-head reveal">
            <p className="kicker">Features</p>
            <h1>
              Everything you need to run the search <em>end to end.</em>
            </h1>
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
                <FeatureGlyph id={f.id} />
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
              <h2>
                Live catalog from <em>shared core.</em>
              </h2>
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
