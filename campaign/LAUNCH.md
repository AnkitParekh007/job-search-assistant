# Launch week

One story. One outbound link per post. Reply for 48 hours. That is the ranking mechanic.

The story: a local-first desktop app for people who refuse auto-apply bots. Files stay on disk. The person submits every application.

Do not buy stars, trade upvotes, or post from extra accounts. Do not promise interviews, replies, or a pass through anyone’s screening system.

## Before Tuesday

Record the flagship from [youtube/SCRIPT.md](./youtube/SCRIPT.md). Upload it as unlisted until the release note is live, then switch it to public the same morning.

Films in `way-back-in/` stay off every platform until [ACCEPTANCE.md](./way-back-in/ACCEPTANCE.md) is signed. That includes the 9:16 cuts.

### Owner-only GitHub settings

These are admin clicks. The repo files are ready.

1. **Social preview.** Settings → General → Social preview → upload [docs/assets/social/github-social-preview.png](../docs/assets/social/github-social-preview.png).
2. **Discussions.** Settings → General → Features → Discussions. Categories are listed in [docs/discussions-setup.md](../docs/discussions-setup.md). Then publish the four drafts in [docs/wiki-staging](../docs/wiki-staging): welcome, feature ideas, roadmap, contributing. Pin the question below.
3. **Wiki.** Clone `job-search-assistant.wiki.git` and copy `docs/wiki-staging/*.md` as [docs/wiki-staging/README.md](../docs/wiki-staging/README.md) describes. Home first.
4. **Private vulnerability reporting.** Settings → Code security and analysis → Enable. See [SECURITY.md](../SECURITY.md).

Pinned discussion title: `What hurts more: finding, tailoring, tracking, or interviews?`

```text
Not a poll with a prize. I want the first thing the app should get better at.

A) finding roles
B) rewriting materials
C) tracking follow-ups
D) interview prep

The app is local, MIT, and it does not submit applications for you.
https://github.com/AnkitParekh007/job-search-assistant
```

## Do not say

On any channel, including replies:

- A number of interviews, replies, or hires, for you or for a user
- “Beat the ATS,” a pass rate, or “ATS score”
- That Intel or Windows has a downloadable app
- That someone should disable Gatekeeper, run `spctl --master-disable`, or strip quarantine
- A testimonial. The people in the films are fictional. Say so if you post a film.
- “As seen in,” a star count you do not have, or a Product Hunt badge

Availability, every time it matters: Mac app for Apple Silicon. Windows and Intel Mac: build from source. AI features use your own Claude Code, Codex, OpenAI, Gemini, or Ollama setup. Capability varies.

## Tuesday — US morning

**YouTube.** Set the flagship public. Paste [youtube/DESCRIPTION.md](./youtube/DESCRIPTION.md). Pin [youtube/PINNED-COMMENT.md](./youtube/PINNED-COMMENT.md).

**GitHub Release.** The `v0.1.5` Apple Silicon zip is already published. Add a discussion or release comment that matches the binary, not a new claim:

```text
v0.1.5 is the Apple Silicon build: Job-Search-Assistant-0.1.5-macos-arm64.zip.
Ad-hoc signed, not notarized. First launch: right-click the app → Open.
Intel Mac and Windows: build from source. The app does not submit applications.
```

**+2 hours — Show HN.** One link: the GitHub repo.

Title:

```text
Show HN: Local-first macOS job-search app – you submit applications yourself
```

Body:

```text
I built Job Search Assistant because the auto-apply tools I tried would send applications I would not stand behind.

It is a desktop app. You connect a folder. It can discover roles, rank fit (strengths and gaps), draft a CV, and track a pipeline. A file write or a command stops until you allow it. You submit the application on the employer’s site.

Files stay in that folder. MIT. AI uses your own Claude Code, Codex, OpenAI, Gemini, or Ollama account, and tracking works with none of them.

The public binary is macOS Apple Silicon, ad-hoc signed, not notarized. Intel and Windows are source-only today.

https://github.com/AnkitParekh007/job-search-assistant
```

