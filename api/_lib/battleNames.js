/**
 * Safe, generated nicknames for Vocabulary Class Battle.
 *
 * Kids NEVER type a name — they pick one from a generated adjective+animal
 * list ("Brave Otter"). The server validates every join against these exact
 * lists, so no free-text ever reaches the database. This is the COPPA-safe
 * choice: nothing a child enters can identify them.
 *
 * NOTE: public/battle/battle-core.js carries a copy of these lists for the
 * static page (it cannot import from api/). A unit test in
 * api/__tests__/battle.test.js asserts the two copies stay identical.
 */

export const ADJECTIVES = [
  'Brave', 'Clever', 'Swift', 'Mighty', 'Sunny', 'Cosmic', 'Turbo', 'Lucky',
  'Zippy', 'Sparky', 'Rocket', 'Daring', 'Golden', 'Frosty', 'Jolly', 'Nimble',
  'Plucky', 'Speedy', 'Stellar', 'Wild',
];

export const ANIMALS = [
  'Otter', 'Fox', 'Panda', 'Tiger', 'Eagle', 'Dolphin', 'Koala', 'Wolf',
  'Falcon', 'Rabbit', 'Cheetah', 'Penguin', 'Dragon', 'Gecko', 'Hedgehog',
  'Lynx', 'Moose', 'Narwhal', 'Octopus', 'Puffin',
];

const ADJECTIVE_SET = new Set(ADJECTIVES);
const ANIMAL_SET = new Set(ANIMALS);

/**
 * True only for names of the exact form "<Adjective> <Animal>" built from the
 * two lists above. Everything else (free text, extra spaces, emoji…) fails.
 */
export function isValidNickname(name) {
  if (typeof name !== 'string') return false;
  const parts = name.split(' ');
  if (parts.length !== 2) return false;
  return ADJECTIVE_SET.has(parts[0]) && ANIMAL_SET.has(parts[1]);
}

/**
 * Random unique nickname suggestions (default 8), excluding any in `exclude`.
 */
export function suggestNicknames(count = 8, exclude = []) {
  const taken = new Set(exclude);
  const out = [];
  let guard = 0;
  while (out.length < count && guard < 500) {
    guard++;
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const name = `${adj} ${animal}`;
    if (taken.has(name)) continue;
    taken.add(name);
    out.push(name);
  }
  return out;
}
