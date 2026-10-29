// public/land-beacon.js return-visit bucket (Engagement Optimizer): once per
// local day, stores only the last-visit date, sends only a coarse bucket.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

// AI attribution v1 (kit land-beacon.md): aie = engine with the ai open; aiv once
// the page has been visible 5 s in total (paused while hidden), once.
describe('land-beacon AI attribution', () => {
  const ref = Object.getOwnPropertyDescriptor(Document.prototype, 'referrer');
  const vis = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
  let state = 'visible';
  function land(referrer, search = '') {
    localStorage.clear();
    localStorage.setItem('cde_seen', ymd(new Date()));
    window.history.replaceState(null, '', '/' + search);
    Object.defineProperty(document, 'referrer', { configurable: true, get: () => referrer });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
    const sent = [];
    navigator.sendBeacon = vi.fn((url, body) => { sent.push(JSON.parse(body)); return true; });
    const add = vi.spyOn(document, 'addEventListener');
    new Function(SRC)();
    added.push(...add.mock.calls);
    add.mockRestore();
    return sent;
  }
  const added = []; // each load's listeners — removed after the test so loads don't leak into each other
  const ai = (sent) => sent.filter((b) => b.batch && /^ai[ev]$/.test(b.batch[0].e)).map((b) => `${b.batch[0].e}_${b.batch[0].i}`);
  beforeEach(() => { vi.useFakeTimers(); state = 'visible'; });
  afterEach(() => {
    for (const [type, fn, opt] of added.splice(0)) document.removeEventListener(type, fn, opt);
    vi.useRealTimers();
    delete document.referrer; delete document.visibilityState;
    if (ref) Object.defineProperty(Document.prototype, 'referrer', ref);
    if (vis) Object.defineProperty(Document.prototype, 'visibilityState', vis);
  });

  it('a 6 s ChatGPT visit: the ai open unchanged + aie + aiv', () => {
    const sent = land('https://chatgpt.com/');
    expect(sent[0]).toMatchObject({ s: 'ai' });
    expect(ai(sent)).toEqual(['aie_chatgpt']);
    vi.advanceTimersByTime(6000);
    expect(ai(sent)).toEqual(['aie_chatgpt', 'aiv_chatgpt']);
  });
  it('engine from utm_source when the referrer is stripped; a 2 s bounce gets no aiv', () => {
    const sent = land('', '?utm_source=perplexity.ai');
    vi.advanceTimersByTime(2000);
    expect(ai(sent)).toEqual(['aie_perplexity']);
  });
  it('hidden time does not count, and aiv fires once', () => {
    const sent = land('https://gemini.google.com/');
    vi.advanceTimersByTime(3000);
    state = 'hidden'; document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(60000);
    expect(ai(sent)).toEqual(['aie_gemini']);
    state = 'visible'; document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(2100);
    vi.advanceTimersByTime(60000);
    expect(ai(sent)).toEqual(['aie_gemini', 'aiv_gemini']);
  });
  it('other assistants → other; search and direct visits send no AI tallies', () => {
    expect(ai(land('https://www.phind.com/'))).toEqual(['aie_other']);
    expect(ai(land('https://www.google.com/'))).toEqual([]);
    expect(ai(land(''))).toEqual([]);
  });
});
