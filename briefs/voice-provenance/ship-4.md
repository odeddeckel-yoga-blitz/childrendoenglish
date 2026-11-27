# Voice ship batch 4 (branch fix/voice-ship-4)

Ships the final bytes at `3d3573c8` (tip of fix/voice-jenny-j6) for the 494 clips whose final voice was set in Jenny batch J4, on top of origin/main; nothing else from the amy/jenny chains. Size 5.10 MB. Per-clip rows: `ship-4.csv` (sha1 = shipped bytes, old_sha1 = the file it replaces on origin/main).

- voices: en_GB-jenny_dioco-medium 444, en_US-kristin-medium 44, en_US-ljspeech-high 6
- failed the gate in every voice, jenny 1.1 kept (owner ear-check): 11
- kept exceptions (bytes from the earlier kristin redo, J4 kept them): 2: `07935b0dee.mp3`, `4921280c52.mp3`

The Jenny batch log follows unchanged.

## Jenny batch J4 (branch fix/voice-jenny-j4, 2026-11-25)

Owner decision 11-25: all clips of the licence redo go to en_GB-jenny_dioco-medium (commercial use OK with credit "Jenny (Dioco)"; British accent accepted). J4: 494 clips (public/audio/s sentences, hashes 0022b9de8c..4f92a91ec0). Gate: base.en AND small.en must hear the text (words: homophones, digit-to-word map; sentences: word for word). Chain jenny 1.1, 1.0, 0.95, then kristin 1.1/1.0/0.95, then ljspeech-high 1.15/1.0/1.3; nothing passes: keep jenny 1.1 and list it. `old_voice`/`old_sha1` in the csv still name the original (pre-redo) file; the evidence column says what the clip was before this batch. Script: `scripts/voice-jenny-rerender.py`. Exceptions: sentence df015020e6 ("Her name is Lia.") stays kristin by owner vote; a Lia/Mia sentence stays as it was if Jenny fails the gate.

### Counts
| voice | speed | files |
|---|---|---|
| en_GB-jenny_dioco-medium | 0.95 | 14 |
| en_GB-jenny_dioco-medium | 1.0 | 36 |
| en_GB-jenny_dioco-medium | 1.1 | 394 |
| en_US-kristin-medium | 0.95 | 3 |
| en_US-kristin-medium | 1.0 | 5 |
| en_US-kristin-medium | 1.1 | 34 |
| en_US-ljspeech-high | 1.0 | 2 |
| en_US-ljspeech-high | 1.15 | 3 |
| en_US-ljspeech-high | 1.3 | 1 |
| kept | 0 | 2 |
| **by voice** | en_GB-jenny 444, en_US-krist 42, en_US-ljspe 6, kept 2 | 494 |

Kept as they were (name exception): `07935b0dee.mp3` (How does Lia feel on the first day?), `4921280c52.mp3` (Where does Mia look first?)

### Failed every voice (11): jenny 1.1 kept, owner ear-check

- `027871e1c6.mp3` "We meet in the city center.": base 'we meet in the city center', small 'we meet in the city centre'
- `1500c7cc85.mp3` "The leaves turned orange in autumn.": base 'the leaves turned orange and autumn', small 'the leaves turned orange in autumn'
- `16b786479a.mp3` "Grandma made a colorful quilt for my bed.": base 'brand my maid a colorful quilt for my bed', small 'grandma made a colourful quilt for my bed'
- `186357d6b5.mp3` ""An egg and bread, please," says Noa.": base 'an egg and bread please says noor', small 'an egg and bread please says noor'
- `1adba276d4.mp3` "They live in an apartment on the tenth floor.": base 'they live in an apartment on the th floor', small 'they live in an apartment on the th floor'
- `1e2301a295.mp3` "We build a sandcastle on the beach.": base 'we build a sand castle on the beach', small 'we build a sandcastle on the beach'
- `2a3698109c.mp3` "Let’s play outside.": base 'lets play outside', small 'lets play outside'
- `2b100e3ca9.mp3` "What does Luna like?": base 'what is learner like', small 'what is lunar like'
- `2c884bc2ac.mp3` "Maya is tired but happy.": base 'meyer is tired but happy', small 'meijer is tired but happy'
- `39c705e20f.mp3` "The firetruck raced down the street.": base 'the fire truck raced down the street', small 'the fire truck raced down the street'
- `4a470b5f0f.mp3` "Open your mouth and say "ah".": base 'open your mouth and say r', small 'open your mouth and say ahaar'

### Words where Jenny's British pronunciation differs from American (candidates present in this batch, not fixed)
after, ask, aunt, banana, bath, can't, castle, class, fast, glass, grass, half, last, path, sandwich, tomato, water
