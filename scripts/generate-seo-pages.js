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
      <a href="/vocabulary/${slug}/${w.id}/" class="card">
        <img src="/images/${w.id}.webp" alt="${escapeHtml(w.word)}" class="card-img" loading="lazy" width="128" height="128" />
        <div class="card-word">${escapeHtml(w.word)}</div>
        <div class="card-phonetic">${escapeHtml(w.phonetic)}</div>
        <div class="card-pos">${escapeHtml(w.partOfSpeech)}</div>
        <div class="card-def">${escapeHtml(w.definition)}</div>
        <div class="card-ex">&ldquo;${escapeHtml(w.exampleSentence)}&rdquo;</div>
        <div class="card-he">${escapeHtml(w.hebrewTranslation)}</div>
      </a>`
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
  ${HREFLANG_HE}
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
    .card { display: block; background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; text-decoration: none; color: inherit; transition: box-shadow 0.2s, transform 0.2s; }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform: translateY(-2px); }
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

function buildWordPage(word, categorySlug, categoryDisplayName, categoryWords) {
  const url = `${SITE}/vocabulary/${categorySlug}/${word.id}/`;
  const capitalWord = word.word.charAt(0).toUpperCase() + word.word.slice(1);
  const title = `${capitalWord} - English Vocabulary for Kids | Children Do English`;
  const description = `Learn the English word "${word.word}" — ${word.definition}. With pronunciation (${word.phonetic}), example sentence, and Hebrew translation (${word.hebrewTranslation}). Free for kids ages 6-12.`;

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Vocabulary', item: `${SITE}/vocabulary/` },
      { '@type': 'ListItem', position: 3, name: categoryDisplayName, item: `${SITE}/vocabulary/${categorySlug}/` },
      { '@type': 'ListItem', position: 4, name: capitalWord, item: url },
    ],
  });

  const definedTermSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: word.word,
    description: word.definition,
    inDefinedTermSet: `${SITE}/vocabulary/${categorySlug}/`,
  });

  // Pick 5 related words from same category, excluding current
  const related = categoryWords.filter((w) => w.id !== word.id).slice(0, 5);
  const relatedCards = related
    .map(
      (w) => `
      <a href="/vocabulary/${categorySlug}/${w.id}/" class="related-card">
        <img src="/images/${w.id}.webp" alt="${escapeHtml(w.word)}" class="related-img" loading="lazy" width="80" height="80" />
        <div class="related-word">${escapeHtml(w.word)}</div>
      </a>`
    )
    .join('\n');

  const categoryLinks = CATEGORIES.filter((c) => c !== categorySlug)
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
  ${HREFLANG_HE}
  <link rel="icon" type="image/png" href="/favicon.png" />

  <!-- Open Graph -->
  <meta property="og:locale" content="en_US" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Children Do English" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${SITE}/og/${categorySlug}.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${SITE}/og/${categorySlug}.png" />

  <!-- Structured Data -->
  <script type="application/ld+json">${breadcrumbSchema}</script>
  <script type="application/ld+json">${definedTermSchema}</script>

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
    .word-hero { background: #fff; border-radius: 0.75rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; max-width: 480px; margin: 0 auto 2rem; }
    .word-hero img { width: 192px; height: 192px; border-radius: 0.75rem; object-fit: cover; margin: 0 auto 1rem; display: block; }
    .word-hero .hero-word { font-size: 2rem; font-weight: 800; color: #1e293b; }
    .word-hero .hero-phonetic { font-size: 1rem; color: #94a3b8; margin-bottom: 0.25rem; }
    .word-hero .hero-pos { font-size: 0.8rem; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .word-hero .hero-def { font-size: 1.05rem; margin-bottom: 0.5rem; }
    .word-hero .hero-ex { font-style: italic; color: #64748b; font-size: 0.95rem; margin-bottom: 0.5rem; }
    .word-hero .hero-he { color: #475569; direction: rtl; font-size: 1rem; }
    .cta { text-align: center; margin: 2rem 0; }
    .cta a { display: inline-block; background: #2563eb; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 1rem; }
    .cta a:hover { background: #1d4ed8; }
    .cta-sub { margin-top: 0.5rem; font-size: 0.8rem; color: #64748b; }
    .section-title { font-size: 1.1rem; margin-bottom: 0.75rem; color: #334155; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 2rem; }
    .related-card { display: block; background: #fff; border-radius: 0.75rem; padding: 0.85rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; text-decoration: none; color: inherit; transition: box-shadow 0.2s, transform 0.2s; }
    .related-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .related-img { width: 80px; height: 80px; border-radius: 0.5rem; object-fit: cover; margin: 0 auto 0.5rem; display: block; }
    .related-word { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
    .back-link { display: inline-block; margin-bottom: 1.5rem; color: #2563eb; text-decoration: none; font-size: 0.9rem; }
    .back-link:hover { text-decoration: underline; }
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
    <h1>${escapeHtml(capitalWord)}</h1>
    <p>${escapeHtml(categoryDisplayName)} &middot; ${escapeHtml(word.level)}</p>
  </div>

  <div class="breadcrumb">
    <a href="/">Home</a> &rsaquo; <a href="/vocabulary/">Vocabulary</a> &rsaquo; <a href="/vocabulary/${categorySlug}/">${escapeHtml(categoryDisplayName)}</a> &rsaquo; ${escapeHtml(capitalWord)}
  </div>

  <div class="container">
    <div class="word-hero">
      <img src="/images/${word.id}.webp" alt="${escapeHtml(word.word)}" width="192" height="192" />
      <div class="hero-word">${escapeHtml(word.word)}</div>
      <div class="hero-phonetic">${escapeHtml(word.phonetic)}</div>
      <div class="hero-pos">${escapeHtml(word.partOfSpeech)}</div>
      <div class="hero-def">${escapeHtml(word.definition)}</div>
      <div class="hero-ex">&ldquo;${escapeHtml(word.exampleSentence)}&rdquo;</div>
      <div class="hero-he">${escapeHtml(word.hebrewTranslation)}</div>
    </div>

    <div class="cta">
      <a href="/">Practice This Word in the App &rarr;</a>
      <p class="cta-sub">Free &middot; No ads &middot; Works offline &middot; No account needed</p>
    </div>

    <h2 class="section-title">More ${escapeHtml(categoryDisplayName)} Words</h2>
    <div class="related-grid">
      ${relatedCards}
    </div>

    <a href="/vocabulary/${categorySlug}/" class="back-link">&larr; All ${escapeHtml(categoryDisplayName)} words</a>

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

const CATEGORY_NAMES_HE = {
  animals: 'חיות',
  food: 'אוכל ושתייה',
  home: 'בית ורהיטים',
  transport: 'תחבורה וכלי רכב',
  nature: 'טבע',
  colors: 'צבעים',
  numbers: 'מספרים',
  clothing: 'ביגוד',
  school: 'בית ספר',
  sports: 'ספורט ופעילויות',
  feelings: 'רגשות',
  everyday: 'חפצים יומיומיים',
  toys: 'צעצועים ומשחקים',
};

const HREFLANG_HE = ''; // Only add he hreflang on pages with Hebrew equivalents (homepage, /he/)

function buildHebrewLandingPage() {
  const url = `${SITE}/he/`;
  const title = 'לימוד אנגלית לילדים בחינם | Children Do English - אוצר מילים, חידונים ומשחקים';
  const description = 'אפליקציה חינמית ללימוד אנגלית לילדים בגילאי 6-12. למעלה מ-340 מילים באנגלית עם תמונות, הגייה, משפטים ותרגום לעברית. ללא פרסומות, ללא רישום.';

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'עברית', item: url },
    ],
  });

  const webAppSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Children Do English',
    url: SITE,
    description: 'אפליקציה חינמית ללימוד אוצר מילים באנגלית לילדים בגילאי 6-12 עם חידוני תמונות, כרטיסיות ואתגרי שמע',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    inLanguage: ['en', 'he'],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ILS',
    },
    author: {
      '@type': 'Person',
      name: 'Oded Deckelbaum',
      url: SITE,
    },
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      suggestedMinAge: 6,
      suggestedMaxAge: 12,
    },
  });

  const faqSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'האם האפליקציה באמת בחינם?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'כן! Children Do English היא אפליקציה חינמית לחלוטין, ללא פרסומות, ללא רכישות בתוך האפליקציה וללא צורך בהרשמה.',
        },
      },
      {
        '@type': 'Question',
        name: 'לאיזה גיל מתאימה האפליקציה?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'האפליקציה מתאימה לילדים בגילאי 6-12. המילים מחולקות לשלוש רמות קושי (מתחיל, בינוני ומתקדם) כך שכל ילד יכול להתקדם בקצב שלו.',
        },
      },
      {
        '@type': 'Question',
        name: 'כמה מילים יש באפליקציה?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'האפליקציה כוללת למעלה מ-340 מילים באנגלית ב-13 קטגוריות שונות, כולל חיות, אוכל, צבעים, ביגוד, רגשות, טבע, ספורט ועוד.',
        },
      },
      {
        '@type': 'Question',
        name: 'האם יש תמיכה בעברית?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'כן! כל מילה כוללת תרגום לעברית, וממשק האפליקציה זמין בעברית מלאה. האפליקציה נבנתה במיוחד עבור ילדים דוברי עברית שלומדים אנגלית.',
        },
      },
      {
        '@type': 'Question',
        name: 'איך הלמידה עובדת?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'הילדים לומדים דרך חידוני תמונות, כרטיסיות, אתגרי שמע ומשחקי התאמה. האפליקציה משתמשת בשיטת חזרה מרווחת כדי לוודא שהמילים נשמרות בזיכרון לטווח ארוך.',
        },
      },
      {
        '@type': 'Question',
        name: 'האם האפליקציה עובדת ללא אינטרנט?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'כן! האפליקציה היא Progressive Web App ושומרת את התוכן במטמון לאחר הביקור הראשון, כך שהילדים יכולים ללמוד גם בלי חיבור לאינטרנט.',
        },
      },
      {
        '@type': 'Question',
        name: 'האם כמה ילדים יכולים להשתמש באותו מכשיר?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'כן! האפליקציה תומכת בפרופילים מרובים כך שכל אח או אחות יכולים לעקוב אחרי ההתקדמות שלהם בנפרד באותו מכשיר.',
        },
      },
    ],
  });

  const categoryGrid = CATEGORIES.map((slug) => {
    const hebrewName = CATEGORY_NAMES_HE[slug] || slug;
    const words = getWordsByCategory(slug);
    return `
        <a href="/vocabulary/${slug}/" class="cat-item">
          <span class="cat-name">${hebrewName}</span>
          <span class="cat-count">${words.length} מילים</span>
        </a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="keywords" content="לימוד אנגלית לילדים, אוצר מילים באנגלית לילדים, משחק אנגלית לילדים, אנגלית לילדים בחינם" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="en" href="${SITE}/" />
  <link rel="alternate" hreflang="he" href="${url}" />
  <link rel="alternate" hreflang="x-default" href="${SITE}/" />
  <link rel="icon" type="image/png" href="/favicon.png" />

  <!-- Open Graph -->
  <meta property="og:locale" content="he_IL" />
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
  <script type="application/ld+json">${webAppSchema}</script>
  <script type="application/ld+json">${faqSchema}</script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #eff6ff; color: #1e293b; line-height: 1.7; direction: rtl; text-align: right; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Hero */
    .hero { background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%); color: #fff; padding: 3rem 1rem 2.5rem; text-align: center; }
    .hero h1 { font-size: 1.85rem; font-weight: 900; margin-bottom: 0.5rem; line-height: 1.3; }
    .hero .subtitle { font-size: 1.05rem; opacity: 0.92; margin-bottom: 1.5rem; max-width: 540px; margin-left: auto; margin-right: auto; }
    .cta-btn { display: inline-block; background: #fff; color: #2563eb; padding: 0.85rem 2.25rem; border-radius: 0.6rem; font-weight: 700; font-size: 1.1rem; text-decoration: none; transition: transform 0.15s, box-shadow 0.15s; }
    .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); text-decoration: none; }
    .cta-sub { margin-top: 0.75rem; font-size: 0.8rem; opacity: 0.8; }

    /* Stats bar */
    .stats-bar { display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; background: #fff; padding: 1rem; border-bottom: 1px solid #e2e8f0; }
    .stat { text-align: center; }
    .stat-num { font-size: 1.25rem; font-weight: 800; color: #2563eb; direction: ltr; display: inline-block; }
    .stat-label { font-size: 0.8rem; color: #64748b; }

    /* Sections */
    .container { max-width: 960px; margin: 0 auto; padding: 0 1rem; }
    .section { padding: 2.5rem 0; }
    .section-title { font-size: 1.4rem; font-weight: 800; text-align: center; margin-bottom: 1.5rem; color: #1e293b; }

    /* Feature cards */
    .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .feature-card { background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .feature-icon { font-size: 1.75rem; margin-bottom: 0.5rem; }
    .feature-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem; }
    .feature-card p { font-size: 0.9rem; color: #475569; }

    /* How it works */
    .steps { display: flex; flex-direction: column; gap: 1rem; max-width: 600px; margin: 0 auto; }
    .step { display: flex; align-items: flex-start; gap: 1rem; background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .step-num { width: 2.5rem; height: 2.5rem; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; flex-shrink: 0; }
    .step h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.15rem; }
    .step p { font-size: 0.9rem; color: #475569; }

    /* Category grid */
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
    .cat-item { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 0.6rem; padding: 0.85rem 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); text-decoration: none; color: inherit; transition: box-shadow 0.2s, transform 0.2s; }
    .cat-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px); text-decoration: none; }
    .cat-name { font-weight: 700; color: #1e293b; }
    .cat-count { font-size: 0.8rem; color: #2563eb; font-weight: 600; direction: ltr; }

    /* Testimonials */
    .testimonials { display: flex; flex-direction: column; gap: 0.75rem; max-width: 640px; margin: 0 auto; }
    .testimonial { background: #fff; border-radius: 0.75rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .testimonial p { font-size: 0.9rem; color: #334155; font-style: italic; margin-bottom: 0.5rem; line-height: 1.6; }
    .testimonial .author { font-size: 0.8rem; color: #94a3b8; font-weight: 600; font-style: normal; }

    /* FAQ */
    .faq-list { max-width: 700px; margin: 0 auto; }
    .faq-item { background: #fff; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .faq-q { font-weight: 700; font-size: 1rem; margin-bottom: 0.35rem; color: #1e293b; }
    .faq-a { font-size: 0.9rem; color: #475569; line-height: 1.6; }

    /* Final CTA */
    .final-cta { text-align: center; padding: 2.5rem 1rem; background: linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%); color: #fff; }
    .final-cta h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
    .final-cta p { opacity: 0.9; margin-bottom: 1.25rem; }

    /* Footer */
    .footer { text-align: center; padding: 1.5rem 1rem; color: #94a3b8; font-size: 0.8rem; background: #f8fafc; }
    .footer a { color: #94a3b8; }
    .footer a:hover { color: #64748b; }
  </style>
</head>
<body>
  <!-- Hero -->
  <div class="hero">
    <h1>לימוד אנגלית לילדים — בחינם ובכיף!</h1>
    <p class="subtitle">אפליקציה חינמית ללימוד אוצר מילים באנגלית לילדים בגילאי 6-12. עם תמונות, הגייה, משפטים לדוגמה ותרגום לעברית.</p>
    <a href="/?lang=he" class="cta-btn">התחילו ללמוד עכשיו &#8592;</a>
    <p class="cta-sub">ללא פרסומות &middot; ללא רישום &middot; חינם לגמרי</p>
  </div>

  <!-- Stats bar -->
  <div class="stats-bar">
    <div class="stat"><div class="stat-num">${WORDS.length}+</div><div class="stat-label">מילים</div></div>
    <div class="stat"><div class="stat-num">${CATEGORIES.length}</div><div class="stat-label">קטגוריות</div></div>
    <div class="stat"><div class="stat-num">4</div><div class="stat-label">מצבי חידון</div></div>
    <div class="stat"><div class="stat-num">3</div><div class="stat-label">רמות קושי</div></div>
  </div>

  <!-- Features -->
  <div class="section">
    <div class="container">
      <h2 class="section-title">איך הילדים שלכם ילמדו אנגלית?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">&#128248;</div>
          <h3>למידה עם תמונות</h3>
          <p>כל מילה מלווה בתמונה צבעונית שעוזרת לילדים לזכור את המשמעות בצורה ויזואלית.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">&#127918;</div>
          <h3>חידונים מהנים</h3>
          <p>ארבעה סוגי חידונים — תמונות, מילים, שמע והתאמה — שהופכים את הלמידה למשחק.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">&#128196;</div>
          <h3>כרטיסיות לימוד</h3>
          <p>כרטיסיות אינטראקטיביות עם תמונה, הגייה, הגדרה ותרגום לעברית.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">&#128257;</div>
          <h3>חזרה מרווחת</h3>
          <p>מערכת חכמה שמחזירה מילים בדיוק לפני ששוכחים אותן, לשמירה בזיכרון לטווח ארוך.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">&#128506;</div>
          <h3>מסלול למידה מותאם</h3>
          <p>שלוש רמות קושי — מתחיל, בינוני ומתקדם — כך שכל ילד מתקדם בקצב שלו.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">&#127942;</div>
          <h3>תגים והישגים</h3>
          <p>הילדים אוספים תגים ומעקבים אחרי ההתקדמות, מה שמעודד אותם להמשיך ללמוד.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- How it works -->
  <div class="section" style="background:#f8fafc">
    <div class="container">
      <h2 class="section-title">איך זה עובד?</h2>
      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div>
            <h3>בחרו קטגוריה</h3>
            <p>בחרו מתוך 13 קטגוריות כמו חיות, אוכל, צבעים, ספורט ועוד.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div>
            <h3>למדו מילים חדשות</h3>
            <p>כל מילה מוצגת עם תמונה, הגייה, הגדרה, משפט לדוגמה ותרגום לעברית.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div>
            <h3>התקדמו ואספו תגים</h3>
            <p>תרגלו עם חידונים, עקבו אחרי ההתקדמות ואספו תגים על ההישגים.</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Category grid -->
  <div class="section">
    <div class="container">
      <h2 class="section-title">13 קטגוריות ללמידה</h2>
      <div class="cat-grid">
        ${categoryGrid}
      </div>
    </div>
  </div>

  <!-- Testimonials -->
  <div class="section" style="background:#f8fafc">
    <div class="container">
      <h2 class="section-title">מה הורים אומרים?</h2>
      <div class="testimonials">
        <div class="testimonial">
          <p>&ldquo;הילדים שלי מכורים לחידוני התמונות! הם מבקשים לשחק כל יום אחרי בית הספר.&rdquo;</p>
          <span class="author">— שרה מ.</span>
        </div>
        <div class="testimonial">
          <p>&ldquo;סוף סוף אפליקציה ללימוד אנגלית שעובדת גם בעברית. מושלם למשפחה הדו-לשונית שלנו.&rdquo;</p>
          <span class="author">— יעל כ.</span>
        </div>
        <div class="testimonial">
          <p>&ldquo;פשוט, חינם, בלי פרסומות — בדיוק מה שחיפשתי. הבן שלי בן 7 למד 50 מילים חדשות בשבועיים.&rdquo;</p>
          <span class="author">— דוד ר.</span>
        </div>
      </div>
    </div>
  </div>

  <!-- FAQ -->
  <div class="section">
    <div class="container">
      <h2 class="section-title">שאלות נפוצות</h2>
      <div class="faq-list">
        <div class="faq-item">
          <div class="faq-q">האם האפליקציה באמת בחינם?</div>
          <div class="faq-a">כן! Children Do English היא אפליקציה חינמית לחלוטין, ללא פרסומות, ללא רכישות בתוך האפליקציה וללא צורך בהרשמה.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">לאיזה גיל מתאימה האפליקציה?</div>
          <div class="faq-a">האפליקציה מתאימה לילדים בגילאי 6-12. המילים מחולקות לשלוש רמות קושי (מתחיל, בינוני ומתקדם) כך שכל ילד יכול להתקדם בקצב שלו.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">כמה מילים יש באפליקציה?</div>
          <div class="faq-a">האפליקציה כוללת למעלה מ-340 מילים באנגלית ב-13 קטגוריות שונות, כולל חיות, אוכל, צבעים, ביגוד, רגשות, טבע, ספורט ועוד.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">האם יש תמיכה בעברית?</div>
          <div class="faq-a">כן! כל מילה כוללת תרגום לעברית, וממשק האפליקציה זמין בעברית מלאה. האפליקציה נבנתה במיוחד עבור ילדים דוברי עברית שלומדים אנגלית.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">איך הלמידה עובדת?</div>
          <div class="faq-a">הילדים לומדים דרך חידוני תמונות, כרטיסיות, אתגרי שמע ומשחקי התאמה. האפליקציה משתמשת בשיטת חזרה מרווחת כדי לוודא שהמילים נשמרות בזיכרון לטווח ארוך.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">האם האפליקציה עובדת ללא אינטרנט?</div>
          <div class="faq-a">כן! האפליקציה היא Progressive Web App ושומרת את התוכן במטמון לאחר הביקור הראשון, כך שהילדים יכולים ללמוד גם בלי חיבור לאינטרנט.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">האם כמה ילדים יכולים להשתמש באותו מכשיר?</div>
          <div class="faq-a">כן! האפליקציה תומכת בפרופילים מרובים כך שכל אח או אחות יכולים לעקוב אחרי ההתקדמות שלהם בנפרד באותו מכשיר.</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Final CTA -->
  <div class="final-cta">
    <h2>מוכנים להתחיל?</h2>
    <p>הצטרפו לאלפי ילדים שכבר לומדים אנגלית בכיף!</p>
    <a href="/?lang=he" class="cta-btn">התחילו ללמוד בחינם &#8592;</a>
  </div>

  <!-- Footer -->
  <div class="footer">
    &copy; ${new Date().getFullYear()} Children Do English &middot;
    <a href="/about/">אודות</a> &middot;
    <a href="/">English</a>
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

let wordPagesGenerated = 0;
for (const slug of CATEGORIES) {
  const displayName = CATEGORY_NAMES[slug] || slug;
  const words = getWordsByCategory(slug);
  for (const word of words) {
    const wordDir = join(distDir, 'vocabulary', slug, word.id);
    mkdirSync(wordDir, { recursive: true });
    writeFileSync(join(wordDir, 'index.html'), buildWordPage(word, slug, displayName, words), 'utf-8');
    wordPagesGenerated++;
  }
  console.log(`  ✓ /vocabulary/${slug}/ word pages (${words.length})`);
}
console.log(`  Total word pages: ${wordPagesGenerated}`);

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
  ${HREFLANG_HE}
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

// Only the homepage goes in the sitemap — SPA app screens are blocked in robots.txt
const spaEntries = `  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;

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

const wordEntries = CATEGORIES.flatMap((slug) =>
  getWordsByCategory(slug).map((w) => `  <url>
    <loc>${SITE}/vocabulary/${slug}/${w.id}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`)
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
  ${HREFLANG_HE}
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
  ${HREFLANG_HE}
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
  ${HREFLANG_HE}
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
  <li>Focus on concrete, everyday words: <a href="/vocabulary/animals/">animals</a>, <a href="/vocabulary/food/">food</a>, <a href="/vocabulary/colors/">colors</a>, <a href="/vocabulary/everyday/">everyday objects</a></li>
  <li>Use lots of pictures &mdash; kids this age are highly visual</li>
  <li>Keep sessions short (5 minutes max)</li>
  <li>Celebrate every small win to build confidence</li>
</ul>

<h3>Ages 8-10 (Intermediate)</h3>
<ul>
  <li>Introduce more abstract words: <a href="/vocabulary/feelings/">feelings</a>, <a href="/vocabulary/sports/">sports</a>, descriptions</li>
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
  {
    slug: 'learn-english-words-with-pictures',
    title: 'Learn English Words with Pictures — Visual Vocabulary for Kids',
    description: 'Help your child learn English words with pictures. Discover why visual vocabulary works for kids ages 6-12 and get free illustrated flashcards and quizzes.',
    h1: 'Learn English Words with Pictures',
    sections: [
      {
        h2: 'Why Pictures Help Kids Learn Words Faster',
        content: `<p>When a child sees a picture alongside a new word, their brain encodes the information through two channels at once &mdash; visual and verbal. This is called <strong>dual-coding theory</strong>, and decades of research show it dramatically improves retention.</p>
<p>Studies consistently find that learners who pair words with images retain <strong>up to 65% more vocabulary</strong> compared to text-only methods. For kids ages 6-12, the effect is even stronger because children are naturally visual learners &mdash; their brains are wired to process images quickly and attach meaning to what they see.</p>
<p>Picture-based learning also removes the translation bottleneck. Instead of going from English &rarr; native language &rarr; meaning, kids go from English + picture &rarr; meaning directly. This builds faster, more natural recall.</p>`,
      },
      {
        h2: 'The Best Picture Categories to Start With',
        content: `<p>Not all words are equally easy to illustrate. The best categories for picture-based learning are those with high <strong>visual concreteness</strong> &mdash; words that represent things kids can see and point to.</p>
<p>Start with these categories, ranked from most to least visually concrete:</p>
<ol>
  <li><strong><a href="/vocabulary/animals/">Animals</a></strong> &mdash; Highly visual, kids already love them</li>
  <li><strong><a href="/vocabulary/food/">Food</a></strong> &mdash; Everyday items kids recognize instantly</li>
  <li><strong><a href="/vocabulary/colors/">Colors</a></strong> &mdash; Abstract concept made concrete through images</li>
  <li><strong><a href="/vocabulary/toys/">Toys</a></strong> &mdash; High-interest items kids are motivated to learn</li>
  <li><strong><a href="/vocabulary/transport/">Transport</a></strong> &mdash; Vehicles are visually distinct and exciting</li>
  <li><strong><a href="/vocabulary/clothing/">Clothing</a></strong> &mdash; Practical, everyday vocabulary kids can point to</li>
</ol>
<p>Once your child masters concrete categories, move to more abstract ones like <a href="/vocabulary/feelings/">feelings</a> and <a href="/vocabulary/sports/">sports</a>, which still benefit from picture support.</p>`,
      },
      {
        h2: 'How to Use Picture Flashcards at Home',
        content: `<p>Flashcards with pictures are one of the simplest and most effective tools for building vocabulary. Here are tips to get the most out of them:</p>
<ul>
  <li><strong>Start small</strong> &mdash; Introduce 5 new picture cards per session, not 20</li>
  <li><strong>Say it aloud</strong> &mdash; Always have your child say the word while looking at the picture</li>
  <li><strong>Cover and recall</strong> &mdash; Cover the word, show only the picture, and ask "What's this?"</li>
  <li><strong>Sort by category</strong> &mdash; Mix cards from different categories and ask kids to sort them</li>
  <li><strong>Play memory match</strong> &mdash; Lay cards face down, flip two at a time to match picture + word</li>
</ul>
<p>You can <a href="/printable-flashcards/">download and print free flashcards</a> with pictures, phonetics, and Hebrew translations for every category.</p>`,
      },
      {
        h2: 'Picture Quizzes: From Passive to Active Learning',
        content: `<p>Looking at picture flashcards is passive learning. To move vocabulary into long-term memory, kids need to <strong>actively retrieve</strong> the word. That's where picture quizzes come in.</p>
<p><a href="/">Children Do English</a> offers four quiz modes that use pictures:</p>
<ul>
  <li><strong>Image Quiz</strong> &mdash; See a picture, pick the correct English word from four options</li>
  <li><strong>Word Quiz</strong> &mdash; See an English word, pick the matching picture</li>
  <li><strong>Audio Quiz</strong> &mdash; Hear a word, pick the matching picture</li>
  <li><strong>Flashcard Review</strong> &mdash; See the picture, try to recall the word before flipping</li>
</ul>
<p>Each mode uses pictures differently, giving the brain multiple retrieval pathways. Research shows that varied practice like this produces stronger, more flexible memories than repeating one method.</p>`,
      },
      {
        h2: 'Combining Pictures with Audio and Definitions',
        content: `<p>Pictures alone are powerful, but combining them with other senses creates even stronger memories. This is called <strong>multi-modal stacking</strong>.</p>
<p>The ideal learning sequence for a new word:</p>
<ol>
  <li><strong>See the picture</strong> &mdash; Create a visual anchor</li>
  <li><strong>Hear the pronunciation</strong> &mdash; Connect the sound to the image</li>
  <li><strong>Read the word</strong> &mdash; Link spelling to sound and image</li>
  <li><strong>Read the definition</strong> &mdash; Deepen understanding with context</li>
  <li><strong>See the Hebrew translation</strong> &mdash; Bridge to the known language (for bilingual families)</li>
</ol>
<p>Each layer reinforces the others. When your child hears "elephant" next week, their brain fires the picture, the sound, the spelling, and the meaning all at once &mdash; making recall almost effortless.</p>`,
      },
      {
        h2: 'Free Picture Vocabulary Resources',
        content: `<p>Ready to get started with picture-based vocabulary learning? Here are free resources:</p>
<ul>
  <li><strong><a href="/">Children Do English App</a></strong> &mdash; ${WORDS.length} words with pictures, audio, definitions, and quizzes. Free, no ads, works offline.</li>
  <li><strong><a href="/vocabulary/">Browse All Categories</a></strong> &mdash; Explore ${CATEGORIES.length} vocabulary categories with pictures and pronunciation</li>
  <li><strong><a href="/printable-flashcards/">Printable Flashcards</a></strong> &mdash; Download and print picture flashcards for offline practice</li>
</ul>
<p>Start with just one category today. Five minutes of picture-based practice is worth more than thirty minutes of word lists.</p>`,
      },
    ],
  },
  {
    slug: 'english-vocabulary-games-for-kids',
    title: 'English Vocabulary Games for Kids — Fun Ways to Learn New Words',
    description: 'Discover the best English vocabulary games for kids ages 6-12. Free word games, quizzes, and challenges that make learning fun. No ads, works offline.',
    h1: 'English Vocabulary Games for Kids',
    sections: [
      {
        h2: 'Why Games Work Better Than Worksheets',
        content: `<p>When kids play games, their brains release dopamine &mdash; the same chemical that makes them want to play "just one more round." This isn't just fun; it's <strong>neurologically powerful</strong>. Dopamine strengthens memory formation, meaning words learned during a game are remembered better and longer.</p>
<p>Games provide something worksheets can't: <strong>intrinsic motivation</strong>. Kids don't play games because they're told to &mdash; they play because they want to. When vocabulary practice feels like a game, you don't have to convince your child to study. They'll ask to play.</p>
<p>Research shows that game-based learning improves vocabulary retention by 40-60% compared to traditional methods, while also reducing the anxiety many children feel around language learning.</p>`,
      },
      {
        h2: 'Image Matching Games',
        content: `<p>The simplest and most effective vocabulary game: show a picture and ask "What's this word?"</p>
<p>Image matching games work because they test <strong>recognition and recall</strong> simultaneously. The child sees a visual cue and must connect it to the right English word &mdash; exactly the skill they need in real life.</p>
<p><strong>How to play at home:</strong></p>
<ul>
  <li><strong>Digital version</strong> &mdash; Use the Image Quiz in <a href="/">Children Do English</a>: see a picture, pick from 4 word options</li>
  <li><strong>Printable version</strong> &mdash; Spread out printed flashcards, call out a word, and race to find the matching picture</li>
  <li><strong>Around-the-house version</strong> &mdash; Point to real objects and ask for the English word</li>
</ul>
<p>Start with high-interest categories like <a href="/vocabulary/animals/">animals</a> and <a href="/vocabulary/food/">food</a> &mdash; kids learn faster when they care about the subject.</p>`,
      },
      {
        h2: 'Audio Challenge Games',
        content: `<p>Audio games add a crucial dimension: <strong>listening skills</strong>. Kids hear a word pronounced correctly and must identify it &mdash; building the connection between sound and meaning.</p>
<p><strong>Game ideas:</strong></p>
<ul>
  <li><strong>Audio Quiz</strong> &mdash; Hear a word, pick the matching picture from four options. Great for building listening comprehension.</li>
  <li><strong>Repeat Race</strong> &mdash; Play an audio clip, both parent and child repeat it. Who can pronounce it more clearly?</li>
  <li><strong>Sound Detective</strong> &mdash; Play the audio without showing any options. Can the child spell or draw the word they heard?</li>
</ul>
<p>Audio challenges are especially valuable for children who are visual learners &mdash; it forces the brain to build a different (auditory) pathway to the same vocabulary, making recall more robust.</p>`,
      },
      {
        h2: 'Streak and Badge Challenges',
        content: `<p>Consistency is more important than intensity when learning vocabulary. <strong>Streaks and badges</strong> turn consistency into a game.</p>
<p><strong>How streak challenges work:</strong></p>
<ul>
  <li>Practice every day to build a streak (1 day, 3 days, 7 days, 30 days&hellip;)</li>
  <li>Each milestone earns a badge or achievement</li>
  <li>Missing a day resets the streak &mdash; creating gentle motivation to keep going</li>
</ul>
<p><strong>Family competition ideas:</strong></p>
<ul>
  <li><strong>Sibling streak race</strong> &mdash; Who can maintain the longest practice streak?</li>
  <li><strong>Family word of the day</strong> &mdash; Everyone learns the same word; quiz each other at dinner</li>
  <li><strong>Weekly vocabulary champion</strong> &mdash; Who scored highest on quizzes this week?</li>
</ul>
<p><a href="/">Children Do English</a> tracks streaks, badges, and progress automatically &mdash; with separate player profiles so siblings can compete on the same device.</p>`,
      },
      {
        h2: 'Printable Word Games You Can Play Anywhere',
        content: `<p>Screen-free games are perfect for car rides, waiting rooms, or quiet time. <a href="/printable-flashcards/">Download free printable flashcards</a> and try these games:</p>
<ul>
  <li><strong>Memory Match</strong> &mdash; Print two copies of a flashcard set. Place face down, flip pairs to match word + picture. Great for 2 players.</li>
  <li><strong>Speed Naming</strong> &mdash; Shuffle a stack of picture flashcards. Flip one at a time and say the English word as fast as you can. Time yourself and try to beat your record.</li>
  <li><strong>Category Race</strong> &mdash; Spread cards from 3 categories on a table. Call out a category and race to grab all the matching cards.</li>
  <li><strong>Spelling Bee</strong> &mdash; One player shows a picture card. The other must say the word and spell it correctly.</li>
</ul>
<p>Printable games are especially useful for younger kids (ages 6-8) who benefit from tactile, hands-on practice.</p>`,
      },
      {
        h2: 'The Best Free Vocabulary Game App for Kids',
        content: `<p><a href="/">Children Do English</a> turns vocabulary learning into a game, with every feature designed for kids ages 6-12:</p>
<ul>
  <li><strong>${WORDS.length} words</strong> across ${CATEGORIES.length} categories &mdash; from animals to weather</li>
  <li><strong>4 game modes</strong> &mdash; Image quiz, word quiz, audio challenge, and flashcard review</li>
  <li><strong>Streaks &amp; badges</strong> &mdash; Kids earn achievements and compete with siblings</li>
  <li><strong>Spaced repetition</strong> &mdash; Smart review system that focuses on words that need practice</li>
  <li><strong>Hebrew translations</strong> &mdash; Built for bilingual Hebrew-English families</li>
  <li><strong>Multiple profiles</strong> &mdash; Each child gets their own progress on the same device</li>
  <li><strong>100% free, no ads</strong> &mdash; No paywalls, no in-app purchases, no distractions</li>
  <li><strong>Works offline</strong> &mdash; Download once, play anywhere</li>
</ul>
<p>Give your child 5 minutes of vocabulary games today and watch how quickly they start asking for more.</p>`,
      },
    ],
  },
  {
    slug: 'english-vocabulary-for-bilingual-hebrew-english-kids',
    title: 'English Vocabulary for Bilingual Hebrew-English Kids — A Parent\'s Guide',
    description: 'Help your bilingual Hebrew-English child build English vocabulary. 342 words with Hebrew translations, phonetics, and pictures. Free app for kids 6-12.',
    h1: 'English Vocabulary for Bilingual Hebrew-English Kids',
    sections: [
      {
        h2: 'The Bilingual Advantage',
        content: `<p>Growing up bilingual in Hebrew and English gives children a remarkable cognitive edge. Research consistently shows that bilingual kids develop <strong>stronger executive function</strong>, better problem-solving skills, and greater mental flexibility compared to monolingual peers.</p>
<p>For Hebrew-English children specifically, the advantages are compounded by learning two very different writing systems and language structures. Navigating between right-to-left Hebrew and left-to-right English builds <strong>visual-spatial awareness</strong> and <strong>cognitive switching</strong> abilities that benefit kids across all academic subjects.</p>
<p>But these benefits only emerge when both languages are actively developed. Without structured English vocabulary practice, Hebrew-dominant children can fall behind in English reading and comprehension &mdash; even if they understand spoken English well.</p>`,
      },
      {
        h2: 'Common Challenges Hebrew-Speaking Kids Face with English',
        content: `<p>Hebrew and English differ in fundamental ways that can trip up young learners:</p>
<ul>
  <li><strong>Reading direction</strong> &mdash; Switching from right-to-left (Hebrew) to left-to-right (English) is a major cognitive shift, especially for early readers</li>
  <li><strong>Vowel systems</strong> &mdash; Hebrew has 5 vowel sounds; English has 15+. Kids often struggle with sounds like the "a" in "cat" vs. "cake" vs. "car"</li>
  <li><strong>Phonetic inconsistency</strong> &mdash; Hebrew spelling is mostly phonetic; English is famously irregular ("though," "through," "thought")</li>
  <li><strong>False friends</strong> &mdash; Some words sound similar but mean different things. Hebrew "dog" (דג) means "fish" in English!</li>
  <li><strong>The "th" sound</strong> &mdash; This sound doesn't exist in Hebrew and requires specific practice</li>
</ul>
<p>Understanding these challenges helps parents provide targeted support rather than generic vocabulary drill.</p>`,
      },
      {
        h2: 'Using Hebrew Translations as a Bridge, Not a Crutch',
        content: `<p>Hebrew translations are incredibly useful for initial word learning &mdash; they give kids an instant anchor for new English vocabulary. But the goal is to <strong>progressively withdraw</strong> the translation so the child thinks in English directly.</p>
<p><strong>The bridge strategy:</strong></p>
<ol>
  <li><strong>Week 1:</strong> Learn new words with picture + English word + Hebrew translation. The translation provides instant understanding.</li>
  <li><strong>Week 2:</strong> Practice with picture + English word only. The translation is available if needed but not shown by default.</li>
  <li><strong>Week 3:</strong> Quiz mode &mdash; see the picture, produce the English word from memory. No translation at all.</li>
  <li><strong>Week 4+:</strong> Encounter the word in different contexts (audio quiz, flashcard review) without translation support.</li>
</ol>
<p>This gradual approach respects the child's need for Hebrew support while building independent English vocabulary over time.</p>`,
      },
      {
        h2: 'Which Categories to Start With',
        content: `<p>For Hebrew-English bilingual kids, the smartest starting strategy is to begin with <strong>cognates and loanwords</strong> &mdash; words that sound similar in both languages. This gives kids quick wins and builds confidence.</p>
<p><strong>High-cognate categories (easiest):</strong></p>
<ul>
  <li><a href="/vocabulary/food/">Food</a> &mdash; Many international food words overlap (chocolate, pizza, banana)</li>
  <li><a href="/vocabulary/transport/">Transport</a> &mdash; Similar words (bus, taxi, helicopter)</li>
  <li><a href="/vocabulary/sports/">Sports</a> &mdash; Shared vocabulary (football, basketball, tennis)</li>
</ul>
<p><strong>High-interest categories (most motivating):</strong></p>
<ul>
  <li><a href="/vocabulary/animals/">Animals</a> &mdash; Universal kid appeal</li>
  <li><a href="/vocabulary/toys/">Toys</a> &mdash; Words kids want to know</li>
  <li><a href="/vocabulary/colors/">Colors</a> &mdash; Fundamental and practical</li>
</ul>
<p>Browse all <a href="/vocabulary/">${CATEGORIES.length} vocabulary categories</a> to find what excites your child most.</p>`,
      },
      {
        h2: 'Daily Practice Routine for Bilingual Families',
        content: `<p>A structured 10-minute daily routine makes a huge difference for bilingual vocabulary development:</p>
<ol>
  <li><strong>Review (2 min):</strong> Open <a href="/">the app</a> and complete the daily review. Words due for spaced repetition appear automatically.</li>
  <li><strong>New words (3 min):</strong> Explore one category and learn 3-5 new words. Read the English word, listen to pronunciation, check the Hebrew translation.</li>
  <li><strong>Quiz (3 min):</strong> Take a quick image quiz or audio challenge on today's words.</li>
  <li><strong>Bilingual chat (2 min):</strong> Use one of the new words in an English sentence at dinner. Siblings can quiz each other.</li>
</ol>
<p><strong>Pro tips for bilingual families:</strong></p>
<ul>
  <li>Designate "English time" &mdash; even 10 minutes where only English is spoken</li>
  <li>Label objects around the house with English words</li>
  <li>Let kids teach their new English words to Hebrew-speaking grandparents</li>
  <li>Use <a href="/printable-flashcards/">printable flashcards</a> on the fridge as a passive reminder</li>
</ul>`,
      },
      {
        h2: 'A Free App Built for Hebrew-English Families',
        content: `<p><a href="/">Children Do English</a> was specifically designed for bilingual Hebrew-English families. Every feature considers the needs of children navigating two languages:</p>
<ul>
  <li><strong>${WORDS.length} words with Hebrew translations</strong> &mdash; Every word includes an accurate Hebrew translation alongside the English definition</li>
  <li><strong>Phonetic pronunciation</strong> &mdash; IPA-based phonetics help kids pronounce English sounds that don't exist in Hebrew</li>
  <li><strong>Picture-based learning</strong> &mdash; Visual anchors reduce reliance on translation</li>
  <li><strong>Audio pronunciation</strong> &mdash; Native-quality speech synthesis for every word</li>
  <li><strong>Spaced repetition</strong> &mdash; Smart scheduling so kids review words right before they'd forget</li>
  <li><strong>Multiple player profiles</strong> &mdash; Siblings can each have their own progress</li>
  <li><strong>100% free, no ads</strong> &mdash; No paywalls or distractions</li>
  <li><strong>Works offline</strong> &mdash; Practice anywhere, no internet needed</li>
</ul>
<p>Start building your child's English vocabulary today &mdash; with the Hebrew support they need and the gradual independence they'll develop.</p>`,
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

  const faqSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.sections.map((s) => ({
      '@type': 'Question',
      name: s.h2,
      acceptedAnswer: {
        '@type': 'Answer',
        text: s.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      },
    })),
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
  ${HREFLANG_HE}
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
  <script type="application/ld+json">${faqSchema}</script>

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
  ${HREFLANG_HE}
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

// --- Generate Hebrew landing page ---

const heDir = join(distDir, 'he');
mkdirSync(heDir, { recursive: true });
writeFileSync(join(heDir, 'index.html'), buildHebrewLandingPage(), 'utf-8');
console.log('  \u2713 /he/ (Hebrew landing page)');

// --- Overwrite sitemap.xml ---

const heEntry = `  <url>
    <loc>${SITE}/he/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`;

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
${heEntry}
${vocabIndexEntry}
${vocabEntries}
${wordEntries}
${aboutEntry}
${fcIndexEntry}
${fcEntries}
${guidesIndexEntry}
${guideEntries}
</urlset>
`;

writeFileSync(join(distDir, 'sitemap.xml'), sitemap, 'utf-8');

const totalUrls = 1 + 1 + 1 + CATEGORIES.length + WORDS.length + 1 + 1 + CATEGORIES.length + 1 + GUIDES.length;
console.log(`\nGenerated ${generated} vocab pages + ${flashcardsGenerated} flashcard pages + ${GUIDES.length} guides + indexes + about + Hebrew landing`);
console.log(`Sitemap: ${totalUrls} URLs`);
