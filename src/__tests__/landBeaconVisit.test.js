// public/land-beacon.js return-visit bucket (Engagement Optimizer): once per
// local day, stores only the last-visit date, sends only a coarse bucket.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = fs.readFileSync(path.resolve(import.meta.dirname, '../../public/land-beacon.js'), 'utf8');
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };

// Every listener a beacon load adds is removed after each test, so one test's page never answers another's events.
const LISTENERS = [];
function exec() {
  const wrap = (t) => { const orig = t.addEventListener; t.addEventListener = function (...a) { LISTENERS.push([t, ...a]); return orig.apply(this, a); }; return () => { t.addEventListener = orig; }; };
  const undo = [wrap(document), wrap(window)];
  delete window.__cdeLand; // each test is a fresh page load
  try { new Function(SRC)(); } finally { undo.forEach((u) => u()); }
}
afterEach(() => { for (const [t, type, fn, opt] of LISTENERS.splice(0)) t.removeEventListener(type, fn, opt); });

function run() {
  const sent = [];
  navigator.sendBeacon = vi.fn((url, body) => { sent.push(JSON.parse(body)); return true; });
  exec();
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
    handler = add.mock.calls.filter((c) => c[0] === 'click').map((c) => c[1])[0]; // the play-click listener (the depth one follows it)
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
    exec();
    return sent;
  }
  const ai = (sent) => sent.filter((b) => b.batch && /^ai[ev]$/.test(b.batch[0].e)).map((b) => `${b.batch[0].e}_${b.batch[0].i}`);
  beforeEach(() => { vi.useFakeTimers(); state = 'visible'; });
  afterEach(() => {
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

// Static-page depth (measure step 2, 11-08): mqv / s15 / prc / bpr / fmb, item = the page key, each once per page view
// and only under its condition.
describe('land-beacon page depth', () => {
  const vis = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
  let state = 'visible', ios = [], sent = [];
  class FakeIO {
    constructor(cb) { this.cb = cb; this.off = false; ios.push(this); }
    observe(el) { this.el = el; }
    disconnect() { this.off = true; }
    fire(ratio) { if (!this.off) this.cb([{ target: this.el, intersectionRatio: ratio, isIntersecting: ratio > 0 }]); }
  }
  function load(path, html = '', stored = {}) {
    localStorage.clear();
    for (const [k, v] of Object.entries(stored)) localStorage.setItem(k, v);
    window.history.replaceState(null, '', path);
    document.body.innerHTML = html;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
    sent = [];
    navigator.sendBeacon = vi.fn((url, body) => { sent.push(JSON.parse(body)); return true; });
    exec();
  }
  // localStorage starts empty, so the first-day vis tally is sent too: it must not change the page key (11-08 hoist fix).
  const depth = () => sent.filter((b) => b.batch).map((b) => b.batch[0]).filter((x) => /^(mqv|s15|prc|bpr|fmb)$/.test(x.e)).map((x) => `${x.e}:${x.i}`);
  const hide = (h) => { state = h ? 'hidden' : 'visible'; document.dispatchEvent(new Event('visibilitychange')); };
  const tap = (sel) => document.querySelector(sel).dispatchEvent(new MouseEvent('click', { bubbles: true }));

  beforeEach(() => { vi.useFakeTimers(); state = 'visible'; ios = []; window.IntersectionObserver = FakeIO; });
  afterEach(() => {
    vi.useRealTimers();
    delete window.IntersectionObserver;
    delete document.visibilityState;
    if (vis) Object.defineProperty(Document.prototype, 'visibilityState', vis);
  });

  it('mqv: once, only when the mini-quiz is ≥50% on screen while the tab is visible', () => {
    // a first-day visitor with a stored key (no cde_seen): that key used to overwrite the page key (11-08 hoist fix)
    load('/vocabulary/animals/dog/', '<div class="mini-quiz"><button class="mq-opt" id="o"></button></div>', { 'childrendoenglish-analytics-consent': 'declined' });
    expect(ios).toHaveLength(1);
    ios[0].fire(0.3);
    expect(depth()).toEqual([]);
    hide(true); ios[0].fire(0.8);
    expect(depth()).toEqual([]); // on screen but the tab is hidden
    hide(false);
    expect(depth()).toEqual(['mqv:vocabulary_word']);
    ios[0].fire(0.2); ios[0].fire(1); hide(true); hide(false);
    expect(depth()).toEqual(['mqv:vocabulary_word']);
    tap('#o');
    expect(sent.map((b) => b.batch?.[0]).filter((x) => x?.e === 'mq')).toEqual([{ e: 'mq', i: 'vocabulary_word' }]);
  });

  it('no mini-quiz on the page → no observer, no mqv', () => {
    load('/printable-flashcards/animals/', '<button data-print id="p">Print</button>');
    expect(ios).toHaveLength(0);
  });

  it('s15: 15 s of VISIBLE time in total, once', () => {
    load('/vocabulary/animals/dog/');
    vi.advanceTimersByTime(10000);
    hide(true); vi.advanceTimersByTime(60000);
    expect(depth()).toEqual([]);
    hide(false); vi.advanceTimersByTime(4900);
    expect(depth()).toEqual([]);
    vi.advanceTimersByTime(200);
    expect(depth()).toEqual(['s15:vocabulary_word']);
    hide(true); hide(false); vi.advanceTimersByTime(60000);
    expect(depth()).toEqual(['s15:vocabulary_word']);
  });

  it('s15: a tab opened in the background starts counting only once shown', () => {
    state = 'hidden';
    load('/guides/learn-english-words-with-pictures/');
    vi.advanceTimersByTime(30000);
    expect(depth()).toEqual([]);
    hide(false); vi.advanceTimersByTime(15000);
    expect(depth()).toEqual(['s15:guides_learn-english-words-with-pictures']);
  });

  it('printable page: prc once per view on the print button, bpr once per print dialog, nothing for other taps', () => {
    load('/printable-flashcards/animals/spanish/', '<button data-print><span id="p">Print</span></button><a id="x" href="/vocabulary/">x</a>');
    tap('#x');
    expect(depth()).toEqual([]);
    tap('#p'); tap('#p');
    window.dispatchEvent(new Event('beforeprint')); window.dispatchEvent(new Event('beforeprint'));
    expect(depth()).toEqual(['prc:printable-flashcards_animals_spanish', 'bpr:printable-flashcards_animals_spanish']);
    expect(sent.find((b) => b.batch?.[0].e === 'prc').l).toBe('es');
  });

  it('flashcard maker: fmb on Build, prc on its Print button, each once', () => {
    load('/tools/flashcard-maker/', '<button id="fmBuild">Build</button><button id="fmPrint">Print</button>');
    tap('#fmBuild'); tap('#fmBuild'); tap('#fmPrint'); tap('#fmPrint');
    expect(depth()).toEqual(['fmb:tools_flashcard-maker', 'prc:tools_flashcard-maker']);
  });

  it('the SPA (#root) sends none of them', () => {
    load('/app', '<div id="root"></div><div class="mini-quiz"></div><button data-print id="p"></button>');
    tap('#p'); vi.advanceTimersByTime(20000); window.dispatchEvent(new Event('beforeprint'));
    expect(ios).toHaveLength(0);
    expect(depth()).toEqual([]);
  });
});

describe('land-beacon run-once guard', () => {
  it('a page that includes the beacon twice still sends one pg (the flashcard maker did, until 11-08)', () => {
    localStorage.clear();
    window.history.replaceState(null, '', '/tools/flashcard-maker/');
    document.body.innerHTML = '';
    const sent = [];
    navigator.sendBeacon = vi.fn((url, body) => { sent.push(JSON.parse(body)); return true; });
    exec();
    new Function(SRC)(); // the second include: same window, no reset
    expect(sent.filter((b) => b.batch?.[0].e === 'pg')).toHaveLength(1);
    expect(sent.filter((b) => b.g)).toHaveLength(1);
  });
});

describe('land-beacon page class', () => {
  it('reserves teachers for the /teachers page (and its he/es and for- variants)', () => {
    for (const p of ['/teachers/', '/for-teachers/', '/he/teachers/', '/es/teachers/']) {
      localStorage.clear();
      window.history.replaceState(null, '', p);
      document.body.innerHTML = '';
      const sent = [];
      navigator.sendBeacon = vi.fn((url, body) => { sent.push(JSON.parse(body)); return true; });
      exec();
      expect(sent[0].g, p).toBe('teachers');
      expect(sent.find((b) => b.batch?.[0].e === 'pg').batch[0].i, p).toMatch(/teachers$/);
    }
  });
});
