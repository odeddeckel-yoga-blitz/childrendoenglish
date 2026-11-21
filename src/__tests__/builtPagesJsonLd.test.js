// GEO audit 11-21: every built static page carries >=1 parseable JSON-LD block, and the home has exactly one <h1>.
// Reads dist/ (run `npm run build` first; skipped when there is no build).
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
// intentional exclusions: error page (3 h1 by design, noindex, no canonical content)
const EXCLUDE = new Set(['404.html']);

function* htmlFiles(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (f.endsWith('.html')) yield p;
  }
}

describe.skipIf(!existsSync(DIST))('built pages', () => {
  it('every page has at least one parseable JSON-LD block', () => {
    const bad = [];
    for (const file of htmlFiles(DIST)) {
      const rel = file.slice(DIST.length + 1);
      if (EXCLUDE.has(rel)) continue;
      const html = readFileSync(file, 'utf8');
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      let ok = blocks.length > 0;
      for (const b of blocks) { try { JSON.parse(b[1]); } catch { ok = false; } }
      if (!ok) bad.push(rel);
    }
    expect(bad).toEqual([]);
  });

  it('the home page has exactly one h1', () => {
    const html = readFileSync(join(DIST, 'index.html'), 'utf8');
    expect((html.match(/<h1[\s>]/g) || []).length).toBe(1);
  });
});
