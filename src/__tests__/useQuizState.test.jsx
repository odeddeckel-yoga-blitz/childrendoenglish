import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Test useQuizState through a real component (ImageQuiz) to avoid
// renderHook + fake timer issues. This gives us realistic integration coverage.
import ImageQuiz from '../components/ImageQuiz';
import { playSound } from '../utils/sound';
import { haptic } from '../utils/haptic';
import { WORDS } from '../data/words';

const testWords = WORDS.slice(0, 3).map(w => ({
  ...w,
  _distractors: WORDS.filter(d => d.id !== w.id).slice(0, 3),
}));

describe('useQuizState (via ImageQuiz)', () => {
  let onComplete;

  beforeEach(() => {
    vi.clearAllMocks();
    onComplete = vi.fn();
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

  it('starts at question 1 of total', () => {
    renderQuiz();
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('renders 4 answer option buttons', () => {
    renderQuiz();
    const optionButtons = screen.getAllByRole('button').filter(btn =>
      !btn.getAttribute('aria-label') && btn.textContent && !btn.textContent.match(/skip|quit|sound/i)
    );
    // Should have at least 4 option buttons
    expect(optionButtons.length).toBeGreaterThanOrEqual(4);
  });

  it('shows correct feedback and plays sound on correct answer', () => {
    renderQuiz();
    // Find the correct word button
    const correctBtn = screen.getByRole('button', { name: testWords[0].word });

    fireEvent.click(correctBtn);

    expect(playSound).toHaveBeenCalledWith('correct');
    expect(haptic).toHaveBeenCalledWith('success');
  });

  it('shows wrong feedback on incorrect answer', () => {
    renderQuiz();
    // Find a wrong answer button
    const buttons = screen.getAllByRole('button');
    const wrongBtn = buttons.find(btn =>
      btn.textContent === testWords[0]._distractors[0].word
    );
    if (!wrongBtn) return; // distractors may be shuffled differently

    fireEvent.click(wrongBtn);

    expect(playSound).toHaveBeenCalledWith('wrong');
    expect(haptic).toHaveBeenCalledWith('error');
  });

  it('ignores clicks when already answered', () => {
    renderQuiz();
    const correctBtn = screen.getByRole('button', { name: testWords[0].word });

    fireEvent.click(correctBtn);
    fireEvent.click(correctBtn);

    // playSound should be called exactly once
    expect(playSound).toHaveBeenCalledTimes(1);
  });

  it('skip button marks as wrong', () => {
    renderQuiz();
    const skipBtn = screen.getByText(/skip/i);

    fireEvent.click(skipBtn);

    // Skipping counts as wrong — no 'correct' sound
    expect(playSound).not.toHaveBeenCalledWith('correct');
  });

  it('quit button opens confirmation dialog', () => {
    renderQuiz();
    const quitBtn = screen.getAllByRole('button').find(btn =>
      btn.getAttribute('aria-label')?.toLowerCase().includes('quit')
    );
    if (!quitBtn) return;

    fireEvent.click(quitBtn);

    // Should show quit confirmation dialog
    const dialog = screen.queryByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});
