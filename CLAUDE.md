# ChucksAI.com

Personal AI-powered financial + health dashboard. Static HTML/CSS/JS — no framework, no build step. Deployed on Cloudflare Pages (repo `ChucksAIDash/ChucksAI`, push to `main` = live in ~30s). DNS is 100% Cloudflare — never touch Namecheap.

## Read first
- `RUNBOOK.md` — architecture, key-rotation checklist, symptom→cause table, API tier limits.
- `POLISH-LIST.md` — top section is the current session handoff / running to-do. Read it before making changes.
- `audit.md` / `audit-perf-security.md` — the standing quality/security audit checklist.
- `ideas/00-INDEX.md` — roadmap specs, one per file, priority-ordered.

## Hard rules — do NOT
- Use a framework, a build step, or Netlify.
- Hardcode light/dark colors — everything flows through CSS variable tokens in `styles.css`.
- Edit `styles.css` for one page's styling — page-specific CSS goes in that page's own `<style>` block.
- Load `theme.js` after CSS — it must be the first thing in `<head>` (prevents flash of wrong theme).
- Inject `nav.html` with `.innerHTML` — use the `injectNav()` helper (see `_template.html`) so its scripts actually run.
- Expose API keys client-side — all AI/API calls route through Cloudflare Worker proxies.
- Fire parallel `Promise.all` across many Finnhub symbols on load — serialize/throttle (free tier: 60 calls/min, shared across all open tabs).
- Use `^VIX`/`^SPX`/futures symbols on Finnhub free tier — use ETF proxies (VIXY, SPY, etc.).
- Build a portfolio tracker.

## Architecture
Pages call Cloudflare Workers (`finnhub-proxy`, `polygon-proxy`, `news-proxy`, `anthropic`, `dexcom-proxy`, `discord-proxy`), which hold the real API keys as secrets. **Worker code lives only in the Cloudflare dashboard, not this repo** — reference copies (e.g. `discord-proxy-worker.js`, `worker-origin-lock.js`) are for pasting manually. You cannot deploy Worker changes directly; provide the code + paste/redeploy steps.

Quotes go through the shared cache in `quotes.js` (`fhQuoteShared()` / `fhRawQuote()`) — pages should never fetch `finnhub-proxy /quote` directly.

New pages: start from `_template.html` (already bakes in theme.js-first, the `document.hidden` auto-refresh guard, `injectNav()`, quotes.js include, and an id-namespace warning to avoid collisions with nav.html's injected elements).

Fonts: Space Mono (labels/data/nav), DM Sans (body). Design tokens are v8 and fully applied across all pages.

## Workflow
This is a real git repo (`ChucksAIDash/ChucksAI`) — commit and push directly when confident in a change. Test on the **live site**, not `file://` — local opens break CORS for Worker calls and `history.json`.

## Known gotchas
- Key rotation needs all 5 steps in `RUNBOOK.md` (missing the redeploy step caused a 3-day Finnhub outage on 2026-06-26).
- Dexcom `/latest` can return `reading:null` — fall back to the newest `/egvs` record (see `index.html`).
