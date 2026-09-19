import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computeGain,
  clampLightningSecs,
  suggestNextMode,
  FAST_ANSWER_MS,
  LIGHTNING_SECS,
} from '../utils/arcade';

vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));

vi.mock('../utils/haptic', () => ({
  haptic: vi.fn(),
}));

vi.mock('../utils/analytics', () => ({
  analytics: { quizAnswer: vi.fn() },
}));

import ImageQuiz from '../components/ImageQuiz';
import { WORDS } from '../data/words';

describe('arcade computeGain (combo math)', () => {
  it('base gain is 10 for streak 1, no fast bonus', () => {
    expect(computeGain(1, false)).toBe(10);
  });

  it('applies the 1.5x fast-answer bonus', () => {
    expect(computeGain(1, true)).toBe(15);
  });

  it('grows 15% per streak step: streak 2 = 11.5 -> 12 (rounded)', () => {
    expect(computeGain(2, false)).toBe(12); // 10 * 1.15
    expect(computeGain(3, false)).toBe(13); // 10 * 1.30
    expect(computeGain(5, false)).toBe(16); // 10 * 1.60
  });

  it('combines combo and fast bonus (streak 2 fast = 17)', () => {
    expect(computeGain(2, true)).toBe(17); // round(10 * 1.15 * 1.5) = round(17.25)
  });

  it('clamps streak to at least 1', () => {
    expect(computeGain(0, false)).toBe(10);
    expect(computeGain(-3, true)).toBe(15);
  });

  it('exports sane constants', () => {
    expect(FAST_ANSWER_MS).toBe(4000);
    expect(LIGHTNING_SECS).toBe(60);
  });
});

describe('clampLightningSecs', () => {
  it('defaults to 60 on garbage', () => {
    expect(clampLightningSecs('abc')).toBe(60);
    expect(clampLightningSecs(undefined)).toBe(60);
  });
  it('clamps to [3, 600]', () => {
    expect(clampLightningSecs('1')).toBe(3);
    expect(clampLightningSecs('9999')).toBe(600);
    expect(clampLightningSecs('45')).toBe(45);
  });
});

describe('suggestNextMode', () => {
  it('suggests a different mode in rotation', () => {
    expect(suggestNextMode('image', true)).toBe('word');
    expect(suggestNextMode('listen', true)).toBe('image');
  });
  it('never suggests the image quiz to pre-readers', () => {
    expect(suggestNextMode('listen', false)).toBe('word');
    expect(suggestNextMode('image', false)).toBe('word');
  });
});

describe('combo scoring in the quiz flow (useQuizState via ImageQuiz)', () => {
  const testWords = WORDS.slice(0, 3).map(w => ({
    ...w,
    _distractors: WORDS.filter(d => d.id !== w.id).slice(0, 3),
  }));

  let onComplete;

  beforeEach(() => {
    vi.useFakeTimers();
    onComplete = vi.fn();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const renderQuiz = () =>
    render(
      <ImageQuiz
        words={testWords}
        lang="en"
        soundEnabled={true}
        onToggleSound={vi.fn()}
        onComplete={onComplete}
        onQuit={vi.fn()}
      />
    );

  const clickCorrect = (i) =>
    fireEvent.click(screen.getByRole('button', { name: testWords[i].word }));

  const clickWrong = (i) => {
    const wrongWord = testWords[i]._distractors[0].word;
    const btn = screen
      .getAllByRole('button')
      .find(b => b.textContent.trim() === wrongWord && !b.disabled);
    fireEvent.click(btn);
  };

  const advance = () => act(() => { vi.advanceTimersByTime(1200); });

  it('awards 15 for a fast first correct answer (10 x 1 x 1.5)', () => {
    renderQuiz();
    clickCorrect(0);
    expect(screen.getByText('⭐ 15')).toBeInTheDocument();
  });

  it('shows the combo pill at streak >= 2 and compounds the score', () => {
    renderQuiz();
    clickCorrect(0); // +15
    advance();
    clickCorrect(1); // +17 (10 * 1.15 * 1.5)
    expect(screen.getByText('×2')).toBeInTheDocument();
    expect(screen.getByText('⭐ 32')).toBeInTheDocument();
  });

  it('resets the combo on a wrong answer but keeps the score', () => {
    renderQuiz();
    clickCorrect(0); // +15, streak 1
    advance();
    clickCorrect(1); // +17, streak 2 -> pill visible
    expect(screen.getByText('×2')).toBeInTheDocument();
    advance();
    clickWrong(2); // streak resets
    expect(screen.queryByText(/^×\d+$/)).not.toBeInTheDocument();
    expect(screen.getByText('⭐ 32')).toBeInTheDocument();
  });

  it('reports arcade totals in the completion payload', () => {
    renderQuiz();
    clickCorrect(0);
    advance();
    clickCorrect(1);
    advance();
    clickWrong(2);
    advance(); // completion fires after the last feedback delay
    expect(onComplete).toHaveBeenCalledTimes(1);
    const results = onComplete.mock.calls[0][0];
    expect(results.arcade).toEqual({ score: 32, bestStreak: 2, fastAnswers: 2 });
  });

  it('does not apply the fast bonus to slow answers', () => {
    renderQuiz();
    act(() => { vi.advanceTimersByTime(FAST_ANSWER_MS + 500); }); // dawdle past the fast window
    clickCorrect(0);
    expect(screen.getByText('⭐ 10')).toBeInTheDocument();
  });
});
