/**
 * Cloudflare Worker — live media listing for the looper player.
 *
 * Lists the bound R2 bucket and returns JSON:
 *     { "clips": [ ...video URLs ], "audio": [ ...audio URLs ] }
 * so the page auto-detects new clips AND the soundtrack on load — no
 * commits, no rebuilds, no hardcoded filenames.
 *
 * ─── Setup (one time) ─────────────────────────────────────────────
 * 1. dash.cloudflare.com → Workers & Pages → Create → Worker.
 * 2. Name it, deploy the default, then "Edit code" and paste this file.
 *    Save & Deploy.
 * 3. Worker → Settings → Bindings → Add → R2 bucket:
 *       Variable name: BUCKET
 *       Bucket:        cine-clips   (your bucket)
 * 4. Copy the Worker URL and set it as MANIFEST_URL in index.html.
 *
 * Adding/removing/replacing a clip or the audio in R2 now shows up on
 * the next page load, whatever the filename.
 * ──────────────────────────────────────────────────────────────────
 */

const PUBLIC_BASE = 'https://pub-4d2cbc4d9d64403d8814842155ac7f95.r2.dev';
const VIDEO_EXTS  = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];
const AUDIO_EXTS  = ['.mp3', '.wav', '.m4a', '.ogg', '.oga', '.flac', '.aac'];

export default {
  async fetch(request, env) {
    const listed = await env.BUCKET.list();
    const keys = listed.objects.map(o => o.key).sort();

    const toUrl = key =>
      PUBLIC_BASE + '/' + key.split('/').map(encodeURIComponent).join('/');

    const hasExt = (key, exts) =>
      exts.some(ext => key.toLowerCase().endsWith(ext));

    const body = {
      clips: keys.filter(k => hasExt(k, VIDEO_EXTS)).map(toUrl),
      audio: keys.filter(k => hasExt(k, AUDIO_EXTS)).map(toUrl),
    };

    return new Response(JSON.stringify(body), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*',  // allow the GitHub Pages site to fetch
        'cache-control': 'no-store',
      },
    });
  },
};
