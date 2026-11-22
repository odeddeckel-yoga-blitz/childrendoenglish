// Per-client bucket for the Class Battle room-create limit (audit A091, 11-22).
// The raw IP is never stored or logged: the bucket is a keyed hash (HMAC-SHA256 with a server-side secret),
// truncated to 16 hex chars, and the rows that hold it are deleted after the 10-minute window (battleStore.js).
// IPv6 clients are bucketed by their /64, since one home or school line can rotate through a whole /64.
import crypto from 'crypto';

const V4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function normV4(ip) {
  const m = V4.exec(ip);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  return parts.every((n) => n <= 255) ? parts.join('.') : null;
}

/** IPv6 → its /64 prefix ("2001:0db8:0000:0001::/64"); IPv4-mapped IPv6 → the IPv4. null when malformed. */
function normV6(ip) {
  const addr = ip.replace(/^\[|\]$/g, '').split('%')[0].toLowerCase();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(addr);
  if (mapped) return normV4(mapped[1]);
  if (!/^[0-9a-f:]+$/.test(addr) || addr.split('::').length > 2) return null;
  const [head, tail] = addr.includes('::') ? addr.split('::') : [addr, null];
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const fill = tail === null ? 0 : 8 - h.length - t.length;
  if (fill < 0 || (tail === null && h.length !== 8)) return null;
  const full = [...h, ...Array(fill).fill('0'), ...t];
  if (full.length !== 8 || full.some((g) => g.length < 1 || g.length > 4)) return null;
  return full.slice(0, 4).map((g) => g.padStart(4, '0')).join(':') + '::/64';
}

export function normalizeClientIp(raw) {
  if (typeof raw !== 'string') return null;
  const ip = raw.trim();
  if (!ip) return null;
  return ip.includes(':') ? normV6(ip) : normV4(ip);
}

/**
 * The client's IP as Vercel reports it: x-real-ip, else the first x-forwarded-for hop (Vercel overwrites both,
 * so a client cannot spoof them in production), else the socket. null when none is usable.
 */
export function clientIp(req) {
  const h = (req && req.headers) || {};
  const first = (v) => (Array.isArray(v) ? v[0] : v);
  const xff = first(h['x-forwarded-for']);
  const candidates = [first(h['x-real-ip']), typeof xff === 'string' ? xff.split(',')[0] : null, req?.socket?.remoteAddress];
  for (const c of candidates) {
    const ip = normalizeClientIp(c);
    if (ip) return ip;
  }
  return null;
}

let processSecret = null;
function secret() {
  const s = process.env.BATTLE_IP_SALT || process.env.CDE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (s) return s;
  if (!processSecret) processSecret = crypto.randomBytes(32).toString('hex'); // dev / memory store only
  return processSecret;
}

/** Keyed, truncated hash of the client's IP (or /64), or null when the IP is unknown (then no per-client limit). */
export function clientBucket(req) {
  const ip = clientIp(req);
  if (!ip) return null;
  return crypto.createHmac('sha256', secret()).update(ip).digest('hex').slice(0, 16);
}
