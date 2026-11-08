/* Recorded word audio for the games and Class Battle: plays the site's own
 * /audio/<word>.mp3 (Piper, whisper-checked; the same files as the app and the
 * unit pages) instead of the device's text-to-speech voice, which differs per
 * phone and is missing on some. Every game word has a file (checked 2026-10-29).
 * The caller's TTS runs only if the file can't load. A blocked autoplay is
 * NOT a load failure — TTS would be blocked the same way. */
(function () {
  var clip = null;
  var keyOf = function (text) { return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'); };
  /* Words loaded ahead (cdePreload): on a slow line a word fetched only when it is due started up to ~1 s after the
   * word before it (Rhyme Time's pair after an answer, cold speech-sync 11-08). The same element is played later, so it
   * works with the cache off too. */
  var pre = {}, preOrder = [];
  window.cdePreload = function (words) {
    try {
      (words || []).forEach(function (w) {
        var key = keyOf(w);
        if (!key || pre[key]) return;
        var a = new Audio('/audio/' + key + '.mp3'); a.preload = 'auto';
        pre[key] = a; preOrder.push(key);
        if (preOrder.length > 40) delete pre[preOrder.shift()];
      });
    } catch (e) {}
  };
  /* src (optional): play this file instead of /audio/<word>.mp3 (True or False's sentence clips). */
  window.cdeSay = function (text, fallback, src) {
    try {
      if (clip) clip.pause();
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
      var key = keyOf(text), ready = !src && pre[key];
      if (ready && !ready.error) { clip = ready; try { clip.currentTime = 0; } catch (e) {} }
      else clip = new Audio(src || '/audio/' + key + '.mp3');
      var failed = false;
      var fail = function () { if (!failed) { failed = true; if (fallback) fallback(); } };
      /* a preloaded element is played again later: drop the last word's handler, or its fallback would speak it */
      if (clip.__cdeFail) clip.removeEventListener('error', clip.__cdeFail);
      clip.__cdeFail = fail;
      clip.addEventListener('error', fail, { once: true });
      var p = clip.play();
      /* NotAllowedError = blocked autoplay (TTS would be blocked too); AbortError = this clip was cut by the next
       * cdeSay — neither is a load failure, and a fallback there spoke the device voice over the new word (11-07). */
      if (p && p.catch) p.catch(function (e) { if (!e || (e.name !== 'NotAllowedError' && e.name !== 'AbortError')) fail(); });
    } catch (e) { if (fallback) fallback(); }
  };
  /* cb once the word (clip or TTS) has finished, or after capMs; at once if nothing is playing. A round must not
   * start while the last word is still playing (kit §8g; 11-07 speech-sync: on a slow line Spelling Forge's reveal
   * word ran ~330 ms into the next round). */
  /* Stop the current word now (a screen the child left must not keep talking). */
  window.cdeHush = function () {
    try { if (clip) clip.pause(); } catch (e) {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  };
  window.cdeSayDone = function (capMs, cb) {
    var tts = function () { try { return !!(window.speechSynthesis && window.speechSynthesis.speaking); } catch (e) { return false; } };
    var playing = clip && !clip.ended && !clip.error && (!clip.paused || clip.readyState < 3);
    if (!playing && !tts()) return cb();
    var fired = false, poll = null, t = null;
    var done = function () { if (fired) return; fired = true; clearTimeout(t); clearInterval(poll); cb(); };
    t = setTimeout(done, capMs);
    poll = setInterval(function () { if ((!clip || clip.ended || clip.error || (clip.paused && clip.readyState >= 3)) && !tts()) done(); }, 80);
  };
})();
