# ChucksAI.com — Cloudflare Workers Reference
*Quick reference for the Workers behind the site. Source lives in the Cloudflare dashboard (not in this repo).*
*⚠️ No secret values here — secrets are stored in Cloudflare (Worker secrets + KV). Only names are listed.*

---

## Workers overview

| Worker URL | Purpose |
|-----------|---------|
| `https://anthropic.infiniti306.workers.dev` | Proxies Anthropic (Claude) API calls — avoids CORS + keeps the API key server-side. Also proxies Tradier via a `/tradier/` route. |
| `https://dexcom-proxy.infiniti306.workers.dev` | Handles Dexcom OAuth flow + proxies CGM data requests. Stores tokens in Cloudflare KV. |

**Important:** Worker JS is edited directly in the Cloudflare dashboard and is **NOT** in the GitHub repo. There's no local/version-controlled copy unless you paste it into the "Source" sections below.

---

## 1. Anthropic / AI proxy

- **URL:** `https://anthropic.infiniti306.workers.dev`
- **Model used by site:** `claude-sonnet-4-5-20250929`
- **Used by:** Home AI market read (`index.html`), AI Chat (`chat.html`), Options Flow read, Watchlist read
- **Streaming:** Worker detects `stream: true` in the request body and pipes `response.body` directly (does NOT buffer via `response.json()`). Client sends `stream: true` to trigger the SSE pipe.

**Routes:**

| Path | Method | Purpose |
|------|--------|---------|
| `/` (default) | POST | Anthropic `/v1/messages` proxy. Origin-checked (`https://chucksai.com` only). Streams if `stream: true`. |
| `/tradier/*` | GET | Proxies `https://api.tradier.com/v1/*` with `TRADIER_TOKEN`. Used by Options Flow (15-min delayed). |
| `/cnn-fg` | GET | Proxies CNN's Fear & Greed graphdata; returns `{ score, rating }`. Spoofs browser User-Agent/Referer to get past CNN's bot block. ⚠️ **Currently unused** — `fear-greed.html` uses a homemade VIX-based stock gauge + Alternative.me for crypto, not this route. Candidate to wire in as the "official" equity F&G source. |

- **CORS is hardcoded to `https://chucksai.com`.** This is why local dev (Live Server / localhost) hits CORS errors — expected, matches the known issue. Only the live site can read responses.

**Secrets (stored in Cloudflare, names only):**
- `ANTHROPIC_API_KEY` — Claude API key
- `TRADIER_TOKEN` — Tradier (free cash account; regenerates every ~60 days if unfunded)

**Source code:** *(captured June 14, 2026 — Cloudflare dashboard is source of truth)*

```js
export default {
  async fetch(request, env) {

    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://chucksai.com',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ── CNN Fear & Greed ──────────────────────────────────────────
    if (url.pathname === '/cnn-fg') {
      try {
        const r = await fetch(
          'https://production.dataviz.cnn.io/index/fearandgreed/graphdata/',
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Referer': 'https://edition.cnn.com/',
              'Origin': 'https://edition.cnn.com',
            }
          }
        );
        const d = await r.json();
        const fg = d.fear_and_greed;
        return new Response(JSON.stringify({
          score:  Math.round(fg.score),
          rating: fg.rating,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Tradier proxy ─────────────────────────────────────────────
    if (url.pathname.startsWith('/tradier/')) {
      try {
        const tradierPath = url.pathname.replace('/tradier', '');
        const tradierUrl = 'https://api.tradier.com/v1' + tradierPath + (url.search || '');

        const r = await fetch(tradierUrl, {
          headers: {
            'Authorization': `Bearer ${env.TRADIER_TOKEN}`,
            'Accept': 'application/json',
          }
        });
        const d = await r.json();
        return new Response(JSON.stringify(d), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Origin check ──────────────────────────────────────────────
    const origin = request.headers.get('Origin');
    if (origin && origin !== 'https://chucksai.com') {
      return new Response('Forbidden', { status: 403 });
    }

    // ── Anthropic proxy ───────────────────────────────────────────
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await request.json();
    const isStream = body.stream === true;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify(body),
    });

    // Stream: pipe response body directly back to browser
    if (isStream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Non-stream: buffer and return JSON as before
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
```

---

## 2. Dexcom proxy

