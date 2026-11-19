import { Link } from "react-router-dom";
import { AppChrome } from "../../components/AppChrome";

function Pager({
  prev,
  next,
}: {
  prev?: { to: string; label: string };
  next?: { to: string; label: string };
}) {
  return (
    <nav className="docs-pager" aria-label="Pagination">
      {prev ? (
        <Link to={prev.to}>
          <span>Previous</span>
          <strong>← {prev.label}</strong>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="next" to={next.to}>
          <span>Next</span>
          <strong>{next.label} →</strong>
        </Link>
      ) : null}
    </nav>
  );
}

export function DocsOverview() {
  return (
    <>
      <section className="docs-hero reveal">
        <div className="docs-hero-copy">
          <h1>Overview</h1>
          <p className="lede">
            Start with a workspace and multi-provider AI support (Claude Code or OpenAI Codex). AI Job Search
            is the native macOS shell — discover, rank, apply, and track using upstream workflows on files you
            own.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary btn-lg" to="/docs/quickstart">
              Quickstart →
            </Link>
            <Link className="text-link" to="/docs/workflows">
              Browse workflows →
            </Link>
          </div>
        </div>
        <div className="docs-hero-visual" aria-hidden="true">
          <AppChrome chips={["Today", "Studio", "Pipeline"]} sideCount={3} />
        </div>
      </section>

      <article className="docs-article">
        <h2>What this product is</h2>
        <p>
          AI Job Search drives an unmodified <strong>ai-job-search</strong> checkout with multi-provider AI
          support. The desktop app never reimplements slash commands — it supervises runs, shows approvals,
          and mirrors tracker/documents state from disk.
        </p>

        <div className="docs-card-grid">
          <Link className="docs-card" to="/docs/install">
            <strong>Install</strong>
            <span>macOS app, AI providers, Python, and LaTeX.</span>
          </Link>
          <Link className="docs-card" to="/docs/first-run">
            <strong>First run</strong>
            <span>Pick a workspace, finish setup, check dependencies.</span>
          </Link>
          <Link className="docs-card" to="/docs/discover">
            <strong>Discover &amp; rank</strong>
            <span>Find roles and shortlist what fits.</span>
          </Link>
          <Link className="docs-card" to="/docs/apply">
            <strong>Apply</strong>
            <span>Draft in Studio, compile PDFs, stay in control.</span>
          </Link>
        </div>

        <div className="docs-callout">
          <strong>Local-first.</strong> Tracker CSV, seen jobs, archives, and tailored documents stay in your
          workspace. Credentials stay with your provider CLI — not inside the app.
        </div>
      </article>

      <Pager next={{ to: "/docs/quickstart", label: "Quickstart" }} />
    </>
  );
}

export function DocsQuickstart() {
  return (
    <>
      <article className="docs-article">
        <h1>Quickstart</h1>
        <p className="lede">Get from install to a shortlist in one sitting.</p>
        <ol className="docs-steps">
          <li>
            <div>
              <strong>Install the macOS app</strong>
              Download from Releases or build with <code>npm run tauri build</code>. First launch may need
              right-click → Open.
            </div>
          </li>
          <li>
            <div>
              <strong>Install an AI provider and sign in</strong>
              Claude Code (<code>brew install --cask claude-code</code>, then <code>claude</code>) and/or
              OpenAI Codex — then pick your default in Settings → AI Providers.
            </div>
          </li>
          <li>
            <div>
              <strong>Point at your workspace</strong>
              Onboarding asks for your <code>ai-job-search</code> checkout. Change it later in Settings.
            </div>
          </li>
          <li>
            <div>
              <strong>Check Dependencies</strong>
              Settings → Dependencies should show your provider, Python ≥ 3.10, and LaTeX ready for PDF
              compile.
            </div>
          </li>
          <li>
            <div>
              <strong>Run profile setup</strong>
              Import a CV or answer the guided interview via <code>/setup</code> from onboarding or Profile.
            </div>
          </li>
          <li>
            <div>
              <strong>Discover → Rank → Apply</strong>
              From Workflows or the Jobs screen: scrape new roles, rank them, then open Studio with a
              posting.
            </div>
          </li>
        </ol>
        <div className="docs-callout">
          <strong>Runs use provider credits.</strong> Every workflow uses your Claude or Codex plan / API
          credits. Nothing is submitted to employers for you.
        </div>
      </article>
      <Pager
        prev={{ to: "/docs", label: "Overview" }}
        next={{ to: "/docs/install", label: "Install" }}
      />
    </>
  );
}

