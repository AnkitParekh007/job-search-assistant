# Market Site Audit — 2026-11-20

**Scope:** `market-site/` source (React 19 + Vite 7 + React Router 7 SPA, ~3.5k lines) and the live deployment at <https://ankitparekh007.github.io/job-search-assistant/>.
**Method:** Read all source, config, and the deploy workflow; loaded the live site in a real browser at desktop and 375px mobile widths; probed HTTP status codes, rendered `<head>`, fonts, network payload, keyboard focus, and how the reveal animations behave.
**Lens:** the `frontend-design` brief, which asks for a distinctive, intentional design rather than the generic look most AI-built sites share.

---

## TL;DR

| Area | Grade | One-line verdict |
|---|---|---|
| Engineering hygiene | **B** | Clean, small, typed, cheap to load (~100 KB). A few fragile patterns. |
| Correctness | **D** | Every route except `/` returns HTTP 404. The reveal animation is fragile and Features cards swap content after load (see the correction in 1.1). |
| SEO / shareability | **D** | Search engines see 12 of 13 sitemap URLs as 404s, and every route shares the home page's `<title>` in raw HTML. |
| Accessibility | **C+** | Good basics: `lang`, one `h1`, `aria-hidden` mockups, a reduced-motion rule. Missing a skip link and focus styling, and content depends on JS to become visible. |
| Content accuracy | **C** | Copy predates the multi-provider (Codex) runtime and the "Scout" branding in the README. |
| Visual design / distinctiveness | **C−** | Tidy, but the stylesheet says it is "inspired by chatgpt.com/download", and it looks it. Placeholder mockups stand in for the product. Nothing about it is memorable. |

**Top 5 actions, in order:**
1. Fix the reveal system so content can never get stuck invisible (P0).
2. Pre-render each route to its own `index.html` so pages return HTTP 200 and have per-route meta tags (P0).
3. Replace the grey skeleton "AppChrome" panels with real screenshots or a live UI demo (P1).
4. Update the copy for multi-provider support (Claude Code **or** Codex) and decide on one brand name (P1).
5. Give the site its own visual identity instead of a ChatGPT-download look-alike (P1/P2).

---

## 1. Critical bugs (P0)

