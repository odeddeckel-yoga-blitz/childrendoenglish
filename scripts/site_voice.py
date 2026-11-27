"""The site's TTS voice, in one place (owner 11-25 / 11-27): every new clip is rendered in Jenny (Dioco), with the same
Piper settings the voice-licence redo used (scripts/voice-jenny-rerender.py: Piper -> 280 ms lead-in + tail -> mono
22.05 kHz mp3 -q:a 7). Fallbacks only in voices with a commercial licence (public/audio/VOICE-LICENCES.md): Kristin,
then LJ Speech. amy, lessac, hfc_female and ryan have no commercial licence and must never be used again;
src/__tests__/audioGeneratorVoice.test.js fails if a generator names one of them.

Import from a script in scripts/ (python puts the script's folder on sys.path):  import site_voice
"""
import os

SITE_VOICE = 'en_GB-jenny_dioco-medium'          # credit "Jenny (Dioco)" on /image-credits/
KRISTIN = 'en_US-kristin-medium'                  # public domain
LJSPEECH = 'en_US-ljspeech-high'                  # public domain
MODELS = (SITE_VOICE, KRISTIN, LJSPEECH)
VOICE_DIR = os.path.expanduser('~/.venvs/piper-voices')   # download: python -m piper.download_voices <name>

JENNY_SPEEDS = (1.1, 1.0, 0.95)                   # Piper length_scale; the j-batch order
KRISTIN_SPEEDS = (1.1, 1.0, 0.95)
LJ_SPEEDS = (1.15, 1.0, 1.3)


def chain(jenny=JENNY_SPEEDS):
    """(model, length_scale) in preference order: Jenny first, then Kristin, then LJ Speech."""
    return ([(SITE_VOICE, ls) for ls in jenny] + [(KRISTIN, ls) for ls in KRISTIN_SPEEDS]
            + [(LJSPEECH, ls) for ls in LJ_SPEEDS])


CHAIN = chain()
PAD_FILTER = 'adelay=280|280,apad=pad_dur=0.28'   # ffmpeg -af: 280 ms lead-in + tail


def model_path(model, voice_dir=VOICE_DIR):
    if model not in MODELS:
        raise ValueError(f'{model}: not a site voice (allowed: {", ".join(MODELS)})')
    return os.path.join(voice_dir, model + '.onnx')
