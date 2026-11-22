# The Way Back In · launch films

Three 4:5 (1080×1350, 30 fps) films for Job Search Assistant, each with a short cut and a cover, built in code
with [Remotion](https://www.remotion.dev).

| Composition | Film | Length | Presenter (fictional) | Product on screen from |
|---|---|---|---|---|
| `Film2` | Return Date (lead) | 34.6 s | Priya | 0:07.5 (Jobs, found) |
| `Film1` | Commit History | 37.5 s | Daniel | 0:11.3 (workspace setup) |
| `Film3` | Parsed | 31.6 s | Tomás | 0:06.1 (ATS text check) |
| `Film2Short` · `Film1Short` · `Film3Short` | cutdowns | 16–23 s | | first third |
| `Film1Vertical` · `Film2Vertical` · `Film3Vertical` | 9:16 (1080×1920) | 13–17 s | | within 3 s |

9:16 cuts are for Shorts, Reels, and TikTok. Voice, captions, and MP4s were rendered on 2026-11-22. They stay unpublished until `ACCEPTANCE.md` is signed.

Every scene carries a top-left label: **In the app · sample data** for recreations of real, shipping screens
(labels copied from `packages/ui`), or **Story / Dramatization** for everything else. No film shows an offer, a
recruiter call, an ATS score or a response metric, and every film ends with the person submitting their own
applications.

## How it fits together

`src/films.json` is the single source of truth: scene lengths, labels, voiceover lines, the cutdowns and the
end-card claims. Everything else is generated from it.

```
films.json ─┬─ tools/voiceover.py  → public/audio/<slug>-vo.wav, src/generated/<slug>.cues.json, captions/<slug>.srt
            ├─ tools/visemes.py    → src/generated/<slug>.visemes.json   (lip-sync from the voice audio)
            ├─ tools/score.py      → public/audio/<slug>-score.wav       (original score, timed to the scenes)
            ├─ tools/mix.py        → public/audio/<slug>-mix.wav         (duck 12 dB, master −16 LUFS / −1.5 dBTP)
            └─ src/*.tsx           → the films (FilmShell lays scenes out from the same file)
```

Each caption phrase is synthesised on its own, so caption times come from the real audio. Captions are pre-wrapped
(≤ 2 lines, ≤ 32 characters, ≤ 20 characters per second) and the SRT files are written from the same cues as the
burned-in captions.

## Setup

```bash
npm install
python3.12 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile numpy
mkdir -p models && cd models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

`ffmpeg`/`ffprobe` and the authenticated `gh` CLI must be on the PATH.

## Build

```bash
npm run build          # everything below, in order; stops at the first failure
npm run verify:release # end-card claims vs the latest GitHub release  → out/checks/release.json
npm run audio          # voice, captions + SRT, visemes, score, mix
npm run check:source   # assets, claims lint, scene labels, product timing, captions/SRT, voice under captions, mix balance
npm run render         # out/<slug>.mp4 for all six, out/covers/*.png
npm run check:render   # spec, black/blank frames, loudness, true peak, dead air  → out/checks/report.md
npm run studio         # preview
```

The rendered MP4s, WAVs and check reports are generated, not committed. `ACCEPTANCE.md` records the last full run.

## Changing a film

Edit the line or scene length in `src/films.json`, then `npm run audio`. The voiceover build fails if a line cannot
fit before the next one. If a release adds a Windows or Intel Mac app, `verify:release` fails until the
`availability` claim is updated.

Launch copy for each platform is in `launch/copy.md`; asset licences are in `LICENSES.md`.
