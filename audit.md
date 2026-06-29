# ChucksAI Codebase Audit

_Generated: 2026-06-28 · Fresh re-scan of every `.html` in repo root (`C:\Users\Infin\Desktop\ChucksAI`). Supersedes the 2026-06-20 run. Re-checked against live bytes after the big June work: API-key proxy migration, CSS dedupe into `styles.css`, nav light-mode tokenization, font preconnect, Finnhub fan-out throttling, the new `today.html` panel, and the new `discord-feed.html` page. Now a 20-check audit (added Check 19: futures/disallowed-symbol guardrail; Check 20: web-verified API tier limits). See "When to re-audit" at the end for future-run triggers._

**Legend:** ✅ Pass · ❌ Fail · — Not applicable · ⚠️N residual count (see detail) · ℹ️ informational/expected

Files scanned: **23** `.html` in repo root (was 21 on 2026-06-20). New since last audit: **`today.html`**, **`discord-feed.html`**. No backup/duplicate files, no `*.bak`/`*-old`/`*-copy`. NUL-byte check is clean (verified via python, not bash — the sandbox-bash NUL display artifact is a known false positive and was ignored).

## What changed since 2026-06-20 (resolved items)

These were **FAIL/⚠️** last time and are now **PASS** — verified this scan:

- **Client-side market-data keys → PROXIED.** Zero Finnhub/Polygon/thenewsapi keys or direct hosts in any HTML. All route through `finnhub-proxy` / `polygon-proxy` / `news-proxy` Workers. (Check 9 / see perf-security audit 1.1.)
- **Duplicated global animations → DEDUPED.** `@keyframes fadeUp` / `.fade-in` lifted into `styles.css`; per-page copies deleted everywhere except `dexcom.html` (reference copy, intentionally untouched). Only `dexcom.html` still defines `@keyframes fadeUp` locally. (Check 7.)
- **nav.html light-mode hardcodes → TOKENIZED.** All 14 stale `html.light` rules rewritten to design tokens. (Check 3.)
- **Font preconnect → ADDED to all 21 live pages + `_template.html`.** (perf 2.3.)
- **Finnhub on-load fan-out → SERIALIZED.** `index.html` (sequential loop, 120ms gap) and `treasuries.html` (sequential loop, 120ms gap) no longer fire parallel `Promise.all`. New `today.html` is serialized from the start (130ms gap). (Check 18.)

## Check matrix

