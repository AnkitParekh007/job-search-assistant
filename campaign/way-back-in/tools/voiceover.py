"""Voiceover, caption cues and SRT for a composition, with Kokoro (local, Apache-2.0).

Usage: voiceover.py <CompositionId|all>
Writes public/audio/<slug>-vo.wav, src/generated/<slug>.cues.json and captions/<slug>.srt.

Every caption phrase is synthesised on its own and then joined, so cue times come from the real
audio instead of being estimated. A line that cannot fit before the next line starts fails the build.
"""
import hashlib, json, os, sys
import numpy as np, soundfile as sf
from lib import DATA, FPS, MAX_CPS, MAX_LINE, MIN_SHOW, SR, layout, p, phrases, wrap

BASE_SPEED, MAX_SPEED = 0.95, 1.12
GAP_SENTENCE, GAP_COMMA = 0.24, 0.12
CACHE = p('.cache', 'tts')
_kokoro = None


def tts(text, voice, speed):
    global _kokoro
    os.makedirs(CACHE, exist_ok=True)
    key = hashlib.sha1(f'{voice}|{speed}|{text}'.encode()).hexdigest()[:16]
    fn = os.path.join(CACHE, key + '.npy')
    if os.path.exists(fn):
        return np.load(fn)
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(p('models', 'kokoro-v1.0.onnx'), p('models', 'voices-v1.0.bin'))
    audio, sr = _kokoro.create(text, voice=voice, speed=speed, lang='en-us')
    idx = np.where(np.abs(audio) > 0.01)[0]
    audio = audio[max(0, idx[0] - 240): idx[-1] + 1200]   # trim, keep a short natural tail
    x = np.interp(np.arange(0, len(audio), sr / SR), np.arange(len(audio)), audio).astype(np.float32)
    np.save(fn, x)
    return x


def render_line(spoken, caption, voice, room):
    sp, cp = phrases(spoken), phrases(caption)
    if len(sp) != len(cp):
        raise SystemExit(f'Caption and spoken text split differently:\n  {spoken}\n  {caption}')
    speed = BASE_SPEED
    while True:
        parts = [tts(t, voice, speed) for t in sp]
        gaps = [GAP_COMMA if sp[i].endswith(',') else GAP_SENTENCE for i in range(len(sp) - 1)] + [0]
        total = sum(len(a) for a in parts) / SR + sum(gaps)
        if total <= room or speed >= MAX_SPEED:
            break
        speed = round(speed + 0.03, 2)
    if total > room:
        raise SystemExit(f'Line does not fit ({total:.2f}s > {room:.2f}s at speed {speed}): {spoken}')
    return parts, gaps, cp, speed, total


def build(comp_id):
    L = layout(comp_id)
    track = np.zeros(int(L['dur'] * SR) + SR, dtype=np.float32)
    cues = []
    for k, line in enumerate(L['lines']):
        nxt = L['lines'][k + 1]['at'] if k + 1 < len(L['lines']) else L['dur'] - 0.2
        room = nxt - line['at'] - 0.12
        parts, gaps, caps, speed, total = render_line(line['spoken'], line['caption'], L['voice'], room)
        t = line['at']
        line_cues = []
        for a, g, cap in zip(parts, gaps, caps):
            s = int(t * SR)
            track[s:s + len(a)] += a
            line_cues.append({'speechStart': round(t, 3), 'speechEnd': round(t + len(a) / SR, 3), 'text': cap})
            t += len(a) / SR + g
        # A very short phrase ("Fine.", "Honestly?") would flash by: show it with the next phrase instead.
        merged = []
        for c in line_cues:
            if merged and len(merged[-1]['text']) < 12 and len(merged[-1]['text']) + 1 + len(c['text']) <= MAX_LINE * 2 - 8:
                merged[-1] = {'speechStart': merged[-1]['speechStart'], 'speechEnd': c['speechEnd'], 'text': f"{merged[-1]['text']} {c['text']}"}
            else:
                merged.append(c)
        cues += [{**c, 'lines': wrap(c['text'])} for c in merged]
        print(f'  {line["at"]:6.2f}s  {total:4.2f}/{room:4.2f}s  x{speed}  {line["spoken"]}')
    # Display times: hold each caption long enough to read, never overlapping the next one.
    for i, c in enumerate(cues):
        nxt = cues[i + 1]['speechStart'] if i + 1 < len(cues) else L['dur']
        need = max(MIN_SHOW, len(c['text']) / MAX_CPS)
        end = max(c['speechEnd'] + 0.25, c['speechStart'] + need)
        c['start'] = round(max(0.0, c['speechStart'] - 0.05), 3)
        c['end'] = round(min(end, nxt - 0.08), 3)
    track = track[: int(L['dur'] * SR)]
    os.makedirs(p('public', 'audio'), exist_ok=True)
    os.makedirs(p('src', 'generated'), exist_ok=True)
    os.makedirs(p('captions'), exist_ok=True)
    sf.write(p('public', 'audio', f'{L["slug"]}-vo.wav'), np.stack([track, track], 1), SR, subtype='PCM_24')
    json.dump(cues, open(p('src', 'generated', f'{L["slug"]}.cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    write_srt(cues, p('captions', f'{L["slug"]}.srt'))


def ts(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def write_srt(cues, path):
    with open(path, 'w', encoding='utf-8', newline='\r\n') as fh:
        for i, c in enumerate(cues, 1):
            fh.write(f'{i}\n{ts(c["start"])} --> {ts(c["end"])}\n' + '\n'.join(c['lines']) + '\n\n')


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for cid in (DATA['compositions'] if arg == 'all' else [arg]):
        print(cid)
        build(cid)
