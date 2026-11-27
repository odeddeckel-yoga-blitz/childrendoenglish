# Voice ship batch 1 (branch fix/voice-ship-1)

Ships the final bytes at `3d3573c8` (tip of fix/voice-jenny-j6) for the 987 clips whose final voice was set in Jenny batch J1, on top of origin/main; nothing else from the amy/jenny chains. Size 3.93 MB. Per-clip rows: `ship-1.csv` (sha1 = shipped bytes, old_sha1 = the file it replaces on origin/main).

- voices: en_GB-jenny_dioco-medium 815, en_US-kristin-medium 157, en_US-ljspeech-high 15
- failed the gate in every voice, jenny 1.1 kept (owner ear-check): 51

The Jenny batch log follows unchanged.

## Jenny batch J1 (branch fix/voice-jenny-j1, 2026-11-25)

Owner decision 11-25: all clips of the licence redo go to en_GB-jenny_dioco-medium (commercial use OK with credit "Jenny (Dioco)"; British accent accepted). J1: 987 clips (top-level words incl. 136-batch). Gate: base.en AND small.en must hear the text (words: homophones, digit-to-word map; sentences: word for word). Chain jenny 1.1, 1.0, 0.95, then kristin 1.1/1.0/0.95, then ljspeech-high 1.15/1.0/1.3; nothing passes: keep jenny 1.1 and list it. `old_voice`/`old_sha1` in the csv still name the original (pre-redo) file; the evidence column says what the clip was before this batch. Script: `scripts/voice-jenny-rerender.py`. Exceptions: sentence df015020e6 ("Her name is Lia.") stays kristin by owner vote; a Lia/Mia sentence stays as it was if Jenny fails the gate.

### Counts
| voice | speed | files |
|---|---|---|
| en_GB-jenny_dioco-medium | 0.95 | 43 |
| en_GB-jenny_dioco-medium | 1.0 | 114 |
| en_GB-jenny_dioco-medium | 1.1 | 658 |
| en_US-kristin-medium | 0.95 | 8 |
| en_US-kristin-medium | 1.0 | 26 |
| en_US-kristin-medium | 1.1 | 123 |
| en_US-ljspeech-high | 1.0 | 2 |
| en_US-ljspeech-high | 1.15 | 11 |
| en_US-ljspeech-high | 1.3 | 2 |
| **by voice** | en_GB-jenny 815, en_US-krist 157, en_US-ljspe 15 | 987 |

### Failed every voice (51): jenny 1.1 kept, owner ear-check

- `a-hundred.mp3` "a hundred": base 'hundred', small 'a hundred'
- `ant.mp3` "ant": base 'and', small 'and'
- `aunt.mp3` "aunt": base 'arent', small 'arent'
- `axe.mp3` "axe": base 'x', small 'x'
- `bake.mp3` "bake": base 'thank you', small 'thank'
- `bat.mp3` "bat": base 'but', small 'that'
- `bath.mp3` "bath": base 'but', small 'but'
- `bathtub.mp3` "bathtub": base 'bartop', small 'but up'
- `bear.mp3` "bear": base 'there', small 'bear'
- `bone.mp3` "bone": base 'boom', small 'bone'
- `build.mp3` "build": base 'built', small 'build'
- `cannon.mp3` "cannon": base 'henan', small 'penon'
- `cereal.mp3` "cereal": base 'serial', small 'cereal'
- `cheetah.mp3` "cheetah": base 'cheater', small 'cheater'
- `dozen.mp3` "dozen": base 'doesnt', small 'doesnt'
- `drawer.mp3` "drawer": base 'joel', small 'draw'
- `fat.mp3` "fat": base 'thats', small 'fash'
- `fig.mp3` "fig": base 'fake', small 'fake'
- `hammer.mp3` "hammer": base 'color', small 'hummer'
- `hobby.mp3` "hobby": base 'hoppy', small 'happy'
- `hockey.mp3` "hockey": base 'hokey', small 'hockey'
- `igloo.mp3` "igloo": base 'a clue', small 'a clue'
- `kite.mp3` "kite": base 'kite', small 'height'
- `next-to.mp3` "next to": base 'next two', small 'next to'
- `owl.mp3` "owl": base 'ill', small 'ill'
- `panda.mp3` "panda": base 'thunder', small 'punjur'
- `pasta.mp3` "pasta": base 'pasture', small 'faster'
- `pea.mp3` "pea": base 'p', small 'hee'
- `pie.mp3` "pie": base 'hi', small 'hi'
- `pig.mp3` "pig": base 'pick', small 'pick'
- `pillow.mp3` "pillow": base 'hello', small 'below'
- `pink.mp3` "pink": base 'thank you', small 'thank you'
- `sad.mp3` "sad": base 'sad', small 'sajh'
- `scarf.mp3` "scarf": base 'stuff', small 'staff'
- `scissors.mp3` "scissors": base 'dicers', small 'tisrs'
- `sea.mp3` "sea": base 't', small 'see'
- `seesaw.mp3` "seesaw": base 't sore', small 'tsysor'
- `socks.mp3` "socks": base 'sucks', small 'sucks'
- `sofa.mp3` "sofa": base 'so far', small 'topher'
- `throw.mp3` "throw": base 'pro', small 'pro'
- `tie.mp3` "tie": base 'thai', small 'tie'
- `towel.mp3` "towel": base 'powell', small 'towel'
- `tricks.mp3` "tricks": base 'trix', small 'tricks'
- `van.mp3` "van": base 'done', small 'fan'
- `vase.mp3` "vase": base 'byez', small 'fires'
- `vet.mp3` "vet": base 'bess', small 'this'
- `wood.mp3` "wood": base 'what', small 'what'
- `xylophone.mp3` "xylophone": base 'psilophone', small 'psilophone'
- `yarn.mp3` "yarn": base 'young', small 'yan'
- `zigzag.mp3` "zigzag": base 'sixac', small 'six sec'
- `zoo.mp3` "zoo": base 'so', small 'so'

### Words where Jenny's British pronunciation differs from American (candidates present in this batch, not fixed)
after, ask, aunt, banana, bath, castle, dance, fast, glass, grass, half, last, laugh, pasta, path, plant, sandwich, tomato, vase, water, yogurt, zebra
