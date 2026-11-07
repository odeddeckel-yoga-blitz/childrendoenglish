import { render, screen, act, fireEvent } from '@testing-library/react';
import { speakWord } from '../utils/sound';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AudioQuiz from '../components/AudioQuiz';

vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
  isSlowAudio: () => false,
  setSlowAudio: vi.fn(),
}));

vi.mock('../utils/learnBeacon', () => ({ sendLearn: vi.fn(), sendLearnBatch: vi.fn() }));
import { sendLearn } from '../utils/learnBeacon';

vi.mock('../utils/haptic', () => ({
  haptic: vi.fn(),
}));

import { WORDS } from '../data/words';

const testWords = WORDS.slice(0, 10);

const defaultProps = {
  words: testWords,
  lang: 'en',
  soundEnabled: true,
  onToggleSound: vi.fn(),
  onComplete: vi.fn(),
  onQuit: vi.fn(),
};

describe('AudioQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quiz header with score', () => {
    render(<AudioQuiz {...defaultProps} />);
    expect(screen.getByText('0/10')).toBeInTheDocument();
  });

  it('renders speaker button with hear again label', () => {
    render(<AudioQuiz {...defaultProps} />);
    expect(screen.getByLabelText('Tap to hear again')).toBeInTheDocument();
  });

  it('shows "Tap to hear again" hint text', () => {
    render(<AudioQuiz {...defaultProps} />);
    expect(screen.getByText('Tap to hear again')).toBeInTheDocument();
  });

  it('renders 4 image options', () => {
    render(<AudioQuiz {...defaultProps} />);
    // the photos are decorative (alt=\"\"); each answer button carries the word (CUX10)
    expect(document.querySelectorAll('button img').length).toBe(4);
  });

  it('names each picture answer button by its word', () => {
    render(<AudioQuiz {...defaultProps} />);
    const buttons = [...document.querySelectorAll('button')].filter((b) => b.querySelector('img'));
    expect(buttons).toHaveLength(4);
    buttons.forEach((b) => expect(b.getAttribute('aria-label')).toBeTruthy());
  });

  it('shows skip button', () => {
    render(<AudioQuiz {...defaultProps} />);
    expect(screen.getByText('Skip this word')).toBeInTheDocument();
  });

  // iOS can block the first word outside a tap: the speaker then pulses with a
  // "tap to hear the word" line, and a tap clears it.
  it('pulses the speaker when the auto-played word was blocked', async () => {
    vi.useFakeTimers();
    speakWord.mockResolvedValue(false);
    render(<AudioQuiz {...defaultProps} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(screen.getByText('Tap to hear the word')).toBeInTheDocument();
    const btn = document.querySelector('[data-need-tap]');
    expect(btn).not.toBeNull();
    fireEvent.click(btn);
    expect(document.querySelector('[data-need-tap]')).toBeNull();
    vi.useRealTimers();
  });

  it('no pulse when the word played', async () => {
    vi.useFakeTimers();
    speakWord.mockResolvedValue(true);
    render(<AudioQuiz {...defaultProps} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(document.querySelector('[data-need-tap]')).toBeNull();
    vi.useRealTimers();
  });

  // 11-07: a new player's first question tallies whether the word played, so "couldn't hear it" is visible.
  it('first quiz, question 1: tallies a blocked autoplay and the tap to hear', async () => {
    vi.useFakeTimers();
    speakWord.mockReturnValue(false);
    render(<AudioQuiz {...defaultProps} firstQuiz />);
    await act(async () => { vi.advanceTimersByTime(400); await Promise.resolve(); });
    expect(sendLearn).toHaveBeenCalledWith('onb', 'q1_audio_blocked');
    expect(screen.getByText('Tap to hear the word')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Tap to hear again'));
    expect(sendLearn).toHaveBeenCalledWith('onb', 'q1_hear_tap');
    vi.useRealTimers();
  });
  it('not a first quiz: no onb tallies', async () => {
    vi.useFakeTimers();
    speakWord.mockReturnValue(true);
    render(<AudioQuiz {...defaultProps} />);
    await act(async () => { vi.advanceTimersByTime(400); await Promise.resolve(); });
    expect(sendLearn).not.toHaveBeenCalledWith('onb', expect.anything());
    vi.useRealTimers();
  });

  it('first quiz: tallies how the tab arrived (q1_src_*), from the class land-beacon kept', () => {
    sessionStorage.setItem('cde_src', 'ai');
    render(<AudioQuiz {...defaultProps} firstQuiz />);
    expect(sendLearn).toHaveBeenCalledWith('onb', 'q1_src_ai');
    sessionStorage.clear();
  });
});
