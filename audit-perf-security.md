# ChucksAI Performance & Security Audit

_Generated: 2026-06-28 · Static scan of every `.html` in the repo root. Companion to `audit.md` (the 19-check structural audit). Re-run after the June key-proxy migration, fan-out throttling, and the new `today.html` / `discord-feed.html` pages._

**Legend:** ✅ Good · ⚠️ Worth fixing · ❌ Action needed · — N/A

---

## ✅ Headline — the big June-20 finding is FIXED

The 2026-06-20 headline was *"market-data API keys exposed client-side."* **That is now resolved.** The Finnhub, Polygon, and thenewsapi keys are gone from all client JS and now live as Worker secrets behind `finnhub-proxy` / `polygon-proxy` / `news-proxy`. A repo-wide grep finds **zero** Finnhub/Polygon/thenewsapi key literals or direct API hosts in any HTML. The keys were also rotated (Finnhub + Polygon; thenewsapi deferred — free read-only, no self-serve regen).

**One residual, low-risk:** `index.html` still passes CoinGecko's **demo** key (`x_cg_demo_api_key=${CG_KEY}`) client-side. CoinGecko demo keys are *designed* for client-side use (public, no-secret, rate-limited-only), so this is a different and far lower risk class than the proxied keys. Optional to proxy; not required.

---

# Part 1 — Security & API Resilience

## 1.1 Client-side API key exposure ✅ (was ❌)

| Service | 2026-06-20 | 2026-06-28 |
|---|---|---|
| Finnhub (`FH_KEY`/`FINNHUB_KEY`) | ❌ exposed on 9 pages | ✅ proxied via `finnhub-proxy`, key deleted, rotated |
| Polygon (`POLY_KEY`/`PG_KEY`) | ❌ exposed on 2 pages | ✅ proxied via `polygon-proxy`, rotated |
| thenewsapi (`NEWS_KEY`/`API_KEY`) | ❌ exposed on 2 pages | ✅ proxied via `news-proxy` (key not rotated — deferred, low risk) |
| Anthropic | ✅ already proxied | ✅ still proxied |
| CoinGecko demo key | (not flagged) | ℹ️ still client-side — by-design public demo key, low risk |

No `sk-ant-` anywhere. All AI routes through `anthropic.infiniti306.workers.dev`. **The single highest-value item from the last audit is closed.**

## 1.2 Fetch error handling ✅ (mostly)

Most pages wrap network calls in `try/catch` and/or `.catch()` with a visible empty/error state. The two new pages:

- **`today.html`** — ✅ `fhQuote()` calls are wrapped with `.catch(()=>null)` per-symbol in the serialized loop, so one bad quote doesn't sink the panel. Good.
- **`discord-feed.html`** — ✅ feed load and the `/react` POST are wrapped; renders an empty/loading state. Good.

Prior "thin spot" notes are settled (carried from POLISH-LIST): `nav.html` weather and `economic-calendar.html` were **false alarms** — both have real try/catch fallbacks; no fix needed.

## 1.3 Served security headers — still unverified from files ⚠️

Unchanged from last audit: CSP / HSTS / X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy are set at the Cloudflare layer, not in the repo, so they can't be confirmed from a file scan. **Still open — verify yourself:**

```
curl -sI https://chucksai.com | grep -iE "content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy"
```

There's a `_headers` file in the repo root — confirm it actually sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and HSTS. (It existed at 240 bytes; worth a look to see what's in it vs. what's missing.) CSP is higher-effort given inline scripts/styles — scope later.

## 1.4 Other security hygiene

- **`target="_blank"` without `rel="noopener"`** — ✅ **zero.** The `news.html` instance from last audit was fixed; grep finds no `_blank` links missing `noopener` anywhere.
- **Discord proxy** — `discord-proxy-worker.js` is origin-locked to chucksai.com with an emoji allow-list on `/react`; bot token server-side only. ✅ No token client-side. Good design.
- **SRI on Chart.js CDN (`dexcom.html`)** — still absent; loaded via dynamic `chartScript.src` with `onerror` fallback. Deferred (reference page, low value) — unchanged.

---

# Part 2 — Performance & Load

## 2.1 On-load Finnhub fan-out — THROTTLED ✅ (was ⚠️)

The June-20 perf concern (30 calls on load, 4-wide Finnhub burst on `index.html`, 6-wide on `treasuries.html`) is resolved:

- `index.html` — Finnhub quotes serialize in a `for` loop with a 120ms gap; only non-Finnhub calls (crypto/fg/earnings/news) run parallel.
- `treasuries.html` — 6 bond ETFs now sequential, 120ms gap.
- `today.html` — sequential, 130ms gap, from the start.

This directly closes `audit.md` Check 18.

## 2.2 `currency.html` background auto-refresh — ✅ FIXED this session

`currency.html` was auto-refreshing market data every 60s (`setInterval` → `loadMarketData()`) **without a `document.hidden` guard**, fanning out Finnhub forex quotes in background tabs and wasting the shared 60/min budget. **Fixed 2026-06-28:** added `if(document.hidden) return;` at the top of the interval callback (same pattern `options-flow.html` / `today.html` / `discord-feed.html` use). Cross-ref `audit.md` Check 17. File changed: `currency.html`. This was the only genuine perf defect found this round.

## 2.3 Render-blocking & font loading ✅ (was ⚠️)

Font `preconnect` is now present on **all 21 live pages + `_template.html`** (2 `<link rel="preconnect">` each, verified). `display=swap` already in place. The one easy perf win from last audit is **done**.

## 2.4 Page weight outliers

Unchanged: **`dexcom.html` ~278 KB** remains the heaviest by 5×, driven by 42 KB inline `<style>` + 205 inline styles + 22 fetches. Not slow on live metrics (secondary page), still the only trim candidate if ever revisited. New pages are lightweight: `today.html` and `discord-feed.html` are both small, clean payloads.

## 2.6 API tier limits — web-verified unchanged ✅

The throttle logic assumes specific free-tier limits; re-verified on the web 2026-06-28: **Finnhub 60/min** (unchanged), **Polygon 5/min** (unchanged), **CoinGecko demo 100/min + 10,000/month** (well above the homepage's usage), thenewsapi low daily read-only quota (unchanged). No limit dropped, so every throttle gap and the "shared 60/min" framing still holds. See `audit.md` Check 20 — re-run this web check each audit or on any 429s.

## 2.5 What's already good
Key proxying done, fan-out throttled, preconnect everywhere, `noopener` clean, Discord proxy origin-locked, sub-second homepage load on Cloudflare edge, `display=swap` fonts, only one external CDN library (Chart.js). The site's perf/security posture is materially better than the June-20 baseline.

---

## Summary — Prioritized Action List

1. **✅ DONE — `document.hidden` guard added to `currency.html` auto-refresh.** Only genuine perf/quota issue this round; fixed this session.
2. **⚠️ Verify served security headers** (`curl -sI` above) and confirm the existing `_headers` file covers HSTS / nosniff / X-Frame-Options / Referrer-Policy. Carried over — still unverified from files.
3. **ℹ️ Optional — proxy the CoinGecko demo key** on `index.html` if you want zero client-side keys. By-design public; low risk.
4. **Deferred (unchanged):** thenewsapi key rotation (no self-serve regen — make a fresh account someday); Chart.js SRI on `dexcom.html`.

> Note: an earlier draft flagged a "nav-injection regression" on `index.html` + `discord-feed.html` — that was a **false positive from bash-truncated reads**. Both pages have the standard nav injection (verified with the Read tool). No fix needed there.
