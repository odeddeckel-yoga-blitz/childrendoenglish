import os, sys, json, re
from faster_whisper import WhisperModel

audio_dir = os.path.expanduser('~/projects/childrendoenglish/public/audio')
model = WhisperModel('base.en', device='cpu', compute_type='int8')

def norm(s):
    return re.sub(r'[^a-z ]', '', s.lower()).strip()

results = []
files = sorted(f for f in os.listdir(audio_dir) if f.endswith('.mp3'))
for i, f in enumerate(files):
    expected = f[:-4].replace('-', ' ')
    segs, info = model.transcribe(os.path.join(audio_dir, f), beam_size=5, language='en')
    heard = norm(' '.join(s.text for s in segs))
    ok = expected in heard or heard == expected or heard.rstrip('s') == expected.rstrip('s')
    results.append({'word': expected, 'heard': heard, 'ok': ok})
    if (i + 1) % 50 == 0: print(f'{i+1}/{len(files)}', flush=True)

bad = [r for r in results if not r['ok']]
json.dump(results, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'voice-audit.json'), 'w'))
print(f'\nTOTAL {len(results)}, FLAGGED {len(bad)}:')
for r in bad: print(f"  {r['word']!r} heard as {r['heard']!r}")
