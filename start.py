#!/usr/bin/env python3
"""
start.py  —  run looper locally

    python3 start.py            Serve using the existing clips.json (does NOT
                                touch it). Use this with R2 / remote URLs.

    python3 start.py --scan     Rebuild clips.json from the local clips/ folder
                                first, then serve. Use this when testing with
                                local video files.

In both cases it opens http://localhost:3000 and starts a server (Ctrl+C stops).
"""

import os, sys, json, threading, time, webbrowser, http.server, socketserver

PORT      = 3000
BASE      = os.path.dirname(os.path.abspath(__file__))
CLIPS_DIR = os.path.join(BASE, 'clips')
OUTPUT    = os.path.join(BASE, 'clips.json')
EXTS      = {'.mp4', '.webm', '.mov', '.m4v', '.ogv'}

SCAN = '--scan' in sys.argv[1:]


def read_manifest():
    """Return the current clips.json as a list, or [] if missing/invalid."""
    try:
        with open(OUTPUT) as fh:
            data = json.load(fh)
            return data if isinstance(data, list) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def scan_local():
    """Rebuild clips.json from the local clips/ folder."""
    os.makedirs(CLIPS_DIR, exist_ok=True)
    clips = sorted(f for f in os.listdir(CLIPS_DIR)
                   if os.path.splitext(f)[1].lower() in EXTS)
    with open(OUTPUT, 'w') as fh:
        json.dump(clips, fh, indent=2)
        fh.write('\n')
    return clips


# ── 1. Decide what to serve ───────────────────────────────────────
current = read_manifest()
has_urls = any(isinstance(c, str) and c.startswith(('http://', 'https://'))
               for c in current)

if SCAN:
    if has_urls:
        print("\n  --scan will REPLACE remote URLs in clips.json with local files.")
    clips = scan_local()
    print(f"\n clips.json rebuilt from clips/  →  {len(clips)} clip(s)")
elif not current:
    # No manifest yet → bootstrap from local folder so first run works.
    clips = scan_local()
    print(f"\n clips.json created from clips/  →  {len(clips)} clip(s)")
else:
    # Default: serve the existing manifest untouched.
    clips = current
    kind = "remote URL" if has_urls else "local file"
    print(f"\n Serving existing clips.json  →  {len(clips)} {kind}(s)")
    print(" (run 'python3 start.py --scan' to rebuild from the clips/ folder)")

for c in clips:
    print(f"   • {c}")
if not clips:
    print("   (empty — add clips to clips/ and run: python3 start.py --scan)")

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
