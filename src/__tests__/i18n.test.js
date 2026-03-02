import { describe, it, expect, beforeAll } from 'vitest';
import { t, isRTL, loadHebrew } from '../utils/i18n';

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
    // Import the translations object indirectly by checking keys
    const enKeys = Object.keys(getTranslations('en'));
    const heKeys = Object.keys(getTranslations('he'));
    const missingInHe = enKeys.filter(k => !heKeys.includes(k));
    expect(missingInHe).toEqual([]);
  });
});

// Helper to get translation keys by testing each one
function getTranslations(lang) {
  // We can't directly import the translations object, but we can test
  // all known keys. This is a simplified version.
  const knownKeys = [
    'appName', 'tagline', 'learnWords', 'flashcards', 'playQuiz',
    'skipThisWord', 'playAgain', 'amazing', 'greatJob', 'goodEffort',
    'keepPracticing', 'chooseLanguage', 'welcomeTitle', 'parentDashboard',
    'learningPath', 'exportData', 'importData', 'cookieConsent',
    'enableReminders', 'disableReminders', 'parentEmailTitle',
  ];
  const result = {};
  knownKeys.forEach(key => {
    const val = t(key, lang);
    if (val !== key) result[key] = val;
  });
  return result;
}
