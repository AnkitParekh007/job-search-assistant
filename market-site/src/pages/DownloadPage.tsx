import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppChrome } from "../components/AppChrome";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { PAGE_SEO } from "../lib/pages";
import { applySeo } from "../lib/seo";
import {
  PLATFORM_DOWNLOADS,
  RELEASE_TAG,
  RELEASE_TAG_URL,
  RELEASES_PAGE,
  releaseAssetUrl,
  type PlatformDownload,
} from "../lib/releases";
import { GITHUB_REPO } from "../lib/site";

function PlatformIcon({ id }: { id: PlatformDownload["id"] }) {
  if (id === "windows") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 5.5 10.5 4.4v7.1H3V5.5Zm0 13 7.5 1.1v-7.2H3v6.1ZM11.7 4.2 21 3v8.5h-9.3V4.2Zm0 16.6L21 21.9V12.5h-9.3v8.3Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.5 3.2c-.9.1-2 .7-2.6 1.5-.6.7-1.1 1.9-.9 3 .9.1 2-.5 2.6-1.3.6-.8 1.1-1.9.9-3.2ZM19.2 20.8c-1.1 1.1-2.2 1.7-3.2 1.7-1 0-1.4-.4-2.8-.4s-1.8.4-2.8.4c-1.1 0-2.3-.7-3.4-1.9-1.6-1.8-2.8-5.1-1.8-7.9.7-1.9 2.3-3.1 4-3.1 1.1 0 2.1.7 2.8.7.7 0 1.9-.8 3.2-.7 1.3.1 2.4.7 3.1 1.8-2.7 1.5-2.3 5.5.5 6.7-.5 1.3-1.2 2.6-1.6 3.7Z" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8.1 1.2a.75.75 0 0 0-1.2 0L3.2 6.1a.75.75 0 0 0 .6 1.2h1.7v5.2c0 .4.3.75.75.75h3.5c.4 0 .75-.35.75-.75V7.3h1.7a.75.75 0 0 0 .6-1.2L8.1 1.2Z" />
      <path d="M2.5 14.25c0-.4.35-.75.75-.75h9.5c.4 0 .75.35.75.75s-.35.75-.75.75H3.25a.75.75 0 0 1-.75-.75Z" />
    </svg>
  );
}

