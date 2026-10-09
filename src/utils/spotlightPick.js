// Pure picker for the home "Today's picks" spotlight (kidsdomath game-of-day
// pattern, game-kit PATTERNS §3c). Surfaces the LOWEST-traffic item that hasn't
// GRADUATED, per lane (one vocabulary word, one arcade game), so existing
// arrivals get routed to cold inventory and the beacons collect the engagement
// data that says which items deserve promotion. Graduated items drop out, so
// the next-coldest surfaces on the next build.
//
// Deterministic: a pure function of the committed src/data/cde-stats.json
// snapshot (written by tools/learning/optimizer.mjs) + the catalogs. No
// wall-clock — the same snapshot always yields the same pick. The word lane
// has hundreds of zero-traffic candidates, so its tiebreak is a hash salted
// with the snapshot date: the pick ROTATES per optimizer run instead of
// pinning the alphabetically-first word forever.
//
// Snapshot shape: { generatedAt, window, gamesOpens,
//   words: { [id]: [answers, correct] }, games: { [id]: { opens, lvl, cmp } } }

export const GRAD = {
  word: { ans: 30, acc: 0.7 },   // seen ≥30 quiz answers AND ≥70% correct = learned enough
  game: { opens: 30, depth: 2 }, // ≥30 real opens AND level-ups ÷ opens ≥ 2 (KDM bar)
};

// FNV-1a with a final avalanche. A plain h*31+c hash is affine in the salt, so
// re-salting only SHIFTS every value by the same constant and the arg-min
// (the pick) almost never moves — the mix step is what makes it rotate.
export function hashStr(str) {
  let h = 0x811c9dc5;
  for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b) >>> 0; h ^= h >>> 16;
  return h >>> 0;
}

export function wordStat(snap, id) {
  const s = snap?.words?.[id];
  return Array.isArray(s) ? { ans: s[0] || 0, ok: s[1] || 0 } : { ans: 0, ok: 0 };
}
export function gameStat(snap, id) {
  const s = snap?.games?.[id] || {};
  return { opens: s.opens || 0, lvl: s.lvl || 0, cmp: s.cmp || 0 };
}
export function wordGraduated(s) {
  return s.ans >= GRAD.word.ans && s.ok / s.ans >= GRAD.word.acc;
}
export function gameGraduated(s) {
  return s.opens >= GRAD.game.opens && s.lvl / s.opens >= GRAD.game.depth;
}

/** Lowest-answers non-graduated word; rotating tiebreak by snapshot salt. */
export function pickWord(words, snap) {
  const salt = snap?.generatedAt || '';
  const open = words.filter((w) => !wordGraduated(wordStat(snap, w.id)));
  const pool = open.length ? open : words;
  const ranked = pool.slice().sort((a, b) =>
    (wordStat(snap, a.id).ans - wordStat(snap, b.id).ans)
    || (hashStr(a.id + salt) - hashStr(b.id + salt))
    || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const w = ranked[0];
  return w ? { ...w, ...wordStat(snap, w.id) } : null;
}

/** Lowest-opens (then lowest level-ups) non-graduated game; stable id tiebreak. */
export function pickGame(games, snap) {
  const open = games.filter((g) => !gameGraduated(gameStat(snap, g.id)));
  const pool = open.length ? open : games;
  const ranked = pool.slice().sort((a, b) => {
    const sa = gameStat(snap, a.id), sb = gameStat(snap, b.id);
    return (sa.opens - sb.opens) || (sa.lvl - sb.lvl) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
  const g = ranked[0];
  return g ? { ...g, ...gameStat(snap, g.id) } : null;
}

export function pickSpotlight({ words, games, snap }) {
  const w = pickWord(words, snap);
  const g = pickGame(games, snap);
  return {
    statsFrom: snap?.generatedAt || null,
    gradRule: `word: ans>=${GRAD.word.ans} && acc>=${GRAD.word.acc} · game: opens>=${GRAD.game.opens} && depth>=${GRAD.game.depth}`,
    word: w && { id: w.id, word: w.word, category: w.category, he: w.hebrewTranslation || '', image: w.imageUrl || '', ans: w.ans, ok: w.ok },
    game: g && { id: g.id, name: g.name, emoji: g.emoji, opens: g.opens, lvl: g.lvl, cmp: g.cmp },
  };
}
