import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { pickWord, pickGame, pickSpotlight, wordGraduated, gameGraduated, GRAD } from '../utils/spotlightPick';
import { WORDS } from '../data/words';
import { ARCADE } from '../data/arcadeGames';
import spotlight from '../data/spotlight.json';

const words = [
  { id: 'apple', word: 'apple', category: 'food', hebrewTranslation: 'תפוח', imageUrl: '/images/apple.webp' },
  { id: 'bear', word: 'bear', category: 'animals', hebrewTranslation: 'דוב', imageUrl: '/images/bear.webp' },
  { id: 'cat', word: 'cat', category: 'animals', hebrewTranslation: 'חתול', imageUrl: '/images/cat.webp' },
];
const games = ARCADE;

describe('spotlight picker', () => {
  it('graduation rules', () => {
    expect(wordGraduated({ ans: 30, ok: 21 })).toBe(true);
    expect(wordGraduated({ ans: 30, ok: 20 })).toBe(false);   // accuracy below the bar
    expect(wordGraduated({ ans: 29, ok: 29 })).toBe(false);   // not enough answers
    expect(gameGraduated({ opens: 30, lvl: 60 })).toBe(true);
    expect(gameGraduated({ opens: 30, lvl: 59 })).toBe(false);
    expect(gameGraduated({ opens: 0, lvl: 500 })).toBe(false); // level-ups without opens never graduate
  });

  it('picks the lowest-traffic non-graduated item per lane', () => {
    const snap = { generatedAt: '2026-10-09', words: { apple: [40, 40], bear: [5, 2] }, games: { 'word-zapper': { opens: 10, lvl: 21 }, 'spelling-forge': { opens: 3, lvl: 9 } } };
    expect(pickWord(words, snap).id).toBe('cat');               // 0 answers beats bear's 5; apple graduated
    expect(pickGame(games, snap).id).toBe('category-conveyor'); // absent from snapshot = 0 opens
    const snap2 = { ...snap, words: { apple: [40, 40], bear: [5, 2], cat: [7, 1] } };
    expect(pickWord(words, snap2).id).toBe('bear');
  });

  it('excludes graduated items and falls back to the whole lane when everything graduated', () => {
    const snap = { words: { apple: [40, 40], bear: [50, 45], cat: [60, 60] }, games: { 'word-zapper': { opens: 40, lvl: 100 }, 'spelling-forge': { opens: 50, lvl: 200 }, 'category-conveyor': { opens: 90, lvl: 300 } } };
    expect(pickWord(words, snap).id).toBe('apple');
    expect(pickGame(games, snap).id).toBe('word-zapper');
  });

  it('is deterministic for a given snapshot and rotates the zero-traffic tiebreak with the snapshot date', () => {
    const a = { generatedAt: '2026-10-09T00:00:00.000Z', words: {}, games: {} };
    expect(pickSpotlight({ words: WORDS, games, snap: a })).toEqual(pickSpotlight({ words: WORDS, games, snap: a }));
    const picks = new Set(['2026-10-09', '2026-10-16', '2026-10-23', '2026-10-30', '2026-11-06']
      .map((d) => pickWord(WORDS, { generatedAt: d, words: {}, games: {} }).id));
    expect(picks.size).toBeGreaterThan(1);
  });

  it('committed spotlight.json names a real non-graduated word and game', () => {
    const w = WORDS.find((x) => x.id === spotlight.word.id);
    expect(w).toBeTruthy();
    expect(`/vocabulary/${w.category}/${w.id}/`).toMatch(/^\/vocabulary\/[a-z]+\/[a-z0-9_-]+\/$/);
    expect(wordGraduated({ ans: spotlight.word.ans, ok: spotlight.word.ok })).toBe(false);
    expect(games.some((g) => g.id === spotlight.game.id)).toBe(true);
    expect(gameGraduated({ opens: spotlight.game.opens, lvl: spotlight.game.lvl })).toBe(false);
    expect(spotlight.gradRule).toContain(String(GRAD.word.ans));
  });
});

vi.mock('../utils/learnBeacon', () => ({ sendLearn: vi.fn(), sendLearnBatch: vi.fn() }));
import { sendLearn } from '../utils/learnBeacon';
import SpotlightCards from '../components/SpotlightCards';
import { loadLocale } from '../utils/i18n';

describe('SpotlightCards', () => {
  it('renders both lanes with page links and fires the spot beacon on click', () => {
    render(<SpotlightCards lang="en" />);
    expect(screen.getByText("Today's picks")).toBeInTheDocument();
    const word = document.querySelector('a[data-spot="word"]');
    const game = document.querySelector('a[data-spot="game"]');
    expect(word.getAttribute('href')).toBe(`/vocabulary/${spotlight.word.category}/${spotlight.word.id}/`);
    expect(game.getAttribute('href')).toBe(`/games/${spotlight.game.id}/`);
    fireEvent.click(word);
    fireEvent.click(game);
    expect(sendLearn).toHaveBeenCalledWith('spot', 'w_' + spotlight.word.id);
    expect(sendLearn).toHaveBeenCalledWith('spot', 'g_' + spotlight.game.id);
  });

  it('localizes labels and glosses in Hebrew and Spanish', async () => {
    await loadLocale('he');
    const { unmount } = render(<SpotlightCards lang="he" />);
    expect(screen.getByText('מילת היום')).toBeInTheDocument();
    expect(screen.getByText(spotlight.word.he)).toBeInTheDocument();
    unmount();
    await loadLocale('es');
    render(<SpotlightCards lang="es" />);
    expect(screen.getByText('Palabra del día')).toBeInTheDocument();
    expect(screen.getByText('Juego del día')).toBeInTheDocument();
  });
});
