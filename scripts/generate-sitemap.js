/**
 * generate-sitemap.js
 *
 * Scans dist/ for all index.html files and generates a complete sitemap.xml.
 * Run AFTER vite build + generate-seo-pages.js so all static pages exist.
 */

import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://childrendoenglish.com';
const today = new Date().toISOString().split('T')[0];

function findHtmlFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      findHtmlFiles(full, results);
    } else if (entry === 'index.html') {
      results.push(full);
    }
  }
  return results;
}

function getPriority(urlPath) {
  if (urlPath === '/') return '1.0';
  if (urlPath === '/he/') return '0.9';
  if (urlPath === '/vocabulary/') return '0.8';
  if (urlPath === '/about/') return '0.5';
  if (urlPath === '/printable-flashcards/') return '0.7';
  if (urlPath.startsWith('/printable-flashcards/')) return '0.6';
  if (urlPath.startsWith('/guides/')) return '0.7';
  if (/^\/vocabulary\/[^/]+\/$/.test(urlPath)) return '0.7';
  if (urlPath.startsWith('/vocabulary/')) return '0.5';
  return '0.5';
}

function getChangefreq(urlPath) {
  if (urlPath === '/') return 'weekly';
  if (urlPath === '/vocabulary/') return 'weekly';
  if (urlPath === '/about/') return 'yearly';
  return 'monthly';
}

const htmlFiles = findHtmlFiles(DIST);

const urlPaths = htmlFiles
  .map((f) => {
    const rel = relative(DIST, dirname(f));
    return rel === '' ? '/' : `/${rel.replace(/\\/g, '/')}/`;
  })
  .sort();

const urlEntries = urlPaths
  .map(
    (p) => `  <url>
    <loc>${SITE}${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${getChangefreq(p)}</changefreq>
    <priority>${getPriority(p)}</priority>
  </url>`
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf-8');
console.log(`Sitemap: ${urlPaths.length} URLs written to dist/sitemap.xml`);
