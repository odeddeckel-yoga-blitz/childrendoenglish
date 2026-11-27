# Voice ship batch 5 (branch fix/voice-ship-5)

Ships the final bytes at `3d3573c8` (tip of fix/voice-jenny-j6) for the 494 clips whose final voice was set in Jenny batch J5, on top of origin/main; nothing else from the amy/jenny chains. Size 5.04 MB. Per-clip rows: `ship-5.csv` (sha1 = shipped bytes, old_sha1 = the file it replaces on origin/main).

- voices: en_GB-jenny_dioco-medium 439, en_US-kristin-medium 42, en_US-ljspeech-high 13
- failed the gate in every voice, jenny 1.1 kept (owner ear-check): 12
- kept exceptions (bytes from the earlier kristin redo, J5 kept them): 3: `6b7e1e5c7c.mp3`, `8c9cdabc9f.mp3`, `8dc68f2e76.mp3`

The Jenny batch log follows unchanged.

## Jenny batch J5 (branch fix/voice-jenny-j5, 2026-11-25)

Owner decision 11-25: all clips of the licence redo go to en_GB-jenny_dioco-medium (commercial use OK with credit "Jenny (Dioco)"; British accent accepted). J5: 494 clips (public/audio/s sentences, hashes 4fcf348885..a5a50862f3). Gate: base.en AND small.en must hear the text (words: homophones, digit-to-word map; sentences: word for word). Chain jenny 1.1, 1.0, 0.95, then kristin 1.1/1.0/0.95, then ljspeech-high 1.15/1.0/1.3; nothing passes: keep jenny 1.1 and list it. `old_voice`/`old_sha1` in the csv still name the original (pre-redo) file; the evidence column says what the clip was before this batch. Script: `scripts/voice-jenny-rerender.py`. Exceptions: sentence df015020e6 ("Her name is Lia.") stays kristin by owner vote; a Lia/Mia sentence stays as it was if Jenny fails the gate.

### Counts
| voice | speed | files |
|---|---|---|
| en_GB-jenny_dioco-medium | 0.95 | 13 |
| en_GB-jenny_dioco-medium | 1.0 | 29 |
| en_GB-jenny_dioco-medium | 1.1 | 397 |
| en_US-kristin-medium | 0.95 | 2 |
| en_US-kristin-medium | 1.0 | 7 |
| en_US-kristin-medium | 1.1 | 30 |
| en_US-ljspeech-high | 1.0 | 1 |
| en_US-ljspeech-high | 1.15 | 10 |
| en_US-ljspeech-high | 1.3 | 2 |
| kept | 0 | 3 |
| **by voice** | en_GB-jenny 439, en_US-krist 39, en_US-ljspe 13, kept 3 | 494 |

Kept as they were (name exception): `6b7e1e5c7c.mp3` (Mia has a teddy bear.), `8c9cdabc9f.mp3` (Lia smiles.), `8dc68f2e76.mp3` (Every night Mia sleeps with it.)

### Failed every voice (12): jenny 1.1 kept, owner ear-check

- `555b126699.mp3` "What does Noa want for breakfast?": base 'what does noah want for breakfast', small 'what does noah want for breakfast'
- `5f766d52ee.mp3` "Noa is hungry.": base 'noah is hungry', small 'noah is hungry'
- `6514c24c4a.mp3` "We built a sandcastle at the beach.": base 'we built a sand castle at the beach', small 'we build a sandcastle at the beach'
- `671923dbff.mp3` "The knight rode a white horse.": base 'the night road of highs horse', small 'the knight rode a white horse'
- `69a1c1f62f.mp3` "Wear your raincoat — it is raining outside.": base 'where your raincoat it is raining outside', small 'wear your raincoat it is raining outside'
- `7568d0469e.mp3` "Don’t forget your bag!": base 'dont forget your bag', small 'dont forget your bag'
- `7ce1f08423.mp3` "The duck is gray.": base 'the duck is grey', small 'the duck is grey'
- `805245fff7.mp3` "I finish my homework at five.": base 'i finished my homework at five', small 'i finished my homework at five'
- `80794504ca.mp3` "The zebra ran across the savanna.": base 'the zebra ran across the savanna', small 'the zebra ran across the savannah'
- `994b8ac98c.mp3` "The eagle soared high above the mountains.": base 'the eagle soared high above the mansions', small 'the eagle sword high above the mansions'
- `9ada0cfd40.mp3` "Luna is small and gray.": base 'lunar is small and grey', small 'lunar is small and gray'
- `9ff7f91d50.mp3` "Let’s go in, it is cold.": base 'lets go in it is cold', small 'lets go in it is cold'

### Words where Jenny's British pronunciation differs from American (candidates present in this batch, not fixed)
after, afternoon, answer, aunt, banana, bath, castle, class, fast, glass, grass, half, last, pasta, sandwich, tomato, water, zebra
