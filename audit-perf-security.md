# ChucksAI Performance & Security Audit

_Generated: 2026-06-20 · Static scan of every `.html` in the repo root + live checks against https://chucksai.com (rendered in browser). Companion to `audit.md` (the 18-check structural audit)._

**Legend:** ✅ Good · ⚠️ Worth fixing · ❌ Action needed · — N/A

---

## ⚠️ Headline finding (read this first)

**Your market-data API keys are exposed client-side and are live-harvestable.** The Finnhub, Polygon, and thenewsapi keys are hardcoded as literals in page JavaScript and sent in the clear in `fetch` URLs. Confirmed end-to-end: the literals are in the repo source **and** I watched the live homepage fire 15 Finnhub requests with the token `d7koh…f90` visible in plain network traffic. Anyone who opens DevTools on `chucksai.com` can copy these keys and burn your quota (or run up a bill on any paid tier).

This does **not** contradict your "no Anthropic key client-side" rule — that rule is being followed correctly (`sk-ant-` appears nowhere; all AI routes through `anthropic.infiniti306.workers.dev`). The gap is that the *market-data* keys never got the same proxy treatment. Fixing this is the single highest-value item in either audit.

---

# Part 1 — Security & API Resilience

## 1.1 Client-side API key exposure ❌

Hardcoded key literals found in client JS, by file:

| File | Exposed key | Service |
|---|---|---|
| `index.html` | `FH_KEY` (Finnhub) + `NEWS_KEY` (thenewsapi) | Finnhub, thenewsapi |
| `currency.html` | `FH_KEY` | Finnhub |
| `earnings.html` | `FH_KEY` | Finnhub |
| `fear-greed.html` | `FH_KEY` | Finnhub |
| `treasuries.html` | `FH_KEY` | Finnhub |
| `breadth.html`, `insiders.html`, `ipo.html`, `watchlist.html` | `FINNHUB_KEY` | Finnhub |
| `heat-map.html` | `POLY_KEY` | Polygon |
| `news.html` | `API_KEY` | thenewsapi |

The same Finnhub token string is reused across all Finnhub pages. The Anthropic key is **not** exposed anywhere (correctly proxied). No `sk-ant-` literal, no Anthropic key in any URL.

**Live confirmation:** on `chucksai.com/` the browser made 15 `finnhub.io/api/v1/...&token=d7koh…f90` requests with the token in the query string — visible to any visitor via DevTools → Network.

**Why it matters:** Finnhub/Polygon/thenewsapi free tiers are rate-limited per key and shared. An exposed key can be scraped and abused, exhausting your quota site-wide or (on a paid tier) generating charges. Query-string keys also land in browser history, proxy logs, and any analytics that capture URLs.

**Fix (mirror what you already do for Anthropic):** route market-data calls through a Cloudflare Worker proxy that holds the keys server-side, exactly like `anthropic.infiniti306.workers.dev`. Stand up e.g. `finnhub-proxy.infiniti306.workers.dev` / `polygon-proxy…` / `news-proxy…`, store the keys as Worker secrets (`wrangler secret put` or the dashboard), and change the pages to fetch `…workers.dev/quote?symbol=SPY` with no token. Worker code lives in the Cloudflare dashboard (not the repo) — when you're ready I can hand you the Worker source + the per-page fetch-URL edits. **Rotate the exposed keys after migrating**, since they've been public.

> Note: because the keys are already in the public repo and live site, treat them as compromised and regenerate them once the proxy is in place.

## 1.2 Fetch error handling ✅ (mostly) ⚠️ (a few thin spots)

Most pages wrap network calls in `try/catch` and/or `.catch()` with a visible error/empty state. Coverage by file (fetch calls vs. try-blocks vs. .catch handlers):

| File | fetch calls | try blocks | .catch | Assessment |
|---|---|---|---|---|
| `dexcom.html` | 22 | 21 | 5 | ✅ well covered |
| `index.html` | 15 | 15 | 2 | ✅ each section in try; uses `allSettled` so one failure doesn't sink the page |
| `watchlist.html` | 5 | 5 | 1 | ✅ covered |
| `currency.html` | 5 | 3 | 4 | ✅ covered |
| `fear-greed.html` | 4 | 3 | 2 | ✅ covered |
| `crypto.html` | 3 | 1 | 3 | ✅ per-call `.catch(()=>null)` |
| `options-flow.html` | 3 | 3 | 1 | ✅ covered |
| `breadth`, `commodities`, `earnings`, `heat-map`, `insiders`, `ipo`, `news`, `treasuries` | 2 | 1–2 | 1 | ✅ covered |
| `economic-calendar.html` | 1 | 0 | 1 | ⚠️ relies solely on `.catch` — no try block; verify the empty/error state actually renders |
| `nav.html` | 2 | 1 | 0 | ⚠️ weather/clock fetches — 1 try, no `.catch`; an uncaught reject here would log to console on every page. Low user impact but worth a guard. |

**Recommendation:** add a `.catch` (or wrap in try) to `nav.html`'s weather fetch and confirm `economic-calendar.html` shows a graceful empty state on API failure. Everything else has a real failure path.

## 1.3 Served security headers — could not verify via tooling ⚠️

I attempted to read the response headers for `chucksai.com` (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) but the browser tooling available here doesn't expose response headers, and same-origin header reads returned empty. **This is unverified, not a confirmed failure.**

These headers are set at the Cloudflare layer (not in your HTML/repo), so they can't be audited from the files. To check them yourself, run from any terminal:

```
curl -sI https://chucksai.com | grep -iE "content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy"
```

