# Acceptance report · The Way Back In (hardening pass)

Date: 2026-11-21 · Branch `feat/way-back-in-hardening` · Release checked: v0.1.1

**Status: NOT APPROVED FOR PUBLICATION.** Automated checks pass and the sampled frames have been reviewed.
A person still has to watch every film at full speed with sound and sign the sign-off table at the end.
Nothing has been posted or uploaded anywhere.

## Deliverables

| Composition | File (`out/`) | Length | Product first on screen / first third | Captions | Loudness | True peak | Voice over music | Size |
|---|---|---|---|---|---|---|---|---|
| Film2 (lead) | film2-return-date.mp4 | 34.6 s | 7.5 s / 11.5 s | 15 | −16.0 LUFS | −1.5 dBTP | 16.9 dB | 3.8 MB |
| Film1 | film1-commit-history.mp4 | 37.5 s | 11.3 s / 12.5 s | 18 | −16.0 LUFS | −1.4 dBTP | 16.9 dB | 4.1 MB |
| Film3 | film3-parsed.mp4 | 31.6 s | 6.1 s / 10.5 s | 15 | −16.0 LUFS | −1.5 dBTP | 16.8 dB | 3.2 MB |
| Film2Short | film2-return-date-short.mp4 | 16.3 s | 5.0 s / 5.4 s | 7 | −16.0 LUFS | −1.8 dBTP | 16.4 dB | 1.8 MB |
| Film1Short | film1-commit-history-short.mp4 | 23.2 s | 5.5 s / 7.7 s | 10 | −16.0 LUFS | −1.5 dBTP | 17.1 dB | 2.6 MB |
| Film3Short | film3-parsed-short.mp4 | 17.4 s | 2.9 s / 5.8 s | 8 | −16.0 LUFS | −1.5 dBTP | 16.8 dB | 1.7 MB |

Also: `out/covers/cover-film{1,2,3}-4x5.png`, `captions/<slug>.srt` (6 files), `launch/copy.md`.
Every video: H.264 High, yuv420p, 1080×1350, 30 fps CFR, AAC 48 kHz stereo 192 kb/s, faststart.

## Requirements

| # | Requirement | Result | Evidence |
|---|---|---|---|
| 1 | Remove Anthropic from Film 1's offer | **Done.** The offer scene and the `company` prop are gone. No employer is named; sample companies carry a "(sample)" marker | Claims lint: no `Anthropic` anywhere in source, captions or copy |
| 2 | No fictional calls, offers, ATS results or metrics shown as product outcomes | **Done.** Film 1 ends with Daniel submitting on the employer's site himself. Film 2 ends with Priya back in the search, not hired. Film 3's "Day 3 recruiter call", "Week 3 offer" and rising chart are gone. The opening numbers (142 / 0) are his own spreadsheet, labelled as fictional | Claims lint (offer, recruiter call, pass rate, % statistics, "Results vary") |
| 3 | Tell dramatized screens apart from real ones | **Done.** Every scene carries a top-left label: cyan **In the app · … · sample data** for recreations of shipping screens (labels copied from `packages/ui`), outlined **Story / Dramatization** for everything else, including Priya's email and the employer's site. The invented "Approve / ✓ Approved" CV button was replaced by the real approval card ("Allow Write? · Review exactly what will run. Nothing executes until you choose. · Allow once / Deny") | Check: every scene labelled; each film opens with a Dramatization label |
| 4 | Replace LIVE-ACTION SLOT placeholders with finished, licensed visuals | **Done.** Seven original illustrated scenes drawn in code (`src/Illustrations.tsx`): morning kitchen with laptop, rain-on-glass night window, tea table, pottery wheel, train window at dusk, monitor with sticky note, self-building reports with reflection. `LiveSlot`, `showSlates` and the slate labels are deleted, not hidden | `LICENSES.md`; claims lint fails on `LIVE-ACTION`, `LiveSlot` or `showSlates` |
| 5 | Film 3 ATS story reflects current capability | **Done.** The film shows Studio's **ATS text check**, which extracts a PDF's text layer (`PdfView.tsx` → `tools/verify_pdf.py`). A two-column PDF comes out jumbled; the one-column rebuild reads in order. A card says "No tool can promise what every screening system does" and notes the check needs poppler. No score, no pass rate, no "ATS Intelligence" | Claims lint for ATS terms; FAQ on the market site matches |
| 6 | Product visible in the first third | **Done** for all six (table above) | Check: product visible in the first third |
| 7 | Captions, readability, VO timing, music balance, safe areas | **Done.** Each caption phrase is synthesised separately, so cue times come from the audio. Captions are 42 px semibold on an 84% scrim, at most 2 lines of 32 characters and 20 characters per second, and sit with their bottom edge 200 px above the frame bottom. Scene type ends above the caption band, with 90 px side margins. The score ducks 12 dB under speech with a 0.25 s lead; voice sits about 17 dB over music; master is −16 LUFS / −1.5 dBTP | Checks: caption layout and reading speed, voice under every caption, voice ≥ 12 dB over music, loudness, true peak |
| 8 | Corrected SRT for all three films | **Done**, plus the three cutdowns. Written from the same cues as the burned-in captions | Check: SRT matches burned-in captions (timing to 2 ms, identical lines) |
| 9 | Cutdowns, covers, platform copy | **Done.** Three cutdowns (16–23 s), three 4:5 covers, and LinkedIn organic, LinkedIn ad, X and Instagram copy with alt text in `launch/copy.md`. Ad fields are within LinkedIn's limits (intro ≤ 150, headline ≤ 70) | Character counts in `launch/copy.md`; claims lint covers the copy |
| 10 | Automated render checks | **Done.** `tools/check.py` covers missing assets, black frames (true black), blank stretches, caption layout, timing and SRT parity, voice under captions, loudness, true peak, dead air, codec, pixel format, size, frame rate, frame count, duration, faststart and file size | Last run: 134 checks, 0 failed, 1 warning (one 0.99 s caption in Film 3, against a 1.0 s target) |
| 11 | Download claims checked against GitHub releases | **Done, and the old claim was wrong.** v0.1.1 has a runnable `.app` only for Apple Silicon; the Windows and Intel Mac zips are source packages to build. "Free for Mac & Windows" became "Mac app for Apple Silicon · Windows and Intel Mac: build from source". The end card adds "AI features use your own Claude Code or Codex setup" | `tools/verify_release.py`: checksums, archive contents, MIT licence, site and /download return 200, README provider and no-submit statements. It fails if a Windows or Intel binary ships, so the claim gets updated |
| 12 | No invented testimonials or outcome statistics | **Done.** Characters are introduced as fictional on screen, on the covers and in every post. No quotes from users, no percentages | Claims lint |

