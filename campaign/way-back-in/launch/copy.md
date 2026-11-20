# The Way Back In · launch copy

**Status: draft for review. Nothing here has been posted.** Run the claims lint before using any line:
`npm run check:source` scans this file too.

## Rules every line follows

- The people are fictional, and each post says so. No testimonials, no quotes from real users.
- No outcomes: no interviews won, no offers, no response rates, no "beat the ATS".
- Name only shipped features: Jobs (found, ranked, gaps to address), Studio drafts behind an approval gate,
  the ATS text check (the text a parser extracts from your PDF), mock interview, the pipeline.
- The app never submits applications or sends email. Say so where it fits.
- Availability, as of release v0.1.1 (checked by `tools/verify_release.py`):
  **Mac app for Apple Silicon. Windows and Intel Mac: build from source.** AI features use your own Claude Code or Codex setup.
- Free and open source (MIT). Site: job-search-assistant.rebound-ops.org

## Which file goes where

| Placement | File | Why |
|---|---|---|
| LinkedIn organic post | `film{1,2,3}-*.mp4` (31–37 s, 4:5) | Full story; organic has no length pressure |
| LinkedIn sponsored content | `film{1,2,3}-*-short.mp4` (16–23 s, 4:5) | LinkedIn recommends 15–30 s for ads |
| X / Twitter | `*-short.mp4` | Autoplays muted; burned-in captions carry it |
| Instagram feed | `*-short.mp4` (4:5) | 4:5 fills the feed. Reels and Stories need 9:16, which is not made yet |
| Thumbnail / cover | `out/covers/cover-film{1,2,3}-4x5.png` | Upload as the custom thumbnail |
| Captions file | `captions/<slug>.srt` | Upload with every video, even though captions are burned in |

For LinkedIn ads with a **Download** button, target macOS devices only (the only platform with a ready-to-run app).
For everyone else, use **Learn more** and send them to `/download`, which explains the build-from-source path.

---

## Film 2 · Return Date (lead film)

**LinkedIn organic**

> For 11 years, Priya told candidates a career break isn't a red flag. Then she took one.
>
> Priya is fictional. The feeling isn't: coming back can be harder than leaving.
>
> AI Job Search Assistant is a free, open-source desktop app for running a return like a project:
> → it finds roles from your saved searches and ranks them against your experience, with the gaps spelled out
> → Studio drafts a tailored CV, and nothing is written until you allow it
> → mock interview questions for the hard one: "Tell me about the gap."
> → a pipeline you keep up to date yourself
>
> It never submits applications or sends email for you. That part stays yours.
>
> Mac app for Apple Silicon. Windows and Intel Mac: build from source. AI features use your own Claude Code or Codex setup.
> job-search-assistant.rebound-ops.org
>
> #CareerBreak #ReturnToWork #OpenSource

**LinkedIn ad (short cut)**
- Intro text (≤150): `A career break isn't a red flag. Plan your return with a free, open-source desktop app, and stay in charge of every application.` (128)
- Headline (≤70): `Plan your return like a project` (31)
- Description: `Free and open source. Mac app for Apple Silicon.`
- CTA: Learn more (or Download, macOS-targeted only)

**X / Twitter** (≤280)
> She told candidates a career break isn't a red flag. Then she took one. (A fictional story; a real app.)
> AI Job Search Assistant ranks roles against your experience, drafts with your approval, and never applies for you.
> Free, open source. job-search-assistant.rebound-ops.org

**Instagram feed**
> A pause isn't a full stop.
> Priya (fictional) spent 11 years telling candidates a career break isn't a red flag, then took one herself.
> AI Job Search Assistant helps you plan the way back: roles ranked against your experience, gaps named, drafts you approve, interview practice. You send every application yourself.
> Free and open source · Mac app for Apple Silicon · link in bio
> #careerbreak #returntowork #jobsearch

**Alt text**
> Animated film. A fictional recruiter, Priya, takes an 18-month career break, then uses the AI Job Search Assistant desktop app to rank roles, see one skills gap, write her break into her CV in her own words, approve the file save, practice interview questions and track applications she submits herself. Ends with "A pause isn't a full stop."

