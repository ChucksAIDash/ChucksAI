# Discord Feed — Suggestions & Next Steps

> Forward-looking ideas for `discord-feed.html`, captured 2026-06-27 so a new chat can pick them up. The feed itself is built and working live. Full build details + handoff recap live at the top of `POLISH-LIST.md`. Architecture summary at the bottom of this file.

---

## ✅ Built & working (for context — not a to-do)
- `discord-feed.html` — #spx feed: Today / All-Recent toggle (All-Recent grouped by day), per-image lightbox with prev/next + arrow keys, moderate sizing, shows Discord reactions, two-way 🔥 react button (posts as the bot), local "mark read" toggle, optional Claude "Today's Take" summary.
- `nav.html` — top-level `#SPX` link + mobile Tools entry.
- `discord-proxy-worker.js` — Worker: `GET /messages?limit=50` (incl. reactions) + `POST /react {messageId,emoji}` (origin-locked, emoji allow-list).

---

## 🔜 Suggested next features

### 1. Pre-market auto-refresh (quick win)
Right now the feed is load + manual refresh. Add a quiet poll **every ~60s, only 5–7am on weekdays** (the window the friend posts), so the page stays live during pre-market without hammering Discord the rest of the day. Outside that window, stay manual.

### 2. Homepage #spx card (quick win — Chuck specifically wanted this)
A compact "latest #spx post" card on `index.html` that shows the most recent message + links to the full feed. Easy now that the Worker exists — the homepage just calls the same `/messages?limit=1` (or a small number) and renders a mini card.

### 3. Browser notification on new post
Optional "notify me" toggle — a desktop notification when a new #spx message arrives while the tab is open. Nice if the page is kept up pre-market. Uses the Notifications API; remember the opt-in in localStorage.

### 4. Multi-channel via TABS (Chuck's chosen design — build when channels are named)
**Goal:** pull in other channels Chuck forgets to check (e.g. his 3D-printing `#general`), one channel at a time via tabs (#spx, #general, …).
**Chuck's pick:** tabs, one channel at a time (not a combined view).
**How to build:**
- Change the Worker so the channel ID is an **allow-listed query param** (`/messages?channel=ID`) — validate against a hardcoded allow-list in the Worker so it can't be pointed at arbitrary channels. (Today it's a single `DISCORD_CHANNEL_ID` secret.)
- Add channel **tabs** to the page; each tab fetches its channel.
- **Build only once Chuck supplies the real channel IDs** (design tabs around real channels, not placeholders).
**Discord side — already handled / easy:** all channels are in the **same server**, the bot is already a member with View Channels + Read Message History on its role, so it can already read other channels (e.g. #general). The only per-channel thing the site needs is the **channel ID** (right-click channel → Copy ID). No new bot, no new permissions.

### 5. (Down the line) React as *you*, not the bot
Currently 🔥 from the site posts as the **bot account**. Chuck OK'd this for a small 9-person server. To have reactions post under Chuck's own Discord identity would require full **Discord OAuth login** on the site — a much bigger build. Only worth it if the site becomes Chuck's primary reading spot.

---

## 🔧 Standing rules / decisions (don't re-litigate)
- **Least-privilege bot:** only View Channels + Read Message History + Add Reactions. Do NOT add more bot permissions unless a *new* feature needs it (e.g. Send Messages if the bot ever posts the AI summary back to Discord).
- Bot can be freely **renamed** (identified by ID + token; name isn't referenced in code). Renamed to "Bane" 2026-06-27.
- No token client-side — everything routes through the `discord-proxy` Worker (same convention as the market-data proxies).

---

## Architecture (reference)
`discord-feed.html` → `discord-proxy.infiniti306.workers.dev` (dedicated Worker, matches `news-proxy` pattern) → Discord REST API.
Secrets on the Worker: `DISCORD_BOT_TOKEN`, `DISCORD_CHANNEL_ID`.
Optional AI summary path: page → `anthropic.infiniti306.workers.dev` (existing Anthropic proxy).
Feature flags at top of the page script: `ENABLE_AI_TAKE`, `ENABLE_REACT`, `QUICK_EMOJI`.
