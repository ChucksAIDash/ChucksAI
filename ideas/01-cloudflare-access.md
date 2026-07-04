# 01 — Cloudflare Access (TOP PRIORITY)

**Goal:** replace the cosmetic dexcom.html JS password with a real login gate. Protects the glucose data end-to-end, works on the phone, zero code changes.

**Why the current lock fails:** it only blurs the page client-side; the data still loads, DevTools shows it, and `dexcom-proxy.workers.dev` answers anyone directly. The `chuck2026` password is also burned (guessable pattern + hash visible in page source) — change it even if the JS lock stays as a curtain.

## Part A — gate the site (30 min)

1. Cloudflare dashboard → **Zero Trust** (one-time free-plan signup if not enabled).
2. Access → **Applications → Add application → Self-hosted**.
3. Application domain: `chucksai.com` and path `/*` (add `www.chucksai.com/*` too).
4. Policy: Action **Allow**, Include → **Emails** → `infiniti306@gmail.com`.
5. Login method: **Google** (Settings → Authentication → add Google if not listed) — one tap on the phone.
6. Session duration: **30 days** (max on free) so you're not logging in constantly.
7. Test on desktop + phone. Bookmark still works; you just see a Google prompt when the cookie expires.

Decision: gate the WHOLE site (recommended — simplest, and market pages have nothing worth serving publicly anyway) vs. only dexcom/health pages (path-scoped app like `chucksai.com/dexcom*`). Whole-site is one app, done.

## Part B — the actual hole: the Workers (the important half)

Access on chucksai.com does NOT protect `*.workers.dev` URLs. `dexcom-proxy` is the one serving health data unauthenticated. Two options:

**Option 1 (better): move Workers onto the domain, behind Access.**
1. Each Worker → Settings → Triggers → **Add route**: e.g. `api.chucksai.com/dexcom/*` (add an `api` AAAA/CNAME proxied record, or use `chucksai.com/api/dexcom/*`).
2. Add the route path to the Access application (or a second Access app for `api.chucksai.com/*` — but see note below).
3. Update page fetch URLs from `dexcom-proxy.infiniti306.workers.dev` → the new route.
4. Disable the `workers.dev` URL for that Worker (Triggers → workers.dev toggle OFF).
   ⚠ Note: browser fetch() to an Access-protected route sends the Access cookie automatically on same-origin paths (`chucksai.com/api/...`) — prefer the same-origin path style over a separate `api.` subdomain to avoid CORS + cookie headaches.
   ⚠ The discord-alerts cron Worker calls dexcom-proxy server-to-server — it has no Access cookie. Give it a bypass: an Access **Service Token**, or keep a shared-secret header check in dexcom-proxy (`X-Alert-Key` == secret).

**Option 2 (weaker, quick): origin-lock dexcom-proxy** with `worker-origin-lock.js` (same as finnhub/anthropic). Stops casual/direct hits but Origin headers are forgeable server-side — fine as an interim step, not the end state for health data.

## Confirmed findings (from WORKERS.md source snapshot, June 14)

- dexcom-proxy CORS is `*` and `/egvs`, `/latest`, `/status` have **no caller auth** — the Worker URL alone serves glucose data. This is not hypothetical.
- Dexcom `CLIENT_SECRET` is **hardcoded in the Worker source**, not a Cloudflare secret. Move to `env.DEXCOM_CLIENT_SECRET` and **rotate it** in the Dexcom developer portal (follow RUNBOOK's 5-step rotation checklist — secret + REDEPLOY).

## Order of operations

1. Origin-lock `anthropic` + `finnhub-proxy` today (money + quota) — `worker-origin-lock.js`.
2. Part A whole-site Access.
3. Part B option 1 for `dexcom-proxy` specifically (health data deserves the real fix).
4. Retire or re-password the dexcom.html JS lock (cosmetic only at that point).
