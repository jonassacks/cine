#!/usr/bin/env python3
"""
start.py  —  one command to run looper locally

    python3 start.py

What it does:
  1. Scans clips/ and writes clips.json
  2. Opens http://localhost:3000 in your browser
  3. Starts a local web server (Ctrl+C to stop)
"""

import os, json, threading, time, webbrowser, http.server, socketserver

PORT      = 3000
BASE      = os.path.dirname(os.path.abspath(__file__))
CLIPS_DIR = os.path.join(BASE, 'clips')
OUTPUT    = os.path.join(BASE, 'clips.json')
EXTS      = {'.mp4', '.webm', '.mov', '.m4v', '.ogv'}

# ── 1. Scan clips/ and update clips.json ──────────────────────────
os.makedirs(CLIPS_DIR, exist_ok=True)

clips = sorted(f for f in os.listdir(CLIPS_DIR)
               if os.path.splitext(f)[1].lower() in EXTS)

with open(OUTPUT, 'w') as fh:
    json.dump(clips, fh, indent=2)
    fh.write('\n')

print(f"\n clips.json  →  {len(clips)} clip(s) found")
for c in clips:
    print(f"   • {c}")
if not clips:
    print("   (none yet — drop .mp4 files into clips/ and restart)")

# ── 2. Open browser after server is ready ────────────────────────
def _open():
    time.sleep(0.8)
    webbrowser.open(f'http://localhost:{PORT}')

threading.Thread(target=_open, daemon=True).start()

# ── 3. Start server ───────────────────────────────────────────────
os.chdir(BASE)

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass  # suppress per-request noise

print(f"\n Server running at  http://localhost:{PORT}")
print(" Press Ctrl+C to stop.\n")

with socketserver.TCPServer(('', PORT), QuietHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n Stopped.")
