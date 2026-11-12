/* Cookieless no-PII landing beacon — one aggregate ping per page load with
 * {page-class, source-class} only. Independent of the analytics consent gate
 * by design: it is a turnstile count, not tracking (no cookie, no identifier;
 * the only storage is the last-visit DATE for the return bucket below, plus a tab-scoped
 * sessionStorage list of activities opened, for the movement tallies; neither is sent). See /api/land. */
(function () {
  // Page class of a path (the landing tally's page field; also the class of a referrer page for vp).
  function pageClass(path) {
    if (path === '/' || path === '') return 'home';
    // Reserved 11-08 (measure step 2): the teacher page doesn't exist yet; its views get their own class when it ships.
    if (/^\/((he|es)\/)?(for-)?teachers(\/|$)/.test(path)) return 'teachers';
    if (path.indexOf('/he/') === 0 || path.indexOf('/he') === 0 && path.length <= 4 || (path.indexOf('/vocabulary/') === 0 && path.indexOf('/hebrew') > -1)) return 'hebrew';
    if (path.indexOf('/es') === 0 || (path.indexOf('/vocabulary/') === 0 && path.indexOf('/spanish') > -1)) return 'spanish';
    if (path.indexOf('/units') === 0) return 'unit';
    if (path.indexOf('/battle') === 0) return 'battle';
    if (path.indexOf('/games') === 0) return 'games';
    if (path.indexOf('/tools') === 0) return 'tool';
    if (path.indexOf('/vocabulary') === 0) return 'vocab';
    if (path.indexOf('/printable-flashcards') === 0) return 'flashcards';
    if (path.indexOf('/guides') === 0) return 'guide';
    if (/^\/(app|learn|quiz|flashcards|players|new-player|path|review|my-words|progress|badges)/.test(path)) return 'app';
    return 'other';
  }
  // Once per page load even when a page includes this file twice (the flashcard maker did until 11-08: every tally ×2).
  if (window.__cdeLand) return;
  window.__cdeLand = true;
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
    var p = location.pathname, g = pageClass(p);
    // The surface a tally belongs to: g-<game> (a game page) · app (the SPA) · pg-<page class> (any other page).
    var surface = function () { var m = /^\/games\/([a-z0-9-]+)\/?/.exec(p); return m ? ('g-' + m[1]).slice(0, 40) : document.getElementById('root') ? 'app' : 'pg-' + g; };
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
    var s = 'direct', ref = document.referrer || '', gprod = false;
    if (ref) {
      var h = '';
      try { h = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) {}
      // A Google PRODUCT (Classroom, Docs, Gmail, Drive…) is a class/teacher link, not a search (kit land-beacon.md, 11-12):
      // tested before the search regex, which also matches *.google.*, and it skips the AI utm override below (teachers
      // paste ChatGPT-made ?utm_source=chatgpt.com links into Classroom). gemini.google.com isn't in the list: stays ai.
      gprod = /^(classroom|mail|drive|docs|sites|meet|calendar|groups|forms|translate|accounts|photos)\.google\./.test(h);
      if (h === self) s = 'internal';
      else if (gprod) s = 'external';
      else if (/(chatgpt|openai|perplexity|copilot|gemini|bard|claude|poe\.com|you\.com|phind)/.test(h)) s = 'ai';
      else if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|startpage|brave)\./.test(h)) s = 'seo';
      else if (h) s = 'external';
    }
    // AI assistants often strip the referrer but tag the link (?utm_source=chatgpt.com) —
    // referrer-only classification read CDE+KDM AI arrivals as ~0 from 2026-10-08.
    if (s !== 'internal' && !gprod) {
      try {
        var um = location.search.match(/[?&]utm_source=([^&#]*)/i);
        if (um && /(chatgpt|openai|perplexity|copilot|gemini|bard|claude|poe\.com|you\.com|phind)/.test(decodeURIComponent(um[1]).toLowerCase())) s = 'ai';
      } catch (e) { /* malformed utm — keep referrer class */ }
    }
    navigator.sendBeacon('/api/land', JSON.stringify({ g: g, s: s, l: l }));
    // hum@<src> (kit land-beacon.md, 11-12): once per page open, on the first TRUSTED tap or key — headless browsers with a
    // stock UA pass the server's bot test but never make one. Not an open; human rate = hum@src ÷ src opens.
    try {
      var humSent = false, onHum = function (ev) {
        if (humSent || !ev.isTrusted) return;
        humSent = true;
        ['pointerdown', 'touchstart', 'keydown'].forEach(function (t) { window.removeEventListener(t, onHum, true); });
        navigator.sendBeacon('/api/land', JSON.stringify({ g: g, s: 'hum@' + s, l: l }));
      };
      ['pointerdown', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, onHum, { capture: true, passive: true }); });
    } catch (e) { /* optional */ }
    // The tab's ARRIVAL class (seo · ai · external · direct), kept for this tab only so the first-quiz tally can say how
    // that child arrived (11-07 en first-quiz leak: couldn't hear vs adult evaluating vs left). Coarse class, never sent alone.
    try { if (!sessionStorage.getItem('cde_src')) sessionStorage.setItem('cde_src', s); } catch (e) { /* storage blocked */ }
    /* AI attribution v1 (game-kit infra/land-beacon.md, kit 1.37.0): the ai open
       above stays exactly as it was; alongside it, aie = WHICH assistant, and aiv
       once the page has been visible 5 s in total (clock paused while hidden,
       fires once) — link previews and instant bounces never get there. */
    if (s === 'ai') {
      try {
        var hint = ((ref ? new URL(ref).hostname : '') + ' ' + (location.search.match(/[?&]utm_source=([^&#]*)/i) || ['', ''])[1]).toLowerCase();
        var eng = /chatgpt|openai/.test(hint) ? 'chatgpt' : /perplexity/.test(hint) ? 'perplexity' : /copilot/.test(hint) ? 'copilot'
          : /gemini|bard/.test(hint) ? 'gemini' : /claude/.test(hint) ? 'claude' : 'other';
        var ai = function (e) { navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: e, i: eng }], l: l })); };
        ai('aie');
        var left = 5000, t0 = 0, timer = null, fired = false;
        var start = function () { if (fired || timer) return; t0 = Date.now(); timer = setTimeout(function () { fired = true; timer = null; ai('aiv'); }, left); };
        var stop = function () { if (!timer) return; clearTimeout(timer); timer = null; left -= Date.now() - t0; };
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') start(); else stop(); });
        if (document.visibilityState === 'visible') start();
      } catch (e) { /* attribution is optional */ }
    }
    /* Per-page "went on to play" (static pages only — the SPA has #root): pg =
       a view, cta = a click on a link into the app or a game, mq = the first
       mini-quiz tap. Item = the page path as a key (all word pages share one),
       so cta/pg is each page's click-to-play rate. Aggregate tallies only. */
    try {
      if (!document.getElementById('root')) {
        var seg = p.split('/').filter(Boolean), key;
        if (seg[0] === 'vocabulary' && seg.length === 3 && seg[2] !== 'hebrew' && seg[2] !== 'spanish') key = 'vocabulary_word';
        else key = (seg.join('_') || 'root').toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 40);
        // act (push method v2, 11-11) = "any action": once per page view, sent with the FIRST of a play click, a mini-quiz
        // tap, 15 s visible, a print (button or dialog) or a maker Build — the high-rate metric small CDE pages are read by.
        var acted = false;
        var send = function (e) {
          var b = [{ e: e, i: key }];
          if (!acted && /^(cta|mq|s15|prc|bpr|fmb)$/.test(e)) { acted = true; b.push({ e: 'act', i: key }); }
          navigator.sendBeacon('/api/land', JSON.stringify({ batch: b, l: l }));
        };
        send('pg');
        var PLAY = /^\/(app|play|learn|quiz|flashcards|new-player|players|my-words|letters|path|daily-review|battle|games\/[a-z0-9-]+)?\/?$/;
        var clicked = false, tapped = false;
        document.addEventListener('click', function (ev) {
          var t = ev.target;
          if (!t || !t.closest) return;
          if (!tapped && t.closest('.mq-opt')) { tapped = true; send('mq'); return; }
          var a = t.closest('a[href]');
          if (!a || clicked) return;
          var u = new URL(a.href, location.href);
          if (u.hostname.replace(/^www\./, '') === self && PLAY.test(u.pathname)) { clicked = true; send('cta'); }
        }, true);
        /* Page depth (measure step 2, 11-08): same model and the same page key, each at most ONCE per page view.
           mqv = the mini-quiz is >=50 % on screen while the tab is visible (seen, whether or not it is tapped);
           s15 = the tab has been visible 15 s in total (clock paused while hidden): splits instant bounces from
           read-and-leave; prc = a print button tapped ([data-print] on the printable sheets, #fmPrint on the
           flashcard maker); bpr = the browser's print dialog opened (beforeprint: the button or Ctrl/Cmd+P);
           fmb = the flashcard maker's Build button. Own scope: the names below must not hoist into the blocks around. */
        (function () {
          var once = {};
          var send1 = function (e) { if (once[e]) return; once[e] = true; send(e); };
          var shown = function () { return document.visibilityState === 'visible'; };
          var quiz = document.querySelector('.mini-quiz');
          if (quiz && window.IntersectionObserver) {
            var inView = false, io = null;
            var check = function () { if (!once.mqv && inView && shown()) { send1('mqv'); if (io) io.disconnect(); } };
            io = new IntersectionObserver(function (es) { inView = es[es.length - 1].intersectionRatio >= 0.49; check(); }, { threshold: 0.5 });
            io.observe(quiz);
            document.addEventListener('visibilitychange', check);
          }
          var left = 15000, t0 = 0, timer = null;
          var start = function () { if (once.s15 || timer || !shown()) return; t0 = Date.now(); timer = setTimeout(function () { timer = null; send1('s15'); }, left); };
          var stop = function () { if (!timer) return; clearTimeout(timer); timer = null; left -= Date.now() - t0; };
          document.addEventListener('visibilitychange', function () { if (shown()) start(); else stop(); });
          start();
          document.addEventListener('click', function (ev) {
            var t = ev.target;
            if (!t || !t.closest) return;
            if (t.closest('[data-print], #fmPrint')) send1('prc');
            else if (t.closest('#fmBuild')) send1('fmb');
          }, true);
          window.addEventListener('beforeprint', function () { send1('bpr'); });
        })();
      }
    } catch (e) { /* never break the page */ }
    /* t1 (kit R2X7 "verified session"): once per page load, the first TRUSTED
       pointerdown / keydown on a play surface — a quiz or flashcard screen in the
       app (<html data-view>), anything on a game page except its links, or a
       mini-quiz / practice / reading block on a static page. Item = the surface:
       app · g-<game> · pg-<page class>. Read next to opens; old metrics unchanged. */
    try {
      var PLAY_VIEWS = /^(imageQuiz|wordQuiz|audioQuiz|listenMatchQuiz|flashcards|letterFix|sentenceGap|today|dailyReview|lightning|learning|wordCheck)$/;
      var gm = /^\/games\/([a-z0-9-]+)\/?/.exec(p);
      var t1done = false;
      var onInput = function (ev) {
        if (t1done || !ev.isTrusted) return;
        var t = ev.target, item = null;
        if (!t || !t.closest) return;
        if (document.getElementById('root')) {
          if (PLAY_VIEWS.test(document.documentElement.getAttribute('data-view') || '')) item = 'app';
        } else if (gm) {
          if (!t.closest('a[href]')) item = ('g-' + gm[1]).slice(0, 40);
        } else if (t.closest('.mq-opt, .practice, #practice, [data-reading]')) item = 'pg-' + g;
        if (!item) return;
        t1done = true;
        navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: 't1', i: item }], l: l }));
      };
      document.addEventListener('pointerdown', onInput, true);
      document.addEventListener('keydown', function (ev) { if (ev.key !== 'Tab' && !ev.metaKey && !ev.ctrlKey && !ev.altKey) onInput(ev); }, true);
    } catch (e) { /* never break the page */ }
    /* Return-visit bucket (Engagement Optimizer) — once per local day per
       browser. Stores ONLY the last visit date ('cde_seen', YYYY-MM-DD) and
       sends ONLY a coarse bucket as an aggregate tally — never the date, never
       an identifier. Buckets: new · r1 (yesterday) · r2-7 · r8-30 · r31p ·
       rpre = no date yet but earlier app state exists (visitors from before
       this shipped, 2026-10-18; gap unknown). */
    try {
      var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var today = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      var seen = localStorage.getItem('cde_seen');
      if (seen !== today) {
        var b = 'new';
        if (/^\d{4}-\d\d-\d\d$/.test(seen || '')) {
          var gap = Math.round((Date.parse(today) - Date.parse(seen)) / 86400000);
          b = gap <= 1 ? 'r1' : gap <= 7 ? 'r2-7' : gap <= 30 ? 'r8-30' : 'r31p';
        } else {
          for (var k = 0; k < localStorage.length; k++) {
            // lk, not key: a var named key here is the SAME variable as the page key above (function scope), and
            // overwrote it with a storage key for every later cta/mq of a first-day visitor (fixed 11-08).
            var lk = localStorage.key(k) || '';
            if (lk.indexOf('childrendoenglish-') === 0 || lk === 'cde_lang' || lk === 'cde-lang-suggest-done') { b = 'rpre'; break; }
          }
        }
        localStorage.setItem('cde_seen', today);
        navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: 'vis', i: b }], l: l }));
        // Which surface a RETURNING day starts on (kit 1.59 "returning players"): rets @ surface, same once-a-day gate.
        if (b !== 'new' && b !== 'rpre') navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: 'rets', i: surface() }], l: l }));
      }
    } catch (e) { /* storage unavailable — no return signal */ }
    /* Standing optimizer sections (kit 1.59 §5.55, owner 11-04). Aggregate tallies like everything above: no identifier,
       no path, no message and no timing is ever sent — only a surface (g-<game> · app · pg-<page class>) and a word. */
    try {
      var surf = surface();
      var tally = function (e, i) { navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: e, i: i }], l: l })); };
      // Errors × bounce: at most ONE jserr per page load when a script of OURS throws (same-origin file; extension and
      // cross-origin "Script error." events are skipped).
      var errSent = false;
      // Error signature (kit land-beacon.md §jserr, owner OK 11-11): <file>_<line>_<type>, never message text (a message
      // can carry what a child typed). file = our script's basename, slugged, ≤ 24 chars; a game's own file is prefixed
      // with the game id (every game has a game.js); line 1–99999 else 0; type from the error's constructor.
      var errSig = function (ev) {
        var err = ev.type === 'error' ? ev.error : ev.reason, url = '', line = 0;
        if (ev.type === 'error') { url = ev.filename || ''; line = ev.lineno || 0; }
        else { var m = /(https?:\/\/[^\s)]+?):(\d+):\d+/.exec(String((err && err.stack) || '')); if (m) { url = m[1]; line = +m[2]; } }
        var file = 'inline';
        if (url && url.split('#')[0] !== location.href.split('#')[0]) {
          var path = new URL(url, location.href).pathname, gm2 = /^\/games\/([a-z0-9-]+)\/[^/]+$/.exec(path);
          var base = path.split('/').pop().replace(/\.[a-z0-9]+$/i, '') || 'index';
          file = ((gm2 ? gm2[1] + '-' : '') + base).toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24);
        }
        line = line >= 1 && line <= 99999 ? Math.floor(line) : 0;
        var name = (err && err.constructor && err.constructor.name) || '';
        var type = { TypeError: 'type', ReferenceError: 'ref', RangeError: 'range', SyntaxError: 'syntax' }[name] || 'other';
        return file + '_' + line + '_' + type;
      };
      var onErr = function (ev) {
        try {
          if (errSent || !ev) return;
          var f = String(ev.filename || (ev.reason && ev.reason.stack) || '');
          if (ev.type === 'error' && (f ? f.indexOf(location.origin) !== 0 : (!ev.error || /^Script error\.?$/.test(ev.message || '')))) return;
          if (ev.type === 'unhandledrejection' && f.indexOf(location.origin) < 0) return;
          errSent = true;
          // jserx (kit land-beacon.md, KDM 11-12): CDE pages carry no inline scripts (CSP script-src 'self'), so an error
          // whose source is the page itself was injected (extension / school filter). Only our own files count as jserr.
          var sig = errSig(ev);
          if (sig.indexOf('inline_') === 0) { tally('jserx', surf); return; }
          tally('jserr', surf);
          tally('jserrsig', sig);
        } catch (x) { /* never break the page */ }
      };
      window.addEventListener('error', onErr);
      window.addEventListener('unhandledrejection', onErr);
      // Phone load speed (the free alternative to Vercel Speed Insights): phones only (≤760 px), 1 page load in 4; when
      // the page hides, LCP / CLS / INP each as one bucket word (web.dev limits) → cwv @ <metric>_<good|ni|poor>@<surface>.
      if (window.PerformanceObserver && window.matchMedia && matchMedia('(max-width:760px)').matches && Math.random() < 0.25) {
        var lcp = 0, cls = 0, inp = 0, cwvSent = false;
        try { new PerformanceObserver(function (li) { var es = li.getEntries(); if (es.length) lcp = es[es.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (x) { /* unsupported */ }
        try { new PerformanceObserver(function (li) { li.getEntries().forEach(function (en) { if (!en.hadRecentInput) cls += en.value; }); }).observe({ type: 'layout-shift', buffered: true }); } catch (x) { /* unsupported */ }
        try { new PerformanceObserver(function (li) { li.getEntries().forEach(function (en) { if (en.interactionId && en.duration > inp) inp = en.duration; }); }).observe({ type: 'event', buffered: true, durationThreshold: 40 }); } catch (x) { /* unsupported */ }
        var b3 = function (v, a, z) { return v <= a ? 'good' : v <= z ? 'ni' : 'poor'; };
        document.addEventListener('visibilitychange', function () {
          if (cwvSent || document.visibilityState !== 'hidden') return;
          cwvSent = true;
          var out = [];
          if (lcp > 0) out.push('lcp_' + b3(lcp, 2500, 4000));
          out.push('cls_' + b3(cls, 0.1, 0.25));
          if (inp > 0) out.push('inp_' + b3(inp, 200, 500));
          navigator.sendBeacon('/api/land', JSON.stringify({ batch: out.map(function (m) { return { e: 'cwv', i: (m + '@' + surf).slice(0, 40) }; }), l: l }));
        });
      }
      // Game pages: movement between activities (g2 / g3 / hop — the same tab list as src/utils/activityFlow.js) and
      // which kind of site page sent the child here (vp @ page class; ÷ that class's page loads = its click-through to a
      // game). A reload or Back return is not a new open.
      var gid = (/^\/games\/([a-z0-9-]+)\/?/.exec(p) || [])[1];
      var nav = 'navigate';
      try { var ne = performance.getEntriesByType('navigation')[0]; if (ne && ne.type) nav = ne.type; } catch (x) { /* old browser */ }
      if (gid && nav === 'navigate') {
        var rp = '', rself = false;
        try { if (ref) { var ru = new URL(ref); rself = ru.hostname.replace(/^www\./, '') === self; rp = ru.pathname; } } catch (x) { /* bad referrer */ }
        var rcls = rself ? pageClass(rp) : '';
        var how = /[?&]from=ladder/.test(location.search) ? 'ladder' : !ref ? 'direct' : !rself ? 'ext'
          : /^\/games\/[a-z0-9-]+/.test(rp) ? 'game' : rcls === 'games' ? 'hub' : (rcls === 'home' || rcls === 'app') ? 'app' : 'page';
        var seenActs = [];
        try { seenActs = JSON.parse(sessionStorage.getItem('cde_acts') || '[]') || []; } catch (x) { seenActs = []; }
        var fl = [];
        if (seenActs.indexOf(gid) < 0) {
          seenActs.push(gid);
          sessionStorage.setItem('cde_acts', JSON.stringify(seenActs.slice(-30)));
          if (seenActs.length === 2 || seenActs.length === 3) fl.push({ e: 'g' + seenActs.length, i: how });
        }
        var lastAct = sessionStorage.getItem('cde_last');
        if (lastAct && lastAct !== gid) fl.push({ e: 'hop', i: (lastAct + '@' + gid).slice(0, 40) });
        sessionStorage.setItem('cde_last', gid);
        if (rself && how !== 'game') fl.push({ e: 'vp', i: rcls });
        if (fl.length) navigator.sendBeacon('/api/land', JSON.stringify({ batch: fl, l: l }));
      }
      // In-game controls (kit infra/kpi game-clicks): which buttons children see and tap, per level.
      if (gid) {
        var gc = function () { var s = document.createElement('script'); s.src = '/games/game-clicks.js'; s.async = true; document.head.appendChild(s); };
        if (document.readyState === 'complete') setTimeout(gc, 0); else window.addEventListener('load', function () { setTimeout(gc, 0); });
      }
    } catch (e) { /* never break the page */ }
  } catch (e) { /* never break the page */ }
})();
