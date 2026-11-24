// Health check. Static by default (audit A091, 11-22): an unauthenticated DB round-trip on every hit let anyone
// keep the Neon compute awake (cost). `?deep=1` runs the DB check (audit 11-18: the old static "ok" could not see
// a Neon outage such as the 10-22 quota stop): one SELECT 1 with a 5 s cap; a failure answers 503 {ok:false} and
// logs the cause server-side only, never in the response. The post-deploy smoke should call `?deep=1`.
import { neon } from '@neondatabase/serverless';

const TIMEOUT_MS = 5000;

async function dbOk() {
  const url = process.env.CDE_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) { console.error('[health] no database URL configured'); return false; }
  let timer;
  try {
    const q = neon(url);
    await Promise.race([
      q`SELECT 1`,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS); }),
    ]);
    return true;
  } catch (err) {
    console.error(`[health] db check failed — status=${err?.status ?? err?.code ?? '-'} msg=${String(err?.message || err).slice(0, 200)}`);
    return false;
  } finally { clearTimeout(timer); }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const deep = req?.query?.deep;
  if (deep !== '1' && deep !== 'true') {
    return res.status(200).json({ ok: true, status: 'ok', timestamp: new Date().toISOString() });
  }
  const ok = await dbOk();
  res.status(ok ? 200 : 503).json({ ok, status: ok ? 'ok' : 'degraded', db: ok ? 'ok' : 'down', timestamp: new Date().toISOString() });
}