First comment (post it immediately):

```text
Honesty box: first launch may need right-click → Open because it is not notarized. Do not turn Gatekeeper off. The README screenshots are a fictional demo workspace, not my search and not a result. Happy to go into the Tauri approval gate or the file layout.
```

## Wednesday — one Reddit post

r/SideProject only. Body is the primary draft in [reddit-launch-copy.md](./reddit-launch-copy.md). One link, the GitHub repo. Do not edit in a second link.

First comment, 2–5 minutes later: the honesty box already in that file. Answer every comment. Do not cross-post for 24 hours.

## Thursday — films, only if signed off

If `ACCEPTANCE.md` is still unsigned, skip Thursday. Post a still from `docs/assets/screenshots/03-ranking.png` with the X copy below instead. Do not invent a film.

If it is signed: X and LinkedIn get Film 2 short (career break), copy already in [way-back-in/launch/copy.md](./way-back-in/launch/copy.md). Link the YouTube flagship, not a second landing page. The character is fictional. The post already says so.

X, if you are using the still instead:

```text
Rank the role, including the gap. Draft only after you allow the file write. You hit submit.

Job Search Assistant is free, open source, and local. It does not apply for you.
https://www.youtube.com/watch?v=REPLACE_WITH_FLAGSHIP
```

## Friday — builder channels, rewritten

Do not paste the Reddit post.

**Tauri / Rust show-and-tell** (Discord or the relevant forum):

```text
Job Search Assistant is a Tauri 2 + React desktop shell for a local job-search folder. The host reads a tracker CSV and seen_jobs.json. Write and exec tools stop on an approval card. Public build is macOS Apple Silicon. Intel and Windows compile from source; no native installer is published for them.

https://github.com/AnkitParekh007/job-search-assistant
```

**Indie Hackers:**

```text
Title: A local job-search app that refuses to auto-apply

I shipped a MIT desktop app for the boring part of a search: find, rank, draft, track. The person still submits. Files stay on disk. The hard part now is install friction (ad-hoc signed, not notarized) and keeping the README honest.

https://github.com/AnkitParekh007/job-search-assistant
```

r/macapps only if Tuesday’s thread is still being answered. Same facts, shorter, and say right-click → Open in the first comment.

## Hold

r/layoffs waits until the product thread has real replies. Use the colder variant already in [reddit-launch-copy.md](./reddit-launch-copy.md). No ads. No Product Hunt until the Apple Silicon zip is the one the copy describes and the sample company names in the films have a trademark check ([way-back-in/LICENSES.md](./way-back-in/LICENSES.md)).

## Issues worth starring for

Filed from the real gaps. Windows and Intel verification stays on [#19](https://github.com/AnkitParekh007/job-search-assistant/issues/19). Do not open a second one.

- [#27](https://github.com/AnkitParekh007/job-search-assistant/issues/27) Empty Jobs view
- [#28](https://github.com/AnkitParekh007/job-search-assistant/issues/28) Keyboard focus on the primary nav
- [#29](https://github.com/AnkitParekh007/job-search-assistant/issues/29) Document the Intel build on Apple Silicon
- [#30](https://github.com/AnkitParekh007/job-search-assistant/issues/30) Recapture the sample screenshots when the shell changes

## After the spike

Week one, write down: GitHub traffic source, stars, clones, Release downloads, YouTube average view duration, and whether Show HN and the Reddit thread still have comments after six hours.

If the comments are about Gatekeeper, the next change is notarization or a clearer first-run. Not another post. Notarization needs an Apple Developer account. Until then, do not tell people to disable Gatekeeper.

Awesome-list submissions wait until the repo has about 100 stars that came from these posts. The blurb is one sentence: local-first desktop app to discover, rank, draft, and track a job search, without submitting applications for you.

A weekly note is one changelog bullet, one sample screenshot, and one open question. Same bans as above.
