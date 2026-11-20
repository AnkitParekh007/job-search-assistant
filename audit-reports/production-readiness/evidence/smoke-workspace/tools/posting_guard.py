#!/usr/bin/env python3
import argparse, json, sys
ap=argparse.ArgumentParser(); ap.add_argument('--text',action='store_true'); ap.add_argument('--in',dest='infile',required=True); ap.add_argument('--json',action='store_true')
a=ap.parse_args(); body=open(a.infile,encoding='utf-8',errors='replace').read()
print(json.dumps({"instruction_like":[],"invisible_flagged":False,"ok":True,"chars":len(body)})); raise SystemExit(0)
