/* ═══════════════════════════════════════════════════════════
   quotes.js — SHARED FINNHUB QUOTE CACHE (site-wide)
   ═══════════════════════════════════════════════════════════
   Why: every page had its own fhQuote/fetchQuote hitting the
   finnhub-proxy Worker. Navigating index → watchlist → today
   re-fetched the same SPY/QQQ/etc quotes, burning the shared
   60-calls/min free-tier quota. This module caches quotes in
   sessionStorage (60s TTL) so cross-page navigation is free.

   Load in <head>, after CSS (theme.js stays FIRST):
     <script src="quotes.js"></script>

   API:
     fhRawQuote(sym)    → Promise<raw Finnhub JSON {c,d,dp,h,l,o,pc,t}>
     fhQuoteShared(sym) → Promise<{price, pct}>

   Behavior:
     · 60s TTL per symbol, shared across all tabs/pages via sessionStorage
     · de-dupes concurrent in-flight requests for the same symbol
     · on fetch failure, serves the stale cached quote if one exists
   ═══════════════════════════════════════════════════════════ */
(function () {
  const PROXY  = 'https://finnhub-proxy.infiniti306.workers.dev';
  const TTL    = 60 * 1000;   // 60s — matches free-tier refresh cadence
  const PREFIX = 'fhq:';
  const inflight = {};

  function readCache(sym) {
    try {
      const raw = sessionStorage.getItem(PREFIX + sym);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeCache(sym, d) {
    try {
      sessionStorage.setItem(PREFIX + sym, JSON.stringify({ d: d, t: Date.now() }));
    } catch (e) { /* storage full/blocked — cache is best-effort */ }
  }

  /* Raw Finnhub /quote JSON, cached. */
  window.fhRawQuote = async function (sym) {
    const hit = readCache(sym);
    if (hit && Date.now() - hit.t < TTL) return hit.d;
    if (inflight[sym]) return inflight[sym];

    inflight[sym] = (async () => {
      try {
        const r = await fetch(`${PROXY}/quote?symbol=${encodeURIComponent(sym)}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (!d || !d.c || d.c === 0) throw new Error('no data');
        writeCache(sym, d);
        return d;
      } catch (err) {
        if (hit) return hit.d;   // stale quote beats a blank widget
        throw err;
      } finally {
        delete inflight[sym];
      }
    })();
    return inflight[sym];
  };

  /* Convenience shape used by most pages. */
  window.fhQuoteShared = async function (sym) {
    const d = await window.fhRawQuote(sym);
    return { price: d.c, pct: ((d.c - d.pc) / d.pc) * 100 };
  };
})();
