# ChucksAI HTML Audit

_Generated 2026-05-23 · 18 files scanned — updated 2026-06-09 · 5 new pages added_

**Legend:** ✅ Pass · ❌ Fail · — Not applicable (component or redirect-only page)

> **Notes on special files:**
> - `nav.html` is the injected nav component, not a standalone page. Checks that apply only to pages are marked —.
> - `fear-greed-crypto.html` is a bare redirect shim (`window.location.replace`). Page-level checks are mostly N/A.
> - `dexcomB4Change.html` and `dexcomog.html` appear to be deprecated backup copies of `dexcom.html`.

---

## Audit Table

| File | 1 theme.js first? | 2 theme.js path ok? | 3 No hardcoded colors? | 4 #nav-placeholder? | 5 injectNav() called? | 6 No old nav block? | 7 No reusable styles? | 8 No console.log? | 9 No localhost/bad endpoints? | 10 meta charset? | 11 meta viewport? | 12 styles.css linked? | 13 Meaningful title? | 14 No inline style=""? |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `_template.html` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `chat.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `crypto.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `currency.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `dexcom-callback.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `dexcom.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `dexcomB4Change.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `dexcomog.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `earnings.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `economic-calendar.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `fear-greed-crypto.html` | ❌ | — | ✅ | — | — | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `fear-greed.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `heat-map.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `index.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `nav.html` | — | — | ❌ | — | — | — | — | ✅ | ✅ | — | — | — | — | ❌ |
| `news.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `options-flow.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `treasuries.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `commodities.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `breadth.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `ipo.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `insiders.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `watchlist.html` | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Detailed Findings Per Check

### Check 1 — theme.js first script in `<head>`
All content pages load `<script src="theme.js">` as the very first script tag, correctly before any stylesheet link (appears at line 7 on every applicable page). **No flash-of-unstyled-theme risk on content pages.**

`fear-greed-crypto.html` ❌ — loads an inline redirect script instead; no `theme.js` at all. Since the page immediately navigates away, flash risk is negligible, but it's inconsistent.

### Check 2 — theme.js loaded from correct path
Every page that loads `theme.js` uses `src="theme.js"` (root-relative). No subdirectory paths found anywhere.

### Check 3 — No hardcoded color values
**Every content page fails this check.** Hardcoded colors appear in two forms:

- **Hex literals** in `<style>` blocks — worst offenders:
  - `nav.html`: 31 hex values (e.g., `#0a1628`, `#1a2840`, `#7fd9b8`)
  - `currency.html`: 38 hex values (heat-map scale: `#004400`, `#002a00`, `#060d18`, etc.)
  - `dexcom.html` / `dexcomB4Change.html` / `dexcomog.html`: 9 hex each

- **Hardcoded `rgba()` values** in `<style>` blocks instead of CSS variables — pervasive across all pages. Notable counts:
  - `dexcom.html`: 118 rgba instances
  - `heat-map.html`: 61 rgba instances
  - `options-flow.html`: 30 rgba instances
  - `index.html`: 35 rgba instances

**Clean pages:** `_template.html` (0), `fear-greed-crypto.html` (redirect, 0).

### Check 4 — `#nav-placeholder` present
All 16 content pages include `<div id="nav-placeholder"></div>`. ✅ across the board.

### Check 5 — `injectNav()` called
All 16 content pages define and call `injectNav()` followed by `fetch('nav.html')`. ✅ across the board. `fear-greed-crypto.html` and `nav.html` are correctly excluded.

### Check 6 — No old copy-pasted nav block
No content page contains a hardcoded `<nav>` block. The only `<nav id="site-nav">` lives inside `nav.html` itself (correct). ✅ all pages.

### Check 7 — No reusable/global styles that should live in `styles.css`
The following classes are **defined independently in multiple page `<style>` blocks** and should be consolidated into `styles.css`:

| Class | Pages that redefine it |
|---|---|
| `.spinner` | `crypto.html`, `currency.html`, `dexcom-callback.html`, `dexcom.html`, `dexcomB4Change.html`, `dexcomog.html`, `earnings.html`, `fear-greed.html`, `news.html`, `options-flow.html`, `treasuries.html` — **11 pages** |
| `.loading-text` | `crypto.html`, `currency.html`, `earnings.html`, `fear-greed.html`, `news.html`, `options-flow.html`, `treasuries.html` — **10 pages** (+ variants in dexcom/index) |
| `.countdown-badge` | `dexcom.html`, `dexcomB4Change.html`, `dexcomog.html` — should already be in `styles.css` |
| `.modal-overlay` / `.modal-box` / `.modal-close` | `currency.html` (only 1 page but clearly global) |
| `.fade-in` / `@keyframes fadeUp` | Defined in multiple pages as identical blocks |

**Clean pages:** `_template.html` (empty style block), `chat.html` (all styles are genuinely chat-specific), `fear-greed-crypto.html` (no styles).

### Check 8 — No `console.log` statements
Zero `console.log` calls found anywhere. Some `console.error` and `console.warn` calls exist (e.g., `console.warn('nav.html not found')`) — these are appropriate for error handling and do not need removal.

