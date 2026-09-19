import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));

vi.mock('../utils/haptic', () => ({
  haptic: vi.fn(),
}));

import LightningRound from '../components/LightningRound';
import { WORDS } from '../data/words';

const testWords = WORDS.slice(0, 4).map(w => ({
  ...w,
  _distractors: WORDS.filter(d => d.id !== w.id).slice(0, 3),
}));

describe('LightningRound', () => {
  let onFinish, onExit;

  beforeEach(() => {
    vi.useFakeTimers();
    onFinish = vi.fn();
    onExit = vi.fn();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const renderLightning = (props = {}) =>
    render(
      <LightningRound
        words={testWords}
        mode="image"
        lang="en"
        best={0}
        secs={3}
        onFinish={onFinish}
        onExit={onExit}
        {...props}
      />
    );

  it('renders the countdown at the configured duration', () => {
    renderLightning();
    expect(screen.getByTestId('lightning-timer')).toHaveTextContent('⚡3');
    expect(screen.getByTestId('lightning-solves')).toHaveTextContent('✓ 0');
  });

  it('counts down each second', () => {
    renderLightning();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByTestId('lightning-timer')).toHaveTextContent('⚡2');
  });

  it('counts a correct solve and advances to the next question', () => {
    // Single-word pool makes the correct answer deterministic
    renderLightning({ words: [testWords[0]] });
    fireEvent.click(screen.getByRole('button', { name: testWords[0].word }));
    expect(screen.getByTestId('lightning-solves')).toHaveTextContent('✓ 1');
    // After the flash delay the next question is answerable again
    act(() => { vi.advanceTimersByTime(400); });
    fireEvent.click(screen.getByRole('button', { name: testWords[0].word }));
    expect(screen.getByTestId('lightning-solves')).toHaveTextContent('✓ 2');
  });

  it('ends after the timer runs out and reports solves once', () => {
    renderLightning();
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByTestId('lightning-results')).toBeInTheDocument();
    expect(screen.getByText(/Time's up!/)).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(0);
    // Timer must not keep firing extra finishes
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('shows NEW LIGHTNING BEST when solves beat the stored best', () => {
    renderLightning({ words: [testWords[0]], best: 0 });
    fireEvent.click(screen.getByRole('button', { name: testWords[0].word }));
    act(() => { vi.advanceTimersByTime(4000); });
    expect(onFinish).toHaveBeenCalledWith(1);
    expect(screen.getByText('★ NEW LIGHTNING BEST!')).toBeInTheDocument();
  });

  it('shows the stored best when it was not beaten', () => {
    renderLightning({ words: [testWords[0]], best: 5 });
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByText('Best: 5')).toBeInTheDocument();
  });

  it('restart resets the round from the results card', () => {
    renderLightning();
    act(() => { vi.advanceTimersByTime(3000); });
    fireEvent.click(screen.getByText('Lightning Again'));
    expect(screen.getByTestId('lightning-timer')).toHaveTextContent('⚡3');
    expect(screen.getByTestId('lightning-solves')).toHaveTextContent('✓ 0');
    // Finishing again reports again
    act(() => { vi.advanceTimersByTime(3000); });
    expect(onFinish).toHaveBeenCalledTimes(2);
  });

  it('back button calls onExit', () => {
    renderLightning();
    act(() => { vi.advanceTimersByTime(3000); });
    fireEvent.click(screen.getByText('Back to results'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('renders nothing without a word pool', () => {
    const { container } = render(
      <LightningRound words={[]} mode="image" lang="en" best={0} secs={3} onFinish={onFinish} onExit={onExit} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
