/* ═══════════════════════════════════════════════════════════
   ORIGIN LOCK — paste into finnhub-proxy AND anthropic Workers
   (reference copy — Worker code lives in the Cloudflare dashboard)
   ═══════════════════════════════════════════════════════════
   Why: the Worker URLs are visible in the site's source. Without a
   lock, anyone can call them — burning Finnhub quota is annoying;
   burning the Anthropic key is REAL MONEY. discord-proxy already
   does this; these two should match.

   How to install (per Worker, in the Cloudflare dashboard):
   1. Paste the two blocks below at the top of the Worker script.
   2. Add `if (!originOk(request)) return originReject();` as the
      FIRST line inside the fetch handler.
   3. Make sure your CORS response headers use ORIGIN_ALLOW[0] (or
      echo the request Origin if it's in the list) — NOT '*'.
   4. Save AND redeploy (see RUNBOOK.md — saved ≠ deployed).
   5. Verify: site still loads data; then `curl` the Worker URL
      directly — should get 403.
   ═══════════════════════════════════════════════════════════ */

const ORIGIN_ALLOW = [
  'https://chucksai.com',
  'https://www.chucksai.com',
];

function originOk(request) {
  // Browser fetch() from the site always sends Origin cross-origin.
  const origin = request.headers.get('Origin') || '';
  if (ORIGIN_ALLOW.includes(origin)) return true;
  // Fallback: some GET contexts send only Referer.
  const ref = request.headers.get('Referer') || '';
  return ORIGIN_ALLOW.some(o => ref.startsWith(o + '/') || ref === o);
  // NOTE: no Origin AND no Referer (curl, bots, address-bar hits) → rejected.
}

function originReject() {
  return new Response(JSON.stringify({ error: 'forbidden' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

/* Example wiring inside the existing handler:

export default {
  async fetch(request, env) {
    if (!originOk(request)) return originReject();
    // ... existing proxy logic unchanged ...
  }
}

CORS example (echo the allowed origin instead of '*'):

  const origin = request.headers.get('Origin');
  const corsOrigin = ORIGIN_ALLOW.includes(origin) ? origin : ORIGIN_ALLOW[0];
  headers.set('Access-Control-Allow-Origin', corsOrigin);
  headers.set('Vary', 'Origin');
*/
