# Voice ship batch 6 (branch fix/voice-ship-6)

Ships the final bytes at `3d3573c8` (tip of fix/voice-jenny-j6) for the 493 clips whose final voice was set in Jenny batch J6, on top of origin/main; nothing else from the amy/jenny chains. Size 5.01 MB. Per-clip rows: `ship-6.csv` (sha1 = shipped bytes, old_sha1 = the file it replaces on origin/main).

- voices: en_GB-jenny_dioco-medium 452, en_US-kristin-medium 36, en_US-ljspeech-high 5
- failed the gate in every voice, jenny 1.1 kept (owner ear-check): 11
- kept exceptions (bytes from the earlier kristin redo, J6 kept them): 4: `dd6af043bf.mp3`, `df015020e6.mp3`, `e0ae45d224.mp3`, `f56bc777b0.mp3`

The Jenny batch log follows unchanged.

## Jenny batch J6 (branch fix/voice-jenny-j6, 2026-11-25)

Owner decision 11-25: all clips of the licence redo go to en_GB-jenny_dioco-medium (commercial use OK with credit "Jenny (Dioco)"; British accent accepted). J6: 493 clips (public/audio/s sentences, hashes a5c1d08775..ffde5ef36c). Gate: base.en AND small.en must hear the text (words: homophones, digit-to-word map; sentences: word for word). Chain jenny 1.1, 1.0, 0.95, then kristin 1.1/1.0/0.95, then ljspeech-high 1.15/1.0/1.3; nothing passes: keep jenny 1.1 and list it. `old_voice`/`old_sha1` in the csv still name the original (pre-redo) file; the evidence column says what the clip was before this batch. Script: `scripts/voice-jenny-rerender.py`. Exceptions: sentence df015020e6 ("Her name is Lia.") stays kristin by owner vote; a Lia/Mia sentence stays as it was if Jenny fails the gate.

### Counts
| voice | speed | files |
|---|---|---|
| en_GB-jenny_dioco-medium | 0.95 | 8 |
| en_GB-jenny_dioco-medium | 1.0 | 39 |
| en_GB-jenny_dioco-medium | 1.1 | 405 |
| en_US-kristin-medium | 0.95 | 1 |
| en_US-kristin-medium | 1.0 | 4 |
| en_US-kristin-medium | 1.1 | 27 |
| en_US-ljspeech-high | 1.0 | 1 |
| en_US-ljspeech-high | 1.15 | 3 |
| en_US-ljspeech-high | 1.3 | 1 |
| kept | 0 | 4 |
| **by voice** | en_GB-jenny 452, en_US-krist 32, en_US-ljspe 5, kept 4 | 493 |

Kept as they were (name exception): `dd6af043bf.mp3` (Mia looks under the bed.), `df015020e6.mp3` (Her name is Lia.), `e0ae45d224.mp3` (Where does Lia come from?), `f56bc777b0.mp3` (On the first day, Lia sits alone.)

### Failed every voice (11): jenny 1.1 kept, owner ear-check

- `aced2a968e.mp3` "She rode her tricycle around the yard.": base 'she rose her tricycle around the yard', small 'she rode her tricycle around the yard'
- `b3ed95559e.mp3` "After breakfast, Noa and her brother go to the park.": base 'after breakfast noah and her brother go to the park', small 'after breakfast noah and her brother go to the park'
- `b9196af900.mp3` "Tom can not play outside.": base 'tom cannot play outside', small 'tom cannot play outside'
- `baf264ba0a.mp3` "Maya and her family go to the beach.": base 'meyer and her family go to the beach', small 'meyer and her family go to the beach'
- `c57382cf9b.mp3` "She can not swim.": base 'she cannot swim', small 'she cannot swim'
- `d1d326cf30.mp3` "The curious cat peeked inside the box.": base 'the curious cat peaked inside the box', small 'the curious cat peeked inside the box'
- `d221b07873.mp3` "The leaves change color in autumn.": base 'the least changed color in autumn', small 'the leaves change colour in autumn'
- `dd904361d1.mp3` "Ducks swim in the lake.": base 'jack swim in the lake', small 'juck swim in the lake'
- `ea91e10383.mp3` "Eilat is in the south.": base 'eyelash is in the south', small 'eyelash is in the south'
- `ee9da74856.mp3` "I’m sorry, I am late.": base 'im sorry im late', small 'im sorry im late'
- `f87714818a.mp3` "Dad’s cellphone is on the table.": base 'dads cellphone is on the table', small 'dads cell phone is on the table'

### Words where Jenny's British pronunciation differs from American (candidates present in this batch, not fixed)
after, afternoon, answer, aunt, banana, can't, castle, class, dance, fast, glass, grass, last, laugh, pasta, plant, sandwich, staff, tomato, vase, water, yogurt
