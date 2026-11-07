/* Recorded word audio for the games and Class Battle: plays the site's own
 * /audio/<word>.mp3 (Piper, whisper-checked; the same files as the app and the
 * unit pages) instead of the device's text-to-speech voice, which differs per
 * phone and is missing on some. Every game word has a file (checked 2026-10-29).
 * The caller's TTS runs only if the file can't load. A blocked autoplay is
 * NOT a load failure — TTS would be blocked the same way. */
(function () {
  var clip = null;
  window.cdeSay = function (text, fallback) {
    try {
      if (clip) clip.pause();
      try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
      var key = String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      clip = new Audio('/audio/' + key + '.mp3');
      var failed = false;
      var fail = function () { if (!failed) { failed = true; if (fallback) fallback(); } };
      clip.addEventListener('error', fail, { once: true });
      var p = clip.play();
      if (p && p.catch) p.catch(function (e) { if (!e || e.name !== 'NotAllowedError') fail(); });
    } catch (e) { if (fallback) fallback(); }
  };
  /* cb once the word (clip or TTS) has finished, or after capMs; at once if nothing is playing. A round must not
   * start while the last word is still playing (kit §8g; 11-07 speech-sync: on a slow line Spelling Forge's reveal
   * word ran ~330 ms into the next round). */
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
