import crypto from 'crypto';

function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  const password = auth.slice(7);
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash === process.env.ADMIN_HASH;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { wordId, imageBase64 } = req.body;
  if (!wordId || !imageBase64) {
    return res.status(400).json({ error: 'wordId and imageBase64 required' });
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
    const err = await putRes.text();
    return res.status(500).json({ error: `GitHub API error: ${err}` });
  }

  const result = await putRes.json();
  return res.status(200).json({
    success: true,
    commitSha: result.commit?.sha,
  });
}
