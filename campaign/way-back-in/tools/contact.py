"""Contact sheet for review: frames sampled inside every scene of a rendered composition.

Usage: contact.py <CompositionId> <video.mp4> [points]  ->  out/review/<slug>-sheet.jpg
points: comma-separated positions inside each scene, 0..1 (default 0.35,0.85).
Scenes run left to right, top to bottom; each row is one scene.
"""
import os, subprocess, sys, tempfile
from lib import FPS, layout, p

cid, video = sys.argv[1], sys.argv[2]
pts = [float(x) for x in (sys.argv[3] if len(sys.argv) > 3 else '0.35,0.85').split(',')]
L = layout(cid)
frames = [int(s['from'] + s['frames'] * q) for s in L['scenes'] for q in pts]
os.makedirs(p('out', 'review'), exist_ok=True)
expr = '+'.join(f'eq(n\\,{n})' for n in frames)
dst = p('out', 'review', f'{L["slug"]}-sheet.jpg')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-vf',
                f"select='{expr}',scale=360:-1,tile={len(pts) * 2}x{(len(frames) + len(pts) * 2 - 1) // (len(pts) * 2)}:padding=6:color=0x222222",
                '-frames:v', '1', '-q:v', '3', dst], check=True)
print(dst)
print('frames:', ', '.join(f'{s["id"]}@{n}' for s in L['scenes'] for n in [int(s['from'] + s['frames'] * q) for q in pts]))
