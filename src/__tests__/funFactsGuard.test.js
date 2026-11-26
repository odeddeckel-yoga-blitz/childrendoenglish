// Full review 11-26 (audit-cde): 7 fun facts were health claims or myths and went into llms-full.txt.
// Owner rule: no health claims. This guards the data against those and similar patterns.
import { describe, it, expect } from 'vitest';
import { ENRICHMENTS } from '../data/word-enrichments.js';

const BAD = [
  [/hours of sleep/i, 'sleep-need health claim'],
  [/your heart beats faster|heart is about the size of a small car/i, 'body-reaction claim / whale-heart myth'],
  [/before it needs to be washed/i, 'hygiene claim'],
  [/20% of the world.s oxygen/i, 'Amazon oxygen myth'],
  [/Marco Polo/i, 'spaghetti myth'],
  [/longer than the Great Wall/i, 'Dingo Fence vs Great Wall error'],
  [/brain (actually )?cleans itself/i, 'brain-cleaning health claim'],
  [/\b(cures?|treats?|prevents?) (a |the )?(disease|illness|cancer|cold|flu)\b/i, 'medical claim'],
];

const facts = Object.entries(ENRICHMENTS).map(([k, v]) => [k, v && v.funFact]).filter(([, f]) => typeof f === 'string');

describe('word fun facts', () => {
  it('has the expected number of facts', () => { expect(facts.length).toBeGreaterThan(300); });
  it.each(BAD)('no fact matches %s (%s)', (re) => {
    const hit = facts.filter(([, f]) => re.test(f)).map(([k]) => k);
    expect(hit).toEqual([]);
  });
});
