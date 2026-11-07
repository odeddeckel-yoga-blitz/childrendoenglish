# Games wave 2: prep only (11-07)

Factory relay of the owner's "do all recommendations", 11-07. **Nothing gets built before the 11-28 wave-1 judge read** (`wave1-judge`). This page covers demand, the words each game needs, where those words come from in the 1,000-word plan, a ladder slot and the picture style. No code, no images.

## Demand: autocomplete, 11-07

Same method as the grammar and wave-1 checks: Google suggest, en with gl=us and he with gl=il, about 1 request per second. Raw data: scratchpad `demand/suggest.json`. Each cell is the number of suggestions per seed, out of 10.

| Candidate | English seeds | Hebrew seeds | Read |
|---|---|---|---|
| Opposites | "opposites game for kids" 10, "opposites in english for kids" 10 (incl. "…with pictures") | **"הפכים באנגלית" 10** (incl. "משחק הפכים באנגלית" and grade 4–6 variants), "מילים הפוכות באנגלית" 1 | **Strongest.** The only candidate with deep Hebrew demand, and it is graded by school year. |
| Blend It | "phonics blending game" 10, "cvc words game" 10, "blending sounds game" 10 | 0 / 0 | Strong in English (US kindergarten/phonics), none in Hebrew. |
| Simon Says | "action verbs game for kids" 6, "simon says action verbs" 2 | "משחק פעלים באנגלית" 1, "סיימון אומר באנגלית" 0 | Weak in both. |
| True or False | "true or false reading for kids" 3, "true or false game english" 0 | "נכון או לא נכון באנגלית" 1 | Weakest. It fills a ladder gap, not a search gap. |

Head terms, for scale: "משחקי אנגלית לילדים" 10 and "english games for kids" 10. The game pages mostly rank behind these hubs, so a game's own query decides only part of its traffic.

**Suggested order if the 11-28 read says to build more games:** Opposites → Blend It → True or False → Simon Says.

## Per candidate

### 1. Opposites (adjective pairs → pair view)
- **Play:** a picture pair, e.g. a full glass next to an empty one. The game says "Which one is *empty*?". Level 2 flips it: one picture, pick its opposite word from 2–3 options.
- **Words it needs:** at least 12 picturable pairs. The site has 47 adjectives today, but all are colours and feelings; the only pair among them is happy/sad.
- **Which batch supplies them:** 1k **batch 7**, 28 adjectives. That gives 13 pairs: big/small, hot/cold, long/short, new/old, clean/dirty, wet/dry, full/empty, fast/slow, tall/short, hard/soft, heavy/light, loud/quiet, tidy/untidy, wide/narrow. Batch 8 adds broken, spotted and striped, but not as pairs.
- **New card type:** a **pair card**, where one image shows both sides, or two images with one shared background. The word list needs a `pair` field.
- **Picture style:** each pair needs a matched set (the same object both ways) or the answer gives itself away. A matched photo pair from stock is rare, so **Fluent 3D doesn't work here**: it has no "empty glass". Drawn matched pairs are our own drawings, and the owner has said no more of those. ⚠ **Open picture question for the owner.** One style per round still applies.
- **Ladder slot:** after `odd-one-out`. Both are about word meaning.
- **Demand note:** the Hebrew grade 4–6 suggestions match /he/english-games/ ages 9–10 and 11–12, so its hub card goes there after 11-14.

### 2. Blend It (phonics blending, the ladder's phonics gap)
- **Play:** the game says /k/ … /æ/ … /t/, and the child picks the matching picture from 3. Level 2 shows letter tiles lighting up as the sounds play. Level 3 drops the picture: the child hears the sounds and picks the written word.
- **Words it needs:** CVC words that can be pictured. **They're already here:** Read It uses `/audio/cvc/`, 90 neighbour-checked words. No new batch is needed.
- **Audio risk:** single phoneme clips (/k/, /æ/). Piper turns lone phonemes into letter names ("kay"). Options: per-phoneme clips cut from words that whisper-check as the bare sound, or a sound-out clip of the stretched word. **Run a whisper/ear spike before any build.**
- **Picture style:** the CVC words are mostly objects and animals, so photos. Check that every round is one style (`CDE_DRAWN`).
- **Ladder slot:** right after `read-it`, the bridge from sounds to reading.

### 3. True or False (the sentence-reading gap)
- **Play:** one picture plus one sentence ("The cat is on the bed." / "This is a dog."), and the child taps ✓ or ✗. Levels: "This is a ___" → colour + noun → preposition sentences.
- **Words it needs:** the existing nouns plus colours. Level 3 needs prepositions (on, in, under), which are function words in **1k tier 10**: not batched yet.
- **Sentences:** generated from templates, never free text. A false sentence swaps one word for a same-category word that is **never a confusable pair**, reusing `collides()`.
- **Picture style:** a single picture, so no style mixing.
- **Ladder slot:** last, after `missing-letter`. It is the most reading-heavy.
- **Note:** this is the only candidate that practises full sentences, and the grammar wing (no build before Nov 15) could reuse its templates.

### 4. Simon Says (action verbs → verb card type)
- **Play:** "Simon says… *jump*!", and the child taps the matching action picture. A trap round leaves out "Simon says".
- **Words it needs:** at least 16 action verbs. The site has **6** today (run, read, write, cook, climb, paint).
- **Which batch supplies them:** 1k **batch 6**, 18 verbs: drink, eat, build, clap, hug, wash, wave, carry, feed, fix, pour, sleep, cry, cut, kick, laugh, listen, sing. **Batch 7** adds 10 more: catch, close, open, pull, push, sit, stand, throw, give, walk.
- **New card type:** a **verb card**, a picture of a person mid-action. That's hard with photos: "unclear subject" is exactly the owner's 11-07 rejection reason. **Fluent 3D has people doing things** (e.g. person running, person swimming), so Fluent is the likely style for this game: one style per round, all Fluent.
- **Ladder slot:** after `word-memory`.
- **Demand:** weakest English after True or False, near zero in Hebrew. Build it only if batch 6 lands anyway.

## What this depends on
- The **Pexels/Pixabay keys** gate batches 2–5 (nouns). Opposites and Simon Says also wait on batches 6–7 and their picture style.
- A **picture decision for adjective pairs** is needed from the owner before Opposites can be specced to build.
- **Blend It needs an audio spike** before it gets a build estimate.