export function DocsInstall() {
  return (
    <>
      <article className="docs-article">
        <h1>Install</h1>
        <p className="lede">What you need on the Mac before workflows can run.</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Need</th>
                <th>Why</th>
                <th>Install</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Multi-provider AI</strong>
                </td>
                <td>Claude Code and/or OpenAI Codex for workflows</td>
                <td>
                  Claude: <code>brew install --cask claude-code</code>; Codex: install CLI + Settings →
                  Connect
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Python ≥ 3.10</strong>
                </td>
                <td>Upstream tools</td>
                <td>
                  <code>brew install python@3.12</code>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>BasicTeX</strong>
                </td>
                <td>CV / cover-letter PDFs</td>
                <td>LuaLaTeX + XeLaTeX packages (see upstream SETUP)</td>
              </tr>
              <tr>
                <td>
                  <strong>poppler</strong> (optional)
                </td>
                <td>ATS text check</td>
                <td>
                  <code>brew install poppler</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <h2>App install</h2>
        <p>
          There is no published GitHub Release binary yet. Build locally with Tauri, then open the{" "}
          <code>.app</code>. Drag it to <code>/Applications</code> if you want it to stay. Personal builds
          are typically unsigned — first launch may need right-click → Open.
        </p>
        <h2>Build from source</h2>
        <pre className="docs-pre">{`cd apps/macos-apple-silicon
npm install
npm test
npm run tauri build
open "src-tauri/target/release/bundle/macos/AI Job Search.app"`}</pre>
        <p>
          The bundle lands under <code>src-tauri/target/release/bundle/macos/</code>. Full guide: repository{" "}
          <code>docs/installation.md</code>.
        </p>
      </article>
      <Pager
        prev={{ to: "/docs/quickstart", label: "Quickstart" }}
        next={{ to: "/docs/first-run", label: "First run" }}
      />
    </>
  );
}

export function DocsFirstRun() {
  return (
    <>
      <article className="docs-article">
        <h1>First run</h1>
        <p className="lede">Workspace, profile setup, and dependency health.</p>
        <h2>Choose a workspace</h2>
        <p>
          The app needs a local <strong>ai-job-search</strong> checkout. Onboarding detects a default path
          or lets you pick another folder. Settings → Workspace can change it later and reveal it in Finder.
        </p>
        <h2>Complete profile setup</h2>
        <p>
          Use <code>/setup</code> to import a CV, point at a documents folder, or answer a short interview.
          You can re-run sections:
        </p>
        <ul>
          <li>
            <code>/setup --section skills</code>
          </li>
          <li>
            <code>/setup --section experience</code>
          </li>
          <li>
            <code>/setup --section search</code>
          </li>
        </ul>
        <h2>Verify dependencies</h2>
        <p>
          Open Settings → Dependencies and click Re-check. Fix anything red before scraping or drafting —
          especially provider sign-in and LaTeX for PDFs.
        </p>
        <div className="docs-callout">
          <strong>Skip is allowed.</strong> You can skip setup and fill Profile later, but ranking and apply
          quality depend on a grounded profile.
        </div>
      </article>
      <Pager
        prev={{ to: "/docs/install", label: "Install" }}
        next={{ to: "/docs/discover", label: "Discover & rank" }}
      />
    </>
  );
}

export function DocsDiscover() {
  return (
    <>
      <article className="docs-article">
        <h1>Discover &amp; rank</h1>
        <p className="lede">Find new roles, dedupe them locally, then score what fits.</p>
        <h2>Discover jobs</h2>
        <p>
          Run <strong>Discover jobs</strong> (<code>/scrape</code>) from Workflows or Jobs. It uses
          installed portal CLIs when available, otherwise web search, and writes to{" "}
          <code>job_scraper/seen_jobs.json</code>.
        </p>
        <p>
          Optional focus argument examples: a specialty, <code>broad</code>, or <code>health</code>.
        </p>
        <h2>Rank matches</h2>
        <p>
          Run <strong>Rank matches</strong> (<code>/rank</code>). Upstream fetches postings, runs the
          integrity gate, scores against your profile rubric, and returns a shortlist in the same local
          store.
        </p>
        <h2>Review in Jobs</h2>
        <ul>
          <li>Filter and compare roles in the Jobs screen.</li>
          <li>Open a posting into Studio when you want tailored documents.</li>
          <li>Watch Agent Activity while a scrape or rank run is live.</li>
        </ul>
        <div className="docs-callout">
          <strong>Failed runs stay honest.</strong> Terminal failures clear from the live badge and show
          retry/resume actions instead of fake progress.
        </div>
      </article>
      <Pager
        prev={{ to: "/docs/first-run", label: "First run" }}
        next={{ to: "/docs/apply", label: "Application Studio" }}
      />
    </>
  );
}

