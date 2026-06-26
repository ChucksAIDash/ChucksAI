# POLISH-LIST — ChucksAI

> **You are here (2026-06-24 session recap):**
> **Tier 1 + Tier 2 page work is DONE in the repo.** Migrated all market-data fetches off hardcoded keys onto the Cloudflare Worker proxies (`finnhub-proxy` / `polygon-proxy` / `news-proxy`, which Chuck created + set secrets on this session), and throttled the on-load fan-out. **14 files edited** (2 more than the original plan tracked — see note). Final grep confirms zero keys / old provider hosts / `token`/`apiKey`/`api_token` params remain in any HTML. Chuck eyeballed the live site (indices, crypto, forex, news tickers all rendering) and it looks good.
>
> **Status (2026-06-26): migration effectively complete.** Pushed, tested live (all tickers render through proxies). **Finnhub + Polygon keys rotated** and their secrets updated. **thenewsapi key could NOT be rotated** — the provider has no self-serve token regen; deferred as low-risk (free read-only key). The only remaining cleanup is "make a fresh thenewsapi account someday" — parked at the bottom of Tier 4.
>
> **Plan gap caught this session:** the original `MIGRATION-api-key-proxy.md` checklist missed two exposed pages — **`commodities.html`** (Finnhub key) and **`currency.html`'s Polygon key** (`PG_KEY`; the plan only flagged currency's Finnhub call). Both used the same compromised keys, so they were migrated too. Net: the Polygon key was exposed on **two** pages (heat-map + currency), not one. Also corrected two wrong endpoint paths in the plan: insiders is `stock/insider-transactions` (not `stock/insider`), watchlist profile is `stock/profile2` (not `stock/profile`).
>
> _Earlier (2026-06-20): structural + perf/security audits (`audit.md`, `audit-perf-security.md`) and safe cleanup edits (CSS dedupe, nav light-mode tokens, font preconnect)._

---

## ✅ Done this session (changed files — Chuck to commit + push)

- **`styles.css`** — added consolidated shared animations at the end: `@keyframes fadeUp`, `@keyframes spin`, `.fade-in`.
- **Removed the now-redundant per-page copies** of those rules from: `crypto.html`, `currency.html`, `earnings.html`, `economic-calendar.html`, `fear-greed.html`, `index.html`, `news.html`, `options-flow.html`, `treasuries.html`, `chat.html`, `insiders.html`, `ipo.html`, `heat-map.html`, `dexcom-callback.html`. (`.spinner`/`.loading-text` left per-page — they legitimately differ. `dexcom.html` left untouched — it's a reference copy from another project.)
- **`nav.html`** — rewrote all 14 stale `html.light` rules to use design tokens (`var(--bg-card)`, `--border`, `--text-*`, `--accent2`, `--panel-deep`, `--tint-blue*`, `--scrim-soft`) so light mode matches the current Navy Glass palette. Status-dot colors (`#3ddc84`/`#f0b86a`/`#a78bfa`/`#555`) left as semantic literals on purpose.
- **Font `preconnect`** added to all 19 live pages + `_template.html` (two `<link rel="preconnect">` lines before the Google Fonts stylesheet).
- Bonus: stripped stray trailing NUL bytes from edited files (repo HTML is now NUL-clean).

**⚠️ TEST BEFORE/AFTER PUSH:** load the live site in **light mode** and click through the nav (links, dropdowns, weather panel, mobile menu) to confirm the nav.html token rewrite looks right. The old light rules were a white-on-white scheme that didn't match Navy Glass, so this should be a *fix*, but eyeball it.

---

## 🔴 Tier 1 — Security (page edits DONE; key rotation still pending)

**Proxy the market-data API keys.** ✅ **Repo edits done (2026-06-24).** All Finnhub/Polygon/thenewsapi fetches now hit the Worker proxies (`finnhub-proxy` / `polygon-proxy` / `news-proxy`) with no token in the query string. Key constants deleted. **14 files changed:** `index.html`, `currency.html`, `earnings.html`, `fear-greed.html`, `treasuries.html`, `breadth.html`, `insiders.html`, `ipo.html`, `watchlist.html`, `today.html`, `commodities.html` (Finnhub); `heat-map.html`, `currency.html` (Polygon); `news.html`, `index.html` (thenewsapi). Workers created + secrets set in the Cloudflare dashboard this session.
- ✅ **Pushed + tested live (2026-06-26):** pages render indices/crypto/forex/news through the proxies.
- ✅ **Finnhub key rotated** + `FINNHUB_KEY` secret updated (2026-06-26).
- ✅ **Polygon key rotated** + `POLYGON_KEY` secret updated (2026-06-26).
- ⚠️ **thenewsapi key NOT rotated — deferred (low risk).** thenewsapi.com has no self-serve token rotation/regenerate in the dashboard (only displays the one token). Old key still valid + public in git history, but it's a free read-only headlines key (≈100 req/day quota is the only thing at risk — no money/account/data). See Tier 4 for the fix-it-later plan.
- (Anthropic key is fine — already proxied, never client-side.)

## 🟠 Tier 2 — Performance (done with Tier 1)

- ✅ **Throttled on-load Finnhub fan-out (2026-06-24).** `treasuries.html` 6-quote `Promise.all` → sequential loop with 120ms gap. `index.html` 4-wide `mbFhQuote` batch → Finnhub quotes now serialize (120ms gap) while crypto/fear-greed/earnings/news calls stay parallel.

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
- **thenewsapi key — make a fresh account someday (low priority).** The old key (`EaYs…`) couldn't be rotated — thenewsapi.com has no self-serve token regen. To fully retire the leaked key: create a NEW free thenewsapi.com account (Chuck's only account is under infiniti306@gmail.com), grab the new token, paste it into the `NEWS_KEY` secret in the `news-proxy` Worker, reload the news page to confirm. Old account/key can then be abandoned. Low stakes (free read-only headlines, ~100 req/day) — do whenever convenient.

---

## Audit artifacts in repo
- `audit.md` — 18-check structural audit (2026-06-20)
- `audit-perf-security.md` — performance + security audit (2026-06-20)
