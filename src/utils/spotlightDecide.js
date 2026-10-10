// Hourly keep-or-swap decision for the home spotlight (owner spec 2026-10-10):
//   1. has the spotlighted word/game had SUFFICIENT traffic since it went up?
//   2. if so → refresh the engagement snapshot (run the optimizer) and decide
//      whether the item also needs the word/game IMPROVER (flag it);
//   3. keep the item or swap it for the next-coldest candidate.
// Pure: same inputs → same output. Callers: scripts/pick-spotlight.mjs
// (prebuild, no live data, now = snapshot date → deterministic builds) and
// tools/spotlight/hourly.mjs (live Neon counts, wall clock).
import { pickWord, pickGame, wordStat, gameStat, wordGraduated, gameGraduated, GRAD } from './spotlightPick.js';

export const RULES = {
  sufficientSpot: 5,       // card clicks since `since`
  sufficientExposure: 10,  // word answers / game opens since `since`
  judgeExposure: 20,       // enough exposure to judge engagement
  poorWordAcc: 0.5,        // ok/ans below this → swap + flag improver
  poorGameDepth: 0.5,      // level-ups/opens below this → swap + flag improver
  watchWordAcc: 0.6,       // below this (but not poor) → flag improver, keep
  watchGameDepth: 1.0,
  maxTenureDays: 14,       // rotate even an engaging item after this
  idleTenureDays: 7,       // rotate sooner when the spotlight isn't moving it
  cooldownDays: 30,        // don't re-spotlight an item within this window
};

const DAY = 86400000;

// Which asset is at fault for a word, from the per-probe answer split and the
// explicit feedback taps (both in the snapshot). Explicit taps win when ≥2
// agree; else the probe with the lowest accuracy over ≥5 answers.
export const PROBE_ASSET = { aud: 'audio', img: 'image', txt: 'word' };
export function diagnoseWord(snap, id) {
  const fbOf = (k) => snap?.fb?.[`${id}@${k}`] || 0;
  const taps = { image: fbOf('img'), audio: fbOf('aud'), word: fbOf('hard') };
  const topTap = Object.entries(taps).sort((a, b) => b[1] - a[1])[0];
  if (topTap && topTap[1] >= 2) return { asset: topTap[0], evidence: `${topTap[1]} parent taps`, taps };
  const probes = Object.entries(PROBE_ASSET)
    .map(([p, asset]) => { const m = snap?.modes?.[`${id}@${p}`]; return m && m[0] >= 5 ? { asset, acc: m[1] / m[0], n: m[0] } : null; })
    .filter(Boolean).sort((a, b) => a.acc - b.acc);
  if (probes.length && probes[0].acc < 0.6) return { asset: probes[0].asset, evidence: `${Math.round(probes[0].acc * 100)}% over ${probes[0].n} ${probes[0].asset} probes`, taps, probes };
  return { asset: 'unknown', evidence: probes.length ? 'all probes ≥60%' : 'no per-probe data yet', taps, probes };
}
const ms = (t) => (typeof t === 'number' ? t : t ? Date.parse(t) : NaN);
export const daysBetween = (a, b) => (ms(b) - ms(a)) / DAY;

function recentIds(history, lane, now) {
  return new Set((history || [])
    .filter((h) => h.lane === lane && Number.isFinite(ms(h.at)) && daysBetween(h.at, now) < RULES.cooldownDays)
    .flatMap((h) => [h.from, h.to].filter(Boolean)));
}

