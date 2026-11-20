"""Synthesised placeholder score for Film 1 (felt piano, pad, 90 BPM pulse, bell).
Pure Python, no deps. Writes public/film1-score-raw.wav (mono 48 kHz)."""
import math, random, struct, wave, sys
SR = 48000; DUR = 40.0
N = int(SR * DUR); buf = [0.0] * N
random.seed(7)
def hz(m): return 440 * 2 ** ((m - 69) / 12)

def piano(t0, midi, vel=0.5, dur=3.5):
    f = hz(midi); s = int(t0 * SR); n = int(dur * SR)
    for i in range(n):
        if s + i >= N: break
        t = i / SR
        env = min(1, t / 0.008) * math.exp(-t * 1.6)
        x = (math.sin(2*math.pi*f*t) + 0.35*math.sin(2*math.pi*2*f*t)*math.exp(-t*3)
             + 0.12*math.sin(2*math.pi*3*f*t)*math.exp(-t*5))
        buf[s+i] += vel * env * x * 0.5   # soft, "felt" — few upper partials

def pad(t0, t1, midis, vel=0.08, fade=1.5):
    s, e = int(t0*SR), min(N, int(t1*SR))
    fs = [hz(m) for m in midis]
    for i in range(s, e):
        t = (i - s) / SR; rem = (e - i) / SR
        env = min(1, t / fade, rem / fade)
        x = sum(math.sin(2*math.pi*f*t + 0.3*math.sin(2*math.pi*0.2*t)) + 0.5*math.sin(2*math.pi*f*1.003*t) for f in fs)
        buf[i] += vel * env * x / len(fs)

def thump(t0, vel=0.35):
    s = int(t0*SR)
    for i in range(int(0.35*SR)):
        if s+i >= N: break
        t = i / SR
        f = 48 + 60*math.exp(-t*30)
        buf[s+i] += vel * math.exp(-t*9) * math.sin(2*math.pi*f*t)

def bell(t0, vel=0.35):
    s = int(t0*SR)
    for i in range(int(3.5*SR)):
        if s+i >= N: break
        t = i/SR; f = hz(81)
        buf[s+i] += vel*math.exp(-t*1.4)*(math.sin(2*math.pi*f*t)+0.4*math.sin(2*math.pi*f*2.76*t)*math.exp(-t*3))

# 0:00–0:02 silence, one low note on "0"
piano(0.75, 45, 0.55, 4)
# struggle: sparse A-minor motif + low pad
for t, m in [(2.4,57),(3.7,60),(5.0,64),(6.6,62),(8.0,60),(9.4,57),(11.2,64),(12.6,60)]:
    piano(t, m, 0.32)
pad(2.0, 13.8, [45, 52, 57], 0.07)
# turn: resolves to major; pulse enters on the coral underline (~15.7 s)
piano(14.1, 60, 0.4); piano(14.1, 64, 0.3); piano(14.1, 67, 0.3)
pad(14.0, 30.0, [48, 55, 60, 64], 0.08)
beat = 60/90
t = 15.67
while t < 30.0:
    thump(t); t += beat
for i, m in enumerate([67,72,76,72, 69,72,76,72, 65,69,72,69, 67,72,76,79]):
    piano(17.0 + i*beat, m, 0.16, 1.5)
# 0:26 second synth layer
pad(26.0, 30.0, [72, 76, 79], 0.05, 0.8)
# 0:30 music drops out: room tone + one sustained pad note
pad(30.0, 36.8, [60], 0.06, 0.6)
for i in range(int(30.0*SR), N):
    buf[i] += random.uniform(-1, 1) * 0.004
# bell under the logo, then silence
bell(37.1)

peak = max(abs(x) for x in buf)
g = 0.89 / peak
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x*g)) * 32767)) for x in buf))
