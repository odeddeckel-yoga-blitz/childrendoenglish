#!/usr/bin/env python3
"""Voice audit — transcribe every public/audio/*.mp3 and flag files whisper
mishears. The AUDIT half of the word-voice-improver loop (see
word-voice-improver.py for the FIX half: candidate voices amy/lessac/ryan at
rising length_scales, 250-300ms padding, install the first that passes).

Settings are load-bearing (proven 2026-09-20/26):
  - small.en (base.en is deaf to sub-second clips — flagged numbers as silent)
  - vad_filter=False (VAD eats isolated words)
  - initial_prompt biases decoding toward single-word output
  - homophones accepted (knight/night, bored/board...) — whisper can't spell
    intent, only sound

Run it after EVERY word batch (generate-word-audio.sh prints the reminder) —
knight.mp3 shipped broken 2026-09-22 precisely because batch audio wasn't
audited post-generation; the 09-20 audit predated the K-N batch.

Usage:
  /tmp/voice-venv/bin/python scripts/voice-audit.py            # all files
  /tmp/voice-venv/bin/python scripts/voice-audit.py knight cat # named words
  (venv: python3 -m venv /tmp/voice-venv && pip install faster-whisper)
Writes scripts/voice-audit.json; prints flagged words for the improver loop.
A flagged word is a CANDIDATE — sub-second minimal pairs (ant/and, van, vest)
are known STT limits; verify by ear before re-rendering.
"""
import os, sys, json, re
from faster_whisper import WhisperModel

audio_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'audio')
model = WhisperModel('small.en', device='cpu', compute_type='int8')

HOMOPHONES = {
    'bored': 'board', 'write': 'right', 'two': 'too', 'knight': 'night',
    'sun': 'son', 'flour': 'flower', 'sea': 'see', 'ate': 'eight',
    'pear': 'pair', 'hair': 'hare', 'one': 'won', 'four': 'for',
    'wear': 'where', 'meat': 'meet', 'blue': 'blew', 'road': 'rode',
    'nose': 'knows', 'tail': 'tale', 'whale': 'wail',
}

def norm(s):
    return re.sub(r'[^a-z ]', '', s.lower()).strip()

names = set(sys.argv[1:])
files = sorted(f for f in os.listdir(audio_dir) if f.endswith('.mp3')
               and (not names or f[:-4] in names))
results = []
for i, f in enumerate(files):
    expected = f[:-4].replace('-', ' ')
    segs, _ = model.transcribe(os.path.join(audio_dir, f), vad_filter=False,
                               initial_prompt='A single English word:')
    heard = norm(' '.join(s.text for s in segs))
    ok = (expected in heard or heard == expected
          or heard.rstrip('s') == expected.rstrip('s')
          or HOMOPHONES.get(expected) == heard or HOMOPHONES.get(heard) == expected)
    results.append({'word': expected, 'heard': heard, 'ok': ok})
    if (i + 1) % 50 == 0:
        print(f'{i+1}/{len(files)}', flush=True)

bad = [r for r in results if not r['ok']]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voice-audit.json')
json.dump(results, open(out, 'w'))
print(f'\nTOTAL {len(results)}, FLAGGED {len(bad)}:')
for r in bad:
    print(f"  {r['word']!r} heard as {r['heard']!r}")
sys.exit(1 if bad else 0)
