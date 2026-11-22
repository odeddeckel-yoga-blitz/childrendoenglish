// safeEqual (audit 11-18): constant-time secret compare, used by land.js GET.
// Split out of adminAuth.test.js when the admin image APIs were removed (11-22, audit A090).
import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as safeCompare from '../_lib/safeCompare.js';

const { safeEqual } = safeCompare;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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

// A090: the GitHub-write admin endpoints and the #admin route are gone from prod.
describe('admin image tool removed (audit A090)', () => {
  it('has no commit-image / fetch-image serverless functions', () => {
    expect(fs.existsSync(path.join(root, 'api/commit-image.js'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'api/fetch-image.js'))).toBe(false);
  });
  it('has no admin bearer check left in the shared lib', () => {
    expect(safeCompare.verifyAdminAuth).toBeUndefined();
  });
  it('the SPA no longer routes #admin or ships the admin components', () => {
    const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
    expect(app).not.toMatch(/['"]#admin['"]/);
    expect(app).not.toMatch(/AdminPanel/);
    expect(fs.existsSync(path.join(root, 'src/components/admin'))).toBe(false);
  });
});
