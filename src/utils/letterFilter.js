// Known-letters filter — "my child is on letter C at school".
// A player may carry `knownLetters: ['A','B','C']` (null/empty = no filter).
// Quiz pools, Lightning expansion, flashcards and the word browser all pass
// through here so the kid only meets words starting with letters they know.
// Distractors are deliberately NOT filtered: the child only has to recognize
// the TARGET word; rival options from unknown letters are fine (and keep
// option sets full even when few letters are known).

export function filterByKnownLetters(words, knownLetters) {
  if (!knownLetters || knownLetters.length === 0) return words;
  const known = new Set(knownLetters.map(l => String(l).toUpperCase()));
  return words.filter(w => known.has(w.word[0].toUpperCase()));
}

/** Letters that actually begin at least one vocabulary word, with counts —
 *  drives the A-Z picker (letters with no words render disabled). */
export function letterCounts(words) {
  const counts = {};
  words.forEach(w => {
    const letter = w.word[0].toUpperCase();
    counts[letter] = (counts[letter] || 0) + 1;
  });
  return counts;
}
