# Chuck's AI Dashboard — Master Project Instructions
*Last updated: June 2026*

---

## PROJECT OVERVIEW

**Site:** chucksai.com
**Purpose:** Personal AI-powered financial and health dashboard built by Chuck
**Platform:** Static HTML/CSS/JS site, no framework, no build step
**Deployment:** Cloudflare Pages (NOT Netlify)
**Repo:** GitHub org: ChucksAIDash / repo: ChucksAI
**Local path:** `C:\Users\Infin\Desktop\ChucksAI`

---

## DESIGN SYSTEM — v7

### CSS Variables (styles.css)
```
/* Backgrounds */
--bg-deep:        #05080c
--bg-card:        rgba(255,255,255,.035)
--bg-card-hover:  rgba(255,255,255,.058)
--bg-ticker:      rgba(8,14,22,.7)

/* Text */
--text-primary:   #e8f0f7
--text-secondary: rgba(232,240,247,.55)
--text-muted:     rgba(232,240,247,.28)

/* Borders */
--border:         rgba(255,255,255,.07)
--border-bright:  rgba(255,255,255,.14)

/* Accent palette */
--accent:         #7fd9b8   (green)
--accent2:        #5bc8f5   (blue)
--accent3:        #f0b86a   (amber)
--accent-purple:  #a78bfa

/* Market colors */
--up:             #3ddc84
--down:           #f05252
--meme:           #c084fc
--gold:           #f0c060
--silver:         #b0c8d0
--copper:         #d49060

/* Glows */
--glow-blue:      rgba(91,200,245,.55)
--glow-green:     rgba(127,217,184,.55)

/* Radius */
--r-sm: 6px  --r-md: 10px  --r-lg: 14px  --r-xl: 18px
```

### Light Mode
Light mode tokens are defined under `html.light { }` in styles.css.
Theme toggled via `window.CAI.toggleTheme()` — stored in `localStorage('cai_theme')`.
Dark is the default. Never add flash — `theme.js` must be the FIRST script in `<head>`.

### Fonts
- **Space Mono** — headers, labels, monospace data, nav links, prices
- **DM Sans** — body text, descriptions, paragraphs

### Shared Files
| File | Purpose |
|------|---------|
| `styles.css` | All global design tokens + shared component styles |
| `theme.js` | Dark/light toggle, no-flash init, `window.CAI` API |
| `nav.html` | Shared nav injected via `fetch('nav.html')` into `#nav-placeholder` |

---

## NAVIGATION — nav.html v8

- **Layout:** Logo left, links right, theme toggle + hamburger far right
- **Logo:** `chuck.<span class="hi">ai</span>` (blue "chuck", green dot)
- **Active state:** Set dynamically via `data-page` (desktop) and `data-mob` (mobile) attributes on `<body>`
- **Mobile:** Slide-in menu from the right
- **Top-level (desktop):** Home · Markets ▾ · Calendars ▾ · Sentiment ▾ · Crypto · News · AI Chat · 🩸 Glucose
- **Dropdowns:** Markets (6 items), Calendars (3 items), Sentiment (3 items). AI Chat and Glucose are direct top-level links (the old single-item AI/Health dropdowns were removed in v8).
- **Features built into nav:**
  - Market status dot (open / pre / after / closed) with live clock
  - Weather widget (Lombard, IL 60148) via Open-Meteo, popover on click
  - `.nav-drop` uses `display: inline-flex; align-items: center` (NOT inline-block — prevents height misalignment)

### Nav Injection Helper (ALWAYS use this — never .innerHTML)
```js
function injectNav(html) {
  const placeholder = document.getElementById('nav-placeholder');
  if (!placeholder) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  Array.from(tmp.childNodes).forEach(node => {
    if (node.nodeName !== 'SCRIPT')
      placeholder.parentNode.insertBefore(node.cloneNode(true), placeholder);
  });
  tmp.querySelectorAll('script').forEach(oldScript => {
    const s = document.createElement('script');
    if (oldScript.src) s.src = oldScript.src;
    else s.textContent = oldScript.textContent;
    document.head.appendChild(s);
  });
  placeholder.remove();
}
fetch('nav.html').then(r => r.text()).then(injectNav).catch(() => {});
```

