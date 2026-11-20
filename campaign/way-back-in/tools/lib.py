"""Shared helpers: read src/films.json and lay a composition out on a timeline."""
import json, os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = json.load(open(os.path.join(ROOT, 'src', 'films.json'), encoding='utf-8'))
FPS = DATA['fps']
SR = 48000

# Caption rules (also enforced by tools/check.py)
MAX_LINE = 32        # characters per caption line
MAX_LINES = 2
MIN_SHOW = 1.0       # seconds a caption stays up at least
MAX_CPS = 20         # characters per second, reading speed ceiling


def p(*parts):
    return os.path.join(ROOT, *parts)


def comps():
    return DATA['compositions']


def layout(comp_id):
    """Scenes with absolute start frames, and VO lines with absolute start seconds."""
    comp = DATA['compositions'][comp_id]
    film = DATA['films'][comp['film']]
    scenes, lines, f = [], [], 0
    for sid in comp['scenes']:
        sc = film['scenes'][sid]
        scenes.append({'id': sid, 'from': f, 'frames': sc['frames'], 'tag': sc['tag']})
        for v in sc['vo']:
            lines.append({'scene': sid, 'at': f / FPS + v[0], 'spoken': v[1], 'caption': v[2] if len(v) > 2 else v[1]})
        f += sc['frames']
    return {'id': comp_id, 'slug': comp['slug'], 'film': comp['film'], 'frames': f, 'dur': f / FPS,
            'scenes': scenes, 'lines': lines, 'voice': film['voice'], 'lift': film['lift'], 'presenter': film['presenter']}


def phrases(text):
    """Split a line into caption-sized phrases: sentences first, then at commas if still long."""
    out = []
    for s in re.findall(r'[^.?!…]+[.?!…]*', text):
        s = s.strip()
        if not s:
            continue
        if len(s) <= MAX_LINE * MAX_LINES - 20:
            out.append(s)
            continue
        parts = [x.strip() for x in re.split(r'(?<=,)\s+', s)]
        buf = ''
        for x in parts:
            if buf and len(buf) + 1 + len(x) > MAX_LINE * MAX_LINES - 20:
                out.append(buf); buf = x
            else:
                buf = f'{buf} {x}'.strip()
        if buf:
            out.append(buf)
    return out


def wrap(text):
    """Balanced wrap into at most two lines of MAX_LINE characters."""
    if len(text) <= MAX_LINE:
        return [text]
    words = text.split(' ')
    best = None
    for i in range(1, len(words)):
        a, b = ' '.join(words[:i]), ' '.join(words[i:])
        score = max(len(a), len(b))
        if best is None or score < best[0]:
            best = (score, [a, b])
    return best[1]


def lufs(path):
    """Integrated loudness and true peak via ffmpeg's EBU R128 meter."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    i = re.findall(r'I:\s+(-?[\d.]+|-inf) LUFS', r.stderr)
    tp = re.findall(r'Peak:\s+(-?[\d.]+|-inf) dBFS', r.stderr)
    lra = re.findall(r'LRA:\s+(-?[\d.]+) LU', r.stderr)
    f = lambda v: float('-inf') if v == '-inf' else float(v)
    return {'I': f(i[-1]) if i else None, 'TP': f(tp[-1]) if tp else None, 'LRA': float(lra[-1]) if lra else None}
