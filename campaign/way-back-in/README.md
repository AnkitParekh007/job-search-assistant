# The Way Back In · LinkedIn films

Three 4:5 (1080×1350) launch films, built in code with [Remotion](https://www.remotion.dev):

| Composition | Film | Length | Presenter |
|---|---|---|---|
| `Film1` | Commit History | 40 s | Daniel |
| `Film2` | Return Date | 35 s | Priya |
| `Film3` | Parsed | 30 s | Tomás |

Each film has a lip-synced 3D presenter in the corner, a local voiceover, burned-in captions, a placeholder score, and a mix mastered to about −16 LUFS. Live-action shots are labelled placeholder frames ("LIVE-ACTION SLOT") until real or AI-generated footage is dropped in. Pass `showSlates: false` to hide the labels.

## Setup

```bash
npm install
python3.12 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
mkdir -p models && cd models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```

## Build the audio (the WAVs are generated, not committed)

```bash
python3 tools/score.py public/film1-score-raw.wav
python3 tools/score23.py film2 public/film2-score-raw.wav
python3 tools/score23.py film3 public/film3-score-raw.wav
for f in film1 film2 film3; do
  ffmpeg -y -i public/$f-score-raw.wav -af "loudnorm=I=-18:TP=-1.5:LRA=11" -ar 48000 -ac 2 public/$f-score.wav
  .venv/bin/python tools/voiceover.py $f          # writes public/$f-vo.wav and src/$f-vo.json
  .venv/bin/python tools/visemes.py public/$f-vo.wav src/$f-visemes.json
done
```

The voiceover lines, voices and timing windows are in `tools/voiceover.py`. The mouth shapes come from the voiceover audio itself (`tools/visemes.py`), so re-run it whenever a voiceover changes.

## Render

```bash
npm run render:film1   # out/film1-commit-history-4x5.mp4
npm run render:film2   # out/film2-return-date-4x5.mp4
npm run render:film3   # out/film3-parsed-4x5.mp4
npm run studio         # preview, including the AvatarLineup composition
```

`tools/master.sh` masters loudness to −16 LUFS and keeps the video stream as it is. `captions/film1-vo.srt` is a plain SRT for LinkedIn's caption upload.

## Before publishing

- Film 1 names Anthropic. It needs Anthropic's written sign-off, or set `company` to the fallback.
- LinkedIn recommends 15–30 s for every ad placement. Cut Films 1 and 2 down for paid use.
- Fonts are Google stand-ins (Bricolage Grotesque, Figtree) for Cabinet Grotesk and Satoshi.
- The score is a synthesised placeholder. Replace it with licensed music for paid use.
