// 404 page language (scripts/build-404.mjs): one dist/404.html serves every missing path, so the /he/ or /es/
// prefix picks the block. Runs in <head> before paint: CSS on html[data-nf] shows that block (no English flash).
(function () {
  var m = /^\/(he|es)(\/|$)/.exec(location.pathname);
  if (!m) return;
  var html = document.documentElement;
  html.setAttribute('data-nf', m[1]);
  html.lang = m[1];
  html.dir = m[1] === 'he' ? 'rtl' : 'ltr';
  document.title = (m[1] === 'he' ? 'הדף לא נמצא' : 'Página no encontrada') + ' | Children Do English';
})();
