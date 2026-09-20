"""Word Voice Improver — the audio twin of the image improver.
For each flagged word: render candidates (voice x speed, with silence padding),
transcribe each with Whisper, and install the first candidate in preference
order that the machine hears correctly. Preference favors amy (app-wide voice
consistency); alternatives only rescue words she genuinely can't say."""
import os, json, re, wave, subprocess, sys
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel

scratch = os.path.dirname(os.path.abspath(__file__))
audio_dir = os.path.expanduser('~/projects/childrendoenglish/public/audio')
work = os.path.join(scratch, 'voice-work'); os.makedirs(work, exist_ok=True)

ACCEPT = {  # homophones / formatting quirks — current clip is actually fine
  'bored': ['board'], 'deer': ['dear'], 'write': ['right'], 'firetruck': ['fire truck'],
  'x ray': ['xray', 'x ray'], 'yo yo': ['yoyo'], 'one': ['won'], 'two': ['too', 'to'],
  'eight': ['ate'], 'four': ['for'], 'flower': ['flour'], 'pair': ['pear'], 'pear': ['pair'],
  'sea': ['see'], 'son': ['sun'], 'sun': ['son'], 'hair': ['hare'], 'bee': ['b'],
}

audit = json.load(open(os.path.join(scratch, 'voice-audit.json')))
flagged = []
for r in audit:
    if r['ok']: continue
    if r['heard'] in ACCEPT.get(r['word'], []): continue
    flagged.append(r['word'])
print(f'{len(flagged)} words to improve', flush=True)

voices = {
  'amy':    PiperVoice.load(os.path.join(scratch, 'en_US-amy-medium.onnx')),
  'lessac': PiperVoice.load(os.path.join(scratch, 'en_US-lessac-medium.onnx')),
  'ryan':   PiperVoice.load(os.path.join(scratch, 'en_US-ryan-high.onnx')),
}
CONFIGS = [  # preference order
  ('amy', 1.15), ('amy', 1.35), ('lessac', 1.2), ('ryan', 1.2), ('lessac', 1.4),
]
model = WhisperModel('base.en', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z ]', '', s.lower()).strip()

def render(voice, text, ls, out_wav):
    with wave.open(out_wav, 'wb') as f:
        voices[voice].synthesize_wav(text, f, syn_config=SynthesisConfig(length_scale=ls))
    # pad 250ms silence both ends (Piper clips isolated words; whisper + human ears both suffer)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out_wav, '-af',
                    'adelay=250|250,apad=pad_dur=0.25', out_wav + '.p.wav'], check=True)
    return out_wav + '.p.wav'

def hears(path, expected):
    segs, _ = model.transcribe(path, beam_size=5, language='en')
    heard = norm(' '.join(s.text for s in segs))
    ok = expected in heard or heard == expected or heard.rstrip('s') == expected.rstrip('s') \
         or heard in ACCEPT.get(expected, [])
    return ok, heard

fixed, unfixed = [], []
for i, word in enumerate(flagged):
    text = word  # filename uses spaces for hyphens; speak the spaced form
    winner = None
    for vname, ls in CONFIGS:
        wav = render(vname, text, ls, os.path.join(work, f'{word.replace(" ","-")}-{vname}-{ls}.wav'))
        ok, heard = hears(wav, word)
        if ok:
            winner = (vname, ls, wav); break
    if winner:
        vname, ls, wav = winner
        mp3 = os.path.join(audio_dir, word.replace(' ', '-') + '.mp3')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '22050',
                        '-q:a', '7', mp3], check=True)
        fixed.append((word, vname, ls))
    else:
        unfixed.append(word)
    if (i + 1) % 20 == 0: print(f'{i+1}/{len(flagged)}', flush=True)

print(f'\nFIXED {len(fixed)}:')
from collections import Counter
print('  by voice:', Counter(v for _, v, _ in fixed))
nonamy = [(w, v, l) for w, v, l in fixed if v != 'amy']
print('  non-amy words:', ', '.join(f'{w}({v})' for w, v, _ in nonamy) or 'none')
print(f'UNFIXED {len(unfixed)}: {", ".join(unfixed) or "none"}')
json.dump({'fixed': fixed, 'unfixed': unfixed}, open(os.path.join(scratch, 'voice-fix-report.json'), 'w'))
