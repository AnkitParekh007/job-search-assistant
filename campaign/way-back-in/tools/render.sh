#!/bin/sh
# Final renders: H.264 / yuv420p / AAC 192k, faststart. The premixed audio is already mastered to -16 LUFS.
# Usage: sh tools/render.sh [CompositionId ...]   (default: all films, cutdowns and covers)
set -e
cd "$(dirname "$0")/.."
COMPS=${*:-"Film2 Film1 Film3 Film2Short Film1Short Film3Short"}
slug() { .venv/bin/python -c "import sys; sys.path.insert(0,'tools'); from lib import DATA; print(DATA['compositions']['$1']['slug'])"; }
mkdir -p out/covers
for c in $COMPS; do
  s=$(slug "$c")
  npx remotion render "$c" "out/.$s.mp4" --gl=angle --codec=h264 --crf=18 --pixel-format=yuv420p \
    --audio-codec=aac --audio-bitrate=192k --log=error
  ffmpeg -loglevel error -y -i "out/.$s.mp4" -c copy -movflags +faststart "out/$s.mp4" && rm "out/.$s.mp4"
  echo "rendered out/$s.mp4"
done
if [ -z "$*" ]; then
  for n in 1 2 3; do npx remotion still "Cover$n" "out/covers/cover-film$n-4x5.png" --gl=angle --log=error; done
  echo "rendered out/covers"
fi
