// Pure helpers of tools/learning/standing-sections.mjs (kit 1.59 §5.55 report sections).
import { describe, it, expect } from 'vitest';
import { flowSummary, speedSummary, controlsSummary, pageType, pageDepthSummary } from '../../tools/learning/standing-sections.mjs';

describe('standing sections', () => {
  it('flow: g2/g3 totals, how mix, top moves, dead ends (≥10 arrivals, <20% move on)', () => {
    const f = flowSummary([
      { ev: 'g2', item: 'ladder', n: 6 }, { ev: 'g2', item: 'hub', n: 4 }, { ev: 'g3', item: 'ladder', n: 3 },
      { ev: 'hop', item: 'flashcards@image-quiz', n: 12 }, { ev: 'hop', item: 'image-quiz@word-zapper', n: 1 },
      { ev: 'hop', item: 'word-zapper@read-it', n: 2 },
    ], 50);
    expect(f.g2).toBe(10); expect(f.g3).toBe(3);
    expect(f.how).toEqual({ ladder: 9, hub: 4 });
    expect(f.top[0]).toEqual({ from: 'flashcards', to: 'image-quiz', n: 12 });
    expect(f.deadEnds).toEqual([{ act: 'image-quiz', in: 12, out: 1 }]);
  });
  it('speed: overall shares and slow surfaces (≥8 loads, ≥25% poor)', () => {
    const s = speedSummary([
      { item: 'lcp_good@app', n: 9 }, { item: 'lcp_poor@app', n: 1 },
      { item: 'lcp_poor@g-word-zapper', n: 4 }, { item: 'lcp_good@g-word-zapper', n: 4 }, { item: 'cls_good@g-word-zapper', n: 8 },
    ]);
    expect(s.all.lcp).toEqual({ good: 13, ni: 0, poor: 5 });
    expect(s.slow.map((x) => x.surf)).toEqual(['g-word-zapper']);
  });
  it('controls: Home at L1, top control per level, seen-never-tapped', () => {
    const c = controlsSummary([
      { tpl: 'game-l1', route: '/games/read-it', comp: 'id.homepill', imp: 20, clk: 3 },
      { tpl: 'game-l1', route: '/games/read-it', comp: 'opt', imp: 20, clk: 60 },
      { tpl: 'game-l2', route: '/games/read-it', comp: 'again', imp: 9, clk: 7 },
      { tpl: 'game-menu', route: '/games/read-it', comp: 'id.mute', imp: 25, clk: 0 },
    ]);
    expect(c).toEqual([{ id: 'read-it', l1home: 3, l1views: 20,
      perLevel: [{ level: 1, comp: 'opt', n: 60 }, { level: 2, comp: 'again', n: 7 }], unused: ['id.mute'] }]);
  });
});

describe('static-page depth by type (measure step 2)', () => {
  it('maps page keys to types', () => {
    const cases = {
      vocabulary_word: 'word', 'vocabulary_ages-6-8': 'age', vocabulary_animals: 'category', vocabulary: 'category',
      vocabulary_animals_spanish: 'bilingual', 'printable-flashcards_animals': 'printable', 'printable-flashcards_animals_hebrew': 'printable',
      'printable-flashcards_transportation_span': 'printable', // the 40-char key cap
      'printable-flashcards_spanish': 'printable-index', 'tools_flashcard-maker': 'maker', teachers: 'teachers', he_teachers: 'teachers',
      'guides_learn-english-words-with-pictures': 'guide', games: 'games-hub', 'games_word-zapper': 'game', 'he_english-games': 'he-pages',
    };
    for (const [k, t] of Object.entries(cases)) expect(pageType(k), k).toBe(t);
  });
  it('sums per type × language; rates share the pg denominator; other events are ignored', () => {
    const d = pageDepthSummary([
      { item: 'vocabulary_word', ev: 'pg', lang: 'en', n: 100 }, { item: 'vocabulary_word', ev: 's15', lang: 'en', n: 30 },
      { item: 'vocabulary_word', ev: 'mqv', lang: 'en', n: 20 }, { item: 'vocabulary_word', ev: 'mq', lang: 'en', n: 2 },
      { item: 'printable-flashcards_animals_spanish', ev: 'pg', lang: 'es', n: 10 }, { item: 'printable-flashcards_food_spanish', ev: 'pg', lang: 'es', n: 5 },
      { item: 'printable-flashcards_food_spanish', ev: 'prc', lang: 'es', n: 3 }, { item: 'vocabulary_word', ev: 'ans_ok', lang: 'en', n: 9 },
    ]);
    expect(d[0]).toMatchObject({ type: 'word', lang: 'en', pg: 100, s15: 30, mqv: 20, mq: 2 });
    expect(d[1]).toMatchObject({ type: 'printable', lang: 'es', pg: 15, prc: 3, bpr: 0 });
    expect(d).toHaveLength(2);
  });
});
