# POLISH-LIST — ChucksAI

> **You are here (2026-06-20 session recap):**
> Re-ran the structural audit (`audit.md`, fresh — all 18 checks, no findings reused) and added a new **performance + security audit** (`audit-perf-security.md`, static scan + live chucksai.com checks). Then did a round of safe cleanup edits in the repo (CSS dedupe, nav light-mode tokens, font preconnect). **Chuck pushes the changes himself.** The big-ticket items (API-key proxying, fetch throttling, security headers) are NOT done yet — they need Cloudflare Worker/Pages config and are queued below.

---

## ✅ Done this session (changed files — Chuck to commit + push)

- **`styles.css`** — added consolidated shared animations at the end: `@keyframes fadeUp`, `@keyframes spin`, `.fade-in`.
- **Removed the now-redundant per-page copies** of those rules from: `crypto.html`, `currency.html`, `earnings.html`, `economic-calendar.html`, `fear-greed.html`, `index.html`, `news.html`, `options-flow.html`, `treasuries.html`, `chat.html`, `insiders.html`, `ipo.html`, `heat-map.html`, `dexcom-callback.html`. (`.spinner`/`.loading-text` left per-page — they legitimately differ. `dexcom.html` left untouched — it's a reference copy from another project.)
- **`nav.html`** — rewrote all 14 stale `html.light` rules to use design tokens (`var(--bg-card)`, `--border`, `--text-*`, `--accent2`, `--panel-deep`, `--tint-blue*`, `--scrim-soft`) so light mode matches the current Navy Glass palette. Status-dot colors (`#3ddc84`/`#f0b86a`/`#a78bfa`/`#555`) left as semantic literals on purpose.
- **Font `preconnect`** added to all 19 live pages + `_template.html` (two `<link rel="preconnect">` lines before the Google Fonts stylesheet).
- Bonus: stripped stray trailing NUL bytes from edited files (repo HTML is now NUL-clean).

**⚠️ TEST BEFORE/AFTER PUSH:** load the live site in **light mode** and click through the nav (links, dropdowns, weather panel, mobile menu) to confirm the nav.html token rewrite looks right. The old light rules were a white-on-white scheme that didn't match Navy Glass, so this should be a *fix*, but eyeball it.

---

## 🔴 Tier 1 — Security (do next, needs Cloudflare Workers)

**Proxy the market-data API keys.** Finnhub, Polygon, and thenewsapi keys are hardcoded in client JS and visible in live network traffic (confirmed: 15 Finnhub requests on the homepage with the token in plain query string). Affected pages: `index.html`, `currency.html`, `earnings.html`, `fear-greed.html`, `treasuries.html`, `breadth.html`, `insiders.html`, `ipo.html`, `watchlist.html` (Finnhub); `heat-map.html` (Polygon); `news.html` (thenewsapi).
- Stand up Worker proxies like the existing `anthropic.infiniti306.workers.dev` (e.g. `finnhub-proxy`, `polygon-proxy`, `news-proxy`), store keys as Worker secrets, change pages to fetch the proxy with no token.
- **Rotate all three keys** after migrating — they're already public.
- (Anthropic key is fine — already proxied, never client-side.)

## 🟠 Tier 2 — Performance (pairs with Tier 1)

- **Throttle on-load Finnhub fan-out.** `treasuries.html` line ~229 fires 6 parallel `Promise.all(BONDS.map(fhQuote))`; `index.html` fires a 4-wide `Promise.allSettled` of Finnhub quotes (part of ~30 API calls on dashboard load). Convert to the serialized/batched pattern `currency.html` and `watchlist.html` already use (sequential loop + small `setTimeout`, or batch with delay). Best done while rewriting those fetch URLs for the proxy.

## 🟡 Tier 3 — Verify / config

- **Check served security headers:** `curl -sI https://chucksai.com | grep -iE "content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy"`. Add a Cloudflare Pages `_headers` file (repo root) for any missing (HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`). CSP is higher-effort given inline scripts/styles — scope later.

## 🟢 Tier 4 — Minor cleanups

- **`nav.html` dark-mode hardcodes** (lower priority): base rules still use raw `rgba(5,8,12,.88)` / `rgba(5,8,12,.97)` panel backgrounds + `rgba(255,255,255,.04)` shadows instead of `--panel-deep`/`--scrim`. Works fine in dark mode; tokenize when convenient.
- ✅ **`news.html`** — added `rel="noopener noreferrer"` to the `target="_blank"` thenewsapi.com link. **(done 2026-06-20)**
- ~~`nav.html` weather fetch~~ — **false alarm:** `loadWeather()` already has a full try/catch with a graceful `--°F`/`N/A` fallback. No fix needed. (Static scan flagged it because it has no literal `.catch`, but the try/catch handles it.)
- ~~`economic-calendar.html` error state~~ — **false alarm:** the page's only `fetch` is the nav loader (which has `.catch`); it fetches no market data, so there's no API failure path to harden. No fix needed.
- **`dexcom.html` Chart.js SRI** — **deferred.** It's loaded via a dynamic `chartScript.src = …` (line ~7181) with an `onerror` fallback, not a static `<script>` tag. Adding SRI means setting `.integrity`/`.crossOrigin` in JS; a wrong hash silently blocks the chart. Low value on this reference-copy page — skip unless revisiting dexcom.
- **`nav.html` dark-mode backgrounds** — **approved deliberate leave** (decided 2026-06-20). The `rgba(5,8,12,.88)`/`.97` glass tints don't match `--panel-deep` (`rgba(6,13,24,.85)`); tokenizing would shift the dark nav's look. Left as bespoke; don't re-flag.
- **Document the deliberate color leaves** in the master spec so check 3 stops re-flagging ~180 of them: Dexcom purple `138,99,255`, the nav dark glass tints above, and the bespoke heat/scale gradients in `heat-map.html`, `commodities.html`, `currency.html`, and the gold sweep scale in `options-flow.html`.
- **`dexcom.html` weight** (278 KB, 207 inline styles, 47 color-bearing) — biggest single payload; trim/extract shared CSS if ever revisited. Not urgent (it's a reference copy).

---

## Audit artifacts in repo
- `audit.md` — 18-check structural audit (2026-06-20)
- `audit-perf-security.md` — performance + security audit (2026-06-20)
