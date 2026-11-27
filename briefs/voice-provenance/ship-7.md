# Voice ship batch 7 (branch fix/voice-ship-7)

Owner decision 11-27: the 31 clips whose voice was never settled (baseline `unknown`, made by generators whose default was amy) are rendered in Jenny (Dioco) with the same Piper settings and whisper double gate as the Jenny batches (`scripts/voice-jenny-rerender.py`, ships in fix/voice-ship-1: Piper -> 280 ms lead-in + tail -> mono 22.05 kHz mp3 -q:a 7; faster-whisper base.en AND small.en must both hear the word, homophones and digit-to-word map). Chain jenny 1.1, 1.0, 0.95, then kristin 1.1/1.0/0.95, then ljspeech-high 1.15/1.0/1.3; nothing passes: keep jenny 1.1 and list it. Local TTS, no paid calls. Branch = origin/main 6fad6ca2 + the shared base 8f2e46bb + this batch, so it merges with ships 1..6 in any order. Size 0.10 MB (102162 bytes). Per-clip rows: `ship-7.csv`.

Same branch: the audio generators can no longer make an amy (or lessac / hfc_female / ryan) clip. `scripts/site_voice.py` holds the site voice and fallback chain; generate-word-audio.sh, render-word-audio.py, unit-, reading-, chant-, feelings-, simon-says-, true-or-false-audio.py, voice-improver.py, voice-pass2.py and word-voice-improver.py use it; `src/__tests__/audioGeneratorVoice.test.js` fails if any script names an unlicensed Piper model.

- voices: en_GB-jenny_dioco-medium 25, en_US-kristin-medium 5, en_US-ljspeech-high 1
- failed the gate in every voice, jenny 1.1 kept (owner ear-check): 6

### Counts
| voice | speed | files |
|---|---|---|
| en_GB-jenny_dioco-medium | 0.95 | 1 |
| en_GB-jenny_dioco-medium | 1.0 | 2 |
| en_GB-jenny_dioco-medium | 1.1 | 22 |
| en_US-kristin-medium | 1.1 | 5 |
| en_US-ljspeech-high | 1.0 | 1 |

### Failed every voice (6): jenny 1.1 kept, owner ear-check

- `public/audio/bee.mp3` "bee": base 'b', small 'be'
- `public/audio/or.mp3` "or": base 'r', small 'r'
- `public/audio/our.mp3` "our": base 'r', small 'r'
- `public/audio/than.mp3` "than": base 'then', small 'then'
- `public/audio/pairs/bee.mp3` "bee": base 'b', small 'b'
- `public/audio/pairs/pea.mp3` "pea": base 'p', small 'hee'

### Ear notes (passed the gate, worth a listen)

- `read.mp3` and `wind.mp3` are heteronyms (read/red, wind/wind): whisper spells both the same, so the gate cannot tell which one Piper said.
- `for.mp3` passed on the four/for homophone (base.en wrote 'four'); `her.mp3` small.en wrote 'herr'.
