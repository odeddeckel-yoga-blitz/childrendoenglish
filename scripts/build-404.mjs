// dist/404.html: Vercel serves it (status 404) for any path that matches no file or rewrite. It used to be bare
// centred text with no nav, English only (page triage 11-08). Now: the shared site header and three ways back
// (home, games, words) in the page's language.
//
// One file serves every path, so the language comes from the URL prefix in the browser: public/not-found.js (in <head>,
// before paint) marks /he/ or /es/ on <html> and the CSS shows that block (CSP: no inline scripts). Without JS the English block shows. No beacon: a 404 is not a page
// class the counters should see.

export const NOT_FOUND_COPY = {
  en: {
    dir: 'ltr', title: 'Page not found', lead: 'This page doesn’t exist. It may have moved.',
    links: [['/', 'Home'], ['/games/', 'English games'], ['/vocabulary/', 'All vocabulary words']],
  },
  he: {
    dir: 'rtl', title: 'הדף לא נמצא', lead: 'הדף הזה לא קיים. ייתכן שהוא עבר למקום אחר.',
    links: [['/he/', 'לדף הבית'], ['/he/english-games/', 'משחקים באנגלית'], ['/he/english-words/', 'מילים באנגלית לפי נושא']],
  },
  es: {
    dir: 'ltr', title: 'Página no encontrada', lead: 'Esta página no existe. Puede que se haya movido.',
    links: [['/es/', 'Inicio'], ['/games/', 'Juegos en inglés'], ['/vocabulary/', 'Vocabulario en inglés']],
  },
};

const CSS = `body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#eff6ff;color:#1e293b}
  .nf{max-width:560px;margin:0 auto;padding:3rem 1rem 4rem;text-align:center}
  .nf .nf-code{font-size:3.5rem;font-weight:800;color:#1d4ed8;margin:0;line-height:1}
  .nf h1{font-size:1.5rem;margin:.6rem 0 .4rem}
  .nf p{color:#334155;margin:0 0 1.6rem;line-height:1.5}
  .nf ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.6rem;align-items:center}
  .nf a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:240px;box-sizing:border-box;padding:.6rem 1.2rem;border-radius:999px;background:#fff;color:#1d4ed8;font-weight:700;text-decoration:none;box-shadow:0 1px 3px rgba(30,64,175,.12)}
  .nf li:first-child a{background:#1d4ed8;color:#fff}
  .nf a:hover{text-decoration:underline}
  .nf-lang:not([data-lang="en"]){display:none}
  html[data-nf] .nf-lang[data-lang="en"]{display:none}
  html[data-nf="he"] .nf-lang[data-lang="he"],html[data-nf="es"] .nf-lang[data-lang="es"]{display:block}`;

// siteHeader(lang) is the generator's shared header (scripts/generate-seo-pages.js), passed in so it stays one copy.
export function build404Html(siteHeader) {
  const block = (lang) => {
    const c = NOT_FOUND_COPY[lang];
    return `<div class="nf-lang" data-lang="${lang}" lang="${lang}" dir="${c.dir}">${siteHeader(lang)}<main class="nf">
  <p class="nf-code">404</p>
  <h1>${c.title}</h1>
  <p>${c.lead}</p>
  <ul>${c.links.map(([href, text]) => `<li><a href="${href}">${text}</a></li>`).join('')}</ul>
</main></div>`;
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex">
  <title>Page not found | Children Do English</title>
  <link rel="icon" type="image/png" href="/favicon.png" />
  <style>${CSS}</style>
  <script src="/not-found.js"></script>
</head>
<body>
${['en', 'he', 'es'].map(block).join('\n')}
</body>
</html>
`;
}
