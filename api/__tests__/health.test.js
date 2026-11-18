// /api/health must touch the DB (audit 11-18) and must not leak the error to the client.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let mode = 'ok';
vi.mock('@neondatabase/serverless', () => ({
  neon: () => async () => {
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

describe('api/health', () => {
  let handler;
  const envBackup = { ...process.env };
  beforeEach(async () => {
    vi.restoreAllMocks(); vi.resetModules();
    mode = 'ok';
    process.env.CDE_DATABASE_URL = 'postgres://x';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    ({ default: handler } = await import('../health.js'));
  });
  afterEach(() => { vi.useRealTimers(); process.env = { ...envBackup }; });

  it('answers 200 ok when SELECT 1 works', async () => {
    const r = res(); await handler({}, r);
    expect(r.code).toBe(200);
    expect(r.body).toMatchObject({ ok: true, db: 'ok' });
    expect(r.headers['Cache-Control']).toBe('no-store');
  });

  it('answers 503 ok:false on a DB failure, without the error text', async () => {
    mode = 'quota';
    const r = res(); await handler({}, r);
    expect(r.code).toBe(503);
    expect(r.body.ok).toBe(false);
    expect(JSON.stringify(r.body)).not.toMatch(/quota|402|neon\.tech|secret/);
  });

  it('answers 503 when the DB hangs past the timeout', async () => {
    mode = 'hang';
    vi.useFakeTimers();
    const r = res(); const p = handler({}, r);
    await vi.advanceTimersByTimeAsync(5001);
    await p;
    expect(r.code).toBe(503);
  });

  it('answers 503 when no database URL is set', async () => {
    delete process.env.CDE_DATABASE_URL; delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;
    const r = res(); await handler({}, r);
    expect(r.code).toBe(503);
  });
});
