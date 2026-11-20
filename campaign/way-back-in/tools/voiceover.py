"""Film voiceovers with Kokoro (local, Apache-2.0). Writes public/film1-vo.wav + src/film1-vo.json."""
import json, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

FILMS = {
  'film1': {'voice': 'am_michael', 'dur': 40.0, 'lines': [  # (window start s, window end s, text)
    (2.0, 6.0, "Fourteen months. Not because of my code. I was getting better."),
    (6.0, 11.0, "I came back. Rewrote my résumé nine times. Heard nothing."),
    (11.0, 14.0, "Honestly? The gap was in my head."),
    (14.0, 17.0, "So I stopped. And treated it like a project."),
    (17.0, 22.0, "I looked at where I actually fit, and where I didn't yet."),
    (22.0, 26.0, "Every application tailored. My words. Nothing sent without me."),
    (26.25, 30.0, "I practiced. Tracked everything. Followed up."),
    (30.4, 35.0, "Four months later..."),
    (35.0, 39.6, "The gap's still on my résumé. It's just not the headline anymore."),
  ]},
  'film2': {'voice': 'af_heart', 'dur': 35.0, 'lines': [
    (0.15, 3.5, "For eleven years, I said a career break isn't a red flag."),
    (3.5, 5.0, "Then I took one."),
    (5.0, 7.5, "Eighteen months. I'd do it again."),
    (7.5, 11.0, "But coming back? Harder than leaving."),
    (11.0, 14.0, "So I did what I'd tell anyone. Lead with what you can do."),
    (14.0, 18.0, "My experience still fit. One gap was real, so I closed it."),
    (18.0, 22.0, "I wrote the break into my story, in my own words."),
    (22.0, 27.0, "And I walked into every interview prepared."),
    (28.0, 31.0, "I'm back."),
    (31.3, 34.8, "A pause isn't a full stop."),
  ]},
  'film3': {'voice': 'am_fenrir', 'dur': 30.0, 'lines': [
    (0.1, 2.7, "One forty-two applications. Zero replies."),
    (2.95, 6.05, "The reports I used to build? They build themselves now."),
    (6.0, 10.0, "Then I saw what screening software saw in my résumé. Noise."),
    (10.0, 13.0, "Fine. I know how to fix bad data."),
    (13.0, 18.0, "Roles that fit. Experience that reads cleanly, to people and parsers."),
    (18.0, 22.0, "Day three, a recruiter called."),
    (22.0, 26.0, "Three weeks later, I had an offer."),
    (26.0, 29.7, "AI changed the market. It didn't change what I'm worth."),
  ]},
}
FILM = sys.argv[1] if len(sys.argv) > 1 else 'film1'
CFG = FILMS[FILM]
VOICE = sys.argv[2] if len(sys.argv) > 2 else CFG['voice']
LINES = CFG['lines']
k = Kokoro('models/kokoro-v1.0.onnx', 'models/voices-v1.0.bin')
SR_OUT = 48000
track = np.zeros(int(CFG['dur'] * SR_OUT), dtype=np.float32)
cues = []
for start, end, text in LINES:
    room = end - start - 0.25
    speed = 0.95
    while True:
        audio, sr = k.create(text, voice=VOICE, speed=speed, lang='en-us')
        # trim leading/trailing silence
        idx = np.where(np.abs(audio) > 0.01)[0]
        audio = audio[max(0, idx[0] - 200): idx[-1] + 2400]
        dur = len(audio) / sr
        if dur <= room or speed >= 1.1:
            break
        speed = round(speed + 0.05, 2)
    # resample 24k -> 48k (linear)
    x = np.interp(np.arange(0, len(audio), sr / SR_OUT), np.arange(len(audio)), audio).astype(np.float32)
    at = start + 0.1
    s = int(at * SR_OUT)
    track[s:s + len(x)] += x[: len(track) - s]
    cues.append({'start': round(at, 3), 'end': round(at + dur, 3), 'text': text.replace('...', '…')})
    print(f'{at:5.2f}s  {dur:4.2f}s / {room:4.2f}s  speed {speed}  {text}')
sf.write(f'public/{FILM}-vo.wav', np.stack([track, track], 1), SR_OUT)
json.dump(cues, open(f'src/{FILM}-vo.json', 'w'), ensure_ascii=False, indent=1)
