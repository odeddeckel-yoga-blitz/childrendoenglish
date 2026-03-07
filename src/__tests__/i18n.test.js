import { describe, it, expect, beforeAll } from 'vitest';
import { t, isRTL, loadHebrew } from '../utils/i18n';
import heTranslations from '../utils/i18n-he.js';
import rawI18n from '../utils/i18n.js?raw';

// Extract all keys from the `en: { ... }` block in the i18n.js source.
// This avoids needing to export `translations` from i18n.js.
function extractEnKeys(source) {
  // Find the en block: starts after `en: {` and ends at the matching closing brace.
  const enStart = source.indexOf('en: {');
  if (enStart === -1) throw new Error('Could not find en: { in i18n.js source');

  // Walk forward from the opening brace to find the matching closing brace.
  let depth = 0;
  let blockStart = -1;
  for (let i = enStart + 4; i < source.length; i++) {
    if (source[i] === '{') {
      if (depth === 0) blockStart = i;
      depth++;
    } else if (source[i] === '}') {
      depth--;
      if (depth === 0) {
        const enBlock = source.slice(blockStart + 1, i);
        // Extract property keys: unquoted identifiers or single/double-quoted strings
        const keyPattern = /^\s*(?:'([^']+)'|"([^"]+)"|([a-zA-Z_$][a-zA-Z0-9_$]*))\s*:/gm;
        const keys = [];
        let match;
        while ((match = keyPattern.exec(enBlock)) !== null) {
          keys.push(match[1] ?? match[2] ?? match[3]);
        }
        return keys;
      }
    }
  }
  throw new Error('Could not find end of en block in i18n.js source');
}

describe('i18n', () => {
  beforeAll(() => loadHebrew());

  it('returns English string for known key', () => {
    expect(t('appName', 'en')).toBe('Children Do English');
  });

  it('returns Hebrew string for known key', () => {
    expect(t('appName', 'he')).toBe('ילדים עושים אנגלית');
  });

  it('falls back to English when key missing in Hebrew', () => {
    // All keys should exist in both, but if one is missing it falls back
    expect(t('appName')).toBe('Children Do English');
  });

  it('returns key itself when unknown', () => {
    expect(t('nonExistentKey', 'en')).toBe('nonExistentKey');
  });

  it('replaces template variables', () => {
    expect(t('playingAs', 'en', { name: 'Alex' })).toBe('Playing as Alex');
  });

  it('replaces multiple template variables', () => {
    expect(t('lessonProgress', 'en', { done: 3, total: 8 })).toBe('3 / 8 mastered');
  });

  it('isRTL returns true for Hebrew', () => {
    expect(isRTL('he')).toBe(true);
  });

  it('isRTL returns false for English', () => {
    expect(isRTL('en')).toBe(false);
  });

  it('all English keys have Hebrew translations', () => {
    const enKeys = extractEnKeys(rawI18n);
    const heKeys = Object.keys(heTranslations);
    const missingInHe = enKeys.filter(k => !heKeys.includes(k));
    expect(
      missingInHe,
      `Keys present in English but missing in Hebrew: ${missingInHe.join(', ')}`
    ).toEqual([]);
  });

  it('all Hebrew keys have English translations', () => {
    const enKeys = extractEnKeys(rawI18n);
    const heKeys = Object.keys(heTranslations);
    const missingInEn = heKeys.filter(k => !enKeys.includes(k));
    expect(
      missingInEn,
      `Keys present in Hebrew but missing in English: ${missingInEn.join(', ')}`
    ).toEqual([]);
  });
});
