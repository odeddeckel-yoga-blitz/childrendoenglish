/**
 * Vite plugin that makes CSS non-render-blocking.
 *
 * Transforms Vite-injected <link rel="stylesheet"> tags into:
 *   1. <link rel="preload" as="style"> — starts download immediately, non-blocking
 *   2. <link rel="stylesheet" media="print" data-full-css> — downloaded but doesn't block render
 *   3. <script src="/css-loader.js" defer> — switches media to "all" after HTML parsing
 *   4. <noscript><link rel="stylesheet"></noscript> — fallback for no-JS users
 */
export default function asyncCss() {
  let cssLoaderInjected = false;

  return {
    name: 'async-css',
    enforce: 'post',
    transformIndexHtml(html) {
      cssLoaderInjected = false;
      const noscriptLinks = [];

      html = html.replace(
        /<link\s+rel="stylesheet"(\s+crossorigin)?\s+href="(\/assets\/[^"]+\.css)"(\s+crossorigin)?\s*\/?>/g,
        (_match, crossBefore, href, crossAfter) => {
          const crossorigin = crossBefore || crossAfter ? ' crossorigin' : '';

          noscriptLinks.push(`<link rel="stylesheet" href="${href}"${crossorigin}>`);

          const loaderTag = !cssLoaderInjected
            ? '\n    <script src="/css-loader.js" defer></script>'
            : '';
          cssLoaderInjected = true;

          return [
            `<link rel="preload" href="${href}" as="style"${crossorigin}>`,
            `<link rel="stylesheet" href="${href}" media="print" data-full-css${crossorigin}>`,
          ].join('\n    ') + loaderTag;
        },
      );

      if (noscriptLinks.length > 0) {
        const noscriptBlock = `<noscript>${noscriptLinks.join('')}</noscript>`;
        html = html.replace('</body>', `    ${noscriptBlock}\n  </body>`);
      }

      return html;
    },
  };
}
