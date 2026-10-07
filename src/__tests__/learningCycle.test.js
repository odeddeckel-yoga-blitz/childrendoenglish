import { describe, it, expect } from 'vitest';
import {
  cycleSequence, batchWords, batchLabel, batchCount, cycleState,
  advanceCycle, stepsFor, LADDER, PHASES, buildSet, repeatSet,
  letterFixPlan, BATCH_SIZE,
} from '../utils/learningCycle';
import { WORDS } from '../data/words';

describe('learningCycle sequence/batches', () => {
  it('sequence is deterministic and covers the whole vocabulary once', () => {
    const a = cycleSequence();
    const b = cycleSequence();
    expect(a.map(w => w.id)).toEqual(b.map(w => w.id));
    expect(a.length).toBe(WORDS.length);
    expect(new Set(a.map(w => w.id)).size).toBe(WORDS.length);
  });

  it('starts with beginner words, alphabetical', () => {
    const seq = cycleSequence();
    expect(seq[0].level).toBe('beginner');
    const words = seq.slice(0, BATCH_SIZE).map(w => w.word.toLowerCase());
    expect([...words].sort()).toEqual(words);
  });

  it('known letters float their words to the front', () => {
    const seq = cycleSequence(['m']);
    expect(seq[0].word[0].toLowerCase()).toBe('m');
  });

  it('batch math covers everything without overlap', () => {
    const n = batchCount();
    const seen = new Set();
    for (let i = 0; i < n; i++) batchWords(i).forEach(w => seen.add(w.id));
    expect(seen.size).toBe(WORDS.length);
    expect(batchLabel(0)).toMatch(/^[A-Z](–[A-Z])?$/);
  });

  it('cycleState tolerates legacy stats without the key', () => {
    expect(cycleState({})).toEqual({ batch: 0, stage: 0 });
    expect(cycleState(null)).toEqual({ batch: 0, stage: 0 });
  });
});

describe('the 11-step ladder', () => {
  it('has 11 canonical steps grouped into 5 phases exactly', () => {
    expect(LADDER.length).toBe(11);
    const phaseKeys = PHASES.flatMap(p => p.steps);
    expect(phaseKeys).toEqual(LADDER.map(s => s.key));
  });

  it('pre-readers lose the reading steps', () => {
    const set = batchWords(0);
    const reader = stepsFor(true, set).map(s => s.key);
    const pre = stepsFor(false, set).map(s => s.key);
    expect(reader).toContain('wq');
    expect(reader).toContain('forge');
    expect(pre).not.toContain('wq');
    expect(pre).not.toContain('lf1');
    expect(pre).toContain('fc');
    expect(pre).toContain('zap');
  });

  it('conveyor auto-skips for single-category sets', () => {
    const oneCat = WORDS.filter(w => w.category === 'animals').slice(0, 10);
    expect(stepsFor(true, oneCat).map(s => s.key)).not.toContain('conv');
    const multi = batchWords(0);
    if (new Set(multi.map(w => w.category)).size >= 2) {
      expect(stepsFor(true, multi).map(s => s.key)).toContain('conv');
    }
  });

  it('advanceCycle walks the full ladder then rolls the batch', () => {
    const set = batchWords(0);
    const ladder = stepsFor(true, set);
    let next = advanceCycle({ cycle: { batch: 0, stage: 0 } }, true, set);
    expect(next).toEqual({ batch: 0, stage: 1, batchDone: false });
    next = advanceCycle({ cycle: { batch: 0, stage: ladder.length - 1 } }, true, set);
    expect(next.batchDone).toBe(true);
    expect(next.batch).toBe(1);
  });
});

