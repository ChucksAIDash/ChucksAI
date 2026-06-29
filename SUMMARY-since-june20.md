# ChucksAI — What's Changed Since June 20

_Catch-up summary for the chat project (which hasn't been used since 2026-06-20). All site work since then has gone through Cowork. Current as of 2026-06-28._

---

## TL;DR

Since June 20 the site got its biggest security upgrade (all market-data API keys moved server-side), a round of cleanup (CSS dedupe, nav tokenization, font perf), two new pages (`today.html`, `discord-feed.html`), and a fully two-way Discord #spx feed. Two outages were diagnosed and fixed. A fresh 20-check audit (2026-06-28) shows the repo in good shape — only one small defect was found and it's already fixed.

---

## 1. Security — API keys moved off the client (the big one)

**Before:** Finnhub, Polygon, and thenewsapi keys were hardcoded in page JS and visible in network traffic on the live site (anyone could scrape them).

**Now:** all market-data calls route through Cloudflare Worker proxies — `finnhub-proxy`, `polygon-proxy`, `news-proxy` — exactly like the Anthropic key already did. No key appears client-side anymore.

- 14 HTML files migrated off hardcoded keys onto the proxies.
- Finnhub + Polygon keys **rotated** (old ones treated as compromised).
- thenewsapi key **not** rotated — the provider has no self-serve regen; deferred as low-risk (free read-only headlines, ~100/day). "Make a fresh thenewsapi account someday" is parked at the bottom of the polish list.
- One key remains client-side **by design**: CoinGecko's *demo* key on `index.html` — demo keys are meant to be public (no secret, rate-limit-only), so it's a different/low-risk class. Optional to proxy.

## 2. Two new pages

- **`today.html`** — a "Today" panel: major index ETFs + VIXY (VIX proxy) + session status + movers. Quotes go through `finnhub-proxy`. Built clean (fully tokenized, serialized Finnhub calls, tab-visibility guard) — it's the model new page.
- **`discord-feed.html`** — a feed of the #spx Discord channel: card list, Today / All-Recent scope toggle (grouped by day), inline image attachments with a per-image lightbox + arrow-key nav, shows existing Discord reactions, a two-way 🔥 react button (writes back to Discord as the bot via the Worker), local "mark read" toggle, and an optional Claude "Today's Take" summary (text + vision). Auto-polls only during the weekday pre-market window, with a background-tab guard.

## 3. Discord integration (new Worker)

- New dedicated **`discord-proxy`** Worker (`discord-proxy-worker.js` is the reference copy in the repo). Routes: `GET /messages` (returns slimmed JSON incl. reactions) and `POST /react` (bot adds a reaction; origin-locked to chucksai.com, emoji allow-list). Bot token + channel id are Worker secrets — nothing client-side.
- Homepage (`index.html`) got a Discord summary card too (on-demand text + vision summaries).
- Nav got a top-level **#SPX** desktop link + a mobile entry under Tools.

## 4. Cleanup / polish (from the June-20 audits)

- **CSS dedupe:** shared `@keyframes fadeUp` / `.fade-in` lifted into `styles.css`; per-page copies deleted across ~11 pages (only `dexcom.html` keeps its own, intentionally — it's a reference copy).
- **nav.html light mode:** all 14 stale `html.light` rules rewritten to design tokens so light mode matches the Navy Glass palette.
- **Font preconnect** added to every live page (+ template) — small first-paint win.
- **Finnhub on-load fan-out throttled:** `index.html` and `treasuries.html` no longer fire parallel quote bursts; they serialize with a short delay (matches the free-tier 60/min budget). `today.html` was built serialized from the start.

## 5. Two outages diagnosed + fixed (June 28)

- **Stock data outage** — all Finnhub-backed widgets went dark. Root cause was **not** the code: after the June 26 key rotation, the Worker secret was left stale, so `finnhub-proxy` returned 401 on every call. Fix was to re-mint the key, re-save the secret, **and redeploy the Worker**. Lesson baked into the polish list: after rotating a key, re-save the secret AND redeploy, then confirm 200s live.
- **Glucose widget** on the homepage showed "Not connected" — the Dexcom `/latest` endpoint returns `reading:null` while `/egvs` history has live data. Fixed `loadGlucose()` to fall back to the newest egvs record. (Also fixed a top-bar weather `id` collision with nav.html in the same pass.)

## 6. Fresh audit (2026-06-28)

Re-ran the structural + perf/security audits against the current 23-file repo. Now a **20-check audit** (added Check 19: futures/disallowed-symbol guardrail; Check 20: web-verified API tier limits — Finnhub 60/min, Polygon 5/min, CoinGecko demo 100/min, all unchanged).

- **Only one genuine defect found, and it's fixed:** `currency.html`'s 60s auto-refresh had no background-tab guard (was burning Finnhub quota in hidden tabs). Added `if(document.hidden) return;`.
- An earlier draft flagged two more issues (nav not injected on `index.html`/`discord-feed.html`) — those turned out to be **false positives** from a known sandbox-bash quirk that truncates its read of large files; verified with the proper file reader that both pages have nav injection. No fix needed.
- Audit files (`audit.md`, `audit-perf-security.md`) and `POLISH-LIST.md` are all current.

## 7. Open / deferred (low priority)

- Document the deliberate color gradients (heat-map / commodities / currency / options-flow gold / Dexcom purple) in the master spec so the audit stops re-flagging ~180 of them.
- Verify served security headers (`curl -sI https://chucksai.com`) and confirm the `_headers` file covers HSTS / nosniff / X-Frame-Options / Referrer-Policy.
- thenewsapi: make a fresh account someday to retire the un-rotatable key.
- `dexcom.html` weight (278 KB) — trim if ever revisited; not urgent (reference copy).

## Workflow note

All updates since June 20 happened through Cowork, editing the repo files directly at `C:\Users\Infin\Desktop\ChucksAI` (you commit + push yourself). Worker code lives in the Cloudflare dashboard, not the repo. The chat project's copies of the planning docs are now behind the repo — treat the repo's `POLISH-LIST.md` / `audit.md` as the source of truth.
