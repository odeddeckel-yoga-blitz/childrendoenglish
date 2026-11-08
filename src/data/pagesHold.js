// Words that are in the app but held off every generated page, and out of WORD_COUNT, until the 11-14 SEO read:
// even 8 words moved the counts on 576 pages, the /he/ test pages among them. Delete after that read (with
// SEO_TEST_HOLDOUT in scripts/generate-seo-pages.js).
export const PAGES_HOLD = new Set([
  // 1,000-word plan batch 1 (11-07): the teens and tens
  'thirteen', 'fourteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'seventy', 'eighty',
  // batch 1 photo words (owner picks 11-08, Pixabay)
  'bottle', 'bridge', 'cage', 'castle', 'cinema', 'city', 'cloud', 'farm', 'flour', 'fly', 'golf', 'mechanic', 'paper', 'path', 'plant', 'pyramid', 'snow', 'speaker', 'stadium', 'storm',
  'cereal', 'circle', 'rock', 'shower', 'wave',
]);
