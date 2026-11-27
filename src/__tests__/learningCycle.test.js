import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setLadderArmForTests } from '../utils/ladderArm';
import {
  cycleSequence, batchWords, batchLabel, batchCount, cycleState,
  advanceCycle, stepsFor, LADDER, PHASES, buildSet, repeatSet,
  letterFixPlan, BATCH_SIZE, BONUS, LADDER_V1, CYCLE_V, bonusFor, migrateCycle, masteredCount,
  cycleOrder, ORDER_ABC, ORDER_MIX,
} from '../utils/learningCycle';
import { WORDS } from '../data/words';

// These tests pin the TREATMENT arm of the ladder-next split (5 steps, migration, mixed order). The control arm
// (main's 11-step ladder) is pinned in ladderArm.test.js with an injected arm.
beforeAll(() => setLadderArmForTests(1));
afterAll(() => setLadderArmForTests(undefined));

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

describe('the 5-step ladder (11-18 cut from 11 steps)', () => {
  it('has 5 canonical steps grouped into phases exactly, spelling only as bonus', () => {
    expect(LADDER.map(s => s.key)).toEqual(['fc', 'aud', 'wq', 'conv', 'zap']);
    const phaseKeys = PHASES.flatMap(p => p.steps);
    expect(phaseKeys).toEqual(LADDER.map(s => s.key));
    expect(BONUS.map(s => s.key)).toEqual(['lf1', 'forge', 'sent']);
    expect(BONUS.every(s => s.bonus)).toBe(true);
    expect(LADDER.some(s => s.writing)).toBe(false); // no spelling step blocks a batch
  });

  it('is a subsequence of the v1 ladder (so old positions map forward losslessly)', () => {
    const v1 = LADDER_V1.map(s => s.key);
    let at = -1;
    for (const s of LADDER) { const i = v1.indexOf(s.key); expect(i).toBeGreaterThan(at); at = i; }
    expect(v1[v1.length - 1]).toBe(LADDER[LADDER.length - 1].key);
  });

  it('pre-readers lose the reading steps and get no bonus row', () => {
    const set = batchWords(0);
    const reader = stepsFor(true, set).map(s => s.key);
    const pre = stepsFor(false, set).map(s => s.key);
    expect(reader).toContain('wq');
    expect(reader).not.toContain('forge');
    expect(bonusFor(true, set).map(s => s.key)).toContain('forge');
    expect(bonusFor(false, set)).toEqual([]);
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
    let next = advanceCycle({ cycle: { batch: 0, stage: 0, v: CYCLE_V } }, true, set);
    expect(next).toEqual({ batch: 0, stage: 1, v: CYCLE_V, batchDone: false });
    next = advanceCycle({ cycle: { batch: 0, stage: ladder.length - 1, v: CYCLE_V } }, true, set);
    expect(next.batchDone).toBe(true);
    expect(next.batch).toBe(1);
    expect(next.v).toBe(CYCLE_V);
  });

  it('a batch is 5 completed steps for a reader (4 for a pre-reader)', () => {
    const set = batchWords(0);
    for (const [canRead, n] of [[true, 5], [false, 4]]) {
      let stats = { cycle: { batch: 0, stage: 0, v: CYCLE_V } };
      let steps = 0, r;
      do { r = advanceCycle(stats, canRead, set); stats = { cycle: { batch: r.batch, stage: r.stage, v: r.v } }; steps++; } while (!r.batchDone);
      expect(steps).toBe(n);
    }
  });
});

