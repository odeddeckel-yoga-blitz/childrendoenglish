// GEO audit 11-21: the postbuild validator (scripts/validate-schema.mjs) fails the build on a page with no JSON-LD
// or a home with != 1 h1. These are unit tests of those checks on fixture HTML.
import { describe, it, expect } from 'vitest';
import { missingJsonLd, homeH1Error } from '../../scripts/page-checks.mjs';

describe('page checks', () => {
  it('flags a page without JSON-LD, accepts one with it', () => {
    expect(missingJsonLd('<html><head><title>x</title></head></html>')).toBeTruthy();
    expect(missingJsonLd('<head><script type="application/ld+json">{"@type":"WebPage"}</script></head>')).toBeNull();
  });
  it('requires exactly one h1 on the home', () => {
    expect(homeH1Error('<h1 style="a">A</h1><noscript><h1>A</h1></noscript>')).toMatch(/2 <h1>/);
    expect(homeH1Error('<p>no heading</p>')).toMatch(/0 <h1>/);
    expect(homeH1Error('<h1 style="a">A</h1><noscript><h2>A</h2></noscript>')).toBeNull();
  });
});