/** Per-lane verdict. live = { spot, exposure, good } since `since` (or null). */
export function judgeLane(lane, cur, live, snap, now) {
  if (!cur?.id) return { action: 'fill', reason: 'empty lane' };
  const since = cur.since || now;
  const tenure = daysBetween(since, now);
  const exposure = live?.exposure ?? 0;
  const spot = live?.spot ?? 0;
  const sufficient = spot >= RULES.sufficientSpot || exposure >= RULES.sufficientExposure;
  const rate = exposure > 0 ? (live?.good ?? 0) / exposure : null;
  const poor = lane === 'word' ? RULES.poorWordAcc : RULES.poorGameDepth;
  const watch = lane === 'word' ? RULES.watchWordAcc : RULES.watchGameDepth;
  const graduated = lane === 'word' ? wordGraduated(wordStat(snap, cur.id)) : gameGraduated(gameStat(snap, cur.id));
  const flag = sufficient && exposure >= RULES.judgeExposure && rate !== null && rate < watch
    ? { lane, id: cur.id, exposure, rate: Number(rate.toFixed(2)), severity: rate < poor ? 'poor' : 'watch', ...(lane === 'word' ? { diagnosis: diagnoseWord(snap, cur.id) } : {}) } : null;
  let action = 'keep', reason = sufficient ? 'engaging, keep collecting' : 'waiting for traffic';
  if (graduated) { action = 'swap'; reason = `graduated (${lane === 'word' ? `ans≥${GRAD.word.ans}, acc≥${GRAD.word.acc}` : `opens≥${GRAD.game.opens}, depth≥${GRAD.game.depth}`})`; }
  else if (flag?.severity === 'poor') { action = 'swap'; reason = `low engagement after ${exposure} exposures (rate ${flag.rate}) → improver`; }
  else if (tenure >= RULES.maxTenureDays) { action = 'swap'; reason = `max tenure ${RULES.maxTenureDays}d`; }
  else if (!sufficient && tenure >= RULES.idleTenureDays) { action = 'swap'; reason = `no traffic after ${RULES.idleTenureDays}d, rotate`; }
  return { action, reason, sufficient, tenureDays: Number(tenure.toFixed(2)), spot, exposure, rate, flag };
}

export function decideSpotlight({ prev = null, snap, words, games, now, live = null }) {
  const nowIso = new Date(ms(now)).toISOString();
  const history = [...(prev?.history || [])];
  const changes = [];
  const flags = [];
  const verdicts = {};
  const out = { statsFrom: snap?.generatedAt || null, gradRule: prev?.gradRule || null, word: null, game: null, history };

  for (const lane of ['word', 'game']) {
    const cur = prev?.[lane] || null;
    const v = judgeLane(lane, cur, live?.[lane] || null, snap, now);
    verdicts[lane] = v;
    if (v.flag) flags.push(v.flag);
    if (v.action === 'keep') {
      const stat = lane === 'word' ? wordStat(snap, cur.id) : gameStat(snap, cur.id);
      out[lane] = { ...cur, ...stat, since: cur.since || nowIso };
      continue;
    }
    const exclude = recentIds(history, lane, now);
    if (cur?.id) exclude.add(cur.id);
    const pool = lane === 'word' ? words.filter((w) => !exclude.has(w.id)) : games.filter((g) => !exclude.has(g.id));
    const pick = lane === 'word' ? pickWord(pool.length ? pool : words, snap) : pickGame(pool.length ? pool : games, snap);
    if (!pick) { out[lane] = cur; continue; }
    if (cur?.id === pick.id) { out[lane] = { ...cur, since: cur.since || nowIso }; continue; } // nothing better to swap to
    out[lane] = lane === 'word'
      ? { id: pick.id, word: pick.word, category: pick.category, he: pick.hebrewTranslation || '', image: pick.imageUrl || '', ans: pick.ans, ok: pick.ok, since: nowIso }
      : { id: pick.id, name: pick.name, emoji: pick.emoji, opens: pick.opens, lvl: pick.lvl, cmp: pick.cmp, since: nowIso };
    const change = { lane, from: cur?.id || null, to: pick.id, reason: v.reason, at: nowIso };
    changes.push(change);
    history.push(change);
  }
  out.history = history.slice(-60);
  out.gradRule = `word: ans>=${GRAD.word.ans} && acc>=${GRAD.word.acc} · game: opens>=${GRAD.game.opens} && depth>=${GRAD.game.depth}`;
  const runOptimizer = !!(verdicts.word?.sufficient || verdicts.game?.sufficient);
  return { next: out, changes, flags, verdicts, runOptimizer };
}
