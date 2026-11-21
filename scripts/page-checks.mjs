// Structural checks run by the postbuild validator (scripts/validate-schema.mjs) on every built page.
const LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

// Returns an error string, or null. A page needs >=1 JSON-LD block (parse errors are reported separately).
export function missingJsonLd(html) {
  return [...html.matchAll(LD)].length ? null : 'no JSON-LD block';
}

// The home page must have exactly one <h1> (the static shell mirrors the React hero; noscript copy uses h2).
export function homeH1Error(html) {
  const n = (html.match(/<h1[\s>]/g) || []).length;
  return n === 1 ? null : `home page has ${n} <h1> (need exactly 1)`;
}
