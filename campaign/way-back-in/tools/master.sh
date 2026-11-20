#!/bin/sh
# Loudness-master a render to -16 LUFS for LinkedIn, keep the video stream as-is.
ffmpeg -loglevel error -y -i "$1" -c:v copy -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -movflags +faststart "$2" && rm "$1"