### Check 9 — No localhost or unexpected API endpoints
No `localhost` references anywhere. All API endpoints are expected for this application:
- `api.coinbase.com` — crypto spot prices
- `finnhub.io` — stock quotes
- `api.polygon.io` — chart candles
- `api.alternative.me/fng/` — Fear & Greed index
- `api.coingecko.com` — crypto prices (index.html)
- `api.open-meteo.com` — weather (nav.html, index.html)
- `api.thenewsapi.com` — news feed
- `anthropic.infiniti306.workers.dev` — Claude AI proxy (Chuck's Cloudflare Worker)
- `dexcom-proxy.infiniti306.workers.dev` — Dexcom OAuth proxy (Chuck's Cloudflare Worker)

### Check 10 — `<meta charset>` present
All 16 content pages and `fear-greed-crypto.html` include `<meta charset="UTF-8"/>`. `nav.html` omits it, which is acceptable as it's a fragment, not a full document.

### Check 11 — `<meta name="viewport">` present
`fear-greed-crypto.html` ❌ — missing viewport meta. All 16 content pages pass. Since `fear-greed-crypto.html` immediately redirects, mobile rendering impact is minimal, but the tag should still be added for correctness.

### Check 12 — `styles.css` linked
`fear-greed-crypto.html` ❌ — does not link `styles.css`. As a redirect page this is acceptable, but is inconsistent.

### Check 13 — Meaningful `<title>` tag
`_template.html` ❌ — title is literally `Chuck's AI — TODO: PAGE TITLE` (unfilled placeholder). All other content pages have distinct, meaningful titles.

Note: `dexcom.html`, `dexcomB4Change.html`, and `dexcomog.html` all share the title `Chuck's AI — Glucose`. The latter two appear to be deprecated backup files and should be removed from the repo rather than given unique titles.

### Check 14 — No inline `style=""` attributes
This is the second most widespread issue after hardcoded colors. Every content page except `dexcom-callback.html` has at least some inline styles.

**Extreme cases** (likely from copy-paste or JS-generated HTML):
| File | Inline `style=` count | Inline styles with hardcoded colors |
|---|---|---|
| `dexcom.html` | **204** | **51** |
| `dexcomB4Change.html` | **203** | **50** |
| `dexcomog.html` | **200** | **47** |
| `index.html` | 26 | 0 |
| `fear-greed.html` | 21 | 0 |
| `options-flow.html` | 21 | 0 |
| `news.html` | 18 | 6 |
| `economic-calendar.html` | 13 | 6 |
| `heat-map.html` | 11 | 9 |
| `earnings.html` | 11 | 0 |
| `treasuries.html` | 7 | 1 |
| `currency.html` | 4 | 0 |
| `crypto.html` | 4 | 0 |
| `chat.html` | 3 | 0 |
| `_template.html` | 1 | 0 (uses `var(--accent)`) |
| `breadth.html` | 27 | 0 |
| `watchlist.html` | 17 | 0 |
| `insiders.html` | 6 | 0 |
| `ipo.html` | 4 | 0 |
| `commodities.html` | 4 | 0 |

The massive counts in the dexcom files are partly from JS-generated HTML strings (e.g., `style="display:none"`, `style="font-size:${fs}"`, `style="color:${color}"`). These should be replaced with CSS classes and `data-` attributes.

---

## Summary — Top Issues by Pages Affected

Issues are ranked by how many pages are affected, from most to least.

### 🔴 1. Hardcoded color values in `<style>` blocks — 16/16 content pages
Every content page has hardcoded `rgba()` values (and many have hex literals) in their page-specific `<style>` block. The design system already has CSS variables for all palette colors (`--accent`, `--up`, `--down`, `--border`, etc.) and alpha variants. The rgba values like `rgba(91,200,245,.18)` should become something like `rgba(var(--accent2-rgb), .18)` or dedicated variables. **Priority fix for `currency.html` (62 instances), `nav.html` (57 hex+rgba), `heat-map.html` (61 rgba), and the three dexcom files (110–127 each).**

### 🔴 2. Inline `style=""` attributes — 15/16 content pages
Almost every page uses inline `style=` for things that should be classes. The dexcom files are extreme (200+ each). Audit and replace with CSS classes or data-attributes, especially any inline colors. `dexcom-callback.html` is the only fully clean page.

### 🟠 3. Reusable CSS classes redefined per page — 12 pages
`.spinner` (11 pages) and `.loading-text` (10 pages) are copy-pasted identically into nearly every page `<style>` block. They should be defined once in `styles.css` and removed from all page files. Same applies to `.fade-in` / `@keyframes fadeUp` and `.countdown-badge`.

### 🟡 4. `dexcomB4Change.html` and `dexcomog.html` — deprecated backup files
These two files are near-identical copies of `dexcom.html` (confirmed by identical titles, structure, and line counts). They score the same as `dexcom.html` on every check but serve no live purpose. They should be deleted to eliminate confusion and maintenance burden.

### 🟡 5. `fear-greed-crypto.html` missing standard page scaffolding — 1 page
This redirect shim is missing `<meta name="viewport">`, `styles.css`, and `theme.js`. While it redirects immediately, it should at minimum include the viewport meta so mobile browsers size correctly during the redirect flash. Consider replacing the entire file with an HTTP redirect at the server/worker level instead.

### 🟢 6. `_template.html` unfilled title — 1 page
Title is `TODO: PAGE TITLE`. Not user-facing, but worth replacing with something like `Chuck's AI — New Page` so new pages don't accidentally ship with the TODO title.

### ✅ No issues found
- **theme.js load order** — perfect on all pages
- **theme.js path** — always `theme.js` (no subfolder drift)
- **nav-placeholder / injectNav pattern** — consistent across all pages
- **Old hardcoded nav blocks** — none found
- **console.log statements** — none found (code is clean)
- **localhost / unexpected endpoints** — none found; all endpoints are correct and expected
