import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LetterFix from '../components/LetterFix';
import { WORDS } from '../data/words';
import { letterFixPlan } from '../utils/learningCycle';

vi.mock('../utils/sound', () => ({ speakWord: vi.fn(), playSound: vi.fn(), stopWordAudio: vi.fn() }));

// Sentry c5c32558 (11-27): ladder steps lf2 (double: 2 blanks) -> lf3 (hard: 1 blank) keep LetterFix mounted; the
// blank position stayed at 1 and blanks[1] was undefined -> "Cannot read properties of undefined (reading 'options')".
describe('LetterFix across ladder steps', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('moving from the double step to a one-blank step does not crash', () => {
    const words = WORDS.filter((w) => /^[a-z]{4,}$/.test(w.word)).slice(0, 1);
    const onComplete = vi.fn();
    const { rerender } = render(<LetterFix words={words} mode="double" onComplete={onComplete} />);
    const blanks = letterFixPlan(words[0], 'double').blanks;
    expect(blanks).toHaveLength(2);
    for (const b of blanks) fireEvent.click(screen.getAllByRole('button').find((el) => el.textContent === b.letter));
    act(() => { vi.advanceTimersByTime(1500); });
    expect(onComplete).toHaveBeenCalled();
    expect(() => rerender(<LetterFix words={words} mode="hard" onComplete={onComplete} />)).not.toThrow();
    const hard = letterFixPlan(words[0], 'hard').blanks[0];
    expect(screen.getAllByRole('button').some((el) => el.textContent === hard.letter)).toBe(true);
  });
});
