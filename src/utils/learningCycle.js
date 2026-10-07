/** @module learningCycle — the guided learn→practice→advance loop.
 *
 * v2 (plans/learning-cycle: full practice ladder, 2026-10-07): each ~10-word SET
 * climbs an 11-step ladder — meet → understand → spell → use → master — built
 * from existing quiz modes, two new in-app games (Letter Fix, Sentence Gap) and
 * the three arcade games scoped to the set. Sets come from four sources: the
 * cycle batch (default, persisted in stats.cycle), chosen letter(s), a surprise
 * draw, or the least-practiced words. SOFT gate throughout: finishing a step
 * advances; true mastery accrues across days via SRS resurfacing.
 *
 * Cycle position lives in per-player stats as stats.cycle = { batch, stage },
 * where stage is an index into stepsFor(...). Older players lack the key —
 * always read through cycleState().
 */
import { WORDS } from '../data/words';

export const BATCH_SIZE = 10;
const LEVEL_RANK = { beginner: 0, intermediate: 1, advanced: 2 };

/** The canonical ladder. kind: 'flashcards' | 'quiz' | 'letterfix' | 'sentence'
 *  | 'arcade'. needsReading steps are auto-skipped for pre-readers; writing
 *  steps carry a user-facing skip affordance (explainer says writing is optional). */
export const LADDER = [
  { key: 'fc',    kind: 'flashcards', labelKey: 'stepFlashcards' },
  { key: 'aud',   kind: 'quiz', mode: 'audio', preReaderMode: 'listen', labelKey: 'stepAudio' },
  { key: 'wq',    kind: 'quiz', mode: 'word',  needsReading: true, labelKey: 'stepWordQuiz' },
  { key: 'iq',    kind: 'quiz', mode: 'image', needsReading: true, labelKey: 'stepImageQuiz' },
  { key: 'conv',  kind: 'arcade', game: 'category-conveyor', needsCategories: 2, labelKey: 'stepConveyor' },
  { key: 'lf1',   kind: 'letterfix', mode: 'easy',   needsReading: true, writing: true, labelKey: 'stepLetterFix1' },
  { key: 'lf2',   kind: 'letterfix', mode: 'double', needsReading: true, writing: true, labelKey: 'stepLetterFix2' },
  { key: 'lf3',   kind: 'letterfix', mode: 'hard',   needsReading: true, writing: true, labelKey: 'stepLetterFix3' },
  { key: 'forge', kind: 'arcade', game: 'spelling-forge', needsReading: true, writing: true, labelKey: 'stepForge' },
  { key: 'sent',  kind: 'sentence', needsReading: true, labelKey: 'stepSentence' },
  { key: 'zap',   kind: 'arcade', game: 'word-zapper', labelKey: 'stepZapper' },
];

/** Phases for the step map UI (keys must cover LADDER exactly). */
export const PHASES = [
  { labelKey: 'phaseMeet', steps: ['fc'] },
  { labelKey: 'phaseUnderstand', steps: ['aud', 'wq', 'iq', 'conv'] },
  { labelKey: 'phaseSpell', steps: ['lf1', 'lf2', 'lf3', 'forge'] },
  { labelKey: 'phaseUse', steps: ['sent'] },
  { labelKey: 'phaseMaster', steps: ['zap'] },
];

/** The ladder for a given learner + word set: pre-readers lose needsReading
 *  steps; the conveyor needs the set to span ≥2 categories or its bins starve. */
export function stepsFor(canRead, setWords = null) {
  const cats = new Set((setWords || []).map((w) => w.category));
  return LADDER.filter((s) => {
    if (s.needsReading && !canRead) return false;
    if (s.needsCategories && setWords && cats.size < s.needsCategories) return false;
    return true;
  });
}

/** Deterministic full-catalog sequence (same inputs → same order, always). */
export function cycleSequence(knownLetters = null) {
  const known = knownLetters?.length ? new Set(knownLetters.map((l) => l.toLowerCase())) : null;
  return [...WORDS].sort((a, b) => {
    if (known) {
      const ak = known.has(a.word[0].toLowerCase()) ? 0 : 1;
      const bk = known.has(b.word[0].toLowerCase()) ? 0 : 1;
      if (ak !== bk) return ak - bk;
    }
    const al = LEVEL_RANK[a.level] ?? 1;
    const bl = LEVEL_RANK[b.level] ?? 1;
    if (al !== bl) return al - bl;
    const aw = a.word.toLowerCase();
    const bw = b.word.toLowerCase();
    return aw < bw ? -1 : aw > bw ? 1 : 0;
  });
}

export function batchCount(knownLetters = null) {
  return Math.ceil(cycleSequence(knownLetters).length / BATCH_SIZE);
}

/** The words of batch i (clamped; the last batch may be short). */
export function batchWords(batchIdx, knownLetters = null) {
  const seq = cycleSequence(knownLetters);
  const i = Math.max(0, Math.min(batchIdx, Math.ceil(seq.length / BATCH_SIZE) - 1));
  return seq.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
}

