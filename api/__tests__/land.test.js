/**
 * /api/land fails QUIET to the client (204) but must log the real cause, and a
 * failed table-init must not be cached (it would drop every event until the
 * next cold start). Lesson: KDM lost ~2h of events at a Neon quota, 2026-10-22.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

let mode = 'ok';
vi.mock('@neondatabase/serverless', () => ({
  neon: () => async () => {
    if (mode === 'quota') throw Object.assign(new Error('Server error (HTTP status 402): Your project has exceeded the compute time quota'), { status: 402 });
    if (mode === 'auth') throw new Error('password authentication failed for user "neondb_owner"');
    return [];
  },
}));

const res = () => { const r = { code: 0 }; r.status = (c) => { r.code = c; return r; }; r.end = () => r; r.json = (b) => { r.body = b; return r; }; return r; };
const beacon = { method: 'POST', body: { batch: [{ e: 'ans_ok', i: 'cat' }] } };

describe('api/land failure logging', () => {
  let handler, err;
  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.env.CDE_DATABASE_URL = 'postgres://x';
    err = vi.spyOn(console, 'error').mockImplementation(() => {});
    ({ default: handler } = await import('../land.js'));
  });

  it('logs cause=neon-quota and still answers 204', async () => {
    mode = 'quota';
    const r = res(); await handler(beacon, r);
    expect(r.code).toBe(204);
    expect(err.mock.calls[0][0]).toMatch(/cause=neon-quota status=402/);
  });

  it('logs cause=bad-credentials', async () => {
    mode = 'auth';
    await handler(beacon, res());
    expect(err.mock.calls[0][0]).toMatch(/cause=bad-credentials/);
  });

  it('recovers after a failed init instead of caching the rejection', async () => {
    mode = 'quota';
    await handler(beacon, res());
    mode = 'ok'; err.mockClear();
    const r = res(); await handler(beacon, r);
    expect(r.code).toBe(204);
    expect(err).not.toHaveBeenCalled();
  });
});
