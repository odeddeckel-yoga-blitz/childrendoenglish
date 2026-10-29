/* Textbook-unit page practice (/units/<book>/unit-<n>/). CSP-safe external file.
 * Two modes that work for ANY word, photo or not:
 *   hear  — play the English word, pick its Hebrew meaning (options built at
 *           page-build time with the app's collides() rule, so no two share a meaning)
 *   spell — play the English word, type it
 * Plus 🔊 buttons in the word table (the print button is print-btn.js).
 * Answers feed the same cookieless cde_learn aggregate as the app (ans_ok/ans_no
 * @ CDE word id when the word has one); quiz_start/quiz_done @ unit-hear|unit-spell.
 * Automation and owner devices are excluded, as everywhere else. */
(function () {
  'use strict';

  function excluded() {
    try {
      if (navigator.webdriver) return true;
      if (localStorage.getItem('cde_internal') === '1') return true;
    } catch (e) { /* storage unavailable — treat as a real visitor */ }
    return false;
  }
  function beacon(e, i) {
    try {
      if (excluded() || !navigator.sendBeacon || !/^[a-z0-9@_-]{1,40}$/.test(i)) return;
      navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: e, i: i }], l: 'he' }));
    } catch (err) { /* never break the page */ }
  }

  var player = null;
  function say(src) {
    try {
      if (player) player.pause();
      player = new Audio(src);
      player.play().catch(function () { /* autoplay blocked — the 🔊 button is right there */ });
    } catch (e) { /* no audio support */ }
  }

  document.addEventListener('click', function (ev) {
    var s = ev.target.closest('[data-say]');
    if (s) say(s.getAttribute('data-say'));
    // [data-print] is print-btn.js's (it loads the lazy card images first).
  });

  var dataEl = document.getElementById('unit-data');
  var box = document.getElementById('practice');
  var live = document.getElementById('practice-live');
  if (!dataEl || !box) return;
  var items;
  try { items = JSON.parse(dataEl.textContent); } catch (e) { return; }
  if (!items || !items.length) return;

  function shuffle(a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function announce(msg) { if (live) live.textContent = msg; }

  // quiz_start fires on the round's first answer, not on page load (every
  // visitor sees round 1 rendered), and audio waits for the first tap.
  var mode = 'hear', order = [], pos = 0, score = 0, tries = 0, begun = false, interacted = false;

  function start(m) {
    mode = m; order = shuffle(items); pos = 0; score = 0; begun = false;
    var btns = document.querySelectorAll('.mode');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-mode') === m;
      btns[i].classList.toggle('on', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    render();
  }

  function finish() {
    beacon('quiz_done', 'unit-' + mode);
    box.textContent = '';
    box.appendChild(el('p', { class: 'feedback' }, 'סיימתם! ' + score + ' מתוך ' + order.length + ' ⭐'));
    var again = el('button', { type: 'button', class: 'next' }, 'עוד סיבוב');
    again.addEventListener('click', function () { start(mode); });
    box.appendChild(again);
    announce('סיימתם: ' + score + ' מתוך ' + order.length);
    again.focus();
  }

  function next() { pos += 1; if (pos >= order.length) finish(); else render(); }

  function record(it, ok) {
    if (!begun) { begun = true; beacon('quiz_start', 'unit-' + mode); }
    if (ok) score += 1;
    if (it.id) beacon(ok ? 'ans_ok' : 'ans_no', it.id);
  }

  function render() {
    var it = order[pos];
    tries = 0;
    box.textContent = '';
    box.appendChild(el('p', { class: 'progress' }, (pos + 1) + ' / ' + order.length));
    var big = el('button', { type: 'button', class: 'big-say', 'aria-label': 'השמעת המילה' }, '🔊');
    big.addEventListener('click', function () { say(it.audio); });
    box.appendChild(big);
    var fb = el('p', { class: 'feedback', role: 'status' });

    if (mode === 'hear') {
      var grid = el('div', { class: 'opts' });
      it.opts.forEach(function (o, i) {
        var b = el('button', { type: 'button', class: 'opt' }, o);
        b.addEventListener('click', function () {
          if (box.getAttribute('data-done') === '1') return;
          box.setAttribute('data-done', '1');
          var ok = i === it.ans;
          record(it, ok);
          b.classList.add(ok ? 'ok' : 'no');
          if (!ok) grid.children[it.ans].classList.add('ok');
          fb.textContent = ok ? 'נכון! ' + it.en + ' = ' + it.opts[it.ans] : it.en + ' = ' + it.opts[it.ans];
          announce(fb.textContent);
          var n = el('button', { type: 'button', class: 'next' }, pos + 1 < order.length ? 'הבא ←' : 'סיום');
          n.addEventListener('click', function () { box.removeAttribute('data-done'); next(); });
          box.appendChild(n);
          n.focus();
        });
        grid.appendChild(b);
      });
      box.appendChild(grid);
      box.appendChild(fb);
    } else {
      var form = el('form', { class: 'spell', autocomplete: 'off' });
      var label = el('label', { for: 'spell-in', class: 'sr' }, 'כתבו את המילה ששמעתם');
      var input = el('input', { id: 'spell-in', type: 'text', inputmode: 'latin', autocapitalize: 'off', spellcheck: 'false', lang: 'en' });
      var go = el('button', { type: 'submit' }, 'בדיקה');
      form.appendChild(label); form.appendChild(input); form.appendChild(el('br', {})); form.appendChild(go);
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        // Letters only: phrases like "Say it again, please" shouldn't fail on a comma.
        var letters = function (s) { return s.toLowerCase().replace(/[^a-z]+/g, ' ').trim(); };
        var guess = letters(input.value);
        if (!guess) return;
        var ok = guess === letters(it.en);
        tries += 1;
        if (!ok && tries < 2) { fb.textContent = 'כמעט — נסו שוב (הקשיבו עוד פעם)'; announce(fb.textContent); input.select(); return; }
        record(it, ok);
        input.disabled = true; go.disabled = true;
        fb.textContent = ok ? 'נכון! ' + it.en : 'המילה היא: ' + it.en;
        announce(fb.textContent);
        var n = el('button', { type: 'button', class: 'next' }, pos + 1 < order.length ? 'הבא ←' : 'סיום');
        n.addEventListener('click', next);
        box.appendChild(n);
        n.focus();
      });
      box.appendChild(form);
      box.appendChild(fb);
      if (interacted) input.focus({ preventScroll: true });
    }
    if (interacted) say(it.audio);
  }

  box.addEventListener('click', function () { interacted = true; }, true);
  var modeBtns = document.querySelectorAll('.mode');
  for (var i = 0; i < modeBtns.length; i++) {
    modeBtns[i].addEventListener('click', function () { interacted = true; start(this.getAttribute('data-mode')); });
  }
  start('hear');
})();
