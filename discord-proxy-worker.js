/* ════════════════════════════════════════════════════════════════
   discord-proxy  —  Cloudflare Worker
   ----------------------------------------------------------------
   Holds the Discord bot token as a secret (DISCORD_BOT_TOKEN) and
   the target channel id as a secret/var (DISCORD_CHANNEL_ID).
   Fetches recent messages from the #spx channel via the Discord REST
   API and returns them as JSON to chucksai.com. No token client-side.

   Deploy: paste into a NEW Worker named "discord-proxy" in the
   Cloudflare dashboard. Route it at discord-proxy.infiniti306.workers.dev
   (the default workers.dev subdomain — matches news-proxy etc.).

   Secrets to set (Worker → Settings → Variables and Secrets):
     DISCORD_BOT_TOKEN   = <bot token from discord.com/developers>
     DISCORD_CHANNEL_ID  = <right-click #spx → Copy Channel ID>

   Endpoint:  GET /messages?limit=50   → JSON array of message objects
   ════════════════════════════════════════════════════════════════ */

const ALLOWED_ORIGINS = [
  'https://chucksai.com',
  'https://www.chucksai.com',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://chucksai.com';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }

    const url = new URL(request.url);

    // Only serve the /messages route.
    if (url.pathname !== '/messages' && url.pathname !== '/') {
      return new Response('Not Found', { status: 404, headers: cors });
    }

    // Clamp limit to Discord's allowed 1–100.
    let limit = parseInt(url.searchParams.get('limit') || '50', 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    if (!env.DISCORD_BOT_TOKEN || !env.DISCORD_CHANNEL_ID) {
      return new Response(
        JSON.stringify({ error: 'Worker not configured: set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID secrets.' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const api = `https://discord.com/api/v10/channels/${env.DISCORD_CHANNEL_ID}/messages?limit=${limit}`;

    try {
      const dRes = await fetch(api, {
        headers: {
          'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`,
          'User-Agent': 'ChucksAI-Feed (https://chucksai.com, v1)',
        },
      });

      if (!dRes.ok) {
        const detail = await dRes.text();
        return new Response(
          JSON.stringify({ error: `Discord API ${dRes.status}`, detail }),
          { status: dRes.status, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }

      const messages = await dRes.json();

      // Trim each message to only the fields the page needs (smaller payload,
      // and no need to expose everything Discord returns).
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
          url: a.url,
          filename: a.filename,
          content_type: a.content_type,
          width: a.width,
          height: a.height,
        })),
      }));

      return new Response(JSON.stringify(slim), {
        status: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          // Light cache so rapid refreshes don't hammer Discord's rate limit.
          'Cache-Control': 'public, max-age=30',
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Fetch failed', detail: String(err) }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  },
};
