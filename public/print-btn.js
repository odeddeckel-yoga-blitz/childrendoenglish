/* Print buttons on the static printable pages. External file because the CSP
 * (script-src 'self') blocks inline onclick handlers — the inline
 * onclick="window.print()" these pages shipped with never ran.
 * Card images below the first rows are loading="lazy"; a print must not come
 * out with blank cards, so the button loads every image first (capped wait). */
(function () {
  function eagerAll() {
    var imgs = Array.prototype.slice.call(document.querySelectorAll('img[loading="lazy"]'));
    imgs.forEach(function (img) { img.loading = 'eager'; });
    return imgs;
  }
  document.addEventListener('click', function (ev) {
    if (!(ev.target.closest && ev.target.closest('[data-print]'))) return;
    var pending = eagerAll().filter(function (img) { return !img.complete; });
    if (!pending.length) { window.print(); return; }
    var done = false, left = pending.length;
    var go = function () { if (!done) { done = true; window.print(); } };
    pending.forEach(function (img) {
      var one = function () { if (--left === 0) go(); };
      img.addEventListener('load', one, { once: true });
      img.addEventListener('error', one, { once: true });
    });
    setTimeout(go, 4000);
  });
  // Ctrl/Cmd+P skips the button: start the loads anyway (browsers also fetch
  // lazy images for print, this just gets them going sooner).
  window.addEventListener('beforeprint', eagerAll);
})();