**Critical:** Never use `.innerHTML = html` to inject nav. Scripts won't execute and all dropdowns, clock, and weather will be dead on that page.

### Nav Dropdowns Structure (v8)
| Dropdown | Items |
|----------|-------|
| **Markets** | Watchlist ⭐, Forex, Treasuries, Commodities, Sector Heatmap, Market Breadth |
| **Calendars** | Economic Calendar, Earnings Calendar, IPO Calendar |
| **Sentiment** | Fear & Greed, Options Flow, Insider Transactions |

**Direct top-level links (not in a dropdown):** Home, Crypto, News, AI Chat, 🩸 Glucose

**v8 notes:**
- `currency.html` is labeled **"Forex"** inside the Markets dropdown (was top-level "Markets" in v7).
- Watchlist lives inside Markets (can be split back to top-level if desired).
- No page files were merged — all calendar pages stay separate (Economic Calendar intentionally kept one click away for day-of events).
- Dropdown element IDs: `dropMarkets`, `dropCalendars`, `dropSentiment` (JS selects by `.nav-drop` class, not ID).

---

## PAGES

| Page | File | Notes |
|------|------|-------|
| Home / Dashboard | `index.html` | Indices, AI market read (auto on load), top news |
| Markets | `currency.html` | Forex rates |
| Crypto | `crypto.html` | 10 coins via Coinbase, 60s auto-refresh |
| News | `news.html` | US financial + US Government news via TheNewsAPI |
| Fear & Greed | `fear-greed.html` | Dual gauge — **Stock sentiment** (VIX-based, computed from Finnhub VXX quote, homemade) + **Crypto F&G** (via Alternative.me `/fng/`). NOTE: the worker's `/cnn-fg` route is NOT used here — it's an unused route, candidate for a future upgrade to swap the homemade VIX proxy for CNN's official equity F&G. |
| Crypto Fear & Greed | `fear-greed-crypto.html` | **Redirect → fear-greed.html** |
| Treasuries | `treasuries.html` | Bond ETFs (SHV SHY IEI IEF TLT ZROZ) via Finnhub |
| Economic Calendar | `economic-calendar.html` | FRED data |
| Earnings Calendar | `earnings.html` | Upcoming earnings via Finnhub |
| Options Flow | `options-flow.html` | Options chain + Greeks via **Tradier** (not Polygon); 15 min delay; unusual activity detection; AI Read via Worker |
| Sector Heatmap | `heat-map.html` | Sector ETF performance (XLK XLV XLF etc.) via Polygon + Finnhub |
| Commodities | `commodities.html` | 14 commodity ETFs across 4 groups (metals, industrial, energy, ag) via Finnhub; color-coded cards with day range bars; 60s auto-refresh |
| Market Breadth | `breadth.html` | VIX gauge (VIXY proxy, SVG arc needle), major index scoreboard (SPY/QQQ/IWM/DIA), risk-on/risk-off panel (HYG TLT LQD GLD UUP RSP), sector breadth score (11 GICS sectors); Finnhub; 60s auto-refresh |
| IPO Calendar | `ipo.html` | Finnhub /calendar/ipo; date range toggle (This Month / 3 Months / Past Month); status filter (Expected / Priced / Filed / Withdrawn); grouped by date with Today badge; summary chips |
| Insider Transactions | `insiders.html` | Finnhub /stock/insider-transactions; symbol search + 10 quick-select chips (AAPL MSFT NVDA TSLA AMZN META GOOGL JPM BRK.B SPY); filter by All/Buys/Sells; sort by Date or Value |
| Watchlist | `watchlist.html` | Persistent via localStorage (key: `cai_watchlist_v1`); defaults: SPY QQQ AAPL NVDA TSLA; Finnhub quotes + company profile + 52W metrics; day range + 52W range bars; sort: As Added / Performance / A–Z / Price; AI Read via Worker (streaming); 60s auto-refresh |
| AI Market Chat | `chat.html` | Multi-turn Claude chat; routed through Cloudflare Worker |
| Glucose Dashboard | `dexcom.html` | Dexcom G7 CGM data; OAuth via dexcom-proxy Worker; 5-min auto-refresh |
| Dexcom Callback | `dexcom-callback.html` | OAuth redirect handler; exchanges code via dexcom-proxy Worker |
| Nav | `nav.html` | Shared nav fragment only |
| Template | `_template.html` | Blank page template — always use as starting point for new pages |

