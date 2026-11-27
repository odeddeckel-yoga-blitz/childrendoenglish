/**
 * The ladder-next split by device (src/utils/ladderArm.js, kit infra/arm-bit.js, salt 'ladder'; retro 2026-11-27 rule 3).
 * arm 1 = the treatment (5-step ladder, word memory, home Next card, mixed order); arm 0 / null = main's behaviour.
 * These fail on f4512b55, which shipped the treatment to every device with no arm at all.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import {
  readLadderArm, ladderArm, ladderTreat, armTag, setLadderArmForTests, funnelStep, sendCycle, FUNNEL_KEY, LADDER_SALT,
} from '../utils/ladderArm';
import {
  stepsFor, bonusFor, ladderFor, phasesFor, findStep, cycleState, advanceCycle, cycleOrder, batchLabel, buildSet,
  LADDER_V1, ORDER_ABC, ORDER_MIX, CYCLE_V,
} from '../utils/learningCycle';
import { showsHomeNext, FIRST_VISIT_MS } from '../utils/homeNext';
import { addPlayer, resetPlayerProgress, removePlayer } from '../utils/storage';
import { sendLearnBatch } from '../utils/learnBeacon';
import LadderMap from '../components/LadderMap';
import { WORDS } from '../data/words';

const ARM_SRC = readFileSync(resolve(import.meta.dirname, '../../public/arm-bit.js'), 'utf8');
const loadKit = () => { delete window.kitArm; (0, eval)(ARM_SRC); };
const MAIN_KEYS = ['fc', 'aud', 'wq', 'iq', 'conv', 'lf1', 'lf2', 'lf3', 'forge', 'sent', 'zap'];
const fakeKit = (arm, stable = true) => Object.assign(() => arm, { stable: () => stable });

describe('reading the arm from the kit', () => {
  beforeEach(() => { localStorage.clear(); delete window.kitArm; });
  afterEach(() => { delete window.kitArm; setLadderArmForTests(undefined); });

  it('0 | 1 from a stable kit; null for no kit, a null arm, unstable storage or a throwing kit', () => {
    expect(readLadderArm({ kitArm: fakeKit(1) })).toBe(1);
    expect(readLadderArm({ kitArm: fakeKit(0) })).toBe(0);
    expect(readLadderArm({})).toBeNull();
    expect(readLadderArm(undefined)).toBeNull();
    expect(readLadderArm({ kitArm: fakeKit(null) })).toBeNull(); // webdriver / ?internal=1
    expect(readLadderArm({ kitArm: fakeKit(1, false) })).toBeNull(); // blocked storage → control, not counted
    expect(readLadderArm({ kitArm: Object.assign(() => { throw new Error('x'); }, { stable: () => true }) })).toBeNull();
    expect(readLadderArm({ kitArm: fakeKit(2) })).toBeNull();
  });

  it("the real kit file: the stored number picks the arm and stays (sticky per device, salt 'ladder')", () => {
    localStorage.setItem('kit_arm_ladder', '0.75');
    loadKit();
    expect(readLadderArm(window)).toBe(1);
    localStorage.setItem('kit_arm_ladder', '0.25');
    loadKit();
    expect(readLadderArm(window)).toBe(0);
    localStorage.clear();
    loadKit();
    const first = readLadderArm(window);
    const stored = localStorage.getItem('kit_arm_' + LADDER_SALT);
    expect(Number(stored)).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < 5; i++) { loadKit(); expect(readLadderArm(window)).toBe(first); } // every later load
    expect(localStorage.getItem('kit_arm_ladder')).toBe(stored);
  });

  it('the owner device flag (cde_internal) is never in the test', () => {
    localStorage.setItem('kit_arm_ladder', '0.75');
    localStorage.setItem('cde_internal', '1');
    loadKit();
    expect(readLadderArm(window)).toBeNull();
  });

  it('a player reset or delete leaves the arm (and the device funnel) alone', () => {
    localStorage.setItem('kit_arm_ladder', '0.75');
    localStorage.setItem(FUNNEL_KEY, '2');
    const id = addPlayer('Kid', '🦊', true);
    resetPlayerProgress(id);
    removePlayer(id);
    expect(localStorage.getItem('kit_arm_ladder')).toBe('0.75');
    expect(localStorage.getItem(FUNNEL_KEY)).toBe('2');
    loadKit();
    expect(readLadderArm(window)).toBe(1);
  });

  it('ladderArm() is read once per load; tests can force it', () => {
    window.kitArm = fakeKit(1);
    setLadderArmForTests(undefined);
    expect(ladderArm()).toBe(1);
    window.kitArm = fakeKit(0); // a later change in the same load is ignored
    expect(ladderArm()).toBe(1);
    setLadderArmForTests(0);
    expect(ladderTreat()).toBe(false);
    setLadderArmForTests(null);
    expect(ladderTreat()).toBe(false);
    expect(armTag()).toBe('');
    expect(armTag(0)).toBe('~0');
    expect(armTag(1)).toBe('~1');
  });
});

describe('the switch points: arm 0 = main, arm 1 = ladder-next', () => {
  // a set spanning 2 categories, so the conveyor step is in (it needs ≥ 2)
  const cats = [...new Set(WORDS.map((w) => w.category))].slice(0, 2);
  const mixed = cats.flatMap((c) => WORDS.filter((w) => w.category === c).slice(0, 5));

  it('step list: control = main\'s 11 steps (no bonus row), treatment = 5 steps + bonus', () => {
    expect(stepsFor(true, null, false).map((s) => s.key)).toEqual(MAIN_KEYS);
    expect(stepsFor(false, null, false).map((s) => s.key)).toEqual(['fc', 'aud', 'conv', 'zap']);
    expect(bonusFor(true, null, false)).toEqual([]);
    expect(phasesFor(false).map((p) => p.labelKey)).toEqual(['phaseMeet', 'phaseUnderstand', 'phaseSpell', 'phaseUse', 'phaseMaster']);
    expect(ladderFor(false)).toBe(LADDER_V1);
    expect(stepsFor(true, null, true).map((s) => s.key)).toEqual(['fc', 'aud', 'wq', 'conv', 'zap']);
    expect(bonusFor(true, null, true).map((s) => s.key)).toEqual(['lf1', 'forge', 'sent']);
    expect(phasesFor(true)).toHaveLength(3);
  });

  it("findStep: control finds main's lf2/lf3/iq and has no bonus steps", () => {
    expect(findStep('iq', false)).toMatchObject({ kind: 'quiz', mode: 'image' });
    expect(findStep('lf3', false)).toMatchObject({ kind: 'letterfix', mode: 'hard' });
    expect(findStep('lf1', false).bonus).toBeFalsy();
    expect(findStep('sent', false).bonus).toBeFalsy();
    expect(findStep('lf1', true).bonus).toBe(true);
    expect(findStep('iq', true)).toBeUndefined();
  });

  it('cycle record: control reads and writes main\'s { batch, stage } (no v, no migration); treatment migrates', () => {
    const old = { cycle: { batch: 2, stage: 7 } }; // lf3 on the 11-step ladder
    expect(cycleState(old, true, mixed, false)).toEqual({ batch: 2, stage: 7 });
    expect(advanceCycle(old, true, mixed, false)).toEqual({ batch: 2, stage: 8, batchDone: false });
    expect(advanceCycle({ cycle: { batch: 0, stage: 10 } }, true, mixed, false)).toEqual({ batch: 1, stage: 0, batchDone: true });
    // a batch takes 11 completed steps in control, 5 in the treatment
    const walk = (treat) => {
      let st = { cycle: { batch: 0, stage: 0 } }, n = 0, r;
      do { r = advanceCycle(st, true, mixed, treat); st = { cycle: r }; n++; } while (!r.batchDone && n < 50);
      return n;
    };
    expect(walk(false)).toBe(11);
    expect(walk(true)).toBe(5);
    expect(cycleState(old, true, mixed, true)).toEqual({ batch: 2, stage: 4 });
    expect(advanceCycle({ cycle: { batch: 0, stage: 0, v: CYCLE_V } }, true, mixed, true).v).toBe(CYCLE_V);
  });

  it('word order: a new learner gets the alphabet in control, the mixed order in the treatment', () => {
    expect(cycleOrder({}, false)).toBe(ORDER_ABC);
    expect(cycleOrder({ cycle: { batch: 0, stage: 0, ord: 'mix' } }, false)).toBe(ORDER_ABC);
    expect(cycleOrder({}, true)).toBe(ORDER_MIX);
    expect(batchLabel(0, null, cycleOrder({}, false))).toMatch(/^A/);
    setLadderArmForTests(0);
    try {
      expect(buildSet('batch', { stats: {} }).words.every((w) => /^[ab]/i.test(w.word))).toBe(true);
    } finally { setLadderArmForTests(undefined); }
  });

  it('home: the Next card + 6-item More only for a returning load of the treatment arm', () => {
    const now = Date.now();
    const returning = { players: [{ id: 'a', createdAt: new Date(now - FIRST_VISIT_MS - 1000).toISOString() }] };
    expect(showsHomeNext(returning, true, now)).toBe(true);
    expect(showsHomeNext(returning, false, now)).toBe(false);
    expect(showsHomeNext({ players: [] }, true, now)).toBe(false);
  });

  it("the step map: control renders main's 11 steps and explainer, treatment 5 + the bonus row", () => {
    const props = { lang: 'en', canRead: true, setWords: mixed, currentStepKey: 'fc', doneKeys: [], onStartStep: vi.fn(), onPickSet: vi.fn(), onBack: vi.fn() };
    const { unmount } = render(<LadderMap {...props} treat={false} bonusSteps={bonusFor(true, mixed, false)} />);
    for (const l of ['Image Quiz', 'Tricky Letter', 'Spelling Forge', 'Use the Word', 'Word Zapper']) expect(screen.getByText(l)).toBeInTheDocument();
    expect(screen.getByText('How the 11 steps work')).toBeInTheDocument();
    expect(screen.queryByTestId('ladder-bonus')).toBeNull();
    unmount();
    render(<LadderMap {...props} treat bonusSteps={bonusFor(true, mixed, true)} />);
    expect(screen.queryByText('Image Quiz')).toBeNull();
    expect(screen.getByText('How the 5 steps work')).toBeInTheDocument();
    expect(screen.getByTestId('ladder-bonus')).toBeInTheDocument();
  });
});

describe('beacon: the arm on the ladder tallies + the cyd device funnel', () => {
  beforeEach(() => localStorage.clear());

  it('funnel: start1 → done1 → start2, each once per device', () => {
    const seq = ['start', 'start', 'done', 'done', 'start', 'start', 'done'].map((k) => funnelStep(k, { arm: 1 }));
    expect(seq).toEqual(['start1', null, 'done1', null, 'start2', null, null]);
    localStorage.clear();
    expect(funnelStep('done', { arm: 0 })).toBeNull(); // a finish before any start (adhoc edge) is not a funnel step
    expect(funnelStep('start', { arm: null })).toBeNull(); // uncounted device
    expect(localStorage.getItem(FUNNEL_KEY)).toBeNull();
  });

  it('sendCycle appends ~arm and adds the funnel step; an uncounted device sends main\'s plain items', () => {
    const sent = [];
    const send = (ev) => sent.push(...ev);
    sendCycle('cyc_start', 'b0', { arm: 0, send });
    sendCycle('cyc_stage', 'b0_fc', { arm: 0, send });
    sendCycle('cyc_done', 'b0', { arm: 0, send });
    sendCycle('cyc_start', 'b1', { arm: 0, send });
    expect(sent).toEqual([
      { e: 'cyc_start', i: 'b0~0' }, { e: 'cyd', i: 'start1~0' },
      { e: 'cyc_stage', i: 'b0_fc~0' },
      { e: 'cyc_done', i: 'b0~0' }, { e: 'cyd', i: 'done1~0' },
      { e: 'cyc_start', i: 'b1~0' }, { e: 'cyd', i: 'start2~0' },
    ]);
    sent.length = 0;
    localStorage.clear();
    sendCycle('cyc_start', 'b0', { arm: null, send });
    expect(sent).toEqual([{ e: 'cyc_start', i: 'b0' }]);
  });

  it('the client beacon lets the suffix through (and nothing else new)', () => {
    const beacon = vi.fn(() => true);
    const orig = navigator.sendBeacon;
    navigator.sendBeacon = beacon;
    try {
      sendLearnBatch([{ e: 'cyc_start', i: 'b0~1' }, { e: 'cyd', i: 'start1~1' }, { e: 'x', i: 'b0~7' }, { e: 'x', i: 'a~b' }]);
      const body = JSON.parse(beacon.mock.calls[0][1]);
      expect(body.batch.map((x) => x.i)).toEqual(['b0~1', 'start1~1']);
    } finally { navigator.sendBeacon = orig; }
  });
});
