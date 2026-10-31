// public/unit-practice.js sentence engine (Band I roadmap step 4): the gap game
// blanks our own example sentence and uses the Hebrew meaning as the clue; the
// builder takes the sentence's words in order. Static pages, so jsdom, not e2e.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = fs.readFileSync(path.resolve(import.meta.dirname, '../../public/unit-practice.js'), 'utf8');
const ITEMS = [
  { en: 'cat', he: 'חתול', ex: 'The cat sat on the mat.', audio: '/audio/cat.mp3', opts: ['חתול', 'כלב', 'דג', 'סוס'], ans: 0 },
  { en: 'dog', he: 'כלב', ex: 'The dog wagged its tail.', audio: '/audio/dog.mp3', opts: ['כלב', 'חתול', 'דג', 'סוס'], ans: 0 },
  { en: 'fish', he: 'דג', ex: 'A fish swims in the sea.', audio: '/audio/fish.mp3', opts: ['דג', 'כלב', 'חתול', 'סוס'], ans: 0 },
  { en: 'horse', he: 'סוס', ex: 'I ride a horse on the farm.', audio: '/audio/horse.mp3', opts: ['סוס', 'כלב', 'חתול', 'דג'], ans: 0 },
  { en: 'bird', he: 'ציפור', ex: 'Birds fly.', audio: '/audio/bird.mp3', opts: ['ציפור', 'כלב', 'חתול', 'דג'], ans: 0 }, // no "bird" in it → never used
];

function mount() {
  document.body.innerHTML = `
    <button class="mode" data-mode="hear"></button><button class="mode" data-mode="gap"></button><button class="mode" data-mode="build"></button>
    <div id="practice"></div><p id="practice-live"></p><button data-copy-list>copy</button>
    <script type="application/json" id="unit-data">${JSON.stringify(ITEMS)}</script>`;
  window.__audios = [];
  window.Audio = vi.fn(function (src) { const a = { src, play: () => Promise.resolve(), pause() {} }; window.__audios.push(a); return a; });
  navigator.sendBeacon = vi.fn(() => true);
  new Function(SRC)();
}
const box = () => document.getElementById('practice');
const byClue = () => {
  const clue = box().querySelector('.clue').textContent;
  return ITEMS.find((it) => clue.includes(it.he));
};

describe('unit-practice sentence engine', () => {
  beforeEach(() => mount());

  it('gap: blanks the word, Hebrew clue, 4 options with one meaning match; only usable items', () => {
    document.querySelector('[data-mode="gap"]').click();
    const seen = new Set();
    for (let r = 0; r < 4; r++) {
      const it = byClue();
      seen.add(it.en);
      const sent = box().querySelector('.sent');
      expect(sent.textContent).not.toMatch(new RegExp(`\\b${it.en}\\b`, 'i'));
      expect(box().querySelector('.big-say')).toBeNull(); // hearing it would give it away
      const opts = [...box().querySelectorAll('.opt')];
      expect(opts).toHaveLength(4);
      expect(opts.filter((o) => o.textContent === it.en)).toHaveLength(1);
      opts.find((o) => o.textContent === it.en).click();
      expect(sent.querySelector('mark').textContent.toLowerCase()).toBe(it.en);
      box().querySelector('.next').click();
    }
    expect(seen.has('bird')).toBe(false);
    expect(box().textContent).toContain('סיימתם! 4 מתוך 4');
  });

  it('gap: a wrong pick marks the right option and scores 0', () => {
    document.querySelector('[data-mode="gap"]').click();
    const it = byClue();
    [...box().querySelectorAll('.opt')].find((o) => o.textContent !== it.en).click();
    expect(box().querySelector('.opt.ok').textContent).toBe(it.en);
    expect(box().querySelector('.feedback').textContent).toContain('המילה היא');
  });

  it('build: a wrong tile stays; the words in order complete the sentence', () => {
    document.querySelector('[data-mode="build"]').click();
    const enInClue = box().querySelector('.clue bdi').textContent;
    const it = ITEMS.find((x) => x.en === enInClue);
    const toks = it.ex.split(' ');
    const tile = (t) => [...box().querySelectorAll('.tile')].find((b) => !b.hidden && b.textContent === t);
    tile(toks[1]).click(); // out of order
    expect(box().querySelector('.built').textContent).toBe('');
    for (const t of toks) tile(t).click();
    expect(box().querySelector('.built').textContent).toBe(toks.join(''));
    expect(box().querySelector('.feedback').textContent).toBe('יפה! המשפט שלם.'); // one slip → not a first-try right
  });

  it('copy list: the page words as TSV (English, tab, Hebrew per line) — R2C16', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    document.querySelector('[data-copy-list]').click();
    expect(writeText).toHaveBeenCalledWith(ITEMS.map((w) => `${w.en}\t${w.he}`).join('\n'));
    await Promise.resolve();
    expect(document.querySelector('[data-copy-list]').textContent).toContain('הועתקה');
  });

  it('🐢 slow: plays at 0.75× and stays on for the next words (R2C9)', () => {
    localStorage.removeItem('cde_slow');
    const slow = box().querySelector('.slow-say');
    expect(slow.getAttribute('aria-pressed')).toBe('false');
    slow.click();
    expect(slow.getAttribute('aria-pressed')).toBe('true');
    expect(window.__audios.at(-1).playbackRate).toBe(0.75);
    box().querySelector('.big-say').click();
    expect(window.__audios.at(-1).playbackRate).toBe(0.75);
    localStorage.removeItem('cde_slow');
  });
});
