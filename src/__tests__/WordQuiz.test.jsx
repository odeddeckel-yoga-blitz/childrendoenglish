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
    const images = screen.getAllByRole('img');
    expect(images.length).toBe(4);
  });

  it('renders images with alt text', () => {
    render(<WordQuiz {...defaultProps} />);
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img.getAttribute('alt')).toBeTruthy();
    });
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
