import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, relative } from 'path';
import * as espree from 'espree';

// Static pages load public/*.js as-is (no transpile). School Chromebooks and old iPads below Chrome 80 / Safari 13.1
// throw a SyntaxError on ES2020 syntax (??, ?.) and lose the whole file: component-clicks.js did this on ~30 page loads
// a week (jserrsig component-clicks_92_syntax, 11-20). Every public script must parse as ES2019.
const PUB = resolve(import.meta.dirname, '../../public');
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (!['images', 'audio', 'img'].includes(f)) walk(p, out); }
    else if (f.endsWith('.js') && !f.endsWith('.min.js') && statSync(p).size < 400_000) out.push(p);
  }
  return out;
}

describe('public scripts parse in older school browsers (ES2019)', () => {
  it('no ES2020+ syntax in any public/*.js', () => {
    const bad = [];
    for (const f of walk(PUB)) {
      const src = readFileSync(f, 'utf-8');
      const sourceType = /^\s*(import|export)\s/m.test(src) ? 'module' : 'script';
      try { espree.parse(src, { ecmaVersion: 2019, sourceType }); } catch (e) { bad.push(`${relative(PUB, f)}:${e.lineNumber} ${e.message}`); }
    }
    expect(bad).toEqual([]);
  });
});
