import { describe, it, expect } from 'vitest';
import { dbUrl } from '../_lib/dbUrl.js';

describe('dbUrl (Neon move, 10-31)', () => {
  it('prefers the new Vercel-org database, then the old project, then generic names', () => {
    expect(dbUrl({ CDE_NEW_DATABASE_URL: 'new', CDE_DATABASE_URL: 'old', DATABASE_URL: 'x' })).toBe('new');
    expect(dbUrl({ CDE_DATABASE_URL: 'old', DATABASE_URL: 'x' })).toBe('old'); // Preview + rollback
    expect(dbUrl({ DATABASE_URL: 'x', POSTGRES_URL: 'y' })).toBe('x');
    expect(dbUrl({})).toBeUndefined();
  });
});
