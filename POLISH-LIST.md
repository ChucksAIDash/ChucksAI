# POLISH-LIST — ChucksAI

> **You are here (2026-06-28 session recap — AUDIT RE-RUN):**
> **Re-ran both audits against current repo (23 files now — added `today.html` + `discord-feed.html`). `audit.md` is now a 20-check audit (Check 19: futures/disallowed-symbol guardrail; Check 20: web-verified API tier limits).** Most June-20 issues are RESOLVED: key-proxy migration complete + verified (zero keys/hosts in HTML), CSS dedupe done, nav light-mode tokenized, preconnect on all pages, Finnhub fan-out serialized on index/treasuries/today.
> **ONE genuine fix this session — DONE:**
> **✅ `currency.html` auto-refresh tab-visibility guard.** Its 60s `setInterval` → `loadMarketData()` (line 327) had no `if(document.hidden) return;`, burning Finnhub forex quota in background tabs. **FIXED** (added the guard, mirrors options-flow/today/discord-feed). **File changed: `currency.html` (Chuck to commit + push).**
> **⚠️ IMPORTANT lesson (re-)learned:** an earlier draft of the audit FAILed `index.html` + `discord-feed.html` on nav injection (Check 5) and marked discord-feed exempt on Check 17 — **both were FALSE POSITIVES from the sandbox-bash truncation artifact.** bash `grep` only saw the first ~1101/574 lines and missed the nav-inject + auto-poll code at the bottom of each file. Re-verified with the Read tool: both pages DO have the standard `injectNav()`+`fetch('nav.html')`, and discord-feed's 60s auto-poll already has the `document.hidden` guard. **Rule: verify any "X is missing" finding with the Read tool, never off bash on just-edited repo files.** (This is the exact artifact the memory warns about — it bit again.)
> **Lower-priority carryovers:** `discord-feed.html` not fully tokenized (23 residual rgba/hex — lightbox scrims + reaction pills); CoinGecko demo key still client-side on index.html (by-design public, low risk — optional to proxy); deliberate color gradients still undocumented in master spec; verify served security headers via curl.
> **Check 19 (futures/disallowed-symbol guardrail):** PASS — no `^VIX/^SPX/futures` symbols reach any API; `^VIX` in today.html is comments/UI copy only, actual symbol is `VIXY`.
> **Check 20 NEW (web-verified API tier limits):** PASS — re-checked limits on the web 2026-06-28: Finnhub 60/min, Polygon 5/min, CoinGecko demo 100/min+10k/mo, thenewsapi low daily read-only — all UNCHANGED, so the throttle assumptions still hold. Re-run this web check each audit or on any 429s.
> **Added a "When to re-audit" standing checklist** at the bottom of `audit.md` (trigger conditions for future audit runs: new page, key rotation, 429s, heavy edits, ~quarterly).
> **Code changed this session:** `currency.html` (visibility guard). **Docs updated:** `audit.md` (now 20 checks), `audit-perf-security.md`, this recap. **Chuck to commit + push `currency.html`.**
>
> ---
>
> **You are here (2026-06-28 session recap — outage fixes: Finnhub key + glucose widget):**
> **Two bugs found + fixed.**
> **(1) STOCK DATA OUTAGE (root cause: stale Worker secret, NOT the code).** All Finnhub-backed widgets (SPY/indices/Mag 7/meme tickers) went dark sometime after the 2026-06-26 key rotation. Live browser network check showed `finnhub-proxy` returning **401** on every `/quote` call while dexcom/discord/news proxies returned 200 — so the rotated Finnhub key never bound to the Worker secret. Chuck only stored the key in Cloudflare (write-only secrets, can't read back), so we re-minted the key from finnhub.io, confirmed it directly (`/quote?symbol=SPY&token=…` returned valid JSON), re-saved the `FINNHUB_KEY` secret + **redeployed** the Worker. Verified live: `/quote` now returns **200** for SPY/QQQ/DIA. **No HTML/code change — page code was always correct.** Lesson: after rotating a key, re-save the Worker secret AND redeploy, then load the live site to confirm 200s. (Secondary: occasional **429** on SPY = free-tier rate limit, harmless.)
> **(2) GLUCOSE widget on index.html (FIXED IN CODE).** Top-bar glucose showed "— / Not connected" because the Dexcom `/latest` endpoint returns `{"reading":null}` while `/egvs` history returns full live records. The widget only read the current value from `/latest`, so a null reading killed it. **Fix:** `loadGlucose()` now parses egvs history first and falls back to `records[0]` (newest record) for current value/trend/time when `/latest.reading` is null. Verified against live data → renders **138 → flat → "Avg 24h: 126 mg/dL · 61m ago"**. **File changed: `index.html` (Chuck to commit + push).**
> **(3) WEATHER on index.html top bar — ID COLLISION with nav.html (FIXED IN CODE).** After the Finnhub fix, the top-bar weather showed icon + description but **temp stuck at `--°F`**. Root cause: nav.html's injected weather panel uses `id="wxTemp"` — the SAME id as the index top-bar widget. Two `#wxTemp` elements → `getElementById('wxTemp')` returns nav's, so index's `loadWeather()` wrote the temp into nav's hidden element while its own top-bar temp never updated. (Desc/icon worked because `wxDesc`/`wxIcon` are unique to index; nav uses `wxCond`/`wxFeels`.) **Fix:** renamed index top-bar weather ids → `topWxTemp`/`topWxDesc`/`topWxIcon` (markup + `loadWeather()` JS). nav.html untouched. **File changed: `index.html`.**
>
> **Files changed (Chuck to commit + push):** `index.html` (glucose egvs fallback + weather id-collision rename).
>
> ---
>
> **You are here (2026-06-27 session recap — Discord Feed build, round 2):**
> **Page + Worker code BUILT, feature wired, feed CONFIRMED WORKING live by Chuck.** Round 2 added enhancements (below). Still pending: the new two-way react route + redeploying the updated Worker.
> **`discord-feed.html`** (new page) — card list of #spx posts; **Today / All-Recent scope toggle** (All-Recent is **grouped by day** with Today/Yesterday/weekday headers); inline image attachments with a **lightbox that opens each image individually + prev/next arrows + arrow-key nav** (fixed the round-1 bug where all images in a post opened at once); **moderate size bump** (body 16px, images up to 680px single / 320px multi); shows **existing Discord reactions** on each post; **two-way 🔥 react button** (writes to Discord as the bot via the Worker /react route); **local "mark read"** toggle (dims read posts, stored in browser localStorage); optional Claude "Today's Take" summary via the Anthropic proxy. Feature flags at top of the script: `ENABLE_AI_TAKE`, `ENABLE_REACT`, `QUICK_EMOJI`.
> **`nav.html`** — top-level `#SPX` desktop link + `💬 Discord #spx Feed` under Tools (mobile).
> **`discord-proxy-worker.js`** — Worker code. Routes: `GET /messages?limit=50` (returns slimmed JSON incl. reactions) and `POST /react {messageId,emoji}` (bot adds reaction; origin-locked to chucksai.com; emoji allow-list 🔥👍👀✅🚀💯). Secrets: `DISCORD_BOT_TOKEN` + `DISCORD_CHANNEL_ID`.
> **Architecture:** page → `discord-proxy.infiniti306.workers.dev` (new dedicated Worker, matches `news-proxy` pattern) → Discord REST. No token client-side.
> **Reactions note:** clicking 🔥 on the site adds the reaction *as the bot account* (not Chuck's personal Discord identity) — Chuck OK'd this (small 9-person friends' server). Real "react as you" would need full Discord OAuth login (deferred).
> **Chuck still needs to:** (1) finish bot setup on discord.com/developers — **Message Content Intent ON, Public Bot OFF**; invite via OAuth2 URL with **View Channels + Read Message History + Add Reactions**; (2) create `discord-proxy` Worker + paste `discord-proxy-worker.js`; (3) set the two secrets; (4) commit + push. If the Worker was already deployed from round 1, **re-paste the updated code** (adds reactions + /react route).
>
> **Files changed (Chuck to commit + push):** `discord-feed.html`, `nav.html`, `discord-proxy-worker.js`.
>
> ---
>
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
- ✅ **Finnhub key rotated** + `FINNHUB_KEY` secret updated (2026-06-26). ⚠️ **The 2026-06-26 rotation left the Worker secret stale → multi-day Finnhub 401 outage; re-minted + re-saved + redeployed 2026-06-28 (now 200). After any key rotation: re-save the secret, REDEPLOY the Worker, then confirm 200 on the live site.**
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
