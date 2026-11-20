import { useEffect, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import featuresData from "../../public/assets/data/features.json";
import { BrandMark } from "../components/BrandMark";
import { SignalField } from "../components/SignalField";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { StoryScroller } from "../components/StoryScroller";
import { FaqSection } from "../components/FaqSection";
import { ApproachSection, BenchmarksTeaser, CandidateValueSection } from "../components/MarketingSections";
import { PAGE_SEO } from "../lib/pages";
import { applySeo } from "../lib/seo";

const workflows = (featuresData.workflows ?? []) as { command: string; title: string }[];
const workflowCount = featuresData.count ?? workflows.length;

const WORKSPACE_FILES = ["tracker.csv", "profile.md", "cv_northwind.tex", "seen_jobs.json", "interview-pack.md"];

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Moves the bento spotlight with the pointer (purely decorative). */
function trackSpotlight(e: PointerEvent<HTMLElement>) {
  const card = (e.target as HTMLElement).closest<HTMLElement>(".bento-card");
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${e.clientX - r.left}px`);
  card.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function HomePage() {
  useEffect(() => {
    applySeo(PAGE_SEO.home);
  }, []);

  return (
    <>
      <SiteHeader active="about" ghostCta={{ to: "/features", label: "Explore features" }} />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow load-in" style={{ ["--d" as string]: 0 }}>
              <span className="eyebrow-dot" /> Local-first · macOS · Multi-provider AI
            </p>
            <h1 className="hero-title load-in" style={{ ["--d" as string]: 1 }}>
              Hundreds of postings.
              <br />
              One shortlist. <em>Your call.</em>
            </h1>
            <p className="lede load-in" style={{ ["--d" as string]: 2 }}>
              AI Job Search Assistant brings job discovery, fit assessment, application drafts and
              tracking into one desktop workspace. Configure a supported AI provider for advanced workflows,
              keep your files local, and stay in charge of what you submit.
            </p>
            <div className="cta-row load-in" style={{ ["--d" as string]: 3 }}>
              <Link className="btn btn-primary btn-lg" to="/download">
                Download for macOS
              </Link>
              <Link className="text-link" to="/docs">
                Read the docs
                <Arrow />
              </Link>
            </div>
          </div>
          <div className="hero-visual load-in" style={{ ["--d" as string]: 2 }}>
            <SignalField />
          </div>
        </section>

        <section className="ticker" aria-label={`${workflowCount} built-in workflows`}>
          <div className="ticker-track">
            {[0, 1].map((dup) => (
              <ul key={dup} aria-hidden={dup === 1 ? true : undefined}>
                {workflows.map((w) => (
                  <li key={w.command}>
                    <code>{w.command}</code>
                    <span>{w.title}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>

        <section className="band story-band">
          <div className="section-head reveal">
            <p className="kicker">How a search runs</p>
            <h2>
              Four stages, one loop, <em>zero black boxes.</em>
            </h2>
            <p className="lede">
              Point the app at your workspace and pick a provider in Settings. Each stage is a real workflow
              you can watch, pause, or stop.
            </p>
          </div>
          <StoryScroller />
        </section>

        <section className="band">
          <div className="section-head reveal">
            <p className="kicker">Built on principles</p>
            <h2>
              Your search, your machine, <em>your rules.</em>
            </h2>
          </div>

          <div className="bento" onPointerMove={trackSpotlight}>
            <article className="bento-card b-local reveal">
              <p className="kicker">Local-first</p>
              <h3>The workspace is the source of truth.</h3>
              <p>
                The tracker, archives, and documents live in plain files on your Mac. The app reads and writes
                them, and never replaces them.
              </p>
              <div className="rings" aria-hidden="true">
                <span className="ring r1" />
                <span className="ring r2" />
                <span className="ring r3" />
                <span className="rings-core mono">~/jobzuu-workspace</span>
                {WORKSPACE_FILES.map((f, i) => (
                  <span key={f} className="file-chip mono" style={{ ["--i" as string]: i }}>
                    {f}
                  </span>
                ))}
              </div>
            </article>

            <article className="bento-card b-gate reveal reveal-delay-1">
              <p className="kicker">Approval gate</p>
              <h3>Never auto-submits.</h3>
              <p>Write and exec tools always ask first. You approve, you send.</p>
              <div className="mini-gate" aria-hidden="true">
                <span className="mono">exec · latexmk cv.tex</span>
                <span className="switch" />
              </div>
            </article>

            <article className="bento-card b-provider reveal reveal-delay-2">
              <p className="kicker">Multi-provider</p>
              <h3>Bring your own AI.</h3>
              <p>
                Use supported AI runtimes for relevant workflows. Credentials are handled by provider
                tools or the OS credential store, depending on the integration.
              </p>
              <div className="provider-pair" aria-hidden="true">
                <span>Claude Code</span>
                <i />
                <span>OpenAI Codex</span>
              </div>
            </article>

            <article className="bento-card b-count reveal">
              <p className="big-num">
                {workflowCount}
                <span>workflows</span>
              </p>
              <p>From setup and scrape to Gmail sync, Notion sync, interview prep, and offline HTML reports.</p>
            </article>

            <article className="bento-card b-native reveal reveal-delay-1">
              <p className="kicker">Native shell</p>
              <h3>Tauri 2 + Rust.</h3>
              <p>A focused React UI over a Rust bridge that supervises every provider run and shows its live activity.</p>
              <div className="eq" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                  <i key={i} style={{ ["--i" as string]: i }} />
                ))}
              </div>
            </article>
          </div>
        </section>

        <CandidateValueSection />
        <ApproachSection />
        <BenchmarksTeaser />
        <FaqSection compact />

        <section className="finale reveal">
          <div className="finale-glow" aria-hidden="true" />
          <BrandMark size={72} animated className="finale-mark" />
          <h2>
            Built for people who already take <em>the search seriously.</em>
          </h2>
          <p className="lede">
            If you want a chatbot that applies for you in a black box, this isn’t it. If you want a native shell
            over a real job-search system, with PDF CVs, a tracker CSV, interview packs, and agent activity you
            can see, you’re home.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary btn-lg" to="/download">
              Download for macOS
            </Link>
            <Link className="btn btn-ghost btn-lg" to="/features">
              Browse features
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
