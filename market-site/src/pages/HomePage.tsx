import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AppChrome } from "../components/AppChrome";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { PAGE_SEO } from "../lib/pages";
import { applySeo } from "../lib/seo";

export function HomePage() {
  useEffect(() => {
    applySeo(PAGE_SEO.home);
  }, []);

  return (
    <>
      <SiteHeader active="about" ghostCta={{ to: "/features", label: "Explore features" }} />
      <main>
        <section className="band band-hero">
          <div className="split">
            <div className="panel reveal" data-tone="sky" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  Find roles that fit, draft tailored applications, and keep every outcome on your Mac —
                  not in someone else’s cloud.
                </div>
                <AppChrome />
              </div>
            </div>

            <div className="stack wide reveal reveal-delay-1">
              <p className="kicker">Product</p>
              <h1>A desktop command center for your job search</h1>
              <p className="lede">
                AI Job Search is a local-first macOS app that drives your existing <em>ai-job-search</em>{" "}
                workspace with <strong>multi-provider AI support</strong> (Claude Code or OpenAI Codex) — so
                discovery, ranking, applications, and tracking stay on files you own.
              </p>
              <p className="lede">
                No reimplemented agents in the cloud. Your chosen provider CLI runs the real upstream
                workflows. The app is the native shell.
              </p>
              <div className="cta-row">
                <Link className="btn btn-primary btn-lg" to="/download">
                  Build for macOS
                </Link>
                <Link className="text-link" to="/features">
                  See what it can do
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="story-strip">
          <div className="stats">
            <div className="stat reveal">
              <strong>Local-first</strong>
              <span>
                Tracker, archives, and documents live in your workspace — the app never becomes the source
                of truth.
              </span>
            </div>
            <div className="stat reveal reveal-delay-1">
              <strong>14 workflows</strong>
              <span>
                From scrape and rank to apply, interview prep, Gmail sync, and HTML reports — all upstream
                commands.
              </span>
            </div>
            <div className="stat reveal reveal-delay-2">
              <strong>macOS native</strong>
              <span>
                Built with Tauri 2: a focused React UI over a Rust bridge that supervises multi-provider AI
                runs.
              </span>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="split reverse">
            <div className="panel reveal" data-tone="mint" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  “Draft a CV and cover letter for this posting, compile the PDFs, and queue the tracker when
                  I approve.”
                </div>
                <AppChrome chips={["Studio", "Awaiting approval"]} sideStrongIndex={1} sideCount={3} />
              </div>
            </div>

            <div className="stack reveal reveal-delay-1">
              <p className="kicker">How it works</p>
              <h2>You stay in control. Your AI provider does the heavy lifting.</h2>
              <p className="lede">
                Point the app at your workspace, pick Claude Code or Codex in Settings, and launch workflows
                from a clear pipeline: discover → rank → apply → outcome.
              </p>
              <p className="lede">
                Sensitive actions ask for approval. Write and exec tools are never auto-approved.
                Credentials stay with your provider CLI — not inside the app.
              </p>
              <div className="cta-row">
                <Link className="btn btn-soft btn-lg" to="/features">
                  Browse features
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="prose-block reveal">
          <h2>Built for people who already take the search seriously</h2>
          <p className="lede">
            If you want a pretty chatbot that “applies for you” in a black box, this isn’t it. If you want a
            native shell over a real job-search system — with PDF CVs, a tracker CSV, interview packs, and
            agent activity you can see — you’re home.
          </p>
          <div className="cta-row" style={{ justifyContent: "center", marginTop: 28 }}>
            <Link className="btn btn-primary btn-lg" to="/download">
              Build the macOS app
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
