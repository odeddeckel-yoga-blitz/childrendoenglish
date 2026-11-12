// Movement between activities (kit 1.59 §5.55): g2/g3 on the 2nd/3rd distinct activity of a tab, hop on every move.
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { vi } from 'vitest';
import { flowEvents } from '../utils/activityFlow';

describe('flowEvents (app screens)', () => {
  beforeEach(() => sessionStorage.clear());
  it('first activity sends nothing; 2nd and 3rd distinct send g2/g3 with how; every move sends a hop', () => {
    expect(flowEvents('flashcards', 'ladder')).toEqual([]);
    expect(flowEvents('image-quiz', 'ladder')).toEqual([{ e: 'g2', i: 'ladder' }, { e: 'hop', i: 'flashcards@image-quiz' }]);
    expect(flowEvents('image-quiz', 'menu')).toEqual([]);   // same screen again: no hop, no count
    expect(flowEvents('word-quiz', 'menu')).toEqual([{ e: 'g3', i: 'menu' }, { e: 'hop', i: 'image-quiz@word-quiz' }]);
    expect(flowEvents('flashcards', 'menu')).toEqual([{ e: 'hop', i: 'word-quiz@flashcards' }]);   // back to a seen one
    expect(flowEvents('lightning', 'menu')).toEqual([{ e: 'hop', i: 'flashcards@lightning' }]);    // 4th distinct: no g4
  });
});

const SRC = fs.readFileSync(path.resolve(import.meta.dirname, '../../public/land-beacon.js'), 'utf8');
const pad = (n) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
function openPage(url, referrer) {
  localStorage.clear(); localStorage.setItem('cde_seen', today());
  window.history.replaceState(null, '', url);
  Object.defineProperty(document, 'referrer', { value: referrer, configurable: true });
  const sent = [];
  navigator.sendBeacon = vi.fn((u, body) => { sent.push(JSON.parse(body)); return true; });
  delete window.__cdeLand; new Function(SRC)(); // each call is a fresh page load (run-once guard)
  return sent.filter((b) => b.batch).flatMap((b) => b.batch).filter((x) => ['g2', 'g3', 'hop', 'vp', 'jserr', 'rets'].includes(x.e));
}

