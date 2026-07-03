# 03 — SITREP ALERT CENTER ("is something major going on?")

**Goal:** Chuck shouldn't have to go looking. If something major is happening — severe weather headed his way, a big earthquake, genuine breaking national news, a market shock — the site tells him, everywhere, and Discord pings his phone. Silent when nothing's wrong.

## The concept

A three-level status: **GREEN** (nothing — show NOTHING, no UI at all) · **AMBER** (worth knowing — thin banner) · **RED** (act/pay attention — bold banner + Discord push). Fits the Command Deck aesthetic perfectly — think cockpit master-caution light.

## Data sources (all FREE, first three keyless)

| Source | What | Endpoint |
|---|---|---|
| **NWS** (api.weather.gov) | Official severe weather + many civil emergency alerts (CAP feed: tornado, flood, extreme heat, shelter-in-place…) for YOUR location | `GET /alerts/active?point={lat},{lon}` — no key, just a User-Agent header. Severity field: Extreme/Severe → RED/AMBER |
| **USGS** | Earthquakes, real-time GeoJSON | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson` — filter by distance to home + magnitude |
| **Google News RSS** | Breaking US/world headlines, no key | `news.google.com/rss/headlines/section/topic/NATION?hl=en-US&gl=US` (+ WORLD). RSS/XML — fetch via a Worker (CORS), parse titles |
| **thenewsapi** (already integrated) | top stories cross-check | existing news-proxy — reuse, mind ~100/day quota |
| **Existing quotes** | Market shock: SPY ≤ −2.5% or VIXY spike ≥ +12% | quoteCache — zero new calls |

## The clever part: Claude as triage officer

Raw headlines ≠ alerts. Every 30 min the Worker sends the ~15 current top headlines to the **anthropic proxy** (Haiku-class = pennies) with a strict prompt: *"Return JSON {level: GREEN|AMBER|RED, reason} — RED only for events with direct personal impact (war escalation involving the US, major domestic attack, market-halting event, pandemic-level declaration, disaster near {city}). Celebrity news, politics-as-usual, routine markets = GREEN."* Cache verdict in KV. NWS/USGS/market checks are pure thresholds — no AI needed, they're already structured.

## Architecture (rides the discord-alerts Worker — same cron, KV, bot)

1. Extend `discord-alerts-worker.js` with `checkNWS()`, `checkQuakes()`, `checkNews()` (30-min throttle on news), `checkMarketShock()`.
2. Worker writes a compact verdict to KV: `sitrep: {level, items:[{src, severity, headline, ts}]}` and posts to Discord on level escalation only (KV-deduped by alert id — NWS ids + quake ids make this easy).
3. New Worker route `GET /sitrep` returns that KV JSON (origin-locked).
4. **Site banner in nav.html** (so it appears on every page): on load + every 5 min, fetch `/sitrep`; GREEN → render nothing; AMBER/RED → thin strip above the ticker (tokens: `--accent3` amber / `--down` red) with the reason, click → homepage SITREP card with the item list. `document.hidden` guard, obviously.
5. Homepage: small SITREP rail card (normally "✓ ALL QUIET" in muted text — nice calm signal that the system is working).

## Config (top of Worker)

`HOME_LAT/HOME_LON` (for NWS point + quake distance), `QUAKE_MIN_MAG` (4.5 within 300mi / 6.5 anywhere), `SPY_SHOCK_PCT` (−2.5), `NEWS_TRIAGE_MINUTES` (30).

## Why this design

- Pages do ZERO new API calls — one tiny `/sitrep` KV read. All polling is server-side on cron, so phone battery + Finnhub quota untouched.
- False-positive discipline is the whole game: thresholds high, Claude prompt strict, Discord only on escalation. An alert system you learn to ignore is worse than none.
- Sequencing: deploy discord-alerts-worker first (04 backlog), then this is mostly additive Worker code + one nav.html fetch.
