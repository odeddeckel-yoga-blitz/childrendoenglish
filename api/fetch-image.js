import crypto from 'crypto';
import sharp from 'sharp';

const UA = 'ChildrenDoEnglish/1.0 (https://childrendoenglish.com; educational app)';

function verifyAuth(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  const password = auth.slice(7);
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash === (process.env.ADMIN_HASH || '').trim();
}

async function searchWikimedia(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=512&format=json&origin=*`;

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const data = await res.json();

  if (!data.query?.pages) return null;

  const pages = Object.values(data.query.pages)
    .filter(p => {
      const info = p.imageinfo?.[0];
      if (!info) return false;
      const mime = info.mime || '';
      const isImage = mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp');
      const bigEnough = info.width >= 300 && info.height >= 300;
      const aspectRatio = Math.max(info.width, info.height) / Math.min(info.width, info.height);
      return isImage && bigEnough && aspectRatio < 2.5;
    })
    .sort((a, b) => {
      const ratioA = Math.abs(1 - (a.imageinfo[0].width / a.imageinfo[0].height));
      const ratioB = Math.abs(1 - (b.imageinfo[0].width / b.imageinfo[0].height));
      return ratioA - ratioB;
    });

  if (pages.length === 0) return [];

  return pages.slice(0, 4).map(p => {
    const info = p.imageinfo[0];
    return {
      url: info.thumburl || info.url,
      sourceUrl: info.descriptionurl || info.url,
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { queries } = req.body;
  if (!Array.isArray(queries) || queries.length === 0) {
    return res.status(400).json({ error: 'queries[] required' });
  }

  const results = [];

  for (const query of queries.slice(0, 3)) {
    try {
      const candidates = await searchWikimedia(query);
      if (!candidates.length) continue;

      for (const found of candidates) {
        try {
          const imgRes = await fetch(found.url, { headers: { 'User-Agent': UA } });
          if (!imgRes.ok) continue;

          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const optimized = await sharp(buffer)
            .resize(512, 512, { fit: 'cover', position: 'centre' })
            .webp({ quality: 82 })
            .toBuffer();

          results.push({
            imageBase64: optimized.toString('base64'),
            sourceUrl: found.sourceUrl,
            query,
            sizeKB: +(optimized.length / 1024).toFixed(1),
          });
        } catch (err) {
          console.error(`Failed downloading "${found.url}":`, err.message);
        }
      }
    } catch (err) {
      console.error(`Failed for query "${query}":`, err.message);
    }
  }

  return res.status(200).json({ results });
}
