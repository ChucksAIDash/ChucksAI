# RUNBOOK — chucksai.com ops

Quick-reference for the stuff that has actually broken before. Keep this honest: when something new bites, add it here.

## Architecture in one paragraph

Static HTML/CSS/JS on **Cloudflare Pages** (repo `ChucksAIDash/ChucksAI`, push to `main` = auto-deploy ~30s). All API keys live as **secrets on Cloudflare Workers** (dashboard-only — Worker code is NOT in the repo, except reference copies like `discord-proxy-worker.js`). Pages call the Workers; Workers hold the keys. DNS is 100% Cloudflare.

**Workers:** `finnhub-proxy` · `polygon-proxy` · `news-proxy` · `anthropic` (AI proxy) · `dexcom-proxy` · `discord-proxy`

## 🔑 Key rotation checklist (DO ALL FIVE STEPS)

The 2026-06-26 Finnhub rotation caused a **3-day outage** because step 3–4 were skipped. Never rotate a key without finishing this list:

1. Mint the new key at the provider and **verify it raw** before touching Cloudflare, e.g.
   `https://finnhub.io/api/v1/quote?symbol=SPY&token=NEWKEY` → must return valid JSON.
2. Paste the new key into the Worker secret (Workers → the proxy → Settings → Variables).
3. **Re-save the secret** (secrets are write-only — you can't read back to confirm).
4. **REDEPLOY the Worker.** A saved secret does NOT bind until redeploy. This is the step that got missed.
5. Load the **live site** and confirm 200s in DevTools → Network on the proxy calls.

## 🚨 Symptom → cause table

| Symptom | Likely cause | Fix |
|---|---|---|
| ALL quotes dark, proxy returns **401** | Stale Worker secret after rotation | Re-save secret + redeploy (checklist above) |
| Occasional **429** on one symbol | Finnhub free-tier 60/min shared across tabs | Harmless; if constant, check for a page missing the `document.hidden` interval guard |
| Widget dead only on `file://` | CORS — local opens can't call Workers/history.json | Test on the live site, always |
| Glucose widget "— / Not connected" | Dexcom `/latest` returns `reading:null` | Already handled: index falls back to newest `/egvs` record |
| Widget writes to wrong/hidden element | Duplicate element id with injected nav.html | Prefix page ids (see `_template.html` warning) |
| New page's nav dropdowns dead | nav injected with `.innerHTML` | Use the standard `injectNav()` from `_template.html` |
| Repo file looks truncated/NUL-filled in bash | Sandbox bash artifact on just-edited files | Trust the Read tool / editor, not bash `grep` |

## 📈 API tier limits (re-verify on the web each audit — last checked 2026-06-28)

- Finnhub free: **60 calls/min**, shared across all open tabs → serialize fan-outs (120ms gap), never `Promise.all` many symbols.
- Polygon free: **5 calls/min**.
- CoinGecko demo: 100/min, 10k/mo.
- thenewsapi: ~100 req/day, read-only.
- No `^VIX`/`^SPX`/futures on Finnhub free — use ETF proxies (VIXY, SPY…).

## 🧩 Adding a new page

1. Copy `_template.html` (it now bakes in: theme.js-first, `document.hidden` guard, `injectNav()`, `quotes.js`, id-prefix rule).
2. Quotes go through `fhQuoteShared()`/`fhRawQuote()` from `quotes.js` — never fetch `finnhub-proxy /quote` directly.
3. Page-specific CSS in the page's own `<style>` block — never styles.css.
4. Add nav link in `nav.html` (desktop + mobile).
5. Re-run the audit checklist in `audit.md` if the page adds a new API or Worker.

## 🔁 Deploy / verify

- Push to `main` → live in ~30s. Verify: hard-reload the live site, check DevTools Network for 200s.
- After ANY Worker change: redeploy in dashboard, then live-site check.
- Security headers served from `_headers` (repo root). Verify:
  `curl -sI https://chucksai.com | grep -iE "strict-transport|x-frame|nosniff|referrer"`