| File | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `index.html` | ✅ | ✅ | ⚠️16 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️25/0c | ✅ | ✅ | — | ✅ | ✅ |
| `today.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️2/0c | ✅ | ✅ | ✅ | ✅ | ✅ |
| `discord-feed.html` | ✅ | ✅ | ⚠️23 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️2/0c | ✅ | ✅ | ✅ | ℹ️ | — |
| `_template.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ℹ️ | ✅ | ✅ | ✅ | — | — | — |
| `nav.html` | — | — | ⚠️ | — | — | — | ✅ | ✅ | ✅ | ❌ | — | ❌ | ❌ | ✅ | ✅ | ✅ | — | — | — |
| `fear-greed-crypto.html` | — | — | ✅ | — | — | — | — | — | — | ✅ | — | — | ✅ | — | ✅ | ✅ | — | — | — |
| `breadth.html` | ✅ | ✅ | ⚠️10 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️27 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `chat.html` | ✅ | ✅ | ⚠️6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️3 | ✅ | ✅ | — | — | — |
| `commodities.html` | ✅ | ✅ | ⚠️47 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️4 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `crypto.html` | ✅ | ✅ | ⚠️1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️4 | ✅ | ✅ | — | — | ℹ️ |
| `currency.html` | ✅ | ✅ | ⚠️38 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️4 | ✅ | ✅ | ✅ | ✅ | ✅ |
| `dexcom-callback.html` | ✅ | ✅ | ⚠️10 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |
| `dexcom.html` | ✅ | ✅ | ⚠️132 | ✅ | ✅ | ✅ | ⚠️5 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️205/52c | ✅ | ✅ | — | — | — |
| `earnings.html` | ✅ | ✅ | ⚠️6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️11 | ✅ | ✅ | — | ✅ | ✅ |
| `economic-calendar.html` | ✅ | ✅ | ⚠️12 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️13/6c | ✅ | ✅ | — | — | — |
| `fear-greed.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️21 | ✅ | ✅ | — | ✅ | ✅ |
| `heat-map.html` | ✅ | ✅ | ⚠️49 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️11/9c | ✅ | ✅ | — | ✅ | ℹ️ |
| `insiders.html` | ✅ | ✅ | ⚠️11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️6 | ✅ | ✅ | — | ✅ | ✅ |
| `ipo.html` | ✅ | ✅ | ⚠️11 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️4 | ✅ | ✅ | — | ✅ | ✅ |
| `news.html` | ✅ | ✅ | ⚠️3 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️18/6c | ✅ | ✅ | — | — | — |
| `options-flow.html` | ✅ | ✅ | ⚠️13 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️21 | ✅ | ✅ | ✅ | — | — |
| `treasuries.html` | ✅ | ✅ | ⚠️6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️7/1c | ✅ | ✅ | ✅ | ✅ | ✅ |
| `watchlist.html` | ✅ | ✅ | ⚠️17 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️17 | ✅ | ✅ | ✅ | ✅ | ✅ |

> `⚠️` is not automatically a defect. Checks 3 and 14 contain a large share of deliberate leaves (documented heat-scale gradients, Dexcom brand purple, status-dot colors). Inline-style cells show `total / Nc` where `Nc` = how many contain a hardcoded color. The Detailed Findings below separate genuine misses from deliberate leaves.

---

## Detailed Findings Per Check

### Check 1 — `theme.js` first script in `<head>` (before `styles.css`)
**Pass on all 21 live pages**, including the two new ones. `today.html` and `discord-feed.html` both have `theme.js` at the top of `<head>` (line 8/9) before the `styles.css` link. N/A for `nav.html` (fragment) and `fear-greed-crypto.html` (shim).

### Check 2 — `theme.js` loaded via root-relative path
**Pass everywhere.** All pages use `src="theme.js"` — no subfolder/leading-slash variants.

### Check 3 — No hardcoded colors in `<style>` blocks
Tokenization broadly in place. Residual counts are mostly **deliberate leaves** (heat-scale gradients, Dexcom purple, status dots). New-page status:

- **`today.html` — ✅ clean.** Zero hex, zero rgba in its `<style>` block. Fully tokenized — a model new page.
- **`discord-feed.html` — ⚠️23 (3 hex + 20 rgba).** New page; not yet fully tokenized. The rgba values are mostly lightbox-overlay scrims (`rgba(0,0,0,.x)`, `rgba(255,255,255,.x)` on `.lb-nav` hover) and reaction-pill tints. Candidate for a tokenization pass (introduce `--scrim`/`--overlay` tokens), but low visual risk. Not urgent.

Otherwise unchanged from 2026-06-20: `dexcom.html` (132, mostly Dexcom purple), `heat-map.html`/`commodities.html`/`currency.html` (bespoke heat gradients), `options-flow.html` (gold sweep scale). `fear-greed.html`, `today.html`, `_template.html` are the fully-tokenized pages.

**Still recommended:** document the bespoke heat/scale gradients + Dexcom purple in the master spec as approved leaves so they stop inflating this count (~180 across 4 pages). Carried over from last audit — still open.

### Check 4 — `<div id="nav-placeholder"></div>` present
**Pass on all live pages.** Present on both new pages.

### Check 5 — `injectNav()` defined and called via `fetch('nav.html')`
**Pass on all live pages, including `index.html` and `discord-feed.html`.**

> ⚠️ **Correction (verified with the Read tool):** an earlier draft of this audit FAILed `index.html` + `discord-feed.html` here. That was a **false positive caused by the known sandbox-bash truncation artifact** — `grep` only saw the first ~1101 lines of `index.html` and ~574 of `discord-feed.html`, cutting off the nav code that lives at the very bottom of each file. Reading the actual file tails shows the standard helper is present and correct:
> - `index.html` lines 1293–1310: `injectNav()` + `fetch('nav.html').then(...).then(injectNav)`.
> - `discord-feed.html` lines 896–915: same standard helper ("NAV INJECT — standard on all pages — do not modify"), plus `updateNavDot()` which correctly assumes the injected nav.
>
> **Lesson reinforced:** never run Check 5 (or any "is X missing?" check) off bash `grep` on just-edited repo files — verify absence with the Read tool. This is the exact failure mode the project memory warns about.

Every live page defines `injectNav()` and calls it via `fetch('nav.html')` (no `.innerHTML` injection). N/A for `nav.html` (it *is* the nav) and the shim.

### Check 6 — No hardcoded copy-pasted `<nav>` block
**Pass everywhere.** The only `<nav>` markup lives in `nav.html`.

### Check 7 — No reusable/global CSS classes redefined per-page
**Largely resolved since 2026-06-20.** `@keyframes fadeUp` / `.fade-in` were consolidated into `styles.css` and deleted from the per-page `<style>` blocks. Only `dexcom.html` still defines `@keyframes fadeUp` locally — intentional (it's a reference copy from another project, left untouched). `.spinner`/`.loading-text` remain per-page by design (they legitimately differ). New pages `today.html`/`discord-feed.html` do not redefine the shared animations. **No action.**

### Check 8 — No `console.log` statements
**Pass everywhere.** Zero `console.log` across all 23 files.

### Check 9 — No `localhost` / leaked keys / unexpected endpoints
**Pass.** No `localhost`/`127.0.0.1`. **No Finnhub/Polygon/thenewsapi keys or direct hosts in any HTML** (migration confirmed). Worker proxies in use: `anthropic`, `dexcom-proxy`, `discord-proxy`, `finnhub-proxy`, `news-proxy`, `polygon-proxy` (all `*.infiniti306.workers.dev`).

ℹ️ **One client-side key remains by design:** `index.html` line 932 sends CoinGecko's `x_cg_demo_api_key=${CG_KEY}` in the clear. This is CoinGecko's **free demo key**, which is *intended* to be used client-side (public, no-secret, rate-limited-only API). Low risk — not the same class as the Finnhub/Polygon leaks that were proxied. Flagged informational; proxy it too if you ever want zero client-side keys, but not required.

### Check 10 — `<meta charset>` present
**Pass on all live pages + shim.** N/A for `nav.html` (fragment). (`dexcom.html` shows 2 charset hits — one real meta + one inside an inline string; not a defect.)

### Check 11 — `<meta name="viewport">` present
**Pass on all live pages.** N/A for fragment + shim.

### Check 12 — `styles.css` linked
**Pass on all live pages** including both new ones. Not linked in `nav.html` (fragment) or the shim — expected.

### Check 13 — Meaningful `<title>`
**Pass on all live pages** — every page has a real "Chuck's AI — …" title, including `today.html` and `discord-feed.html`. `_template.html` carries the TODO placeholder (expected). `nav.html` has none (fragment).

### Check 14 — Inline `style=""` attributes
New pages are clean: `today.html` (2 inline, 0 color) and `discord-feed.html` (2 inline, 0 color). `index.html` now **25 inline / 0 color-bearing** (improved — the color-bearing ones from last audit are gone; all remaining are dynamic display/width). The only meaningful concentration remains **`dexcom.html` (205 inline / 52 color-bearing)** — unchanged, still the lone real cleanup candidate (glucose-range tints → classes). `news.html` (6 color) and `economic-calendar.html` (6 color) are minor candidates. Everything else is zero-color dynamic styling or deliberate heat fills.

### Check 15 — Repo cleanliness
**Clean.** No backup/duplicate files, no `*.bak`/`*-old`/`*-copy`, no `_wtest.tmp`. The two new files are legitimate pages, not strays.

### Check 16 — NUL bytes
**Clean — verified via python** (`b.count(b'\x00')` == 0 on every file). The sandbox-bash `grep` that flags fake NULs on recently-edited files fired again here (flagged all 23); that's the known artifact and was overridden by the authoritative python read.

### Check 17 — Tab-visibility auto-refresh pause  ✅ FIXED THIS SESSION (currency.html)
Auto-refreshing pages must guard their refresh with `if (document.hidden) return;` so background tabs don't burn rate-limited quota.

- `treasuries.html`, `watchlist.html`, `breadth.html`, `commodities.html`, `options-flow.html`, `today.html` — ✅ all guarded.
- **`currency.html` — ✅ now fixed.** Its 60s auto-refresh countdown (`setInterval` at line 327) called `loadMarketData()` with no `document.hidden` guard — firing Finnhub forex quotes every 60s even in a background tab. **Fixed 2026-06-28:** added `if(document.hidden) return;` at the top of the interval callback (mirrors `options-flow.html`). File changed: `currency.html` (Chuck to commit + push).
- **`discord-feed.html` — ✅ guarded (verified via Read, not bash).** It *does* auto-poll: `startAutoPoll()` at line 879 runs a 60s `setInterval` (`POLL_MS`) that calls `refreshAllChannels()` only during the weekday pre-market posting window — and it already opens with `if (document.hidden) return;` (line 881). The earlier "N/A — no setInterval" note was another bash-truncation artifact; the poll code lives past the truncation point. Correctly guarded, no action.
- `index.html`, `heat-map.html` — load-once / manual; exempt.

### Check 18 — Finnhub call serialization
**Both prior FAILs resolved.**

- `index.html` — ✅ now serialized: `for (const s of fhSyms) { …await mbFhQuote(s)…; await setTimeout(120); }` (lines 949–951). The non-Finnhub calls (crypto/fg/earnings/news) stay parallel via `allSettled` — correct.
- `treasuries.html` — ✅ now serialized: `for (const b of BONDS) { await fhQuote…; await setTimeout(120); }` (lines 228–230).
- `today.html` — ✅ serialized from the start: `for (const sym of allSyms) { await fhQuote…; await setTimeout(130); }` (lines 354–356).
- `currency.html`, `watchlist.html` — ✅ batched/sequential (unchanged).
- `crypto.html`, `heat-map.html`, `news.html` — ℹ️ parallel fetches target Coinbase/Polygon/thenewsapi, **not Finnhub** — out of scope (noted ℹ️). `heat-map.html` still fans out ~11 Polygon calls via `Promise.all` (line 465) — fine unless Polygon rate-limits bite; see Check 19.
- `discord-feed.html` — ℹ️ its auto-poll fans out one `Promise.all` per channel-tab against the **`discord-proxy` Worker** (line 819), not Finnhub. Small (a handful of channel ids), origin-locked, polls only in the pre-market window with a `document.hidden` guard. Out of scope for Finnhub; noted for completeness.

### Check 19 — Futures / disallowed-symbol guardrail (NEW)
Rule: Finnhub free tier rejects index/futures symbols (`^VIX`, `^SPX`, `^GSPC`, `=F`, `/ES`, `/NQ`, etc.). All index/vol exposure must use **ETF proxies** (SPY, QQQ, DIA, IWM, VIXY, UVXY).

**Pass — no disallowed symbols are sent to any API.**

- Repo-wide grep for `^VIX/^SPX/^GSPC/=F//ES//NQ` as live symbols: the only hits are in **`today.html`**, and both are in **comments / UI copy** ("ETF proxies … no ^VIX/SPX/futures"; "VIXY tracks short-term VIX futures (free-tier proxy for ^VIX)") — *not* symbols passed to `fhQuote()`. The actual symbol used for vol is `VIXY`. Correct.
- ETF proxies confirmed in use: SPY (13×), QQQ (12×), DIA (9×), IWM (8×), VIXY (3×). `today.html` index list also uses MDY/EFA — all ETFs, all Finnhub-free-tier-safe.
- No raw index or futures ticker reaches Finnhub, Polygon, or Coinbase.

