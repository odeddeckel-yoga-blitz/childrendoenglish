# Voice ship batch 2 (branch fix/voice-ship-2)

Ships the final bytes at `3d3573c8` (tip of fix/voice-jenny-j6) for the 339 clips whose final voice was set in Jenny batch J2, on top of origin/main; nothing else from the amy/jenny chains. Size 1.74 MB. Per-clip rows: `ship-2.csv` (sha1 = shipped bytes, old_sha1 = the file it replaces on origin/main).

- voices: en_GB-jenny_dioco-medium 222, en_US-kristin-medium 112, en_US-ljspeech-high 4 (338 clips; was 339 before the hold below)
- failed the gate in every voice, jenny 1.1 kept (owner ear-check): 56
- HELD by the owner (11-27), not shipped: `public/audio/cvc/bit.mp3` keeps its origin/main bytes (en_US-amy-medium, sha1
  69e6455cd2). whisper small.en heard the Jenny 1.1 render (sha1 56ef49cec6, the J2 final) as an offensive word; the
  owner listens first (ear check v2). Recorded in `held-by-owner.txt`; `tools/voice-final-check.mjs` lists it as HELD and
  does not fail on it. When the owner clears it: re-render or ship the Jenny file in a new batch, add its row there, and
  remove the line from `held-by-owner.txt`.

The Jenny batch log follows unchanged.

## Jenny batch J2 (branch fix/voice-jenny-j2, 2026-11-25)

Owner decision 11-25: all clips of the licence redo go to en_GB-jenny_dioco-medium (commercial use OK with credit "Jenny (Dioco)"; British accent accepted). J2: 339 clips (cvc, pairs, simon-says, feelings). Gate: base.en AND small.en must hear the text (words: homophones, digit-to-word map; sentences: word for word). Chain jenny 1.1, 1.0, 0.95, then kristin 1.1/1.0/0.95, then ljspeech-high 1.15/1.0/1.3; nothing passes: keep jenny 1.1 and list it. `old_voice`/`old_sha1` in the csv still name the original (pre-redo) file; the evidence column says what the clip was before this batch. Script: `scripts/voice-jenny-rerender.py`. Exceptions: sentence df015020e6 ("Her name is Lia.") stays kristin by owner vote; a Lia/Mia sentence stays as it was if Jenny fails the gate.

### Counts
| voice | speed | files |
|---|---|---|
| en_GB-jenny_dioco-medium | 0.95 | 18 |
| en_GB-jenny_dioco-medium | 1.0 | 26 |
| en_GB-jenny_dioco-medium | 1.1 | 179 |
| en_US-kristin-medium | 0.95 | 3 |
| en_US-kristin-medium | 1.0 | 22 |
| en_US-kristin-medium | 1.1 | 87 |
| en_US-ljspeech-high | 1.0 | 1 |
| en_US-ljspeech-high | 1.15 | 1 |
| en_US-ljspeech-high | 1.3 | 2 |
| **by voice** | en_GB-jenny 223, en_US-krist 112, en_US-ljspe 4 | 339 |

### Failed every voice (56): jenny 1.1 kept, owner ear-check

- `bag.mp3` "bag": base 'back', small 'back'
- `bat.mp3` "bat": base 'that', small 'at'
- `bath.mp3` "bath": base 'but', small 'but'
- `bet.mp3` "bet": base 'yes', small 'that'
- `cash.mp3` "cash": base 'hash', small 'hash'
- `dock.mp3` "dock": base 'talk', small 'doc'
- `dot.mp3` "dot": base 'dot', small ''
- `fax.mp3` "fax": base 'thanks', small 'thanks'
- `fin.mp3` "fin": base 'finn', small 'f n'
- `had.mp3` "had": base 'hat', small 'hat'
- `hid.mp3` "hid": base 'hit', small 'hit'
- `hog.mp3` "hog": base 'hug', small 'hug'
- `hop.mp3` "hop": base 'hup', small 'hop'
- `mane.mp3` "mane": base 'maine', small 'mang'
- `mid.mp3` "mid": base 'met', small 'knit'
- `mug.mp3` "mug": base 'moug', small 'mock'
- `pan.mp3` "pan": base 'hand', small ''
- `pane.mp3` "pane": base 'pain', small 'pain'
- `path.mp3` "path": base 'hoth', small 'hot'
- `pen.mp3` "pen": base 'then', small 'then'
- `pig.mp3` "pig": base 'pick', small 'pick'
- `pin.mp3` "pin": base 'hinn', small 'hin'
- `pine.mp3` "pine": base 'hying', small 'heying'
- `pot.mp3` "pot": base 'pot', small 'hot'
- `pug.mp3` "pug": base 'hook', small 'hook'
- `rid.mp3` "rid": base 'writ', small 'rich'
- `rob.mp3` "rob": base 'rup', small 'r o p'
- `robe.mp3` "robe": base 'rope', small 'rope'
- `rub.mp3` "rub": base 'rup', small 'rough'
- `sock.mp3` "sock": base 'suck', small 'suck'
- `tab.mp3` "tab": base 'up', small 'tap'
- `tan.mp3` "tan": base 'chen', small 'chan'
- `tin.mp3` "tin": base 'ten', small 't n'
- `tug.mp3` "tug": base 'tuck', small 'tuck'
- `wig.mp3` "wig": base 'wake', small 'wic'
- `zap.mp3` "zap": base 'sap', small 'sap'
- `zip.mp3` "zip": base 'sip', small 'zip'
- `breed.mp3` "breed": base 'breed', small 'braid'
- `den.mp3` "den": base 'ten', small 'den'
- `dough.mp3` "dough": base 'joe', small 'do'
- `doze.mp3` "doze": base 'joes', small 'joes'
- `heel.mp3` "heel": base 'heal', small 'heal'
- `hut.mp3` "hut": base 'hut', small 'hot'
- `mouth.mp3` "mouth": base 'mouth', small 'mat'
- `pan.mp3` "pan": base 'han', small ''
- `pat.mp3` "pat": base 'pass', small 'pass'
- `path.mp3` "path": base 'hoth', small 'hot'
- `pig.mp3` "pig": base 'pick', small 'pick'
- `pin.mp3` "pin": base 'hinn', small 'hin'
- `ran.mp3` "ran": base 'run', small 'run'
- `tan.mp3` "tan": base 'ten', small 'tan'
- `thin.mp3` "thin": base 'pin', small 'in'
- `tin.mp3` "tin": base 'ten', small 'ten'
- `vet.mp3` "vet": base 'that', small 'that'
- `wow-it-is-snowing-in-summer.mp3` "Wow, it is snowing in summer!": base 'well it is snowing in summer', small 'wow it is snowing in summer'
- `yawn.mp3` "Yawn!": base 'jorn', small 'yarn'

### Words where Jenny's British pronunciation differs from American (candidates present in this batch, not fixed)
bath, class, dance, laugh, path
