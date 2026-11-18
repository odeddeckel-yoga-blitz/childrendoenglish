// Admin APIs (audit 11-18): constant-time secret compares and a validated image before any GitHub commit.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import { safeEqual, verifyAdminAuth } from '../_lib/safeCompare.js';
import commitImage, { checkImageBase64, MAX_IMAGE_BYTES } from '../commit-image.js';

const PASSWORD = 'correct horse';
const res = () => {
  const r = { code: 0, headers: {} };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  r.setHeader = (k, v) => { r.headers[k] = v; };
  return r;
};
const b64 = (bytes) => Buffer.from(bytes).toString('base64');
const PNG = b64([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = b64([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBPVP8 ')]).toString('base64');

let ip = 0;
const post = (body, password = PASSWORD) => ({
  method: 'POST',
  headers: { authorization: `Bearer ${password}`, 'x-forwarded-for': `10.0.0.${++ip}` },
  body,
});

describe('safeEqual', () => {
  it('matches equal strings and rejects different, longer, shorter and empty ones', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('abcd', 'abc')).toBe(false);
    expect(safeEqual('', '')).toBe(false);
    expect(safeEqual(undefined, 'abc')).toBe(false);
    expect(safeEqual(['abc'], 'abc')).toBe(false);
  });
  it('uses crypto.timingSafeEqual', () => {
    const spy = vi.spyOn(crypto, 'timingSafeEqual');
    safeEqual('x', 'y');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('verifyAdminAuth', () => {
  beforeEach(() => { process.env.ADMIN_HASH = crypto.createHash('sha256').update(PASSWORD).digest('hex'); });
  afterEach(() => { delete process.env.ADMIN_HASH; });
  it('accepts the right password only', () => {
    expect(verifyAdminAuth({ headers: { authorization: `Bearer ${PASSWORD}` } })).toBe(true);
    expect(verifyAdminAuth({ headers: { authorization: 'Bearer nope' } })).toBe(false);
    expect(verifyAdminAuth({ headers: {} })).toBe(false);
  });
  it('rejects everything when ADMIN_HASH is unset', () => {
    delete process.env.ADMIN_HASH;
    expect(verifyAdminAuth({ headers: { authorization: 'Bearer ' } })).toBe(false);
    expect(verifyAdminAuth({ headers: { authorization: `Bearer ${PASSWORD}` } })).toBe(false);
  });
});

describe('checkImageBase64', () => {
  it('accepts PNG, JPEG and WebP signatures', () => {
    expect(checkImageBase64(PNG)).toBeNull();
    expect(checkImageBase64(JPEG)).toBeNull();
    expect(checkImageBase64(WEBP)).toBeNull();
  });
  it('rejects non-base64, wrong types and oversize input', () => {
    expect(checkImageBase64('not base64!')).toMatch(/base64/);
    expect(checkImageBase64('data:image/png;base64,' + PNG)).toMatch(/base64/);
    expect(checkImageBase64(b64('<svg onload=alert(1)>'))).toMatch(/PNG, JPEG or WebP/);
    expect(checkImageBase64(b64('GIF89a......'))).toMatch(/PNG, JPEG or WebP/);
    const big = Buffer.alloc(MAX_IMAGE_BYTES + 1); big[0] = 0xff; big[1] = 0xd8; big[2] = 0xff;
    expect(checkImageBase64(big.toString('base64'))).toMatch(/too large/);
    expect(checkImageBase64(42)).toMatch(/base64/);
  });
});

describe('api/commit-image', () => {
  let fetchSpy;
  beforeEach(() => {
    process.env.ADMIN_HASH = crypto.createHash('sha256').update(PASSWORD).digest('hex');
    process.env.GITHUB_REPO = 'o/r';
    process.env.GITHUB_TOKEN = 't';
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts) => (opts?.method === 'PUT'
      ? { ok: true, json: async () => ({ commit: { sha: 'abc' } }) }
      : { ok: false }));
  });
  afterEach(() => { fetchSpy.mockRestore(); delete process.env.ADMIN_HASH; delete process.env.GITHUB_REPO; delete process.env.GITHUB_TOKEN; });

  it('401s a wrong password before touching GitHub', async () => {
    const r = res(); await commitImage(post({ wordId: 'cat', imageBase64: WEBP }, 'wrong'), r);
    expect(r.code).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('400s a bad image and never commits it', async () => {
    const r = res(); await commitImage(post({ wordId: 'cat', imageBase64: b64('<html>hi</html>') }), r);
    expect(r.code).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it('400s a missing body instead of crashing', async () => {
    const r = res(); await commitImage(post(undefined), r);
    expect(r.code).toBe(400);
  });
  it('commits a valid WebP', async () => {
    const r = res(); await commitImage(post({ wordId: 'cat', imageBase64: WEBP }), r);
    expect(r.code).toBe(200);
    expect(r.body).toMatchObject({ success: true, commitSha: 'abc' });
  });
  it('does not echo GitHub error text to the client', async () => {
    fetchSpy.mockImplementation(async (url, opts) => (opts?.method === 'PUT' ? { ok: false, status: 422, text: async () => 'token ghp_secret invalid' } : { ok: false }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = res(); await commitImage(post({ wordId: 'cat', imageBase64: WEBP }), r);
    expect(r.code).toBe(500);
    expect(JSON.stringify(r.body)).not.toMatch(/ghp_secret/);
  });
});
