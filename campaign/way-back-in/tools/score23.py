"""Placeholder scores for Films 2 and 3 (pure Python). Usage: score23.py film2|film3 out.wav"""
import math, random, struct, wave, sys
SR = 48000
film, out = sys.argv[1], sys.argv[2]
DUR = 35.0 if film == 'film2' else 30.0
N = int(SR * DUR); buf = [0.0] * N
random.seed(11)
def hz(m): return 440 * 2 ** ((m - 69) / 12)

def pluck(t0, midi, vel=0.4, dur=3.0):
    """Karplus-Strong string: warm acoustic-guitar-like pluck."""
    f = hz(midi); per = int(SR / f)
    ring = [random.uniform(-1, 1) for _ in range(per)]
    s = int(t0 * SR); prev = 0.0
    for i in range(int(dur * SR)):
        if s + i >= N: break
        j = i % per
        x = ring[j]
        ring[j] = 0.996 * 0.5 * (x + ring[(j + 1) % per])
        prev = 0.7 * prev + 0.3 * x  # soften
        buf[s + i] += vel * prev

def harmonic(t0, midi, vel=0.3, dur=3.0):
    f = hz(midi) * 2; s = int(t0 * SR)
    for i in range(int(dur * SR)):
        if s + i >= N: break
        t = i / SR
        buf[s + i] += vel * math.exp(-t * 1.2) * min(1, t / 0.005) * math.sin(2 * math.pi * f * t)

def pad(t0, t1, midis, vel=0.07, fade=1.2):
    s, e = int(t0 * SR), min(N, int(t1 * SR)); fs = [hz(m) for m in midis]
    for i in range(s, e):
        t = (i - s) / SR; rem = (e - i) / SR
        env = min(1, t / fade, rem / fade)
        buf[i] += vel * env * sum(math.sin(2 * math.pi * f * t) + 0.4 * math.sin(2 * math.pi * f * 1.004 * t) for f in fs) / len(fs)

def thump(t0, vel=0.32):
    s = int(t0 * SR)
    for i in range(int(0.3 * SR)):
        if s + i >= N: break
        t = i / SR; f = 50 + 70 * math.exp(-t * 32)
        buf[s + i] += vel * math.exp(-t * 10) * math.sin(2 * math.pi * f * t)

def hat(t0, vel=0.05):
    s = int(t0 * SR)
    for i in range(int(0.05 * SR)):
        if s + i >= N: break
        buf[s + i] += vel * math.exp(-i / SR * 90) * random.uniform(-1, 1)

def crackle(t0, t1, vel=0.02):
    for _ in range(int((t1 - t0) * 60)):
        s = int(random.uniform(t0, t1) * SR)
        for i in range(60):
            if s + i < N: buf[s + i] += vel * random.uniform(-1, 1) * math.exp(-i / 12)

def bell(t0, midi=81, vel=0.33):
    s = int(t0 * SR); f = hz(midi)
    for i in range(int(3.0 * SR)):
        if s + i >= N: break
        t = i / SR
        buf[s + i] += vel * math.exp(-t * 1.5) * (math.sin(2 * math.pi * f * t) + 0.4 * math.sin(2 * math.pi * f * 2.76 * t) * math.exp(-t * 3))

def room(t0):
    for i in range(int(t0 * SR), N): buf[i] += random.uniform(-1, 1) * 0.004

if film == 'film2':
    harmonic(0.2, 76, 0.35)                                     # single harmonic
    for t, m in [(5.0, 52), (5.4, 59), (5.8, 64), (6.4, 67), (7.0, 64)]:  # warm motif (sabbatical)
        pluck(t, m, 0.45)
    pad(4.8, 7.6, [52, 59, 64], 0.06)
    pad(7.6, 11.4, [64], 0.05)                                   # thins to one note
    beat = 60 / 92; t = 11.5
    while t < 27.2:
        thump(t)
        if t > 18: hat(t + beat / 2)
        t += beat
    for i, m in enumerate([64, 67, 71, 67, 62, 66, 69, 66, 60, 64, 67, 64, 62, 66, 69, 74]):
        pluck(11.5 + i * beat, m, 0.3, 2.0)
    pad(11.5, 27.5, [52, 59, 64, 67], 0.07)
    pad(22.0, 27.5, [71, 76], 0.04)
    pad(27.5, 30.5, [64, 71], 0.05)                              # resolves
    room(27.5)
    bell(31.9)
else:
    pluck(0.4, 40, 0.3, 2.5)
    pad(1.6, 10.2, [38, 45], 0.08, 2.0)                          # low drone
    crackle(6.0, 10.0)
    beat = 0.6; t = 10.1                                         # 100 BPM
    while t < 25.6:
        thump(t, 0.36); hat(t + beat / 2, 0.045); t += beat
    for i, m in enumerate([57, 60, 64, 67, 57, 60, 64, 69, 55, 59, 62, 67, 57, 60, 64, 72] * 2):
        pluck(10.1 + i * beat / 2, m, 0.2, 1.2) if 10.1 + i * beat / 2 < 25.5 else None
    pad(10.1, 25.6, [45, 52, 57, 60], 0.07)
    pad(18.0, 25.6, [69, 72, 76], 0.04)
    pad(25.6, 28.0, [57], 0.05, 0.5)
    room(25.6)
    bell(27.6)

g = 0.89 / max(abs(x) for x in buf)
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x * g)) * 32767)) for x in buf))
