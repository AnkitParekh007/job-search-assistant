import { Link } from "react-router-dom";
import { AppChrome } from "../../components/AppChrome";
import {
  PLATFORM_DOWNLOADS,
  RELEASE_TAG,
  RELEASE_TAG_URL,
  RELEASE_VERSION,
  RELEASES_PAGE,
  releaseAssetUrl,
} from "../../lib/releases";
import { GITHUB_REPO } from "../../lib/site";

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
            AI Job Search Assistant is the local-first desktop shell for your{" "}
            local workspace folder. Discover, rank, prepare, and track with{" "}
            <strong>multi-provider AI support</strong> — Claude Code or OpenAI Codex — on files you own.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary btn-lg" to="/docs/quickstart">
              Quickstart →
            </Link>
            <Link className="text-link" to="/download">
              Download {RELEASE_TAG} →
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
          The desktop app never reimplements slash commands. It supervises provider runs, shows approvals,
          and mirrors tracker / documents state from disk. Upstream workflows stay the source of truth.
        </p>

        <div className="docs-card-grid">
          <Link className="docs-card" to="/docs/install">
            <strong>Install</strong>
            <span>Download v{RELEASE_VERSION} for Apple Silicon, Intel, or Windows.</span>
          </Link>
          <Link className="docs-card" to="/docs/providers">
            <strong>AI Providers</strong>
            <span>Connect Claude Code and/or Codex; pick a default engine.</span>
          </Link>
          <Link className="docs-card" to="/docs/discover">
            <strong>Discover &amp; rank</strong>
            <span>Find roles, compare matches, shortlist what fits.</span>
          </Link>
          <Link className="docs-card" to="/docs/apply">
            <strong>Apply</strong>
            <span>Draft in Studio, compile PDFs, approve every write.</span>
          </Link>
        </div>

        <h2>What&apos;s new in this release</h2>
        <ul>
          <li>
            <strong>Multi-provider AI</strong> — Claude Code (stream-json) and OpenAI Codex (app-server) on
            Apple Silicon, with provider badges in Agent Activity.
          </li>
          <li>
            <strong>Platform packages</strong> — GitHub Release {RELEASE_TAG} assets for macOS arm64 / x64,
            and Windows x64.
          </li>
          <li>
            <strong>Full workflow catalog</strong> — all 14 workflows from Automations, with Codex
            gating for Claude-only connectors.
          </li>
          <li>
            <strong>Native surfaces</strong> — Jobs compare, Application Studio, Documents, Pipeline kanban,
            Dashboard metrics, and live Agent Activity with retry / resume.
          </li>
        </ul>

        <div className="docs-callout">
          <strong>Local-first.</strong> Tracker CSV, seen jobs, archives, and tailored documents stay in your
          workspace. Credentials stay with your provider CLI — not inside the app. The app never
          auto-submits applications or sends email.
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
        <p className="lede">Get from download to a shortlist in one sitting.</p>
        <ol className="docs-steps">
          <li>
            <div>
              <strong>Download the app</strong>
              Grab the {RELEASE_TAG} package for your platform from{" "}
              <Link to="/download">Download</Link> (or{" "}
              <a href={RELEASES_PAGE} rel="noopener">
                GitHub Releases
              </a>
              ). On macOS, first launch may need right-click → Open.
            </div>
          </li>
          <li>
            <div>
              <strong>Install an AI provider and sign in</strong>
              Claude Code (<code>brew install --cask claude-code</code>, then <code>claude</code>) and/or
              OpenAI Codex — then pick your default in Settings → AI Providers. See{" "}
              <Link to="/docs/providers">AI Providers</Link>.
            </div>
          </li>
          <li>
            <div>
              <strong>Point at your workspace</strong>
              Onboarding asks for any local workspace folder (scaffolds starter files if empty). Change it later in Settings.
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
              From Workflows or the Jobs screen: scrape new roles, rank them, compare up to four matches,
              then open Studio with a posting.
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
        <p className="lede">
          Download {RELEASE_TAG} for your platform, or build the Apple Silicon app from source.
        </p>

        <h2>Download packages ({RELEASE_TAG})</h2>
        <p>
          Prebuilt packages ship on{" "}
          <a href={RELEASE_TAG_URL} rel="noopener">
            GitHub Releases
          </a>
          . Unsigned macOS builds may need <strong>right-click → Open</strong> the first time.
        </p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Package</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_DOWNLOADS.map((platform) => (
                <tr key={platform.id}>
                  <td>
                    <strong>{platform.title}</strong>
                    <br />
                    <span>{platform.subtitle}</span>
                  </td>
                  <td>
                    <a href={releaseAssetUrl(platform.asset)} rel="noopener">
                      {platform.asset}
                    </a>
                  </td>
                  <td>{platform.note ?? platform.badge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Prefer the UI cards? Open the <Link to="/download">Download</Link> page. Full install walkthrough
          also lives in the repository <code>docs/installation.md</code>.
        </p>

        <h2>What you need on the Mac</h2>
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
                  Claude: <code>brew install --cask claude-code</code>; Codex: install CLI + Settings → AI
                  Providers → Connect
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
                <td>LuaLaTeX + XeLaTeX packages for your CV templates</td>
              </tr>
              <tr>
                <td>
                  <strong>Workspace folder</strong>
                </td>
                <td>Local source of truth for profile, jobs, and applications</td>
                <td>
                  Choose any folder in onboarding; Jobzuu scaffolds starter files if needed
                </td>
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

        <h2>Build from source (Apple Silicon)</h2>
        <p>
          Primary developed client: <code>apps/macos-apple-silicon</code>. You need Node 20+, Rust stable,
          and Xcode Command Line Tools.
        </p>
        <pre className="docs-pre">{`cd apps/macos-apple-silicon
npm install
npm test
npm run tauri build
open "src-tauri/target/release/bundle/macos/AI Job Search.app"`}</pre>
        <p>
          The bundle lands under <code>src-tauri/target/release/bundle/macos/</code>. Intel Mac and Windows
          trees live under <code>apps/</code> — see their READMEs. Source:{" "}
          <a href={GITHUB_REPO} rel="noopener">
            GitHub repository
          </a>
          .
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
        <p className="lede">Workspace, AI provider, profile setup, and dependency health.</p>
        <h2>Choose a workspace</h2>
        <p>
          The app needs a local <strong>workspace folder</strong>. Onboarding lets you pick any path
          or lets you pick another folder. Settings → Workspace can change it later and reveal it in Finder.
        </p>
        <h2>Pick an AI provider</h2>
        <p>
          Open <strong>Settings → AI Providers</strong>. Connect Claude Code and/or Codex, set a default
          engine, and optionally override models. Details:{" "}
          <Link to="/docs/providers">AI Providers</Link>.
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
        next={{ to: "/docs/providers", label: "AI Providers" }}
      />
    </>
  );
}

export function DocsProviders() {
  return (
    <>
      <article className="docs-article">
        <h1>AI Providers</h1>
        <p className="lede">
          Multi-provider AI support lets you run the same workspace workflows with Claude Code or OpenAI
          Codex.
        </p>

        <h2>Supported engines</h2>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>How it runs</th>
                <th>Setup</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Claude Code</strong>
                </td>
                <td>
                  <code>claude -p</code> stream-json with host approval prompts; resumes via session id
                </td>
                <td>
                  <code>brew install --cask claude-code</code>, then <code>claude</code> to sign in
                </td>
              </tr>
              <tr>
                <td>
                  <strong>OpenAI Codex</strong>
                </td>
                <td>
                  <code>codex app-server</code> over stdio; workspace-write sandbox; on-request approvals
                </td>
                <td>
                  Install Codex CLI → Settings → AI Providers → <strong>Connect</strong> (ChatGPT)
                </td>
              </tr>
              <tr>
                <td>
                  OpenAI API / Gemini / Ollama
                </td>
                <td>Stubs only — not runnable yet</td>
                <td>Shown as planned in Settings</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Settings → AI Providers</h2>
        <ul>
          <li>
            Set the <strong>default provider</strong> (<code>claude</code> or <code>codex</code>).
          </li>
          <li>Optional Claude model override (opus / sonnet / haiku) and Codex model id.</li>
          <li>Resumed runs stick to the session&apos;s stored provider — no silent switch mid-run.</li>
          <li>The app does not store API keys in SQLite or the UI bundle.</li>
        </ul>

        <h2>Workflow support by provider</h2>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Workflows</th>
                <th>Claude Code</th>
                <th>OpenAI Codex</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  setup, scrape, rank, apply, outcome, interview, html-report, expand, upskill
                </td>
                <td>Yes (slash commands)</td>
                <td>Yes (instruction-mapped prompts)</td>
              </tr>
              <tr>
                <td>
                  gmail-sync, notion-sync, add-portal, add-template, reset
                </td>
                <td>Yes</td>
                <td>Unsupported (Automations gates them when Codex is default)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="docs-callout">
          <strong>Platform note.</strong> The full Rust provider runtime ships on Apple Silicon today. Intel
          Mac and Windows clients include UI stubs; porting the providers module is on the roadmap.
        </div>
      </article>
      <Pager
        prev={{ to: "/docs/first-run", label: "First run" }}
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
        <p className="lede">Find new roles, dedupe them locally, compare matches, then score what fits.</p>
        <h2>Discover jobs</h2>
        <p>
          Run <strong>Discover jobs</strong> (<code>/scrape</code>) from Workflows, Jobs, or the Dashboard.
          It uses installed portal CLIs when available, otherwise web search, and writes to{" "}
          <code>job_scraper/seen_jobs.json</code>.
        </p>
        <p>
          Optional focus argument examples: a specialty, <code>broad</code>, or <code>health</code>. Portal
          health text comes from the workspace when portals are installed.
        </p>
        <h2>Rank matches</h2>
        <p>
          Run <strong>Rank matches</strong> (<code>/rank</code>). Upstream fetches postings, runs the
          integrity gate, scores against your profile rubric, and returns a shortlist in the same local
          store. Scores, verdicts, strengths, and gaps appear natively in Jobs.
        </p>
        <h2>Review in Jobs &amp; Dashboard</h2>
        <ul>
          <li>Filter roles and <strong>compare up to four</strong> ranked jobs side by side.</li>
          <li>Open a posting into Studio when you want tailored documents.</li>
          <li>Dashboard metrics and charts read the same tracker and seen-jobs files — every metric is clickable.</li>
          <li>Watch Agent Activity while a scrape or rank run is live (provider + model badges).</li>
        </ul>
        <div className="docs-callout">
          <strong>Failed runs stay honest.</strong> Terminal failures clear from the live badge and show
          retry / resume actions instead of fake progress.
        </div>
      </article>
      <Pager
        prev={{ to: "/docs/providers", label: "AI Providers" }}
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
          first, ask before drafting, then compile and verify PDFs. A native posting-integrity pre-check
          runs on pasted text before the provider drafts.
        </p>
        <h2>What gets written</h2>
        <ul>
          <li>CV and cover-letter sources under the workspace</li>
          <li>Compiled PDFs when LaTeX is available (page count + ATS text check)</li>
          <li>Tracker row marked <strong>drafted</strong> (not submitted)</li>
          <li>
            Application archive under <code>documents/applications/</code>
          </li>
        </ul>
        <h2>Approvals &amp; recovery</h2>
        <p>
          Write and exec tool calls pause for your click. If a run fails, use <strong>Retry fresh</strong> or{" "}
          <strong>Resume session</strong> from the console banner. Studio never marks an application as
          applied just because documents were generated.
        </p>
        <div className="docs-callout">
          <strong>Documents screen</strong> shows real sources in the workspace. Use Compile when a{" "}
          <code>.tex</code> file is ready but not yet rendered. In-app line editing for TeX is still planned —
          edit in your editor or via the run, then Reveal in Finder.
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
        <p className="lede">Pipeline outcomes, interview packs, Documents, and optional inbox sync.</p>
        <h2>Pipeline</h2>
        <p>
          Use Pipeline to move applications through statuses with validated transitions.{" "}
          <strong>Quick update</strong> writes natively with tracker rules; full{" "}
          <code>/outcome</code> archives what was sent and can draft follow-ups, but never sends email for
          you.
        </p>
        <h2>Documents &amp; reports</h2>
        <ul>
          <li>Browse CV / cover-letter sources and application archives from Documents.</li>
          <li>
            Generate an offline <strong>HTML report</strong> (<code>/html-report</code>) from tracker +
            archives.
          </li>
          <li>Register custom templates with <code>/add-template</code> when you need a new compile path.</li>
        </ul>
        <h2>Interview prep</h2>
        <p>
          Open Interview Prep (from the Pipeline drawer or Workflows) and run <code>/interview</code> for a
          tracked company. You get a stage-specific pack from the archived posting and your documents, with
          optional roleplay in the console.
        </p>
        <h2>Optional sync</h2>
        <ul>
          <li>
            <strong>Gmail sync</strong> — proposes status changes from application mail (Claude Gmail
            connector). You approve writes. Claude Code only.
          </li>
          <li>
            <strong>Notion sync</strong> — one-way push; local files stay authoritative. Claude Code only.
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
        <p className="lede">Workspace path, AI Providers, dependency health, and appearance.</p>
        <h2>Workspace</h2>
        <p>
          Point the app at your workspace folder. Reveal opens Finder. Changing the path reloads tracker and
          documents from the new folder.
        </p>
        <h2>AI Providers</h2>
        <p>
          Choose Claude Code or OpenAI Codex as the default engine, connect Codex (ChatGPT), and set optional
          model overrides. Full guide: <Link to="/docs/providers">AI Providers</Link>.
        </p>
        <h2>Dependencies</h2>
        <p>
          Re-check AI providers, Python, LaTeX, pdftotext, and optional portal tools. The panel shows the
          exact install command when something is missing.
        </p>
        <h2>Appearance</h2>
        <p>
          Toggle light/dark inside the app. This marketing site also has a theme toggle in the header (light
          is default).
        </p>
        <div className="docs-callout">
          <strong>No credentials here.</strong> Provider, Gmail, and Notion auth stay in the provider CLIs /
          connectors. App data lives under Application Support (
          <code>~/Library/Application Support/dev.local.aijobsearch</code>) for run history only.
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
        <p className="lede">Every catalogued workflow the app can launch — 14 total.</p>
        <div className="docs-table-wrap">
          <table className="docs-table">
            <thead>
              <tr>
                <th>Command</th>
                <th>What it does</th>
                <th>Writes</th>
                <th>Providers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>/setup</code>
                </td>
                <td>Profile onboarding</td>
                <td>Profile / search files</td>
                <td>Claude · Codex</td>
              </tr>
              <tr>
                <td>
                  <code>/scrape</code>
                </td>
                <td>Discover jobs</td>
                <td>
                  <code>seen_jobs.json</code>
                </td>
                <td>Claude · Codex</td>
              </tr>
              <tr>
                <td>
                  <code>/rank</code>
                </td>
                <td>Score new postings</td>
                <td>Rank fields in seen jobs</td>
                <td>Claude · Codex</td>
              </tr>
              <tr>
                <td>
                  <code>/apply</code>
                </td>
                <td>Application Studio</td>
                <td>CV, letters, tracker, archive</td>
                <td>Claude · Codex</td>
              </tr>
              <tr>
                <td>
                  <code>/outcome</code>
                </td>
                <td>Record status</td>
                <td>Tracker + outcome notes</td>
                <td>Claude · Codex</td>
              </tr>
              <tr>
                <td>
                  <code>/interview</code>
                </td>
                <td>Interview prep</td>
                <td>Prep notes in archive</td>
                <td>Claude · Codex</td>
              </tr>
              <tr>
                <td>
                  <code>/gmail-sync</code>
                </td>
                <td>Propose status from mail</td>
                <td>Tracker after approval</td>
                <td>Claude only</td>
              </tr>
              <tr>
                <td>
                  <code>/notion-sync</code>
                </td>
                <td>Push to Notion</td>
                <td>External Notion DB</td>
                <td>Claude only</td>
              </tr>
              <tr>
                <td>
                  <code>/html-report</code>
                </td>
                <td>Offline dashboard</td>
                <td>
                  <code>reports/</code>
                </td>
                <td>Claude · Codex</td>
              </tr>
              <tr>
                <td>
                  <code>/expand</code>
                </td>
                <td>Enrich profile</td>
                <td>Profile skills (confirmed)</td>
                <td>Claude · Codex</td>
              </tr>
              <tr>
                <td>
                  <code>/upskill</code>
                </td>
                <td>Skill-gap plan</td>
                <td>
                  <code>upskill/</code>
                </td>
                <td>Claude · Codex</td>
              </tr>
              <tr>
                <td>
                  <code>/add-template</code>
                </td>
                <td>Register template</td>
                <td>Template config</td>
                <td>Claude only</td>
              </tr>
              <tr>
                <td>
                  <code>/add-portal</code>
                </td>
                <td>Add job board skill</td>
                <td>
                  <code>.agents/skills/</code>
                </td>
                <td>Claude only</td>
              </tr>
              <tr>
                <td>
                  <code>/reset</code>
                </td>
                <td>Reset profile (destructive)</td>
                <td>Profile templates</td>
                <td>Claude only</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Launch any of these from <strong>Workflows / Automations</strong>. The app shows what may be
          written before you start. When Codex is the default, Claude-only commands are gated in the UI.
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
            <code>--dangerously-skip-permissions</code>. Codex uses <code>workspace-write</code> +{" "}
            <code>on-request</code> approval policy.
          </li>
          <li>
            <strong>Local files</strong> — tracker, archives, and profile stay on disk in your workspace.
          </li>
          <li>
            <strong>No stored credentials</strong> — provider / Gmail / Notion auth remains in the provider
            CLIs and connectors. No API keys in SQLite.
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
            again with Claude Code only.
          </li>
          <li>
            <strong>No telemetry backend</strong> — network use is your AI provider and what your provider
            workflows fetch.
          </li>
          <li>
            <strong>Honest submission semantics</strong> — preparing documents never marks an application as
            submitted to an employer.
          </li>
        </ul>
        <div className="docs-callout">
          <strong>Profile is personal data.</strong> Don&apos;t push your workspace profile to a public fork.
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
