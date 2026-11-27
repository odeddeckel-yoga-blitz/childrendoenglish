# Voice ship batch 7 (branch fix/voice-ship-7)

Owner decision 11-27: the 31 clips whose voice was never settled (baseline `unknown`, made by generators whose default was amy) are rendered in Jenny (Dioco) with the same Piper settings and whisper double gate as the Jenny batches (`scripts/voice-jenny-rerender.py`, ships in fix/voice-ship-1: Piper -> 280 ms lead-in + tail -> mono 22.05 kHz mp3 -q:a 7; faster-whisper base.en AND small.en must both hear the word, homophones and digit-to-word map). Chain jenny 1.1, 1.0, 0.95, then kristin 1.1/1.0/0.95, then ljspeech-high 1.15/1.0/1.3; nothing passes: keep jenny 1.1 and list it. Local TTS, no paid calls. Branch = origin/main 6fad6ca2 + the shared base 8f2e46bb + this batch, so it merges with ships 1..6 in any order. Size 0.10 MB (95960 bytes, 29 clips; 102162 with the two held below). Per-clip rows: `ship-7.csv` (29 rows).

Same branch: the audio generators can no longer make an amy (or lessac / hfc_female / ryan) clip. `scripts/site_voice.py` holds the site voice and fallback chain; generate-word-audio.sh, render-word-audio.py, unit-, reading-, chant-, feelings-, simon-says-, true-or-false-audio.py, voice-improver.py, voice-pass2.py and word-voice-improver.py use it; `src/__tests__/audioGeneratorVoice.test.js` fails if any script names an unlicensed Piper model.

- voices: en_GB-jenny_dioco-medium 23, en_US-kristin-medium 5, en_US-ljspeech-high 1 (29 clips; was 31 before the hold below)
- failed the gate in every voice, jenny 1.1 kept (owner ear-check): 4 (6 rendered, `or` and `our` held)
- HELD by the owner (11-27), not shipped: `public/audio/or.mp3` and `public/audio/our.mp3` keep their origin/main bytes
  (baseline voice `unknown`, sha1 033ed193cf / 2fbb65bdaf). Their Jenny 1.1 render is just the letter 'r' (whisper base.en
  and small.en both heard 'r'; every fallback voice failed too). Recorded in `held-by-owner-ship7.txt` (its own file, so it
  never conflicts with ship-2's `held-by-owner.txt`); `tools/voice-final-check.mjs` (hold support from fix/voice-ship-2,
  which reads every `held-by-owner*.txt`) lists them as HELD. When the owner clears them: ship a new render in a later
  batch with its rows, and remove the lines.

### Counts
| voice | speed | files |
|---|---|---|
| en_GB-jenny_dioco-medium | 0.95 | 1 |
| en_GB-jenny_dioco-medium | 1.0 | 2 |
| en_GB-jenny_dioco-medium | 1.1 | 20 |
| en_US-kristin-medium | 1.1 | 5 |
| en_US-ljspeech-high | 1.0 | 1 |

### Failed every voice (6 rendered; 4 ship with jenny 1.1 kept for the owner's ear-check, `or` / `our` held, not shipped)

- `public/audio/bee.mp3` "bee": base 'b', small 'be'
- `public/audio/or.mp3` "or": base 'r', small 'r' (HELD, not shipped)
- `public/audio/our.mp3` "our": base 'r', small 'r' (HELD, not shipped)
- `public/audio/than.mp3` "than": base 'then', small 'then'
- `public/audio/pairs/bee.mp3` "bee": base 'b', small 'b'
- `public/audio/pairs/pea.mp3` "pea": base 'p', small 'hee'

### Ear notes (passed the gate, worth a listen)

- `read.mp3` and `wind.mp3` are heteronyms (read/red, wind/wind): whisper spells both the same, so the gate cannot tell which one Piper said.
- `for.mp3` passed on the four/for homophone (base.en wrote 'four'); `her.mp3` small.en wrote 'herr'.