export function DocsApply() {
  return (
    <>
      <article className="docs-article">
        <h1>Application Studio</h1>
        <p className="lede">Draft tailored CVs and cover letters with approval gates.</p>
        <h2>Start from a posting</h2>
        <p>
          Open Studio and paste a job URL or posting text. That starts <code>/apply</code>: evaluate fit
          first, ask before drafting, then compile and verify PDFs.
        </p>
        <h2>What gets written</h2>
        <ul>
          <li>CV and cover-letter sources under the workspace</li>
          <li>Compiled PDFs when LaTeX is available</li>
          <li>Tracker row marked drafted (not submitted)</li>
          <li>
            Application archive under <code>documents/applications/</code>
          </li>
        </ul>
        <h2>Approvals</h2>
        <p>
          Write and exec tool calls pause for your click. If a run fails, use <strong>Retry fresh</strong> or{" "}
          <strong>Resume session</strong> from the console banner. Studio never marks an application as
          applied just because documents were generated.
        </p>
        <div className="docs-callout">
          <strong>Documents screen</strong> shows real sources in the workspace. Use Compile when a{" "}
          <code>.tex</code> file is ready but not yet rendered.
        </div>
      </article>
      <Pager
        prev={{ to: "/docs/discover", label: "Discover & rank" }}
        next={{ to: "/docs/track", label: "Track & prep" }}
      />
    </>
  );
}

export function DocsTrack() {
  return (
    <>
      <article className="docs-article">
        <h1>Track &amp; prep</h1>
        <p className="lede">Pipeline outcomes, interview packs, and optional inbox sync.</p>
        <h2>Pipeline</h2>
        <p>
          Use Pipeline to move applications through statuses. Record outcomes with <code>/outcome</code> —
          it archives what was sent and can draft follow-ups, but never sends email for you.
        </p>
        <h2>Interview prep</h2>
        <p>
          Open Interview Prep and run <code>/interview</code> for a tracked company. You get a
          stage-specific pack from the archived posting and your documents, with optional roleplay.
        </p>
        <h2>Optional sync</h2>
        <ul>
          <li>
            <strong>Gmail sync</strong> — proposes status changes from application mail (Claude Gmail
            connector). You approve writes.
          </li>
          <li>
            <strong>Notion sync</strong> — one-way push; local files stay authoritative.
          </li>
          <li>
            <strong>HTML report</strong> — offline dashboard from tracker + archives.
          </li>
        </ul>
      </article>
      <Pager
        prev={{ to: "/docs/apply", label: "Application Studio" }}
        next={{ to: "/docs/settings", label: "Settings" }}
      />
    </>
  );
}

export function DocsSettings() {
  return (
    <>
      <article className="docs-article">
        <h1>Settings</h1>
        <p className="lede">Workspace path, dependency health, and appearance.</p>
        <h2>Workspace</h2>
        <p>
          Point the app at your upstream checkout. Reveal opens Finder. Changing the path reloads tracker and
          documents from the new folder.
        </p>
        <h2>Dependencies</h2>
        <p>
          Re-check AI providers, Python, LaTeX, and optional tools. The panel shows the exact install command
          when something is missing.
        </p>
        <h2>Appearance</h2>
        <p>
          Toggle light/dark inside the app. This marketing site also has a theme toggle in the header (light
          is default).
        </p>
        <div className="docs-callout">
          <strong>No credentials here.</strong> Provider, Gmail, and Notion auth stay in the provider CLIs /
          connectors. App data lives under Application Support for run history only.
        </div>
      </article>
      <Pager
        prev={{ to: "/docs/track", label: "Track & prep" }}
        next={{ to: "/docs/workflows", label: "Workflows" }}
      />
    </>
  );
}