If any are missing, add them via a Cloudflare Pages `_headers` file in the repo root (Pages supports this without touching the dashboard) — e.g. `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and HSTS. A CSP is higher-effort given your inline scripts/styles but worth scoping later. I can draft a `_headers` file if you want.

## 1.4 Other security hygiene

- **`target="_blank"` without `rel="noopener"`** — 1 instance in `news.html`. Minor reverse-tabnabbing risk; add `rel="noopener noreferrer"` to external article links.
- **Subresource Integrity (SRI)** — `dexcom.html` loads Chart.js from `cdnjs.cloudflare.com` with no `integrity=` attribute. Low risk (reputable CDN) but adding an SRI hash + `crossorigin` closes a supply-chain gap on the one external library you load.
- **No mixed content, no `localhost`, no leaked Anthropic key** — all clean (carried over from `audit.md` check 9).

---

# Part 2 — Performance & Load

## 2.1 Live homepage metrics (chucksai.com, rendered)

| Metric | Value | Verdict |
|---|---|---|
| TTFB | 372 ms | ✅ good (Cloudflare edge) |
| DOMContentLoaded | 648 ms | ✅ good |
| Load event | 969 ms | ✅ under 1s |
| Document size (decoded) | 54 KB | ✅ |
| Total transfer | ~58 KB | ✅ small |
| Resource count | 35 | ⚠️ — of which **30 are API calls** (29 fetch + 1 XHR) fired on load |
| Slowest resource | ~1.25 s | ⚠️ a data call; page is interactive before it resolves |

**Takeaway:** the shell loads fast and light. The performance story isn't bytes — it's the **30 API requests the dashboard fires on load**, several to the rate-limited Finnhub key. This ties directly to `audit.md` check 18: the 4-wide Finnhub burst in `index.html` plus all the other section fetches land at once. Under a cold cache or a throttled key, the slowest calls (~1.25s) gate full content.

## 2.2 On-load fetch count per page (static)

Rough count of `fetch()` calls per page (proxy for on-load network work):

| File | fetch calls | Note |
|---|---|---|
| `dexcom.html` | 22 | Heaviest; mostly serialized in try blocks. Also the largest file (278 KB) — see 2.4. |
| `index.html` | 15 | Dashboard aggregator; 4 are parallel Finnhub (see check 18). |
| `currency.html` | 5 | Batched/throttled ✅ |
| `watchlist.html` | 5 | Sequential per-symbol ✅ |
| `fear-greed.html` | 4 | 2-wide, mixed APIs ✅ |
| `crypto`, `options-flow` | 3 | Coinbase / worker ✅ |
| most others | 1–2 | Fine |

## 2.3 Render-blocking & font loading ⚠️ (one easy win, all pages)

- **`theme.js` in `<head>` blocking** — intentional and correct (prevents theme flash). Leave as-is. It's tiny.
- **Google Fonts is render-blocking with no `preconnect`** — every page loads `fonts.googleapis.com` via a blocking `<link>` and **none have a `<link rel="preconnect">`** to `fonts.googleapis.com` / `fonts.gstatic.com`. `display=swap` is already set ✅ (good — text renders immediately). Adding two `preconnect` lines shaves the font-fetch handshake on first paint across all 19 live pages.

  **Fix (add to each page `<head>`, or better, bake into `_template.html` and nav-injected pages):**
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ```

## 2.4 Page weight outliers

| File | Size | Note |
|---|---|---|
| `dexcom.html` | **278 KB** | 5× the next-largest. 42.6 KB of that is inline `<style>`, plus 22 fetch calls and heavy inline JS. The biggest single payload on the site. |
| `index.html` | 53 KB | Reasonable for the dashboard. |
| `options-flow.html` | 35 KB | Fine. |
| everything else | < 31 KB | ✅ |

`dexcom.html` isn't slow on the live metrics (it's a logged-in/secondary page), but its size + 207 inline styles (from `audit.md` check 14) + 22 fetches make it the prime candidate if you ever want to split shared CSS into `styles.css` and trim. Not urgent.

## 2.5 What's already good
Small payloads, Cloudflare edge TTFB under 400ms, `display=swap` fonts, sub-second homepage load, only one external CDN library (Chart.js), and most heavy pages serialize their fetches. The site is genuinely fast — the perf wins here are incremental (preconnect, the on-load fan-out) rather than fixing something broken.

---

## Summary — Prioritized Action List

1. **❌ Proxy the market-data API keys (Finnhub / Polygon / thenewsapi).** They're public in source and live network traffic across 10 pages. Move them behind Cloudflare Workers like the Anthropic key already is, then rotate them. *Highest value, security-critical.*
2. **⚠️ Throttle the on-load fetch fan-out** — `index.html` (30 calls on load, 4 parallel Finnhub) and `treasuries.html` (6 parallel Finnhub). Mirrors `audit.md` check 18. Serialize/batch like `currency.html`/`watchlist.html` already do.
3. **⚠️ Add `preconnect` for Google Fonts** on every page (or bake into the template). One-line-per-page win across all 19 live pages.
4. **⚠️ Verify served security headers** (`curl -sI` one-liner above); add a Cloudflare Pages `_headers` file for any missing (HSTS, nosniff, X-Frame-Options, Referrer-Policy).
5. **⚠️ Patch thin error paths** — `nav.html` weather fetch (no catch, runs on every page) and `economic-calendar.html` (no try block).
6. **Minor:** add `rel="noopener"` to the `_blank` link in `news.html`; add SRI to the Chart.js CDN tag in `dexcom.html`.

Items 1, 2, and 4 require Cloudflare Worker / Pages config (which lives in the dashboard, not the repo) — say the word and I'll hand you the Worker source, the `_headers` file, and the exact per-page fetch-URL edits.