### 1.1 Reveal system is fragile; Features cards swap after load
> **Correction (same day):** the first version of this report said the Features content *stays* invisible. A re-test showed that came from the browser pane being hidden during testing (IntersectionObserver doesn't fire until the page paints). In a visible window the content does reveal. The underlying fragility below is real and has been fixed.

**Observed live:** on a direct load of `/features`, the page first paints the hard-coded fallback cards (order: Discover, Rank, Studio / Pipeline, Interview, Activity). Once `features.json` arrives they are replaced by different cards (Discover, Rank, Studio / Documents, Pipeline, Interview…). Every element is `opacity: 0` until JS has run, so a slow or failed bundle means a blank page.

**Cause:** [useReveal.ts](../../market-site/src/hooks/useReveal.ts) ran one `querySelectorAll(".reveal")` per pathname change and toggled `is-in` by hand. [FeaturesPage.tsx](../../market-site/src/pages/FeaturesPage.tsx) then fetched `features.json` and replaced the fallback cards with remounted nodes (index-based keys, and titles that differ between the two sources). Those nodes were only revealed if the timing happened to work out.

**Status: fixed on `feat/multi-provider-runtime`.** The hook now also watches for newly mounted `.reveal` nodes with a MutationObserver, content is only hidden once JS opts in (`html.reveal-ready`) with a CSS failsafe, and features data is imported at build time with stable `id` keys.

**Fix (pick one):**
- **Per-element reveal** (recommended): a `<Reveal>` component or a `useRevealRef()` hook, so each element registers its own observer when it mounts. It survives async data, remounts and StrictMode.
- **Progressive enhancement:** content is visible by default and only hidden once JS opts in, e.g. `html.js-reveal .reveal:not(.is-in){opacity:0}`, with a safety timeout that adds `is-in` to everything after ~1.5 s.
- Use stable keys (`f.id`, which already exists in the JSON) so cards don't remount.

### 1.2 Every deep link returns HTTP 404
| URL | Status |
|---|---|
| `/` | 200 |
| `/features`, `/download`, `/docs`, `/docs/install`, … | **404** |

The `spa-github-pages-fallback` plugin in [vite.config.ts](../../market-site/vite.config.ts) copies `index.html` to `404.html`. Users still see the page, but crawlers, link-preview bots, uptime monitors and Lighthouse all get a 404. Your [sitemap.xml](../../market-site/public/sitemap.xml) currently points Google at 12 "Not Found" pages.

**Fix:** prerender at build time. The site is fully static, so this is low effort:
- Use `vite-react-ssg` or `react-router`'s prerender (v7 framework mode supports `prerender: [...]`), **or**
- add a post-build script that renders each route to `dist/<route>/index.html` with `react-dom/server` and injects the per-route `<title>`/meta.

This also fixes 1.3 and gives faster first paint.

**Status: fixed on `feat/multi-provider-runtime` (pending deploy).** `npm run build:market` now does an SSR build of `src/entry-server.tsx`, and `scripts/prerender.mjs` writes `<route>.html` and `<route>/index.html` for all 13 routes with per-route head tags. The client hydrates them. `scripts/check-dist.mjs` fails the build if any sitemap URL lacks a prerendered file, a matching canonical URL, a unique title, or an `<h1>`. One thing to confirm after deploy: that GitHub Pages serves `/docs` from `docs.html` rather than redirecting to `/docs/`. Both return the same page either way.

### 1.3 Per-route meta only exists after JS runs
[seo.ts](../../market-site/src/lib/seo.ts) changes `<head>` on the client. The raw HTML for `/features` has the title *"AI Job Search — Local-first macOS job search command center"*, so link previews in Slack, LinkedIn and X show the home page's title and description for every page. Prerendering (1.2) fixes this.

---

## 2. Correctness & code quality (P1)

| # | Finding | Location | Suggestion |
|---|---|---|---|
| 2.1 | The catch-all route `*` redirects silently to `/`. Typos and dead links never show a 404. | [App.tsx](../../market-site/src/App.tsx) | Add a real `NotFoundPage` (with `noindex`) and links to the main sections. |
| 2.2 | `SITE_BASE` is hard-coded to `/job-search-assistant`, and canonical/og URLs are hard-coded in `index.html`. Both ignore `BASE_PATH`. | [site.ts](../../market-site/src/lib/site.ts), [index.html](../../market-site/index.html) | Derive them from `import.meta.env.BASE_URL` plus one `VITE_SITE_ORIGIN`. |
| 2.3 | `features.json` fetch errors are swallowed by an empty `catch`. The fallback copy has drifted from the JSON (e.g. "Scrape installed portal CLIs or fall back to web search" vs "Scrape portal CLIs or web search"), and the workflows table disappears entirely on failure. | [FeaturesPage.tsx](../../market-site/src/pages/FeaturesPage.tsx) | Import the JSON at build time (`import features from "…/features.json"`). There's no runtime fetch, no flash of fallback copy and no drift, and it removes the trigger for bug 1.1. |
| 2.4 | Each `SiteHeader` instance calls `useTheme()` separately, so theme state isn't shared. | [SiteHeader.tsx](../../market-site/src/components/SiteHeader.tsx) | Put the theme in a small context, or use a `useSyncExternalStore` over `localStorage` + `data-theme`. |
| 2.5 | The mobile menu only closes when the `active` prop changes, not on every navigation, Escape, or a click outside. The toggle has `aria-expanded` but no `aria-controls`. | SiteHeader.tsx | Close on `location.key` change and on Escape; add `aria-controls`; consider `inert` on the page behind it. |
| 2.6 | The Download page's hash scroll uses `behavior: "smooth"` without checking `prefers-reduced-motion`. | [DownloadPage.tsx](../../market-site/src/pages/DownloadPage.tsx) | Use `matchMedia('(prefers-reduced-motion: reduce)')` to pick `auto`. |
| 2.7 | Dead `@font-face` for "Söhne" (`local()` only, never referenced), left over from the ChatGPT-inspired styling. | [styles.css](../../market-site/src/styles/styles.css) | Delete it. |
| 2.8 | Inline `style={{…}}` in HomePage. | HomePage.tsx | Move it to a CSS utility class. |
| 2.9 | `market-site/package.json` has no `lint` or `test` script, and CI only builds. | package.json, `deploy-market-site.yml` | Add `eslint` plus a Playwright smoke test (each route returns 200 and the `h1` is visible). That test would have caught 1.1 and 1.2. |
| 2.10 | The sitemap has no `<lastmod>`. | sitemap.xml | Generate it at build time from the route list. |
| 2.11 | No favicon / apple-touch-icon link was found on the live page. | index.html | Add an SVG favicon plus a 180px PNG. The "AJ" monogram is fine for now. |
| 2.12 | No JSON-LD. | index.html | Add `SoftwareApplication` schema (OS: macOS, price 0, license MIT). |

---

## 3. Accessibility

**Done well:** `lang="en"`, a single `h1` per page, decorative mockups marked `aria-hidden`, the theme is applied before first paint (no flash), the `prefers-reduced-motion` block forces `.reveal` visible, the visible default focus ring works with Tab, and `--text-muted` (#5c5c5c on white) passes AA.

**Gaps:**
- **No skip link.** Add a "Skip to content" link to `<main id="main">`.
- **No designed `:focus-visible` style.** It relies on the browser default (a yellow/orange ring on the live site), which clashes with the monochrome look and may disappear on dark pills. Add `:focus-visible { outline: 2px solid var(--text); outline-offset: 3px; }`.
- **`--text-dim` (#8a8a8a on #fff) is about 3.4:1**, which fails AA for body text. Use it only for large or non-essential text, or darken it to around #707070.
- **Content depends on JS to be visible** (see 1.1). With no JS, or a slow JS bundle, the page is blank. Hide content only after JS has loaded.
- Mobile header: the "AI Job Search" wordmark wraps onto two lines at 375px (45px tall). Shorten it, or drop to the monogram below 400px.

---

## 4. Content & messaging

- **Out of date after the multi-provider runtime.** The latest commit (`3205ef7`) added OpenAI Codex beside Claude Code, but the site still says "Claude Code required" (footer), "Your signed-in Claude Code CLI runs the real upstream workflows", and lists only the Claude Code CLI under Requirements. The footer also says "Not affiliated with OpenAI", which now reads oddly. Rewrite these as "your choice of Claude Code or Codex" and say "Not affiliated with Anthropic or OpenAI".
- **Brand inconsistency.** The README calls the product *AI Job Search Assistant* and introduces a *Scout* mascot/hero. The site says *AI Job Search*, has no Scout, and uses an "AJ" monogram. Pick one name and carry Scout across, because it is the one distinctive asset you already own.
- **The hero CTA is "Build for macOS",** but the header CTA says "Download" and there is no download (the Download page says "No published GitHub Release binary yet"). Labelling the header CTA "Download" overpromises. Use "Get it on GitHub" or "Build from source" until a release ships.
- **No proof anywhere.** There are no screenshots, no demo GIF, no GitHub stars or contributors, no example outputs (a CV PDF, a tracker CSV, an HTML report). For a developer-focused open-source tool, proof matters more than adjectives.
- **Upstream credit** to Mads Lorentzen's `ai-job-search` is prominent in the README but hard to find on the site. Add it to the Home page and footer, which builds trust and is fair to the upstream author.
- The "14 workflows" stat is hard-coded. Derive it from `features.json`'s `workflows.length`.

---

## 5. Visual design (frontend-design lens)

### What it is today
`styles.css` opens with: *"Visual language inspired by chatgpt.com/download."* The result is a white or black canvas, one neutral grey ramp, pill buttons, big rounded "panels" with blurred colour glows (`--glow-a/b/c` blue/orange/green), and Satoshi throughout. It is competent, but it reads as a template. Someone who has seen the ChatGPT download page will recognise it straight away, and nobody will remember it.

### Specific problems
1. **The product is never shown.** All four `AppChrome` mockups are grey skeleton bars with traffic-light dots and chips like "Today" and "Studio". The site sells a visual desktop workspace without ever showing the workspace.
2. **The type has no hierarchy of voice.** Satoshi is used for both `--font` and `--font-display`, and the kicker, h1, lede and body differ only in size and weight.
3. **The layout repeats one move.** The page is a sequence of 50/50 panel-and-text splits, alternating left and right. Home, Features and Docs all use the same rhythm.
4. **The colour carries no meaning.** The glows are decoration and don't map to anything in the product (Find, Apply and Track are the obvious groups, and they already exist in the JSON).
5. **The motion is generic.** Every block gets the same fade-up, and in its current state it hides content instead of revealing it.

### A direction worth committing to
The product's honest story is *"your job search as files you own, run by an agent you can watch."* That suggests an **editorial / terminal-meets-paper** aesthetic rather than a SaaS one:

- **Typography:** a characterful display serif for headlines (e.g. *Fraunces*, *Instrument Serif* or *Newsreader*) against a precise mono for UI and data (*JetBrains Mono*, *Berkeley Mono*-style, or *IBM Plex Mono*). Keep Satoshi only for body text, or drop it. The tension between a typeset CV and a CLI log *is* the product.
- **Colour as information:** give the three pipeline stages their own colours. For example, Find = ink blue, Apply = vermilion, Track = forest green, on a warm off-white "paper" (#f6f3ee) and a deep ink dark mode (#0f1115). Use those colours consistently on the stage chips, feature-card tabs, workflow-table rows and docs section markers.
- **Hero = the real thing, animated.** Replace the skeleton with either (a) real app screenshots with annotated callouts, or (b) a scripted "agent activity" log that types out live (`/scrape → 42 postings`, `/rank → 7 above threshold`, `awaiting approval ▸ cover-letter-acme.pdf`) next to a tracker table that fills in. It is cheap to build in CSS and JS, and it shows the most distinctive thing about the product: approval-gated, visible agent work.
- **Bring in Scout.** The README already has a `scout-hero.svg`. Use it as the brand mark, the 404 illustration and the empty-state character.
- **Break the grid once per page.** For example, a full-bleed "pipeline" band running Discover → Rank → Apply → Outcome horizontally, with each stage as a card that overlaps the band edge. That one memorable layout moment replaces three identical splits.
- **Texture:** a faint paper grain plus hairline ruled lines (like a notebook or a CSV) behind the sections. In dark mode, swap to a subtle scanline grid.
- **Motion:** one orchestrated hero sequence (the log types, the rows fill, the approval chip pulses once). Everything else stays static, or gets a very light reveal.

This keeps the site light (no images beyond screenshots, CSS-only effects) and gives it an identity that belongs to *this* product.

---

## 6. Performance (already strong)

- Transfer: JS **93 KB**, CSS **5 KB**, fonts from Fontshare, and `features.json` 2 KB. DOMContentLoaded was about 1.9 s on a cold load in the test browser.
- Quick wins:
  - Add `preconnect` to `api.fontshare.com` / `cdn.fontshare.com`, or **self-host** the fonts (this removes a third-party request and a privacy leak, which is on-message for a "local-first" product).
  - The 600 weight is requested but unused (only 500 and 700 loaded). Trim it.
  - `og-social.png` is **582 KB**. Recompress it to under 150 KB (PNG quantize, or JPEG/WebP at 1200×630).
  - Lazy-load the docs routes (`React.lazy`) so the home bundle doesn't include about 600 lines of docs content.

---

## 7. Suggested roadmap

| Priority | Item | Effort |
|---|---|---|
| **P0** | Per-element reveal plus visible-by-default content (1.1) | S |
| **P0** | Prerender routes to static HTML with per-route meta (1.2, 1.3) | M |
| **P0** | Playwright smoke test in CI: every sitemap URL returns 200 and its `h1` is visible | S |
| P1 | Copy update for Claude Code **or** Codex, plus the affiliation line | S |
| P1 | Real screenshots or an animated agent-log hero in place of the skeleton mockups | M |
| P1 | Real 404 page, skip link, `:focus-visible`, mobile menu behaviour | S |
| P1 | Build-time JSON import with stable keys | S |
| P2 | Visual identity pass (type pairing, stage colours, Scout, one grid-breaking band) | L |
| P2 | Self-hosted fonts, OG image compression, JSON-LD, favicon, sitemap `lastmod` | S |
| P2 | Upstream credit and proof (stars, sample outputs) on Home | S |

---

*Verification notes: the HTTP statuses, the Features card swap, raw `<title>` values, network sizes, font loading and the mobile header wrap were all observed on the live site on 2026-11-20. The "invisible content" claim in 1.1 was corrected after a re-test. The favicon finding comes from a DOM query, not a visual check.*
