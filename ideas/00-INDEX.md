# IDEAS / ROADMAP — chucksai.com

Specs for the next wave of upgrades, one file each, in rough priority order.
(These .md files deploy publicly with the site like POLISH-LIST.md does — no secrets in here.)

| # | Idea | Effort | Status |
|---|------|--------|--------|
| 01 | **Cloudflare Access** — real login gate for the site + Dexcom data | ~1 evening, zero code | ⭐ TOP PRIORITY (Chuck agreed) |
| 02 | **Health Deck** — health.html counterpart to the market Command Deck | 1–2 sessions | ⭐ Chuck wants to look at this |
| 03 | **SITREP Alert Center** — severe weather / quakes / breaking-news "is something major happening" strip + Discord push | 1–2 sessions | New idea (Chuck asked for this range) |
| 04 | **History snapshots → KV** — daily closes, fear/greed, glucose stats → sparklines + trends | 1 session (rides alerts Worker) | Queued |
| 05 | **Quick wins** — site-wide Ctrl+K, PWA install, stale-data dot, alerts log | Each < 1 hr | Grab-bag |

Prereqs already in repo: `worker-origin-lock.js`, `discord-alerts-worker.js` (paste into Cloudflare dashboard), `quotes.js`, `RUNBOOK.md`.

Suggested order: 01 → 03 (Worker cron + SITREP share plumbing) → 02 → 04 → 05 as filler.