**Recommendation (forward-looking):** keep this check in every future audit. If a futures/index page is ever built, it must (a) use ETF proxies for Finnhub free tier, (b) route through a Worker proxy (no client-side keys), (c) serialize multi-symbol Finnhub calls, and (d) add the tab-visibility guard if it auto-refreshes. Those four are the standing acceptance criteria for any new market-data page.

### Check 20 — API free-tier limits still current (web-verified)
This audit's throttling logic hardcodes assumptions about free-tier rate limits (e.g. "Finnhub 60/min", "Polygon 5/min"). Those can change over time, so each re-audit should re-verify them on the web. **Verified 2026-06-28:**

| Provider | Audit assumes | Verified current (2026-06-28) | Status |
|---|---|---|---|
| Finnhub (free) | 60 calls/min | **60 calls/min** | ✅ unchanged |
| Polygon.io (free) | 5 calls/min | **5 calls/min** | ✅ unchanged |
| CoinGecko (demo key) | — (not previously stated) | **100 calls/min, 10,000/month** | ✅ noted — comfortably above the homepage's handful of calls |
| thenewsapi (free) | ~100 req/day, read-only | low daily quota, free read-only (exact number not surfaced this scan) | ✅ consistent, no change found |

**No limit changed**, so all the serialization/throttle gaps (120–130ms loops) and the "shared 60/min" framing remain valid. The CoinGecko demo key (Check 9 ℹ️) is well within its 100/min — reinforces that it's low-risk.