## Story changes, film by film

**Film 2 · Return Date** (lead). The arc stays: advice → break → return → "lead with what you can do" → back.
The return now happens inside the app's Jobs list. The sticky note sits on the bezel of a monitor showing the app.
The "AI sourcing course · complete" chip is gone: the app names the gap and Priya works on it off-screen. The
video-call interview and "Final round" columns became mock-interview practice and a pipeline card she moves herself.
"I'm back" now means back in the search.

**Film 1 · Commit History.** Same grid-to-mark structure. The live-action beats are now illustrations. The decision
beat opens the real workspace setup screen. The offer became Daniel pressing **Submit** on an employer's site
(labelled as not the app), and "Four months later…" is gone.

**Film 3 · Parsed.** Same KPI-to-mark structure. The dashboard became his own spreadsheet. The "parser" is now the
app's ATS text check. The recruiter call, the offer and the rising chart became an honest statement about what no
tool can promise.

## How the films were reviewed

- **Seen:** contact sheets of every final render, with frames at 15%, 55% and 92% of every scene (about 30 frames
  per film, 12–18 per cutdown), plus full-resolution frames of the Fit, Studio and end-card scenes and all three
  covers. Fixed after review: two cursors missing their buttons, overlap in the Studio scene, on-screen and spoken
  lines that differed, an invented "Write allowed once" label, a wrong scene label in Film 3, and the missing label
  on the covers.
- **Not yet done:** watching each film in motion at full speed, and **listening**. The audio was checked only by
  measurement (loudness, peak, ducking ratio, voice present under every caption, no dead air). Nobody has listened
  for pronunciation ("résumé", "Tomás", "one forty-two"), pacing, or how the synthesised score feels.

## Open items before publishing

1. Watch and listen to all six videos, then fill in the sign-off below.
2. **Remotion licence:** free for individuals and companies of up to 3 people; a larger company needs a company licence.
3. Run a trademark search on the sample company names before paid media.
4. Reels, Stories and Shorts need 9:16 versions, which were not made.
5. If a release ships a Windows or Intel Mac binary, `npm run verify:release` will fail. Update `claims.availability`
   in `src/films.json`, re-render, and update `launch/copy.md`.
6. The 3D presenters still go against the campaign doc's "no 3D characters" note. They were kept because you chose them.
7. Captions follow each other with a 1-frame gap. Some style guides prefer 2 frames.

## Sign-off

| Film | Watched in full (name, date) | Listened with headphones (name, date) | Notes |
|---|---|---|---|
| Film2 / Film2Short | | | |
| Film1 / Film1Short | | | |
| Film3 / Film3Short | | | |
