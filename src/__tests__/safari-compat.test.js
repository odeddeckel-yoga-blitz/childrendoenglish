import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Safari/WebKit compatibility — prevent silent mobile crashes.
 *
 * ALL iOS browsers (Safari, Chrome, Firefox, etc.) use WebKit.
 * WebKit may lack APIs that exist in Chromium/Firefox desktop.
 *
 * A bare reference to an undeclared variable — even with optional
 * chaining — throws a ReferenceError that kills the entire ES module:
 *
 *   requestIdleCallback?.(fn)       // ReferenceError in WebKit!
 *   requestIdleCallback ?? fallback  // ReferenceError in WebKit!
 *
 * Safe alternatives:
 *   typeof requestIdleCallback === 'function' && requestIdleCallback(fn)
 *   window.requestIdleCallback?.(fn)
 *   globalThis.requestIdleCallback?.(fn)
 *
 * Drop this file into any Vite/vitest project's test directory.
 * Configure the two constants below to match your setup.
 */

// ─── CONFIGURATION ──────────────────────────────────────────────
// Directory to scan (relative to this test file)
const SRC_DIR = path.resolve(import.meta.dirname, '..');

// File extensions to scan
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Directories to skip
const SKIP_DIRS = ['__tests__', '__mocks__', 'node_modules', '.git', 'dist', 'build'];

// Browser APIs that may not exist in Safari/WebKit.
// A bare reference to any of these crashes the ES module on iOS.
const WEBKIT_MISSING_APIS = [
  // Scheduling — Safari 16.4+ only, older iOS and Playwright WebKit lack it
  'requestIdleCallback',
  'cancelIdleCallback',

  // Scheduler API — Chrome-only (Chromium 94+), not in Safari or Firefox
  'scheduler',

  // Navigation API — Chrome-only (Chromium 102+), not in Safari or Firefox
  'navigation',

  // File System Access — Chrome-only, not in Safari or Firefox
  'showOpenFilePicker',
  'showSaveFilePicker',
  'showDirectoryPicker',

  // EyeDropper — Chrome-only
  'EyeDropper',

  // Barcode Detection — Chrome/Android only
  'BarcodeDetector',

  // Web Bluetooth / USB / Serial — Chrome-only
  'BluetoothUUID',

  // Screen Wake Lock may throw in some WebKit versions
  // 'WakeLock', // uncomment if you use it

  // SharedArrayBuffer — requires cross-origin isolation headers
  // 'SharedArrayBuffer', // uncomment if you use it
];
// ─── END CONFIGURATION ──────────────────────────────────────────

function getSourceFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !SKIP_DIRS.includes(entry.name)) {
      results.push(...getSourceFiles(full));
    } else if (entry.isFile() && EXTENSIONS.some(e => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

function findUnsafeReferences(files, api) {
  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let insideTypeofGuard = false;

    lines.forEach((line, i) => {
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

      // Track typeof guard blocks: if (typeof api ...) { ... }
      if (line.includes(`typeof ${api}`)) { insideTypeofGuard = true; return; }
      if (insideTypeofGuard && (trimmed === '}' || trimmed === '} else {')) {
        insideTypeofGuard = false;
        return;
      }

      if (!line.includes(api)) return;
      if (insideTypeofGuard) return;

      // Safe patterns that don't cause ReferenceError
      const safe = [
        `typeof ${api}`,        // typeof requestIdleCallback
        `window.${api}`,        // window.requestIdleCallback
        `globalThis.${api}`,    // globalThis.requestIdleCallback
        `self.${api}`,          // self.requestIdleCallback (in workers)
        `'${api}'`,             // string literal (single quotes)
        `"${api}"`,             // string literal (double quotes)
        `\`${api}\``,           // template literal
        `.${api}`,              // property access on an object
        `import`,               // import statement
      ];
      if (safe.some(p => line.includes(p))) return;

      violations.push(`${path.relative(SRC_DIR, file)}:${i + 1}: ${trimmed}`);
    });
  }

  return violations;
}

describe('Safari/WebKit compatibility', () => {
  const files = getSourceFiles(SRC_DIR);

  it.each(WEBKIT_MISSING_APIS)('no unsafe bare reference to %s', (api) => {
    const violations = findUnsafeReferences(files, api);
    expect(
      violations,
      `Bare reference to "${api}" will crash Safari/iOS WebKit.\n` +
      `Use \`typeof ${api} === 'function'\` or \`window.${api}\` instead.\n` +
      `Violations:\n${violations.join('\n')}`
    ).toEqual([]);
  });

  it('typeof check safely falls back when API is missing', () => {
    // Delete every API from global scope to simulate WebKit
    const originals = {};
    for (const api of WEBKIT_MISSING_APIS) {
      originals[api] = globalThis[api];
      delete globalThis[api];
    }

    try {
      // This is the safe pattern — must not throw
      for (const api of WEBKIT_MISSING_APIS) {
        const exists = new Function(`return typeof ${api} === 'function'`)();
        expect(exists).toBe(false);
      }
    } finally {
      for (const api of WEBKIT_MISSING_APIS) {
        if (originals[api] !== undefined) globalThis[api] = originals[api];
      }
    }
  });
});
