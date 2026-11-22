"""Automated checks for the campaign. Exit 1 on any failure.

Usage:
  check.py source            before render: assets, claims lint, scene labels, product timing, captions + SRT
  check.py render [Comp...]  after render: export spec, black/blank frames, loudness, voice under captions
  check.py all               both

Writes out/checks/report.json and out/checks/report.md.
These checks do not replace watching and listening to every film; they catch what a person misses.
"""
import json, os, re, struct, subprocess, sys
import numpy as np, soundfile as sf
from lib import DATA, FPS, MAX_CPS, MAX_LINE, MAX_LINES, MIN_SHOW, SR, comps, layout, lufs, p

results = []


def rec(group, name, ok, detail='', warn=False):
    status = 'PASS' if ok else ('WARN' if warn else 'FAIL')
    results.append({'group': group, 'check': name, 'status': status, 'detail': detail})
    if status != 'PASS':
        print(f'{status}  [{group}] {name}: {detail}')


# ---------------------------------------------------------------- source checks

FORBIDDEN = [
    (r'\bAnthropic\b', 'names a real company as a fictional employer'),
    (r'LIVE-ACTION|LiveSlot|showSlates', 'placeholder slot left in'),
    (r'Mac\s*(&|&amp;|and)\s*Windows', 'implies a ready-to-run Windows app; v0.1.x ships Windows as source'),
    (r'Download free', 'download claim without platform detail'),
    (r'\boffer\b|Offer ·|recruiter call|recruiter called|first call', 'fictional outcome'),
    (r'ATS Intelligence|parse score|pass rate|ATS score|ATS-friendly|beat the ATS', 'unshipped or unsupported ATS claim'),
    (r'\d+\s?% (more|higher|faster|response|interview)', 'unsupported outcome statistic'),
    (r'Results vary', 'implies results; use the verified disclaimer'),
    (r'Approved by you|✓ Approved', 'invented approval UI; use the real ApprovalCard'),
]
ALLOW = [r'No outcome is guaranteed', r'No tool can promise', r'^- No outcomes:']


def lint_text(where, text):
    bad = []
    for pat, why in FORBIDDEN:
        for m in re.finditer(pat, text, re.I):
            line = text[: m.start()].count('\n') + 1
            ctx = text.splitlines()[line - 1] if text.splitlines() else ''
            if any(re.search(a, ctx) for a in ALLOW) or 'FORBIDDEN' in ctx:
                continue
            bad.append(f'{where}:{line} "{m.group(0)}" ({why})')
    return bad


