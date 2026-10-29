# B2 phonics — strand 1: CVC words (design, 2026-10-29)

Roadmap B2 (owner-approved via Factory, "Building Blocks" order: CVC → silent-e →
digraphs). Audience: Hebrew-speaking kids in grades 2–4 for whom decoding — not
vocabulary — is the block (growth doc: 34% of grade-6 kids at the lowest level).
Build after the unit/Band I work; audio is the bottleneck, so it's paced to it.

## What exists
31 real CVC words in the app with a vetted photo + whisper-checked audio
(car/jar excluded — r-controlled, not short vowels):

| vowel | words (★ = on Band I) |
|---|---|
| a (15→13) | cat★ van hat★ bat sad★ jam★ can★ cap cab bag★ dad★ fan★ map |
| e (8) | hen bed★ red★ ten★ pen★ net★ jet vet |
| u (5) | bus★ sun★ cup★ run★ nut |
| o (4) | dog★ fox box★ mom★ |
| i (3) | pig★ six★ fig |

Short o and i are thin, so the strand must not depend on photos alone.

## Two activities (one static game page, /games/word-builder/ or similar)
1. **Read it → tap the picture** (photo words only). A written CVC word; 3 photos.
   Distractors share 2 of 3 letters where possible (cat → hat, cap) so the child
   must read every letter, not guess from the first.
2. **Hear it → pick the spelling** (audio-only, so no photo needed). One spoken
   word; 3 written words that differ in ONE letter — the vowel first (pig / peg /
   pug → only real words), later the first or last consonant (pin / bin / tin).
   This is where thin vowels get filled: ~40 new audio-only words (pot mop log top
   dot hop · lip zip fin kid sit wig · bug mud rug cub hug · …), rendered with the
   Sound Pairs method — accepted only if whisper hears the word and NOT any of its
   one-letter neighbours shown in the same question.

## Sequence (one vowel per level, then mixed)
short a → short i → short o → short u → short e → mixed. Each level: 8 items,
activity 1 then 2. A wrong answer shows the word with the differing letter
highlighted and plays it (and, in activity 2, plays the picked word too).

## Measurement
g_open/g_start/g_lvl/g_cmp @ the game id (games section of the optimizer) +
`cvc` @ `<vowel>_<act1|act2>_<ok|no>` → which vowels Hebrew-UI kids decode worst
(prediction: e vs i, and u vs a — same mergers Sound Pairs measures by ear).

## Not in strand 1
No isolated phoneme audio (Piper can't say /k/ alone cleanly; clipped phonemes
teach the wrong sound). No pronunciation grading (rejected 10-24: child-voice
STT error 11–40%, voice leaves the device). Silent-e and digraphs = strands 2–3
(the Jet 1 U5 guide already teaches th/sh/ch — align the digraph strand to it).

## Effort
~1 day for the page + ~40 audio-only words (Sound Pairs render/check loop);
ship after Nov 14 (keeps the /he/ test clean; link from /he/ then).
