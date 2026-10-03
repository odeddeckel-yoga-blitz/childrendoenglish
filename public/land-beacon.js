/* Cookieless no-PII landing beacon — one aggregate ping per page load with
 * {page-class, source-class} only. Independent of the analytics consent gate
 * by design: it is a turnstile count, not tracking (no cookie, no storage,
 * no identifier). See /api/land. */
(function () {
  try {
    // Owner opt-out: visiting any page once with ?internal=1 marks THIS browser
    // as internal traffic forever (localStorage write is the owner's own choice,
    // not visitor tracking). GA and this beacon both honor the flag.
    try {
      if (/[?&]internal=1/.test(location.search)) localStorage.setItem('cde_internal', '1');
      if (localStorage.getItem('cde_internal') === '1') return;
    } catch (e) { /* storage unavailable — fall through */ }
    if (navigator.webdriver || !navigator.sendBeacon) return;
    // Vercel Web Analytics (cookieless, no PII) — one loader covers the SPA and
    // every static SEO page; internal/webdriver traffic never reaches this line.
    // The script self-handles SPA route changes (history API).
    if (!document.getElementById('va-insights')) {
      var va = document.createElement('script');
      va.id = 'va-insights';
      va.defer = true;
      va.src = '/_vercel/insights/script.js';
      document.head.appendChild(va);
    }
    var p = location.pathname, g = 'other';
    if (p === '/' || p === '') g = 'home';
    else if (p.indexOf('/vocabulary/') === 0 && p.indexOf('/hebrew') > -1) g = 'hebrew';
    else if (p.indexOf('/es') === 0 || (p.indexOf('/vocabulary/') === 0 && p.indexOf('/spanish') > -1)) g = 'spanish';
    else if (p.indexOf('/games') === 0) g = 'games';
    else if (p.indexOf('/vocabulary') === 0) g = 'vocab';
    else if (p.indexOf('/printable-flashcards') === 0) g = 'flashcards';
    else if (p.indexOf('/guides') === 0) g = 'guide';
    else if (/^\/(app|learn|quiz|flashcards|players|new-player|path|review|my-words|progress|badges)/.test(p)) g = 'app';
    /* Interface language: language surfaces declare themselves by path; the SPA
       reads the saved UI preference; everything else counts as 'en'. */
    var l = 'en';
    if (p.indexOf('/he') === 0 || p.indexOf('/hebrew') > -1) l = 'he';
    else if (p.indexOf('/es') === 0 || p.indexOf('/spanish') > -1) l = 'es';
    else if (p.indexOf('/ar') === 0 || p.indexOf('/arabic') > -1) l = 'ar';
    else {
      try {
        var sl = localStorage.getItem('cde_lang');
        if (sl === 'he' || sl === 'es' || sl === 'ar') l = sl;
      } catch (e) { /* default en */ }
    }
    var self = location.hostname.replace(/^www\./, '');
    var s = 'direct', ref = document.referrer || '';
    if (ref) {
      var h = '';
      try { h = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) {}
      if (h === self) s = 'internal';
      else if (/(chatgpt|openai|perplexity|copilot|gemini|bard|claude|poe\.com|you\.com|phind)/.test(h)) s = 'ai';
      else if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|startpage|brave)\./.test(h)) s = 'seo';
      else if (h) s = 'external';
    }
    navigator.sendBeacon('/api/land', JSON.stringify({ g: g, s: s, l: l }));
  } catch (e) { /* never break the page */ }
})();
