/* RC11 reading pages (/band-1/reading/<slug>/). CSP-safe external file.
 * Tap a word → its Hebrew in the bar under the text. ▶ plays the text sentence by
 * sentence (the sentence being read is highlighted); 🔊 plays one question.
 * 🐢 = 0.75× playback, remembered on this device (same key as the word pages).
 * Questions: a wrong pick stays marked and the child tries again; the score counts
 * first tries. Beacons: quiz_start / quiz_done @ read-<slug> (cookieless aggregate,
 * automation and owner devices excluded, as everywhere else). */
(function () {
  'use strict';
  var root = document.querySelector('[data-reading]');
  if (!root) return;
  var slug = root.getAttribute('data-reading');

  function excluded() {
    try { return navigator.webdriver || localStorage.getItem('cde_internal') === '1'; } catch (e) { return false; }
  }
  function beacon(e, i) {
    try {
      if (excluded() || !navigator.sendBeacon || !/^[a-z0-9@_-]{1,40}$/.test(i)) return;
      navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: e, i: i }], l: 'he' }));
    } catch (err) { /* never break the page */ }
  }
  var begun = false;
  function begin() { if (!begun) { begun = true; beacon('quiz_start', ('read-' + slug).slice(0, 40)); } }

  // Keep English runs left-to-right inside the Hebrew gloss bar.
  function isolate(s) { return s.replace(/[A-Za-z][A-Za-z' ]*[A-Za-z]|[A-Za-z]/g, function (m) { return '⁦' + m + '⁩'; }); }

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
    if (playAllBtn) playAllBtn.textContent = '▶ הקשיבו לכל הקטע';
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
      return;
    }
    if (ev.target.closest('[data-play-all]')) {
      begin();
      if (queue.length || (player && !player.paused)) { stop(); return; }
      queue = sentences.slice();
      playAllBtn.textContent = '⏹ עצירה';
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
      fb.textContent = 'נכון! ✓';
      if (!tried) firstTry++;
      done++;
      if (done === qs.length) finish();
    } else {
      o.classList.add('bad');
      o.disabled = true;
      q.setAttribute('data-tried', '1');
      fb.textContent = 'לא בדיוק — חפשו את התשובה בקטע ונסו שוב.';
    }
  }
  function finish() {
    var sc = document.getElementById('read-score');
    sc.hidden = false;
    sc.textContent = '⁦' + firstTry + '/' + qs.length + '⁩ ' + (firstTry === qs.length ? 'כבר בניסיון הראשון — כל הכבוד! 🎉' : 'בניסיון הראשון. כל השאלות נפתרו! 👏');
    beacon('quiz_done', ('read-' + slug).slice(0, 40));
  }
})();
