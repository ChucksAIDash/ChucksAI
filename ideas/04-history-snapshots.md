# 04 — HISTORY SNAPSHOTS → KV (trends & sparklines)

**Goal:** everything on the site is a live snapshot; nothing remembers yesterday. Free APIs won't give history without burning quota — but a 30-line addition to the cron Worker builds your own history for free.

## What to snapshot (once daily, ~4:05pm CT weekdays)

- Closes + day % for: SPY QQQ DIA IWM, watchlist symbols, BTC/ETH.
- Fear & Greed value.
- 10Y yield proxy + VIXY.
- Glucose daily stats (avg, TIR%, lows count) — feeds the Health Deck 30-day trend.

KV shape: `hist:2026-07-03` → one compact JSON blob per day. 365 keys/year — nothing. Worker route `GET /history?days=30` returns an array (origin-locked).

## What it unlocks (the payoff)

- **Sparklines** on index ticker cards + watchlist rows (tiny inline SVG, 30 points, no library).
- "This week vs last week" line in the AI morning briefing prompt — real substance for Claude to analyze.
- Fear & Greed 30-day mini-chart on fear-greed.html.
- Health Deck monthly TIR trend.

## Notes

- Rides the same discord-alerts Worker + ALERTS_KV (or a second namespace `HIST_KV` to keep things tidy).
- Cron: add `5 21 * * 1-5` (21:05 UTC = 4:05pm CT). Cloudflare allows multiple cron triggers per Worker; branch on `event.cron` in `scheduled()`.
- Snapshot fetches run server-side with the FINNHUB_KEY secret — client quota untouched.
- Existing `history.json` (briefings) stays as-is; this is numeric market/health history, different thing.
