// Minimal page-level JSON-LD for static pages that had none (GEO audit 11-21).
// Only verifiable fields: name, description, url, inLanguage, isPartOf WebSite, provider Organization,
// isAccessibleForFree, audience age 6-12. No ratings, counts or audio-origin claims.
const SITE = 'https://childrendoenglish.com';
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
export function pageLd({ type = 'WebPage', name, description, path, inLanguage = 'en', kids = true, learning = false }) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': learning ? [type, 'LearningResource'] : type,
    name: unesc(name),
    description: unesc(description),
    url: `${SITE}${path}`,
    inLanguage,
    isAccessibleForFree: true,
    isPartOf: { '@type': 'WebSite', name: 'Children Do English', url: `${SITE}/` },
    provider: { '@type': 'Organization', name: 'Children Do English', url: SITE },
  };
  if (kids) ld.audience = { '@type': 'PeopleAudience', suggestedMinAge: 6, suggestedMaxAge: 12 };
  if (learning) ld.learningResourceType = 'worksheet';
  // "<" escaped so a title can never close the script tag
  return `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
}