/** Letter span label for a batch, e.g. "A" or "A–B" — the kid-facing batch name. */
export function batchLabel(batchIdx, knownLetters = null) {
  const words = batchWords(batchIdx, knownLetters);
  if (words.length === 0) return '';
  const first = words[0].word[0].toUpperCase();
  const last = words[words.length - 1].word[0].toUpperCase();
  return first === last ? first : `${first}–${last}`;
}

/** Build a practice set from one of the four sources.
 *  source: 'batch' | 'letters' | 'surprise' | 'fresh'
 *  opts: { stats, knownLetters, letters (for 'letters'), size (default 10),
 *          seed (for 'surprise' — pass a session-stable number) }
 *  Returns { words, token } — token is the beacon batch-token ('b<idx>' | 'adhoc'). */
export function buildSet(source, opts = {}) {
  const size = opts.size || BATCH_SIZE;
  if (source === 'batch') {
    const { batch } = cycleState(opts.stats);
    return { words: batchWords(batch, opts.knownLetters), token: 'b' + batch };
  }
  if (source === 'letters') {
    const chosen = new Set((opts.letters || []).map((l) => l.toLowerCase()));
    const pool = WORDS.filter((w) => chosen.has(w.word[0].toLowerCase()));
    // Deterministic easy-first inside the chosen letters
    const ordered = cycleSequence().filter((w) => chosen.has(w.word[0].toLowerCase()));
    return { words: ordered.slice(0, Math.max(size, Math.min(pool.length, size))), token: 'adhoc' };
  }
  if (source === 'surprise') {
    // Seeded shuffle (mulberry32) so a session's "surprise" set is stable
    const seed = opts.seed ?? 1;
    let t = seed >>> 0;
    const rand = () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    const pool = [...WORDS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return { words: pool.slice(0, size), token: 'adhoc' };
  }
  if (source === 'fresh') {
    // Least-practiced: fewest recorded attempts; ties broken by cycle order
    const prog = opts.stats?.wordProgress || {};
    const order = cycleSequence(opts.knownLetters);
    const attempts = (w) => {
      const p = prog[w.id];
      return p ? (p.correct || 0) + (p.wrong || 0) : 0;
    };
    const ranked = order
      .map((w, i) => ({ w, a: attempts(w), i }))
      .sort((x, y) => x.a - y.a || x.i - y.i)
      .map((x) => x.w);
    return { words: ranked.slice(0, size), token: 'adhoc' };
  }
  throw new Error('unknown set source: ' + source);
}

/** Repeat draws for "again with different/more words" on a step.
 *  different → a fresh surprise-style draw of the same size from the source pool;
 *  more → current set + the next `size` words of the source (capped 2×BATCH). */
export function repeatSet(currentWords, source, opts = {}) {
  const kind = opts.kind || 'different';
  if (kind === 'more') {
    const extra = buildSet(source === 'batch' ? 'fresh' : source, { ...opts, size: BATCH_SIZE * 2 });
    const have = new Set(currentWords.map((w) => w.id));
    const added = extra.words.filter((w) => !have.has(w.id));
    return [...currentWords, ...added].slice(0, BATCH_SIZE * 2);
  }
  const seed = (opts.seed ?? 1) + 101;
  return buildSet('surprise', { ...opts, seed, size: currentWords.length }).words;
}

/** Safe read of the per-player cycle position (older stats lack the key). */
export function cycleState(stats) {
  const c = stats?.cycle;
  return { batch: c?.batch ?? 0, stage: c?.stage ?? 0 };
}

/** Advance after a COMPLETED (not quit/skipped-backward) ladder step. */
export function advanceCycle(stats, canRead, setWords = null) {
  const { batch, stage } = cycleState(stats);
  const ladder = stepsFor(canRead, setWords || batchWords(batch));
  if (stage + 1 < ladder.length) {
    return { batch, stage: stage + 1, batchDone: false };
  }
  const last = batchCount() - 1;
  return { batch: Math.min(batch + 1, last + 1), stage: 0, batchDone: true };
}

/** Back-compat alias used by pre-ladder call sites/tests. */
export const stagesFor = (canRead) =>
  stepsFor(canRead).filter((s) => s.kind === 'quiz').map((s) => (canRead ? s.mode : s.preReaderMode || s.mode));

/** Mastered-words count (same definition the Progress dashboard uses). */
export function masteredCount(stats) {
  return Object.values(stats?.wordProgress || {}).filter((w) => w.interval >= 14).length;
}

/** Spelling mastery (fed by Letter Fix results): ok − no ≥ 3. */
export function spellMasteredCount(stats) {
  return Object.values(stats?.spelling || {}).filter((s) => (s.ok || 0) - (s.no || 0) >= 3).length;
}

// ---------------------------------------------------------------------------
// Letter Fix planning — which letter(s) to blank, and the 4 options per blank.
// ---------------------------------------------------------------------------

// Patterns whose letters are NOT phonetically obvious (silent/tricky):
// kn-, wr-, -mb, gh, magic-e, doubled letters, soft-c/k ambiguity.
const SILENTISH = [
  { re: /^kn/i, idx: 0 },      // knight → k
  { re: /^wr/i, idx: 0 },      // write → w
  { re: /mb$/i, idxFromEnd: 0 }, // comb → b (the silent final b)
  { re: /gh/i, find: 'gh', pick: 1 }, // night → h
  { re: /e$/i, idxFromEnd: 0, onlyIfLen: 4 }, // magic-e: cake → e (the final e)
];
const CONFUSABLE = {
  b: ['d', 'p', 'q'], d: ['b', 'p', 'q'], p: ['b', 'd', 'q'], q: ['b', 'd', 'p'],
  c: ['k', 's', 'g'], k: ['c', 'g', 'q'], s: ['c', 'z', 'x'], g: ['j', 'c', 'k'],
  m: ['n', 'w', 'u'], n: ['m', 'u', 'h'], u: ['v', 'n', 'w'], v: ['u', 'w', 'y'],
  i: ['e', 'y', 'l'], e: ['i', 'a', 'o'], a: ['e', 'o', 'u'], o: ['a', 'u', 'e'],
  f: ['v', 't', 'ph'.charAt(0)], t: ['d', 'f', 'l'], l: ['i', 'r', 't'], r: ['l', 'n', 'v'],
  h: ['n', 'b', 'k'], j: ['g', 'y', 'i'], w: ['v', 'm', 'u'], x: ['s', 'z', 'k'],
  y: ['i', 'j', 'u'], z: ['s', 'x', 'c'],
};
const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

function silentIndexes(text) {
  const out = new Set();
  for (const p of SILENTISH) {
    if (p.onlyIfLen && text.length < p.onlyIfLen) continue;
    if (!p.re.test(text)) continue;
    if (p.find) {
      const i = text.toLowerCase().indexOf(p.find);
      if (i >= 0) out.add(i + p.pick);
    } else if (p.idxFromEnd !== undefined) out.add(text.length - 1 - p.idxFromEnd);
    else out.add(p.idx);
  }
  return out;
}

function optionsFor(letter) {
  const base = CONFUSABLE[letter.toLowerCase()] || [];
  const opts = [letter.toLowerCase()];
  for (const c of base) if (!opts.includes(c)) opts.push(c);
  let i = 0;
  while (opts.length < 4) {
    const c = ALPHA[(ALPHA.indexOf(letter.toLowerCase()) + 7 * ++i) % 26];
    if (!opts.includes(c)) opts.push(c);
  }
  // Deterministic rotation so the answer isn't always first
  const rot = letter.toLowerCase().charCodeAt(0) % 4;
  return opts.slice(rot).concat(opts.slice(0, rot)).slice(0, 4);
}

/** Plan the blanks for a word: { blanks: [{index, letter, options[4]}] }.
 *  easy: one phonetically obvious letter (never from the silent set, prefer a
 *  mid-word consonant); double: two easy blanks; hard: a silent/tricky letter
 *  (falls back to the word's rarest letter). Multi-word entries blank only
 *  within the first word segment. */
export function letterFixPlan(word, mode) {
  const text = word.word.toLowerCase().replace(/[^a-z].*$/, ''); // first segment
  if (text.length < 3) {
    const idx = Math.min(1, text.length - 1);
    return { blanks: [{ index: idx, letter: text[idx], options: optionsFor(text[idx]) }] };
  }
  const silent = silentIndexes(text);
  const candidates = [];
  for (let i = 0; i < text.length; i++) {
    if (!/[a-z]/.test(text[i])) continue;
    candidates.push(i);
  }
  const easyPool = candidates.filter((i) => !silent.has(i) && i !== 0); // keep the anchor first letter
  const pick = (pool, seedShift) => pool[(text.charCodeAt(0) + seedShift) % pool.length];

  if (mode === 'easy') {
    const i = pick(easyPool.length ? easyPool : candidates, 1);
    return { blanks: [{ index: i, letter: text[i], options: optionsFor(text[i]) }] };
  }
  if (mode === 'double') {
    const pool = easyPool.length >= 2 ? easyPool : candidates;
    const i1 = pick(pool, 1);
    const rest = pool.filter((i) => Math.abs(i - i1) > 1); // non-adjacent blanks
    const i2 = rest.length ? pick(rest, 3) : pool.find((i) => i !== i1) ?? i1;
    const [a, b] = [i1, i2].sort((x, y) => x - y);
    return {
      blanks: [
        { index: a, letter: text[a], options: optionsFor(text[a]) },
        { index: b, letter: text[b], options: optionsFor(text[b]) },
      ],
    };
  }
  // hard: silent/tricky first; else the rarest letter in English frequency terms
  if (silent.size > 0) {
    const i = [...silent][0];
    return { blanks: [{ index: i, letter: text[i], options: optionsFor(text[i]) }] };
  }
  const FREQ = 'etaoinshrdlcumwfgypbvkjxqz';
  const rarest = [...candidates].sort((a, b) => FREQ.indexOf(text[b]) - FREQ.indexOf(text[a]))[0];
  return { blanks: [{ index: rarest, letter: text[rarest], options: optionsFor(text[rarest]) }] };
}
