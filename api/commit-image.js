import { verifyAdminAuth as verifyAuth } from './_lib/safeCompare.js';

// The image goes straight into a GitHub commit, so check it is what it claims (audit 11-18): strict base64,
// at most 5 MB decoded, and a PNG, JPEG or WebP file signature.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const B64 = /^[A-Za-z0-9+/]+={0,2}$/;
export function checkImageBase64(s) {
  if (typeof s !== 'string' || !s || s.length % 4 !== 0 || !B64.test(s)) return 'imageBase64 must be base64';
  if (s.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4) return 'image too large (max 5 MB)';
  const buf = Buffer.from(s, 'base64');
  if (buf.length > MAX_IMAGE_BYTES) return 'image too large (max 5 MB)';
  const png = buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const jpeg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const webp = buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP';
  return png || jpeg || webp ? null : 'image must be PNG, JPEG or WebP';
}

// Simple in-memory rate limiter (resets per cold start; best-effort for serverless)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (entry && now - entry.start < RATE_LIMIT_WINDOW) {
    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
      res.setHeader('Retry-After', Math.ceil((RATE_LIMIT_WINDOW - (now - entry.start)) / 1000));
      return false;
    }
  } else {
    rateLimitMap.set(ip, { start: now, count: 1 });
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkRateLimit(req, res)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { wordId, imageBase64 } = req.body || {};
  if (!wordId || !imageBase64) {
    return res.status(400).json({ error: 'wordId and imageBase64 required' });
  }

  if (!/^[a-z0-9_-]+$/i.test(wordId)) {
    return res.status(400).json({ error: 'Invalid wordId format' });
  }

  const badImage = checkImageBase64(imageBase64);
  if (badImage) {
    return res.status(400).json({ error: badImage });
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !token) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  const filePath = `public/images/${wordId}.webp`;
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ChildrenDoEnglish-Admin',
  };

  // Get existing file SHA (required for updates)
  let sha;
  try {
    const existing = await fetch(apiUrl, { headers });
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }
  } catch (err) {
    console.error('Failed to get existing file:', err.message);
  }

  // Commit new image
  const body = {
    message: `Update image: ${wordId}`,
    content: imageBase64,
    ...(sha && { sha }),
  };

  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!putRes.ok) {
    console.error(`[commit-image] GitHub PUT failed status=${putRes.status} ${(await putRes.text()).slice(0, 300)}`);
    return res.status(500).json({ error: 'GitHub API error' });
  }

  const result = await putRes.json();
  return res.status(200).json({
    success: true,
    commitSha: result.commit?.sha,
  });
}
