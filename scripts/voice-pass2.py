import os, json, re, wave, subprocess
from piper import PiperVoice, SynthesisConfig
from faster_whisper import WhisperModel

scratch = os.path.dirname(os.path.abspath(__file__))
audio_dir = os.path.expanduser('~/projects/childrendoenglish/public/audio')
work = os.path.join(scratch, 'voice-work')
report = json.load(open(os.path.join(scratch, 'voice-fix-report.json')))
words = report['unfixed']
model = WhisperModel('small.en', device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z ]', '', s.lower()).strip()
ACCEPT = {'two': ['too', 'to'], 'four': ['for'], 'eight': ['ate'], 'one': ['won']}

def hears(path, expected):
    segs, _ = model.transcribe(path, beam_size=5, language='en', vad_filter=False,
                               initial_prompt='A single English word:')
    heard = norm(' '.join(s.text for s in segs))
    ok = expected in heard or heard == expected or heard.rstrip('s') == expected.rstrip('s') \
         or heard in ACCEPT.get(expected, [])
    return ok, heard

voices = {
  'amy': PiperVoice.load(os.path.join(scratch, 'en_US-amy-medium.onnx')),
  'lessac': PiperVoice.load(os.path.join(scratch, 'en_US-lessac-medium.onnx')),
  'ryan': PiperVoice.load(os.path.join(scratch, 'en_US-ryan-high.onnx')),
}

still_ok, fixed2, unfixed2 = [], [], []
for word in words:
    fname = word.replace(' ', '-') + '.mp3'
    cur = os.path.join(audio_dir, fname)
    ok, heard = hears(cur, word)
    if ok:
        still_ok.append(word); continue
    winner = None
    for vname, ls in [('amy', 1.15), ('amy', 1.35), ('lessac', 1.2), ('ryan', 1.2), ('lessac', 1.4)]:
        wav = os.path.join(work, f'p2-{word.replace(" ","-")}-{vname}-{ls}.wav')
        with wave.open(wav, 'wb') as f:
            voices[vname].synthesize_wav(word, f, syn_config=SynthesisConfig(length_scale=ls))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af',
                        'adelay=250|250,apad=pad_dur=0.25', wav + '.p.wav'], check=True)
        ok2, heard2 = hears(wav + '.p.wav', word)
        if ok2: winner = (vname, ls, wav + '.p.wav'); break
    if winner:
        vname, ls, w = winner
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-ac', '1', '-ar', '22050',
                        '-q:a', '7', cur], check=True)
        fixed2.append((word, vname))
    else:
        unfixed2.append((word, heard))

print('CURRENT FILE ACTUALLY FINE (whisper-base was deaf, small.en hears it):', ', '.join(still_ok) or 'none')
print('FIXED IN PASS 2:', ', '.join(f'{w}({v})' for w, v in fixed2) or 'none')
print('STILL UNFIXED:', ', '.join(f'{w}(heard:{h!r})' for w, h in unfixed2) or 'none')
