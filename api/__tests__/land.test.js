/**
 * /api/land fails QUIET to the client (204) but must log the real cause, and a
 * failed table-init must not be cached (it would drop every event until the
 * next cold start). Lesson: KDM lost ~2h of events at a Neon quota, 2026-10-22.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

let mode = 'ok';
const calls = [];
const fail = () => {
  if (mode === 'quota') throw Object.assign(new Error('Server error (HTTP status 402): Your project has exceeded the compute time quota'), { status: 402 });
  if (mode === 'auth') throw new Error('password authentication failed for user "neondb_owner"');
};
vi.mock('@neondatabase/serverless', () => ({
  neon: () => Object.assign(async (strings, ...values) => {
    calls.push({ sql: strings.join('?'), values });
    fail();
    return [];
  }, {
    query: async (text, params) => { calls.push({ sql: text, values: params }); fail(); return []; },
  }),
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

describe('api/land learn-event whitelist', () => {
  it('records the newer learn events and drops unknown ones', async () => {
    vi.resetModules();
    mode = 'ok';
    process.env.CDE_DATABASE_URL = 'postgres://x';
    const { default: handler } = await import('../land.js');
    calls.length = 0;
    const batch = [{ e: 'fcr', i: 'c3' }, { e: 'fcr', i: 'done' }, { e: 'ansx', i: 'arrow@airplane' }, { e: 'g_start', i: 'spelling-forge' }, { e: 'pg', i: 'vocabulary_ages-6-8' }, { e: 'cta', i: 'games' }, { e: 'mq', i: 'vocabulary_word' }, { e: 'bt', i: 'start_p6-15' }, { e: 'qs', i: 'new-ladder_start' }, { e: 'aie', i: 'chatgpt' }, { e: 'aiv', i: 'perplexity' }, { e: 'aie', i: 'bing' }, { e: 'sheet', i: 'bingo' }, { e: 'mp', i: 'ee-i_no' }, { e: 'cvc', i: 'o_h_ok' }, { e: 'zv', i: 'words-animals' }, { e: 'b1r', i: '3-hear' }, { e: 'wk', i: 'pin' }, { e: 'rq_ok', i: 'apron' }, { e: 'rs', i: 'lo_retry' }, { e: 'ge', i: 'word-zapper_next' }, { e: 'qr', i: 'printable-flashcards_animals' }, { e: 'ltw', i: 'bd_d_no' }, { e: 't1', i: 'g-letter-twins' }, { e: 'mm_keep', i: 'apron' }, { e: 'pb', i: 'two_ok' }, { e: 'oo', i: 'animals-food_no' }, { e: 'rt', i: 'mixed_ok' }, { e: 'nope', i: 'x' }];
    const r = res(); await handler({ method: 'POST', body: { batch, l: 'he' } }, r);
    expect(r.code).toBe(204);
    const written = calls.filter((c) => /INSERT INTO cde_learn/i.test(c.sql)).map((c) => c.values.slice(0, 2).join(':'));
    expect(written).toEqual(expect.arrayContaining(['fcr:c3', 'fcr:done', 'ansx:arrow@airplane', 'g_start:spelling-forge', 'pg:vocabulary_ages-6-8', 'cta:games', 'mq:vocabulary_word', 'bt:start_p6-15', 'qs:new-ladder_start', 'aie:chatgpt', 'aiv:perplexity', 'sheet:bingo', 'mp:ee-i_no', 'cvc:o_h_ok', 'zv:words-animals', 'b1r:3-hear', 'wk:pin', 'rq_ok:apron', 'rs:lo_retry', 'ge:word-zapper_next', 'qr:printable-flashcards_animals', 'ltw:bd_d_no', 't1:g-letter-twins', 'mm_keep:apron', 'pb:two_ok', 'oo:animals-food_no', 'rt:mixed_ok']));
    expect(written).not.toContain('aie:bing');
    expect(written.some((w) => w.startsWith('nope'))).toBe(false);
  });
});

describe('api/land games wave 2 events', () => {
  it('records the Opposites / True or False / Feelings / Sentence Builder answer events', async () => {
    // own batch: the endpoint keeps the first 30 events of a batch, and the list above is near that
    vi.resetModules();
    mode = 'ok';
    process.env.CDE_DATABASE_URL = 'postgres://x';
    const { default: handler } = await import('../land.js');
    calls.length = 0;
    const batch = [{ e: 'op', i: 'hot_ok' }, { e: 'tf', i: 'is_no' }, { e: 'fe', i: 'shy_ok' }, { e: 'sb', i: 'article_no' }, { e: 'bs', i: 'b_ok' }, { e: 'ss', i: 'trap_no' }];
    const r = res(); await handler({ method: 'POST', body: { batch, l: 'en' } }, r);
    expect(r.code).toBe(204);
    const written = calls.filter((c) => /INSERT INTO cde_learn/i.test(c.sql)).map((c) => c.values.slice(0, 2).join(':'));
    expect(written).toEqual(expect.arrayContaining(['op:hot_ok', 'tf:is_no', 'fe:shy_ok', 'sb:article_no', 'bs:b_ok', 'ss:trap_no']));
  });
});

describe('api/land standing-section events (kit 1.59 §5.55)', () => {
  it('records g2/g3/hop/vp/rets/jserr/cwv in their pinned shapes and drops malformed ones', async () => {
    vi.resetModules();
    mode = 'ok';
    process.env.CDE_DATABASE_URL = 'postgres://x';
    const { default: handler } = await import('../land.js');
    calls.length = 0;
    const good = [{ e: 'g2', i: 'hub' }, { e: 'g3', i: 'ladder' }, { e: 'hop', i: 'flashcards@word-zapper' }, { e: 'vp', i: 'vocab' },
      { e: 'rets', i: 'g-read-it' }, { e: 'jserr', i: 'app' }, { e: 'jserr', i: 'pg-hebrew' }, { e: 'cwv', i: 'lcp_poor@g-spelling-forge' }, { e: 'cwv', i: 'cls_good@app' }];
    const bad = [{ e: 'g2', i: 'google' }, { e: 'hop', i: 'flashcards' }, { e: 'vp', i: 'vocab_word' }, { e: 'jserr', i: 'TypeError' },
      { e: 'cwv', i: 'lcp_2400@app' }, { e: 'cwv', i: 'ttfb_good@app' }, { e: 'rets', i: 'x' }];
    const r = res(); await handler({ method: 'POST', body: { batch: [...good, ...bad], l: 'en' } }, r);
    expect(r.code).toBe(204);
    const written = calls.filter((c) => /INSERT INTO cde_learn/i.test(c.sql)).map((c) => c.values.slice(0, 2).join(':'));
    expect(written.sort()).toEqual(good.map((x) => `${x.e}:${x.i}`).sort());
  });
});

describe('api/land component clicks (kit infra/kpi)', () => {
  let handler;
  beforeEach(async () => {
    vi.resetModules();
    mode = 'ok';
    process.env.CDE_DATABASE_URL = 'postgres://x';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    ({ default: handler } = await import('../land.js'));
    calls.length = 0;
  });
  const cc = { cc: { t: 'vocab-category', r: '/vocabulary/animals', i: [['main0.card0', 1, 2], ['site-head.link0', 1, 0], ['bad id!', 1, 1]] } };
  const ua = { 'user-agent': 'Mozilla/5.0 (iPhone)' };

  it('writes one multi-row UPSERT per beacon, valid ids only', async () => {
    const r = res(); await handler({ method: 'POST', headers: ua, body: cc }, r);
    expect(r.code).toBe(204);
    const ups = calls.filter((c) => /INSERT INTO component_daily/.test(c.sql));
    expect(ups).toHaveLength(1);
    expect(ups[0].values.slice(1, 3)).toEqual(['vocab-category', '/vocabulary/animals']);
    expect(ups[0].values[3]).toEqual(['main0.card0', 'site-head.link0']);
    expect(calls.some((c) => /cde_land|cde_learn \(day/.test(c.sql) && /INSERT/.test(c.sql))).toBe(false);
  });

  it('drops bot user agents and malformed payloads', async () => {
    await handler({ method: 'POST', headers: { 'user-agent': 'Googlebot/2.1' }, body: cc }, res());
    await handler({ method: 'POST', headers: ua, body: { cc: { t: 'X Y', r: '/a', i: [['a', 1, 0]] } } }, res());
    expect(calls.some((c) => /component_daily/.test(c.sql))).toBe(false);
  });

  it('retries the table init after a failure', async () => {
    mode = 'quota';
    const r = res(); await handler({ method: 'POST', headers: ua, body: cc }, r);
    expect(r.code).toBe(204);
    mode = 'ok'; calls.length = 0;
    await handler({ method: 'POST', headers: ua, body: cc }, res());
    expect(calls.filter((c) => /INSERT INTO component_daily/.test(c.sql))).toHaveLength(1);
  });
});
