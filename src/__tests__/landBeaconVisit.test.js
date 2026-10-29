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
const visits = () => run().filter((x) => x.e === 'vis');

describe('land-beacon return-visit bucket', () => {
  beforeEach(() => { localStorage.clear(); });

  it('first ever visit → new, stores today', () => {
    expect(visits()).toEqual([{ e: 'vis', i: 'new' }]);
    expect(localStorage.getItem('cde_seen')).toBe(ymd(new Date()));
  });
  it('same day → nothing sent', () => {
    localStorage.setItem('cde_seen', ymd(new Date()));
    expect(visits()).toEqual([]);
  });
  it.each([[1, 'r1'], [3, 'r2-7'], [7, 'r2-7'], [8, 'r8-30'], [30, 'r8-30'], [45, 'r31p']])(
    '%i days ago → %s', (n, b) => {
      localStorage.setItem('cde_seen', daysAgo(n));
      expect(visits()).toEqual([{ e: 'vis', i: b }]);
    });
  it('pre-launch app state, no date → rpre', () => {
    localStorage.setItem('childrendoenglish-players', '[]');
    expect(visits()).toEqual([{ e: 'vis', i: 'rpre' }]);
  });
  it('owner-internal browser → nothing sent', () => {
    localStorage.setItem('cde_internal', '1');
    expect(run()).toEqual([]);
  });
});

// Per-page click-to-play: pg on load, cta on the first link into the app/a game,
// mq on the first mini-quiz tap — static pages only (the SPA has #root).
describe('land-beacon per-page play clicks', () => {
  let handler;
  function load(path, html = '') {
    localStorage.clear();
    localStorage.setItem('cde_seen', ymd(new Date()));
    window.history.replaceState(null, '', path);
    document.body.innerHTML = html;
    const add = vi.spyOn(document, 'addEventListener');
    const sent = run();
    handler = add.mock.calls.filter((c) => c[0] === 'click').map((c) => c[1]).at(-1);
    add.mockRestore();
    return sent;
  }
  const click = (sel) => { const sent = []; navigator.sendBeacon = vi.fn((u, b) => { sent.push(JSON.parse(b).batch[0]); return true; }); handler({ target: document.querySelector(sel) }); return sent; };

  it('keys the page by path; all word pages share one key', () => {
    expect(load('/vocabulary/ages-6-8/')).toEqual([{ e: 'pg', i: 'vocabulary_ages-6-8' }]);
    expect(load('/vocabulary/animals/dog/')).toEqual([{ e: 'pg', i: 'vocabulary_word' }]);
    expect(load('/vocabulary/animals/spanish/')).toEqual([{ e: 'pg', i: 'vocabulary_animals_spanish' }]);
  });
  it('counts one cta for a link into the app or a game, none for other links', () => {
    load('/games/', '<a id="hub" href="/games/">hub</a><a id="g" href="/games/word-zapper/">play</a><a id="v" href="/vocabulary/">words</a><a id="h" href="/?utm_source=seo">home</a>');
    expect(click('#hub')).toEqual([]);
    expect(click('#v')).toEqual([]);
    expect(click('#g')).toEqual([{ e: 'cta', i: 'games' }]);
    expect(click('#h')).toEqual([]); // once per page view
  });
  it('first mini-quiz tap → mq, once', () => {
    load('/vocabulary/ages-6-8/', '<div class="mini-quiz"><button class="mq-opt"><img id="o"></button></div>');
    expect(click('#o')).toEqual([{ e: 'mq', i: 'vocabulary_ages-6-8' }]);
    expect(click('#o')).toEqual([]);
  });
  it('the SPA (#root) sends no page key', () => {
    expect(load('/app', '<div id="root"></div>')).toEqual([]);
  });
});
