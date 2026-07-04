# 06 — Discord feed: remaining ideas

Salvaged from `DISCORD-FEED-SUGGESTIONS.md` (2026-06-27, now deleted — everything else in it was built: tabs, unread dots, pre-market auto-poll, homepage card, AI/vision summaries).

## a) Browser notification on new post
Optional "notify me" toggle on discord-feed.html — desktop notification when a new #spx message arrives while the tab is open (useful pre-market). Notifications API; opt-in remembered in localStorage.
→ Alternative that may supersede this: the SITREP/alerts Worker (ideas 03) can ping Discord→phone, which covers the "away from the page" case better.

## b) React as *you*, not the bot (deferred, low priority)
Site 🔥 reacts currently post as the bot account — Chuck OK'd for the 9-person server. Reacting as Chuck's own identity = full Discord OAuth login build. Only worth it if the site becomes the primary reading spot.

## c) Scheduled morning digest in Cowork (Chuck interested — discuss timing/scope first)
A Cowork scheduled task each morning: pull the day's #spx posts via discord-proxy, run the "Today's Take" summary, deliver inside Cowork chat. Separate from the website. Chuck's call 2026-06-28: site upgrades first (done), then discuss before building.
