# Voice licences for the audio in /audio

All speech on childrendoenglish.com is a computer voice (Piper text-to-speech, https://github.com/rhasspy/piper). It is
not a recording of a native speaker. Voices are taken from https://huggingface.co/rhasspy/piper-voices; each voice's
MODEL_CARD (copied unchanged into `licences/`) states its dataset licence.

**Credit: voice "Jenny (Dioco)", en_GB-jenny_dioco-medium, https://github.com/dioco-group/jenny-tts-dataset.**
The Piper model was fine-tuned from the Hi-Fi TTS reader 92 base model (Hi-Fi TTS dataset by NVIDIA, CC BY 4.0,
https://www.openslr.org/109/), per its MODEL_CARD.

| voice | used for | dataset | licence |
|---|---|---|---|
| en_GB-jenny_dioco-medium | almost every word, sentence, CVC, pairs and game clip | Jenny (Dioco) https://github.com/dioco-group/jenny-tts-dataset | commercial use permitted with credit "Jenny (Dioco)" (project owner's reading of the dataset terms, 2026-11-25; the Piper MODEL_CARD says "See URL") |
| en_US-kristin-medium | the clips Jenny could not render clearly, and the name sentences kept by vote | LibriVox recordings (https://librivox.org) | public domain (MODEL_CARD) |
| en_US-ljspeech-high | a handful of fallback clips | LJ Speech (https://keithito.com/LJ-Speech-Dataset/) | public domain (MODEL_CARD) |

Earlier builds used en_US-lessac (Blizzard research licence), en_US-hfc_female and en_US-ryan (CC BY-NC-SA) and
en_US-amy (dataset licence not documented). Their clips were re-rendered in the voices above (2026-11-22 to 11-25) and
ship in six batches from 2026-11-27; `tools/voice-final-check.mjs` in the source repository lists every clip by voice
and fails while any clip on those voices is left.

Per-clip voice, speed, gate result and checksums (shipped file and the file it replaced):
`briefs/voice-provenance/` in the source repository (`baseline-2026-11-22.csv` + one `ship-<k>.csv` per batch).

MODEL_CARD files: `licences/en_GB-jenny_dioco-medium.MODEL_CARD`, `licences/en_US-kristin-medium.MODEL_CARD`,
`licences/en_US-ljspeech-high.MODEL_CARD` (fetched 2026-11-22 from rhasspy/piper-voices on huggingface.co).
