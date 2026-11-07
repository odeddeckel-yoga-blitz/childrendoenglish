/* cde-game-clicks v1 (2026-11-04; kit infra/kpi/game-clicks.js, adapted to the 6 CDE games) — which in-game controls
 * children see and use, per level: hint / hear-again taps per level (many = too hard), Home at level 1, controls
 * never used. Loaded by /land-beacon.js on /games/<id>/ pages — no game file is edited.
 * Same contract and endpoint as the hub's component clicks (/api/land {cc} → component_daily): template = the screen
 * ('game-menu', 'game-l1' … 'game-l12', 'game-result' = a level-done or end card), route = '/games/<id>', component =
 * the element id or its first class (never an index: choices shuffle). Per page view: imp = 1 if the control was on
 * screen, clk = taps (capped 20). One beacon per screen when the page hides.
 * Privacy: no cookie, no identifier, no text, no values; tallies only. Not sent from automated browsers or the owner's
 * ?internal=1 browser. Inspect: window.__cdeGameClicks() → current tallies. */
(function () {
  try {
    var id = (location.pathname.match(/^\/games\/([a-z0-9-]+)/) || [])[1]; if (!id) return;
    var CAND = 'button, [role="button"], a[href], .opt, .tile, .bin';
    var tally = {};   // screen → comp → [imp, clk]
    var shown = function (el) { return !!el && !el.hidden && el.offsetParent !== null; };
    var $ = function (s) { return document.querySelector(s); };
    function level () {
      try {
        if (window.SF) return SF.state.level;
        if (window.WZ) return WZ.dbg.tier;
        if (window.CC) return CC.dbg.level;
        if (window.OO) return OO.S.lvl + 1;   // odd-one-out / word-memory keep S in their closure
        if (window.WM) return WM.S.lvl + 1;
        if (window.OPP) return OPP.S.lvl + 1;   // opposites / true-or-false (wave 2)
        if (window.TF) return TF.S.lvl + 1;
        if (window.FE) return FE.S.lvl + 1;
        if (window.SB) return SB.S.lvl + 1;
        if (window.BS) return BS.S.lvl + 1;
        if (window.S && typeof S.lvl === 'number') return S.lvl + 1;   // letter-twins / read-it / sound-pairs (0-based)  (+ rhyme-time, missing-letter, picture-bingo)
      } catch (e) { /* game not up yet */ }
      return 1;
    }
    function screen () {
      if (shown($('#menu'))) return 'game-menu';
      if (shown($('#over')) || shown($('#win')) || shown($('#app .card'))) return 'game-result';
      return 'game-l' + Math.max(1, Math.min(12, +level() || 1));
    }
    function comp (el) {
      if (el.id) return ('id.' + el.id.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')).slice(0, 60);
      var c = (typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '') || el.tagName.toLowerCase();
      return c.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').slice(0, 40) || null;
    }
    function row (b, c) { var t = (tally[b] = tally[b] || {}); return (t[c] = t[c] || [0, 0]); }
    document.addEventListener('click', function (e) {
      try {
        var el = e.target && e.target.closest && e.target.closest(CAND); if (!el || el.closest('[aria-hidden=true]')) return;
        var c = comp(el); if (!c) return; var r = row(screen(), c); r[0] = 1; if (r[1] < 20) r[1]++;
      } catch (x) { /* never break the game */ }
    }, true);
    setInterval(function () {   // impressions: visible, enabled controls on the current screen
      try {
        if (document.visibilityState !== 'visible') return;
        var b = screen(), els = document.querySelectorAll(CAND);
        for (var i = 0; i < els.length && i < 120; i++) {
          var el = els[i];
          if (el.disabled || el.closest('[aria-hidden=true]') || !shown(el)) continue;
          var r0 = el.getBoundingClientRect(); if (r0.bottom < 0 || r0.top > innerHeight || !r0.width) continue;
          var c = comp(el); if (c) row(b, c)[0] = 1;
        }
      } catch (x) { /* never break the game */ }
    }, 1000);
    function blocked () { try { return navigator.webdriver || localStorage.getItem('cde_internal') === '1'; } catch (e) { return !!navigator.webdriver; } }
    function flush () {
      try {
        if (blocked() || !navigator.sendBeacon) { tally = {}; return; }
        for (var b in tally) {
          var items = []; for (var c in tally[b]) items.push([c, tally[b][c][0], tally[b][c][1]]);
          for (var k = 0; k < items.length; k += 60) navigator.sendBeacon('/api/land', JSON.stringify({ cc: { t: b, r: '/games/' + id, i: items.slice(k, k + 60) } }));
        }
        tally = {};
      } catch (e) { /* never break the game */ }
    }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
    window.addEventListener('pagehide', flush);
    window.__cdeGameClicks = function () { return JSON.parse(JSON.stringify(tally)); };
  } catch (e) { /* never break the game */ }
})();
