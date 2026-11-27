# Voice ship batch 3 (branch fix/voice-ship-3)

Ships the final bytes at `3d3573c8` (tip of fix/voice-jenny-j6) for the 523 clips whose final voice was set in Jenny batch J3, on top of origin/main; nothing else from the amy/jenny chains. Size 4.21 MB. Per-clip rows: `ship-3.csv` (sha1 = shipped bytes, old_sha1 = the file it replaces on origin/main).

- voices: en_GB-jenny_dioco-medium 486, en_US-kristin-medium 35, en_US-ljspeech-high 2
- failed the gate in every voice, jenny 1.1 kept (owner ear-check): 10

The Jenny batch log follows unchanged.

## Jenny batch J3 (branch fix/voice-jenny-j3, 2026-11-25)

Owner decision 11-25: all clips of the licence redo go to en_GB-jenny_dioco-medium (commercial use OK with credit "Jenny (Dioco)"; British accent accepted). J3: 523 clips (true-or-false). Gate: base.en AND small.en must hear the text (words: homophones, digit-to-word map; sentences: word for word). Chain jenny 1.1, 1.0, 0.95, then kristin 1.1/1.0/0.95, then ljspeech-high 1.15/1.0/1.3; nothing passes: keep jenny 1.1 and list it. `old_voice`/`old_sha1` in the csv still name the original (pre-redo) file; the evidence column says what the clip was before this batch. Script: `scripts/voice-jenny-rerender.py`. Exceptions: sentence df015020e6 ("Her name is Lia.") stays kristin by owner vote; a Lia/Mia sentence stays as it was if Jenny fails the gate.

### Counts
| voice | speed | files |
|---|---|---|
| en_GB-jenny_dioco-medium | 0.95 | 10 |
| en_GB-jenny_dioco-medium | 1.0 | 46 |
| en_GB-jenny_dioco-medium | 1.1 | 430 |
| en_US-kristin-medium | 1.0 | 3 |
| en_US-kristin-medium | 1.1 | 32 |
| en_US-ljspeech-high | 1.0 | 1 |
| en_US-ljspeech-high | 1.15 | 1 |
| **by voice** | en_GB-jenny 486, en_US-krist 35, en_US-ljspe 2 | 523 |

### Failed every voice (10): jenny 1.1 kept, owner ear-check

- `a-firetruck-is-a-vegetable.mp3` "A firetruck is a vegetable.": base 'a fire truck is a vegetable', small 'a fire truck is a vegetable'
- `a-firetruck-is-a-vehicle.mp3` "A firetruck is a vehicle.": base 'a fire truck is a vehicle', small 'a fire truck is a vehicle'
- `a-firetruck-is-an-animal.mp3` "A firetruck is an animal.": base 'a fire truck is an animal', small 'a fire truck is an animal'
- `a-panda-is-an-animal.mp3` "A panda is an animal.": base 'a pounder is an animal', small 'a pounder is an animal'
- `a-pear-is-a-toy.mp3` "A pear is a toy.": base 'a pair is a toy', small 'a pear is a toy'
- `a-pear-is-a-vehicle.mp3` "A pear is a vehicle.": base 'a pair is a vehicle', small 'a pair is a vehicle'
- `a-pear-is-an-animal.mp3` "A pear is an animal.": base 'a pair is an animal', small 'a pair is an animal'
- `this-is-a-firetruck.mp3` "This is a firetruck.": base 'this is a fire truck', small 'this is a fire truck'
- `this-is-a-panda.mp3` "This is a panda.": base 'this is a pander', small 'this is a pander'
- `this-is-a-pear.mp3` "This is a pear.": base 'this is a pair', small 'this is a pair'

### Words where Jenny's British pronunciation differs from American (candidates present in this batch, not fixed)
banana, sandwich, zebra
