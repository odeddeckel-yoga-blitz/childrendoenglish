// Every SPA screen path (App.jsx STATE_TO_PATH) needs a vercel.json rewrite to
// "/" — without one a reload, a PWA reopen or a shared link 404s. /letters
// shipped without it and 404'd on direct load until 2026-10-29.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '../..');
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));

describe('SPA routes', () => {
  it('every STATE_TO_PATH path has a rewrite to /', () => {
    const block = app.match(/const STATE_TO_PATH = \{([\s\S]*?)\};/)[1];
    const paths = [...block.matchAll(/'(\/[^']*)'/g)].map((m) => m[1]).filter((p) => p !== '/');
    expect(paths.length).toBeGreaterThan(10);
    const rewritten = new Set(vercel.rewrites.filter((r) => r.destination === '/').map((r) => r.source));
    expect(paths.filter((p) => !rewritten.has(p))).toEqual([]);
  });
});
