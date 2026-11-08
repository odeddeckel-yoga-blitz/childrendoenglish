#!/usr/bin/env python3
"""Audio for textbook-unit pages (src/data/units.js): every unit word without public/audio/<key>.mp3 and every example
sentence without public/audio/s/<sha1-10>.mp3. Same pipeline as the site's clips (render-word-audio.py): Piper
en_US-amy-medium → 280 ms lead-in + tail → mono 22.05 kHz mp3. A word must be heard by faster-whisper base.en AND
small.en (homophones like for/four count: a word clip is only its sound); a sentence by base.en. A clip that fails at
1.15 is retried slower (amy 1.35), then in Lessac; anything still unheard is printed and NOT written.

  ~/.venvs/whisper/bin/python scripts/unit-audio.py [--only=<book>]     # e.g. --only=fantastic-five
"""
import os, re, sys, json, wave, hashlib, subprocess
import numpy as np
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(ROOT, 'public', 'audio')
os.makedirs(os.path.join(AUD, 's'), exist_ok=True)
opt = {a[2:].split('=')[0]: a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
units = json.loads(subprocess.run(['node', '--input-type=module', '-e',
    "const m = await import(process.argv[1]); console.log(JSON.stringify(m.UNITS))", os.path.join(ROOT, 'src', 'data', 'units.js')],
    capture_output=True, text=True, check=True).stdout)
if opt.get('only'): units = [u for u in units if u['book'] == opt['only']]

key = lambda en: re.sub(r'[^a-z0-9]+', '-', en.lower().strip())          # = audioKey in build-unit-pages.mjs
skey = lambda s: hashlib.sha1(s.strip().encode()).hexdigest()[:10]       # = sentenceKey in sentence-audio.mjs
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'twenty thirty forty fifty sixty seventy eighty ninety'.split()
def words_of(n):   # whisper writes numbers as digits: 40 → forty, 100 → a hundred
    n = int(n)
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10 - 2] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    return 'a hundred' if n == 100 else str(n)
def norm(s):
    s = s.lower().replace('-', ' ').replace('’', "'").replace("'", '')
    s = re.sub(r'\d+', lambda m: words_of(m.group(0)), s)
    return re.sub(r'[^a-z ]', '', s).replace('cell phone', 'cellphone').split()
SAME = {'for': {'four'}, 'too': {'two', 'to'}, 'no': {'know'}, 'here': {'hear'}, 'hear': {'here'}, 'air': {'heir'},
        'their': {'there'}, 'one': {'won'}, 'two': {'to', 'too'}, 'four': {'for'}, 'eight': {'ate'}, 'sell': {'cell'},
        'flour': {'flower'}, 'flower': {'flour'}}

words, sents = {}, {}
for u in units:
    for w in u['words']:
        if not os.path.exists(os.path.join(AUD, key(w['en']) + '.mp3')): words[key(w['en'])] = w['en']
        if w.get('ex') and not os.path.exists(os.path.join(AUD, 's', skey(w['ex']) + '.mp3')): sents[skey(w['ex'])] = w['ex']
print(f'{len(words)} words, {len(sents)} sentences to render', flush=True)

VOICES = [('en_US-amy-medium', 1.15), ('en_US-amy-medium', 1.35), ('en_US-lessac-high', 1.15)]
loaded = {}
models = {n: WhisperModel(n, device='cpu', compute_type='int8') for n in ('base.en', 'small.en')}
def hear(path, names, prompt):
    pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                                       capture_output=True, check=True).stdout, np.int16).astype(np.float32) / 32768
    return [' '.join(s.text for s in models[n].transcribe(pcm, language='en', beam_size=5, initial_prompt=prompt)[0]).strip() for n in names]
def render(text, mp3, model, ls):
    if model not in loaded: loaded[model] = PiperVoice.load(os.path.expanduser(f'~/.venvs/piper-voices/{model}.onnx'))
    wav = mp3 + '.wav'
    with wave.open(wav, 'wb') as f: loaded[model].synthesize_wav(text, f, syn_config=SynthesisConfig(length_scale=ls))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', 'adelay=280|280,apad=pad_dur=0.28', '-ac', '1',
                    '-ar', '22050', '-q:a', '7', mp3], check=True)
    os.remove(wav)
def word_ok(en, heard):
    want = norm(en)
    for h in heard:
        got = norm(h)
        if len(want) == 1 and got and (got[0] == want[0] or got[0] in SAME.get(want[0], ())) and len(got) <= 2: continue
        if got[:len(want)] == want: continue
        return False
    return True

missed = []
for k, en in words.items():
    out = os.path.join(AUD, k + '.mp3'); text = en.replace('’', "'")
    text = text if text.endswith(('!', '.', '?')) else (text[0].upper() + text[1:] + '.')
    for model, ls in VOICES:
        render(text, out, model, ls)
        h = hear(out, ('base.en', 'small.en'), 'A single English word or phrase:')
        if word_ok(en, h): print(f'✓ {en} ({model} {ls})', flush=True); break
    else:
        os.remove(out); missed.append(f'word {en!r}: {h}'); print(f'✗ {en} {h}', flush=True)
for k, s in sents.items():
    out = os.path.join(AUD, 's', k + '.mp3'); text = s.replace('’', "'")
    for model, ls in VOICES:
        render(text, out, model, ls)
        h = hear(out, ('base.en',), 'An English sentence for children:')
        if norm(h[0]) == norm(text): break
    else:
        os.remove(out); missed.append(f'sentence {s!r}: {h}'); print(f'✗ {s} {h}', flush=True)
print(f'done: {len(missed)} not heard (no file written for them)')
for m in missed: print('  ' + m)
