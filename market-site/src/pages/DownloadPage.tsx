import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppChrome } from "../components/AppChrome";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { applySeo } from "../lib/seo";
import { GITHUB_REPO } from "../lib/site";

export function DownloadPage() {
  const { hash } = useLocation();

  useEffect(() => {
    applySeo({
      title: "Download — AI Job Search",
      description:
        "Build the local-first macOS Apple Silicon app from source. Claude Code required. No published release binary yet.",
      path: "/download",
    });
  }, []);

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  return (
    <>
      <SiteHeader active="download" ghostCta={{ to: "/features", label: "Features" }} />
      <main>
        <section className="band band-hero" id="macos">
          <div className="split">
            <div className="panel reveal" data-tone="sky" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  Look across my open roles, draft a tailored CV, and update the tracker when I approve.
                </div>
                <AppChrome chips={["Today", "Pipeline", "Studio"]} />
              </div>
            </div>

            <div className="stack reveal reveal-delay-1">
              <h1>Install AI Job Search</h1>
              <p className="lede">
                Build the local-first macOS Apple Silicon app from source. Discover, rank, prepare tailored
                documents, and track outcomes with Claude Code — without auto-submitting applications to
                employers.
              </p>
              <p className="lede">
                <strong>No published GitHub Release binary yet.</strong> Clone the repo, build the Apple
                Silicon client, and point it at your upstream workspace. Unsigned personal builds may need
                right-click → Open the first time.
              </p>
              <div className="cta-row">
                <a
                  className="btn btn-primary btn-lg btn-icon"
                  href={`${GITHUB_REPO}#installation-macos-apple-silicon`}
                  rel="noopener"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8.1 1.2a.75.75 0 0 0-1.2 0L3.2 6.1a.75.75 0 0 0 .6 1.2h1.7v5.2c0 .4.3.75.75.75h3.5c.4 0 .75-.35.75-.75V7.3h1.7a.75.75 0 0 0 .6-1.2L8.1 1.2Z" />
                    <path d="M2.5 14.25c0-.4.35-.75.75-.75h9.5c.4 0 .75.35.75.75s-.35.75-.75.75H3.25a.75.75 0 0 1-.75-.75Z" />
                  </svg>
                  Build from source
                </a>
                <Link className="btn btn-soft btn-lg" to="/docs/install">
                  Install docs
                </Link>
              </div>
              <div className="platform-row">
                <div className="platform-card">
                  <strong>Apple Silicon</strong>
                  <span>Developed client · apps/macos-apple-silicon</span>
                </div>
                <div className="platform-card">
                  <strong>Intel Mac</strong>
                  <span>Source port · no release artifact</span>
                </div>
                <div className="platform-card">
                  <strong>Windows</strong>
                  <span>Source port · no release artifact</span>
                </div>
                <div className="platform-card">
                  <strong>Web</strong>
                  <span>UI demo only · localStorage</span>
                </div>
              </div>
              <p className="fine-print">
                When release binaries exist they will appear on{" "}
                <a href={`${GITHUB_REPO}/releases`} rel="noopener">
                  GitHub Releases
                </a>
                . Until then, install by building from source.
              </p>
            </div>
          </div>
        </section>

        <section className="band band-tight" id="requirements">
          <div className="split reverse">
            <div className="panel reveal" data-tone="amber" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  Check Claude Code, Python, and LaTeX from Settings → Dependencies before your first run.
                </div>
                <AppChrome chips={["Settings", "Dependencies"]} sideStrongIndex={2} sideCount={3} />
              </div>
            </div>

            <div className="stack reveal reveal-delay-1">
              <h2>What you need on the Mac</h2>
              <p className="lede">
                The app is a shell. Claude Code and your upstream workspace do the real work.
              </p>
              <ul className="req-list">
                <li>
                  <span>
                    <strong>Claude Code CLI</strong>, signed in — runs every AI workflow (uses your Claude
                    plan or API credits).
                  </span>
                </li>
                <li>
                  <span>
                    <strong>Python ≥ 3.10</strong> for upstream tools (Homebrew <code>python@3.12</code>{" "}
                    recommended).
                  </span>
                </li>
                <li>
                  <span>
                    <strong>BasicTeX</strong> (LuaLaTeX / XeLaTeX) to compile CV and cover-letter PDFs.
                  </span>
                </li>
                <li>
                  <span>
                    <strong>ai-job-search workspace</strong> checked out locally — the unmodified upstream
                    source of truth.
                  </span>
                </li>
              </ul>
              <p className="fine-print">
                Optional: poppler for ATS text checks; Bun only if you install community portal CLIs.
              </p>
            </div>
          </div>
        </section>

        <section className="band band-tight" id="source">
          <div className="split">
            <div className="panel reveal" data-tone="mint" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  npm install → npm test → npm run tauri build → open the .app bundle.
                </div>
                <AppChrome chips={["Build", "Release"]} sideCount={2} />
              </div>
            </div>

            <div className="stack reveal reveal-delay-1">
              <h2>Build from source</h2>
              <p className="lede">
                Prefer compiling locally? Clone the desktop app, install dependencies, and produce an
                unsigned <code>.app</code> with Tauri.
              </p>
              <div className="cta-row">
                <a className="btn btn-soft btn-lg" href={GITHUB_REPO} rel="noopener">
                  View repository
                </a>
                <Link className="text-link" to="/features">
                  Explore features
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
              <p className="fine-print">
                Typical flow: <code>npm install</code>, <code>npm test</code>,{" "}
                <code>npm run tauri build</code>. Drag the app to <code>/Applications</code> when ready.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter note="Personal macOS build · Not affiliated with OpenAI" />
    </>
  );
}
