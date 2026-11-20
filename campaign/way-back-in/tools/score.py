"""Original score for each composition, synthesised from scratch (no samples, no third-party audio).

Usage: score.py <CompositionId|all>  ->  public/audio/<slug>-score.wav (stereo, 48 kHz)

The arrangement follows the scene layout in src/films.json, so full films and cutdowns both get a
score that lands on their own beats:
  story  [0, lift)    sparse and unresolved
  build  [lift, end)  pulse, arpeggio and pad: the turn, where the product appears
  resolve [end, ...)  the chord resolves and a single bell lands on the end card
"""
import sys
import numpy as np, soundfile as sf
from lib import DATA, FPS, SR, layout, p

rng = np.random.default_rng(7)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


class Track:
    def __init__(self, dur):
        self.n = int(dur * SR)
        self.L = np.zeros(self.n + SR * 4, np.float32)
        self.R = np.zeros(self.n + SR * 4, np.float32)

    def add(self, t0, x, pan=0.0):
        s = int(t0 * SR)
        if s >= self.n or s < 0:
            return
        x = x[: len(self.L) - s]
        self.L[s:s + len(x)] += x * (1 - max(0, pan))
        self.R[s:s + len(x)] += x * (1 + min(0, pan))

    def out(self):
        return np.stack([self.L[: self.n], self.R[: self.n]], 1)


def piano(midi, vel=0.3, dur=2.6):
    """Felt-piano-like tone: a few decaying partials and a soft hammer."""
    t = np.arange(int(dur * SR)) / SR
    f = hz(midi)
    x = sum(a * np.exp(-t * d) * np.sin(2 * np.pi * f * k * t) for k, a, d in [(1, 1, 1.6), (2, .45, 2.6), (3, .2, 4), (4, .08, 6)])
    att = np.minimum(1, t / 0.006)
    return (vel * att * x).astype(np.float32)


def pad(dur, midis, vel=0.06, fade=1.2):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, np.minimum(t / fade, (dur - t) / fade))
    x = sum(np.sin(2 * np.pi * hz(m) * t) + 0.4 * np.sin(2 * np.pi * hz(m) * 1.004 * t + 1.3) for m in midis) / len(midis)
    return (vel * env * x).astype(np.float32)


def thump(vel=0.3):
    t = np.arange(int(0.32 * SR)) / SR
    f = 50 + 70 * np.exp(-t * 32)
    return (vel * np.exp(-t * 10) * np.sin(2 * np.pi * np.cumsum(f) / SR)).astype(np.float32)


def hat(vel=0.04):
    t = np.arange(int(0.05 * SR)) / SR
    return (vel * np.exp(-t * 90) * rng.uniform(-1, 1, len(t))).astype(np.float32)


def bell(midi=81, vel=0.28):
    t = np.arange(int(3.2 * SR)) / SR
    f = hz(midi)
    return (vel * np.exp(-t * 1.5) * (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3))).astype(np.float32)


def crackle(dur, vel=0.018):
    x = np.zeros(int(dur * SR), np.float32)
    for s in rng.integers(0, len(x) - 80, int(dur * 50)):
        x[s:s + 60] += vel * rng.uniform(-1, 1, 60) * np.exp(-np.arange(60) / 12)
    return x


STYLE = {
    # chords as MIDI note lists, one per bar of the build
    'film1': {'bpm': 96, 'story': [57, 60, 64, 67], 'chords': [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
              'resolve': [48, 55, 64, 67], 'bell': 84, 'texture': None},
    'film2': {'bpm': 92, 'story': [52, 59, 64, 67], 'chords': [[52, 59, 64], [50, 57, 62], [48, 55, 64], [50, 57, 66]],
              'resolve': [52, 59, 64, 71], 'bell': 81, 'texture': None},
    'film3': {'bpm': 100, 'story': [45, 52], 'chords': [[45, 52, 57, 60], [41, 48, 57, 60], [43, 50, 55, 62], [45, 52, 57, 64]],
              'resolve': [45, 52, 57, 64], 'bell': 76, 'texture': 'crackle'},
}


def build(comp_id):
    L = layout(comp_id)
    st = STYLE[L['film']]
    T = Track(L['dur'])
    start = {s['id']: s['from'] / FPS for s in L['scenes']}
    lift = next((start[k] for k in L['lift'] if k in start), L['dur'] * 0.3)
    end = start.get('end', L['dur'] - 4.5)
    beat = 60 / st['bpm']

    # story: a sparse, unresolved figure over a quiet pad
    t, i = 0.35, 0
    while t < lift - 0.4:
        T.add(t, piano(st['story'][i % len(st['story'])] + 12, 0.16), pan=(-0.3 if i % 2 else 0.3))
        t += beat * 3; i += 1
    T.add(0, pad(lift + 0.6, st['story'][:2], 0.045, 1.5))
    if st['texture'] == 'crackle':
        T.add(max(0, lift - 4.5), crackle(4.4))

    # build: pulse, eighth-note arpeggio, chord pads (one chord per bar)
    bar = beat * 4
    t, b = lift, 0
    while t < end - 0.05:
        ch = st['chords'][b % len(st['chords'])]
        T.add(t, pad(min(bar + 0.6, end - t + 0.6), ch, 0.05, 0.4))
        for k in range(8):
            tk = t + k * beat / 2
            if tk >= end - 0.05:
                break
            T.add(tk, piano(ch[k % len(ch)] + 12 + (12 if k in (3, 7) else 0), 0.12, 1.4), pan=(-0.25 if k % 2 else 0.25))
            if k % 2 == 0:
                T.add(tk, thump(0.26 if b == 0 else 0.3))
            elif t - lift > 4:
                T.add(tk, hat(0.035), pan=0.2)
        t += bar; b += 1

    # resolve
    T.add(end, pad(L['dur'] - end + 0.2, st['resolve'], 0.06, 0.8))
    T.add(end + 0.5, piano(st['resolve'][0] + 12, 0.2, 3.5))
    T.add(min(end + 1.6, L['dur'] - 1.2), bell(st['bell']))

    x = T.out()
    # fade the last 0.6 s so the film does not end on a click
    fade = int(0.6 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    x *= 0.89 / max(1e-6, np.abs(x).max())
    sf.write(p('public', 'audio', f'{L["slug"]}-score.wav'), x, SR, subtype='PCM_24')
    print(f'{comp_id}: {L["dur"]:.2f}s, lift {lift:.2f}s, resolve {end:.2f}s')


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for cid in (DATA['compositions'] if arg == 'all' else [arg]):
        build(cid)
