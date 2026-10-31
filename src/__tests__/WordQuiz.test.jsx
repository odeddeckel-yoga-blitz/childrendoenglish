import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WordQuiz from '../components/WordQuiz';

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

describe('WordQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quiz header with score', () => {
    render(<WordQuiz {...defaultProps} />);
    expect(screen.getByText('0/10')).toBeInTheDocument();
  });

  it('displays the current word text', () => {
    render(<WordQuiz {...defaultProps} />);
    const word = testWords[0].word;
    expect(screen.getByText(word)).toBeInTheDocument();
  });

  it('displays phonetic transcription', () => {
    render(<WordQuiz {...defaultProps} />);
    const phonetic = testWords[0].phonetic;
    expect(screen.getByText(phonetic)).toBeInTheDocument();
  });

  it('renders 4 image option buttons', () => {
    render(<WordQuiz {...defaultProps} />);
    // the photos are decorative (alt=\"\"); each answer button carries the word (CUX10)
    expect(document.querySelectorAll('button img').length).toBe(4);
  });

  it('names each picture answer button by its word', () => {
    render(<WordQuiz {...defaultProps} />);
    const buttons = [...document.querySelectorAll('button')].filter((b) => b.querySelector('img'));
    expect(buttons).toHaveLength(4);
    buttons.forEach((b) => expect(b.getAttribute('aria-label')).toBeTruthy());
  });

  it('shows skip button', () => {
    render(<WordQuiz {...defaultProps} />);
    expect(screen.getByText('Skip this word')).toBeInTheDocument();
  });

  it('has pronounce word button', () => {
    render(<WordQuiz {...defaultProps} />);
    expect(screen.getByLabelText('Pronounce word')).toBeInTheDocument();
  });
});