**Total: 21 files** (18 real pages + 1 redirect shim + 1 nav fragment + 1 template)

**Note:** `morning-briefing.html` was removed. The AI market briefing (3-sentence, auto-generated on load) now lives on `index.html` only.

---

## API KEYS

| Service | Key | Used For |
|---------|-----|---------|
| Finnhub | `d7kohmpr01qiqbcv6f8gd7kohmpr01qiqbcv6f90` | Stocks, quotes, earnings, IPOs, insiders, commodities, breadth, watchlist |
| Polygon | `mcVUA4y1kkJ_0Vm2d29ckUpiDxNmpjKH` | Options chain, sector charts |
| TheNewsAPI | `EaYs0yWgGLNEmYbHfDp47HwYeaCMaG8HxgOSHHsg` | Financial news + US Gov news |
| FRED | `978e15788d802f3dbdb009aa52118d91` | Economic calendar data |
| CoinGecko | `CG-eyrvXFR3o6ynR37XD95GjZMi` | Crypto market data |
| Alpaca | `124c038c-a62b-42f3-ba02-fc631673398f` | (Future use) |
| Alpha Vantage | `WAQBABS4IJRK56BW` | (Future use) |
| Tradier | Secret in Cloudflare Worker (`TRADIER_TOKEN`) | Options flow (free cash account; key regenerates every 60 days if unfunded) |
| Coinbase | (public endpoint) | Crypto spot prices |
| Alternative.me | (public) | Crypto & equity Fear & Greed index |
| Open-Meteo | (public) | Weather in nav (Lombard IL 60148) |

**Anthropic API (Claude):**
- All AI features route through the Cloudflare Worker proxy — no key required client-side
- Model: `claude-sonnet-4-5-20250929`
- Worker: `https://anthropic.infiniti306.workers.dev`

**Dexcom / Glucose:**
- Worker: `https://dexcom-proxy.infiniti306.workers.dev`
- Auth: OAuth 2.0 via `api.dexcom.com` (production, NOT sandbox)
- Scopes: `offline_access egv` only (Individual Access tier — no calibrations/devices/dataRange)
- Tokens stored in Cloudflare KV by the Worker
- Client ID in `dexcom.html`; Client Secret in Worker secret only
- Individual Access hard cap: 30 days of data; older history served from `history.json`

---

## AI FEATURES

### Home AI Market Read (index.html)
- Auto-generated on every page load using true SSE streaming
- Fetches top TheNewsAPI headlines first, then calls Claude
- 3-sentence briefing: macro theme, sector implication, key risk/opportunity
- `max_tokens: 280` for the read, `max_tokens: 1600` for article summaries
- Routed through `https://anthropic.infiniti306.workers.dev`
- Model: `claude-sonnet-4-5-20250929`

### AI Market Chat (chat.html)
- Full multi-turn conversation with Claude
- System prompt: financial/markets assistant for Chuck
- Routed through Cloudflare Worker (no client-side key)
- Conversation history maintained in-session (no persistence)
- Model: `claude-sonnet-4-5-20250929`

### Options Flow AI Read (options-flow.html)
- On-demand only (user clicks "Generate Read" button)
- Analyzes the loaded options chain via the Worker
- NOT auto-generated on page load

### Watchlist AI Read (watchlist.html)
- On-demand only (user clicks "Generate Read" button)
- Sends current watchlist symbols + prices + % change to Claude
- 3–4 sentence read: notable movers, sector themes, one key thing to watch
- SSE streaming via Worker; `max_tokens: 320`
- System prompt: sharp, concise, no disclaimers