**Recommendation:** re-run this web check each audit (or any time a page starts throwing 429s). If Finnhub ever drops below 60/min or Polygon below 5/min, revisit the loop gaps on `index.html` / `treasuries.html` / `today.html` / `currency.html` and the `heat-map.html` 11-wide Polygon `Promise.all`.

---

## Summary — Top Issues (genuine, ranked by impact)

> **One genuine fix this session, now done.** The two "❌" nav-injection findings in an earlier draft were **false positives** from bash-truncated reads — both pages actually have the standard nav injection (verified with the Read tool). The only real defect was `currency.html`'s missing visibility guard, fixed below.

1. **✅ FIXED — `currency.html` auto-refresh tab-visibility guard (Check 17).** Was firing Finnhub forex quotes every 60s in background tabs. Added `if(document.hidden) return;`. **File changed: `currency.html` — Chuck to commit + push.**

2. **⚠️ `discord-feed.html` not fully tokenized (Check 3, 23 residual).** New page with hardcoded scrim/overlay rgba in the lightbox + reaction pills. Low visual risk; tokenize when convenient.

3. **⚠️ Carryover — `dexcom.html` inline color styles (52 color-bearing).** Unchanged; reference copy, low priority.

4. **⚠️ Carryover — document the deliberate color gradients in the master spec** so Check 3 stops re-flagging ~180 of them (heat-map / commodities / currency / options-flow gold / Dexcom purple). Still open from 2026-06-20.

