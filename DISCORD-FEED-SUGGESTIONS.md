# Discord Feed — Suggestions & Next Steps

> Forward-looking ideas for `discord-feed.html`, captured 2026-06-27 so a new chat can pick them up. The feed itself is built and working live. Full build details + handoff recap live at the top of `POLISH-LIST.md`. Architecture summary at the bottom of this file.

---

## ✅ Built & working (for context — not a to-do)
- `discord-feed.html` — feed with **channel tabs** (#spx default + General = merge of both #general channels): Today / All-Recent toggle, per-image lightbox, reactions, two-way 🔥 react, mark-read, **per-channel unread dots**, **pre-market auto-poll** (weekdays 5:30–8:30am CST), and **on-demand AI summary** — two buttons: **✨ AI Summarize** (text, Haiku) and **👁 + Vision** (text + today's chart images → Sonnet vision). Summary scope = today's *session*: if today's posts span a >6h gap, only the latest cluster is summarized (morning batch in the AM; regenerate at night → evening batch). Buttons show only on aiTake channels (#spx).
- `index.html` — **Discord #spx homepage card** (between Top Stories and Market): "Open feed →" link + the same two summarize buttons (✨ AI Summarize / 👁 + Vision), output rendered inline via `markdownToHtml`. Self-contained JS (`dcSummary`/`dcSession`/`dcImages`, `DC_PROXY`/`DC_*_MODEL` consts). No raw post dump.
- `nav.html` — top-level **Discord** link (renamed from #SPX 2026-06-28) + mobile "Discord Feed" entry, plus a **site-wide unread dot** (re-checks every 5 min on any page, watches spx + both generals).
- `discord-proxy-worker.js` — Worker: `GET /messages?limit=50[&channel=ID]` (allow-list = #spx secret + both #general ids) + `POST /react {messageId,emoji[,channel]}`.

**Vision note:** the Anthropic Worker proxy (`anthropic.infiniti306.workers.dev`) is a transparent passthrough to the Messages API (`/v1/messages`), so URL-based image blocks (`{type:'image',source:{type:'url',url}}`) work with NO worker change. Vision uses `claude-sonnet-4-5-20250929`; text uses `claude-haiku-4-5-20251001`.

> **One step outstanding to fully activate multi-channel:** paste the real 3D `#general` channel ID (see item 4 below), re-deploy the worker, commit/push.

---

## 🔜 Suggested next features

### 1. Pre-market auto-refresh — ✅ BUILT 2026-06-28
Quiet poll every 60s while the page is open, **only weekdays 5:30–8:30am CST** (the posting window), quiet the rest of the day. (`inPostingWindow()` / `startAutoPoll()` in discord-feed.html.)

### 2. Homepage #spx card (quick win — Chuck specifically wanted this)
A compact "latest #spx post" card on `index.html` that shows the most recent message + links to the full feed. Easy now that the Worker exists — the homepage just calls the same `/messages?limit=1` (or a small number) and renders a mini card.

### 3. Browser notification on new post
Optional "notify me" toggle — a desktop notification when a new #spx message arrives while the tab is open. Nice if the page is kept up pre-market. Uses the Notifications API; remember the opt-in in localStorage.

### 4. Multi-channel via TABS + unread dots — ✅ BUILT 2026-06-28
Tabs: **#spx** (default) + **General**. The General tab is a **merge of both #general channels** — the server's default `#general` (`947004313685876737`) and 3D-printing `#general` (`1130908169275711488`) — fetched together, de-duped, sorted newest-first (Chuck's call: friends mostly post in 3D-print-general, occasionally the basic one, so one combined tab beats two). Per-channel unread dot = newest-post-vs-last-viewed (`cai_discord_seen` localStorage), clears when you open the tab. Site-wide `#SPX` nav dot (nav.html) re-checks every 5 min on any page, so even ~10pm posts light it. Worker takes an allow-listed `?channel=ID` (allow-list = `DISCORD_CHANNEL_ID` secret + `EXTRA_CHANNELS` = both #general ids; unknown/no channel → #spx fallback). Real ids are wired in all 3 files — no placeholders left.
**Channel model:** in discord-feed.html each tab is `{key,label,ids:[...]}` — `ids:['']` means "Worker default (#spx)"; merged tabs list multiple ids. Each message is tagged `_chan` (its source channel) so /react hits the right channel. nav.html `CHANS` mirrors the same keys/ids so the seen-map clears the dot correctly.
**To go live:** re-deploy the worker in Cloudflare (it changed) + commit/push the 3 files.

### 5. (Down the line) React as *you*, not the bot
Currently 🔥 from the site posts as the **bot account**. Chuck OK'd this for a small 9-person server. To have reactions post under Chuck's own Discord identity would require full **Discord OAuth login** on the site — a much bigger build. Only worth it if the site becomes Chuck's primary reading spot.

### 6. Scheduled morning digest (Cowork task — deferred, Chuck is interested)
A **Cowork scheduled task** that runs each morning, pulls the day's #spx posts (and optionally 3D-printing #general) via the `discord-proxy` Worker, runs Claude's "Today's Take" over them, and surfaces the digest to Chuck **inside Cowork** (not on the site). This is separate from the website — it's a recurring chat briefing so Chuck gets the gist without opening the page.
**Chuck's call (2026-06-28):** interested, but **do the site upgrades first** (tabs/dots/auto-poll — now done), then discuss this. Build only after a conversation about timing + scope.
**Posting pattern to design around (from Chuck):** weekday mornings usually by ~6:30am CST, sometimes 7:00–8:00; occasional ~10pm posts; nothing Sat, nothing Sun unless Sun evening/overnight. So a weekday ~8:00am CST digest would capture the morning batch.
**How to build when ready:** Cowork `create_scheduled_task` (cron, America/Chicago) → fetch `discord-proxy/messages` → summarize with the Anthropic proxy / Haiku → deliver the briefing in Cowork. No site files change.

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
