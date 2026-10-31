// Example-sentence audio (R2C9): /audio/s/<sha1-10 of the sentence>.mp3, rendered
// with Piper and whisper-checked. Pages show a 🔊 only when the file exists.
import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const PUB = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
export const sentenceKey = (text) => createHash('sha1').update(String(text).trim()).digest('hex').slice(0, 10);
export function sentenceAudio(text) {
  if (!text) return null;
  const k = sentenceKey(text);
  return existsSync(join(PUB, 'audio', 's', `${k}.mp3`)) ? `/audio/s/${k}.mp3` : null;
}
