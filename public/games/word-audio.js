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
})();
