/** @module ladderArm — the ladder-next 50/50 split by DEVICE (retro 2026-11-27 rule 3: a holdout for a catalogue-wide change).
 *
 *  The arm comes from the kit's visitor arm (public/arm-bit.js = kit infra/arm-bit.js, synced by scripts/sync-game-kit.mjs;
 *  index.html loads it before the app bundle): window.kitArm('ladder') → 0 | 1 | null. The kit keeps one random number per
 *  salt in localStorage `kit_arm_ladder`, so the arm is sticky per device. Nothing in storage.js touches that key: a player
 *  reset, a player delete or a shared-device reset ("start fresh") must leave `kit_arm_*` and FUNNEL_KEY alone, so a
 *  device never changes arm (src/__tests__/ladderArm.test.js pins it for the resets that exist).
 *
 *    arm 1 = TREATMENT: everything on feat/ladder-next-1127 (5-step ladder + bonus row, one word memory, the returning
 *            home's Next card and the 6-item More, mixed-start word order).
 *    arm 0 = CONTROL: main's behaviour for all of those (11-step ladder, no inbox fold / review card, today's home,
 *            alphabetical order).
 *    null  = crawlers / our harness (navigator.webdriver), the owner's ?internal=1 device, no kit script, or blocked storage
 *            (kitArm.stable false: the arm would change on every load): CONTROL behaviour, and never counted.
 *  The arcade-step save fix (a58abceb) is a bug fix, not the treatment: it runs in both arms.
 *
 *  Beacon (kit land-beacon.md, arm-bit header): nothing new is sent about the device. A counted arm is appended as `~0` / `~1`
 *  to the items of the tallies this read needs (cyc_start, cyc_stage, cyc_done, hn, cyd); api/land.js accepts the suffix
 *  on those events only. cyd is the device funnel, at most once per device per step:
 *    cyd @ start1~a  this device started its first set   (= devices with a set start)
 *    cyd @ done1~a   it finished its first set            (cyc_done)
 *    cyd @ start2~a  it started a set after finishing one (= second-set starts)
 *  FUNNEL_KEY keeps only how far this device got (1 | 2 | 3). Read: tools/reads/ladder-arm-counts.mjs.
 */
import { sendLearnBatch } from './learnBeacon';

export const LADDER_SALT = 'ladder';
export const FUNNEL_KEY = 'cde_ladder_fn';

let forced; // tests only (setLadderArmForTests); undefined = read the kit
let cached;

/** This device's counted arm from the kit: 0 | 1, or null (don't test: control behaviour, not counted). */
export function readLadderArm(w = typeof window !== 'undefined' ? window : undefined) {
  try {
    const kit = w?.kitArm;
    if (typeof kit !== 'function') return null;
    const a = kit(LADDER_SALT);
    if (a !== 0 && a !== 1) return null;
    if (typeof kit.stable === 'function' && !kit.stable(LADDER_SALT)) return null;
    return a;
  } catch {
    return null;
  }
}

/** The arm for this page load (read once, so it can't change mid-session). */
export function ladderArm() {
  if (forced !== undefined) return forced;
  if (cached === undefined) cached = readLadderArm();
  return cached;
}

/** True only for the treatment arm. Every switch point reads this (or takes it as an injected argument). */
export const ladderTreat = (arm = ladderArm()) => arm === 1;

/** The beacon suffix for a counted arm ('~0' | '~1'), '' when the device isn't counted. */
export const armTag = (arm = ladderArm()) => (arm === 0 || arm === 1 ? `~${arm}` : '');

/** Unit / component tests: force the arm (0 | 1 | null); undefined goes back to reading the kit. */
export function setLadderArmForTests(arm) {
  forced = arm;
  cached = undefined;
}

const FUNNEL = { start1: 1, done1: 2, start2: 3 };

/** The cyd device-funnel step a cycle event moves this device to, or null (already counted, or no arm / no storage).
 *  kind: 'start' (cyc_start) | 'done' (cyc_done). Writes FUNNEL_KEY before the caller sends the tally. */
export function funnelStep(kind, { arm = ladderArm(), store } = {}) {
  if (arm !== 0 && arm !== 1) return null;
  let s;
  try { s = store || globalThis.localStorage; } catch { return null; }
  if (!s) return null;
  let at;
  try { at = Number(s.getItem(FUNNEL_KEY)) || 0; } catch { return null; }
  const step = kind === 'start' ? (at === 0 ? 'start1' : at === 2 ? 'start2' : null)
    : kind === 'done' ? (at === 1 ? 'done1' : null) : null;
  if (!step) return null;
  try { s.setItem(FUNNEL_KEY, String(FUNNEL[step])); } catch { return null; }
  return step;
}

/** One ladder tally with this device's arm: cyc_start / cyc_stage / cyc_done @ item~a, plus the cyd funnel step a
 *  start or a finish moves the device to. An uncounted device (null arm) sends the plain item, as main does. */
export function sendCycle(ev, item, { arm = ladderArm(), send = sendLearnBatch, store } = {}) {
  const tag = armTag(arm);
  const events = [{ e: ev, i: item + tag }];
  const kind = ev === 'cyc_start' ? 'start' : ev === 'cyc_done' ? 'done' : null;
  const step = kind && tag ? funnelStep(kind, { arm, store }) : null;
  if (step) events.push({ e: 'cyd', i: step + tag });
  send(events);
  return events;
}
