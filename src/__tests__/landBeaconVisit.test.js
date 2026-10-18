// public/land-beacon.js return-visit bucket (Engagement Optimizer): once per
// local day, stores only the last-visit date, sends only a coarse bucket.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = fs.readFileSync(path.resolve(import.meta.dirname, '../../public/land-beacon.js'), 'utf8');
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };

function run() {
  const sent = [];
  navigator.sendBeacon = vi.fn((url, body) => { sent.push(JSON.parse(body)); return true; });
  new Function(SRC)();
  return sent.filter((b) => b.batch).map((b) => b.batch[0]);
}

describe('land-beacon return-visit bucket', () => {
  beforeEach(() => { localStorage.clear(); });

  it('first ever visit → new, stores today', () => {
    expect(run()).toEqual([{ e: 'vis', i: 'new' }]);
    expect(localStorage.getItem('cde_seen')).toBe(ymd(new Date()));
  });
  it('same day → nothing sent', () => {
    localStorage.setItem('cde_seen', ymd(new Date()));
    expect(run()).toEqual([]);
  });
  it.each([[1, 'r1'], [3, 'r2-7'], [7, 'r2-7'], [8, 'r8-30'], [30, 'r8-30'], [45, 'r31p']])(
    '%i days ago → %s', (n, b) => {
      localStorage.setItem('cde_seen', daysAgo(n));
      expect(run()).toEqual([{ e: 'vis', i: b }]);
    });
  it('pre-launch app state, no date → rpre', () => {
    localStorage.setItem('childrendoenglish-players', '[]');
    expect(run()).toEqual([{ e: 'vis', i: 'rpre' }]);
  });
  it('owner-internal browser → nothing sent', () => {
    localStorage.setItem('cde_internal', '1');
    expect(run()).toEqual([]);
  });
});
