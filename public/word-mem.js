/* cde-word-mem v1 (2026-11-18) — ONE on-device word memory for the whole site.
 * The app (src/utils/wordMemory.js) keeps each player's spaced-repetition record in
 * localStorage 'childrendoenglish-player-<id>'.wordProgress. Pages outside the app
 * (the arcade games, unit and Band I practice, the readings, word-page mini-quizzes)
 * never write that record themselves: they append { w, ok, t, s[, p][, k] } to the
 * shared INBOX below, and the app folds the inbox into the right player with the one
 * SR rule (updateWordSR) the next time it opens. Same origin, so one key serves all.
 *   CDE_WORD(id, ok[, look])  record one result. id = an app word id ([a-z0-9-]);
 *                             ok = first try right; look = a tap-for-meaning in a reading.
 *   CDE_WORDMEM.toReview()    words to review today for whoever is playing (due + just missed)
 *   CDE_WORDMEM.card(parent, surface[, lang])  the end-of-activity "words to review today (N)"
 *                             link (nothing when N = 0), opening the app's short review.
 * Who: one player → that player; a family → the active player while the app's 2-hour
 * resume window is open; otherwise a guest answer, taken by the next player to open the
 * app (a brand-new player only after the first quiz, or at once if the review link is tapped).
 * Privacy: nothing here leaves the device. The only network call is the cookieless rvw
 * tally (view_/open_<surface>), with the same guards as the other beacons.
 * Storage can throw (kit PATTERNS §41): every touch is guarded; with storage blocked this is a no-op.
 * Split by device (11-27, src/utils/ladderArm.js): the review link is the TREATMENT arm's only (kit /arm-bit.js,
 * kitArm('ladder') === 1 with stable storage). The control arm, crawlers and owner devices see no link, as on main;
 * CDE_WORD still records in every arm (on the device only, nothing shown), and the control app never folds it. */