---

## CLOUDFLARE WORKERS

| Worker URL | Purpose |
|-----------|---------|
| `https://anthropic.infiniti306.workers.dev` | Proxies Anthropic API calls (avoids CORS / key exposure); also proxies Tradier via `/tradier/` route |
| `https://dexcom-proxy.infiniti306.workers.dev` | Handles Dexcom OAuth flow + proxies CGM data requests |

**Worker notes:**
- Worker JS is edited directly in the Cloudflare dashboard — worker files are NOT in the GitHub repo
- Cloudflare Worker detects `stream: true` in request body and pipes `response.body` directly (does not buffer via `response.json()`)
- Client sends `stream: true` in request body to trigger SSE streaming

---

## DEPLOYMENT — CLOUDFLARE

**DNS is fully managed by Cloudflare.**
Namecheap nameservers point to Cloudflare — never touch Namecheap.

### Main Site (chucksai.com)
- Cloudflare Pages, connected to GitHub repo ChucksAIDash/ChucksAI
- No build command — static HTML output directory is `/` (root)
- All files flat in root — no subdirectories
- Push to main branch = auto-deploy (~30 seconds)

### Deploy Flow
```
Edit locally → GitHub Desktop push → Cloudflare Pages auto-deploys
```
CLI alternative:
```
cd "C:\Users\Infin\Desktop\ChucksAI"
git add .
git commit -m "description"
git push
```

### Adding a New Subdomain Project
1. Build the new site, push to a new GitHub repo under **ChucksAIDash**
2. Cloudflare → Workers & Pages → Create → Connect to Git → select repo
3. Set build command + output directory (Vite/React: `npm run build` / `dist`)
4. After deploy: Custom Domains tab → Set up custom domain → enter subdomain
5. Cloudflare auto-creates the CNAME — wait for green Active + SSL dot
6. **Never modify existing DNS records — only add new ones**

---

## CODE PATTERNS & CONVENTIONS

### Every Page Must Have
```html
<script src="theme.js"></script>   <!-- FIRST in <head>, before any CSS -->
<link rel="stylesheet" href="styles.css"/>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet"/>
<!-- Page-specific <style> block goes here, after styles.css -->
<div id="nav-placeholder"></div>   <!-- Nav injection target -->
```

### Body Tag — Active Nav State
```html
<body data-page="watchlist" data-mob="watchlist">
```
The nav script reads these attributes to set `.active` on the correct link and its parent dropdown.

### Orb Background
Most pages include the orb canvas for ambient background depth:
```html
<div class="bg-canvas">
  <div class="orb orb1"></div><div class="orb orb2"></div>
  <div class="orb orb3"></div><div class="orb orb4"></div>
</div>
```

### Page-Specific Styles
All page-specific CSS goes in a `<style>` block in the page's `<head>`, after the `styles.css` link. **Never edit `styles.css` for page-specific rules.**

### Auto-Refresh Pattern
```js
setInterval(loadAll, 60 * 1000);  // most pages: 60s
```
Options flow uses 180s (3 minutes).

### Finnhub Rate Limiting
- Free tier does NOT support index symbols (`^VIX`, `SPX`) or futures (`ES1!`)
- Use ETF proxies instead (e.g. VIXY for VIX, SPY for S&P 500)
- Batch API calls in groups of ≤5 with 1100ms delays between batches for heavy pages
- For serial fetches use 60–80ms throttle between each call
- Do NOT fire parallel `Promise.all` for multiple symbols on initial page load — serialize with throttle

### Watchlist localStorage
- Key: `cai_watchlist_v1`
- Stores array of ticker symbols
- Profiles and metrics are cached per session (not in localStorage)