describe('land-beacon on game pages (shares the tab list with the app)', () => {
  beforeEach(() => sessionStorage.clear());
  it('a game opened from a word page after flashcards: g2 @ page, the hop, and vp @ vocab', () => {
    sessionStorage.setItem('cde_acts', '["flashcards"]'); sessionStorage.setItem('cde_last', 'flashcards');
    expect(openPage('/games/word-zapper/', `${location.origin}/vocabulary/animals/cat/`))
      .toEqual([{ e: 'g2', i: 'page' }, { e: 'hop', i: 'flashcards@word-zapper' }, { e: 'vp', i: 'vocab' }]);
  });
  it('how: ladder link, hub, another game (no vp), the app, a search engine, no referrer', () => {
    const how = (url, ref) => { sessionStorage.setItem('cde_acts', '["x"]'); sessionStorage.removeItem('cde_last'); return openPage(url, ref); };
    expect(how('/games/read-it/?words=cat&from=ladder', `${location.origin}/`)).toEqual([{ e: 'g2', i: 'ladder' }, { e: 'vp', i: 'home' }]);
    expect(how('/games/read-it/', `${location.origin}/games/`)).toEqual([{ e: 'g2', i: 'hub' }, { e: 'vp', i: 'games' }]);
    expect(how('/games/read-it/', `${location.origin}/games/sound-pairs/`)).toEqual([{ e: 'g2', i: 'game' }]);
    expect(how('/games/read-it/', `${location.origin}/`)).toEqual([{ e: 'g2', i: 'app' }, { e: 'vp', i: 'home' }]);
    expect(how('/games/read-it/', 'https://www.google.com/')).toEqual([{ e: 'g2', i: 'ext' }]);
    expect(how('/games/read-it/', '')).toEqual([{ e: 'g2', i: 'direct' }]);
  });
  it('a non-game page sends no flow tallies', () => {
    expect(openPage('/vocabulary/animals/', `${location.origin}/`)).toEqual([]);
  });
  it('one jserr per page load, only for our own scripts', () => {
    openPage('/games/letter-twins/', '');
    const sent = [];
    navigator.sendBeacon = vi.fn((u, body) => { sent.push(JSON.parse(body)); return true; });
    const fire = (init) => window.dispatchEvent(Object.assign(new Event('error'), init));
    fire({ filename: 'chrome-extension://abc/x.js', error: new Error('x') });
    fire({ filename: '', message: 'Script error.' });
    // (listeners from earlier test page loads are still on this window — count only this page's surface)
    const mine = () => sent.flatMap((b) => b.batch).filter((x) => x.i === 'g-letter-twins');
    expect(mine()).toEqual([]);
    fire({ filename: `${location.origin}/games/letter-twins/game.js`, error: new Error('boom') });
    fire({ filename: `${location.origin}/games/letter-twins/game.js`, error: new Error('again') });
    expect(mine()).toEqual([{ e: 'jserr', i: 'g-letter-twins' }]);
  });
  it('the error signature: <file>_<line>_<type>, game files prefixed with the game id, never the message', () => {
    const sigs = (load, init, type = 'error') => {
      openPage(load, '');
      const sent = [];
      navigator.sendBeacon = vi.fn((u, body) => { sent.push(JSON.parse(body)); return true; });
      window.dispatchEvent(Object.assign(new Event(type), init));
      // (earlier page loads' listeners are still on this window: they send the same signature, so dedupe)
      return [...new Set(sent.flatMap((b) => b.batch).filter((x) => x.e === 'jserrsig').map((x) => x.i))];
    };
    expect(sigs('/games/category-conveyor/', { filename: `${location.origin}/games/category-conveyor/game.js`, lineno: 412,
      error: new TypeError("Cannot read properties of undefined (reading 'kid typed this')") })).toEqual(['category-conveyor-game_412_type']);
    expect(sigs('/vocabulary/animals/cat/', { filename: `${location.origin}/vocab-quiz.js`, lineno: 7, error: new ReferenceError('x') }))
      .toEqual(['vocab-quiz_7_ref']);
    expect(sigs('/games/opposites/', { filename: `${location.origin}/games/end-card.js`, lineno: 0, error: 'not an Error' }))
      .toEqual(['end-card_0_other']);
    const rej = Object.assign(new RangeError('deep'), { stack: `RangeError: deep\n    at f (${location.origin}/games/word-zapper/game.js:88:12)` });
    expect(sigs('/games/word-zapper/', { reason: rej }, 'unhandledrejection')).toEqual(['word-zapper-game_88_range']);
    expect(sigs('/games/read-it/', { filename: 'chrome-extension://abc/x.js', lineno: 3, error: new Error('x') })).toEqual([]);
    // injected into the page (extension / school filter; CDE pages have no inline scripts): jserx, no jserr or signature
    expect(sigs('/he/', { filename: `${location.origin}/he/`, lineno: 12, error: new TypeError('x') })).toEqual([]);
    const all = JSON.stringify(navigator.sendBeacon.mock.calls);
    expect(all).not.toMatch(/kid typed|Cannot read/);
  });
  it('an error whose source is the page itself is jserx, never jserr', () => {
    openPage('/vocabulary/animals/', '');
    const sent = [];
    navigator.sendBeacon = vi.fn((u, body) => { sent.push(JSON.parse(body)); return true; });
    window.dispatchEvent(Object.assign(new Event('error'), { filename: `${location.origin}/vocabulary/animals/`, lineno: 3, error: new TypeError('x') }));
    const mine = sent.flatMap((b) => b.batch).filter((x) => x.i === 'pg-vocab');
    expect(mine).toContainEqual({ e: 'jserx', i: 'pg-vocab' });
    expect(mine.filter((x) => x.e === 'jserr')).toEqual([]);
  });
  it('act: once per static page view, with the first action, never on load', () => {
    window.history.replaceState(null, '', '/vocabulary/animals/cat/');
    localStorage.clear(); localStorage.setItem('cde_seen', today());
    const sent = [];
    navigator.sendBeacon = vi.fn((u, body) => { sent.push(JSON.parse(body)); return true; });
    document.body.innerHTML = '<a id="play" href="/games/word-zapper/">Play</a><a id="play2" href="/app">App</a>';
    delete window.__cdeLand; new Function(SRC)();
    const acts = () => sent.flatMap((b) => b.batch || []).filter((x) => x.e === 'act');
    expect(sent.flatMap((b) => b.batch || []).some((x) => x.e === 'pg')).toBe(true);
    expect(acts()).toEqual([]);
    document.getElementById('play').addEventListener('click', (e) => e.preventDefault());
    document.getElementById('play').click();
    // (earlier test page loads' listeners are still on this document and act once each too; this load's is among them)
    expect(acts()).toContainEqual({ e: 'act', i: 'vocabulary_word' });
    const n = acts().length;
    document.getElementById('play2').click();
    expect(acts().length).toBe(n); // every page view acts once at most
    document.body.innerHTML = '';
  });
  it('a returning day sends rets @ the surface it starts on', () => {
    localStorage.clear();
    const d = new Date(); d.setDate(d.getDate() - 3);
    localStorage.setItem('cde_seen', `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    window.history.replaceState(null, '', '/games/sound-pairs/');
    Object.defineProperty(document, 'referrer', { value: '', configurable: true });
    const sent = [];
    navigator.sendBeacon = vi.fn((u, body) => { sent.push(JSON.parse(body)); return true; });
    delete window.__cdeLand; new Function(SRC)();
    expect(sent.flatMap((b) => b.batch || []).filter((x) => x.e === 'vis' || x.e === 'rets'))
      .toEqual([{ e: 'vis', i: 'r2-7' }, { e: 'rets', i: 'g-sound-pairs' }]);
  });

  it('keeps the tab arrival class for the first-quiz tally (first page of the tab wins)', () => {
    sessionStorage.clear();
    openPage('/', 'https://www.google.com/');
    expect(sessionStorage.getItem('cde_src')).toBe('seo');
    openPage('/vocabulary/animals/', `${location.origin}/`);
    expect(sessionStorage.getItem('cde_src')).toBe('seo');
  });
});