def source_checks():
    # 1 · claims lint across everything a viewer can see or read
    files = [os.path.join(d, f) for d in [p('src'), p('captions'), p('launch')] if os.path.isdir(d)
             for f in sorted(os.listdir(d)) if f.endswith(('.tsx', '.json', '.srt', '.md'))]
    bad = []
    for fn in files:
        if fn.endswith('.visemes.json'):
            continue
        text = open(fn, encoding='utf-8').read()
        if fn.endswith('.tsx'):  # lint what renders, not code comments (keep line numbers)
            blank = lambda m: re.sub(r'[^\n]', ' ', m.group(0))
            text = re.sub(r'/\*.*?\*/', blank, text, flags=re.S)
            text = re.sub(r'(?m)^\s*//.*$', blank, text)
        bad += lint_text(os.path.relpath(fn, p()), text)
    rec('claims', 'no forbidden claims in source, captions or launch copy', not bad, '; '.join(bad[:12]))

    for cid in comps():
        L = layout(cid)
        slug = L['slug']
        g = f'source:{cid}'
        # 2 · assets
        need = [p('public', 'audio', f'{slug}-mix.wav'), p('src', 'generated', f'{slug}.cues.json'),
                p('src', 'generated', f'{slug}.visemes.json'), p('captions', f'{slug}.srt')]
        missing = [os.path.relpath(x, p()) for x in need if not os.path.exists(x)]
        rec(g, 'assets present', not missing, ', '.join(missing))
        if missing:
            continue
        vis = json.load(open(need[2]))
        rec(g, 'visemes cover every frame', len(vis) >= L['frames'] - 1, f'{len(vis)} of {L["frames"]} frames')
        mix, sr = sf.read(need[0])
        rec(g, 'mix length matches film', abs(len(mix) / sr - L['dur']) < 0.05 and sr == SR, f'{len(mix) / sr:.2f}s @ {sr} Hz vs {L["dur"]:.2f}s')

        # 3 · every scene says whether it is the story or the app
        untagged = [s['id'] for s in L['scenes'] if s['tag'][0] not in ('story', 'app') or not s['tag'][1]]
        rec(g, 'every scene labelled story/app', not untagged, ', '.join(untagged))
        first_app = next((s['from'] for s in L['scenes'] if s['tag'][0] == 'app'), None)
        rec(g, 'product visible in the first third', first_app is not None and first_app <= L['frames'] / 3,
            f'first app scene at {first_app / FPS if first_app is not None else None:.2f}s, third = {L["dur"] / 3:.2f}s')
        if DATA['compositions'][cid].get('aspect') == '9:16':
            rec(g, 'product on screen within 3 seconds', first_app is not None and first_app <= 3 * FPS,
                f'first app scene at {first_app / FPS if first_app is not None else None:.2f}s')
        rec(g, 'opens with a dramatization label', 'Dramatization' in L['scenes'][0]['tag'][1], L['scenes'][0]['tag'][1])

        # 4 · captions
        cues = json.load(open(need[1], encoding='utf-8'))
        spoken = ' '.join(l['caption'] for l in L['lines'])
        rec(g, 'captions carry every voiceover line', re.sub(r'\W', '', ' '.join(c['text'] for c in cues)) == re.sub(r'\W', '', spoken))
        probs, warns = [], []
        for i, c in enumerate(cues):
            if len(c['lines']) > MAX_LINES or any(len(x) > MAX_LINE for x in c['lines']):
                probs.append(f'#{i + 1} layout {c["lines"]}')
            dur = c['end'] - c['start']
            if dur <= 0 or c['start'] < 0 or c['end'] > L['dur']:
                probs.append(f'#{i + 1} bad timing {c["start"]}-{c["end"]}')
            if i and c['start'] < cues[i - 1]['end']:
                probs.append(f'#{i + 1} overlaps previous')
            if c['speechStart'] < c['start'] - 0.01 or c['speechEnd'] > c['end'] + 0.01:
                probs.append(f'#{i + 1} caption hides while voice is speaking')
            if len(c['text']) / dur > MAX_CPS:
                probs.append(f'#{i + 1} {len(c["text"]) / dur:.1f} chars/s')
            if dur < MIN_SHOW - 0.01:
                warns.append(f'#{i + 1} on screen {dur:.2f}s')
        rec(g, 'caption layout, timing and reading speed', not probs, '; '.join(probs))
        if warns:
            rec(g, 'caption minimum display time', False, '; '.join(warns), warn=True)
        # 5 · SRT matches the burned-in captions
        srt = open(need[3], encoding='utf-8').read().strip().split('\n\n')
        ok = len(srt) == len(cues)
        for blk, c in zip(srt, cues):
            rows = blk.strip().splitlines()
            m = re.match(r'(\d+):(\d+):(\d+),(\d+) --> (\d+):(\d+):(\d+),(\d+)', rows[1])
            t = [int(x) for x in m.groups()]
            a = t[0] * 3600 + t[1] * 60 + t[2] + t[3] / 1000
            b = t[4] * 3600 + t[5] * 60 + t[6] + t[7] / 1000
            ok &= abs(a - c['start']) < 0.002 and abs(b - c['end']) < 0.002 and rows[2:] == c['lines']
        rec(g, 'SRT matches burned-in captions', ok, f'{len(srt)} SRT cues, {len(cues)} burned-in')
        # 6 · the voice is really there under every caption
        vo, _ = sf.read(p('public', 'audio', f'{slug}-vo.wav'))
        vo = vo.mean(1) if vo.ndim > 1 else vo
        quiet = []
        for i, c in enumerate(cues):
            seg = vo[int(c['speechStart'] * SR): int(c['speechEnd'] * SR)]
            if len(seg) == 0 or 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9) < -40:
                quiet.append(f'#{i + 1}')
        rec(g, 'voice present under every caption', not quiet, ', '.join(quiet))
        # 7 · mix balance
        mj = p('out', 'checks', f'{slug}-mix.json')
        if os.path.exists(mj):
            m = json.load(open(mj))
            rec(g, 'voice sits ≥ 12 dB over music while speaking', m['voice_over_music_db'] >= 12, f'{m["voice_over_music_db"]} dB')


# ---------------------------------------------------------------- render checks

def ffprobe(fn):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', fn], capture_output=True, text=True)
    return json.loads(r.stdout)


def faststart(fn):
    with open(fn, 'rb') as fh:
        pos, order = 0, []
        size_all = os.path.getsize(fn)
        while pos < size_all:
            fh.seek(pos)
            hdr = fh.read(16)
            if len(hdr) < 8:
                break
            size, kind = struct.unpack('>I4s', hdr[:8])
            if size == 1:
                size = struct.unpack('>Q', hdr[8:16])[0]
            order.append(kind.decode('latin1'))
            if size == 0:
                break
            pos += size
    return 'moov' in order and 'mdat' in order and order.index('moov') < order.index('mdat')