---

## Film 1 · Commit History

**LinkedIn organic**

> 14 months. 0 commits.
>
> Daniel is fictional. He lost his job while he was getting better, rewrote his résumé nine times and heard nothing back. So he stopped, and treated the search like a project.
>
> That's what AI Job Search Assistant is for. It's a free, open-source desktop app:
> → ranks roles against your experience and shows where you fit, and where you don't yet
> → drafts a tailored CV in your words; every file write waits for your OK
> → mock interviews, a pipeline, and follow-up drafts you send yourself
>
> It never submits an application. You hit submit.
>
> Mac app for Apple Silicon. Windows and Intel Mac: build from source. AI features use your own Claude Code or Codex setup.
> job-search-assistant.rebound-ops.org
>
> #SoftwareEngineering #CareerGap #OpenSource

**LinkedIn ad (short cut)**
- Intro text: `14 months. 0 commits. Run your comeback like a project, with a free, open-source desktop app that never applies for you.` (120)
- Headline: `Run your comeback like a project` (32)
- CTA: Learn more (or Download, macOS-targeted only)

**X / Twitter**
> 14 months. 0 commits. Nine résumés, nothing back. (Fictional engineer, real app.)
> AI Job Search Assistant: see where you fit, draft in your own words, approve every file write. You hit submit.
> Free, open source. job-search-assistant.rebound-ops.org

**Instagram feed**
> Run your comeback like a project.
> Daniel (fictional) is coming back after 14 months away. The app shows where he fits, drafts with his approval and keeps his pipeline straight. He submits every application himself.
> Free and open source · Mac app for Apple Silicon · link in bio

**Alt text**
> Animated film. A fictional engineer, Daniel, faces an empty contribution graph after 14 months away. He connects a workspace in the AI Job Search Assistant desktop app, sees a ranked role with its gaps, tailors his CV and approves the file save, practices interview questions, tracks applications and submits one himself on the employer's site. Ends with "Run your comeback like a project."

---

## Film 3 · Parsed

**LinkedIn organic**

> 142 applications. 0 replies.
>
> Tomás is fictional. He used to build the reports that now build themselves. Then he looked at what a parser could actually read from his résumé PDF: columns crossed, icons turned into noise.
>
> AI Job Search Assistant's ATS text check shows you the text extracted from your PDF, so you can fix what breaks before you apply. It can't promise what any employer's screening system does. Nothing can. It shows you what yours reads.
>
> Then it ranks roles against your experience, and you send fewer, better applications yourself.
>
> Free and open source. Mac app for Apple Silicon; Windows and Intel Mac: build from source. The text check needs poppler installed.
> job-search-assistant.rebound-ops.org
>
> #DataAnalytics #JobSearch #OpenSource

**LinkedIn ad (short cut)**
- Intro text: `See the text a parser pulls from your résumé PDF, then fix what breaks. Free, open-source desktop app. No promises, just a check.` (129)
- Headline: `Check what your résumé PDF really says` (38)
- CTA: Learn more (or Download, macOS-targeted only)

**X / Twitter**
> 142 applications, 0 replies. (Fictional analyst, real feature.)
> AI Job Search Assistant's ATS text check shows the text extracted from your résumé PDF, so two-column layouts and icon fonts stop hiding your experience. That is all it promises.
> job-search-assistant.rebound-ops.org

**Instagram feed**
> AI changed the market. Not your value.
> Tomás (fictional) checked what a parser could read from his résumé, fixed the layout, and now the same experience reads in order.
> Free and open source · Mac app for Apple Silicon · link in bio

**Alt text**
> Animated film. A fictional analyst, Tomás, sees 142 applications and no replies in his own spreadsheet. In the AI Job Search Assistant desktop app he runs the ATS text check on his résumé PDF and sees jumbled extracted text, rebuilds it as one column so the text reads in order, then ranks roles. A card says no tool can promise what every screening system does. Ends with "AI changed the market. Not your value."
