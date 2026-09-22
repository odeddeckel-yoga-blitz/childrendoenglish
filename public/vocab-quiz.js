/* Static vocabulary-page widget: word audio + one-question mini-quiz.
 * CSP-safe (external file, no inline JS). Answers feed the same cookieless
 * cde_learn aggregate as the app (webdriver + owner devices excluded).
 * The quiz turns a dictionary lookup into a play moment: hear the word,
 * tap the right picture, get the "play more" door to the app. */
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
      navigator.sendBeacon('/api/land', JSON.stringify({ batch: [{ e: e, i: i }] }));
    } catch (err) { /* never break the page */ }
  }

  // 🔊 buttons — play the pre-rendered word audio
  var current = null;
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-say]');
    if (!btn) return;
    try {
      if (current) current.pause();
      current = new Audio(btn.getAttribute('data-say'));
      current.play().catch(function () {});
      btn.classList.add('say-active');
      current.onended = function () { btn.classList.remove('say-active'); };
    } catch (e) { /* ignore */ }
  });

  // Mini-quiz
  var quiz = document.querySelector('.mini-quiz');
  if (!quiz) return;
  var answer = quiz.getAttribute('data-answer');
  var solved = false;
  quiz.addEventListener('click', function (ev) {
    var opt = ev.target.closest('.mq-opt');
    if (!opt || solved) return;
    var k = opt.getAttribute('data-k');
    if (k === answer) {
      solved = true;
      opt.classList.add('mq-right');
      quiz.querySelectorAll('.mq-opt').forEach(function (b) { if (b !== opt) b.classList.add('mq-dim'); });
      var result = quiz.querySelector('.mq-result');
      if (result) result.hidden = false;
      beacon('ans_ok', answer);
    } else {
      opt.classList.add('mq-wrong');
      setTimeout(function () { opt.classList.remove('mq-wrong'); }, 600);
      beacon('ans_no', answer);
    }
  });
})();