describe('buildSet sources', () => {
  it('batch source returns the cycle batch with its token', () => {
    const { words, token } = buildSet('batch', { stats: { cycle: { batch: 2, stage: 0 } } });
    expect(token).toBe('b2');
    expect(words.map(w => w.id)).toEqual(batchWords(2).map(w => w.id));
  });

  it('letters source stays within the chosen letters', () => {
    const { words, token } = buildSet('letters', { letters: ['B'] });
    expect(token).toBe('adhoc');
    expect(words.length).toBeGreaterThan(0);
    expect(words.every(w => w.word[0].toLowerCase() === 'b')).toBe(true);
  });

  it('surprise is seed-stable and size 10', () => {
    const a = buildSet('surprise', { seed: 42 });
    const b = buildSet('surprise', { seed: 42 });
    const c = buildSet('surprise', { seed: 43 });
    expect(a.words.map(w => w.id)).toEqual(b.words.map(w => w.id));
    expect(a.words.map(w => w.id)).not.toEqual(c.words.map(w => w.id));
    expect(a.words.length).toBe(10);
  });

  it('fresh prefers least-practiced words deterministically', () => {
    const practiced = Object.fromEntries(batchWords(0).map(w => [w.id, { correct: 5, wrong: 0 }]));
    const { words } = buildSet('fresh', { stats: { wordProgress: practiced } });
    const practicedIds = new Set(Object.keys(practiced));
    expect(words.every(w => !practicedIds.has(w.id))).toBe(true);
  });

  it('repeatSet different gives same-size new draw; more grows capped', () => {
    const base = batchWords(0);
    const diff = repeatSet(base, 'batch', { kind: 'different', seed: 5, stats: {} });
    expect(diff.length).toBe(base.length);
    const more = repeatSet(base, 'batch', { kind: 'more', stats: {} });
    expect(more.length).toBeGreaterThan(base.length);
    expect(more.length).toBeLessThanOrEqual(BATCH_SIZE * 2);
    base.forEach((w, i) => expect(more[i].id).toBe(w.id)); // keeps current words first
  });
});

describe('letterFixPlan', () => {
  const by = (id) => WORDS.find(w => w.id === id);

  it('hard mode targets the silent/tricky letter on known offenders', () => {
    const knight = by('knight');
    if (knight) expect(knight.word[letterFixPlan(knight, 'hard').blanks[0].index]).toBe('k');
    const comb = by('comb');
    if (comb) expect(comb.word[letterFixPlan(comb, 'hard').blanks[0].index]).toBe('b');
    const write = by('write');
    if (write) expect(write.word[letterFixPlan(write, 'hard').blanks[0].index]).toBe('w');
  });

  it('easy mode never blanks a silent-pattern letter and gives 4 options incl. the answer', () => {
    for (const id of ['knight', 'dog', 'butterfly', 'write']) {
      const w = by(id);
      if (!w) continue;
      const plan = letterFixPlan(w, 'easy');
      expect(plan.blanks.length).toBe(1);
      const b = plan.blanks[0];
      expect(b.options.length).toBe(4);
      expect(b.options).toContain(b.letter);
      expect(w.word.toLowerCase()[b.index]).toBe(b.letter);
    }
  });

  it('double mode gives two non-adjacent blanks with options each', () => {
    const w = by('butterfly') || WORDS.find(x => x.word.length >= 6);
    const plan = letterFixPlan(w, 'double');
    expect(plan.blanks.length).toBe(2);
    expect(Math.abs(plan.blanks[0].index - plan.blanks[1].index)).toBeGreaterThan(1);
    plan.blanks.forEach(b => expect(b.options).toContain(b.letter));
  });

  it('every catalog word yields a valid plan in every mode', () => {
    for (const w of WORDS) {
      for (const mode of ['easy', 'double', 'hard']) {
        const plan = letterFixPlan(w, mode);
        expect(plan.blanks.length).toBeGreaterThan(0);
        for (const b of plan.blanks) {
          expect(w.word.toLowerCase().startsWith(w.word.toLowerCase().slice(0, b.index))).toBe(true);
          expect(b.options).toContain(b.letter);
          expect(new Set(b.options).size).toBe(4);
        }
      }
    }
  });
});
