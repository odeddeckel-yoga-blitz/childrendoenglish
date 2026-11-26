/* Graded-reader pages: /band-1/reading/<slug>/ (Hebrew) and /es/lecturas/<slug>/ (Spanish). CSP-safe external file.
 * Tap a word → its gloss in the bar under the text. UI strings come from the page (data-t-* on [data-reading],
 * src/data/readingUi.js); the Hebrew fallbacks keep an older cached page working. ▶ plays the text sentence by
 * sentence (the sentence being read is highlighted); 🔊 plays one question.
 * 🐢 = 0.75× playback, remembered on this device (same key as the word pages).
 * Questions: a wrong pick stays marked and the child tries again; the score counts
 * first tries. Beacons: quiz_start / quiz_done @ read-<slug> (cookieless aggregate,
 * automation and owner devices excluded, as everywhere else). */
(function () {
  'use strict';
  var root = document.querySelector('[data-reading]');
  if (!root) return;
  // one word memory: load /word-mem.js (CDE_WORD + the review link) once per page, no extra tag in the page
  try {
    if (!window.CDE_WORDMEM && !document.querySelector('script[src="/word-mem.js"]')) {
      var wmS = document.createElement('script'); wmS.src = '/word-mem.js'; wmS.async = true; document.head.appendChild(wmS);
    }
  } catch (e) { /* no memory on this page — practice still works */ }
  var slug = root.getAttribute('data-reading');
  var LANG = root.getAttribute('data-lang') || 'he';
  var RTL = document.documentElement.dir === 'rtl';
  function T(k, d) { return root.getAttribute('data-t-' + k) || d; }

  function excluded() {
    try { return navigator.webdriver || localStorage.getItem('cde_internal') === '1'; } catch (e) { return false; }
  }
  function beacon(e, i) {
    try {
      if (excluded() || !navigator.sendBeacon || !/^[a-z0-9@_-]{1,40}$/.test(i)) return;
      navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: e, i: i }], l: LANG === 'es' ? 'es' : 'he' }));
    } catch (err) { /* never break the page */ }
  }
  // Drawn icons (sprite): own static strings only, so innerHTML is safe for them.
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function ic(n){return '<svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-'+n+'"/></svg>';}
  var begun = false;
  function begin() { if (!begun) { begun = true; beacon('quiz_start', ('read-' + slug).slice(0, 40)); } }

  // Keep English runs left-to-right inside the Hebrew gloss bar.
  function isolate(s) { if (!RTL) return s; return s.replace(/[A-Za-z][A-Za-z' ]*[A-Za-z]|[A-Za-z]/g, function (m) { return '⁦' + m + '⁩'; }); }

  var SLOW_KEY = 'cde_slow';
  function slowOn() { try { return localStorage.getItem(SLOW_KEY) === '1'; } catch (e) { return false; } }
  var slowBtn = root.querySelector('[data-slow]');
  if (slowBtn) slowBtn.setAttribute('aria-pressed', String(slowOn()));

  var player = null, queue = [], playAllBtn = root.querySelector('[data-play-all]');
  var sentences = Array.prototype.slice.call(root.querySelectorAll('.snt[data-src]'));
  function mark(el) {
    sentences.forEach(function (s) { s.classList.toggle('on', s === el); });
  }
  function stop() {
    queue = [];
    if (player) { player.onended = null; player.pause(); }
    mark(null);
    if (playAllBtn) playAllBtn.innerHTML = ic('play') + ' ' + esc(T('play', 'הקשיבו לכל הקטע'));
  }
  function play(src, onend) {
    try {
      if (player) { player.onended = null; player.pause(); }
      player = new Audio(src);
      if (slowOn()) { player.playbackRate = 0.75; player.preservesPitch = true; }
      player.onended = onend || null;
      player.play().catch(function () { stop(); });
    } catch (e) { stop(); }
  }
  function nextInQueue() {
    var el = queue.shift();
    if (!el) { stop(); return; }
    mark(el);
    play(el.getAttribute('data-src'), nextInQueue);
  }

  var glossBar = document.getElementById('gloss');
  var selWord = null;
  root.addEventListener('click', function (ev) {
    var w = ev.target.closest('.w');
    if (w) {
      begin();
      if (selWord) selWord.classList.remove('sel');
      selWord = w; w.classList.add('sel');
      glossBar.textContent = isolate(w.textContent + ' — ' + w.getAttribute('data-g'));
      // one word memory (/word-mem.js): a looked-up app word comes back in the review (unless already well known)
      if (w.getAttribute('data-id') && window.CDE_WORD) window.CDE_WORD(w.getAttribute('data-id'), false, true);
      return;
    }
    if (ev.target.closest('[data-play-all]')) {
      begin();
      if (queue.length || (player && !player.paused)) { stop(); return; }
      queue = sentences.slice();
      playAllBtn.innerHTML = ic('x') + ' ' + esc(T('stop', 'עצירה'));
      nextInQueue();
      return;
    }
    var s = ev.target.closest('[data-say]');
    if (s) { stop(); play(s.getAttribute('data-say')); return; }
    if (ev.target.closest('[data-slow]')) {
      var on = !slowOn();
      try { localStorage.setItem(SLOW_KEY, on ? '1' : '0'); } catch (e) { /* storage blocked */ }
      slowBtn.setAttribute('aria-pressed', String(on));
      return;
    }
    var o = ev.target.closest('.opt');
    if (o && !o.disabled) answer(o);
  });

  var qs = Array.prototype.slice.call(root.querySelectorAll('.q'));
  var firstTry = 0, done = 0;
  function answer(o) {
    begin();
    var q = o.closest('.q'), fb = q.querySelector('.fb');
    if (q.getAttribute('data-done')) return;
    var tried = q.getAttribute('data-tried');
    if (o.getAttribute('data-ok')) {
      o.classList.add('good');
      q.setAttribute('data-done', '1');
      Array.prototype.forEach.call(q.querySelectorAll('.opt'), function (b) { b.disabled = true; });
      fb.innerHTML = esc(T('ok', 'נכון!')) + ' ' + ic('check');
      if (!tried) firstTry++;
      done++;
      if (done === qs.length) finish();
    } else {
      o.classList.add('bad');
      o.disabled = true;
      q.setAttribute('data-tried', '1');
      fb.textContent = T('try', 'לא בדיוק — חפשו את התשובה בקטע ונסו שוב.');
    }
  }
  function finish() {
    var sc = document.getElementById('read-score');
    sc.hidden = false;
    sc.innerHTML = '⁦' + firstTry + '/' + qs.length + '⁩ ' + (firstTry === qs.length ? esc(T('all', 'כבר בניסיון הראשון — כל הכבוד!')) + ' ' + ic('party-popper') : esc(T('some', 'בניסיון הראשון. כל השאלות נפתרו!')) + ' ' + ic('sparkles'));
    beacon('quiz_done', ('read-' + slug).slice(0, 40));
    if (window.CDE_WORDMEM) window.CDE_WORDMEM.card(sc.parentNode, 'read', 'he');
  }
})();
