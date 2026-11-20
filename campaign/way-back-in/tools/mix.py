"""Premix voice + score for a composition and master it to LinkedIn loudness.

Usage: mix.py <CompositionId|all>  ->  public/audio/<slug>-mix.wav and out/checks/<slug>-mix.json

Mixing here (not in Remotion) keeps the balance measurable:
  voice  normalised to -16 LUFS
  score  bed at -21 LUFS, ducked 12 dB under every caption phrase (0.25 s attack lead, 0.5 s release)
  master two-pass loudnorm to -16 LUFS integrated, -1.5 dBTP
"""
import json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from lib import DATA, SR, layout, lufs, p

DUCK_DB, LEAD, RELEASE = 12.0, 0.25, 0.5
VO_LUFS, BED_LUFS, TARGET, TP = -16.0, -21.0, -16.0, -1.5


def gain_to(x, target):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as fh:
        sf.write(fh.name, x, SR)
        m = lufs(fh.name)['I']
    os.unlink(fh.name)
    return x * 10 ** ((target - m) / 20)


def duck_env(cues, n):
    t = np.arange(n) / SR
    d = np.zeros(n, np.float32)
    for c in cues:
        a, b = c['speechStart'], c['speechEnd']
        up = np.clip((t - (a - LEAD)) / LEAD, 0, 1)
        down = np.clip(((b + RELEASE) - t) / RELEASE, 0, 1)
        d = np.maximum(d, np.minimum(up, down))
    return 10 ** (-DUCK_DB * d / 20)


def rms_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(x.astype(np.float64) ** 2)) + 1e-9))


def master(src, dst):
    a = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', f'loudnorm=I={TARGET}:TP={TP}:LRA=11:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = json.loads(re.findall(r'\{[^{}]+\}', a)[-1])
    af = (f'loudnorm=I={TARGET}:TP={TP}:LRA=11:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:'
          f'measured_LRA={m["input_lra"]}:measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-af', af, '-ar', str(SR), '-ac', '2',
                    '-c:a', 'pcm_s24le', dst], check=True)


def build(comp_id):
    L = layout(comp_id)
    slug = L['slug']
    vo, _ = sf.read(p('public', 'audio', f'{slug}-vo.wav'), dtype='float32')
    sc, _ = sf.read(p('public', 'audio', f'{slug}-score.wav'), dtype='float32')
    n = int(L['dur'] * SR)
    vo, sc = vo[:n], sc[:n]
    cues = json.load(open(p('src', 'generated', f'{slug}.cues.json'), encoding='utf-8'))
    vo = gain_to(vo, VO_LUFS)
    sc = gain_to(sc, BED_LUFS)
    env = duck_env(cues, n)[:, None]
    bed = sc * env
    mix = vo + bed
    raw = p('out', f'.{slug}-premaster.wav')
    os.makedirs(p('out', 'checks'), exist_ok=True)
    sf.write(raw, mix, SR, subtype='FLOAT')
    dst = p('public', 'audio', f'{slug}-mix.wav')
    master(raw, dst)
    os.unlink(raw)

    speech = np.zeros(n, bool)
    for c in cues:
        speech[int(c['speechStart'] * SR): int(c['speechEnd'] * SR)] = True
    metrics = {
        'composition': comp_id,
        'voice_rms_db_in_speech': round(rms_db(vo[speech]), 2),
        'music_rms_db_in_speech': round(rms_db(bed[speech]), 2),
        'music_rms_db_outside_speech': round(rms_db(bed[~speech]), 2) if (~speech).any() else None,
        'duck_db': DUCK_DB,
        **{f'master_{k}': v for k, v in lufs(dst).items()},
    }
    metrics['voice_over_music_db'] = round(metrics['voice_rms_db_in_speech'] - metrics['music_rms_db_in_speech'], 2)
    json.dump(metrics, open(p('out', 'checks', f'{slug}-mix.json'), 'w'), indent=1)
    print(f'{comp_id}: voice/music {metrics["voice_over_music_db"]} dB, {metrics["master_I"]} LUFS, TP {metrics["master_TP"]} dBFS')


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for cid in (DATA['compositions'] if arg == 'all' else [arg]):
        build(cid)
