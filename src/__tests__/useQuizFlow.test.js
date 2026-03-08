import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));

vi.mock('../utils/analytics', () => ({
  analytics: {
    quizFunnelLevel: vi.fn(),
    quizFunnelMode: vi.fn(),
    quizStart: vi.fn(),
    quizComplete: vi.fn(),
    quizAnswer: vi.fn(),
  },
}));

vi.mock('../utils/images', () => ({
  preloadImages: vi.fn((_words, onProgress) => {
    onProgress(1);
    return Promise.resolve({ missing: [] });
  }),
}));

vi.mock('../data/words', async () => {
  const words = Array.from({ length: 20 }, (_, i) => ({
    id: `word_${i}`,
    word: `Word${i}`,
    category: i < 7 ? 'animals' : 'food',
    definition: `Def ${i}`,
    image: `/images/word_${i}.webp`,
    level: i < 7 ? 'beginner' : i < 14 ? 'intermediate' : 'advanced',
  }));

  return {
    WORDS: words,
    getWordsByLevel: (level) => words.filter(w => w.level === level),
    getDistractors: (word, count) =>
      words.filter(w => w.id !== word.id).slice(0, count),
    getWordById: (id) => words.find(w => w.id === id),
  };
});

import useQuizFlow from '../hooks/useQuizFlow';
import { analytics } from '../utils/analytics';
import { playSound } from '../utils/sound';