def render_checks(only):
    for cid in comps():
        if only and cid not in only:
            continue
        L = layout(cid)
        fn = p('out', f'{L["slug"]}.mp4')
        g = f'render:{cid}'
        if not os.path.exists(fn):
            rec(g, 'rendered file exists', False, os.path.relpath(fn, p()))
            continue
        info = ffprobe(fn)
        v = next(s for s in info['streams'] if s['codec_type'] == 'video')
        a = next((s for s in info['streams'] if s['codec_type'] == 'audio'), None)
        dur = float(info['format']['duration'])
        size = os.path.getsize(fn) / 1e6
        expect = (1080, 1920) if DATA['compositions'][cid].get('aspect') == '9:16' else (1080, 1350)
        rec(g, f'video H.264, yuv420p, {expect[0]}x{expect[1]}, 30 fps', v['codec_name'] == 'h264' and v['pix_fmt'] == 'yuv420p'
            and (v['width'], v['height']) == expect and v['r_frame_rate'] == '30/1',
            f"{v['codec_name']} {v['pix_fmt']} {v['width']}x{v['height']} {v['r_frame_rate']}")
        rec(g, 'frame count matches script', int(v.get('nb_frames', 0)) == L['frames'], f"{v.get('nb_frames')} vs {L['frames']}")
        rec(g, 'audio AAC 48 kHz stereo', a is not None and a['codec_name'] == 'aac' and a['sample_rate'] == '48000' and a['channels'] == 2,
            f"{a and a['codec_name']} {a and a['sample_rate']} {a and a['channels']}ch")
        rec(g, 'duration 3 s – 10 min and matches script', 3 <= dur <= 600 and abs(dur - L['dur']) < 0.1, f'{dur:.2f}s vs {L["dur"]:.2f}s')
        rec(g, 'file under 200 MB (LinkedIn limit)', size < 200, f'{size:.1f} MB')
        rec(g, 'moov atom first (faststart)', faststart(fn))
        # black frames: true black, not the film's near-black ink
        r = subprocess.run(['ffmpeg', '-hide_banner', '-i', fn, '-vf', 'blackdetect=d=0.2:pix_th=0.02:pic_th=0.98', '-an', '-f', 'null', '-'],
                           capture_output=True, text=True).stderr
        blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', r)
        rec(g, 'no black frames', not blacks, ', '.join(f'{x}-{y}s' for x, y in blacks))
        # blank frames: nothing on screen brighter than the background
        r = subprocess.run(['ffmpeg', '-hide_banner', '-i', fn, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YMAX:file=-', '-an', '-f', 'null', '-'],
                           capture_output=True, text=True).stdout
        ymax = [float(x) for x in re.findall(r'YMAX=([\d.]+)', r)]
        run, worst = 0, 0
        for y in ymax:
            run = run + 1 if y < 70 else 0
            worst = max(worst, run)
        rec(g, 'no blank stretch over 0.3 s', worst <= 9, f'longest blank run {worst} frames')
        # loudness
        m = lufs(fn)
        rec(g, 'loudness -16 LUFS ±1', m['I'] is not None and abs(m['I'] + 16) <= 1, f"{m['I']} LUFS")
        rec(g, 'true peak ≤ -1 dBTP', m['TP'] is not None and m['TP'] <= -1.0, f"{m['TP']} dBTP")
        # no silent gaps longer than 1.5 s in the master (music bed should carry it)
        r = subprocess.run(['ffmpeg', '-hide_banner', '-i', fn, '-af', 'silencedetect=n=-50dB:d=1.5', '-vn', '-f', 'null', '-'],
                           capture_output=True, text=True).stderr
        sil = re.findall(r'silence_start: ([\d.]+)', r)
        rec(g, 'no dead air over 1.5 s', not sil, ', '.join(sil))


def write_report():
    os.makedirs(p('out', 'checks'), exist_ok=True)
    json.dump(results, open(p('out', 'checks', 'report.json'), 'w'), indent=1, ensure_ascii=False)
    rows = ['| Group | Check | Result | Detail |', '|---|---|---|---|']
    rows += [f"| {r['group']} | {r['check']} | {r['status']} | {r['detail'].replace('|', '/')} |" for r in results]
    fails = sum(r['status'] == 'FAIL' for r in results)
    warns = sum(r['status'] == 'WARN' for r in results)
    head = f'# Automated checks\n\n{len(results)} checks · {fails} failed · {warns} warnings\n\n'
    open(p('out', 'checks', 'report.md'), 'w').write(head + '\n'.join(rows) + '\n')
    print(f'{len(results)} checks · {fails} failed · {warns} warnings  ->  out/checks/report.md')
    return fails


if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    only = sys.argv[2:]
    if mode in ('source', 'all'):
        source_checks()
    if mode in ('render', 'all'):
        render_checks(only)
    sys.exit(1 if write_report() else 0)
