# Launch communication kit — developer preview first

**Status as of 2026-11-20:** Source-build developer preview, **not** production-ready stable release. Public v0.1.1 ZIPs are source/client archives; do not promote them as ready-to-launch apps. Native installer workflow and first-user acceptance are pending PR #16.

## Truthful product positioning

- Product: AI Job Search Assistant (with Jobzuu as the mascot/helper).
- Audience: technical job seekers and open-source contributors willing to build from source.
- Core: local-first desktop command center around job discovery, matching, CV/cover-letter preparation, review gates and application tracking.
- Does NOT submit job applications automatically or send recruiter messages.
- Some workflows require independently configured AI providers and may use paid credits.
- Apple Silicon is the developed client; Intel and Windows are source ports pending native validation.
- No claims of job offers, successful placements, verified integrations or production-ready installers without evidence.

## LinkedIn — developer preview post (safe to share now)

I've been building something for job seekers who want less tab chaos and more control over their applications.

**AI Job Search Assistant** is an open-source, local-first desktop project. The goal: bring job discovery, fit review, tailored application drafts, a transparent activity view, and application tracking into one workspace — with human approval before sensitive actions.

What I care about most is trust: preparing a CV is not the same as applying, and the app does not submit applications or send outreach automatically.

This is currently a **developer preview / build-from-source project**, not a polished install-and-go release. I'm looking for macOS developers and job seekers willing to try a synthetic test journey and tell me where onboarding, settings, and application tracking feel confusing.

Repo: https://github.com/AnkitParekh007/job-search-assistant
Website: https://job-search-assistant.rebound-ops.org/

What is the one workflow you would want a job-search desktop app to make simpler?

#OpenSource #JobSearch #Tauri #React #DeveloperTools

## X / Threads — compact version

Building AI Job Search Assistant: a local-first desktop command center for job discovery, reviewable application drafts and tracking. No auto-submission. Open-source developer preview; build from source for now. Looking for honest UX feedback. https://github.com/AnkitParekh007/job-search-assistant

## Reddit — non-promotional, discussion-first draft

Title: I built a local-first desktop UI for job-search workflows — what would you test first?

I'm working on an open-source React + Tauri desktop interface that connects a local job-search workspace to discovery, ranking, application drafts, tracking and reviewable agent activity. It's an early **build-from-source developer preview**, not an installable production release. It does **not** submit to employers or send email.

Before I call it ready, I'm specifically testing first-run onboarding, profile persistence, source configuration, the difference between 'drafted' and 'applied', and whether the help guide actually reduces confusion.

What would make you trust — or distrust — an app like this? If it's useful to the community rules, the source is here: https://github.com/AnkitParekh007/job-search-assistant

Post only where community self-promotion rules allow. No automated cross-posting or unsolicited DMs.

## GitHub Discussions — tester invitation

Title: Help test the full job-seeker journey before the next desktop release

Try the project from source in an isolated workspace with fictional profile details. We want reports covering onboarding, candidate profile, portal setup, discovery, ranking, Studio drafts, manual employer submission handoff, Pipeline updates and follow-up drafting. Please do not use live personal documents or submit real applications for testing. Include OS version, screenshots without personal data, actual vs expected behavior, and reproduction steps.

## Product Hunt / Hacker News / release-day LinkedIn

**HOLD** until: native installers verified; real macOS first-run acceptance completed; download CTA truthful; known P0/P1 bugs resolved; clear provider pricing disclosures; support channel staffed. Product Hunt should not be framed as a general-consumer launch while installation still requires local compilation.

### Approved release-day headline (use only after gates)

AI Job Search Assistant — A local-first desktop workspace for job discovery, reviewable application drafts, and tracking.

### Suggested campaign order

1. Publish developer-preview LinkedIn/X post linking to GitHub and requesting specific tester feedback.
2. Open a GitHub Discussion for structured bug reports and onboarding feedback.
3. Close P0/P1 issues, run first-user journeys, stage verified native draft release.
4. After stable binaries and documentation are confirmed: announce download availability on LinkedIn, X, relevant Reddit communities (where allowed), Show HN and Product Hunt.

### Measurement

Count GitHub issues with reproducible evidence, build/install success rates, first-run completion rate, first successful synthetic app draft, and qualitative confusion reports. Stars/forks are secondary to actual task completion. Do not claim employment outcomes.
