import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 11-07 speech-sync (kit §8g): after an answer the quiz replays the word, and the fixed 1,200 ms advance moved on while
// it was still playing (~300 ms of the old word over every next question). The advance now waits for the word to end.
let held = null;
vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  whenWordAudioDone: (_ms, cb) => { held = cb; }, // the word is "still playing" until the test calls held()
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));
vi.mock('../utils/haptic', () => ({ haptic: vi.fn() }));
vi.mock('../utils/analytics', () => ({ analytics: { quizAnswer: vi.fn() } }));

import ImageQuiz from '../components/ImageQuiz';
import { WORDS } from '../data/words';

const words = WORDS.slice(0, 3).map((w, i) => ({ ...w, _distractors: WORDS.slice(10 + 3 * i, 13 + 3 * i) }));

describe('the quiz waits for the replayed word before the next question', () => {
  beforeEach(() => { vi.useFakeTimers(); held = null; });
  afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); });

  it('stays on the answered question while the word plays, then advances when it ends', () => {
    const onComplete = vi.fn();
    render(<ImageQuiz words={words} lang="en" soundEnabled onToggleSound={vi.fn()} onComplete={onComplete} onQuit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: words[0].word }));
    act(() => { vi.advanceTimersByTime(1200); });
    expect(held).toBeTypeOf('function');
    expect(screen.queryByRole('button', { name: words[1].word })).toBeNull(); // still question 1
    act(() => { held(); });
    expect(screen.getByRole('button', { name: words[1].word })).toBeInTheDocument();
  });
});
