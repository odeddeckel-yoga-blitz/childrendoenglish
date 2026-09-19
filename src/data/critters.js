/**
 * @module critters — collectible emoji critters (cross-mode meta-progression).
 *
 * Same idiom as badges.js: each critter has a check(stats, game) rule. Earned
 * ids persist in stats.critters (per-player, via storage.js). Rules read the
 * ALREADY-UPDATED stats object (plus optional per-run `game` context), and are
 * checked after quiz completions and lightning rounds. Idempotent per id —
 * checkCritters only returns critters not yet in stats.critters.
 *
 * `stats.arcade` shape (see storage.js defaults):
 *   { bestByMode, lightningBest, lightningRounds, categoriesTried, modesPlayed }
 */

const maxOf = (obj) => Object.values(obj || {}).reduce((m, v) => (v > m ? v : m), 0);

export const CRITTERS = [
  {
    id: 'chick',
    emoji: '🐣',
    nameKey: 'critter_chick_name',
    hintKey: 'critter_chick_hint',
    check: (stats) => (stats.totalQuizzes || 0) >= 1,
  },
  {
    id: 'fox',
    emoji: '🦊',
    nameKey: 'critter_fox_name',
    hintKey: 'critter_fox_hint',
    check: (stats) => (stats.totalQuizzes || 0) >= 3,
  },
  {
    id: 'owl',
    emoji: '🦉',
    nameKey: 'critter_owl_name',
    hintKey: 'critter_owl_hint',
    // Perfect quiz — needs the per-run game context
    check: (stats, game) => !!game && game.total > 0 && game.score === game.total,
  },
  {
    id: 'turtle',
    emoji: '🐢',
    nameKey: 'critter_turtle_name',
    hintKey: 'critter_turtle_hint',
    check: (stats) => (stats.longestStreak || 0) >= 5,
  },
  {
    id: 'frog',
    emoji: '🐸',
    nameKey: 'critter_frog_name',
    hintKey: 'critter_frog_hint',
    check: (stats) => (stats.arcade?.lightningRounds || 0) >= 1,
  },
  {
    id: 'unicorn',
    emoji: '🦄',
    nameKey: 'critter_unicorn_name',
    hintKey: 'critter_unicorn_hint',
    check: (stats) => maxOf(stats.arcade?.lightningBest) >= 10,
  },
  {
    id: 'octopus',
    emoji: '🐙',
    nameKey: 'critter_octopus_name',
    hintKey: 'critter_octopus_hint',
    check: (stats) => (stats.arcade?.categoriesTried?.length || 0) >= 3,
  },
  {
    id: 'whale',
    emoji: '🐳',
    nameKey: 'critter_whale_name',
    hintKey: 'critter_whale_hint',
    check: (stats) => (stats.arcade?.modesPlayed?.length || 0) >= 4,
  },
  {
    id: 'eagle',
    emoji: '🦅',
    nameKey: 'critter_eagle_name',
    hintKey: 'critter_eagle_hint',
    // 10-question ceiling is ~251 (perfect + all fast), so 200 = a blazing run
    check: (stats) => maxOf(stats.arcade?.bestByMode) >= 200,
  },
  {
    id: 'dino',
    emoji: '🦖',
    nameKey: 'critter_dino_name',
    hintKey: 'critter_dino_hint',
    check: (stats) => (stats.totalQuizzes || 0) >= 25,
  },
  {
    id: 'panda',
    emoji: '🐼',
    nameKey: 'critter_panda_name',
    hintKey: 'critter_panda_hint',
    check: (stats) => (stats.longestStreak || 0) >= 7,
  },
  {
    id: 'star',
    emoji: '🌟',
    nameKey: 'critter_star_name',
    hintKey: 'critter_star_hint',
    // Collect-them-all finale (evaluated against earned incl. this pass)
    check: (stats) => {
      const earned = stats.critters || [];
      return CRITTERS.filter(c => c.id !== 'star').every(c => earned.includes(c.id));
    },
  },
];

export const getCritterById = (id) => CRITTERS.find(c => c.id === id);

/**
 * Return newly-earned critter ids (not yet in stats.critters).
 * Pure — does NOT mutate stats. The 'star' rule sees critters earned in the
 * same pass, so a run that completes the set also hatches Nova.
 * @param {object} stats - updated stats (post quiz/lightning bookkeeping)
 * @param {object} [game] - per-run context { score, total, mode }
 * @returns {string[]} new critter ids in CRITTERS order
 */
export function checkCritters(stats, game) {
  const earned = Array.isArray(stats.critters) ? [...stats.critters] : [];
  const added = [];
  for (const c of CRITTERS) {
    if (earned.includes(c.id)) continue;
    let ok = false;
    try {
      ok = !!c.check({ ...stats, critters: earned }, game);
    } catch {
      ok = false;
    }
    if (ok) {
      earned.push(c.id);
      added.push(c.id);
    }
  }
  return added;
}