describe('migrating an 11-step position (stats.cycle without v)', () => {
  const set = batchWords(0); // spans ≥2 categories → conveyor is in both ladders
  const v1Reader = ['fc', 'aud', 'wq', 'iq', 'conv', 'lf1', 'lf2', 'lf3', 'forge', 'sent', 'zap'];
  const expectNew = { fc: 'fc', aud: 'aud', wq: 'wq', iq: 'conv', conv: 'conv', lf1: 'zap', lf2: 'zap', lf3: 'zap', forge: 'zap', sent: 'zap', zap: 'zap' };

  it('every old reader position lands on the first new step not yet done', () => {
    expect(new Set(set.map(w => w.category)).size).toBeGreaterThanOrEqual(2);
    v1Reader.forEach((key, stage) => {
      const m = migrateCycle({ batch: 3, stage }, true, set);
      expect(m.v).toBe(CYCLE_V);
      expect(m.batch).toBe(3); // the batch (and so every practiced word) is kept
      expect(stepsFor(true, set)[m.stage].key).toBe(expectNew[key]);
    });
  });

  it('never sends a child back before a step they finished', () => {
    const newKeys = stepsFor(true, set).map(s => s.key);
    v1Reader.forEach((_, stage) => {
      const doneOld = new Set(v1Reader.slice(0, stage));
      const m = migrateCycle({ batch: 0, stage }, true, set);
      newKeys.slice(0, m.stage).forEach(k => expect(doneOld.has(k)).toBe(true)); // done before stays done
      if (newKeys[m.stage] !== 'zap') expect(doneOld.has(newKeys[m.stage])).toBe(false); // current = not done yet
    });
  });

  it('pre-readers: the 4 no-reading steps map one to one', () => {
    const pre = ['fc', 'aud', 'conv', 'zap'];
    pre.forEach((key, stage) => {
      const m = migrateCycle({ batch: 1, stage }, false, set);
      expect(stepsFor(false, set)[m.stage].key).toBe(key);
    });
  });

  it('a single-category set (no conveyor) maps too', () => {
    const oneCat = WORDS.filter(w => w.category === 'animals').slice(0, 10);
    const m = migrateCycle({ batch: 0, stage: 4 }, true, oneCat); // v1 for this set: fc aud wq iq lf1 → at lf1
    expect(stepsFor(true, oneCat)[m.stage].key).toBe('zap');
  });

  it('a stage past the end clamps; a v2 record is left alone; no record = start', () => {
    expect(stepsFor(true, set)[migrateCycle({ batch: 0, stage: 99 }, true, set).stage].key).toBe('zap');
    expect(migrateCycle({ batch: 2, stage: 3, v: CYCLE_V }, true, set)).toEqual({ batch: 2, stage: 3, v: CYCLE_V });
    expect(cycleState({ cycle: { batch: 0, stage: 4 } }, true, set)).toEqual({ batch: 0, stage: 3 }); // old conv → new conv
    expect(cycleState({ cycle: { batch: 0, stage: 7 } }, true, set)).toEqual({ batch: 0, stage: 4 }); // old lf3 → zap
  });

  it('advancing from an unmigrated record migrates first', () => {
    // old stage 5 = lf1 (fc..conv done) → new zap; finishing zap completes the batch
    const r = advanceCycle({ cycle: { batch: 0, stage: 5 } }, true, set);
    expect(r).toEqual({ batch: 1, stage: 0, v: CYCLE_V, batchDone: true });
  });

  it('keeps mastered words, badges and every other stat (only cycle changes)', () => {
    const stats = {
      cycle: { batch: 4, stage: 6 },
      wordProgress: { cat: { lastSeen: 1, interval: 30, correct: 9, wrong: 1 } },
      badges: ['first_quiz', 'streak_3'], spelling: { cat: { ok: 4, no: 0 } }, totalQuizzes: 12,
    };
    const migrated = { ...stats, cycle: migrateCycle(stats.cycle, true, batchWords(4)) };
    expect(migrated.wordProgress).toBe(stats.wordProgress);
    expect(migrated.badges).toBe(stats.badges);
    expect(migrated.spelling).toBe(stats.spelling);
    expect(migrated.cycle.batch).toBe(4);
    expect(masteredCount(migrated)).toBe(1);
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

// 11-27 mixed-start order (owner D4 via A254; engagement review F1): the cycle used to start on A and walk the
// alphabet, so the 18 A words (3% of the catalogue) took 24.5% of answers. These fail on the alphabetical order.
describe('mixed-start word order', () => {
  const N = 5; // the first 5 batches = 50 words, more than any learner had reached (3 of 190 cycles got to batch 2)
  const share = (words, re) => words.filter((w) => re.test(w.word)).length / words.length;
  const firstBatches = (stats, n = N, kl = null) =>
    Array.from({ length: n }, (_, i) => buildSet('batch', { stats: { ...stats, cycle: stats.cycle ? { ...stats.cycle, batch: i } : { batch: i, stage: 0, v: CYCLE_V, ord: 'mix' } }, knownLetters: kl }).words).flat();
  const beginners = WORDS.filter((w) => w.level === 'beginner');

  it('a brand-new learner (no stats.cycle) gets the mixed order', () => {
    expect(cycleOrder({})).toBe(ORDER_MIX);
    expect(cycleOrder({ cycle: { batch: 0, stage: 0, v: CYCLE_V, ord: 'mix' } })).toBe(ORDER_MIX);
  });

  it('the first batch spans the alphabet: ≥ 8 different first letters, none from A/B-only', () => {
    const b0 = buildSet('batch', { stats: {} }).words;
    expect(b0).toHaveLength(BATCH_SIZE);
    expect(new Set(b0.map((w) => w.word[0].toLowerCase())).size).toBeGreaterThanOrEqual(8);
    expect(share(b0, /^[ab]/i)).toBeLessThan(0.5);
    expect(b0.every((w) => w.level === 'beginner')).toBe(true);
  });

  it('A words in the first batches ≈ their share of the beginner level (was ~4× it)', () => {
    const first = firstBatches({});
    const aLevel = share(beginners, /^a/i);
    expect(share(first, /^a/i)).toBeLessThanOrEqual(aLevel * 2 + 0.02);
    expect(share(first, /^[ab]/i)).toBeLessThanOrEqual(share(beginners, /^[ab]/i) * 1.5);
  });

  it('known letters (pre-readers) still come first, mixed among themselves', () => {
    const kl = ['m', 's', 't'];
    const first = buildSet('batch', { stats: {}, knownLetters: kl }).words;
    expect(first.every((w) => kl.includes(w.word[0].toLowerCase()))).toBe(true);
    expect(new Set(first.map((w) => w.word[0].toLowerCase())).size).toBe(3);
  });

  it('deterministic, whole catalogue once, levels still easy-first', () => {
    const a = cycleSequence(null, ORDER_MIX).map((w) => w.id);
    expect(cycleSequence(null, ORDER_MIX).map((w) => w.id)).toEqual(a);
    expect(new Set(a).size).toBe(WORDS.length);
    const lv = cycleSequence(null, ORDER_MIX).map((w) => ({ beginner: 0, intermediate: 1, advanced: 2 }[w.level] ?? 1));
    expect([...lv].sort((x, y) => x - y)).toEqual(lv);
    const n = batchCount();
    const seen = new Set();
    for (let i = 0; i < n; i++) batchWords(i, null, ORDER_MIX).forEach((w) => seen.add(w.id));
    expect(seen.size).toBe(WORDS.length);
  });

  it('a saved cycle from before 11-27 (no ord) keeps its alphabetical batch: nobody\'s words change under them', () => {
    const old = { cycle: { batch: 2, stage: 3, v: CYCLE_V } };
    expect(cycleOrder(old)).toBe(ORDER_ABC);
    expect(buildSet('batch', { stats: old }).words.map((w) => w.id)).toEqual(batchWords(2).map((w) => w.id));
    expect(cycleOrder({ cycle: { batch: 0, stage: 9 } })).toBe(ORDER_ABC); // v1 record
    expect(migrateCycle({ batch: 1, stage: 2, v: CYCLE_V, ord: 'mix' })).toEqual({ batch: 1, stage: 2, v: CYCLE_V, ord: 'mix' });
  });

  it('a mixed batch has no letter label; an alphabetical one keeps its span', () => {
    expect(batchLabel(0, null, ORDER_MIX)).toBe('');
    expect(batchLabel(0)).toMatch(/^[A-Z](–[A-Z])?$/);
  });

  it('"New words" (fresh) for a new learner also starts mixed', () => {
    const fresh = buildSet('fresh', { stats: {} }).words;
    expect(share(fresh, /^[ab]/i)).toBeLessThan(0.5);
  });
});
