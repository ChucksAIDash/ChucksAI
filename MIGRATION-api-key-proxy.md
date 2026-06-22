# Migration Guide — Proxy the Market-Data API Keys

> **Goal:** stop sending Finnhub / Polygon / thenewsapi keys from the browser. Route those calls through Cloudflare Workers (exactly like the Anthropic key already is via `anthropic.infiniti306.workers.dev`), then rotate the old keys. While editing the fetch URLs, also throttle the on-load fan-out (Tier 2).
>
> **No rush — do this at your own pace.** Each part is self-contained. You can ship one provider (e.g. Finnhub) and leave the others for later.
>
> **What only you can do:** create the Workers + paste the keys as secrets in the Cloudflare dashboard, and regenerate (rotate) the keys on each provider. Everything else (Worker code + page edits) is spelled out below to copy/paste.

---

## The exposed keys (treat as compromised — rotate after migrating)

| Provider | Key (currently public in repo + live traffic) | Pages using it |
|---|---|---|
| Finnhub | `d7kohmpr01qiqbcv6f8gd7kohmpr01qiqbcv6f90` | index, currency, earnings, fear-greed, treasuries, breadth, insiders, ipo, watchlist, today |
| Polygon | `mcVUA4y1kkJ_0Vm2d29ckUpiDxNmpjKH` | heat-map |
| thenewsapi | `EaYs0yWgGLNEmYbHfDp47HwYeaCMaG8HxgOSHHsg` | news, index |

---

## Overview of the plan

1. Create 3 Workers in the Cloudflare dashboard: `finnhub-proxy`, `polygon-proxy`, `news-proxy`.
2. Store each provider key as a **Worker secret** (never in the repo).
3. Paste the Worker source (below) into each.
4. Edit the pages so their `fetch` calls hit `…workers.dev/…` instead of the provider with `&token=KEY`.
5. Deploy, test, then **rotate the 3 keys** on the provider sites and update the secrets.

> The Workers live in the Cloudflare dashboard, **not** the repo — so paste the code there, not into a repo file.

---

## STEP 1 — Create the Workers (dashboard)

For each of the three:

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**.
2. Name it `finnhub-proxy` (then repeat for `polygon-proxy`, `news-proxy`). This gives you `https://finnhub-proxy.infiniti306.workers.dev` etc.
3. Click **Deploy** (deploys the default starter), then **Edit code** and replace with the source in Step 3.

## STEP 2 — Add the key as a Worker secret (dashboard)

For each Worker: **Settings → Variables and Secrets → Add → Encrypt**.

| Worker | Secret name | Secret value |
|---|---|---|
| `finnhub-proxy` | `FINNHUB_KEY` | your Finnhub key |
| `polygon-proxy` | `POLYGON_KEY` | your Polygon key |
| `news-proxy` | `NEWS_KEY` | your thenewsapi key |

(Or via CLI: `npx wrangler secret put FINNHUB_KEY` — paste the value when prompted.)

## STEP 3 — Worker source (paste into each Worker's editor)

Each proxy forwards the path/query to the provider, injects the secret server-side, and returns the JSON. CORS is locked to your domain.

### `finnhub-proxy`
```js
export default {
  async fetch(request, env) {
    const ALLOW = 'https://chucksai.com';
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }), ALLOW);

    const url = new URL(request.url);
    // Pass the path after the worker host straight to Finnhub.
    // e.g. /quote?symbol=SPY  ->  https://finnhub.io/api/v1/quote?symbol=SPY&token=KEY
    const target = new URL('https://finnhub.io/api/v1' + url.pathname);
    url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
    target.searchParams.set('token', env.FINNHUB_KEY);

    const r = await fetch(target, { cf: { cacheTtl: 15 } });
    const body = await r.text();
    return cors(new Response(body, {
      status: r.status,
      headers: { 'Content-Type': 'application/json' }
    }), ALLOW);
  }
};
function cors(resp, allow) {
  resp.headers.set('Access-Control-Allow-Origin', allow);
  resp.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  return resp;
}
```