export function DocsWorkflows() {
  return (
    <>
      <article className="docs-article">
        <h1>Workflows</h1>
        <p className="lede">Every catalogued upstream command the app can launch.</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Command</th>
                <th>What it does</th>
                <th>Writes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>/setup</code>
                </td>
                <td>Profile onboarding</td>
                <td>Profile / search files</td>
              </tr>
              <tr>
                <td>
                  <code>/scrape</code>
                </td>
                <td>Discover jobs</td>
                <td>
                  <code>seen_jobs.json</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>/rank</code>
                </td>
                <td>Score new postings</td>
                <td>Rank fields in seen jobs</td>
              </tr>
              <tr>
                <td>
                  <code>/apply</code>
                </td>
                <td>Application Studio</td>
                <td>CV, letters, tracker, archive</td>
              </tr>
              <tr>
                <td>
                  <code>/outcome</code>
                </td>
                <td>Record status</td>
                <td>Tracker + outcome notes</td>
              </tr>
              <tr>
                <td>
                  <code>/interview</code>
                </td>
                <td>Interview prep</td>
                <td>Prep notes in archive</td>
              </tr>
              <tr>
                <td>
                  <code>/gmail-sync</code>
                </td>
                <td>Propose status from mail</td>
                <td>Tracker after approval</td>
              </tr>
              <tr>
                <td>
                  <code>/notion-sync</code>
                </td>
                <td>Push to Notion</td>
                <td>External Notion DB</td>
              </tr>
              <tr>
                <td>
                  <code>/html-report</code>
                </td>
                <td>Offline dashboard</td>
                <td>
                  <code>reports/</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>/expand</code>
                </td>
                <td>Enrich profile</td>
                <td>Profile skills (confirmed)</td>
              </tr>
              <tr>
                <td>
                  <code>/upskill</code>
                </td>
                <td>Skill-gap plan</td>
                <td>
                  <code>upskill/</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>/add-template</code>
                </td>
                <td>Register template</td>
                <td>Template config</td>
              </tr>
              <tr>
                <td>
                  <code>/add-portal</code>
                </td>
                <td>Add job board skill</td>
                <td>
                  <code>.agents/skills/</code>
                </td>
              </tr>
              <tr>
                <td>
                  <code>/reset</code>
                </td>
                <td>Reset profile (destructive)</td>
                <td>Profile templates</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Launch any of these from <strong>Workflows</strong>. The app shows what may be written before you
          start.
        </p>
      </article>
      <Pager
        prev={{ to: "/docs/settings", label: "Settings" }}
        next={{ to: "/docs/security", label: "Security" }}
      />
    </>
  );
}

export function DocsSecurity() {
  return (
    <>
      <article className="docs-article">
        <h1>Security model</h1>
        <p className="lede">How the desktop app keeps you in control.</p>
        <ul>
          <li>
            <strong>Human approvals</strong> — write/exec tools never auto-approve; no{" "}
            <code>--dangerously-skip-permissions</code>.
          </li>
          <li>
            <strong>Local files</strong> — tracker, archives, and profile stay on disk in your workspace.
          </li>
          <li>
            <strong>No stored credentials</strong> — provider / Gmail / Notion auth remains in the provider
            CLIs and connectors.
          </li>
          <li>
            <strong>Safe process spawn</strong> — argv vectors only; untrusted text reaches the provider as
            message content.
          </li>
          <li>
            <strong>Path guards</strong> — workspace joins reject <code>..</code> and absolute escapes.
          </li>
          <li>
            <strong>Destructive resets</strong> — <code>/reset</code> needs confirmation in the app and
            again upstream.
          </li>
          <li>
            <strong>No telemetry backend</strong> — network use is your AI provider and what upstream
            workflows fetch.
          </li>
        </ul>
        <div className="docs-callout">
          <strong>Profile is personal data.</strong> Don’t push your workspace profile to a public fork.
          Upstream gitignores tracker and tailored application archives.
        </div>
      </article>
      <Pager
        prev={{ to: "/docs/workflows", label: "Workflows" }}
        next={{ to: "/download", label: "Download app" }}
      />
    </>
  );
}
