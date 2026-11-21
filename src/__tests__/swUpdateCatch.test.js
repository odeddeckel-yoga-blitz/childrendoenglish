import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

// Every registration.update() call must handle its rejection (Sentry 11-19: "Failed to update a ServiceWorker").
describe('service worker update', () => {
  it('catches registration.update() rejections', () => {
    const src = readFileSync('src/components/UpdatePrompt.jsx', 'utf8');
    const calls = src.match(/registration\.update\(\)[^\n]*/g) || [];
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c).toMatch(/\.catch\(/);
  });
});
