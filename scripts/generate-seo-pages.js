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
  clothing: 'Clothing',
  school: 'School',
  sports: 'Sports & Activities',
  feelings: 'Feelings & Emotions',
  everyday: 'Everyday Objects',
  toys: 'Toys & Games',
  actions: 'Actions & Verbs',
  body: 'Body Parts',
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
        <img src="/images/${w.id}.webp" alt="${escapeHtml(w.word)}" class="card-img" loading="lazy" width="128" height="128" />
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
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE}/og/${slug}.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE}/og/${slug}.png" />

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
    .card { background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; }
    .card-img { width: 128px; height: 128px; border-radius: 0.75rem; object-fit: cover; margin: 0 auto 0.75rem; display: block; }
    .card-word { font-size: 1.35rem; font-weight: 700; color: #1e293b; }
    .card-phonetic { font-size: 0.85rem; color: #94a3b8; margin-bottom: 0.25rem; }
    .card-pos { font-size: 0.75rem; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .card-def { margin-bottom: 0.4rem; }
    .card-ex { font-style: italic; color: #64748b; font-size: 0.9rem; margin-bottom: 0.4rem; }
    .card-he { color: #475569; direction: rtl; font-size: 0.95rem; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 1rem; }
    .cta a:hover { background: #1d4ed8; }
    .cta-sub { margin-top: 0.5rem; font-size: 0.8rem; color: #64748b; }
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
      <p class="cta-sub">Free &middot; No ads &middot; Works offline &middot; No account needed</p>
    </div>

    <div class="categories">
      <h2>Explore More Categories</h2>
      <div class="cat-links">
        ${categoryLinks}
      </div>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Children Do English &middot; <a href="/about/" style="color:#94a3b8">About</a> &middot; <a href="/privacy" style="color:#94a3b8">Privacy</a>
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

// --- Generate vocabulary index page ---
mkdirSync(join(distDir, 'vocabulary'), { recursive: true });

const vocabIndexUrl = `${SITE}/vocabulary/`;
const vocabIndexTitle = 'English Vocabulary for Kids - All Categories | Children Do English';
const vocabIndexDesc = `Browse ${WORDS.length} English vocabulary words across ${CATEGORIES.length} categories. Free definitions, example sentences, phonetics, and Hebrew translations for kids ages 6-12.`;

const vocabIndexBreadcrumb = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: 'Vocabulary', item: vocabIndexUrl },
  ],
});

const vocabIndexItemList = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'English Vocabulary Categories for Kids',
  description: vocabIndexDesc,
  numberOfItems: CATEGORIES.length,
  itemListElement: CATEGORIES.map((slug, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: CATEGORY_NAMES[slug] || slug,
    url: `${SITE}/vocabulary/${slug}/`,
  })),
});

const categoryCards = CATEGORIES.map((slug) => {
  const name = CATEGORY_NAMES[slug] || slug;
  const words = getWordsByCategory(slug);
  const previewWords = words.slice(0, 4);
  const sampleWords = words.slice(0, 5).map((w) => w.word).join(', ');
  const previewImgs = previewWords
    .map((w) => `<img src="/images/${w.id}.webp" alt="${escapeHtml(w.word)}" class="cat-preview-img" loading="lazy" width="48" height="48" />`)
    .join('\n            ');
  return `
      <a href="/vocabulary/${slug}/" class="cat-card">
        <div class="cat-preview">${previewImgs}</div>
        <h2>${escapeHtml(name)}</h2>
        <p class="word-count">${words.length} words</p>
        <p class="sample">${escapeHtml(sampleWords)}${words.length > 5 ? '...' : ''}</p>
      </a>`;
}).join('\n');

const vocabIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(vocabIndexTitle)}</title>
  <meta name="description" content="${escapeHtml(vocabIndexDesc)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${vocabIndexUrl}" />
  <link rel="alternate" hreflang="en" href="${vocabIndexUrl}" />
  <link rel="alternate" hreflang="x-default" href="${vocabIndexUrl}" />
  <link rel="icon" type="image/png" href="/favicon.png" />

  <!-- Open Graph -->
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${vocabIndexUrl}" />
  <meta property="og:title" content="${escapeHtml(vocabIndexTitle)}" />
  <meta property="og:description" content="${escapeHtml(vocabIndexDesc)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(vocabIndexTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(vocabIndexDesc)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />

  <!-- Structured Data -->
  <script type="application/ld+json">${vocabIndexBreadcrumb}</script>
  <script type="application/ld+json">${vocabIndexItemList}</script>

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
    .cat-card { display: block; background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none; color: inherit; transition: box-shadow 0.2s, transform 0.2s; }
    .cat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .cat-preview { display: flex; gap: 0.4rem; margin-bottom: 0.75rem; }
    .cat-preview-img { width: 48px; height: 48px; border-radius: 0.5rem; object-fit: cover; }
    .cat-card h2 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-bottom: 0.25rem; }
    .cat-card .word-count { font-size: 0.8rem; color: #2563eb; font-weight: 600; margin-bottom: 0.5rem; }
    .cat-card .sample { font-size: 0.85rem; color: #64748b; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 1rem; }
    .cta a:hover { background: #1d4ed8; }
    .footer { text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>English Vocabulary for Kids</h1>
    <p>${WORDS.length} words across ${CATEGORIES.length} categories</p>
  </div>

  <div class="breadcrumb">
    <a href="/">Home</a> &rsaquo; Vocabulary
  </div>

  <div class="container">
    <p class="intro">${escapeHtml(vocabIndexDesc)}</p>

    <div class="grid">
      ${categoryCards}
    </div>

    <div class="cta">
      <a href="/">Start Learning in the App &rarr;</a>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Children Do English &middot; <a href="/about/" style="color:#94a3b8">About</a> &middot; <a href="/privacy" style="color:#94a3b8">Privacy</a>
  </div>
</body>
</html>`;

writeFileSync(join(distDir, 'vocabulary', 'index.html'), vocabIndexHtml, 'utf-8');
console.log(`  ✓ /vocabulary/ (index page, ${CATEGORIES.length} categories)`);

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

const vocabIndexEntry = `  <url>
    <loc>${SITE}/vocabulary/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

const vocabEntries = CATEGORIES.map(
  (slug) => `  <url>
    <loc>${SITE}/vocabulary/${slug}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
).join('\n');

// --- Generate About page ---

const aboutUrl = `${SITE}/about/`;
const aboutTitle = 'About Children Do English | Free English Vocabulary App for Kids';
const aboutDesc = 'Children Do English is a free, ad-free vocabulary learning app for kids ages 6-12, built by Oded Deckelbaum. Learn about our teaching methodology and mission.';

const aboutBreadcrumb = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: 'About', item: aboutUrl },
  ],
});

const aboutPersonSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Oded Deckelbaum',
  jobTitle: 'Creator of Children Do English',
  url: `${SITE}/about/`,
});

const aboutHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(aboutTitle)}</title>
  <meta name="description" content="${escapeHtml(aboutDesc)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${aboutUrl}" />
  <link rel="alternate" hreflang="en" href="${aboutUrl}" />
  <link rel="alternate" hreflang="x-default" href="${aboutUrl}" />
  <link rel="icon" type="image/png" href="/favicon.png" />

  <!-- Open Graph -->
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${aboutUrl}" />
  <meta property="og:title" content="${escapeHtml(aboutTitle)}" />
  <meta property="og:description" content="${escapeHtml(aboutDesc)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(aboutTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(aboutDesc)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />

  <!-- Structured Data -->
  <script type="application/ld+json">${aboutBreadcrumb}</script>
  <script type="application/ld+json">${aboutPersonSchema}</script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.7; }
    .header { background: #2563eb; color: #fff; padding: 2rem 1rem; text-align: center; }
    .header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .header p { opacity: 0.9; font-size: 0.95rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #64748b; max-width: 720px; margin: 0 auto; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .container { max-width: 720px; margin: 0 auto; padding: 0 1rem 2rem; }
    .section { background: #fff; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .section h2 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; }
    .section p { margin-bottom: 0.75rem; color: #475569; }
    .section ul { margin: 0.5rem 0 0.75rem 1.25rem; color: #475569; }
    .section li { margin-bottom: 0.35rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin: 1rem 0; }
    .stat { background: #f0f9ff; border-radius: 0.5rem; padding: 1rem; text-align: center; }
    .stat-num { font-size: 1.5rem; font-weight: 800; color: #2563eb; }
    .stat-label { font-size: 0.8rem; color: #64748b; margin-top: 0.25rem; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 1rem; }
    .cta a:hover { background: #1d4ed8; }
    .footer { text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>About Children Do English</h1>
    <p>Free vocabulary learning for kids ages 6-12</p>
  </div>

  <div class="breadcrumb">
    <a href="/">Home</a> &rsaquo; About
  </div>

  <div class="container">
    <div class="section">
      <h2>Our Mission</h2>
      <p>Children Do English helps kids build a strong English vocabulary through fun, interactive learning. We believe every child deserves access to quality educational tools &mdash; completely free, with no ads, no tracking, and no account required.</p>
    </div>

    <div class="section">
      <h2>How It Works</h2>
      <p>Our app uses proven learning techniques to help children retain new words:</p>
      <ul>
        <li><strong>Spaced repetition</strong> &mdash; Words come back for review right before kids forget them</li>
        <li><strong>Multi-modal learning</strong> &mdash; Image quizzes, audio challenges, flashcards, and word quizzes engage different senses</li>
        <li><strong>Progressive difficulty</strong> &mdash; Three levels (beginner, intermediate, advanced) let kids grow at their own pace</li>
        <li><strong>Instant feedback</strong> &mdash; Every answer gets immediate, encouraging feedback</li>
      </ul>
    </div>

    <div class="section">
      <h2>What's Inside</h2>
      <div class="stats">
        <div class="stat"><div class="stat-num">${WORDS.length}</div><div class="stat-label">Words</div></div>
        <div class="stat"><div class="stat-num">${CATEGORIES.length}</div><div class="stat-label">Categories</div></div>
        <div class="stat"><div class="stat-num">4</div><div class="stat-label">Quiz Modes</div></div>
        <div class="stat"><div class="stat-num">3</div><div class="stat-label">Difficulty Levels</div></div>
      </div>
      <p>Every word includes a definition, example sentence, phonetic pronunciation, and Hebrew translation &mdash; making it perfect for bilingual Hebrew-English learners.</p>
    </div>

    <div class="section">
      <h2>Privacy First</h2>
      <p>Children Do English is designed with kids' safety in mind. All learning data is stored locally on the device and never sent to any server. We comply with COPPA and collect no personal information. <a href="/privacy">Read our full privacy policy &rarr;</a></p>
    </div>

    <div class="section">
      <h2>About the Creator</h2>
      <p>Children Do English is built by <strong>Oded Deckelbaum</strong>, a software developer and parent who wanted to create a better way for kids to learn English vocabulary. The app is open and free because education should be accessible to everyone.</p>
    </div>

    <div class="cta">
      <a href="/">Start Learning &rarr;</a>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Children Do English &middot; <a href="/privacy" style="color:#94a3b8">Privacy Policy</a>
  </div>
</body>
</html>`;

mkdirSync(join(distDir, 'about'), { recursive: true });
writeFileSync(join(distDir, 'about', 'index.html'), aboutHtml, 'utf-8');
console.log('  \u2713 /about/ (about page)');

// --- Generate Printable Flashcards pages ---

const flashcardsDir = join(distDir, 'printable-flashcards');
mkdirSync(flashcardsDir, { recursive: true });

let flashcardsGenerated = 0;

function buildPrintableFlashcardsPage(slug, displayName, words) {
  const url = `${SITE}/printable-flashcards/${slug}/`;
  const title = `Printable ${displayName} Flashcards for Kids | Children Do English`;
  const description = `Free printable ${displayName.toLowerCase()} flashcards for kids. ${words.length} English words with pictures, definitions, and Hebrew translations. Just print and cut!`;

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Printable Flashcards', item: `${SITE}/printable-flashcards/` },
      { '@type': 'ListItem', position: 3, name: displayName, item: url },
    ],
  });

  const flashcardCards = words
    .map(
      (w) => `
      <div class="flashcard">
        <img src="/images/${w.id}.webp" alt="${escapeHtml(w.word)}" class="fc-img" width="160" height="160" />
        <div class="fc-word">${escapeHtml(w.word)}</div>
        <div class="fc-phonetic">${escapeHtml(w.phonetic)}</div>
        <div class="fc-def">${escapeHtml(w.definition)}</div>
        <div class="fc-he">${escapeHtml(w.hebrewTranslation)}</div>
      </div>`
    )
    .join('\n');

  const categoryLinks = CATEGORIES
    .filter((c) => c !== slug)
    .map((c) => `<a href="/printable-flashcards/${c}/">${escapeHtml(CATEGORY_NAMES[c] || c)}</a>`)
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
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE}/og/${slug}.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE}/og/${slug}.png" />

  <!-- Structured Data -->
  <script type="application/ld+json">${breadcrumbSchema}</script>

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
    .intro { margin-bottom: 1rem; color: #475569; }
    .print-btn { display: inline-block; background: #2563eb; color: #fff; padding: 0.6rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.95rem; cursor: pointer; border: none; margin-bottom: 1.5rem; }
    .print-btn:hover { background: #1d4ed8; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .flashcard { background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; border: 2px dashed #e2e8f0; page-break-inside: avoid; }
    .fc-img { width: 160px; height: 160px; border-radius: 0.75rem; object-fit: cover; margin: 0 auto 0.75rem; display: block; }
    .fc-word { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: 0.15rem; }
    .fc-phonetic { font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.35rem; }
    .fc-def { font-size: 0.85rem; color: #475569; margin-bottom: 0.25rem; }
    .fc-he { color: #475569; direction: rtl; font-size: 0.9rem; font-weight: 600; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 1rem; }
    .cta a:hover { background: #1d4ed8; }
    .categories { margin-top: 2rem; }
    .categories h2 { font-size: 1.1rem; margin-bottom: 0.75rem; color: #334155; }
    .cat-links { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .cat-links a { background: #fff; padding: 0.4rem 0.85rem; border-radius: 2rem; font-size: 0.85rem; color: #2563eb; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    .cat-links a:hover { background: #2563eb; color: #fff; }
    .footer { text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.8rem; }
    @media print {
      .header, .breadcrumb, .print-btn, .cta, .categories, .footer, .no-print { display: none !important; }
      body { background: #fff; }
      .grid { grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
      .flashcard { border: 2px dashed #ccc; box-shadow: none; padding: 0.75rem; }
      .fc-img { width: 100px; height: 100px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Printable ${escapeHtml(displayName)} Flashcards</h1>
    <p>${words.length} English vocabulary flashcards for kids</p>
  </div>

  <div class="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/printable-flashcards/">Printable Flashcards</a> &rsaquo; ${escapeHtml(displayName)}
  </div>

  <div class="container">
    <p class="intro">${escapeHtml(description)}</p>
    <button class="print-btn" onclick="window.print()">Print These Flashcards</button>

    <div class="grid">
      ${flashcardCards}
    </div>

    <div class="cta">
      <a href="/">Practice These Words in the App &rarr;</a>
      <p style="margin-top:0.5rem;font-size:0.8rem;color:#64748b">Free &middot; No ads &middot; Works offline &middot; No account needed</p>
    </div>

    <div class="categories">
      <h2>More Printable Flashcards</h2>
      <div class="cat-links">
        ${categoryLinks}
      </div>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Children Do English &middot; <a href="/about/" style="color:#94a3b8">About</a> &middot; <a href="/privacy" style="color:#94a3b8">Privacy</a>
  </div>
</body>
</html>`;
}

for (const slug of CATEGORIES) {
  const displayName = CATEGORY_NAMES[slug] || slug;
  const words = getWordsByCategory(slug);
  if (words.length === 0) continue;

  const outDir = join(flashcardsDir, slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), buildPrintableFlashcardsPage(slug, displayName, words), 'utf-8');
  flashcardsGenerated++;
  console.log(`  \u2713 /printable-flashcards/${slug}/ (${words.length} cards)`);
}

// Printable flashcards index page
const fcIndexUrl = `${SITE}/printable-flashcards/`;
const fcIndexTitle = 'Free Printable English Flashcards for Kids | Children Do English';
const fcIndexDesc = `Free printable English vocabulary flashcards for kids ages 6-12. ${WORDS.length} words across ${CATEGORIES.length} categories with pictures, definitions, and Hebrew translations. Just print and cut!`;

const fcIndexBreadcrumb = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: 'Printable Flashcards', item: fcIndexUrl },
  ],
});

const fcCategoryCards = CATEGORIES.map((slug) => {
  const name = CATEGORY_NAMES[slug] || slug;
  const words = getWordsByCategory(slug);
  const previewWords = words.slice(0, 3);
  const previewImgs = previewWords
    .map((w) => `<img src="/images/${w.id}.webp" alt="${escapeHtml(w.word)}" style="width:40px;height:40px;border-radius:0.4rem;object-fit:cover" loading="lazy" width="40" height="40" />`)
    .join(' ');
  return `
      <a href="/printable-flashcards/${slug}/" class="cat-card">
        <div style="display:flex;gap:0.3rem;margin-bottom:0.5rem">${previewImgs}</div>
        <h2>${escapeHtml(name)}</h2>
        <p class="word-count">${words.length} flashcards</p>
      </a>`;
}).join('\n');

const fcIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(fcIndexTitle)}</title>
  <meta name="description" content="${escapeHtml(fcIndexDesc)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${fcIndexUrl}" />
  <link rel="alternate" hreflang="en" href="${fcIndexUrl}" />
  <link rel="alternate" hreflang="x-default" href="${fcIndexUrl}" />
  <link rel="icon" type="image/png" href="/favicon.png" />

  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${fcIndexUrl}" />
  <meta property="og:title" content="${escapeHtml(fcIndexTitle)}" />
  <meta property="og:description" content="${escapeHtml(fcIndexDesc)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(fcIndexTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(fcIndexDesc)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />

  <script type="application/ld+json">${fcIndexBreadcrumb}</script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.6; }
    .header { background: #2563eb; color: #fff; padding: 2rem 1rem; text-align: center; }
    .header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .header p { opacity: 0.9; font-size: 0.95rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #64748b; max-width: 960px; margin: 0 auto; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 1rem 2rem; }
    .intro { margin-bottom: 1.5rem; color: #475569; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .cat-card { display: block; background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none; color: inherit; transition: box-shadow 0.2s, transform 0.2s; }
    .cat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .cat-card h2 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 0.2rem; }
    .cat-card .word-count { font-size: 0.8rem; color: #2563eb; font-weight: 600; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
    .cta a:hover { background: #1d4ed8; }
    .footer { text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Free Printable English Flashcards for Kids</h1>
    <p>${WORDS.length} vocabulary flashcards across ${CATEGORIES.length} categories</p>
  </div>

  <div class="breadcrumb">
    <a href="/">Home</a> &rsaquo; Printable Flashcards
  </div>

  <div class="container">
    <p class="intro">Choose a category below to view and print free English vocabulary flashcards. Each flashcard includes a picture, the English word, phonetic pronunciation, definition, and Hebrew translation. Perfect for kids ages 6-12.</p>

    <div class="grid">
      ${fcCategoryCards}
    </div>

    <div class="cta">
      <a href="/">Practice Online in the App &rarr;</a>
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Children Do English &middot; <a href="/about/" style="color:#94a3b8">About</a> &middot; <a href="/privacy" style="color:#94a3b8">Privacy</a>
  </div>
</body>
</html>`;

writeFileSync(join(flashcardsDir, 'index.html'), fcIndexHtml, 'utf-8');
console.log(`  \u2713 /printable-flashcards/ (index, ${CATEGORIES.length} categories)`);

// --- Generate Blog/Guide pages ---

const guidesDir = join(distDir, 'guides');
mkdirSync(guidesDir, { recursive: true });

const GUIDES = [
  {
    slug: 'how-to-teach-kids-english-vocabulary',
    title: 'How to Teach Kids English Vocabulary — A Parent\'s Guide',
    description: 'Practical tips and proven methods for teaching English vocabulary to children ages 6-12. Learn about spaced repetition, multi-sensory learning, and daily routines that work.',
    h1: 'How to Teach Kids English Vocabulary',
    sections: [
      {
        h2: 'Why Vocabulary Matters',
        content: `<p>A strong vocabulary is the foundation of reading comprehension, writing ability, and confident communication. Research shows that children who learn 5-10 new words per week in a structured way retain them far better than those who encounter words randomly.</p>
<p>For bilingual families &mdash; especially Hebrew-English households &mdash; building English vocabulary early gives kids a head start in school and helps them feel comfortable in English-speaking environments.</p>`,
      },
      {
        h2: 'Proven Methods That Work',
        content: `<h3>1. Spaced Repetition</h3>
<p>Instead of cramming, introduce words gradually and review them at increasing intervals. A word learned today should be reviewed tomorrow, then in 3 days, then in a week. This technique, backed by decades of cognitive science research, dramatically improves long-term retention.</p>

<h3>2. Multi-Sensory Learning</h3>
<p>Kids learn best when multiple senses are engaged. Combine:</p>
<ul>
  <li><strong>Visual</strong> &mdash; Pictures and images paired with words</li>
  <li><strong>Auditory</strong> &mdash; Hearing the word pronounced correctly</li>
  <li><strong>Kinesthetic</strong> &mdash; Writing the word, acting it out, or using flashcards</li>
</ul>
<p>Apps like <a href="/">Children Do English</a> combine all three through image quizzes, audio challenges, and interactive flashcards.</p>

<h3>3. Context Over Memorization</h3>
<p>Don't just teach isolated words. Always present words with:</p>
<ul>
  <li>A simple definition kids can understand</li>
  <li>An example sentence showing how the word is used</li>
  <li>A picture that makes the meaning concrete</li>
</ul>`,
      },
      {
        h2: 'Building a Daily Routine',
        content: `<p>Consistency beats intensity. Here's a simple daily routine that works:</p>
<ol>
  <li><strong>Morning (2 minutes):</strong> Review 5 previously learned words using flashcards</li>
  <li><strong>Afternoon (5 minutes):</strong> Learn 3-5 new words with pictures and definitions</li>
  <li><strong>Evening (3 minutes):</strong> Quick quiz to test the day's words</li>
</ol>
<p>That's just 10 minutes a day &mdash; but over a month, your child will have been exposed to 90-150 new words, with older words reinforced through spaced review.</p>`,
      },
      {
        h2: 'Tips for Different Ages',
        content: `<h3>Ages 6-8 (Beginner)</h3>
<ul>
  <li>Focus on concrete, everyday words: <a href="/vocabulary/animals/">animals</a>, <a href="/vocabulary/food/">food</a>, <a href="/vocabulary/colors/">colors</a>, <a href="/vocabulary/body/">body parts</a></li>
  <li>Use lots of pictures &mdash; kids this age are highly visual</li>
  <li>Keep sessions short (5 minutes max)</li>
  <li>Celebrate every small win to build confidence</li>
</ul>

<h3>Ages 8-10 (Intermediate)</h3>
<ul>
  <li>Introduce more abstract words: <a href="/vocabulary/feelings/">feelings</a>, <a href="/vocabulary/actions/">actions</a>, descriptions</li>
  <li>Start with phonetic pronunciation to build reading skills</li>
  <li>Encourage kids to use new words in sentences</li>
</ul>

<h3>Ages 10-12 (Advanced)</h3>
<ul>
  <li>Add challenging words and less common vocabulary</li>
  <li>Discuss word origins and word families</li>
  <li>Have kids teach words to younger siblings &mdash; teaching reinforces learning</li>
</ul>`,
      },
      {
        h2: 'Free Tools to Get Started',
        content: `<p><a href="/">Children Do English</a> is a free, ad-free vocabulary app designed specifically for kids ages 6-12. It includes:</p>
<ul>
  <li><strong>${WORDS.length} words</strong> across ${CATEGORIES.length} categories</li>
  <li>Image quizzes, word quizzes, audio challenges, and flashcards</li>
  <li>Built-in spaced repetition for smart review</li>
  <li>Hebrew translations for bilingual families</li>
  <li>Multiple player profiles for siblings</li>
  <li>Works offline &mdash; no internet needed after first visit</li>
</ul>
<p>You can also <a href="/printable-flashcards/">print free flashcards</a> to use away from the screen.</p>`,
      },
    ],
  },
  {
    slug: 'spaced-repetition-for-kids',
    title: 'Spaced Repetition for Kids — How It Helps Children Learn Vocabulary',
    description: 'Learn how spaced repetition works and why it\'s the most effective way for children to learn and remember English vocabulary. Simple explanation for parents and teachers.',
    h1: 'Spaced Repetition for Kids',
    sections: [
      {
        h2: 'What Is Spaced Repetition?',
        content: `<p>Spaced repetition is a learning technique where you review information at gradually increasing intervals. Instead of studying a word 10 times in one sitting (cramming), you study it once today, once tomorrow, once in 3 days, once in a week, and once in a month.</p>
<p>This approach works because of how our brains form memories. Each time you successfully recall something right before you'd forget it, the memory gets stronger and lasts longer.</p>`,
      },
      {
        h2: 'Why It Works So Well for Children',
        content: `<p>Children's brains are naturally wired for learning, but they also forget quickly. Spaced repetition takes advantage of both:</p>
<ul>
  <li><strong>Short sessions feel easy</strong> &mdash; Kids don't get overwhelmed or bored</li>
  <li><strong>Success builds confidence</strong> &mdash; Reviewing at the right time means kids usually get the answer right</li>
  <li><strong>It's automatic</strong> &mdash; The system decides what to review and when, so parents don't have to plan</li>
  <li><strong>It actually sticks</strong> &mdash; Words learned this way are remembered for months, not just hours</li>
</ul>`,
      },
      {
        h2: 'Spaced Repetition vs. Traditional Flashcards',
        content: `<table style="width:100%;border-collapse:collapse;margin:1rem 0">
  <thead>
    <tr style="background:#f1f5f9">
      <th style="padding:0.5rem;text-align:left;border-bottom:2px solid #e2e8f0">Feature</th>
      <th style="padding:0.5rem;text-align:left;border-bottom:2px solid #e2e8f0">Traditional Flashcards</th>
      <th style="padding:0.5rem;text-align:left;border-bottom:2px solid #e2e8f0">Spaced Repetition</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Review schedule</td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Random or all at once</td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Optimally timed</td></tr>
    <tr><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Time required</td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Long cramming sessions</td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Short daily sessions</td></tr>
    <tr><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Long-term memory</td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Weak</td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Strong</td></tr>
    <tr><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Kid-friendly</td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Can be tedious</td><td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">Feels like a game</td></tr>
  </tbody>
</table>`,
      },
      {
        h2: 'How to Use Spaced Repetition at Home',
        content: `<p>You don't need to build a system from scratch. Here are practical ways to use spaced repetition:</p>
<ol>
  <li><strong>Use an app that does it automatically</strong> &mdash; <a href="/">Children Do English</a> has built-in spaced repetition that schedules word reviews at the optimal time</li>
  <li><strong>Use the Daily Review feature</strong> &mdash; The app tells your child exactly which words are due for review each day</li>
  <li><strong>Keep it short</strong> &mdash; 5-10 minutes per day is all it takes</li>
  <li><strong>Be consistent</strong> &mdash; Daily practice is more important than session length</li>
</ol>`,
      },
    ],
  },
  {
    slug: 'english-learning-activities-for-kids',
    title: 'Best English Learning Activities for Kids Ages 6-12',
    description: 'Fun and effective English learning activities for children. From vocabulary games to printable flashcards, discover activities that make learning English enjoyable for kids.',
    h1: 'Best English Learning Activities for Kids',
    sections: [
      {
        h2: 'Why Activities Beat Textbooks',
        content: `<p>Children learn language best through active engagement, not passive studying. When kids interact with words through games, quizzes, and hands-on activities, they form stronger memories and develop a positive attitude toward learning.</p>
<p>Here are the most effective English learning activities for kids ages 6-12, organized by type.</p>`,
      },
      {
        h2: 'Picture-Word Matching Games',
        content: `<p>Connecting words with images is one of the fastest ways for kids to learn vocabulary. When a child sees a picture of a cat and matches it to the word "cat," they create a dual-coded memory &mdash; both visual and verbal.</p>
<p><strong>How to do it:</strong></p>
<ul>
  <li>Use image quiz apps like <a href="/">Children Do English</a> that show a picture and ask kids to pick the right word</li>
  <li><a href="/printable-flashcards/">Print flashcards</a> with pictures on one side and words on the other</li>
  <li>Play "point and name" around the house &mdash; point to objects and say the English word</li>
</ul>`,
      },
      {
        h2: 'Audio and Pronunciation Practice',
        content: `<p>Hearing words spoken correctly is essential for building pronunciation skills and listening comprehension.</p>
<p><strong>Activities:</strong></p>
<ul>
  <li><strong>Listen and match</strong> &mdash; Hear a word, then pick the right picture</li>
  <li><strong>Repeat after me</strong> &mdash; Play an audio clip and have the child repeat the word</li>
  <li><strong>Word of the day</strong> &mdash; Introduce one new word each morning, say it together, and use it in conversation throughout the day</li>
</ul>`,
      },
      {
        h2: 'Flashcard Activities',
        content: `<p>Flashcards are versatile and work for all ages. Beyond simple review, try these variations:</p>
<ul>
  <li><strong>Speed round</strong> &mdash; How many cards can you get right in 60 seconds?</li>
  <li><strong>Category sort</strong> &mdash; Mix flashcards from different categories and sort them (<a href="/vocabulary/animals/">animals</a>, <a href="/vocabulary/food/">food</a>, <a href="/vocabulary/clothing/">clothing</a>, etc.)</li>
  <li><strong>Memory match</strong> &mdash; Place cards face-down and flip pairs (word + picture)</li>
  <li><strong>Printable sets</strong> &mdash; <a href="/printable-flashcards/">Download and print free flashcards</a> for offline practice</li>
</ul>`,
      },
      {
        h2: 'Daily Vocabulary Routines',
        content: `<p>The most effective approach combines multiple activities into a short daily routine:</p>
<ol>
  <li><strong>Review (2 min):</strong> Go through daily review words in <a href="/">the app</a></li>
  <li><strong>Learn (3 min):</strong> <a href="/vocabulary/">Explore a new category</a> and learn 3-5 new words</li>
  <li><strong>Practice (5 min):</strong> Take a quick quiz to test what you learned</li>
</ol>
<p>That's just 10 minutes a day. Over a month, your child will encounter over 100 new words with built-in reinforcement.</p>`,
      },
      {
        h2: 'Track Progress and Celebrate',
        content: `<p>Kids are motivated by visible progress. Use tools that show:</p>
<ul>
  <li><strong>Streak tracking</strong> &mdash; How many days in a row they've practiced</li>
  <li><strong>Badges and achievements</strong> &mdash; Milestones like "first quiz," "50 words learned," "7-day streak"</li>
  <li><strong>Vocabulary mastery</strong> &mdash; See which words they've mastered vs. which need more practice</li>
</ul>
<p><a href="/">Children Do English</a> includes all of these features to keep kids motivated and give parents visibility into their child's progress.</p>`,
      },
    ],
  },
];

for (const guide of GUIDES) {
  const guideUrl = `${SITE}/guides/${guide.slug}/`;
  const guideBreadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE}/guides/` },
      { '@type': 'ListItem', position: 3, name: guide.h1, item: guideUrl },
    ],
  });

  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.h1,
    description: guide.description,
    url: guideUrl,
    author: { '@type': 'Person', name: 'Oded Deckelbaum' },
    publisher: {
      '@type': 'Organization',
      name: 'Children Do English',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/favicon.png` },
    },
    datePublished: '2026-03-06',
    dateModified: today,
    mainEntityOfPage: guideUrl,
  });

  const sectionHtml = guide.sections
    .map((s) => `
    <div class="section">
      <h2>${s.h2}</h2>
      ${s.content}
    </div>`)
    .join('\n');

  const guideHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(guide.title)}</title>
  <meta name="description" content="${escapeHtml(guide.description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${guideUrl}" />
  <link rel="alternate" hreflang="en" href="${guideUrl}" />
  <link rel="alternate" hreflang="x-default" href="${guideUrl}" />
  <link rel="icon" type="image/png" href="/favicon.png" />

  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${guideUrl}" />
  <meta property="og:title" content="${escapeHtml(guide.title)}" />
  <meta property="og:description" content="${escapeHtml(guide.description)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(guide.title)}" />
  <meta name="twitter:description" content="${escapeHtml(guide.description)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />

  <script type="application/ld+json">${guideBreadcrumb}</script>
  <script type="application/ld+json">${articleSchema}</script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.7; }
    .header { background: #2563eb; color: #fff; padding: 2rem 1rem; text-align: center; }
    .header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .header p { opacity: 0.9; font-size: 0.95rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #64748b; max-width: 720px; margin: 0 auto; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .container { max-width: 720px; margin: 0 auto; padding: 0 1rem 2rem; }
    .section { background: #fff; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .section h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; }
    .section h3 { font-size: 1.05rem; font-weight: 600; color: #334155; margin: 1rem 0 0.5rem; }
    .section p { margin-bottom: 0.75rem; color: #475569; }
    .section ul, .section ol { margin: 0.5rem 0 0.75rem 1.25rem; color: #475569; }
    .section li { margin-bottom: 0.35rem; }
    .section a { color: #2563eb; text-decoration: none; }
    .section a:hover { text-decoration: underline; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 1rem; }
    .cta a:hover { background: #1d4ed8; }
    .guides-nav { margin-top: 2rem; }
    .guides-nav h2 { font-size: 1.1rem; margin-bottom: 0.75rem; color: #334155; }
    .guides-nav a { display: block; background: #fff; padding: 0.75rem 1rem; border-radius: 0.5rem; margin-bottom: 0.5rem; color: #2563eb; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    .guides-nav a:hover { background: #2563eb; color: #fff; }
    .footer { text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(guide.h1)}</h1>
    <p>A guide for parents and teachers</p>
  </div>

  <div class="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/guides/">Guides</a> &rsaquo; ${escapeHtml(guide.h1)}
  </div>

  <div class="container">
    ${sectionHtml}

    <div class="cta">
      <a href="/">Try Children Do English &mdash; Free &rarr;</a>
      <p style="margin-top:0.5rem;font-size:0.8rem;color:#64748b">No ads &middot; No account needed &middot; Works offline</p>
    </div>

    <div class="guides-nav">
      <h2>More Guides</h2>
      ${GUIDES.filter((g) => g.slug !== guide.slug)
        .map((g) => `<a href="/guides/${g.slug}/">${escapeHtml(g.h1)}</a>`)
        .join('\n      ')}
    </div>
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Children Do English &middot; <a href="/about/" style="color:#94a3b8">About</a> &middot; <a href="/privacy" style="color:#94a3b8">Privacy</a>
  </div>
</body>
</html>`;

  const guideDir = join(guidesDir, guide.slug);
  mkdirSync(guideDir, { recursive: true });
  writeFileSync(join(guideDir, 'index.html'), guideHtml, 'utf-8');
  console.log(`  \u2713 /guides/${guide.slug}/`);
}

// Guides index page
const guidesIndexUrl = `${SITE}/guides/`;
const guidesIndexTitle = 'English Learning Guides for Parents | Children Do English';
const guidesIndexDesc = 'Free guides for parents and teachers on teaching English vocabulary to kids. Learn about spaced repetition, learning activities, and effective teaching methods.';

const guidesIndexBreadcrumb = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
    { '@type': 'ListItem', position: 2, name: 'Guides', item: guidesIndexUrl },
  ],
});

const guideCards = GUIDES.map((g) => `
      <a href="/guides/${g.slug}/" class="guide-card">
        <h2>${escapeHtml(g.h1)}</h2>
        <p>${escapeHtml(g.description)}</p>
      </a>`).join('\n');

const guidesIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(guidesIndexTitle)}</title>
  <meta name="description" content="${escapeHtml(guidesIndexDesc)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${guidesIndexUrl}" />
  <link rel="alternate" hreflang="en" href="${guidesIndexUrl}" />
  <link rel="alternate" hreflang="x-default" href="${guidesIndexUrl}" />
  <link rel="icon" type="image/png" href="/favicon.png" />

  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${guidesIndexUrl}" />
  <meta property="og:title" content="${escapeHtml(guidesIndexTitle)}" />
  <meta property="og:description" content="${escapeHtml(guidesIndexDesc)}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(guidesIndexTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(guidesIndexDesc)}" />
  <meta name="twitter:image" content="${SITE}/og-image.png" />

  <script type="application/ld+json">${guidesIndexBreadcrumb}</script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.6; }
    .header { background: #2563eb; color: #fff; padding: 2rem 1rem; text-align: center; }
    .header h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .header p { opacity: 0.9; font-size: 0.95rem; }
    .breadcrumb { padding: 0.75rem 1rem; font-size: 0.85rem; color: #64748b; max-width: 720px; margin: 0 auto; }
    .breadcrumb a { color: #2563eb; text-decoration: none; }
    .container { max-width: 720px; margin: 0 auto; padding: 0 1rem 2rem; }
    .intro { margin-bottom: 1.5rem; color: #475569; }
    .guide-card { display: block; background: #fff; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-decoration: none; color: inherit; transition: box-shadow 0.2s, transform 0.2s; }
    .guide-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .guide-card h2 { font-size: 1.15rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
    .guide-card p { font-size: 0.9rem; color: #64748b; }
    .footer { text-align: center; padding: 2rem 1rem; color: #94a3b8; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>English Learning Guides for Parents</h1>
    <p>Practical advice for teaching English vocabulary to kids</p>
  </div>

  <div class="breadcrumb">
    <a href="/">Home</a> &rsaquo; Guides
  </div>

  <div class="container">
    <p class="intro">Free guides with practical tips and proven methods for helping kids ages 6-12 build their English vocabulary.</p>

    ${guideCards}
  </div>

  <div class="footer">
    &copy; ${new Date().getFullYear()} Children Do English &middot; <a href="/about/" style="color:#94a3b8">About</a> &middot; <a href="/privacy" style="color:#94a3b8">Privacy</a>
  </div>
</body>
</html>`;

writeFileSync(join(guidesDir, 'index.html'), guidesIndexHtml, 'utf-8');
console.log(`  \u2713 /guides/ (index, ${GUIDES.length} guides)`);

// --- Overwrite sitemap.xml ---

const aboutEntry = `  <url>
    <loc>${SITE}/about/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`;

const fcIndexEntry = `  <url>
    <loc>${SITE}/printable-flashcards/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

const fcEntries = CATEGORIES.map(
  (slug) => `  <url>
    <loc>${SITE}/printable-flashcards/${slug}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`
).join('\n');

const guidesIndexEntry = `  <url>
    <loc>${SITE}/guides/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

const guideEntries = GUIDES.map(
  (g) => `  <url>
    <loc>${SITE}/guides/${g.slug}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${spaEntries}
${vocabIndexEntry}
${vocabEntries}
${aboutEntry}
${fcIndexEntry}
${fcEntries}
${guidesIndexEntry}
${guideEntries}
</urlset>
`;

writeFileSync(join(distDir, 'sitemap.xml'), sitemap, 'utf-8');

const totalUrls = spaRoutes.length + 1 + CATEGORIES.length + 1 + 1 + CATEGORIES.length + 1 + GUIDES.length;
console.log(`\nGenerated ${generated} vocab pages + ${flashcardsGenerated} flashcard pages + ${GUIDES.length} guides + indexes + about`);
console.log(`Sitemap: ${totalUrls} URLs`);
