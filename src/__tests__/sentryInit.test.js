import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// The privacy page says error reports go to Sentry "only when something breaks". Two Sentry defaults would break that:
// sendDefaultPii (IP inference) and the BrowserSession integration (a ping per app load / route once a release is set).
const MAIN = readFileSync(resolve(import.meta.dirname, '../main.jsx'), 'utf-8');

describe('Sentry init stays errors-only', () => {
  it('keeps sendDefaultPii off', () => {
    expect(MAIN).toMatch(/sendDefaultPii:\s*false/);
  });
  it('drops the BrowserSession integration', () => {
    expect(MAIN).toMatch(/integrations:\s*\(defaults\)\s*=>\s*defaults\.filter\(\(i\)\s*=>\s*i\.name\s*!==\s*'BrowserSession'\)/);
  });
  it('turns on no tracing, replay or profiling', () => {
    expect(MAIN).not.toMatch(/tracesSampleRate|replaysSessionSampleRate|replaysOnErrorSampleRate|profilesSampleRate/);
  });
});
