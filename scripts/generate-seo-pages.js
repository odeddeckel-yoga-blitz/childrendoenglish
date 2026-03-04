import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Dynamic import of the data module (pure ESM, no JSX)
const { WORDS, CATEGORIES, getWordsByCategory } = await import(
  join(ROOT, 'src', 'data', 'words.js')
);

const SITE = 'https://childrendoenglish.com';

const CATEGORY_NAMES = {
  animals: 'Animals',
  food: 'Food & Drinks',
  home: 'Home & Furniture',
  transport: 'Transport & Vehicles',
  nature: 'Nature',
  colors: 'Colors',
  numbers: 'Numbers',
  body: 'Body Parts',
  clothing: 'Clothing',
  school: 'School',
  sports: 'Sports & Activities',
  feelings: 'Feelings & Emotions',
  everyday: 'Everyday Objects',
  toys: 'Toys & Games',
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCategoryPage(slug, displayName, words) {
  const url = `${SITE}/vocabulary/${slug}/`;
  const wordCount = words.length;
  const title = `${displayName} - English Vocabulary for Kids | Children Do English`;
  const description = `Learn ${wordCount} ${displayName.toLowerCase()} words in English with definitions, example sentences, phonetics, and Hebrew translations. Free for kids ages 6-12.`;

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Vocabulary', item: `${SITE}/vocabulary/` },
      { '@type': 'ListItem', position: 3, name: displayName, item: url },
    ],
  });

  const definedTerms = words.map((w) => ({
    '@type': 'DefinedTerm',
    name: w.word,
    description: w.definition,
    inDefinedTermSet: `${SITE}/vocabulary/${slug}/`,
  }));
  const definedTermSetSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: `${displayName} - English Vocabulary for Kids`,
    description,
    url,
    hasDefinedTerm: definedTerms,
  });

  const wordCards = words
    .map(
      (w) => `
      <div class="card">
        <div class="card-word">${escapeHtml(w.word)}</div>
        <div class="card-phonetic">${escapeHtml(w.phonetic)}</div>
        <div class="card-pos">${escapeHtml(w.partOfSpeech)}</div>
        <div class="card-def">${escapeHtml(w.definition)}</div>
        <div class="card-ex">&ldquo;${escapeHtml(w.exampleSentence)}&rdquo;</div>
        <div class="card-he">${escapeHtml(w.hebrewTranslation)}</div>
      </div>`
    )
    .join('\n');

  const categoryLinks = CATEGORIES.filter((c) => c !== slug)
    .map(
      (c) =>
        `<a href="/vocabulary/${c}/">${escapeHtml(CATEGORY_NAMES[c] || c)}</a>`
    )
    .join('\n        ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="en" href="${url}" />
  <link rel="alternate" hreflang="x-default" href="${url}" />
  <link rel="icon" type="image/png" href="/favicon.png" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />

  <!-- Structured Data -->
  <script type="application/ld+json">${breadcrumbSchema}</script>
  <script type="application/ld+json">${definedTermSetSchema}</script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.6; }
    .header { background: #2563eb; color: #fff; padding: 2rem 1rem; text-align: center; }
    .header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .header p { opacity: 0.9; font-size: 0.95rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #64748b; max-width: 960px; margin: 0 auto; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 1rem 2rem; }
    .intro { margin-bottom: 1.5rem; color: #475569; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .card-word { font-size: 1.35rem; font-weight: 700; color: #1e293b; }
    .card-phonetic { font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.25rem; }
    .card-pos { font-size: 0.75rem; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .card-def { margin-bottom: 0.4rem; }
    .card-ex { font-style: italic; color: #64748b; font-size: 0.9rem; margin-bottom: 0.4rem; }
    .card-he { color: #475569; direction: rtl; font-size: 0.95rem; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 1rem; }
    .cta a:hover { background: #1d4ed8; }
    .categories { margin-top: 2rem; }
    .categories h2 { font-size: 1.1rem; margin-bottom: 0.75rem; color: #334155; }
    .cat-links { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .cat-links a { background: #fff; padding: 0.4rem 0.85rem; border-radius: 2rem; font-size: 0.85rem; color: #2563eb; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    .cat-links a:hover { background: #2563eb; color: #fff; }
    .footer { text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(displayName)} - English Vocabulary for Kids</h1>
    <p>${wordCount} words with definitions, sentences, phonetics &amp; Hebrew translations</p>
  </div>

  <div class="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/vocabulary/">Vocabulary</a> &rsaquo; ${escapeHtml(displayName)}
  </div>

  <div class="container">
    <p class="intro">${escapeHtml(description)}</p>

    <div class="grid">
      ${wordCards}
    </div>

    <div class="cta">
      <a href="/">Practice These Words in the App &rarr;</a>
    </div>

    <div class="categories">
      <h2>Explore More Categories</h2>
      <div class="cat-links">
        ${categoryLinks}
      </div>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Children Do English
  </div>
</body>
</html>`;
}

// --- Generate pages ---

const distDir = join(ROOT, 'dist');
let generated = 0;

for (const slug of CATEGORIES) {
  const displayName = CATEGORY_NAMES[slug] || slug;
  const words = getWordsByCategory(slug);
  if (words.length === 0) {
    console.warn(`  skip: ${slug} (no words)`);
    continue;
  }

  const outDir = join(distDir, 'vocabulary', slug);
  mkdirSync(outDir, { recursive: true });

  const html = buildCategoryPage(slug, displayName, words);
  writeFileSync(join(outDir, 'index.html'), html, 'utf-8');
  generated++;
  console.log(`  ✓ /vocabulary/${slug}/ (${words.length} words)`);
}

// --- Generate vocabulary index redirect ---
// /vocabulary/ itself redirects to the home page vocabulary section
mkdirSync(join(distDir, 'vocabulary'), { recursive: true });

// --- Overwrite sitemap.xml ---

const today = new Date().toISOString().split('T')[0];

const spaRoutes = [
  { path: '/', priority: '1.0', freq: 'weekly' },
  { path: '/play', priority: '0.8', freq: 'monthly' },
  { path: '/learn', priority: '0.8', freq: 'monthly' },
  { path: '/flashcards', priority: '0.7', freq: 'monthly' },
  { path: '/badges', priority: '0.5', freq: 'monthly' },
  { path: '/progress', priority: '0.6', freq: 'monthly' },
  { path: '/path', priority: '0.7', freq: 'monthly' },
  { path: '/parent', priority: '0.6', freq: 'monthly' },
  { path: '/privacy', priority: '0.3', freq: 'yearly' },
  { path: '/players', priority: '0.5', freq: 'monthly' },
  { path: '/my-words', priority: '0.6', freq: 'monthly' },
];

const spaEntries = spaRoutes
  .map(
    (r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.freq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n');

const vocabEntries = CATEGORIES.map(
  (slug) => `  <url>
    <loc>${SITE}/vocabulary/${slug}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${spaEntries}
${vocabEntries}
</urlset>
`;

writeFileSync(join(distDir, 'sitemap.xml'), sitemap, 'utf-8');

console.log(`\nGenerated ${generated} category pages`);
console.log(`Sitemap: ${spaRoutes.length + CATEGORIES.length} URLs`);
