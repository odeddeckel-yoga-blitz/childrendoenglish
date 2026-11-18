/* Chant cards pilot (/chants/<slug>/). CSP-safe external file.
 * Start plays the lines one after another (one Piper clip per line). While a line plays it gets .on and
 * --dur = the clip's real length, so the CSS lights its 4 beat groups evenly across the clip and pulses the beat dot.
 * One beat of rest between lines keeps the rhythm. Slower = 0.8x playback (pitch kept), remembered on this device. */
(function () {
  'use strict';
  var root = document.querySelector('[data-chant]');
  if (!root) return;
  var lines = Array.prototype.slice.call(root.querySelectorAll('.cl[data-src]'));
  var playBtn = root.querySelector('[data-chant-play]'), slowBtn = root.querySelector('[data-chant-slow]');
  var KEY = 'cde_chant_slow';
  function slowOn() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  if (slowBtn) slowBtn.setAttribute('aria-pressed', String(slowOn()));
  function ic(n) { return '<svg class="ic" aria-hidden="true" focusable="false" style="width:1.15em;height:1.15em;vertical-align:-.2em;flex:none"><use href="/icons.svg#i-' + n + '"/></svg>'; }
  var player = null, timer = null, running = false;

  function mark(el) { lines.forEach(function (l) { l.classList.toggle('on', l === el); }); }
  function stop() {
    running = false;
    clearTimeout(timer);
    if (player) { player.onended = null; player.onplaying = null; player.pause(); }
    mark(null);
    if (playBtn) playBtn.innerHTML = ic('play') + ' Start';
  }
  function playLine(i) {
    if (!running) return;
    if (i >= lines.length) { stop(); return; }
    var el = lines[i], rate = slowOn() ? 0.8 : 1;
    try {
      player = new Audio(el.getAttribute('data-src'));
      player.playbackRate = rate; player.preservesPitch = true;
      player.onplaying = function () {
        var ms = isFinite(player.duration) && player.duration > 0 ? (player.duration * 1000) / rate : 3000;
        // the clip has ~280 ms of silence at each end: light the beats over the spoken part only
        el.style.setProperty('--dur', Math.max(800, Math.round(ms - 560 / rate)) + 'ms');
        mark(null);
        void el.offsetWidth;   // restart the CSS animations for this line
        mark(el);
      };
      player.onended = function () {
        var n = Number(getComputedStyle(el).getPropertyValue('--n')) || 4;
        var beat = (parseFloat(el.style.getPropertyValue('--dur')) || 3000) / n;
        timer = setTimeout(function () { playLine(i + 1); }, Math.round(beat));
      };
      player.play().catch(function () { stop(); });
    } catch (e) { stop(); }
  }
  root.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-chant-play]')) {
      if (running) { stop(); return; }
      running = true;
      playBtn.innerHTML = ic('x') + ' Stop';
      playLine(0);
      return;
    }
    if (ev.target.closest('[data-chant-slow]')) {
      var on = !slowOn();
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* storage blocked */ }
      slowBtn.setAttribute('aria-pressed', String(on));
    }
  });
})();
