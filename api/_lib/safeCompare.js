// Constant-time string compare for secrets (audit 11-18: `===` / `!==` on tokens leaks timing).
// Both sides are hashed to a fixed 32 bytes first, so crypto.timingSafeEqual never throws on a length
// mismatch and the compare time does not depend on where the strings differ or how long they are.
import crypto from 'crypto';

const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();

export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  return crypto.timingSafeEqual(digest(a), digest(b));
}

// Admin bearer check shared by commit-image and fetch-image: sha256(password) against ADMIN_HASH.
export function verifyAdminAuth(req) {
  const auth = req.headers?.authorization;
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return false;
  const hash = crypto.createHash('sha256').update(auth.slice(7)).digest('hex');
  return safeEqual(hash, (process.env.ADMIN_HASH || '').trim());
}
