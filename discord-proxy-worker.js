/* ════════════════════════════════════════════════════════════════
   discord-proxy  —  Cloudflare Worker
   ----------------------------------------------------------------
   Holds the Discord bot token as a secret (DISCORD_BOT_TOKEN) and
   the target channel id as a secret (DISCORD_CHANNEL_ID). Reads
   recent #spx messages and (optionally) writes a reaction as the bot.
   No token client-side.

   Deploy: paste into a NEW Worker named "discord-proxy" in the
   Cloudflare dashboard. Default subdomain discord-proxy.infiniti306.workers.dev
   (matches news-proxy etc.).

   Secrets (Worker → Settings → Variables and Secrets):
     DISCORD_BOT_TOKEN   = <bot token from discord.com/developers>
     DISCORD_CHANNEL_ID  = <right-click #spx → Copy Channel ID>

   Routes:
     GET  /messages?limit=50      → JSON array of slimmed message objects
                                     (incl. reactions)
     POST /react  {messageId,emoji}→ bot adds that reaction to the message,
                                     returns {ok:true}

   Bot permissions needed (set in the OAuth2 invite URL):
     View Channels, Read Message History, Add Reactions
   And the "Message Content Intent" must be ON (Bot page).
   ════════════════════════════════════════════════════════════════ */

const ALLOWED_ORIGINS = [
  'https://chucksai.com',
  'https://www.chucksai.com',
];

// Unicode emoji we permit the site to send (prevents the route being
// abused to spam arbitrary reactions). Extend as you like.
const ALLOWED_EMOJI = ['🔥', '👍', '👀', '✅', '🚀', '💯'];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://chucksai.com';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_CHANNEL_ID) {
      return json({ error: 'Worker not configured: set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID secrets.' }, 500, cors);
    }

    const url = new URL(request.url);
    const auth = { 'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`, 'User-Agent': 'ChucksAI-Feed (https://chucksai.com, v1)' };

    /* ───── GET /messages ───── */
    if (request.method === 'GET' && (url.pathname === '/messages' || url.pathname === '/')) {
      let limit = parseInt(url.searchParams.get('limit') || '50', 10);
      if (isNaN(limit) || limit < 1) limit = 50;
      if (limit > 100) limit = 100;

      try {
        const dRes = await fetch(
          `https://discord.com/api/v10/channels/${env.DISCORD_CHANNEL_ID}/messages?limit=${limit}`,
          { headers: auth }
        );
        if (!dRes.ok) {
          return json({ error: `Discord API ${dRes.status}`, detail: await dRes.text() }, dRes.status, cors);
        }
        const messages = await dRes.json();
        const slim = messages.map(m => ({
          id: m.id,
          content: m.content,
          timestamp: m.timestamp,
          author: {
            id: m.author?.id,
            username: m.author?.username,
            global_name: m.author?.global_name,
            avatar: m.author?.avatar,
          },
          attachments: (m.attachments || []).map(a => ({
            url: a.url, filename: a.filename, content_type: a.content_type, width: a.width, height: a.height,
          })),
          reactions: (m.reactions || []).map(r => ({
            count: r.count,
            me: r.me,                       // true if the bot already reacted
            emoji: { name: r.emoji?.name, id: r.emoji?.id },
          })),
        }));
        return new Response(JSON.stringify(slim), {
          status: 200,
          headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
        });
      } catch (err) {
        return json({ error: 'Fetch failed', detail: String(err) }, 502, cors);
      }
    }

    /* ───── POST /react ───── */
    if (request.method === 'POST' && url.pathname === '/react') {
      // Only allow our own site to trigger a write.
      if (!ALLOWED_ORIGINS.includes(origin)) {
        return json({ error: 'Forbidden origin' }, 403, cors);
      }
      let payload;
      try { payload = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400, cors); }

      const { messageId, emoji } = payload || {};
      if (!messageId || !emoji) return json({ error: 'messageId and emoji required' }, 400, cors);
      if (!ALLOWED_EMOJI.includes(emoji)) return json({ error: 'Emoji not allowed' }, 400, cors);

      try {
        // PUT /channels/{id}/messages/{mid}/reactions/{emoji}/@me  (URL-encode emoji)
        const enc = encodeURIComponent(emoji);
        const rRes = await fetch(
          `https://discord.com/api/v10/channels/${env.DISCORD_CHANNEL_ID}/messages/${messageId}/reactions/${enc}/@me`,
          { method: 'PUT', headers: auth }
        );
        // Discord returns 204 No Content on success.
        if (rRes.status !== 204) {
          return json({ error: `Discord react ${rRes.status}`, detail: await rRes.text() }, rRes.status, cors);
        }
        return json({ ok: true }, 200, cors);
      } catch (err) {
        return json({ error: 'React failed', detail: String(err) }, 502, cors);
      }
    }

    return json({ error: 'Not Found' }, 404, cors);
  },
};