describe('useQuizFlow', () => {
  let navigate;
  let setStats;
  let baseStats;

  beforeEach(() => {
    vi.clearAllMocks();
    navigate = vi.fn();
    baseStats = {
      totalQuizzes: 0,
      quizHistory: [],
      bestScores: {},
      unlockedLevels: ['beginner'],
      wordProgress: {},
      badges: [],
      currentStreak: 0,
      bestStreak: 0,
      dailyGoal: { date: new Date().toISOString().slice(0, 10), wordsReviewed: 0 },
    };
    setStats = vi.fn((updater) => {
      if (typeof updater === 'function') {
        return updater(baseStats);
      }
      return updater;
    });
  });

  const renderFlow = (statsOverride = {}) =>
    renderHook(() =>
      useQuizFlow({
        stats: { ...baseStats, ...statsOverride },
        setStats,
        navigate,
      })
    );

  it('initializes with null selections', () => {
    const { result } = renderFlow();
    expect(result.current.selectedLevel).toBeNull();
    expect(result.current.selectedMode).toBeNull();
    expect(result.current.quizWords).toEqual([]);
    expect(result.current.quizResults).toBeNull();
  });

  it('startQuiz sets level/mode and navigates to quiz state', async () => {
    const { result } = renderFlow();

    await act(async () => {
      await result.current.startQuiz('beginner', 'image');
    });

    expect(navigate).toHaveBeenCalledWith('loading');
    expect(navigate).toHaveBeenCalledWith('imageQuiz');
    expect(result.current.quizWords.length).toBeGreaterThan(0);
    expect(analytics.quizStart).toHaveBeenCalledWith('image', 'beginner');
  });

  it('startQuiz maps mode to correct quiz state', async () => {
    const { result } = renderFlow();

    await act(async () => {
      await result.current.startQuiz('beginner', 'word');
    });
    expect(navigate).toHaveBeenCalledWith('wordQuiz');

    navigate.mockClear();
    await act(async () => {
      await result.current.startQuiz('beginner', 'audio');
    });
    expect(navigate).toHaveBeenCalledWith('audioQuiz');

    navigate.mockClear();
    await act(async () => {
      await result.current.startQuiz('beginner', 'listen');
    });
    expect(navigate).toHaveBeenCalledWith('listenMatchQuiz');
  });

  it('handleQuizComplete updates stats and navigates to finished', async () => {
    const { result } = renderFlow();

    // Set level first
    await act(async () => {
      await result.current.startQuiz('beginner', 'image');
    });

    act(() => {
      result.current.handleQuizComplete({
        score: 8,
        total: 10,
        mode: 'image',
        answers: [
          { wordId: 'word_0', correct: true, selected: 'word_0' },
          { wordId: 'word_1', correct: false, selected: 'word_2' },
        ],
      });
    });

    expect(setStats).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('finished');
    expect(analytics.quizComplete).toHaveBeenCalledWith('image', 'beginner', 8, 10);
  });

  it('handleQuizComplete unlocks next level at 7/10', async () => {
    const { result } = renderFlow();

    await act(async () => {
      await result.current.startQuiz('beginner', 'image');
    });

    act(() => {
      result.current.handleQuizComplete({
        score: 7,
        total: 10,
        mode: 'image',
        answers: Array.from({ length: 10 }, (_, i) => ({
          wordId: `word_${i}`,
          correct: i < 7,
          selected: `word_${i}`,
        })),
      });
    });

    // Grab the updater function and call it
    const updater = setStats.mock.calls[0][0];
    const updated = updater(baseStats);
    expect(updated.unlockedLevels).toContain('intermediate');
  });

  it('handleQuizComplete does NOT unlock next level below 7/10', async () => {
    const { result } = renderFlow();

    await act(async () => {
      await result.current.startQuiz('beginner', 'image');
    });

    act(() => {
      result.current.handleQuizComplete({
        score: 6,
        total: 10,
        mode: 'image',
        answers: Array.from({ length: 10 }, (_, i) => ({
          wordId: `word_${i}`,
          correct: i < 6,
          selected: `word_${i}`,
        })),
      });
    });

    const updater = setStats.mock.calls[0][0];
    const updated = updater(baseStats);
    expect(updated.unlockedLevels).not.toContain('intermediate');
  });

  it('handleQuizComplete updates best score', async () => {
    const { result } = renderFlow();

    await act(async () => {
      await result.current.startQuiz('beginner', 'image');
    });

    act(() => {
      result.current.handleQuizComplete({
        score: 9,
        total: 10,
        mode: 'image',
        answers: [],
      });
    });

    const updater = setStats.mock.calls[0][0];
    const updated = updater(baseStats);
    expect(updated.bestScores.beginner).toBe(9);
  });

  it('handleQuizComplete awards first_word badge on first quiz', async () => {
    const { result } = renderFlow();

    await act(async () => {
      await result.current.startQuiz('beginner', 'image');
    });

    act(() => {
      result.current.handleQuizComplete({
        score: 5,
        total: 10,
        mode: 'image',
        answers: [],
      });
    });

    const updater = setStats.mock.calls[0][0];
    const updated = updater(baseStats);
    expect(updated.badges).toContain('first_word');
    expect(playSound).toHaveBeenCalledWith('badge');
  });

  it('handleQuizComplete awards perfect_quiz badge on 10/10', async () => {
    const { result } = renderFlow();

    await act(async () => {
      await result.current.startQuiz('beginner', 'image');
    });

    act(() => {
      result.current.handleQuizComplete({
        score: 10,
        total: 10,
        mode: 'image',
        answers: Array.from({ length: 10 }, (_, i) => ({
          wordId: `word_${i}`,
          correct: true,
          selected: `word_${i}`,
        })),
      });
    });

    const updater = setStats.mock.calls[0][0];
    const updated = updater(baseStats);
    expect(updated.badges).toContain('perfect_quiz');
  });

  it('handleQuizComplete does not duplicate existing badges', async () => {
    baseStats.badges = ['first_word'];
    baseStats.totalQuizzes = 1;
    const { result } = renderFlow();

    await act(async () => {
      await result.current.startQuiz('beginner', 'image');
    });

    act(() => {
      result.current.handleQuizComplete({
        score: 5,
        total: 10,
        mode: 'image',
        answers: [],
      });
    });

    const updater = setStats.mock.calls[0][0];
    const updated = updater(baseStats);
    const firstWordCount = updated.badges.filter(b => b === 'first_word').length;
    expect(firstWordCount).toBe(1);
  });

  it('handleQuizComplete increments totalQuizzes', async () => {
    const { result } = renderFlow();

    await act(async () => {
      await result.current.startQuiz('beginner', 'image');
    });

    act(() => {
      result.current.handleQuizComplete({
        score: 5,
        total: 10,
        mode: 'image',
        answers: [],
      });
    });

    const updater = setStats.mock.calls[0][0];
    const updated = updater(baseStats);
    expect(updated.totalQuizzes).toBe(1);
  });

  it('handleStartPersonalQuiz starts quiz with custom words', async () => {
    const customWords = Array.from({ length: 5 }, (_, i) => ({
      id: `custom_${i}`,
      word: `Custom${i}`,
      category: 'custom',
      definition: `Custom def ${i}`,
      image: `/images/custom_${i}.webp`,
    }));

    const { result } = renderFlow();

    await act(async () => {
      await result.current.handleStartPersonalQuiz(customWords, 'image');
    });

    expect(result.current.selectedMode).toBe('image');
    expect(navigate).toHaveBeenCalledWith('loading');
  });
});
