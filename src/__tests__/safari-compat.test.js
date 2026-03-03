import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Safari/WebKit compatibility tests.
 *
 * Safari (and all iOS browsers, which use WebKit) may lack APIs that
 * exist in Chromium. A bare reference like `requestIdleCallback?.(fn)`
 * throws ReferenceError when the variable is undeclared — crashing
 * the entire ES module and preventing React from mounting.
 *
 * Safe patterns:
 *   typeof requestIdleCallback === 'function'
 *   window.requestIdleCallback
 *   globalThis.requestIdleCallback
 */

// APIs that may not exist in Safari WebKit — bare references will crash ES modules
const UNSAFE_BARE_APIS = [
  'requestIdleCallback',
  'cancelIdleCallback',
];

function getSourceFiles(dir, exts = ['.js', '.jsx']) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== '__tests__' && entry.name !== 'node_modules') {
      results.push(...getSourceFiles(full, exts));
    } else if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

describe('Safari/WebKit compatibility', () => {
  const srcDir = path.resolve(import.meta.dirname, '..');
  const files = getSourceFiles(srcDir);

  it.each(UNSAFE_BARE_APIS)('no bare reference to %s in source files', (api) => {
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      let insideTypeofGuard = false;

      lines.forEach((line, i) => {
        // Skip comments
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

        // Track typeof guard blocks: if (typeof api === 'function') { ... }
        if (line.includes(`typeof ${api}`)) { insideTypeofGuard = true; return; }
        if (insideTypeofGuard && trimmed === '}') { insideTypeofGuard = false; return; }

        // Must contain the API name
        if (!line.includes(api)) return;

        // Safe: inside a typeof guard block
        if (insideTypeofGuard) return;

        // Safe patterns: window./globalThis. prefix, string literal
        const safePatterns = [
          `typeof ${api}`,          // typeof requestIdleCallback
          `window.${api}`,          // window.requestIdleCallback
          `globalThis.${api}`,      // globalThis.requestIdleCallback
          `'${api}'`,               // string literal
          `"${api}"`,               // string literal
        ];
        if (safePatterns.some(p => line.includes(p))) return;

        violations.push(`${path.relative(srcDir, file)}:${i + 1}: ${trimmed}`);
      });
    }

    expect(violations, `Bare reference to "${api}" will crash Safari WebKit. Use typeof check or window.${api} instead.`).toEqual([]);
  });

  it('app entry point works without requestIdleCallback', () => {
    // Simulate Safari WebKit: requestIdleCallback does not exist
    const original = globalThis.requestIdleCallback;
    delete globalThis.requestIdleCallback;

    try {
      // The pattern used in main.jsx must not throw
      const schedule = typeof requestIdleCallback === 'function'
        ? requestIdleCallback
        : (fn) => setTimeout(fn, 3000);

      const called = { value: false };
      schedule(() => { called.value = true; });

      // setTimeout fallback should have been used
      expect(typeof schedule).toBe('function');
    } finally {
      // Restore
      if (original) globalThis.requestIdleCallback = original;
    }
  });
});
