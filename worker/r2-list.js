/**
 * Cloudflare Worker — live clip listing for the looper player.
 *
 * Lists the bound R2 bucket and returns a JSON array of public clip URLs,
 * so the page auto-detects new clips on load (no commits, no rebuilds).
 *
 * ─── Setup (one time) ─────────────────────────────────────────────
 * 1. dash.cloudflare.com → Workers & Pages → Create → Worker.
 * 2. Name it (e.g. "cine-clips"), deploy the default, then "Edit code"
 *    and paste this file's contents. Save & Deploy.
 * 3. Worker → Settings → Bindings → Add → R2 bucket:
 *       Variable name: BUCKET
 *       Bucket:        cine-clips   (your bucket)
 * 4. Copy the Worker URL (e.g. https://cine-clips.<you>.workers.dev).
 * 5. In index.html set:  const MANIFEST_URL = '<that URL>';
 *
 * Adding/removing a clip in R2 now shows up on the next page load.
 * ──────────────────────────────────────────────────────────────────
 */

const PUBLIC_BASE = 'https://pub-4d2cbc4d9d64403d8814842155ac7f95.r2.dev';
const VIDEO_EXTS  = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];

export default {
  async fetch(request, env) {
    const listed = await env.BUCKET.list();

    const clips = listed.objects
      .map(o => o.key)
      .filter(key => VIDEO_EXTS.some(ext => key.toLowerCase().endsWith(ext)))
      .sort()
      // encode each path segment so spaces/specials in filenames stay valid
      .map(key => PUBLIC_BASE + '/' + key.split('/').map(encodeURIComponent).join('/'));

    return new Response(JSON.stringify(clips), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',  // allow the GitHub Pages site to fetch
        'cache-control': 'no-store',
      },
    });
  },
};
