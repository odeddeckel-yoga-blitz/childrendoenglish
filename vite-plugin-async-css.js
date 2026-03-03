/**
 * Vite plugin: make CSS non-render-blocking.
 *
 * Transforms Vite's injected <link rel="stylesheet"> into:
 *   1. <link rel="preload" as="style">      — starts download immediately, non-blocking
 *   2. <link rel="stylesheet" media="print"> — downloaded but doesn't block screen render
 *   3. <script src="/css-loader.js" defer>   — switches media to "all" after HTML parsing
 *   4. <noscript><link rel="stylesheet">     — fallback for no-JS
 *
 * The static shell paints instantly at TTFB. CSS applies ~200ms later
 * when the deferred script runs (by then the CSS file is already cached).
 */
export default function asyncCss() {
  return {
    name: 'async-css',
    enforce: 'post',
    transformIndexHtml(html) {
      // Match Vite-injected CSS link: <link rel="stylesheet" crossorigin href="/assets/index-HASH.css">
      const cssLinkRe = /<link\s+rel="stylesheet"\s+crossorigin\s+href="(\/assets\/[^"]+\.css)">/;
      const match = html.match(cssLinkRe);
      if (!match) return html;

      const href = match[1];
      const original = match[0];

      const replacement = [
        `<link rel="preload" href="${href}" as="style" crossorigin>`,
        `<link rel="stylesheet" href="${href}" media="print" data-full-css crossorigin>`,
        `<script src="/css-loader.js" defer></script>`,
      ].join('\n    ');

      const noscript = `<noscript><link rel="stylesheet" href="${href}" crossorigin></noscript>`;

      html = html.replace(original, replacement);
      html = html.replace('</body>', `    ${noscript}\n  </body>`);

      return html;
    },
  };
}
