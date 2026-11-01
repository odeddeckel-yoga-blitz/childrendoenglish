// Kit component clicks (infra/kpi v1.50.0): CDE's config must exclude every leaf/play route and give each page
// family its own template, so dead-component counts pool by layout and never include word pages or quizzes.
import { describe, it, expect } from 'vitest';
import { checkConfig, normRoute, templateFor } from '../../public/component-clicks.js';
import { CC_CONFIG, NAV_VIEWS } from '../../public/cc-config.js';

const route = (p) => normRoute(p);
const excluded = (p) => CC_CONFIG.exclude.some((re) => re.test(route(p)));
const tpl = (p) => templateFor(route(p), CC_CONFIG.templates);

describe('component clicks config', () => {
  it('passes the kit schema', () => {
    expect(checkConfig(CC_CONFIG)).toEqual([]);
  });

  it('excludes leaf content and play routes', () => {
    for (const p of ['/vocabulary/animals/cat/', '/vocabulary/food/grapes', '/games/read-it/', '/games/category-conveyor',
      '/band-1/reading/my-dog/', '/tools/flashcard-maker/', '/learn', '/flashcards', '/daily-review', '/today', '/battle/',
      '/projector/', '/privacy', '/terms']) expect(excluded(p), p).toBe(true);
  });

  it('tracks navigation pages', () => {
    for (const p of ['/', '/app', '/play', '/he/', '/es/', '/games/', '/vocabulary/', '/vocabulary/animals/',
      '/vocabulary/animals/hebrew/', '/vocabulary/animals/spanish/', '/vocabulary/ages-6-8/', '/printable-flashcards/',
      '/printable-flashcards/animals/', '/printable-flashcards/animals/hebrew/', '/he/english-games/animals/',
      '/he/english-games/ages-9-10/', '/he/grade-3/', '/units/', '/units/jet-1/', '/units/jet-1/unit-1/', '/band-1/',
      '/band-1/animals/', '/band-1/review/set-3/', '/band-1/reading/', '/guides/learn-english-words-with-pictures/'])
      expect(excluded(p), p).toBe(false);
  });

  it('gives each page family its own template', () => {
    expect(tpl('/')).toBe('home');
    expect(tpl('/app')).toBe('app');
    expect(tpl('/he/')).toBe('he');
    expect(tpl('/he/english-games/')).toBe('he-hub');
    expect(tpl('/he/english-games/animals/')).toBe('he-games-topic');
    expect(tpl('/he/english-games/ages-6-8/')).toBe('he-games-age');
    expect(tpl('/he/english-words/family/')).toBe('he-words-set');
    expect(tpl('/he/grade-4/')).toBe('he-grade');
    expect(tpl('/grade-1/')).toBe('grade');
    expect(tpl('/grade-6/')).toBe('grade');
    expect(tpl('/band-1/')).toBe('band1-hub');
    expect(tpl('/vocabulary/ages-9-10/')).toBe('vocab-age');
    expect(tpl('/vocabulary/food/')).toBe('vocab-category');
    expect(tpl('/vocabulary/food/spanish/')).toBe('vocab-category-lang');
    expect(tpl('/printable-flashcards/food/')).toBe('printable-category');
    expect(tpl('/printable-flashcards/food/hebrew/')).toBe('printable-lang');
    expect(tpl('/units/jet-2/')).toBe('unit-series');
    expect(tpl('/units/jet-2/unit-3/')).toBe('unit');
    expect(tpl('/band-1/review/')).toBe('band1-review-hub');
    expect(tpl('/band-1/review/set-1/')).toBe('band1-review-set');
    expect(tpl('/band-1/reading/')).toBe('band1-reading-hub');
    expect(tpl('/band-1/food/')).toBe('band1-topic');
    expect(tpl('/guides/best-english-learning-apps-for-kids/')).toBe('guide');
  });

  it('counts only navigation views in the SPA (quizzes keep the /app URL)', () => {
    for (const v of ['menu', 'landing', 'playerCreate']) expect(NAV_VIEWS.has(v)).toBe(true);
    for (const v of ['imageQuiz', 'wordQuiz', 'audioQuiz', 'flashcards', 'finished', 'onboarding', 'ladder', 'setPicker'])
      expect(NAV_VIEWS.has(v)).toBe(false);
  });
});