(function () {
  'use strict';
  var KEY = 'childrendoenglish-word-inbox', MAX = 400;
  var PLAYERS = 'childrendoenglish-players', PFX = 'childrendoenglish-player-', LAST = 'childrendoenglish-last-active';
  var RESUME = 2 * 60 * 60 * 1000, DAY = 86400000, RECENT = 3 * DAY, REVIEW_MAX = 10;
  var ID = /^[a-z0-9-]{1,40}$/;

  // the kit's visitor arm, one copy for the app and the pages (ready long before an activity ends)
  try {
    if (!window.kitArm && !document.querySelector('script[src="/arm-bit.js"]')) {
      var ab = document.createElement('script'); ab.src = '/arm-bit.js'; ab.async = true; document.head.appendChild(ab);
    }
  } catch (e) { /* no arm: control (no link) */ }
  function treat() {
    try { return !!window.kitArm && window.kitArm('ladder') === 1 && window.kitArm.stable('ladder'); } catch (e) { return false; }
  }

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function json(k) { try { return JSON.parse(get(k) || 'null'); } catch (e) { return null; } }
  function read() { var a = json(KEY); return Array.isArray(a) ? a : []; }
  function write(a) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-MAX))); } catch (e) { /* full or blocked */ } }
  function registry() { var r = json(PLAYERS); return r && r.players && r.players.length ? r : null; }
  function owner() {
    var r = registry(); if (!r) return null;
    if (r.players.length === 1) return r.players[0].id;
    var last = +get(LAST) || 0, now = Date.now();
    var known = r.players.some(function (p) { return p.id === r.activePlayerId; });
    return known && last > 0 && now - last >= 0 && now - last < RESUME ? r.activePlayerId : null;
  }
  function source() {
    var p = location.pathname, m = p.match(/^\/games\/([a-z0-9-]+)/);
    if (m) return 'g-' + m[1];
    if (/^\/band-1\/reading\//.test(p)) return 'read';
    if (/^\/(units|band-1)\//.test(p)) return 'unit';
    return 'page';
  }

  window.CDE_WORD = function (id, ok, look) {
    if (typeof id !== 'string' || !ID.test(id)) return;
    var e = { w: id, ok: ok ? 1 : 0, t: Date.now(), s: source() };
    var p = owner(); if (p) e.p = p;
    if (look) { e.ok = 0; e.k = 'look'; }
    var a = read(); a.push(e); write(a);
  };

  // Same fold as the app (src/utils/wordMemory.js applyInboxEntries + reviewTodayWords), reduced to
  // "is this word up for review now?". Kept in step by src/__tests__/wordMemory.test.js.
  function dayOf(t) { var d = new Date(t); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
  function upNow(c, now) { return !!c && ((now - c.lastSeen) / DAY >= c.interval || (c.wrong > 0 && c.interval === 1 && now - c.lastSeen < RECENT)); }
  var LADDER = [1, 3, 7, 14, 30];   // = SR_INTERVALS in src/utils/spaced-repetition.js
  function nextInterval(i) { var k = LADDER.indexOf(i); return k >= 0 && k < LADDER.length - 1 ? LADDER[k + 1] : i >= 30 ? Math.min(i * 2, 60) : 3; }
  function toReview() {
    var now = Date.now(), p = owner(), wp = {};
    if (p) { var st = json(PFX + p); wp = (st && st.wordProgress) || {}; }
    var cards = {}, id;
    for (id in wp) if (Object.prototype.hasOwnProperty.call(wp, id) && wp[id]) cards[id] = { lastSeen: +wp[id].lastSeen || 0, interval: +wp[id].interval || 1, wrong: +wp[id].wrong || 0 };
    var groups = {}, order = [];
    read().forEach(function (e) {
      if (!e || typeof e.w !== 'string' || !(e.t > 0)) return;
      if (p ? e.p !== p : !!e.p) return;
      var k = e.w + '|' + dayOf(e.t);
      if (!groups[k]) { groups[k] = { w: e.w, t: e.t, last: e.t, ok: false, miss: false, look: false }; order.push(k); }
      var g = groups[k]; g.last = Math.max(g.last, e.t); g.t = Math.min(g.t, e.t);
      if (e.ok) g.ok = true; else if (e.k === 'look') g.look = true; else g.miss = true;
    });
    order.sort(function (a, b) { return groups[a].t - groups[b].t; });
    order.forEach(function (k) {
      var g = groups[k], c = cards[g.w];
      var miss = g.miss || (g.look && (!c || c.interval <= 3));      // a look-up only counts for a word not yet settled
      if (!miss && !g.ok) return;
      if (c && g.t <= c.lastSeen) return;                              // older than the card: counters only
      if (miss) { cards[g.w] = { lastSeen: Math.min(g.last, now), interval: 1, wrong: (c ? c.wrong : 0) + 1 }; return; }
      if (c && dayOf(c.lastSeen) === dayOf(g.t)) return;              // one step up per word per day
      cards[g.w] = { lastSeen: Math.min(g.last, now), interval: nextInterval(c ? c.interval : 1), wrong: c ? c.wrong : 0 };
    });
    var n = 0;
    for (id in cards) if (upNow(cards[id], now)) n++;
    return Math.min(n, REVIEW_MAX);
  }

  var STR = {
    en: { label: 'Words to review today ({n})' },
    he: { label: 'מילים לחזרה היום ({n})' },
    es: { label: 'Palabras para repasar hoy ({n})' }
  };
  function langNow(l) { l = l || window.CDE_LANG || get('cde_lang') || 'en'; return l === 'he' || l === 'es' ? l : 'en'; }
  function reviewHref(lang) {
    var q = 'review=1' + (lang !== 'en' ? '&lang=' + lang : '');
    return (registry() ? '/app?' : '/new-player?') + q;
  }
  function rvw(item) {
    try {
      if (navigator.webdriver || get('cde_internal') === '1' || !navigator.sendBeacon) return;
      navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: 'rvw', i: item }], l: langNow() }));
    } catch (e) { /* never break the page for a tally */ }
  }
  // surface: game | unit | read | word (the rvw item shape is pinned in api/land.js)
  function card(parent, surface, lang) {
    if (!parent || !treat()) return null;
    var old = parent.querySelector('.cde-review'); if (old) old.parentNode.removeChild(old);
    var n = toReview(); if (!n) return null;
    lang = langNow(lang);
    var a = document.createElement('a');
    a.className = 'cde-review';
    a.href = reviewHref(lang);
    a.setAttribute('data-cde-review', String(n));
    a.style.cssText = 'display:inline-flex;align-items:center;gap:6px;font-weight:700;text-decoration:underline;font-size:15px;color:inherit;padding:8px 4px;min-height:44px';
    // our own static icon markup (the sprite the games and pages already use)
    a.innerHTML = '<svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-repeat"/></svg>';
    var parts = STR[lang].label.split('{n}');
    a.appendChild(document.createTextNode(parts[0]));
    var b = document.createElement('bdi'); b.setAttribute('dir', 'ltr'); b.textContent = String(n); a.appendChild(b);
    a.appendChild(document.createTextNode(parts[1] || ''));
    a.addEventListener('click', function () { rvw('open_' + surface); });
    parent.appendChild(a);
    rvw('view_' + surface);
    return a;
  }

  window.CDE_WORDMEM = { key: KEY, entries: read, owner: owner, toReview: toReview, reviewHref: reviewHref, card: card, treat: treat };
})();
