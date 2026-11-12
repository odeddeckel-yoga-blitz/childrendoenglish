// he-headterms SEO title test (prepared 11-12, not shipped): the /he/ landing's head-term titles applied to
// half of the other /he/* pages (arm "test"), the other half an unchanged holdout. Everything sits behind
// HE_HEADTERM_TEST in scripts/generate-seo-pages.js; CDE_HE_HEADTERM_TEST=1 turns it on for this test only.
//  1. Flag off: the build is the one before the test (checked 11-12: whole SEO dist byte-identical to
//     origin/main 402aae0); here, every page equals the flag-on build except the test pages' head tags.
//  2. Flag on: only the test pages change, and only title / description (+ og / twitter copies).
//  3. Copy rules: title <= 60, description <= 155, no Latin letters in the Hebrew part of the title (plain-text
//     title, no bidi isolation possible), no native-speaker claims, holdout carries no applied copy.
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'child_process';
import process from 'process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const OVERRIDES = JSON.parse(readFileSync(join(ROOT, 'scripts', 'seo-title-overrides.json'), 'utf8'));
const ENTRIES = Object.entries(OVERRIDES).filter(([, o]) => o.test === 'he-headterms');
const TEST = ENTRIES.filter(([, o]) => o.arm === 'test').map(([p]) => p);
const HOLDOUT = ENTRIES.filter(([, o]) => o.arm === 'holdout').map(([p]) => p);
const BRAND = ' | Children Do English';

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.html') ? [join(dir, d.name)] : []);
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const titleOf = (html) => unesc((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
const descOf = (html) => unesc((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
// Head tags that carry the title / description; everything else on a test page must not move.
const HEAD_COPY = /^\s*<(title>|meta (name="description"|property="og:(title|description)"|name="twitter:(title|description)")).*$/gm;

function build(on) {
  const dist = mkdtempSync(join(tmpdir(), `cde-headterm-${on ? 'on' : 'off'}-`));
  const env = { ...process.env, CDE_SEO_DIST: dist };
  delete env.CDE_HE_HEADTERM_TEST;
  if (on) env.CDE_HE_HEADTERM_TEST = '1';
  execFileSync('node', [join(ROOT, 'scripts', 'generate-seo-pages.js')], { cwd: ROOT, env, stdio: 'pipe' });
  const pages = new Map();
  for (const f of walk(dist)) pages.set('/' + relative(dist, f).replace(/index\.html$/, ''), readFileSync(f, 'utf8'));
  rmSync(dist, { recursive: true, force: true });
  return pages;
}

let off, on;
beforeAll(() => {
  off = build(false);
  on = build(true);
}, 360_000);

describe('he-headterms: setup', () => {
  it('ships OFF: the flag in the generator is false', () => {
    const src = readFileSync(join(ROOT, 'scripts', 'generate-seo-pages.js'), 'utf8');
    expect(src).toMatch(/^const HE_HEADTERM_TEST = false;$/m);
  });
  it('has a test arm and a holdout arm, each a real /he/* page', () => {
    expect(TEST.length).toBeGreaterThan(0);
    expect(HOLDOUT.length).toBeGreaterThan(0);
    expect(Math.abs(TEST.length - HOLDOUT.length)).toBeLessThanOrEqual(1);
    for (const [p, o] of ENTRIES) {
      expect(p.startsWith('/he/') && p !== '/he/', p).toBe(true);
      expect(['test', 'holdout']).toContain(o.arm);
      expect(off.has(p), `${p} is built`).toBe(true);
    }
  });
  it('the holdout carries no copy the build could apply', () => {
    for (const p of HOLDOUT) {
      expect(OVERRIDES[p].title, p).toBeUndefined();
      expect(OVERRIDES[p].description, p).toBeUndefined();
    }
  });
});

describe('he-headterms: flag off', () => {
  it('no page uses a test title or description', () => {
    for (const p of TEST) {
      expect(titleOf(off.get(p)), p).not.toBe(titleOf(on.get(p)));
      expect(descOf(off.get(p)), p).not.toBe(descOf(on.get(p)));
    }
  });
  it('every page outside the test arm is identical to the flag-on build', () => {
    const changed = [...off.keys()].filter((p) => off.get(p) !== on.get(p));
    expect(changed.sort()).toEqual([...TEST].sort());
    expect([...on.keys()].sort()).toEqual([...off.keys()].sort());
  });
});

describe('he-headterms: flag on', () => {
  it('test pages change only their title / description head tags', () => {
    for (const p of TEST) {
      expect(on.get(p).replace(HEAD_COPY, ''), p).toBe(off.get(p).replace(HEAD_COPY, ''));
      const t = titleOf(on.get(p));
      const d = descOf(on.get(p));
      for (const line of on.get(p).match(HEAD_COPY)) expect(unesc(line).includes(t) || unesc(line).includes(d), `${p}: ${line}`).toBe(true);
    }
  });
  it('titles and descriptions follow the copy rules', () => {
    for (const p of TEST) {
      const t = titleOf(on.get(p));
      const d = descOf(on.get(p));
      expect(t, p).toBe(OVERRIDES[p].title);
      expect(t.length, `${p}: ${t}`).toBeLessThanOrEqual(60);
      expect(d.length, `${p}: ${d}`).toBeLessThanOrEqual(155);
      expect(t.endsWith(BRAND), p).toBe(true);
      expect(t.slice(0, -BRAND.length), `${p}: Latin text in a plain-text RTL title`).not.toMatch(/[A-Za-z]/);
      expect(t + d, p).not.toMatch(/[{}]|native|דובר שפת אם|דוברי שפת אם/i);
    }
  });
  it('the holdout drafts (for a later roll-out) follow the same rules', () => {
    for (const p of HOLDOUT) {
      const { proposed_title: t, proposed_description: d } = OVERRIDES[p];
      expect(t.length, p).toBeLessThanOrEqual(60);
      expect(d.replace(/\{n\}/g, '000').replace(/\{PICS?\}/g, 'תמונות').length, p).toBeLessThanOrEqual(155);
      expect(t.slice(0, -BRAND.length), p).not.toMatch(/[A-Za-z]/);
      expect(t + d, p).not.toMatch(/native|דובר שפת אם/i);
    }
  });
});
