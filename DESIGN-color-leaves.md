# Design Reference — Approved Color Leaves

> **Purpose:** the tokenization rollout (v8) routes all structural colors through CSS variables in `styles.css`. A handful of raw `rgba()`/hex values remain **on purpose** — they're bespoke gradients, brand colors, or semantic indicators that shouldn't theme-shift. This file lists them so the codebase audit (`audit.md` check 3) stops flagging them as misses.
>
> If you add a new deliberate leave, note it here. Anything NOT on this list that uses a raw color is a real tokenization miss worth fixing.

## Approved deliberate leaves

### 1. Dexcom brand purple — `rgba(138,99,255,…)`
- **Where:** `dexcom.html` (~52 instances)
- **Why:** Dexcom's brand purple, off the site palette by design. `dexcom.html` is also a reference copy from a separate project — leave it alone.

### 2. Sector heat-scale gradient — green/red graduated alphas
- **Where:** `heat-map.html`, `commodities.html`
- **Colors:** `rgba(61,220,132,.07 → .55)` (green tiers) and `rgba(240,82,82,.07 → .55)` (red tiers), plus light-mode counterparts `rgba(13,122,86,…)` / `rgba(196,52,52,…)` in heat-map.
- **Why:** a continuous performance heat gradient with many discrete alpha steps. Tokenizing each step would bloat the token set with single-use variables. The base hues already match `--up`/`--down`.

### 3. Currency performance heat gradient — hex ramp
- **Where:** `currency.html` (~38 hex literals)
- **Colors:** green ramp `#004400 → #7fff7f`, red ramp `#150000 → #f07070`.
- **Why:** same rationale as the heat-map — a bespoke FX-performance color ramp, not structural UI color.

### 4. Options gold sweep scale — `rgba(255,200,0,…)`
- **Where:** `options-flow.html`
- **Colors:** `rgba(255,200,0,.04 → .3)` and `#ffc800`.
- **Why:** gold intensity scale for options-flow sweep volume. Single-purpose gradient.

### 5. Nav dark-mode glass tint — `rgba(5,8,12,.88)` / `rgba(5,8,12,.97)`
- **Where:** `nav.html` (nav bar, dropdown menus, weather panel, mobile menu backgrounds — dark mode only)
- **Why:** a bespoke translucent dark glass tint for the nav's `backdrop-filter` blur. The closest token, `--panel-deep` (`rgba(6,13,24,.85)`), is a different hue/opacity — swapping it would visibly change the dark nav. Decided 2026-06-20 to keep as-is. (Nav **light**-mode colors WERE tokenized — those were a stale bug, now fixed.)

### 6. Market-status dot colors — `#3ddc84` / `#f0b86a` / `#a78bfa` / `#555`
- **Where:** `nav.html` `.market-status-dot.open/.pre/.after/.closed`
- **Why:** semantic market-session indicators (open / pre-market / after-hours / closed). These should stay constant across light and dark mode — they encode meaning, not theme.

## NOT leaves — these are real and already fixed or queued
- Nav **light-mode** UI colors → tokenized (fixed 2026-06-20).
- Shared `@keyframes`/`.fade-in` → consolidated into `styles.css` (fixed 2026-06-20).
- Exposed market-data API keys → queued (see `MIGRATION-api-key-proxy.md`).
