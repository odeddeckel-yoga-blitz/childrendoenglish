// Words that are in the app but held off every generated page, and out of WORD_COUNT, until the 11-14 SEO read:
// even 8 words moved the counts on 576 pages, the /he/ test pages among them. Delete after that read (with
// SEO_TEST_HOLDOUT in scripts/generate-seo-pages.js).
// Released 11-14 after the SEO read (owner OK): every word has its pages. Keep the export for the next held batch.
export const PAGES_HOLD = new Set();