### `polygon-proxy`
```js
export default {
  async fetch(request, env) {
    const ALLOW = 'https://chucksai.com';
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }), ALLOW);

    const url = new URL(request.url);
    // e.g. /v2/aggs/ticker/XLK/range/1/day/2026-01-01/2026-06-01
    const target = new URL('https://api.polygon.io' + url.pathname);
    url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
    target.searchParams.set('apiKey', env.POLYGON_KEY);

    const r = await fetch(target, { cf: { cacheTtl: 60 } });
    const body = await r.text();
    return cors(new Response(body, {
      status: r.status,
      headers: { 'Content-Type': 'application/json' }
    }), ALLOW);
  }
};
function cors(resp, allow) {
  resp.headers.set('Access-Control-Allow-Origin', allow);
  resp.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  return resp;
}
```

### `news-proxy`
```js
export default {
  async fetch(request, env) {
    const ALLOW = 'https://chucksai.com';
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }), ALLOW);

    const url = new URL(request.url);
    // e.g. /v1/news/top?locale=us&categories=general
    const target = new URL('https://api.thenewsapi.com' + url.pathname);
    url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
    target.searchParams.set('api_token', env.NEWS_KEY);

    const r = await fetch(target, { cf: { cacheTtl: 120 } });
    const body = await r.text();
    return cors(new Response(body, {
      status: r.status,
      headers: { 'Content-Type': 'application/json' }
    }), ALLOW);
  }
};
function cors(resp, allow) {
  resp.headers.set('Access-Control-Allow-Origin', allow);
  resp.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  return resp;
}
```

> **Note on CORS + local testing:** these lock to `https://chucksai.com`, so they won't work from a local `file://` open (you already know API/worker calls must be tested on the live site). If you want to test from a Cloudflare Pages preview URL too, add it to the allow check.

---

## STEP 4 — Edit the pages

General rule for **Finnhub** pages: replace `https://finnhub.io/api/v1` with `https://finnhub-proxy.infiniti306.workers.dev`, and **delete** the `&token=${FH_KEY}` (or `${FINNHUB_KEY}`) at the end. Then delete the now-unused `const FH_KEY = '…'` line.

### Finnhub pages

Each of these has a key constant to **delete** and quote/calendar URLs to **rewrite**:

| File | Delete this line | Endpoint(s) to rewrite |
|---|---|---|
| `index.html` | `const FH_KEY = '…'` (~line 549) | `finnhub.io/api/v1/quote`, `…/calendar/earnings` |
| `currency.html` | `const FH_KEY = '…'` (~line 297) | `…/quote` |
| `earnings.html` | `const FH_KEY = '…'` (~line 241) | `…/calendar/earnings` |
| `fear-greed.html` | `const FH_KEY = '…'` (~line 150) | `…/quote` |
| `treasuries.html` | `const FH_KEY = '…'` (~line 164) | `…/quote` |
| `breadth.html` | `const FINNHUB_KEY = '…'` (~line 331) | `…/quote` |
| `insiders.html` | `const FINNHUB_KEY = '…'` (~line 301) | `…/stock/insider` |
| `ipo.html` | `const FINNHUB_KEY = '…'` (~line 286) | `…/calendar/ipo` |
| `watchlist.html` | `const FINNHUB_KEY = '…'` (~line 338) | `…/quote`, `…/stock/profile`, `…/stock/metric` |
| `today.html` | `const FH_KEY = '…'` (in `fhQuote`) | `…/quote` (built 2026-06; 6 index ETFs + VIXY) |