### SSE Streaming Pattern (AI features)
```js
const resp = await fetch(AI_WORKER, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: AI_MODEL,
    max_tokens: 320,
    system: '...',
    messages: [{ role: 'user', content: prompt }],
    stream: true,   // triggers SSE pipe in Worker
  }),
});
const reader = resp.body.getReader();
const decoder = new TextDecoder();
let buf = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  const lines = buf.split('\n');
  buf = lines.pop();
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (data === '[DONE]') break;
    try {
      const j = JSON.parse(data);
      const delta = j.delta?.text || j.choices?.[0]?.delta?.content || '';
      if (delta) out.textContent += delta;
    } catch { /* skip malformed */ }
  }
}
```

### Loading / Error States
Use `.loading-text` with a `.spinner` element while fetching. Show inline error messages on failure.

### Price Formatting
```js
function fmtPrice(n, dec=2) { ... }   // $1,234.56
function fmtPct(n)           { ... }   // +1.23%
function pctClass(n)         { ... }   // 'up' | 'down' | 'flat'
```

### Light Mode CSS Selector Pattern
Always scope both states explicitly:
```css
/* CORRECT */
html.light .card-price.up, html.light .card-price.down { text-shadow: none; }

/* WRONG — only .down gets html.light scope */
html.light .card-price.up,.card-price.down { text-shadow: none; }
```

---

## TOOLING

### Claude Cowork
- Best for: new page creation from `_template.html`, bulk multi-file fixes, codebase audits
- Point at: `C:\Users\Infin\Desktop\ChucksAI`
- Audit prompt stored as a reference (18-check audit covering theme.js, nav, colors, inline styles, etc.)
- After Cowork runs: review output, then push via GitHub Desktop

### This Chat (claude.ai)
- Best for: feature development, bug fixes, code review, single-page edits
- File delivery: copy to `/mnt/user-data/outputs/`, then `present_files`

### Local Dev
- VS Code with Live Server (note: local testing triggers CORS errors for API calls)
- Test on live site after pushing

---

## KNOWN ISSUES / OPEN ITEMS

| Item | Status |
|------|--------|
| `.spinner` and `.loading-text` redefined on 10–11 pages instead of living in `styles.css` | Known / low priority |
| Hardcoded `rgba()` values across most pages instead of CSS variables | Known / cosmetic |

---

## LOCATION

**Chuck's location:** Lombard, IL 60148 (41.880 / -88.007) — used for weather widget in nav via Open-Meteo API.

---

## FEATURES PLANNED / IN PROGRESS

| Feature | Notes |
|---------|-------|
| Price Alerts | Browser notifications when price crosses threshold |
| Sector Heatmap Upgrade | Full S&P sector treemap (upgrade from current ETF bar chart) |
| Chuck's Picks | Curated stock/crypto picks section |
| Discord → Site Integration | Bot forwarding SPX channel posts to KV; `discord-feed.html` page |
| Dashboard Redesign (v8?) | Consolidation discussion ongoing — nav/IA cleanup alternative being considered |

---

## WHAT NOT TO DO

- Do NOT use Netlify — deployment is Cloudflare Pages only
- Do NOT touch Namecheap — DNS is 100% managed in Cloudflare
- Do NOT modify existing Cloudflare DNS records — only add new ones
- Do NOT add page-specific styles to `styles.css`
- Do NOT load `theme.js` after CSS — it must be FIRST in `<head>` to prevent flash
- Do NOT hardcode light/dark colors — always use CSS variables
- Do NOT use a framework (React, Vue, etc.) for chucksai.com — plain HTML/CSS/JS only
- Do NOT expose the Anthropic API key client-side — always route through the Worker proxy
- Do NOT inject nav.html with `.innerHTML = html` — always use the `injectNav()` helper so scripts execute
- Do NOT use the Dexcom sandbox — `dexcom.html` and the Worker both point to `api.dexcom.com` (production only)
- Do NOT request Dexcom scopes beyond `offline_access egv` — Individual Access tier only
- Do NOT build a Portfolio Tracker — Chuck explicitly does not want one
- Do NOT fire parallel `Promise.all` for multiple Finnhub symbols on page load — serialize with throttle
- Do NOT use `^VIX`, `SPX`, or futures symbols (`ES1!`) with Finnhub free tier — use ETF proxies
