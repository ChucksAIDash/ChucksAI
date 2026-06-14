# ChucksAI.com — Polish List

Small visual/UX fixes to batch alongside bigger work. Not urgent on their own.

---

## ✅ Done

- **Nav right-side alignment** — "Data / AI / Health" dropdowns sat a couple px off from "Home / Markets / Crypto / News." Cause: `.nav-drop` was `display: inline-block` instead of `inline-flex; align-items: center`. Fixed in `nav.html` (line 106). *(June 2026)*
- **v8 nav restructure (Phase 1)** — Regrouped the 11-item Data dropdown into Markets / Calendars / Sentiment; promoted AI Chat + Glucose to direct links (killed both single-item dropdowns); Watchlist moved into Markets; currency relabeled "Forex." Desktop + mobile both updated in `nav.html`. No page merges (Phase 2 skipped by choice — keeps Economic Calendar one click away). *(June 14, 2026)*

---

## 🔲 Open

*(none yet — add small visual notes here as they come up)*

---

## 🔒 Security / infra — future (reviewed June 14, 2026, deferred by choice)

- **Proxy data API keys through Workers.** Finnhub/Polygon/TheNewsAPI/FRED/CoinGecko keys are hardcoded in 12 HTML pages and visible in-browser. *Decision: leave as-is for now* — free/low-tier keys, low risk. Build dedicated Cloudflare Workers down the line if/when it makes sense (same pattern as the Anthropic/Tradier proxy).
- **Dexcom `CLIENT_SECRET` → Worker secret + rotate.** Currently hardcoded in plaintext in the live Worker (not in repo). *Decision: leave for now*, fold into a future Dexcom-worker cleanup. Move to `env.DEXCOM_CLIENT_SECRET` and rotate in the Dexcom portal when touched.
- **Lock Dexcom Worker CORS + add caller auth.** `/egvs`, `/latest`, `/status` are open to anyone with the URL (CORS `*`, no caller check) — exposes glucose data. Lock `Access-Control-Allow-Origin` to `chucksai.com` and/or require a shared-key header. Bundle with the Dexcom-worker cleanup above.
- **Stale `// Sandbox` comment** in dexcom-proxy Worker — it's actually production. Trivial cleanup, do it whenever the Worker is next edited.

## 📝 Doc mismatches to reconcile

- ✅ **Fear & Greed source** — Resolved. `fear-greed.html` shows a homemade VIX-based stock gauge (Finnhub VXX) + crypto F&G (Alternative.me). The `/cnn-fg` worker route is unused. Docs corrected in `chucksai_instructions.md` + `WORKERS.md`. *(June 14, 2026)*
- ✅ **Master instructions → v8 nav** — Updated `chucksai_instructions.md` nav section + dropdown table to v8 (Markets / Calendars / Sentiment + direct AI Chat & Glucose). *(June 14, 2026)*

## 💡 Ideas worth considering

*(low-priority suggestions with a quick "why it's worth it" — pick up if/when they appeal)*

- **Wire in the `/cnn-fg` route for the stock gauge.** Your stock sentiment gauge is a homemade VIX proxy; the `/cnn-fg` worker route already pulls CNN's *official* Fear & Greed index but sits unused. Swapping it in would make the stock gauge match the number people actually quote ("CNN Fear & Greed"), and the worker route is already built — it's mostly a front-end change in `fear-greed.html`. Worth it for credibility/recognizability; low effort since the backend exists.