**Example — treasuries.html `fhQuote` (line ~188):**
```js
// BEFORE
const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${FH_KEY}`);
// AFTER
const r = await fetch(`https://finnhub-proxy.infiniti306.workers.dev/quote?symbol=${encodeURIComponent(sym)}`);
```
Then delete `const FH_KEY = '…';` near the top of that page's script.

The same pattern applies to every Finnhub URL: keep the path after `/api/v1` and all params except `token`, swap the host.

### Polygon page — `heat-map.html`

```js
// BEFORE (line ~467)
const url = `https://api.polygon.io/v2/aggs/ticker/${etf.sym}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=50&apiKey=${POLY_KEY}`;
// AFTER
const url = `https://polygon-proxy.infiniti306.workers.dev/v2/aggs/ticker/${etf.sym}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=50`;
```
Then delete `const POLY_KEY = '…';` (line ~358).

### thenewsapi pages — `news.html` and `index.html`

```js
// BEFORE (news.html ~line 253; index.html ~739/839)
fetch(`https://api.thenewsapi.com/v1/news/top?...&api_token=${NEWS_API_KEY}`)
// AFTER
fetch(`https://news-proxy.infiniti306.workers.dev/v1/news/top?...`)
```
Delete `const NEWS_API_KEY = '…'` (news.html ~213) and `const NEWS_KEY = '…'` (index.html ~550). (Note: news.html's constant is named `NEWS_API_KEY`; index.html's is `NEWS_KEY` — remove whichever each page has and any `&api_token=...` it appended.)

---

## STEP 5 — Tier 2: throttle the on-load fan-out (do while you're in these files)

**`treasuries.html`** (~line 229) fires 6 parallel Finnhub quotes. Replace the `Promise.all` with a sequential loop:
```js
// BEFORE
const results = await Promise.all(BONDS.map(b => fhQuote(b.sym)));
// AFTER — serialize with a small gap (pattern currency.html/watchlist.html already use)
const results = [];
for (const b of BONDS) {
  results.push(await fhQuote(b.sym).catch(() => ({ price: 0, pct: 0 })));
  await new Promise(r => setTimeout(r, 120));
}
```

**`index.html`** (~line 865) fires a 4-wide `Promise.allSettled` of Finnhub quotes alongside other APIs. Lower priority (load-once), but if you see quote failures under load, batch the 4 `mbFhQuote(...)` calls the same way (sequential, small delay) rather than firing them together. The non-Finnhub calls in that block can stay parallel.

---

## STEP 6 — Deploy, test, ROTATE

1. Push the page edits (you commit/push as usual). Pages auto-deploy in ~30s.
2. On the **live site**, open each affected page + DevTools → Network. Confirm: calls now go to `*-proxy.infiniti306.workers.dev`, return 200, and **no `token=`/`apiKey=`/`api_token=` appears anywhere**.
3. **Rotate the keys** (this is the payoff — until you do, the old keys are still valid and public):
   - Finnhub dashboard → regenerate API key → update the `FINNHUB_KEY` secret in `finnhub-proxy`.
   - Polygon dashboard → regenerate → update `POLYGON_KEY` in `polygon-proxy`.
   - thenewsapi dashboard → regenerate → update `NEWS_KEY` in `news-proxy`.
4. Re-test once more after rotation.

---

## Quick checklist

- [ ] Create `finnhub-proxy`, `polygon-proxy`, `news-proxy` Workers
- [ ] Add `FINNHUB_KEY` / `POLYGON_KEY` / `NEWS_KEY` secrets
- [ ] Paste Worker source into each
- [ ] Edit 10 Finnhub pages incl. today.html (swap host, drop token, delete key const)
- [ ] Edit `heat-map.html` (Polygon)
- [ ] Edit `news.html` + `index.html` (thenewsapi)
- [ ] Throttle `treasuries.html` (and optionally `index.html`) fan-out
- [ ] Push, test on live site (no keys in Network tab)
- [ ] **Rotate all 3 keys** + update secrets
- [ ] Re-test

When you're ready to do the page edits, I can apply all of them in the repo for you in one pass — just say go and I'll make the edits (you'd still do the dashboard/Worker/rotation parts yourself).
