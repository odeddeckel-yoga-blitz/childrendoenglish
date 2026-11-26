// /api/health: static by default (audit A091, 11-22: no DB round-trip per unauthenticated hit); `?deep=1` touches
// the DB (audit 11-18) and must not leak the error to the client.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let mode = 'ok';
let dbCalls = 0;
vi.mock('@neondatabase/serverless', () => ({
  neon: () => async () => {
    dbCalls++;
    if (mode === 'quota') throw Object.assign(new Error('HTTP 402: project exceeded the compute time quota; host secret-host.neon.tech'), { status: 402 });
    if (mode === 'hang') return new Promise(() => {});
    return [{ '?column?': 1 }];
  },
}));

const res = () => {
  const r = { code: 0, headers: {} };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  return r;
};
const TOKEN = 'test-health-token';
const DEEP = { query: { deep: '1' }, headers: { 'x-health-token': TOKEN } };
const DEEP_NO_TOKEN = { query: { deep: '1' } };

describe('api/health', () => {
  let handler;
  const envBackup = { ...process.env };
  beforeEach(async () => {
    vi.restoreAllMocks(); vi.resetModules();
    mode = 'ok'; dbCalls = 0;
    process.env.CDE_DATABASE_URL = 'postgres://x';
    process.env.HEALTH_TOKEN = TOKEN;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    ({ default: handler } = await import('../health.js'));
  });
  afterEach(() => { vi.useRealTimers(); process.env = { ...envBackup }; });

  it('default: static 200 ok with no DB round-trip, even when the DB is down', async () => {
    mode = 'quota';
    for (const req of [{}, { query: {} }, { query: { deep: '0' } }, { query: { deep: ['1', '1'] } }]) {
      const r = res(); await handler(req, r);
      expect(r.code).toBe(200);
      expect(r.body.ok).toBe(true);
      expect(r.body.db).toBeUndefined();
      expect(r.headers['Cache-Control']).toBe('no-store');
    }
    expect(dbCalls).toBe(0);
  });

  it('?deep=1 WITHOUT the token, with a wrong token, or with no server token never touches the DB', async () => {
    for (const req of [DEEP_NO_TOKEN, { query: { deep: '1' }, headers: { 'x-health-token': 'wrong' } }, { query: { deep: '1' }, headers: { 'x-health-token': '' } }]) {
      const r = res(); await handler(req, r);
      expect(r.code).toBe(200); expect(r.body.db).toBeUndefined();
    }
    delete process.env.HEALTH_TOKEN;
    const r2 = res(); await handler({ query: { deep: '1' }, headers: { 'x-health-token': 'undefined' } }, r2);
    expect(r2.code).toBe(200); expect(r2.body.db).toBeUndefined();
    expect(dbCalls).toBe(0);
  });

  it('?deep=1 answers 200 ok when SELECT 1 works', async () => {
    const r = res(); await handler(DEEP, r);
    expect(dbCalls).toBe(1);
    expect(r.code).toBe(200);
    expect(r.body).toMatchObject({ ok: true, db: 'ok' });
    expect(r.headers['Cache-Control']).toBe('no-store');
  });

  it('?deep=1 answers 503 ok:false on a DB failure, without the error text', async () => {
    mode = 'quota';
    const r = res(); await handler(DEEP, r);
    expect(r.code).toBe(503);
    expect(r.body.ok).toBe(false);
    expect(JSON.stringify(r.body)).not.toMatch(/quota|402|neon\.tech|secret/);
  });

  it('?deep=1 answers 503 when the DB hangs past the timeout', async () => {
    mode = 'hang';
    vi.useFakeTimers();
    const r = res(); const p = handler(DEEP, r);
    await vi.advanceTimersByTimeAsync(5001);
    await p;
    expect(r.code).toBe(503);
  });

  it('?deep=1 answers 503 when no database URL is set', async () => {
    delete process.env.CDE_DATABASE_URL; delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
    const r = res(); await handler(DEEP, r);
    expect(r.code).toBe(503);
  });
});