- **URL:** `https://dexcom-proxy.infiniti306.workers.dev`
- **Auth:** OAuth 2.0 against `api.dexcom.com` (**production — NOT sandbox**)
- **Scopes:** `offline_access egv` only (Individual Access tier — no calibrations/devices/dataRange)
- **Used by:** `dexcom.html` (Glucose dashboard), `dexcom-callback.html` (OAuth redirect handler)
- **Token storage:** Cloudflare KV (managed by the Worker)
- **Data cap:** Individual Access = 30 days max; older history served from `history.json`

**Secrets / config:**
- ⚠️ `CLIENT_SECRET` is currently **hardcoded in the Worker source** (NOT a Cloudflare secret — your docs were wrong about this). See security notes below. **Redacted in the code copy below.**
- `CLIENT_ID` — hardcoded in source AND in `dexcom.html` (Client IDs are not secret — this is fine)
- KV namespace binding: `DEXCOM_KV` — stores `dexcom_refresh`, `dexcom_access`, `dexcom_expires`

**Routes:**

| Path | Method | Purpose |
|------|--------|---------|
| `/token` | POST | Exchange OAuth auth code → access + refresh token; stores in KV |
| `/refresh` | POST | Use stored refresh token to get a fresh access token |
| `/egvs?minutes=N` | GET | Glucose readings for last N minutes (default 1440 = 24h) |
| `/latest` | GET | Most recent single glucose reading (last 30 min window) |
| `/status` | GET | Whether authenticated + token expiry |

Token auto-refreshes via `getValidToken()` when within 5 min of expiry.

**Source code:** *(captured June 14, 2026 — secret redacted; Cloudflare dashboard is source of truth)*

