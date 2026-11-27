#!/bin/bash
# Regenerate public/audio/<word>.mp3 for every vocabulary word using Piper TTS
# (free, offline; the site voice Jenny (Dioco), en_GB-jenny_dioco-medium, owner 11-25/11-27 — scripts/site_voice.py.
# amy / lessac / hfc_female / ryan have no commercial licence and are never used again).
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

(cd "$WORK" && ./venv/bin/python -m piper.download_voices en_GB-jenny_dioco-medium)

"$WORK/venv/bin/python" - "$WORK" <<'PYEOF'
import json, wave, os, sys
from piper import PiperVoice, SynthesisConfig
work = sys.argv[1]
words = json.load(open(os.path.join(work, 'words.json')))
os.makedirs(os.path.join(work, 'wav'), exist_ok=True)
voice = PiperVoice.load(os.path.join(work, 'en_GB-jenny_dioco-medium.onnx'))
cfg = SynthesisConfig(length_scale=1.1)  # = site_voice.JENNY_SPEEDS[0], the j-batch setting
for key, text in words:
    with wave.open(os.path.join(work, 'wav', key + '.wav'), 'wb') as f:
        voice.synthesize_wav(text[0].upper() + text[1:] + ('' if text.endswith(('.', '!', '?')) else '.'), f, syn_config=cfg)  # 'Word.' as the j-batches
print('rendered', len(words))
PYEOF

mkdir -p public/audio
for f in "$WORK"/wav/*.wav; do
  base=$(basename "$f" .wav)
  ffmpeg -v error -y -i "$f" -af 'adelay=280|280,apad=pad_dur=0.28' -ac 1 -ar 22050 -q:a 7 "public/audio/$base.mp3"
done
echo "done: $(ls public/audio/*.mp3 | wc -l | tr -d ' ') mp3s, $(du -sh public/audio | cut -f1)"

# MANDATORY POST-STEP — audit what was just generated (knight.mp3 shipped broken
# 2026-09-22 because batch audio skipped this): flag words whisper mishears, then
# fix flagged ones per scripts/word-voice-improver.py (Jenny -> Kristin -> LJ Speech, site_voice.CHAIN).
cat <<'REMINDER'
NEXT: audit the new audio before committing —
  python3 -m venv /tmp/voice-venv && /tmp/voice-venv/bin/pip install faster-whisper   # once
  /tmp/voice-venv/bin/python scripts/voice-audit.py <new words...>
Flagged words → candidates with scripts/render-word-audio.py (Jenny → Kristin → LJ Speech, scripts/site_voice.py).
Every re-rendered clip needs a provenance row (briefs/voice-provenance/) and a cache bump (scripts/audio-cache-bumps/).
REMINDER
