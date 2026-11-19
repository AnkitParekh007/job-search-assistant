# Contributor backlog (good first issues)

Scoped starter ideas grounded in real gaps. Prefer filing these as GitHub issues (do not invent activity). Titles are suggestions.

---

### 1. Capture sanitized product screenshots

**Problem:** README and docs lack real UI screenshots.  
**Expected:** PNG/WebP captures for Today, Jobs, Ranking, Studio, Pipeline, Interview, Activity, Onboarding — no personal data.  
**Acceptance:** Files under `docs/assets/screenshots/` with alt text listed in that folder’s README; root README embeds at least one.  
**Files:** `docs/assets/screenshots/`, `README.md`  
**Tests:** N/A (visual review)

### 2. Docs link checker script

**Problem:** Markdown relative links can rot.  
**Expected:** A small script (Node or Python) that fails on broken relative links under `docs/` and root community files.  
**Acceptance:** Script documented in `docs/development.md`; runnable in CI.  
**Files:** `scripts/check-doc-links.*`, `.github/workflows/*`  
**Tests:** Script exits non-zero on a deliberate broken link fixture

### 3. Settings copy: Claude cost disclosure

**Problem:** Cost disclosure is easy to miss.  
**Expected:** Settings / Dependencies includes a short, accurate note that workflows use Claude plan/API credits.  
**Acceptance:** Visible string; no false “free AI” wording; unit/snapshot if applicable.  
**Files:** `apps/macos-apple-silicon/src/pages/Settings.tsx`  
**Tests:** Existing Vitest suite still passes

### 4. Empty-state illustration for Jobs with zero seen_jobs

**Problem:** Empty Jobs view may feel unfinished.  
**Expected:** Clear empty state with CTA to run Discover, no fake sample employers.  
**Acceptance:** Renders when list empty; accessible text.  
**Files:** `apps/macos-apple-silicon/src/pages/Jobs.tsx`  
**Tests:** Component test with empty store fixture

### 5. Document Intel build on Apple Silicon hosts

**Problem:** Cross-compile steps are easy to miss.  
**Expected:** Expand `apps/macos-intel/README.md` with verified `rustup target add` + `npm run build:intel` notes and common failures.  
**Acceptance:** Commands match `package.json`; no claim of published artifacts.  
**Files:** `apps/macos-intel/README.md`  
**Tests:** N/A

### 6. Accessibility: focus ring on primary nav

**Problem:** Keyboard focus may be unclear on sidebar/nav.  
**Expected:** Visible focus styles matching existing design tokens.  
**Acceptance:** Tab through nav; focus visible; no layout shift.  
**Files:** `apps/macos-apple-silicon/src/styles.css`, nav in `App.tsx`  
**Tests:** Manual checklist in PR

### 7. Troubleshooting: Claude interrupt timeout

**Problem:** Users unsure what happens after Stop.  
**Expected:** Docs note interrupt then kill after ~1.5s (from architecture docs).  
**Acceptance:** Section in `docs/troubleshooting.md` with accurate wording.  
**Files:** `docs/troubleshooting.md`  
**Tests:** N/A

### 8. market-site canonical + OG image tags

**Problem:** SEO/social tags incomplete on some HTML pages.  
**Expected:** Consistent canonical URLs (Pages base path) and `og:image` pointing at social preview.  
**Acceptance:** `index.html`, `features.html`, `download.html`, docs index updated; Pages still deploys.  
**Files:** `market-site/**`  
**Tests:** Manual HTML review

### 9. Label hygiene issue template note

**Problem:** New contributors mis-file bugs vs features.  
**Expected:** Short SUPPORT blurb linking the correct issue forms (already added — extend if gaps remain).  
**Acceptance:** Links resolve; no duplicate templates.  
**Files:** `SUPPORT.md`, `.github/ISSUE_TEMPLATE/*`  
**Tests:** N/A
