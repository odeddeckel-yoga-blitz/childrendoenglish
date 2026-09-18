/* Cookieless no-PII landing beacon — one aggregate ping per page load with
 * {page-class, source-class} only. Independent of the analytics consent gate
 * by design: it is a turnstile count, not tracking (no cookie, no storage,
 * no identifier). See /api/land. */
(function () {
  try {
    if (navigator.webdriver || !navigator.sendBeacon) return;
    var p = location.pathname, g = 'other';
    if (p === '/' || p === '') g = 'home';
    else if (p.indexOf('/vocabulary/') === 0 && p.indexOf('/hebrew') > -1) g = 'hebrew';
    else if (p.indexOf('/vocabulary') === 0) g = 'vocab';
    else if (p.indexOf('/printable-flashcards') === 0) g = 'flashcards';
    else if (p.indexOf('/guides') === 0) g = 'guide';
    else if (/^\/(app|learn|quiz|flashcards|players|new-player|path|review|my-words|progress|badges)/.test(p)) g = 'app';
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
    navigator.sendBeacon('/api/land', JSON.stringify({ g: g, s: s }));
  } catch (e) { /* never break the page */ }
})();
