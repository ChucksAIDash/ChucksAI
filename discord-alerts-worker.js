/* ═══════════════════════════════════════════════════════════
   discord-alerts — CRON WORKER (push alerts → Discord)
   (reference copy — paste into a NEW Worker in the Cloudflare
   dashboard; Worker code is not deployed from this repo)
   ═══════════════════════════════════════════════════════════
   What it does, every 15 minutes:
   · MARKET (only during US market hours): SPY daily move beyond
     ±1.5% → posts an alert. Re-alerts only if the move extends
     another 0.75% beyond the last alerted level (max ~2-3/day).
   · GLUCOSE (24/7): latest Dexcom EGV < 70 or > 250 mg/dL →
     posts an alert. Re-alerts at most every 45 min while out of
     range; posts a "back in range" note on recovery.

   ── SETUP ──
   1. Cloudflare dashboard → Workers → Create → paste this file.
   2. Settings → Variables → add secrets:
        FINNHUB_KEY        (same key the finnhub-proxy uses)
        DISCORD_BOT_TOKEN  (existing bot from discord-feed build)
        DISCORD_CHANNEL_ID (channel to post alerts into)
   3. Settings → Bindings → add a KV namespace binding named
        ALERTS_KV          (create namespace "discord-alerts")
      KV remembers what was already alerted — without it the cron
      would repeat the same alert every 15 minutes.
   4. Settings → Triggers → Cron: | *slash-15 * * * * |  → every 15 min
      (write it as *: /15 without the space — comment syntax here)
   5. The bot needs Send Messages permission in the target channel.
   6. Deploy, then test once via the dashboard "Quick edit → Send
      cron trigger" button; check the Discord channel.

   Tune the numbers in CONFIG below.
   ═══════════════════════════════════════════════════════════ */

const CONFIG = {
  SPY_ALERT_PCT: 1.5,        // alert when |daily move| ≥ this
  SPY_REALERT_STEP: 0.75,    // re-alert only if move extends this much further
  GLUCOSE_LOW: 70,           // mg/dL
  GLUCOSE_HIGH: 250,         // mg/dL
  GLUCOSE_REALERT_MIN: 45,   // minutes between repeat glucose alerts
  DEXCOM_PROXY: 'https://dexcom-proxy.infiniti306.workers.dev',
};

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecks(env));
  },
  // Optional: hit the Worker URL in a browser to force a check (handy for testing)
  async fetch(request, env) {
    await runChecks(env);
    return new Response('checks run — see Discord/KV', { status: 200 });
  },
};

async function runChecks(env) {
  await Promise.allSettled([checkSpy(env), checkGlucose(env)]);
}

/* ── SPY ─────────────────────────────────────────────────── */
async function checkSpy(env) {
  if (!marketOpenNowCT()) return;

  const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=SPY&token=${env.FINNHUB_KEY}`);
  if (!r.ok) return;
  const d = await r.json();
  if (!d || !d.c || !d.pc) return;
  const pct = ((d.c - d.pc) / d.pc) * 100;
  if (Math.abs(pct) < CONFIG.SPY_ALERT_PCT) return;

  const today = new Date().toISOString().slice(0, 10);
  const key = 'spy:' + today;
  const prev = parseFloat(await env.ALERTS_KV.get(key)) || 0;
  // Only alert if this move extends meaningfully past the last alerted level
  if (Math.abs(pct) < Math.abs(prev) + (prev ? CONFIG.SPY_REALERT_STEP : 0)) return;

  await env.ALERTS_KV.put(key, String(pct), { expirationTtl: 86400 });
  const dir = pct > 0 ? '🟢 UP' : '🔴 DOWN';
  await postDiscord(env,
    `📊 **SPY ${dir} ${pct.toFixed(2)}%** — $${d.c.toFixed(2)} (prev close $${d.pc.toFixed(2)})`);
}

function marketOpenNowCT() {
  // Central Time regular session: 8:30a–3:00p, Mon–Fri (matches index.html logic)
  const ct = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const day = ct.getDay(), mins = ct.getHours() * 60 + ct.getMinutes();
  return day >= 1 && day <= 5 && mins >= 510 && mins < 900;
}

/* ── GLUCOSE ─────────────────────────────────────────────── */
async function checkGlucose(env) {
  // Rides the existing dexcom-proxy (which holds the OAuth tokens).
  // If you origin-lock dexcom-proxy later, allow this Worker via a
  // shared-secret header instead of Origin.
  const r = await fetch(`${CONFIG.DEXCOM_PROXY}/egvs`);
  if (!r.ok) return;
  const j = await r.json();
  const rec = j?.records?.[0];
  if (!rec || rec.value == null) return;

  const v = rec.value;
  const low = v < CONFIG.GLUCOSE_LOW, high = v > CONFIG.GLUCOSE_HIGH;
  const state = low ? 'low' : high ? 'high' : 'ok';
  const prevState = (await env.ALERTS_KV.get('bg:state')) || 'ok';
  const lastTs = parseInt(await env.ALERTS_KV.get('bg:ts')) || 0;
  const throttled = Date.now() - lastTs < CONFIG.GLUCOSE_REALERT_MIN * 60 * 1000;

  if (state === 'ok') {
    if (prevState !== 'ok') {
      await env.ALERTS_KV.put('bg:state', 'ok');
      await postDiscord(env, `✅ Glucose back in range: **${v} mg/dL**`);
    }
    return;
  }
  if (state === prevState && throttled) return;

  await env.ALERTS_KV.put('bg:state', state);
  await env.ALERTS_KV.put('bg:ts', String(Date.now()));
  const emoji = low ? '🚨⬇️' : '⚠️⬆️';
  const trend = rec.trend ? ` · trend: ${rec.trend}` : '';
  await postDiscord(env, `${emoji} **Glucose ${state.toUpperCase()}: ${v} mg/dL**${trend}`);
}

/* ── DISCORD POST ────────────────────────────────────────── */
async function postDiscord(env, content) {
  await fetch(`https://discord.com/api/v10/channels/${env.DISCORD_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
}
