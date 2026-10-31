import { render, screen, act, fireEvent } from '@testing-library/react';
import { speakWord } from '../utils/sound';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AudioQuiz from '../components/AudioQuiz';

vi.mock('../utils/sound', () => ({
  playSound: vi.fn(),
  speakWord: vi.fn(),
  isTTSAvailable: () => true,
  initTTS: vi.fn(),
}));

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
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(4);
  });

  it('renders images with alt text', () => {
    render(<AudioQuiz {...defaultProps} />);
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img.getAttribute('alt')).toBeTruthy();
    });
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
    expect(screen.getByText('👆 Tap to hear the word')).toBeInTheDocument();
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
});