export function DownloadPage() {
  const { hash } = useLocation();
  const primary = PLATFORM_DOWNLOADS.find((p) => p.kind === "native" && p.asset) ?? PLATFORM_DOWNLOADS[0];
  const primaryUrl =
    primary.kind === "native" && primary.asset ? releaseAssetUrl(primary.asset) : "/docs/install";

  useEffect(() => {
    applySeo({
      title: "Download — Job Search Assistant",
      description: PAGE_SEO.download.description,
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
        <section className="band band-hero download-hero" id="macos">
          <div className="split">
            <div className="panel reveal" data-tone="sky" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  Look across my open roles, draft a tailored CV, and update the tracker when I approve.
                </div>
                <AppChrome chips={["Today", "Pipeline", "Studio"]} />
              </div>
            </div>

            <div className="stack wide reveal reveal-delay-1">
              <p className="kicker">Prepared release {RELEASE_TAG} · not published</p>
              <h1>Install Job Search Assistant</h1>
              <p className="lede">
                The desktop app helps you discover roles, prepare documents, and track applications on your own
                files. You submit every application yourself. AI workflows run only with a provider you configure.
              </p>
              <div className="cta-row">
                <a className="btn btn-primary btn-lg btn-icon" href={primaryUrl} rel="noopener">
                  <DownloadGlyph />
                  Download Apple Silicon v0.1.2
                </a>
                <Link className="btn btn-soft btn-lg" to="/docs/install">
                  Install docs
                </Link>
              </div>
              <p className="fine-print">
                The last published package is{" "}
                <a href={RELEASE_TAG_URL} rel="noopener">
                  v0.1.2
                </a>{" "}
                (<span className="font-mono">AI-Job-Search-0.1.2-macos-arm64.zip</span>). {RELEASE_TAG} is prepared
                in source and is not on{" "}
                <a href={RELEASES_PAGE} rel="noopener">
                  GitHub Releases
                </a>{" "}
                yet. The published app is ad-hoc signed and not notarized. First launch may need right-click → Open.
                Do not disable Gatekeeper or strip quarantine.
              </p>
              <p className="fine-print">
                <strong>Platform:</strong> the published download is macOS Apple Silicon only. Intel Mac and Windows
                are build-from-source. Linux is not a desktop release target. Auto-update is disabled. Local match
                uses confirmed facts only and is not a universal ATS pass rate, a named-employer guarantee, or a
                promise of interviews or job offers.
              </p>
            </div>
          </div>

          <div className="platform-download reveal reveal-delay-2" id="platforms">
            <div className="platform-download-head">
              <h2 className="platform-download-title">Choose your platform</h2>
              <p className="platform-download-copy">
                The only published native download is the Apple Silicon zip. Intel and Windows link to install docs.
                Source archives are not installers.
              </p>
            </div>
            <div className="platform-grid" role="list">
              {PLATFORM_DOWNLOADS.map((platform) => {
                const body = (
                  <>
                    <div className="platform-card-top">
                      <span className="platform-card-icon">
                        <PlatformIcon id={platform.id} />
                      </span>
                      <span className="platform-card-badge">{platform.badge}</span>
                    </div>
                    <div className="platform-card-body">
                      <strong>{platform.title}</strong>
                      <span>{platform.subtitle}</span>
                      {platform.note ? <em className="platform-card-note">{platform.note}</em> : null}
                    </div>
                    <span className="platform-card-cta">
                      <DownloadGlyph />
                      {platform.kind === "native" ? `Download ${RELEASE_TAG}` : "View install docs"}
                    </span>
                  </>
                );
                if (platform.kind === "native" && platform.asset) {
                  return (
                    <a
                      key={platform.id}
                      className="platform-card"
                      href={releaseAssetUrl(platform.asset)}
                      role="listitem"
                      download
                      rel="noopener"
                      aria-label={`Download ${platform.title} (${platform.asset})`}
                    >
                      {body}
                    </a>
                  );
                }
                return (
                  <Link
                    key={platform.id}
                    className="platform-card"
                    to={platform.docsPath ?? "/docs/install"}
                    role="listitem"
                    aria-label={`Build instructions for ${platform.title}`}
                  >
                    {body}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="band band-tight" id="requirements">
          <div className="split reverse">
            <div className="panel reveal" data-tone="amber" aria-hidden="true">
              <div className="panel-inner">
                <div className="quote-bubble">
                  Check your AI provider, Python, and LaTeX from Settings → Dependencies before your first
                  run.
                </div>
                <AppChrome chips={["Settings", "Dependencies"]} sideStrongIndex={2} sideCount={3} />
              </div>
            </div>

            <div className="stack reveal reveal-delay-1">
              <h2>What you need on the Mac</h2>
              <p className="lede">
                The app is a shell. Your AI provider and local workspace folder do the real work.
              </p>
              <ul className="req-list">
                <li>
                  <span>
                    <strong>Multi-provider AI support</strong> — Claude Code and/or OpenAI Codex signed in
                    (provider usage uses your plan or API credits).
                  </span>
                </li>
                <li>
                  <span>
                    <strong>Python ≥ 3.10</strong> for local tools (Homebrew <code>python@3.12</code>{" "}
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
                    <strong>A workspace folder</strong> on disk — any path; Jobzuu scaffolds starter files if
                    the folder is empty.
                  </span>
                </li>
              </ul>
              <p className="fine-print">
                Optional: poppler for ATS text checks; Bun only if you install portal CLIs that need it.
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
                Prefer compiling locally? Clone the desktop app, install dependencies, and produce a
                an ad-hoc signed <code>.app</code> with{" "}
                <code>./scripts/build-macos-apple-silicon-preview.sh</code> (not notarized).
              </p>
              <div className="cta-row">
                <a className="btn btn-soft btn-lg" href={GITHUB_REPO} rel="noopener">
                  View repository
                </a>
                <a className="btn btn-soft btn-lg" href={RELEASE_TAG_URL} rel="noopener">
                  Published v0.1.2
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
      <SiteFooter note="Personal macOS build · Not affiliated with Anthropic or OpenAI" />
    </>
  );
}