5. **⚠️ Carryover — verify served security headers** via `curl -sI` and confirm the `_headers` file covers HSTS/nosniff/X-Frame-Options/Referrer-Policy.

6. **ℹ️ Optional — CoinGecko demo key still client-side on `index.html`.** By-design public key, low risk; proxy it only if you want literally zero client-side keys.

### What's fully clean (no action)
Checks **1, 2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 18, 19, 20** pass across all applicable files. The June-20 FAILs on Check 18 (Finnhub fan-out) are **resolved**, the key-proxy migration is **complete**, CSS dedupe **done**, nav light-mode **tokenized**, preconnect **added everywhere**, the futures-symbol guardrail **passes**, and the API tier limits are **web-verified unchanged**. `today.html` is a model new page (clean on every check). After Read-tool re-verification, **nav injection passes on every page** (the earlier index/discord-feed FAILs were bash-truncation false positives), and the **only genuine defect — `currency.html`'s missing visibility guard — was fixed this session.** The repo is in good shape.

---

## When to re-audit (standing checklist for future runs)

Re-run this audit when any of these happen:

- **A new page is added** — run Checks 1–18 on it; new pages must pass the four market-data acceptance criteria in Check 19 if they touch market data.
- **A key is rotated** — re-verify Check 9 (no client-side keys) and confirm the Worker secret was re-saved AND the Worker redeployed (the 2026-06-28 Finnhub outage was a stale-secret-after-rotation issue).
- **A page starts throwing 429s** — re-run Check 20 (web-verify tier limits) and re-check the relevant throttle loop (Check 18) + visibility guard (Check 17).
- **Heavy edits to an existing page** — re-run Checks 5 (nav injection — the index/discord-feed regression came from exactly this) and 7/14 (CSS/inline drift).
- **Roughly quarterly regardless** — re-verify Check 20 limits and re-scan for accumulated inline-style / hardcoded-color drift.

Open carryover tasks tracked in `POLISH-LIST.md`: document the deliberate color gradients in the master spec (stops Check 3 re-flagging ~180 leaves); verify served security headers via `curl -sI`.
