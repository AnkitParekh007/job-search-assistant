"""Per-frame mouth shapes from a voiceover WAV (no external lip-sync tool).
open  = loudness envelope (jaw drop)
wide  = share of high-frequency energy (ee, s, t: lips spread, teeth show)
round = share of low-frequency energy while voiced (oo, o, w: lips pucker)
Usage: visemes.py <CompositionId|all>. Reads public/audio/<slug>-vo.wav and writes
src/generated/<slug>.visemes.json with one [open, wide, round] triple per frame."""
import json, sys
import numpy as np, soundfile as sf
from lib import DATA, FPS, layout, p


def build(comp_id):
  L = layout(comp_id)
  wav, out, fps = p('public', 'audio', f"{L['slug']}-vo.wav"), p('src', 'generated', f"{L['slug']}.visemes.json"), FPS
  x, sr = sf.read(wav)
  if x.ndim > 1: x = x.mean(1)
  hop = sr // fps; win = hop * 2
  frames = len(x) // hop
  rms, hi, lo = [], [], []
  freqs = np.fft.rfftfreq(win, 1 / sr)
  for i in range(frames):
      seg = x[max(0, i * hop - hop // 2): i * hop - hop // 2 + win]
      if len(seg) < win: seg = np.pad(seg, (0, win - len(seg)))
      spec = np.abs(np.fft.rfft(seg * np.hanning(win))) ** 2
      tot = spec[(freqs > 80) & (freqs < 8000)].sum() + 1e-12
      rms.append(np.sqrt(np.mean(seg ** 2)))
      hi.append(spec[(freqs > 2500) & (freqs < 8000)].sum() / tot)
      lo.append(spec[(freqs > 80) & (freqs < 700)].sum() / tot)
  rms, hi, lo = map(np.array, (rms, hi, lo))
  ref = np.percentile(rms[rms > 1e-4], 95) if (rms > 1e-4).any() else 1
  open_ = np.clip((rms / ref) ** 0.7, 0, 1)
  open_[rms < ref * 0.06] = 0
  def smooth(a, k=0.55):  # attack fast, release a bit slower
      o = np.zeros_like(a)
      for i in range(len(a)):
          p = o[i - 1] if i else 0
          o[i] = a[i] if a[i] > p else p * k + a[i] * (1 - k)
      return o
  open_ = smooth(open_)
  voiced = open_ > 0.05
  wide = np.where(voiced, np.clip((hi - 0.04) / 0.25, 0, 1), 0)
  round_ = np.where(voiced, np.clip((lo - 0.55) / 0.35, 0, 1) * (1 - wide), 0)
  data = [[round(float(a), 3), round(float(b), 3), round(float(c), 3)] for a, b, c in zip(open_, smooth(wide, .4), smooth(round_, .4))]
  json.dump(data, open(out, 'w'), separators=(',', ':'))
  print(f'{comp_id}: {len(data)} frames, speaking {voiced.mean()*100:.0f}% of the time')


if __name__ == '__main__':
  arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
  for cid in (DATA['compositions'] if arg == 'all' else [arg]):
    build(cid)