```js
// ═══════════════════════════════════════════════════
//  DEXCOM PROXY WORKER — chucksai.com
//  Handles OAuth token exchange + data proxying
//  Deploy to: Cloudflare Workers → dexcom-proxy
// ═══════════════════════════════════════════════════

const CLIENT_ID     = 'iJ2Ne5xezTRjCgpI2tMijlnohvu0dE0k';
const CLIENT_SECRET = '<REDACTED — kept out of repo; see security notes>';
const REDIRECT_URI  = 'https://chucksai.com/dexcom-callback.html';

// NOTE: comment in source says "Sandbox" but this is set to PRODUCTION (correct).
const DEXCOM_BASE   = 'https://api.dexcom.com';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ── MAIN HANDLER ────────────────────────────────────
export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url      = new URL(request.url);
    const pathname = url.pathname;

    // ── /token  — exchange auth code for access + refresh token
    if (pathname === '/token' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const { code } = body;
      if (!code) return json({ error: 'Missing code' }, 400);

      const params = new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
        redirect_uri:  REDIRECT_URI,
      });

      const res  = await fetch(`${DEXCOM_BASE}/v2/oauth2/token`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    params.toString(),
      });

      const data = await res.json();
      if (!res.ok) return json({ error: data }, res.status);

      if (env.DEXCOM_KV && data.refresh_token) {
        await env.DEXCOM_KV.put('dexcom_refresh', data.refresh_token);
        await env.DEXCOM_KV.put('dexcom_access',  data.access_token);
        await env.DEXCOM_KV.put('dexcom_expires', String(Date.now() + data.expires_in * 1000));
      }

      return json({ ok: true, access_token: data.access_token });
    }

    // ── /refresh  — get a fresh access token using stored refresh token
    if (pathname === '/refresh' && request.method === 'POST') {
      if (!env.DEXCOM_KV) return json({ error: 'KV not configured' }, 500);

      const refreshToken = await env.DEXCOM_KV.get('dexcom_refresh');
      if (!refreshToken) return json({ error: 'No refresh token stored' }, 401);

      const params = new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type:    'refresh_token',
        redirect_uri:  REDIRECT_URI,
      });

      const res  = await fetch(`${DEXCOM_BASE}/v2/oauth2/token`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    params.toString(),
      });

      const data = await res.json();
      if (!res.ok) return json({ error: data }, res.status);

      await env.DEXCOM_KV.put('dexcom_refresh', data.refresh_token);
      await env.DEXCOM_KV.put('dexcom_access',  data.access_token);
      await env.DEXCOM_KV.put('dexcom_expires', String(Date.now() + data.expires_in * 1000));

      return json({ ok: true, access_token: data.access_token });
    }

    // ── /egvs  — get glucose readings (last N hours)
    if (pathname === '/egvs' && request.method === 'GET') {
      const token = await getValidToken(env);
      if (!token) return json({ error: 'Not authenticated' }, 401);

      const minutes = url.searchParams.get('minutes') || '1440'; // default 24h
      const now     = new Date();
      const start   = new Date(now - parseInt(minutes) * 60 * 1000);

      const startStr = start.toISOString().slice(0, 19);
      const endStr   = now.toISOString().slice(0, 19);

      const res  = await fetch(
        `${DEXCOM_BASE}/v3/users/self/egvs?startDate=${startStr}&endDate=${endStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      if (!res.ok) return json({ error: data }, res.status);
      return json(data);
    }

    // ── /latest  — most recent single glucose reading
    if (pathname === '/latest' && request.method === 'GET') {
      const token = await getValidToken(env);
      if (!token) return json({ error: 'Not authenticated' }, 401);

      const now   = new Date();
      const start = new Date(now - 30 * 60 * 1000); // last 30 min

      const startStr = start.toISOString().slice(0, 19);
      const endStr   = now.toISOString().slice(0, 19);

      const res  = await fetch(
        `${DEXCOM_BASE}/v3/users/self/egvs?startDate=${startStr}&endDate=${endStr}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      if (!res.ok) return json({ error: data }, res.status);

      const readings = data.records || [];
      const latest   = readings[readings.length - 1] || null;
      return json({ reading: latest });
    }

    // ── /status  — check if authenticated
    if (pathname === '/status') {
      if (!env.DEXCOM_KV) return json({ authenticated: false });
      const token = await env.DEXCOM_KV.get('dexcom_access');
      const exp   = await env.DEXCOM_KV.get('dexcom_expires');
      return json({
        authenticated: !!token,
        expires_at:    exp ? new Date(parseInt(exp)).toISOString() : null,
      });
    }

    return json({ error: 'Not found' }, 404);
  }
};

// ── HELPER: get valid token, auto-refresh if expired ──
async function getValidToken(env) {
  if (!env.DEXCOM_KV) return null;

  const expires = await env.DEXCOM_KV.get('dexcom_expires');
  const now     = Date.now();

  if (expires && parseInt(expires) - now < 5 * 60 * 1000) {
    const refreshToken = await env.DEXCOM_KV.get('dexcom_refresh');
    if (!refreshToken) return null;

    const params = new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
      redirect_uri:  REDIRECT_URI,
    });

    const res  = await fetch(`${DEXCOM_BASE}/v2/oauth2/token`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    if (!res.ok) return null;
    const data = await res.json();

    await env.DEXCOM_KV.put('dexcom_refresh', data.refresh_token);
    await env.DEXCOM_KV.put('dexcom_access',  data.access_token);
    await env.DEXCOM_KV.put('dexcom_expires', String(Date.now() + data.expires_in * 1000));

    return data.access_token;
  }

  return await env.DEXCOM_KV.get('dexcom_access');
}
```

---

## 🔒 Security notes — Dexcom Worker (review when awake)

1. **`CLIENT_SECRET` is hardcoded in the Worker source.** Your project docs say it's "Worker secret only" — it isn't. Two issues: (a) anyone who can see the Worker source sees the secret; (b) if this file or the Worker code lands in your GitHub repo, the secret is committed. **I redacted it in the copy above.** Recommended: move it to a Cloudflare Worker secret (`env.DEXCOM_CLIENT_SECRET`) and **rotate it** in the Dexcom developer portal, since it's been sitting in plaintext.

2. **Data endpoints are open to the world.** CORS is `*` and `/egvs`, `/latest`, `/status` do no caller-side auth — they just use the token stored in KV. That means anyone who knows the Worker URL can pull *your glucose readings*. It's only protected by the URL being obscure. Consider locking `Access-Control-Allow-Origin` to `https://chucksai.com` and/or requiring a shared key header on the data routes.

3. **Stale comment.** Source says `// Sandbox base URL` but it's correctly pointed at production (`api.dexcom.com`). Harmless, just misleading — worth cleaning up.


---

## Notes / reminders

- Do **not** expose the Anthropic API key client-side — always route through the proxy Worker.
- Do **not** point Dexcom at the sandbox — both `dexcom.html` and the Worker use `api.dexcom.com` (production).
- Do **not** request Dexcom scopes beyond `offline_access egv` (Individual Access tier).
- If you ever want these Workers version-controlled, paste the JS into the "Source code" blocks above — then I can review/edit them with you instead of working blind.
