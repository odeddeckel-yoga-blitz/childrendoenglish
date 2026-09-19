#!/bin/bash
# Regenerate public/audio/<word>.mp3 for every vocabulary word using Piper TTS
# (free, offline, consistent en_US "amy" voice — replaces flaky device TTS).
# Run after adding words to src/data/words.js. Requires: python3, ffmpeg.
#
# Filenames = word text lowercased, non-alphanumerics collapsed to '-'
# (must match wordAudioUrl() in src/utils/sound.js).
set -euo pipefail
cd "$(dirname "$0")/.."

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

python3 -m venv "$WORK/venv"
"$WORK/venv/bin/pip" -q install piper-tts

node -e "
import('./src/data/words.js').then(m => {
  const seen = new Map();
  m.WORDS.forEach(w => { const k = w.word.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'); if (!seen.has(k)) seen.set(k, w.word); });
  require('fs').writeFileSync('$WORK/words.json', JSON.stringify([...seen.entries()]));
  console.log('unique spoken words:', seen.size);
})"

(cd "$WORK" && ./venv/bin/python -m piper.download_voices en_US-amy-medium)

"$WORK/venv/bin/python" - "$WORK" <<'PYEOF'
import json, wave, os, sys
from piper import PiperVoice, SynthesisConfig
work = sys.argv[1]
words = json.load(open(os.path.join(work, 'words.json')))
os.makedirs(os.path.join(work, 'wav'), exist_ok=True)
voice = PiperVoice.load(os.path.join(work, 'en_US-amy-medium.onnx'))
cfg = SynthesisConfig(length_scale=1.15)  # slightly slower for kids
for key, text in words:
    with wave.open(os.path.join(work, 'wav', key + '.wav'), 'wb') as f:
        voice.synthesize_wav(text, f, syn_config=cfg)
print('rendered', len(words))
PYEOF

mkdir -p public/audio
for f in "$WORK"/wav/*.wav; do
  base=$(basename "$f" .wav)
  ffmpeg -v error -y -i "$f" -ac 1 -ar 22050 -q:a 7 "public/audio/$base.mp3"
done
echo "done: $(ls public/audio/*.mp3 | wc -l | tr -d ' ') mp3s, $(du -sh public/audio | cut -f1)"
