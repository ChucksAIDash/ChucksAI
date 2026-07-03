# 05 — QUICK WINS (each < 1 hour)

## a) Site-wide Ctrl+K command palette
The palette is v2's best feature and it dies when you leave the homepage. Extract the cmdk overlay + JS into `palette.js` + move markup injection into nav.html (which is already on every page). Homepage-only actions (briefing, Discord summary) shown conditionally. Result: jump pages / run actions from anywhere.

## b) PWA install (phone home-screen app)
`manifest.json` (name, theme_color `#0a0f16`-ish token value, icons 192/512) + `<link rel="manifest">` in nav-injected head + two icon PNGs. Site installs to the phone home screen full-screen, no browser chrome. **Skip the service worker** — offline caching of live market data is a footgun; manifest alone gives the app feel.
⚠ If Cloudflare Access is on (idea 01), the install flow just passes through the login once — fine.

## c) Stale-data indicator
`quotes.js` now serves stale cached quotes on fetch errors — silently. Add a flag: `fhRawQuote` sets `window.fhStale = true` when it falls back, and a tiny amber dot + "CACHED" label appears next to the masthead clock (nav or statusbar). Honest UI: you always know if numbers are live.

## d) Alerts log page/card
Once discord-alerts Worker runs: `GET /log` route returning last ~50 KV-logged alerts → simple card on the homepage rail or a section on the future SITREP/health pages. "What fired while I was asleep."

## e) Change the dexcom.html password + retire the curtain
The old one is burned (in chat history + weak-pattern hash in public page source). After Cloudflare Access ships, the JS lock is redundant — remove it or leave it as a casual screen-peek blur with a new password. 5 minutes either way.
