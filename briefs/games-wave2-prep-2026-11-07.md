# Games wave 2 (11-07)

**Update 11-07, late:** the owner said to build. **Opposites** and **True or False** are built on branch `wave2-games`, each with its own e2e spec. The branch is held from main until the **11-14 SEO read**: the new hub cards change /games/ and the cross-links on the /he/ test pages. The prep notes below are kept as written.

**Update 11-08, "build more":** four more games are on the same branch, picked from the 11-07 autocomplete data (scratchpad `demand/suggest.json`) for games we could make without the stock-photo keys:
- **Feelings:** 13 Fluent faces plus short stories ("רגשות באנגלית" 10/10).
- **Sentence Builder:** reuses True or False's sentences and clips ("sentence building game" 10/10).
- **Beginning Sounds:** letter to the first sound, using existing photos ("beginning sounds game" 10/10, "אותיות באנגלית משחק" 10/10).
- **Simon Says:** 16 Fluent action pictures. This removes the batch-6 dependency described below.

The branch now holds 7 games. All are held until the 11-14 read.

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

**Suggested order if the 11-28 read says to build more games:** Opposites → True or False → Simon Says. (Blend It dropped 11-07: the owner wants whole-word sound only, no sound per letter.)

## Per candidate

### 1. Opposites (adjective pairs → pair view)
- **Play:** a picture pair, e.g. a full glass next to an empty one. The game says "Which one is *empty*?". Level 2 flips it: one picture, pick its opposite word from 2–3 options.
- **Words it needs:** at least 12 picturable pairs. The site has 47 adjectives today, but all are colours and feelings; the only pair among them is happy/sad.
- **Which batch supplies them:** 1k **batch 7**, 28 adjectives. That gives 13 pairs: big/small, hot/cold, long/short, new/old, clean/dirty, wet/dry, full/empty, fast/slow, tall/short, hard/soft, heavy/light, loud/quiet, tidy/untidy, wide/narrow. Batch 8 adds broken, spotted and striped, but not as pairs.
- **New card type:** a **pair card**, where one image shows both sides, or two images with one shared background. The word list needs a `pair` field.
- **Picture style: Fluent 3D icons (owner decision 11-07, option C on the picture-style page).** One style for every round, MIT licence, no keys needed. Pairs that work (previews in scratchpad `opp/`):
  - hot/cold: Hot face / Cold face (backup: Fire / Ice)
  - full/empty: Battery / Low battery
  - loud/quiet: Speaker high volume / Muted speaker
  - heavy/light: Rock / Feather
  - hard/soft: Brick / Teddy bear
  - wet/dry: Umbrella with rain drops / Closed umbrella
  - big/small: Elephant / Mouse, with the small one **drawn at about 42% size** on the shared background
  - tall/short: Evergreen tree / Seedling, with the short one at about 40%
  - plus happy/sad, which is already on the site
  - **Dropped:** fast/slow (speed doesn't show), long/short (the worm looks long too), new/old (Fluent only has young/old people), clean/dirty and wide/narrow (no icon).
  - That makes 9 pairs, under the 12 aimed for. Look for more Fluent pairs before building.
  - A size pair needs a `scale` field in the word list, so the shrunk picture is generated rather than hand-edited.
- **Ladder slot:** after `odd-one-out`. Both are about word meaning.
- **Demand note:** the Hebrew grade 4–6 suggestions match /he/english-games/ ages 9–10 and 11–12, so its hub card goes there after 11-14.

### 2. Blend It (phonics blending, the ladder's phonics gap)
- **Play:** the game says /k/ … /æ/ … /t/, and the child picks the matching picture from 3. Level 2 shows letter tiles lighting up as the sounds play. Level 3 drops the picture: the child hears the sounds and picks the written word.
- **Words it needs:** CVC words that can be pictured. **They're already here:** Read It uses `/audio/cvc/`, 90 neighbour-checked words. No new batch is needed.
- **Audio spike, 11-07** (scratchpad `blend/spike.py`): Piper takes IPA phonemes directly (`phonemes_to_ids` → `phoneme_ids_to_audio`), so it does **not** say letter names.
  - Continuants (æ ʌ ɪ s n) stretched with ː render cleanly.
  - Bare stops (k t p ɡ) come out almost silent (peak 0.02–0.06): they need normalising, or a short schwa ("kuh").
  - Whisper can't judge lone phonemes (it hears "Ha", "Sir"), but it does hear the blended word at the end (cat ✓, pig ✓, sun ✓ after the spelled-out sounds). So the gate for each sound is the **owner's ear**, and the gate for each word is whisper.
  - Sample sent to the owner: `blend/blend-it-sound-test.mp3`, version 1 bare/normalised vs version 2 schwa.
- **Owner decision, 11-07: no sound per letter, only one sound for the whole word.** That removes the blending step, which was the whole point of this game. A child who hears the whole word and picks its picture is already practising that in the existing listening games, so as specced Blend It has nothing left of its own. **Blend It is off the wave-2 list** unless it is redesigned around whole-word audio and adds something the ladder lacks.
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
- ~~Picture decision for adjective pairs~~ Decided 11-07: Fluent 3D icons.
- ~~Blend It needs an audio spike~~ Done 11-07; the owner chose whole-word sound only, so Blend It is dropped.

## 2026-11-08: released early, with guardrails (owner "go with the recommendations")

All 7 games go live on /games/ (hub cards, their own URLs, sitemap). To keep the running reads clean:
- **Spotlight:** the games are `HUB_ONLY_GAMES` in src/data/arcadeGames.js, never home spotlight candidates until the wave1-judge read (11-28).
- **End card:** two next-game loops in public/games/end-card.js. Older games lead only to older games, unchanged, for wave1-judge (11-28) and ladder-return (11-14). The new games lead to each other.
- **/he/ and the SEO holdout pages:** untouched. Wave 2 adds nothing to HE_ARCADE_GAMES or the title-test pages.
- Gate: src/__tests__/wave2Hold.test.js. Lift both guardrails at read `wave2-guardrails-off` (11-28).
- CI moved to 3 Playwright workers: with 2, the wave-2 suite ran 22.6 of 25 min.
- The owner keeps the current pictures as the baseline (Fluent Opposites, the number pictures); revisit once the Pexels/Pixabay keys arrive.
