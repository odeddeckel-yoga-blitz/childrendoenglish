// Constant-time string compare for secrets (audit 11-18: `===` / `!==` on tokens leaks timing).
// Both sides are hashed to a fixed 32 bytes first, so crypto.timingSafeEqual never throws on a length
// mismatch and the compare time does not depend on where the strings differ or how long they are.
import crypto from 'crypto';

const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();

export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  return crypto.timingSafeEqual(digest(a), digest(b));
}
// Used by land.js GET (stats token). The admin bearer check went with commit-image/fetch-image (11-22, audit A090).
