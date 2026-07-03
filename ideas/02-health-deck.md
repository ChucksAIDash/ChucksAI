# 02 — HEALTH DECK (`health.html`)

**Goal:** a health counterpart to the market Command Deck. Today Dexcom data only shows as a top-bar readout on index + the heavyweight dexcom.html reference page. This makes "financial + health dashboard" true.

## Layout (mirror the Command Deck patterns)

- **Masthead:** current glucose BIG (Space Mono), trend arrow, minutes-ago, session-style status dot (green in-range / amber high / red low). Reuse the pulse-gauge component as a **Time-in-Range gauge** (needle = last-24h TIR%).
- **Main chart card:** 24h glucose line (Chart.js — dexcom.html already loads it; copy that pattern). Range toggle: 24h / 3d / 7d / 14d. Shaded target band 70–180. Dots colored by in/low/high.
- **Stat cards row** (reuse .idx-card style):
  - Time in Range % (70–180) — 24h and 7d
  - Average + GMI estimate (GMI = 3.31 + 0.02392 × avg mg/dL)
  - Lows count (7d) + worst overnight low
  - Highs count (7d) + longest high streak
- **Overnight panel:** midnight–6am strip for the last 7 nights; flag any night that dipped < 70 (the "did I go low while asleep" question at a glance).
- **AI card:** "Weekly Health Take" button → sends 7d stats summary (NOT raw records — keep the prompt small) to the anthropic proxy, same pattern as the morning briefing. Prompt: patterns, overnight risk, best/worst days, one suggestion.
- **Alerts history card:** recent glucose alerts fired by the discord-alerts Worker (needs a tiny `GET /log` route on that Worker reading ALERTS_KV).

## Data plumbing

- `dexcom-proxy /egvs` currently returns recent records. Multi-day ranges need the proxy to accept `?start=&end=` and forward to Dexcom's `startDate/endDate` params — small Worker edit (give Chuck the code, he pastes it).
- Dexcom G-series records are 5-min interval; 14d ≈ 4,000 records — fetch per range on demand, don't preload all ranges.
- Compute TIR/avg/lows client-side from records. Cache computed stats in sessionStorage (5-min TTL) so range-toggling is instant.
- Respect production-only, `offline_access egv` scopes — no new scopes needed. ✅

## Rules & gotchas (standard)

- theme.js first · page CSS in own `<style>` block · injectNav() · id prefix `hd…` · `document.hidden` guard on the refresh interval · nav.html link (desktop "HEALTH" + mobile under Tools).
- This page is the #1 reason to finish **01-cloudflare-access** first — don't ship a rich health page while the site is effectively public.
